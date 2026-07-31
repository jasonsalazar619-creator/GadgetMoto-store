-- GadgetMoTo Coming Soon commercial drafts and atomic product promotion.
-- Existing deployed migrations remain immutable. This migration creates no
-- product, variant, inventory, order, payment, credential, or public write.

alter table public.products
  add column commerce_draft jsonb not null default '{}'::jsonb,
  add constraint products_commerce_draft_object check (
    jsonb_typeof(commerce_draft) = 'object'
  );

comment on column public.products.commerce_draft is
  'Administrator-only incomplete commercial input for a non-purchasable draft or Coming Soon product. It is cleared by successful promotion.';

create or replace function public.record_product_admin_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  changed_fields text[];
  summary jsonb;
begin
  if actor_id is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' or tg_op = 'DELETE' then
    changed_fields := array['record'];
  else
    changed_fields := array_remove(array[
      case when old.brand_id is distinct from new.brand_id then 'brandId' end,
      case when old.name is distinct from new.name then 'name' end,
      case when old.slug is distinct from new.slug then 'slug' end,
      case when old.category is distinct from new.category then 'category' end,
      case when old.short_description is distinct from new.short_description then 'shortDescription' end,
      case when old.full_description is distinct from new.full_description then 'fullDescription' end,
      case when old.highlights is distinct from new.highlights then 'highlights' end,
      case when old.specifications is distinct from new.specifications then 'specifications' end,
      case when old.commerce_draft is distinct from new.commerce_draft then 'commerceDraft' end,
      case when old.status is distinct from new.status then 'status' end,
      case when old.is_featured is distinct from new.is_featured then 'isFeatured' end,
      case when old.is_public_preview is distinct from new.is_public_preview then 'isPublicPreview' end,
      case when old.published_at is distinct from new.published_at then 'publishedAt' end,
      case when old.archived_at is distinct from new.archived_at then 'archivedAt' end,
      case when old.sort_order is distinct from new.sort_order then 'sortOrder' end
    ]::text[], null);
  end if;

  if cardinality(changed_fields) = 0 then
    return new;
  end if;

  summary := jsonb_build_object(
    'productId',
    case when tg_op = 'DELETE' then old.id else new.id end,
    'changedFields',
    to_jsonb(changed_fields)
  );

  insert into public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    before_data,
    after_data
  )
  values (
    actor_id,
    'product.' || lower(tg_op),
    'product',
    case when tg_op = 'DELETE' then old.id else new.id end,
    case when tg_op in ('UPDATE', 'DELETE') then summary else null end,
    case when tg_op in ('INSERT', 'UPDATE') then summary else null end
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

comment on function public.record_product_admin_audit() is
  'Trigger-only audit writer that records product IDs and changed field names, including commercial-draft changes, never catalog field values.';

create function public.promote_coming_soon_product(target_product_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  actor_id uuid := auth.uid();
  target_product public.products%rowtype;
  draft jsonb;
  canonical_sku text;
  target_variant_name text;
  target_ram_gb smallint;
  target_ram_not_applicable boolean;
  target_extended_ram_gb smallint;
  target_storage_gb integer;
  target_current_price_centavos bigint;
  target_srp_centavos bigint;
  target_badge public.product_badge;
  target_financing_available boolean;
  target_variant_id uuid;
begin
  if actor_id is null or not (select public.is_active_administrator()) then
    return 'FORBIDDEN';
  end if;

  select *
  into target_product
  from public.products
  where id = target_product_id
  for update;

  if not found then
    return 'NOT_FOUND';
  end if;

  if target_product.status <> 'draft'::public.product_status
    or target_product.is_public_preview is not true
    or target_product.archived_at is not null
  then
    return 'NOT_COMING_SOON';
  end if;

  draft := target_product.commerce_draft;
  canonical_sku := nullif(btrim(draft ->> 'sku'), '');
  target_variant_name := nullif(btrim(draft ->> 'variantName'), '');
  target_ram_not_applicable :=
    case
      when jsonb_typeof(draft -> 'ramNotApplicable') = 'boolean'
        then (draft ->> 'ramNotApplicable')::boolean
      else false
    end;
  target_financing_available :=
    case
      when jsonb_typeof(draft -> 'financingAvailable') = 'boolean'
        then (draft ->> 'financingAvailable')::boolean
      else false
    end;

  if jsonb_typeof(draft -> 'ramGb') = 'number'
    and (draft ->> 'ramGb')::numeric = trunc((draft ->> 'ramGb')::numeric)
    and (draft ->> 'ramGb')::numeric between 1 and 4096
  then
    target_ram_gb := (draft ->> 'ramGb')::smallint;
  end if;

  if jsonb_typeof(draft -> 'extendedRamGb') = 'number'
    and (draft ->> 'extendedRamGb')::numeric =
      trunc((draft ->> 'extendedRamGb')::numeric)
    and (draft ->> 'extendedRamGb')::numeric between 1 and 4096
  then
    target_extended_ram_gb := (draft ->> 'extendedRamGb')::smallint;
  end if;

  if jsonb_typeof(draft -> 'storageGb') = 'number'
    and (draft ->> 'storageGb')::numeric =
      trunc((draft ->> 'storageGb')::numeric)
    and (draft ->> 'storageGb')::numeric between 1 and 100000
  then
    target_storage_gb := (draft ->> 'storageGb')::integer;
  end if;

  if jsonb_typeof(draft -> 'currentPriceCentavos') = 'number'
    and (draft ->> 'currentPriceCentavos')::numeric =
      trunc((draft ->> 'currentPriceCentavos')::numeric)
    and (draft ->> 'currentPriceCentavos')::numeric > 0
    and (draft ->> 'currentPriceCentavos')::numeric <= 9007199254740991
  then
    target_current_price_centavos :=
      (draft ->> 'currentPriceCentavos')::bigint;
  end if;

  if draft -> 'srpCentavos' = 'null'::jsonb then
    target_srp_centavos := null;
  elsif jsonb_typeof(draft -> 'srpCentavos') = 'number'
    and (draft ->> 'srpCentavos')::numeric =
      trunc((draft ->> 'srpCentavos')::numeric)
    and (draft ->> 'srpCentavos')::numeric >= 0
    and (draft ->> 'srpCentavos')::numeric <= 9007199254740991
  then
    target_srp_centavos := (draft ->> 'srpCentavos')::bigint;
  else
    return 'NOT_READY';
  end if;

  if draft -> 'badge' = 'null'::jsonb then
    target_badge := null;
  elsif draft ->> 'badge' in ('new', 'sale') then
    target_badge := (draft ->> 'badge')::public.product_badge;
  else
    return 'NOT_READY';
  end if;

  if nullif(btrim(target_product.name), '') is null
    or target_product.slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or target_product.category is null
    or nullif(btrim(target_product.short_description), '') is null
    or nullif(btrim(target_product.full_description), '') is null
    or canonical_sku is null
    or canonical_sku !~ '^[A-Z0-9][A-Z0-9-]{2,79}$'
    or target_variant_name is null
    or target_storage_gb is null
    or target_current_price_centavos is null
    or (target_ram_gb is null and not target_ram_not_applicable)
    or (
      target_srp_centavos is not null
      and target_srp_centavos < target_current_price_centavos
    )
    or not exists (
      select 1
      from public.brands
      where id = target_product.brand_id
        and is_active is true
    )
    or not exists (
      select 1
      from public.product_images
      where product_id = target_product_id
        and media_type = 'image'::public.product_media_type
        and is_published is true
        and is_primary is true
    )
  then
    return 'NOT_READY';
  end if;

  if exists (
    select 1
    from public.products
    where id <> target_product_id
      and lower(slug) = lower(target_product.slug)
  ) then
    return 'DUPLICATE_SLUG';
  end if;

  if exists (
    select 1
    from public.product_variants
    where product_id <> target_product_id
      and lower(sku) = lower(canonical_sku)
  ) or exists (
    select 1
    from public.products
    where id <> target_product_id
      and lower(nullif(btrim(commerce_draft ->> 'sku'), '')) =
        lower(canonical_sku)
  ) then
    return 'DUPLICATE_SKU';
  end if;

  if (
    select count(*)
    from public.product_variants
    where product_id = target_product_id
  ) > 1 then
    return 'NOT_READY';
  end if;

  select id
  into target_variant_id
  from public.product_variants
  where product_id = target_product_id
  order by sort_order asc, id asc
  limit 1
  for update;

  if target_variant_id is null then
    insert into public.product_variants (
      product_id,
      sku,
      variant_name,
      ram_gb,
      extended_ram_gb,
      storage_gb,
      condition,
      current_price_centavos,
      srp_centavos,
      badge,
      financing_available,
      is_active,
      sort_order
    )
    values (
      target_product_id,
      canonical_sku,
      target_variant_name,
      target_ram_gb,
      target_extended_ram_gb,
      target_storage_gb,
      'brand_new'::public.product_condition,
      target_current_price_centavos,
      target_srp_centavos,
      target_badge,
      target_financing_available,
      true,
      0
    )
    returning id into target_variant_id;
  else
    update public.product_variants
    set
      sku = canonical_sku,
      variant_name = target_variant_name,
      ram_gb = target_ram_gb,
      extended_ram_gb = target_extended_ram_gb,
      storage_gb = target_storage_gb,
      condition = 'brand_new'::public.product_condition,
      current_price_centavos = target_current_price_centavos,
      srp_centavos = target_srp_centavos,
      badge = target_badge,
      financing_available = target_financing_available,
      is_active = true,
      sort_order = 0
    where id = target_variant_id;
  end if;

  update public.products
  set
    status = 'active'::public.product_status,
    is_public_preview = false,
    published_at = current_timestamp,
    archived_at = null,
    commerce_draft = '{}'::jsonb
  where id = target_product_id;

  insert into public.audit_logs (
    actor_user_id,
    action,
    entity_type,
    entity_id,
    after_data
  )
  values (
    actor_id,
    'product.promote',
    'product',
    target_product_id,
    jsonb_build_object(
      'productId', target_product_id,
      'variantId', target_variant_id,
      'changedFields', jsonb_build_array('status', 'isPublicPreview', 'publishedAt')
    )
  );

  return 'PUBLISHED';
end;
$$;

comment on function public.promote_coming_soon_product(uuid) is
  'Atomically validates and promotes one complete Coming Soon product for the authenticated active administrator.';

revoke execute on function public.promote_coming_soon_product(uuid)
  from public, anon;
grant execute on function public.promote_coming_soon_product(uuid)
  to authenticated;

create or replace view storefront.catalog_products
with (security_barrier = true)
as
select
  products.id as product_id,
  products.slug as product_slug,
  products.name as product_name,
  brands.name as brand_name,
  brands.slug as brand_slug,
  products.category as category,
  products.sort_order as product_sort_order,
  variants.id as variant_id,
  variants.sku as sku,
  variants.variant_name as variant_name,
  variants.ram_gb as ram_gb,
  variants.storage_gb as storage_gb,
  variants.condition as condition,
  variants.current_price_centavos as current_price_centavos,
  variants.srp_centavos as srp_centavos,
  variants.badge as badge,
  variants.financing_available as financing_available,
  products.short_description as short_description,
  products.full_description as full_description,
  primary_image.storage_path as primary_image_path,
  primary_image.alt_text as primary_image_alt,
  variants.extended_ram_gb as extended_ram_gb,
  products.specifications as specifications,
  coalesce(product_images.items, '[]'::jsonb) as images
from public.products as products
inner join public.brands as brands
  on products.brand_id = brands.id
inner join public.product_variants as variants
  on variants.product_id = products.id
left join lateral (
  select
    images.storage_path,
    images.alt_text
  from public.product_images as images
  where images.product_id = products.id
    and images.is_published is true
    and images.media_type = 'image'::public.product_media_type
  order by images.is_primary desc, images.sort_order asc, images.id asc
  limit 1
) as primary_image on true
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'storagePath', images.storage_path,
      'altText', images.alt_text,
      'sortOrder', images.sort_order,
      'isPrimary', images.is_primary
    )
    order by images.is_primary desc, images.sort_order asc, images.id asc
  ) as items
  from public.product_images as images
  where images.product_id = products.id
    and images.is_published is true
    and images.media_type = 'image'::public.product_media_type
) as product_images on true
where brands.is_active is true
  and products.status = 'active'::public.product_status
  and products.is_public_preview is false
  and products.archived_at is null
  and products.published_at is not null
  and products.published_at <= current_timestamp
  and variants.is_active is true;

comment on view storefront.catalog_products is
  'Reviewed server-only purchasable catalog projection with approved descriptions, specifications, and media; no write path or private draft fields.';
