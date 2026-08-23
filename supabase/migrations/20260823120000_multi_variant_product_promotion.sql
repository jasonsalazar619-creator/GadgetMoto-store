create or replace function public.promote_coming_soon_product(
  target_product_id uuid
)
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
  target_variant_count integer;
  active_variant_count integer;
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

  if nullif(btrim(target_product.name), '') is null
    or target_product.slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    or target_product.category is null
    or nullif(btrim(target_product.short_description), '') is null
    or nullif(btrim(target_product.full_description), '') is null
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

  perform 1
  from public.product_variants
  where product_id = target_product_id
  for update;

  select count(*)::integer
  into target_variant_count
  from public.product_variants
  where product_id = target_product_id;

  if target_variant_count = 0 then
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

    if canonical_sku is null
      or canonical_sku !~ '^[A-Z0-9][A-Z0-9-]{2,79}$'
      or target_variant_name is null
      or target_storage_gb is null
      or target_current_price_centavos is null
      or (target_ram_gb is null and not target_ram_not_applicable)
      or (
        target_srp_centavos is not null
        and target_srp_centavos < target_current_price_centavos
      )
    then
      return 'NOT_READY';
    end if;

    if exists (
      select 1
      from public.product_variants
      where lower(sku) = lower(canonical_sku)
    ) or exists (
      select 1
      from public.products
      where id <> target_product_id
        and lower(nullif(btrim(commerce_draft ->> 'sku'), '')) =
          lower(canonical_sku)
    ) then
      return 'DUPLICATE_SKU';
    end if;

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

    active_variant_count := 1;
  else
    select count(*)::integer
    into active_variant_count
    from public.product_variants
    where product_id = target_product_id
      and is_active is true;

    if active_variant_count = 0 or exists (
      select 1
      from public.product_variants
      where product_id = target_product_id
        and is_active is true
        and (
          sku !~ '^[A-Z0-9][A-Z0-9-]{2,79}$'
          or nullif(btrim(variant_name), '') is null
          or storage_gb <= 0
          or current_price_centavos <= 0
          or condition <> 'brand_new'::public.product_condition
          or (ram_gb is not null and ram_gb <= 0)
          or (srp_centavos is not null and srp_centavos < current_price_centavos)
        )
    ) then
      return 'NOT_READY';
    end if;

    if exists (
      select 1
      from public.products as draft_product
      where draft_product.id <> target_product_id
        and lower(nullif(btrim(draft_product.commerce_draft ->> 'sku'), '')) in (
          select lower(variant.sku)
          from public.product_variants as variant
          where variant.product_id = target_product_id
            and variant.is_active is true
        )
    ) then
      return 'DUPLICATE_SKU';
    end if;

    select id
    into target_variant_id
    from public.product_variants
    where product_id = target_product_id
      and is_active is true
    order by sort_order asc, id asc
    limit 1;
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
      'defaultVariantId', target_variant_id,
      'activeVariantCount', active_variant_count,
      'changedFields', jsonb_build_array(
        'status',
        'isPublicPreview',
        'publishedAt'
      )
    )
  );

  return 'PUBLISHED';
end;
$$;

comment on function public.promote_coming_soon_product(uuid) is
  'Atomically validates and promotes a complete Coming Soon product with one or more active configurations for the authenticated active administrator.';

revoke execute on function public.promote_coming_soon_product(uuid)
  from public, anon;
grant execute on function public.promote_coming_soon_product(uuid)
  to authenticated;
