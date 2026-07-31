-- GadgetMoTo secure admin product-management schema.
-- This migration is intentionally unexecuted at creation time.
-- It creates no staff user, login credential, environment value, order,
-- payment, inventory quantity, or public product-write path.

alter table public.products
  alter column category drop not null,
  add column full_description text,
  add column highlights jsonb not null default '[]'::jsonb,
  add column specifications jsonb not null default '[]'::jsonb,
  add column is_public_preview boolean not null default false,
  add column archived_at timestamptz,
  add constraint products_full_description_not_blank check (
    full_description is null or btrim(full_description) <> ''
  ),
  add constraint products_highlights_array check (
    jsonb_typeof(highlights) = 'array'
  ),
  add constraint products_specifications_array check (
    jsonb_typeof(specifications) = 'array'
  ),
  add constraint products_preview_requires_descriptions check (
    not is_public_preview
    or (
      status = 'draft'::public.product_status
      and short_description is not null
      and btrim(short_description) <> ''
      and full_description is not null
      and btrim(full_description) <> ''
    )
  ),
  add constraint products_active_not_preview check (
    status <> 'active'::public.product_status or not is_public_preview
  ),
  add constraint products_active_requires_category check (
    status <> 'active'::public.product_status or category is not null
  ),
  add constraint products_archive_timestamp_pair check (
    (status = 'archived'::public.product_status) = (archived_at is not null)
  );

comment on column public.products.full_description is
  'Reviewed long-form storefront copy. Null is valid for incomplete drafts.';
comment on column public.products.highlights is
  'Validated display-only string array; authoritative prices and inventory never belong here.';
comment on column public.products.specifications is
  'Validated display-only label/value objects; unverified fields must be omitted.';
comment on column public.products.is_public_preview is
  'True only for non-purchasable Coming Soon previews in draft lifecycle status.';
comment on column public.products.archived_at is
  'Required timestamp for archived products; archival preserves historical relationships.';
comment on column public.products.category is
  'Nullable only for unresolved drafts or previews. Active purchasable products require a category.';

alter table public.product_variants
  add column extended_ram_gb smallint,
  add constraint product_variants_extended_ram_positive check (
    extended_ram_gb is null or extended_ram_gb > 0
  );

comment on column public.product_variants.extended_ram_gb is
  'Optional manufacturer-supported extended or virtual RAM, separate from physical ram_gb.';

alter table public.product_images
  add column is_published boolean not null default false,
  add column updated_at timestamptz not null default now(),
  add constraint product_images_storage_path_key unique (storage_path);

comment on column public.product_images.is_published is
  'Only published image records may be served through the reviewed storefront media path.';
comment on column public.product_images.storage_path is
  'Supabase Storage object path for managed uploads, or a leading-slash repository path for migrated static media.';

create trigger product_images_set_updated_at
before update on public.product_images
for each row execute function public.set_updated_at();

create function public.is_active_administrator()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.staff_profiles
    where user_id = (select auth.uid())
      and is_active is true
      and role = 'administrator'::public.staff_role
  );
$$;

comment on function public.is_active_administrator() is
  'Returns true only for the current Supabase Auth user with an active administrator staff profile.';

revoke execute on function public.is_active_administrator()
  from public, anon;
grant execute on function public.is_active_administrator()
  to authenticated;

create function public.is_valid_product_image_storage_path(object_name text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select
    object_name ~
      '^products/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[a-z0-9][a-z0-9._-]*\.(jpg|jpeg|png|webp|avif)$'
    and exists (
      select 1
      from public.products
      where id::text = split_part(object_name, '/', 2)
    );
$$;

comment on function public.is_valid_product_image_storage_path(text) is
  'Accepts only normalized product-scoped image object paths with an approved extension.';

revoke execute on function public.is_valid_product_image_storage_path(text)
  from public, anon;
grant execute on function public.is_valid_product_image_storage_path(text)
  to authenticated;

create function public.is_storefront_product_image_object(object_name text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.product_images as images
    inner join public.products as products
      on products.id = images.product_id
    where images.storage_path = object_name
      and images.is_published is true
      and images.media_type = 'image'::public.product_media_type
      and products.archived_at is null
      and (
        products.status = 'active'::public.product_status
        or (
          products.status = 'draft'::public.product_status
          and products.is_public_preview is true
        )
      )
  );
$$;

comment on function public.is_storefront_product_image_object(text) is
  'Checks whether a managed Storage object is an approved image for a visible product without exposing catalog tables.';

revoke execute on function public.is_storefront_product_image_object(text)
  from public;
grant execute on function public.is_storefront_product_image_object(text)
  to anon, authenticated;

create function public.can_permanently_delete_product(target_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.products
    where id = target_product_id
      and status = 'draft'::public.product_status
      and is_public_preview is false
  )
  and not exists (
    select 1 from public.product_variants
    where product_id = target_product_id
  )
  and not exists (
    select 1 from public.order_items
    where product_id = target_product_id
  )
  and not exists (
    select 1 from public.homepage_section_products
    where product_id = target_product_id
  )
  and not exists (
    select 1 from public.product_images
    where product_id = target_product_id
  );
$$;

comment on function public.can_permanently_delete_product(uuid) is
  'Allows deletion only for a non-preview draft with no variant, order-item, or homepage dependency.';

revoke execute on function public.can_permanently_delete_product(uuid)
  from public, anon;
grant execute on function public.can_permanently_delete_product(uuid)
  to authenticated;

create function public.can_permanently_delete_variant(target_variant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.product_variants as variants
    inner join public.products as products
      on products.id = variants.product_id
    where variants.id = target_variant_id
      and products.status = 'draft'::public.product_status
      and products.is_public_preview is false
  )
  and not exists (
    select 1 from public.order_items
    where variant_id = target_variant_id
  )
  and not exists (
    select 1 from public.inventory_levels
    where variant_id = target_variant_id
  )
  and not exists (
    select 1 from public.inventory_movements
    where variant_id = target_variant_id
  )
  and not exists (
    select 1 from public.inventory_reservations
    where variant_id = target_variant_id
  )
  and not exists (
    select 1 from public.homepage_section_products
    where variant_id = target_variant_id
  )
  and not exists (
    select 1 from public.product_images
    where variant_id = target_variant_id
  );
$$;

comment on function public.can_permanently_delete_variant(uuid) is
  'Allows deletion only for an unused variant owned by a non-preview draft product.';

revoke execute on function public.can_permanently_delete_variant(uuid)
  from public, anon;
grant execute on function public.can_permanently_delete_variant(uuid)
  to authenticated;

create function public.validate_product_commerce_state()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare
  target_product_id uuid;
  target_product_ids uuid[];
  target_status public.product_status;
  target_preview boolean;
begin
  if tg_table_name = 'products' then
    target_product_ids := array[
      case when tg_op = 'DELETE' then old.id else new.id end
    ];
  elsif tg_op = 'INSERT' then
    target_product_ids := array[new.product_id];
  elsif tg_op = 'DELETE' then
    target_product_ids := array[old.product_id];
  else
    target_product_ids := array[old.product_id, new.product_id];
  end if;

  foreach target_product_id in array target_product_ids
  loop
    select status, is_public_preview
    into target_status, target_preview
    from public.products
    where id = target_product_id;

    if not found then
      continue;
    end if;

    if target_preview and exists (
      select 1
      from public.product_variants
      where product_id = target_product_id
        and is_active is true
    ) then
      raise exception using
        errcode = '23514',
        message = 'Public preview products cannot have active purchasable variants.';
    end if;

    if target_status = 'active'::public.product_status
      and not exists (
        select 1
        from public.product_variants
        where product_id = target_product_id
          and is_active is true
      )
    then
      raise exception using
        errcode = '23514',
        message = 'Active products require an active purchasable variant.';
    end if;
  end loop;

  return null;
end;
$$;

comment on function public.validate_product_commerce_state() is
  'Deferred invariant: public previews have no active variant and active products have at least one.';

revoke execute on function public.validate_product_commerce_state()
  from public, anon, authenticated;

create function public.record_product_admin_audit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
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
  'Trigger-only audit writer that records product IDs and changed field names, never catalog field values.';

revoke execute on function public.record_product_admin_audit()
  from public, anon, authenticated;

create function public.record_product_variant_admin_audit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  actor_id uuid := auth.uid();
  changed_fields text[];
  product_id uuid;
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
      case when old.product_id is distinct from new.product_id then 'productId' end,
      case when old.sku is distinct from new.sku then 'sku' end,
      case when old.variant_name is distinct from new.variant_name then 'variantName' end,
      case when old.ram_gb is distinct from new.ram_gb then 'physicalRamGb' end,
      case when old.extended_ram_gb is distinct from new.extended_ram_gb then 'extendedRamGb' end,
      case when old.storage_gb is distinct from new.storage_gb then 'storageGb' end,
      case when old.condition is distinct from new.condition then 'condition' end,
      case when old.current_price_centavos is distinct from new.current_price_centavos then 'currentPriceCentavos' end,
      case when old.srp_centavos is distinct from new.srp_centavos then 'srpCentavos' end,
      case when old.badge is distinct from new.badge then 'badge' end,
      case when old.financing_available is distinct from new.financing_available then 'financingAvailable' end,
      case when old.is_active is distinct from new.is_active then 'isActive' end,
      case when old.sort_order is distinct from new.sort_order then 'sortOrder' end
    ]::text[], null);
  end if;

  if cardinality(changed_fields) = 0 then
    return new;
  end if;

  product_id :=
    case when tg_op = 'DELETE' then old.product_id else new.product_id end;
  summary := jsonb_build_object(
    'productId', product_id,
    'changedFields', to_jsonb(changed_fields)
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
    'product_variant.' || lower(tg_op),
    'product_variant',
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

comment on function public.record_product_variant_admin_audit() is
  'Trigger-only audit writer that records the owning product, variant ID, and changed field names.';

revoke execute on function public.record_product_variant_admin_audit()
  from public, anon, authenticated;

create function public.record_product_image_admin_audit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  actor_id uuid := auth.uid();
  changed_fields text[];
  owner_product_id uuid;
  owner_variant_id uuid;
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
      case when old.product_id is distinct from new.product_id then 'productId' end,
      case when old.variant_id is distinct from new.variant_id then 'variantId' end,
      case when old.storage_path is distinct from new.storage_path then 'storagePath' end,
      case when old.alt_text is distinct from new.alt_text then 'altText' end,
      case when old.media_type is distinct from new.media_type then 'mediaType' end,
      case when old.sort_order is distinct from new.sort_order then 'sortOrder' end,
      case when old.is_primary is distinct from new.is_primary then 'isPrimary' end,
      case when old.is_published is distinct from new.is_published then 'isPublished' end
    ]::text[], null);
  end if;

  if cardinality(changed_fields) = 0 then
    return new;
  end if;

  owner_product_id :=
    case when tg_op = 'DELETE' then old.product_id else new.product_id end;
  owner_variant_id :=
    case when tg_op = 'DELETE' then old.variant_id else new.variant_id end;

  if owner_product_id is null and owner_variant_id is not null then
    select product_id
    into owner_product_id
    from public.product_variants
    where id = owner_variant_id;
  end if;

  summary := jsonb_build_object(
    'productId', owner_product_id,
    'variantId', owner_variant_id,
    'changedFields', to_jsonb(changed_fields)
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
    'product_image.' || lower(tg_op),
    'product_image',
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

comment on function public.record_product_image_admin_audit() is
  'Trigger-only audit writer that records image ownership and changed field names without paths or image data.';

revoke execute on function public.record_product_image_admin_audit()
  from public, anon, authenticated;

create constraint trigger products_validate_commerce_state
after insert or update on public.products
deferrable initially deferred
for each row execute function public.validate_product_commerce_state();

create constraint trigger product_variants_validate_commerce_state
after insert or update or delete on public.product_variants
deferrable initially deferred
for each row execute function public.validate_product_commerce_state();

create policy staff_profiles_self_select
  on public.staff_profiles
  for select
  to authenticated
  using (user_id = (select auth.uid()) and is_active is true);

create policy brands_administrator_select
  on public.brands
  for select
  to authenticated
  using ((select public.is_active_administrator()));

create policy brands_administrator_insert
  on public.brands
  for insert
  to authenticated
  with check ((select public.is_active_administrator()));

create policy brands_administrator_update
  on public.brands
  for update
  to authenticated
  using ((select public.is_active_administrator()))
  with check ((select public.is_active_administrator()));

create policy products_administrator_select
  on public.products
  for select
  to authenticated
  using ((select public.is_active_administrator()));

create policy products_administrator_insert
  on public.products
  for insert
  to authenticated
  with check ((select public.is_active_administrator()));

create policy products_administrator_update
  on public.products
  for update
  to authenticated
  using ((select public.is_active_administrator()))
  with check ((select public.is_active_administrator()));

create policy products_administrator_delete_unused_draft
  on public.products
  for delete
  to authenticated
  using (
    (select public.is_active_administrator())
    and (select public.can_permanently_delete_product(id))
  );

create policy product_variants_administrator_select
  on public.product_variants
  for select
  to authenticated
  using ((select public.is_active_administrator()));

create policy product_variants_administrator_insert
  on public.product_variants
  for insert
  to authenticated
  with check ((select public.is_active_administrator()));

create policy product_variants_administrator_update
  on public.product_variants
  for update
  to authenticated
  using ((select public.is_active_administrator()))
  with check ((select public.is_active_administrator()));

create policy product_variants_administrator_delete_unused_draft
  on public.product_variants
  for delete
  to authenticated
  using (
    (select public.is_active_administrator())
    and (select public.can_permanently_delete_variant(id))
  );

create policy product_images_administrator_select
  on public.product_images
  for select
  to authenticated
  using ((select public.is_active_administrator()));

create policy product_images_administrator_insert
  on public.product_images
  for insert
  to authenticated
  with check ((select public.is_active_administrator()));

create policy product_images_administrator_update
  on public.product_images
  for update
  to authenticated
  using ((select public.is_active_administrator()))
  with check ((select public.is_active_administrator()));

create policy product_images_administrator_delete
  on public.product_images
  for delete
  to authenticated
  using ((select public.is_active_administrator()));

create policy inventory_levels_administrator_select
  on public.inventory_levels
  for select
  to authenticated
  using ((select public.is_active_administrator()));

create policy audit_logs_administrator_select
  on public.audit_logs
  for select
  to authenticated
  using ((select public.is_active_administrator()));

create policy audit_logs_administrator_insert
  on public.audit_logs
  for insert
  to authenticated
  with check (
    (select public.is_active_administrator())
    and actor_user_id = (select auth.uid())
    and entity_type in (
      'brand',
      'product',
      'product_variant',
      'product_image'
    )
  );

grant select on table public.staff_profiles to authenticated;
grant select, insert, update, delete on table public.products to authenticated;
grant select, insert, update, delete on table public.product_variants to authenticated;
grant select, insert, update, delete on table public.product_images to authenticated;
grant select, insert, update on table public.brands to authenticated;
grant select on table public.inventory_levels to authenticated;
grant select, insert on table public.audit_logs to authenticated;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-images',
  'product-images',
  false,
  8388608,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy product_images_storefront_read
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'product-images'
    and (select public.is_storefront_product_image_object(name))
  );

create policy product_images_administrator_insert
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and (select public.is_active_administrator())
    and (select public.is_valid_product_image_storage_path(name))
  );

create policy product_images_administrator_update
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and (select public.is_active_administrator())
    and (select public.is_valid_product_image_storage_path(name))
  )
  with check (
    bucket_id = 'product-images'
    and (select public.is_active_administrator())
    and (select public.is_valid_product_image_storage_path(name))
  );

create policy product_images_administrator_delete
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and (select public.is_active_administrator())
    and (select public.is_valid_product_image_storage_path(name))
  );

do $$
declare
  expected_live_slugs text[] := array[
    'xiaomi-17-ultra-5g-leica-kit',
    'apple-iphone-17',
    'poco-f8-ultra',
    'redmi-note-15-pro-plus-5g',
    'redmi-turbo-5',
    'infinix-note-60-pro-5g',
    'tecno-camon-50',
    'poco-c85',
    'poco-pad-x1',
    'xiaomi-pad-8',
    'redmi-pad-2-pro-5g',
    'tecno-mega-pad-pro'
  ];
  expected_live_skus text[] := array[
    'GMT-XIA-PH-17ULTRA-16-512',
    'GMT-APL-PH-IP17-256',
    'GMT-POC-PH-F8ULTRA-16-512',
    'GMT-RED-PH-N15PP5G-12-512',
    'GMT-RED-PH-TURBO5-12-256',
    'GMT-INF-PH-N60P5G-16-256',
    'GMT-TEC-PH-CAMON50-16-256',
    'GMT-POC-PH-C85-8-256',
    'GMT-POC-TB-PADX1-8-512',
    'GMT-XIA-TB-PAD8-8-128',
    'GMT-RED-TB-PAD2PRO5G-8-256',
    'GMT-TEC-TB-MEGAPADPRO-8-256'
  ];
  upcoming jsonb := $upcoming$[{"slug":"honor-600","name":"HONOR 600","brand_name":"HONOR","brand_slug":"honor","category":"phone","short_description":"HONOR 600 is a phone preview centered on a high-refresh display, a versatile camera system, and extensive ingress protection, with exact Philippine availability still to be confirmed.","full_description":"HONOR 600 is presented as a phone for people balancing photography, entertainment, and everyday mobile use. Its preview focuses on a high-refresh display, a versatile camera system, and extensive ingress protection. HONOR lists a 2728 × 1264 display with refresh rates up to 120Hz, a 200MP main camera, and IP68, IP69, and IP69K ratings. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":["Up to 120Hz display","200MP main camera","50MP telephoto camera","IP68, IP69, and IP69K ratings"],"specifications":[{"label":"Display","value":"2728 × 1264, up to 120Hz"},{"label":"Rear cameras","value":"200MP main, 50MP telephoto, 12MP ultra-wide"},{"label":"Durability","value":"IP68, IP69, and IP69K"}],"sort_order":12,"images":[{"storage_path":"/upcoming/honor-600.png","alt_text":"HONOR 600 product preview","sort_order":0,"is_primary":true}]},{"slug":"honor-win-rt","name":"HONOR WIN RT","brand_name":"HONOR","brand_slug":"honor","category":"phone","short_description":"A phone preview for HONOR WIN RT, bringing together a streamlined handset concept whose exact regional configuration still needs confirmation while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with customers following HONOR announcements before choosing a future phone in mind, HONOR WIN RT is a coming-soon phone emphasizing a streamlined handset concept whose exact regional configuration still needs confirmation. Available official material does not provide a sufficiently exact match for the submitted identity, so this overview avoids unsupported component details. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":[],"specifications":[],"sort_order":13,"images":[{"storage_path":"/upcoming/honor-win-rt.png","alt_text":"HONOR WIN RT product preview","sort_order":0,"is_primary":true}]},{"slug":"honor-win","name":"HONOR WIN","brand_name":"HONOR","brand_slug":"honor","category":"phone","short_description":"HONOR WIN offers a closer look at a future-facing HONOR handset identity awaiting an exact official product match in a non-purchasable phone preview pending local confirmation.","full_description":"HONOR WIN joins the preview catalog as a phone aimed at shoppers who want to track emerging HONOR models without relying on unverified specifications. The current content highlights a future-facing HONOR handset identity awaiting an exact official product match. Because no exact official source with complete model details was located, no processor, memory, camera, battery, or connectivity specification is inferred. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":[],"specifications":[],"sort_order":14,"images":[{"storage_path":"/upcoming/honor-win.png","alt_text":"HONOR WIN product preview","sort_order":0,"is_primary":true}]},{"slug":"honor-x9d","name":"HONOR X9D","brand_name":"HONOR","brand_slug":"honor","category":"phone","short_description":"Explore HONOR X9d, a coming-soon phone shaped around long battery endurance, a bright high-refresh display, and reinforced environmental protection, without unconfirmed local variants or purchase claims.","full_description":"This early look at HONOR X9d introduces a phone suited to users who prioritize durability, battery capacity, and comfortable everyday viewing. Its identifiable direction is long battery endurance, a bright high-refresh display, and reinforced environmental protection. HONOR documents an 8300mAh battery, a 6.79-inch 1.5K AMOLED display at up to 120Hz, Snapdragon 6 Gen 4, and IP69K protection. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":["8300mAh battery","6.79-inch 1.5K AMOLED display","Up to 120Hz refresh rate","IP69K protection"],"specifications":[{"label":"Display","value":"6.79-inch 1.5K AMOLED, up to 120Hz"},{"label":"Processor","value":"Snapdragon 6 Gen 4"},{"label":"Rear camera","value":"108MP main camera"},{"label":"Battery","value":"8300mAh"},{"label":"Charging","value":"66W wired"},{"label":"Durability","value":"IP69K"}],"sort_order":15,"images":[{"storage_path":"/upcoming/honor-x9d.png","alt_text":"HONOR X9D product preview","sort_order":0,"is_primary":true}]},{"slug":"infinix-gt30-5g","name":"Infinix GT30 5G","brand_name":"Infinix","brand_slug":"infinix","category":"phone","short_description":"Infinix GT30 5G is a phone preview centered on gaming-oriented styling and 5G connectivity while its market-specific hardware remains under review, with exact Philippine availability still to be confirmed.","full_description":"Infinix GT30 5G is presented as a phone for mobile players tracking the next additions to Infinix’s GT line. Its preview focuses on gaming-oriented styling and 5G connectivity while its market-specific hardware remains under review. An exact official specification page could not be confirmed for this submitted model, so detailed hardware claims are intentionally omitted. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":[],"specifications":[],"sort_order":16,"images":[{"storage_path":"/upcoming/infinix-gt30-5g.png","alt_text":"Infinix GT30 5G product preview","sort_order":0,"is_primary":true}]},{"slug":"infinix-gt30-pro","name":"Infinix GT30 Pro","brand_name":"Infinix","brand_slug":"infinix","category":"phone","short_description":"A phone preview for Infinix GT30 Pro, bringing together a performance-led GT-series experience positioned around mobile play and responsive interaction while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with enthusiasts comparing gaming-focused Infinix phones before regional details are finalized in mind, Infinix GT30 Pro is a coming-soon phone emphasizing a performance-led GT-series experience positioned around mobile play and responsive interaction. Available official material does not provide a sufficiently exact match for the submitted identity, so this overview avoids unsupported component details. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":[],"specifications":[],"sort_order":17,"images":[{"storage_path":"/upcoming/infinix-gt30-pro.png","alt_text":"Infinix GT30 Pro product preview","sort_order":0,"is_primary":true}]},{"slug":"infinix-hot-70","name":"Infinix Hot 70","brand_name":"Infinix","brand_slug":"infinix","category":"phone","short_description":"Infinix Hot 70 offers a closer look at accessible everyday smartphone use within Infinix’s familiar Hot family in a non-purchasable phone preview pending local confirmation.","full_description":"Infinix Hot 70 joins the preview catalog as a phone aimed at buyers monitoring practical new handsets for communication, media, and routine apps. The current content highlights accessible everyday smartphone use within Infinix’s familiar Hot family. Because no exact official source with complete model details was located, no processor, memory, camera, battery, or connectivity specification is inferred. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":[],"specifications":[],"sort_order":18,"images":[{"storage_path":"/upcoming/infinix-hot-70.png","alt_text":"Infinix Hot 70 product preview","sort_order":0,"is_primary":true}]},{"slug":"infinix-note-edge-5g","name":"Infinix Note Edge 5G","brand_name":"Infinix","brand_slug":"infinix","category":"phone","short_description":"Explore Infinix Note Edge 5G, a coming-soon phone shaped around a Note-series form factor paired with 5G connectivity in the submitted product identity, without unconfirmed local variants or purchase claims.","full_description":"This early look at Infinix Note Edge 5G introduces a phone suited to users interested in larger-screen Infinix phones for connected daily tasks. Its identifiable direction is a Note-series form factor paired with 5G connectivity in the submitted product identity. The exact submitted model is not yet supported by a sufficiently detailed official source, so the specification area is deliberately withheld. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":[],"specifications":[],"sort_order":19,"images":[{"storage_path":"/upcoming/infinix-note-edge-5g.png","alt_text":"Infinix Note Edge 5G product preview","sort_order":0,"is_primary":true}]},{"slug":"infinix-note-60-ultra","name":"Infinix Note 60 Ultra","brand_name":"Infinix","brand_slug":"infinix","category":"phone","short_description":"Infinix Note 60 Ultra is a phone preview centered on an upper-tier Note-series concept awaiting confirmation of its exact manufacturer configuration, with exact Philippine availability still to be confirmed.","full_description":"Infinix Note 60 Ultra is presented as a phone for customers following Infinix’s premium-leaning Note releases and future regional availability. Its preview focuses on an upper-tier Note-series concept awaiting confirmation of its exact manufacturer configuration. An exact official specification page could not be confirmed for this submitted model, so detailed hardware claims are intentionally omitted. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":[],"specifications":[],"sort_order":20,"images":[{"storage_path":"/upcoming/infinix-note-60-ultra.png","alt_text":"Infinix Note 60 Ultra product preview","sort_order":0,"is_primary":true}]},{"slug":"infinix-smart-20","name":"Infinix Smart 20","brand_name":"Infinix","brand_slug":"infinix","category":"phone","short_description":"A phone preview for Infinix Smart 20, bringing together straightforward smartphone essentials under an identity that still requires official verification while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with first-time and value-conscious users watching for practical Infinix options in mind, Infinix Smart 20 is a coming-soon phone emphasizing straightforward smartphone essentials under an identity that still requires official verification. Available official material does not provide a sufficiently exact match for the submitted identity, so this overview avoids unsupported component details. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":[],"specifications":[],"sort_order":21,"images":[{"storage_path":"/upcoming/infinix-smart-20.png","alt_text":"Infinix Smart 20 product preview","sort_order":0,"is_primary":true}]},{"slug":"identity-to-be-confirmed","name":"Product identity to be confirmed","brand_name":"To be confirmed","brand_slug":"to-be-confirmed","category":null,"short_description":"Product identity to be confirmed offers a closer look at a deliberately neutral preview while the source image and exact model identity are reconciled in a non-purchasable device preview pending local confirmation.","full_description":"Product identity to be confirmed joins the preview catalog as a device aimed at visitors who need a transparent record of an unresolved catalog candidate. The current content highlights a deliberately neutral preview while the source image and exact model identity are reconciled. Because no exact official source with complete model details was located, no processor, memory, camera, battery, or connectivity specification is inferred. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":[],"specifications":[],"sort_order":22,"images":[]},{"slug":"apple-ipad-a16-11th-gen","name":"Apple iPad A16 11th Gen","brand_name":"Apple","brand_slug":"apple","category":"tablet","short_description":"Explore Apple iPad A16 11th Gen, a coming-soon tablet shaped around a spacious Liquid Retina display, A16 performance, and flexible connectivity for everyday tasks, without unconfirmed local variants or purchase claims.","full_description":"This early look at Apple iPad A16 11th Gen introduces a tablet suited to students, families, and mobile workers seeking a versatile general-purpose tablet. Its identifiable direction is a spacious Liquid Retina display, A16 performance, and flexible connectivity for everyday tasks. Apple specifies a 10.86-inch Liquid Retina display, the A16 chip, 12MP front and rear cameras, USB-C, Wi‑Fi 6, and optional 5G. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":["10.86-inch Liquid Retina display","A16 chip","12MP Center Stage front camera","USB-C connectivity","Optional 5G cellular model"],"specifications":[{"label":"Display","value":"10.86-inch Liquid Retina, 2360 × 1640"},{"label":"Processor","value":"Apple A16"},{"label":"Cameras","value":"12MP rear; 12MP Center Stage front"},{"label":"Storage","value":"128GB, 256GB, or 512GB"},{"label":"Connectivity","value":"Wi‑Fi 6, Bluetooth 5.3, USB-C; optional 5G"}],"sort_order":23,"images":[{"storage_path":"/upcoming/apple-ipad-a16-11th-gen.png","alt_text":"Apple iPad A16 11th Gen product preview","sort_order":0,"is_primary":true}]},{"slug":"apple-iphone-14","name":"Apple iPhone 14","brand_name":"Apple","brand_slug":"apple","category":"phone","short_description":"Apple iPhone 14 is a phone preview centered on a compact OLED display, familiar iOS experience, and dual-camera imaging, with exact Philippine availability still to be confirmed.","full_description":"Apple iPhone 14 is presented as a phone for Apple users seeking a balanced handset for communication, photography, and media. Its preview focuses on a compact OLED display, familiar iOS experience, and dual-camera imaging. Apple documents a 6.1-inch Super Retina XDR OLED display, A15 Bionic, a dual 12MP camera system, 5G, and IP68 resistance. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":["6.1-inch Super Retina XDR display","A15 Bionic chip","Dual 12MP rear cameras","5G connectivity","IP68 resistance"],"specifications":[{"label":"Display","value":"6.1-inch OLED, 2532 × 1170"},{"label":"Processor","value":"A15 Bionic"},{"label":"Rear cameras","value":"12MP main and 12MP ultra-wide"},{"label":"Connectivity","value":"5G and Wi‑Fi 6"},{"label":"Durability","value":"IP68"}],"sort_order":24,"images":[{"storage_path":"/upcoming/apple-iphone-14.png","alt_text":"Apple iPhone 14 product preview","sort_order":0,"is_primary":true}]},{"slug":"apple-iphone-15","name":"Apple iPhone 15","brand_name":"Apple","brand_slug":"apple","category":"phone","short_description":"A phone preview for Apple iPhone 15, bringing together a bright OLED display, 48MP main camera, and convenient USB-C connection while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with users wanting a modern iPhone for imaging, messaging, and daily applications in mind, Apple iPhone 15 is a coming-soon phone emphasizing a bright OLED display, 48MP main camera, and convenient USB-C connection. Apple lists a 6.1-inch Super Retina XDR OLED display, A16 Bionic, 48MP main and 12MP ultra-wide cameras, USB-C, 5G, and IP68 resistance. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":["6.1-inch Super Retina XDR display","A16 Bionic chip","48MP main camera","USB-C connector","IP68 resistance"],"specifications":[{"label":"Display","value":"6.1-inch OLED, 2556 × 1179"},{"label":"Processor","value":"A16 Bionic"},{"label":"Rear cameras","value":"48MP main and 12MP ultra-wide"},{"label":"Connectivity","value":"USB-C and 5G"},{"label":"Durability","value":"IP68"}],"sort_order":25,"images":[{"storage_path":"/upcoming/apple-iphone-15.png","alt_text":"Apple iPhone 15 product preview","sort_order":0,"is_primary":true}]},{"slug":"apple-iphone-16","name":"Apple iPhone 16","brand_name":"Apple","brand_slug":"apple","category":"phone","short_description":"Apple iPhone 16 offers a closer look at A18 performance, a versatile Fusion camera system, and current-generation wireless connectivity in a non-purchasable phone preview pending local confirmation.","full_description":"Apple iPhone 16 joins the preview catalog as a phone aimed at iPhone users seeking a compact flagship experience for creative and everyday work. The current content highlights A18 performance, a versatile Fusion camera system, and current-generation wireless connectivity. Apple specifies the A18 chip, a 48MP Fusion camera, 12MP ultra-wide camera, USB-C, Wi‑Fi 7, 5G, and IP68 resistance. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":["A18 chip","48MP Fusion camera","12MP ultra-wide camera","Wi‑Fi 7 and 5G","IP68 resistance"],"specifications":[{"label":"Display","value":"6.1-inch Super Retina XDR OLED"},{"label":"Processor","value":"A18"},{"label":"Rear cameras","value":"48MP Fusion and 12MP ultra-wide"},{"label":"Connectivity","value":"USB-C, 5G, and Wi‑Fi 7"},{"label":"Durability","value":"IP68"}],"sort_order":26,"images":[{"storage_path":"/upcoming/apple-iphone-16.png","alt_text":"Apple iPhone 16 product preview","sort_order":0,"is_primary":true}]},{"slug":"iqoo-15-ultra","name":"iQOO 15 Ultra","brand_name":"iQOO","brand_slug":"iqoo","category":"phone","short_description":"Explore iQOO 15 Ultra, a coming-soon phone shaped around a high-end performance identity listed by iQOO without enough regional detail for a complete specification set, without unconfirmed local variants or purchase claims.","full_description":"This early look at iQOO 15 Ultra introduces a phone suited to enthusiasts monitoring iQOO’s flagship lineup and gaming-led releases. Its identifiable direction is a high-end performance identity listed by iQOO without enough regional detail for a complete specification set. The exact submitted model is not yet supported by a sufficiently detailed official source, so the specification area is deliberately withheld. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":[],"specifications":[],"sort_order":27,"images":[{"storage_path":"/upcoming/iqoo-15-ultra.png","alt_text":"iQOO 15 Ultra product preview","sort_order":0,"is_primary":true}]},{"slug":"iqoo-15","name":"iQOO 15","brand_name":"iQOO","brand_slug":"iqoo","category":"phone","short_description":"iQOO 15 is a phone preview centered on flagship processing, a high-resolution 144Hz display, and a large battery, with exact Philippine availability still to be confirmed.","full_description":"iQOO 15 is presented as a phone for performance-focused users balancing mobile gaming, photography, and intensive daily apps. Its preview focuses on flagship processing, a high-resolution 144Hz display, and a large battery. iQOO lists Snapdragon 8 Elite Gen 5, a 6.85-inch 144Hz AMOLED display, a 7000mAh battery with 100W charging, and IP68/IP69 protection. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":["Snapdragon 8 Elite Gen 5","6.85-inch 144Hz AMOLED display","7000mAh battery","100W wired charging","IP68 and IP69 ratings"],"specifications":[{"label":"Display","value":"6.85-inch AMOLED, 3168 × 1440, up to 144Hz"},{"label":"Processor","value":"Snapdragon 8 Elite Gen 5"},{"label":"Rear cameras","value":"Triple 50MP system"},{"label":"Battery","value":"7000mAh"},{"label":"Charging","value":"100W wired"},{"label":"Operating system","value":"OriginOS 6 based on Android 16"}],"sort_order":28,"images":[{"storage_path":"/upcoming/iqoo-15.png","alt_text":"iQOO 15 product preview","sort_order":0,"is_primary":true}]},{"slug":"iqoo-z10-turbo-plus","name":"iQOO Z10 Turbo Plus","brand_name":"iQOO","brand_slug":"iqoo","category":"phone","short_description":"A phone preview for iQOO Z10 Turbo Plus, bringing together a performance-oriented Z-series identity officially listed in China but not fully documented for this preview while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with mobile gamers following iQOO’s Turbo-branded devices and future market releases in mind, iQOO Z10 Turbo Plus is a coming-soon phone emphasizing a performance-oriented Z-series identity officially listed in China but not fully documented for this preview. Available official material does not provide a sufficiently exact match for the submitted identity, so this overview avoids unsupported component details. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":[],"specifications":[],"sort_order":29,"images":[{"storage_path":"/upcoming/iqoo-z10-turbo-plus.png","alt_text":"iQOO Z10 Turbo Plus product preview","sort_order":0,"is_primary":true}]},{"slug":"iqoo-z10-turbo-pro","name":"iQOO Z10 Turbo Pro","brand_name":"iQOO","brand_slug":"iqoo","category":"phone","short_description":"iQOO Z10 Turbo Pro offers a closer look at a Turbo-series smartphone concept centered on responsive performance pending exact regional verification in a non-purchasable phone preview pending local confirmation.","full_description":"iQOO Z10 Turbo Pro joins the preview catalog as a phone aimed at users comparing performance-led iQOO models before confirmed local configurations emerge. The current content highlights a Turbo-series smartphone concept centered on responsive performance pending exact regional verification. Because no exact official source with complete model details was located, no processor, memory, camera, battery, or connectivity specification is inferred. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":[],"specifications":[],"sort_order":30,"images":[{"storage_path":"/upcoming/iqoo-z10-turbo-pro.png","alt_text":"iQOO Z10 Turbo Pro product preview","sort_order":0,"is_primary":true}]},{"slug":"iqoo-z11-turbo","name":"iQOO Z11 Turbo","brand_name":"iQOO","brand_slug":"iqoo","category":"phone","short_description":"Explore iQOO Z11 Turbo, a coming-soon phone shaped around a newer Z-series performance handset whose detailed specification record remains region-specific, without unconfirmed local variants or purchase claims.","full_description":"This early look at iQOO Z11 Turbo introduces a phone suited to enthusiasts tracking iQOO’s evolving Turbo line for gaming and demanding apps. Its identifiable direction is a newer Z-series performance handset whose detailed specification record remains region-specific. The exact submitted model is not yet supported by a sufficiently detailed official source, so the specification area is deliberately withheld. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":[],"specifications":[],"sort_order":31,"images":[{"storage_path":"/upcoming/iqoo-z11-turbo.png","alt_text":"iQOO Z11 Turbo product preview","sort_order":0,"is_primary":true}]},{"slug":"iqoo-z11","name":"iQOO Z11","brand_name":"iQOO","brand_slug":"iqoo","category":"phone","short_description":"iQOO Z11 is a phone preview centered on a current Z-series identity awaiting a complete official specification page for this market, with exact Philippine availability still to be confirmed.","full_description":"iQOO Z11 is presented as a phone for customers following iQOO phones for balanced performance and everyday connectivity. Its preview focuses on a current Z-series identity awaiting a complete official specification page for this market. An exact official specification page could not be confirmed for this submitted model, so detailed hardware claims are intentionally omitted. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":[],"specifications":[],"sort_order":32,"images":[{"storage_path":"/upcoming/iqoo-z11.png","alt_text":"iQOO Z11 product preview","sort_order":0,"is_primary":true}]},{"slug":"itel-power70","name":"itel Power70","brand_name":"itel","brand_slug":"itel","category":"phone","short_description":"A phone preview for itel Power70, bringing together a large battery, practical display, and straightforward Android hardware for daily essentials while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with value-focused users prioritizing communication, battery capacity, and uncomplicated operation in mind, itel Power70 is a coming-soon phone emphasizing a large battery, practical display, and straightforward Android hardware for daily essentials. itel specifies a 6.67-inch HD+ display, Helio G50 Ultimate, 6000mAh battery, 18W USB-C charging, and IP54 protection. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":["6000mAh battery","18W USB-C charging","6.67-inch HD+ display","IP54 protection"],"specifications":[{"label":"Display","value":"6.67-inch HD+"},{"label":"Processor","value":"Helio G50 Ultimate"},{"label":"Cameras","value":"13MP rear; 8MP front"},{"label":"Battery","value":"6000mAh"},{"label":"Charging","value":"18W USB-C"},{"label":"Durability","value":"IP54"}],"sort_order":33,"images":[{"storage_path":"/upcoming/itel-power70.png","alt_text":"itel Power70 product preview","sort_order":0,"is_primary":true}]},{"slug":"itel-s26-ultra","name":"itel S26 Ultra","brand_name":"itel","brand_slug":"itel","category":"phone","short_description":"itel S26 Ultra offers a closer look at a submitted S-series identity that does not yet match an exact official manufacturer listing in a non-purchasable phone preview pending local confirmation.","full_description":"itel S26 Ultra joins the preview catalog as a phone aimed at itel followers who prefer verified model details before evaluating a new handset. The current content highlights a submitted S-series identity that does not yet match an exact official manufacturer listing. Because no exact official source with complete model details was located, no processor, memory, camera, battery, or connectivity specification is inferred. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":[],"specifications":[],"sort_order":34,"images":[{"storage_path":"/upcoming/itel-s26-ultra.png","alt_text":"itel S26 Ultra product preview","sort_order":0,"is_primary":true}]},{"slug":"lenovo-legion-tab-y700-gen5","name":"Lenovo Legion Tab Y700 Gen5","brand_name":"Lenovo","brand_slug":"lenovo","category":"tablet","short_description":"Explore Lenovo Legion Tab Y700 Gen5, a coming-soon tablet shaped around a compact Legion gaming-tablet concept whose generation label still needs official confirmation, without unconfirmed local variants or purchase claims.","full_description":"This early look at Lenovo Legion Tab Y700 Gen5 introduces a tablet suited to players seeking a portable tablet format for games and media. Its identifiable direction is a compact Legion gaming-tablet concept whose generation label still needs official confirmation. The exact submitted model is not yet supported by a sufficiently detailed official source, so the specification area is deliberately withheld. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":[],"specifications":[],"sort_order":35,"images":[{"storage_path":"/upcoming/lenovo-legion-tab-y700-gen5.png","alt_text":"Lenovo Legion Tab Y700 Gen5 product preview","sort_order":0,"is_primary":true}]},{"slug":"lenovo-legion-y70-2026","name":"Lenovo Legion Y70 2026","brand_name":"Lenovo","brand_slug":"lenovo","category":null,"short_description":"Lenovo Legion Y70 2026 is a device preview centered on a Legion-branded identity represented by two supplied images but lacking a confirmed device category, with exact Philippine availability still to be confirmed.","full_description":"Lenovo Legion Y70 2026 is presented as a device for visitors tracking Lenovo gaming hardware while its exact model record is resolved. Its preview focuses on a Legion-branded identity represented by two supplied images but lacking a confirmed device category. An exact official specification page could not be confirmed for this submitted model, so detailed hardware claims are intentionally omitted. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":[],"specifications":[],"sort_order":36,"images":[{"storage_path":"/upcoming/lenovo-legion-y70-2026.png","alt_text":"Lenovo Legion Y70 2026 product preview","sort_order":0,"is_primary":true},{"storage_path":"/upcoming/lenovo-legion-y70-2026-gallery-01.png","alt_text":"Lenovo Legion Y70 2026 alternate product poster","sort_order":1,"is_primary":false}]},{"slug":"lenovo-legion-tab-y700","name":"Lenovo Legion Tab Y700","brand_name":"Lenovo","brand_slug":"lenovo","category":"tablet","short_description":"A tablet preview for Lenovo Legion Tab Y700, bringing together a compact gaming-tablet identity awaiting a reliable official page for the exact submitted model while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with users interested in portable Legion hardware for games, streaming, and touch interaction in mind, Lenovo Legion Tab Y700 is a coming-soon tablet emphasizing a compact gaming-tablet identity awaiting a reliable official page for the exact submitted model. Available official material does not provide a sufficiently exact match for the submitted identity, so this overview avoids unsupported component details. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":[],"specifications":[],"sort_order":37,"images":[{"storage_path":"/upcoming/lenovo-legion-tab-y700.png","alt_text":"Lenovo Legion Tab Y700 product preview","sort_order":0,"is_primary":true}]},{"slug":"oneplus-ace6t","name":"OnePlus Ace6T","brand_name":"OnePlus","brand_slug":"oneplus","category":"phone","short_description":"OnePlus Ace6T offers a closer look at a fast display, high-capacity battery, and rugged protection tuned for performance-led use in a non-purchasable phone preview pending local confirmation.","full_description":"OnePlus Ace6T joins the preview catalog as a phone aimed at gaming-oriented users who value responsive visuals, rapid charging, and durable construction. The current content highlights a fast display, high-capacity battery, and rugged protection tuned for performance-led use. OnePlus lists a 6.83-inch 1.5K display at up to 165Hz, an 8300mAh battery, 100W charging, and IP66, IP68, IP69, and IP69K ratings. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":["6.83-inch 1.5K display","Up to 165Hz refresh rate","8300mAh battery","100W wired charging","IP66, IP68, IP69, and IP69K"],"specifications":[{"label":"Display","value":"6.83-inch 1.5K, up to 165Hz"},{"label":"Memory technology","value":"LPDDR5X"},{"label":"Storage technology","value":"UFS 4.1"},{"label":"Rear cameras","value":"50MP main and 8MP secondary"},{"label":"Battery","value":"8300mAh"},{"label":"Charging","value":"100W wired"}],"sort_order":38,"images":[{"storage_path":"/upcoming/oneplus-ace6t.png","alt_text":"OnePlus Ace6T product preview","sort_order":0,"is_primary":true}]},{"slug":"oppo-a6t","name":"OPPO A6T","brand_name":"OPPO","brand_slug":"oppo","category":"phone","short_description":"Explore OPPO A6T, a coming-soon phone shaped around a 120Hz display and large battery in a practical 4G everyday handset, without unconfirmed local variants or purchase claims.","full_description":"This early look at OPPO A6T introduces a phone suited to users seeking smooth navigation, familiar Android functions, and dependable daily capacity. Its identifiable direction is a 120Hz display and large battery in a practical 4G everyday handset. OPPO specifies a 6.75-inch 120Hz LCD, Snapdragon 685, a 6500mAh battery, a 13MP rear camera, and ColorOS 15. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":["6.75-inch 120Hz display","Snapdragon 685","6500mAh battery","ColorOS 15"],"specifications":[{"label":"Display","value":"6.75-inch LCD, 1570 × 720, up to 120Hz"},{"label":"Processor","value":"Snapdragon 685"},{"label":"Cameras","value":"13MP + QVGA rear; 5MP front"},{"label":"Battery","value":"6500mAh"},{"label":"Network","value":"4G"},{"label":"Operating system","value":"ColorOS 15"}],"sort_order":39,"images":[{"storage_path":"/upcoming/oppo-a6t.png","alt_text":"OPPO A6T product preview","sort_order":0,"is_primary":true}]},{"slug":"poco-c71","name":"POCO C71","brand_name":"POCO","brand_slug":"poco","category":"phone","short_description":"POCO C71 is a phone preview centered on a large 120Hz display and straightforward Android Go configuration for essential tasks, with exact Philippine availability still to be confirmed.","full_description":"POCO C71 is presented as a phone for value-conscious users handling calls, messages, media, and lightweight applications. Its preview focuses on a large 120Hz display and straightforward Android Go configuration for essential tasks. POCO specifies a 6.88-inch 120Hz display, Unisoc T7250, a 32MP rear camera, a 5200mAh battery, and Android 15 Go Edition. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":["6.88-inch 120Hz display","32MP rear camera","5200mAh battery","Android 15 Go Edition"],"specifications":[{"label":"Display","value":"6.88-inch, 1640 × 720, up to 120Hz"},{"label":"Processor","value":"Unisoc T7250"},{"label":"Cameras","value":"32MP rear; 8MP front"},{"label":"Battery","value":"5200mAh"},{"label":"Charging","value":"15W wired"},{"label":"Operating system","value":"Android 15 Go Edition"}],"sort_order":40,"images":[{"storage_path":"/upcoming/poco-c71.png","alt_text":"POCO C71 product preview","sort_order":0,"is_primary":true}]},{"slug":"poco-c81-pro","name":"POCO C81 Pro","brand_name":"POCO","brand_slug":"poco","category":"phone","short_description":"A phone preview for POCO C81 Pro, bringing together a large battery, simple camera setup, and basic ingress protection for routine use while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with customers comparing accessible POCO phones for communication and everyday applications in mind, POCO C81 Pro is a coming-soon phone emphasizing a large battery, simple camera setup, and basic ingress protection for routine use. POCO’s official support information confirms a 6000mAh battery, 15W charging, a 13MP rear camera, fingerprint recognition, and IP52 protection. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":["6000mAh battery","15W wired charging","13MP rear camera","IP52 protection"],"specifications":[{"label":"Rear cameras","value":"13MP main and QVGA secondary"},{"label":"Battery","value":"6000mAh"},{"label":"Charging","value":"15W wired"},{"label":"Security","value":"Fingerprint recognition"},{"label":"Durability","value":"IP52"}],"sort_order":41,"images":[{"storage_path":"/upcoming/poco-c81-pro.png","alt_text":"POCO C81 Pro product preview","sort_order":0,"is_primary":true}]},{"slug":"poco-f6","name":"POCO F6","brand_name":"POCO","brand_slug":"poco","category":"phone","short_description":"POCO F6 offers a closer look at flagship-class processing, a fluid AMOLED display, and fast wired charging in a non-purchasable phone preview pending local confirmation.","full_description":"POCO F6 joins the preview catalog as a phone aimed at performance-minded users who switch between gaming, photography, streaming, and daily apps. The current content highlights flagship-class processing, a fluid AMOLED display, and fast wired charging. POCO lists Snapdragon 8s Gen 3, a 120Hz Flow AMOLED display, a 50MP camera with OIS, a 5000mAh battery, and 90W charging. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":["Snapdragon 8s Gen 3","120Hz Flow AMOLED display","50MP main camera with OIS","90W wired charging","Gorilla Glass Victus"],"specifications":[{"label":"Processor","value":"Snapdragon 8s Gen 3"},{"label":"Display","value":"Flow AMOLED, up to 120Hz"},{"label":"Rear camera","value":"50MP main with OIS"},{"label":"Front camera","value":"20MP"},{"label":"Battery","value":"5000mAh"},{"label":"Charging","value":"90W wired"}],"sort_order":42,"images":[{"storage_path":"/upcoming/poco-f6.png","alt_text":"POCO F6 product preview","sort_order":0,"is_primary":true}]},{"slug":"poco-f7","name":"POCO F7","brand_name":"POCO","brand_slug":"poco","category":"phone","short_description":"Explore POCO F7, a coming-soon phone shaped around high-end mobile performance, a broad 1.5K display, and strong battery capacity, without unconfirmed local variants or purchase claims.","full_description":"This early look at POCO F7 introduces a phone suited to enthusiasts seeking a responsive POCO handset for games, content, and multitasking. Its identifiable direction is high-end mobile performance, a broad 1.5K display, and strong battery capacity. POCO specifies Snapdragon 8s Gen 4, a 6.83-inch 1.5K 120Hz AMOLED display, a 6500mAh battery with 90W charging, and IP68. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":["Snapdragon 8s Gen 4","6.83-inch 1.5K 120Hz AMOLED","6500mAh battery","90W wired charging","IP68 resistance"],"specifications":[{"label":"Processor","value":"Snapdragon 8s Gen 4"},{"label":"Display","value":"6.83-inch 1.5K AMOLED, up to 120Hz"},{"label":"Rear camera","value":"50MP main with OIS"},{"label":"Battery","value":"6500mAh"},{"label":"Charging","value":"90W wired"},{"label":"Durability","value":"IP68"}],"sort_order":43,"images":[{"storage_path":"/upcoming/poco-f7.png","alt_text":"POCO F7 product preview","sort_order":0,"is_primary":true}]},{"slug":"poco-m8-5g","name":"POCO M8 5G","brand_name":"POCO","brand_slug":"poco","category":"phone","short_description":"POCO M8 5G is a phone preview centered on a 120Hz AMOLED display, 5G connection, and balanced midrange hardware, with exact Philippine availability still to be confirmed.","full_description":"POCO M8 5G is presented as a phone for everyday users wanting smooth visuals, current connectivity, and practical charging. Its preview focuses on a 120Hz AMOLED display, 5G connection, and balanced midrange hardware. POCO documents a 6.77-inch 120Hz AMOLED display, Snapdragon 6 Gen 3, a 50MP camera, a 5520mAh battery, and 45W charging. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":["6.77-inch 120Hz AMOLED display","Snapdragon 6 Gen 3","50MP rear camera","5520mAh battery","5G connectivity"],"specifications":[{"label":"Display","value":"6.77-inch AMOLED, up to 120Hz"},{"label":"Processor","value":"Snapdragon 6 Gen 3"},{"label":"Rear camera","value":"50MP main"},{"label":"Battery","value":"5520mAh"},{"label":"Charging","value":"45W wired"},{"label":"Network","value":"5G"}],"sort_order":44,"images":[{"storage_path":"/upcoming/poco-m8-5g.png","alt_text":"POCO M8 5G product preview","sort_order":0,"is_primary":true}]},{"slug":"poco-m8-pro-5g","name":"POCO M8 Pro 5G","brand_name":"POCO","brand_slug":"poco","category":"phone","short_description":"A phone preview for POCO M8 Pro 5G, bringing together a high-resolution AMOLED display, fast charging, and comprehensive water-resistance ratings while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with users seeking capable midrange performance for entertainment, imaging, and connected work in mind, POCO M8 Pro 5G is a coming-soon phone emphasizing a high-resolution AMOLED display, fast charging, and comprehensive water-resistance ratings. POCO lists Snapdragon 7s Gen 4, a 6.83-inch 1.5K 120Hz AMOLED display, a 6500mAh battery, 100W charging, and four IP ratings. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":["Snapdragon 7s Gen 4","6.83-inch 1.5K 120Hz AMOLED","50MP main camera with OIS","100W wired charging","IP66, IP68, IP69, and IP69K"],"specifications":[{"label":"Display","value":"6.83-inch 1.5K AMOLED, up to 120Hz"},{"label":"Processor","value":"Snapdragon 7s Gen 4"},{"label":"Rear cameras","value":"50MP main with OIS and 8MP secondary"},{"label":"Battery","value":"6500mAh"},{"label":"Charging","value":"100W wired"},{"label":"Network","value":"5G"}],"sort_order":45,"images":[{"storage_path":"/upcoming/poco-m8-pro-5g.png","alt_text":"POCO M8 Pro 5G product preview","sort_order":0,"is_primary":true}]},{"slug":"poco-m8s","name":"POCO M8s","brand_name":"POCO","brand_slug":"poco","category":"phone","short_description":"POCO M8s offers a closer look at a submitted M-series identity that differs from the official M8s 5G naming in a non-purchasable phone preview pending local confirmation.","full_description":"POCO M8s joins the preview catalog as a phone aimed at POCO customers who want the exact model designation confirmed before reviewing hardware details. The current content highlights a submitted M-series identity that differs from the official M8s 5G naming. Because no exact official source with complete model details was located, no processor, memory, camera, battery, or connectivity specification is inferred. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":[],"specifications":[],"sort_order":46,"images":[{"storage_path":"/upcoming/poco-m8s.png","alt_text":"POCO M8s product preview","sort_order":0,"is_primary":true}]},{"slug":"poco-pad-m1","name":"POCO Pad M1","brand_name":"POCO","brand_slug":"poco","category":"tablet","short_description":"Explore POCO Pad M1, a coming-soon tablet shaped around a large 2.5K display, expansive battery, and quad-speaker media experience, without unconfirmed local variants or purchase claims.","full_description":"This early look at POCO Pad M1 introduces a tablet suited to students, viewers, and mobile workers wanting a roomy Android tablet. Its identifiable direction is a large 2.5K display, expansive battery, and quad-speaker media experience. POCO specifies a 12.1-inch 2.5K 120Hz display, Snapdragon 7s Gen 4, a 12000mAh battery, quad speakers, and expandable storage. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":["12.1-inch 2.5K 120Hz display","Snapdragon 7s Gen 4","12000mAh battery","Quad speakers","Expandable storage up to 2TB"],"specifications":[{"label":"Display","value":"12.1-inch 2.5K, up to 120Hz"},{"label":"Processor","value":"Snapdragon 7s Gen 4"},{"label":"Battery","value":"12000mAh"},{"label":"Audio","value":"Quad speakers"},{"label":"Expandable storage","value":"Up to 2TB"}],"sort_order":47,"images":[{"storage_path":"/upcoming/poco-pad-m1.png","alt_text":"POCO Pad M1 product preview","sort_order":0,"is_primary":true}]},{"slug":"poco-x7-pro","name":"POCO X7 Pro","brand_name":"POCO","brand_slug":"poco","category":"phone","short_description":"POCO X7 Pro is a phone preview centered on upper-midrange processing, a 1.5K AMOLED display, and rapid wired charging, with exact Philippine availability still to be confirmed.","full_description":"POCO X7 Pro is presented as a phone for users pursuing fast games, fluid media, and stabilized everyday photography. Its preview focuses on upper-midrange processing, a 1.5K AMOLED display, and rapid wired charging. POCO lists Dimensity 8400-Ultra, a 6.67-inch 1.5K 120Hz AMOLED display, a 50MP camera with OIS, a 6000mAh battery, and 90W charging. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":["Dimensity 8400-Ultra","6.67-inch 1.5K 120Hz AMOLED","50MP main camera with OIS","6000mAh battery","90W wired charging"],"specifications":[{"label":"Processor","value":"Dimensity 8400-Ultra"},{"label":"Display","value":"6.67-inch 1.5K AMOLED, up to 120Hz"},{"label":"Rear cameras","value":"50MP main with OIS and 8MP secondary"},{"label":"Battery","value":"6000mAh"},{"label":"Charging","value":"90W wired"},{"label":"Network","value":"5G"}],"sort_order":48,"images":[{"storage_path":"/upcoming/poco-x7-pro.png","alt_text":"POCO X7 Pro product preview","sort_order":0,"is_primary":true}]},{"slug":"poco-x8-pro-max","name":"POCO X8 Pro Max","brand_name":"POCO","brand_slug":"poco","category":"phone","short_description":"A phone preview for POCO X8 Pro Max, bringing together flagship-tier processing, an exceptionally large battery, and a spacious 1.5K display while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with power users wanting extended capacity for games, streaming, and demanding applications in mind, POCO X8 Pro Max is a coming-soon phone emphasizing flagship-tier processing, an exceptionally large battery, and a spacious 1.5K display. POCO specifies Dimensity 9500s, a 6.83-inch 1.5K 120Hz AMOLED display, an 8500mAh battery with 100W charging, and IP68. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":["Dimensity 9500s","6.83-inch 1.5K 120Hz AMOLED","8500mAh battery","100W wired charging","IP68 resistance"],"specifications":[{"label":"Processor","value":"Dimensity 9500s"},{"label":"Display","value":"6.83-inch 1.5K AMOLED, up to 120Hz"},{"label":"Rear cameras","value":"50MP main with OIS and 8MP secondary"},{"label":"Battery","value":"8500mAh"},{"label":"Charging","value":"100W wired"},{"label":"Network","value":"5G"}],"sort_order":49,"images":[{"storage_path":"/upcoming/poco-x8-pro-max.png","alt_text":"POCO X8 Pro Max product preview","sort_order":0,"is_primary":true}]},{"slug":"poco-x8-pro","name":"POCO X8 Pro","brand_name":"POCO","brand_slug":"poco","category":"phone","short_description":"POCO X8 Pro offers a closer look at responsive performance, a compact 1.5K AMOLED display, and high-speed charging in a non-purchasable phone preview pending local confirmation.","full_description":"POCO X8 Pro joins the preview catalog as a phone aimed at mobile gamers and media users who want capable hardware in a manageable form. The current content highlights responsive performance, a compact 1.5K AMOLED display, and high-speed charging. POCO lists Dimensity 8500-Ultra, a 6.59-inch 1.5K 120Hz AMOLED display, a 6500mAh battery with 100W charging, and a 50MP OIS camera. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":["Dimensity 8500-Ultra","6.59-inch 1.5K 120Hz AMOLED","50MP main camera with OIS","6500mAh battery","100W wired charging"],"specifications":[{"label":"Processor","value":"Dimensity 8500-Ultra"},{"label":"Display","value":"6.59-inch 1.5K AMOLED, up to 120Hz"},{"label":"Rear camera","value":"50MP main with OIS"},{"label":"Battery","value":"6500mAh"},{"label":"Charging","value":"100W wired"},{"label":"Network","value":"5G"}],"sort_order":50,"images":[{"storage_path":"/upcoming/poco-x8-pro.png","alt_text":"POCO X8 Pro product preview","sort_order":0,"is_primary":true}]},{"slug":"redmi-15-5g","name":"Redmi 15 5G","brand_name":"Redmi","brand_slug":"redmi","category":"phone","short_description":"Explore Redmi 15 5G, a coming-soon phone shaped around a very large 144Hz display, 5G access, and a high-capacity battery, without unconfirmed local variants or purchase claims.","full_description":"This early look at Redmi 15 5G introduces a phone suited to everyday users who favor expansive viewing and fewer charging interruptions. Its identifiable direction is a very large 144Hz display, 5G access, and a high-capacity battery. Redmi specifies Snapdragon 6s Gen 3, a 6.9-inch FHD+ 144Hz display, a 7000mAh battery with 33W charging, a 50MP camera, and IP64. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":["6.9-inch FHD+ 144Hz display","7000mAh battery","50MP rear camera","5G connectivity","IP64 protection"],"specifications":[{"label":"Processor","value":"Snapdragon 6s Gen 3"},{"label":"Display","value":"6.9-inch FHD+, up to 144Hz"},{"label":"Rear camera","value":"50MP main"},{"label":"Battery","value":"7000mAh"},{"label":"Charging","value":"33W wired"},{"label":"Durability","value":"IP64"}],"sort_order":51,"images":[{"storage_path":"/upcoming/redmi-15-5g.png","alt_text":"Redmi 15 5G product preview","sort_order":0,"is_primary":true}]},{"slug":"redmi-15c-5g","name":"Redmi 15C 5G","brand_name":"Redmi","brand_slug":"redmi","category":"phone","short_description":"Redmi 15C 5G is a phone preview centered on accessible 5G connectivity with regional specifications still requiring reconciliation, with exact Philippine availability still to be confirmed.","full_description":"Redmi 15C 5G is presented as a phone for value-focused users monitoring Redmi’s connected everyday phone range. Its preview focuses on accessible 5G connectivity with regional specifications still requiring reconciliation. An exact official specification page could not be confirmed for this submitted model, so detailed hardware claims are intentionally omitted. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":[],"specifications":[],"sort_order":52,"images":[{"storage_path":"/upcoming/redmi-15c-5g.png","alt_text":"Redmi 15C 5G product preview","sort_order":0,"is_primary":true}]},{"slug":"redmi-a5","name":"Redmi A5","brand_name":"Redmi","brand_slug":"redmi","category":"phone","short_description":"A phone preview for Redmi A5, bringing together essential smartphone hardware, a large battery, and convenient side fingerprint access while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with first-time smartphone owners and practical users focused on basic daily tasks in mind, Redmi A5 is a coming-soon phone emphasizing essential smartphone hardware, a large battery, and convenient side fingerprint access. Redmi’s official specifications identify the Unisoc T7250 processor, a 5200mAh battery, 15W charging, and side-mounted fingerprint recognition. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":["Unisoc T7250 processor","5200mAh battery","15W wired charging","Side fingerprint sensor"],"specifications":[{"label":"Processor","value":"Unisoc T7250"},{"label":"Battery","value":"5200mAh"},{"label":"Charging","value":"15W wired"},{"label":"Security","value":"Side-mounted fingerprint sensor"}],"sort_order":53,"images":[{"storage_path":"/upcoming/redmi-a5.png","alt_text":"Redmi A5 product preview","sort_order":0,"is_primary":true}]},{"slug":"redmi-a7-pro","name":"Redmi A7 Pro","brand_name":"Redmi","brand_slug":"redmi","category":"phone","short_description":"Redmi A7 Pro offers a closer look at a large 120Hz screen and substantial battery for practical daily Android use in a non-purchasable phone preview pending local confirmation.","full_description":"Redmi A7 Pro joins the preview catalog as a phone aimed at budget-aware customers who value readable content, simple cameras, and steady capacity. The current content highlights a large 120Hz screen and substantial battery for practical daily Android use. Redmi specifies a 6.9-inch 120Hz display, Unisoc T7250, a 6000mAh battery, 15W charging, and HyperOS 3. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":["6.9-inch 120Hz display","Unisoc T7250 processor","6000mAh battery","HyperOS 3"],"specifications":[{"label":"Display","value":"6.9-inch, up to 120Hz"},{"label":"Processor","value":"Unisoc T7250"},{"label":"Cameras","value":"13MP rear; 8MP front"},{"label":"Battery","value":"6000mAh"},{"label":"Charging","value":"15W wired"},{"label":"Network","value":"4G"}],"sort_order":54,"images":[{"storage_path":"/upcoming/redmi-a7-pro.png","alt_text":"Redmi A7 Pro product preview","sort_order":0,"is_primary":true}]},{"slug":"redmi-k90-max","name":"Redmi K90 Max","brand_name":"Redmi","brand_slug":"redmi","category":"phone","short_description":"Explore Redmi K90 Max, a coming-soon phone shaped around a performance-oriented K-series identity listed officially in China without complete regional details, without unconfirmed local variants or purchase claims.","full_description":"This early look at Redmi K90 Max introduces a phone suited to enthusiasts tracking Redmi’s upper-tier hardware and future market availability. Its identifiable direction is a performance-oriented K-series identity listed officially in China without complete regional details. The exact submitted model is not yet supported by a sufficiently detailed official source, so the specification area is deliberately withheld. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":[],"specifications":[],"sort_order":55,"images":[{"storage_path":"/upcoming/redmi-k90-max.png","alt_text":"Redmi K90 Max product preview","sort_order":0,"is_primary":true}]},{"slug":"redmi-k90-pro-max","name":"Redmi K90 Pro Max","brand_name":"Redmi","brand_slug":"redmi","category":"phone","short_description":"Redmi K90 Pro Max is a phone preview centered on a premium K-series model whose Chinese listing does not establish a Philippine configuration, with exact Philippine availability still to be confirmed.","full_description":"Redmi K90 Pro Max is presented as a phone for power users comparing upcoming Redmi flagships while regional specifications remain pending. Its preview focuses on a premium K-series model whose Chinese listing does not establish a Philippine configuration. An exact official specification page could not be confirmed for this submitted model, so detailed hardware claims are intentionally omitted. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":[],"specifications":[],"sort_order":56,"images":[{"storage_path":"/upcoming/redmi-k90-pro-max.png","alt_text":"Redmi K90 Pro Max product preview","sort_order":0,"is_primary":true}]},{"slug":"redmi-k90","name":"Redmi K90","brand_name":"Redmi","brand_slug":"redmi","category":"phone","short_description":"A phone preview for Redmi K90, bringing together a current K-series performance handset awaiting a complete verified specification set for this preview while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with customers following Redmi’s performance range for gaming and demanding mobile tasks in mind, Redmi K90 is a coming-soon phone emphasizing a current K-series performance handset awaiting a complete verified specification set for this preview. Available official material does not provide a sufficiently exact match for the submitted identity, so this overview avoids unsupported component details. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":[],"specifications":[],"sort_order":57,"images":[{"storage_path":"/upcoming/redmi-k90.png","alt_text":"Redmi K90 product preview","sort_order":0,"is_primary":true}]},{"slug":"redmi-note-15","name":"Redmi Note 15","brand_name":"Redmi","brand_slug":"redmi","category":"phone","short_description":"Redmi Note 15 offers a closer look at a 108MP camera, AMOLED viewing, and a large battery for versatile everyday use in a non-purchasable phone preview pending local confirmation.","full_description":"Redmi Note 15 joins the preview catalog as a phone aimed at users balancing photography, entertainment, communication, and practical performance. The current content highlights a 108MP camera, AMOLED viewing, and a large battery for versatile everyday use. Redmi lists a 6.77-inch FHD+ AMOLED display, Helio G100-Ultra, a 108MP camera, a 6000mAh battery with 33W charging, and IP64. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":["6.77-inch FHD+ AMOLED display","108MP main camera","6000mAh battery","33W wired charging","IP64 protection"],"specifications":[{"label":"Display","value":"6.77-inch FHD+ AMOLED"},{"label":"Processor","value":"Helio G100-Ultra"},{"label":"Rear camera","value":"108MP main"},{"label":"Battery","value":"6000mAh"},{"label":"Charging","value":"33W wired"},{"label":"Durability","value":"IP64"}],"sort_order":58,"images":[{"storage_path":"/upcoming/redmi-note-15.png","alt_text":"Redmi Note 15 product preview","sort_order":0,"is_primary":true}]},{"slug":"redmi-note-15-pro-5g","name":"Redmi Note 15 Pro 5G","brand_name":"Redmi","brand_slug":"redmi","category":"phone","short_description":"Explore Redmi Note 15 Pro 5G, a coming-soon phone shaped around a 200MP stabilized camera, 1.5K AMOLED display, and extensive ingress protection, without unconfirmed local variants or purchase claims.","full_description":"This early look at Redmi Note 15 Pro 5G introduces a phone suited to mobile photographers and media users wanting capable 5G midrange hardware. Its identifiable direction is a 200MP stabilized camera, 1.5K AMOLED display, and extensive ingress protection. Redmi specifies Dimensity 7400-Ultra, a 6.83-inch 1.5K 120Hz AMOLED display, a 200MP OIS camera, a 6580mAh battery, and four IP ratings. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":["Dimensity 7400-Ultra","6.83-inch 1.5K 120Hz AMOLED","200MP main camera with OIS","6580mAh battery","IP66, IP68, IP69, and IP69K"],"specifications":[{"label":"Display","value":"6.83-inch 1.5K AMOLED, up to 120Hz"},{"label":"Processor","value":"Dimensity 7400-Ultra"},{"label":"Rear cameras","value":"200MP main with OIS and 8MP secondary"},{"label":"Battery","value":"6580mAh"},{"label":"Charging","value":"45W wired"},{"label":"Network","value":"5G"}],"sort_order":59,"images":[{"storage_path":"/upcoming/redmi-note-15-pro-5g.png","alt_text":"Redmi Note 15 Pro 5G product preview","sort_order":0,"is_primary":true}]},{"slug":"redmi-pad-2-4g","name":"Redmi Pad 2 4G","brand_name":"Redmi","brand_slug":"redmi","category":"tablet","short_description":"Redmi Pad 2 4G is a tablet preview centered on an 11-inch high-resolution display, mobile connectivity, and expandable storage, with exact Philippine availability still to be confirmed.","full_description":"Redmi Pad 2 4G is presented as a tablet for learners and media viewers who need a connected tablet beyond Wi‑Fi coverage. Its preview focuses on an 11-inch high-resolution display, mobile connectivity, and expandable storage. Redmi specifies an 11-inch 2.5K 90Hz display, Helio G100-Ultra, a 9000mAh battery, dual-SIM 4G, and storage expansion up to 2TB. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":["11-inch 2.5K 90Hz display","Dual-SIM 4G","9000mAh battery","Expandable storage up to 2TB"],"specifications":[{"label":"Display","value":"11-inch, 2560 × 1600, up to 90Hz"},{"label":"Processor","value":"Helio G100-Ultra"},{"label":"Battery","value":"9000mAh"},{"label":"Charging","value":"18W wired"},{"label":"Network","value":"Dual-SIM 4G"},{"label":"Expandable storage","value":"Up to 2TB"}],"sort_order":60,"images":[{"storage_path":"/upcoming/redmi-pad-2-4g.png","alt_text":"Redmi Pad 2 4G product preview","sort_order":0,"is_primary":true}]},{"slug":"redmi-pad-2-se","name":"Redmi Pad 2 SE","brand_name":"Redmi","brand_slug":"redmi","category":"tablet","short_description":"A tablet preview for Redmi Pad 2 SE, bringing together an accessible tablet identity officially listed in China but not fully specified for this catalog while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with families and students monitoring practical Redmi tablets for entertainment and study in mind, Redmi Pad 2 SE is a coming-soon tablet emphasizing an accessible tablet identity officially listed in China but not fully specified for this catalog. Available official material does not provide a sufficiently exact match for the submitted identity, so this overview avoids unsupported component details. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":[],"specifications":[],"sort_order":61,"images":[{"storage_path":"/upcoming/redmi-pad-2-se.png","alt_text":"Redmi Pad 2 SE product preview","sort_order":0,"is_primary":true}]},{"slug":"redmi-turbo-4-pro","name":"Redmi Turbo 4 Pro","brand_name":"Redmi","brand_slug":"redmi","category":"phone","short_description":"Redmi Turbo 4 Pro offers a closer look at a performance-branded Redmi handset represented by two images while regional facts remain incomplete in a non-purchasable phone preview pending local confirmation.","full_description":"Redmi Turbo 4 Pro joins the preview catalog as a phone aimed at mobile gamers comparing Turbo-series models before an exact local release is established. The current content highlights a performance-branded Redmi handset represented by two images while regional facts remain incomplete. Because no exact official source with complete model details was located, no processor, memory, camera, battery, or connectivity specification is inferred. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":[],"specifications":[],"sort_order":62,"images":[{"storage_path":"/upcoming/redmi-turbo-4-pro.png","alt_text":"Redmi Turbo 4 Pro product preview","sort_order":0,"is_primary":true},{"storage_path":"/upcoming/redmi-turbo-4-pro-gallery-01.png","alt_text":"Redmi Turbo 4 Pro alternate product poster","sort_order":1,"is_primary":false}]},{"slug":"redmi-turbo-4","name":"Redmi Turbo 4","brand_name":"Redmi","brand_slug":"redmi","category":"phone","short_description":"Explore Redmi Turbo 4, a coming-soon phone shaped around a Turbo-series performance identity awaiting an exact official specification record for this market, without unconfirmed local variants or purchase claims.","full_description":"This early look at Redmi Turbo 4 introduces a phone suited to enthusiasts who value responsive hardware but require verified regional details. Its identifiable direction is a Turbo-series performance identity awaiting an exact official specification record for this market. The exact submitted model is not yet supported by a sufficiently detailed official source, so the specification area is deliberately withheld. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":[],"specifications":[],"sort_order":63,"images":[{"storage_path":"/upcoming/redmi-turbo-4.png","alt_text":"Redmi Turbo 4 product preview","sort_order":0,"is_primary":true}]},{"slug":"redmi-turbo-5-max","name":"Redmi Turbo 5 Max","brand_name":"Redmi","brand_slug":"redmi","category":"phone","short_description":"Redmi Turbo 5 Max is a phone preview centered on an upper-tier Turbo identity listed by Redmi in China without confirmed local specifications, with exact Philippine availability still to be confirmed.","full_description":"Redmi Turbo 5 Max is presented as a phone for performance-focused users tracking high-capacity Redmi phones and future releases. Its preview focuses on an upper-tier Turbo identity listed by Redmi in China without confirmed local specifications. An exact official specification page could not be confirmed for this submitted model, so detailed hardware claims are intentionally omitted. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":[],"specifications":[],"sort_order":64,"images":[{"storage_path":"/upcoming/redmi-turbo-5-max.png","alt_text":"Redmi Turbo 5 Max product preview","sort_order":0,"is_primary":true}]},{"slug":"samsung-galaxy-a07-lte","name":"Samsung Galaxy A07 LTE","brand_name":"Samsung","brand_slug":"samsung","category":"phone","short_description":"A phone preview for Samsung Galaxy A07 LTE, bringing together a smooth 90Hz display, practical 50MP camera, and long software-support commitment while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with everyday Android users seeking familiar Samsung software and straightforward LTE hardware in mind, Samsung Galaxy A07 LTE is a coming-soon phone emphasizing a smooth 90Hz display, practical 50MP camera, and long software-support commitment. Samsung Philippines lists a 6.7-inch 90Hz display, Helio G99, a 50MP camera, IP54 protection, and six operating-system upgrades. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":["6.7-inch 90Hz display","Helio G99 processor","50MP main camera","IP54 protection","Six OS upgrades"],"specifications":[{"label":"Display","value":"6.7-inch, up to 90Hz"},{"label":"Processor","value":"Helio G99"},{"label":"Rear camera","value":"50MP main"},{"label":"Network","value":"LTE"},{"label":"Operating system","value":"One UI 7"},{"label":"Durability","value":"IP54"}],"sort_order":65,"images":[{"storage_path":"/upcoming/samsung-galaxy-a07-lte.png","alt_text":"Samsung Galaxy A07 LTE product preview","sort_order":0,"is_primary":true}]},{"slug":"tecno-camon-50-ultra","name":"TECNO Camon 50 Ultra","brand_name":"TECNO","brand_slug":"tecno","category":"phone","short_description":"TECNO Camon 50 Ultra offers a closer look at a camera-oriented Camon identity whose submitted name differs from TECNO’s official 5G listing in a non-purchasable phone preview pending local confirmation.","full_description":"TECNO Camon 50 Ultra joins the preview catalog as a phone aimed at mobile imaging fans waiting for exact model and regional confirmation. The current content highlights a camera-oriented Camon identity whose submitted name differs from TECNO’s official 5G listing. Because no exact official source with complete model details was located, no processor, memory, camera, battery, or connectivity specification is inferred. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":[],"specifications":[],"sort_order":66,"images":[{"storage_path":"/upcoming/tecno-camon-50-ultra.png","alt_text":"TECNO Camon 50 Ultra product preview","sort_order":0,"is_primary":true}]},{"slug":"tecno-pova-curve-2","name":"TECNO Pova Curve 2","brand_name":"TECNO","brand_slug":"tecno","category":"phone","short_description":"Explore TECNO Pova Curve 2, a coming-soon phone shaped around a curved Pova-series identity that omits the 5G suffix used on TECNO’s official page, without unconfirmed local variants or purchase claims.","full_description":"This early look at TECNO Pova Curve 2 introduces a phone suited to design-conscious performance users seeking an exact match before comparing hardware. Its identifiable direction is a curved Pova-series identity that omits the 5G suffix used on TECNO’s official page. The exact submitted model is not yet supported by a sufficiently detailed official source, so the specification area is deliberately withheld. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":[],"specifications":[],"sort_order":67,"images":[{"storage_path":"/upcoming/tecno-pova-curve-2.png","alt_text":"TECNO Pova Curve 2 product preview","sort_order":0,"is_primary":true}]},{"slug":"tecno-pova-curve","name":"TECNO Pova Curve","brand_name":"TECNO","brand_slug":"tecno","category":"phone","short_description":"TECNO Pova Curve is a phone preview centered on a slim curved-display Pova identity whose official counterpart carries a different 5G model name, with exact Philippine availability still to be confirmed.","full_description":"TECNO Pova Curve is presented as a phone for users interested in distinctive TECNO performance phones pending identity reconciliation. Its preview focuses on a slim curved-display Pova identity whose official counterpart carries a different 5G model name. An exact official specification page could not be confirmed for this submitted model, so detailed hardware claims are intentionally omitted. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":[],"specifications":[],"sort_order":68,"images":[{"storage_path":"/upcoming/tecno-pova-curve.png","alt_text":"TECNO Pova Curve product preview","sort_order":0,"is_primary":true}]},{"slug":"tecno-pova-7","name":"TECNO Pova 7","brand_name":"TECNO","brand_slug":"tecno","category":"phone","short_description":"A phone preview for TECNO Pova 7, bringing together a high-refresh display, very large battery, and gaming-oriented everyday performance while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with mobile players and heavy media users who prioritize screen fluidity and capacity in mind, TECNO Pova 7 is a coming-soon phone emphasizing a high-refresh display, very large battery, and gaming-oriented everyday performance. TECNO specifies Helio G100 Ultimate, a 6.78-inch FHD+ 120Hz display, a 7000mAh battery with 45W charging, and dual speakers. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":["6.78-inch FHD+ 120Hz display","Helio G100 Ultimate","7000mAh battery","45W wired charging","Dual speakers"],"specifications":[{"label":"Display","value":"6.78-inch FHD+, up to 120Hz"},{"label":"Processor","value":"Helio G100 Ultimate"},{"label":"Cameras","value":"108MP + 2MP rear; 8MP front"},{"label":"Battery","value":"7000mAh"},{"label":"Charging","value":"45W wired"},{"label":"Operating system","value":"Android 15"}],"sort_order":69,"images":[{"storage_path":"/upcoming/tecno-pova-7.png","alt_text":"TECNO Pova 7 product preview","sort_order":0,"is_primary":true}]},{"slug":"tecno-spark-50","name":"TECNO Spark 50","brand_name":"TECNO","brand_slug":"tecno","category":"phone","short_description":"TECNO Spark 50 offers a closer look at a 120Hz screen, high-capacity battery, and protected construction for everyday use in a non-purchasable phone preview pending local confirmation.","full_description":"TECNO Spark 50 joins the preview catalog as a phone aimed at practical users seeking smooth navigation, straightforward imaging, and extended capacity. The current content highlights a 120Hz screen, high-capacity battery, and protected construction for everyday use. TECNO’s official regional page lists a 6.78-inch 120Hz display, a 7000mAh battery with 18W charging, a 50MP camera, and IP64. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":["6.78-inch 120Hz display","7000mAh battery","50MP rear camera","IP64 protection"],"specifications":[{"label":"Display","value":"6.78-inch, up to 120Hz"},{"label":"Rear camera","value":"50MP main"},{"label":"Battery","value":"7000mAh"},{"label":"Charging","value":"18W wired"},{"label":"Durability","value":"IP64"}],"sort_order":70,"images":[{"storage_path":"/upcoming/tecno-spark-50.png","alt_text":"TECNO Spark 50 product preview","sort_order":0,"is_primary":true}]},{"slug":"tecno-spark-go-3","name":"TECNO Spark Go 3","brand_name":"TECNO","brand_slug":"tecno","category":"phone","short_description":"Explore TECNO Spark Go 3, a coming-soon phone shaped around an entry Spark-series handset officially listed regionally without enough detail for this preview, without unconfirmed local variants or purchase claims.","full_description":"This early look at TECNO Spark Go 3 introduces a phone suited to value-conscious users following simple TECNO phones for communication and basic apps. Its identifiable direction is an entry Spark-series handset officially listed regionally without enough detail for this preview. The exact submitted model is not yet supported by a sufficiently detailed official source, so the specification area is deliberately withheld. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":[],"specifications":[],"sort_order":71,"images":[{"storage_path":"/upcoming/tecno-spark-go-3.png","alt_text":"TECNO Spark Go 3 product preview","sort_order":0,"is_primary":true}]},{"slug":"tecno-spark-slim","name":"TECNO Spark Slim","brand_name":"TECNO","brand_slug":"tecno","category":"phone","short_description":"TECNO Spark Slim is a phone preview centered on an exceptionally slim body, high-refresh AMOLED display, and balanced battery capacity, with exact Philippine availability still to be confirmed.","full_description":"TECNO Spark Slim is presented as a phone for style-focused users who want lightweight-feeling hardware without abandoning screen fluidity. Its preview focuses on an exceptionally slim body, high-refresh AMOLED display, and balanced battery capacity. TECNO lists a 5.93mm body, a 6.78-inch 1.5K 144Hz AMOLED display, Helio G200, a 5160mAh battery with 45W charging, and IP64. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":["5.93mm body","6.78-inch 1.5K 144Hz AMOLED","Helio G200","45W wired charging","IP64 protection"],"specifications":[{"label":"Thickness","value":"5.93mm"},{"label":"Display","value":"6.78-inch 1.5K AMOLED, up to 144Hz"},{"label":"Processor","value":"Helio G200"},{"label":"Rear camera","value":"50MP main"},{"label":"Battery","value":"5160mAh"},{"label":"Charging","value":"45W wired"}],"sort_order":72,"images":[{"storage_path":"/upcoming/tecno-spark-slim.png","alt_text":"TECNO Spark Slim product preview","sort_order":0,"is_primary":true}]},{"slug":"vivo-y05","name":"vivo Y05","brand_name":"vivo","brand_slug":"vivo","category":"phone","short_description":"A phone preview for vivo Y05, bringing together a large 120Hz display, substantial battery, and IP65 protection for everyday essentials while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with practical users who prioritize readable content, battery capacity, and basic durability in mind, vivo Y05 is a coming-soon phone emphasizing a large 120Hz display, substantial battery, and IP65 protection for everyday essentials. vivo Philippines lists a 6.74-inch HD+ 120Hz LCD, a 6500mAh battery, 8MP rear and 5MP front cameras, and IP65 protection. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":["6.74-inch 120Hz display","6500mAh battery","IP65 protection","8MP rear camera"],"specifications":[{"label":"Display","value":"6.74-inch HD+ LCD, up to 120Hz"},{"label":"Cameras","value":"8MP rear; 5MP front"},{"label":"Battery","value":"6500mAh"},{"label":"Durability","value":"IP65"}],"sort_order":73,"images":[{"storage_path":"/upcoming/vivo-y05.png","alt_text":"vivo Y05 product preview","sort_order":0,"is_primary":true}]},{"slug":"vivo-y11d","name":"vivo Y11D","brand_name":"vivo","brand_slug":"vivo","category":"phone","short_description":"vivo Y11D offers a closer look at a high-capacity battery, fast wired charging, and protected everyday construction in a non-purchasable phone preview pending local confirmation.","full_description":"vivo Y11D joins the preview catalog as a phone aimed at users who need practical mobile capacity for communication, media, and daily routines. The current content highlights a high-capacity battery, fast wired charging, and protected everyday construction. vivo Philippines documents a 6500mAh battery, 44W charging, a 120Hz display, and IP65 protection. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":["6500mAh battery","44W wired charging","120Hz display","IP65 protection"],"specifications":[{"label":"Display","value":"Up to 120Hz"},{"label":"Battery","value":"6500mAh"},{"label":"Charging","value":"44W wired"},{"label":"Durability","value":"IP65"}],"sort_order":74,"images":[{"storage_path":"/upcoming/vivo-y11d.png","alt_text":"vivo Y11D product preview","sort_order":0,"is_primary":true}]},{"slug":"xiaomi-17-pro-max","name":"Xiaomi 17 Pro Max","brand_name":"Xiaomi","brand_slug":"xiaomi","category":"phone","short_description":"Explore Xiaomi 17 Pro Max, a coming-soon phone shaped around a premium Xiaomi identity officially listed in China without a complete global specification set, without unconfirmed local variants or purchase claims.","full_description":"This early look at Xiaomi 17 Pro Max introduces a phone suited to flagship shoppers tracking Xiaomi’s largest Pro-series model and future regional plans. Its identifiable direction is a premium Xiaomi identity officially listed in China without a complete global specification set. The exact submitted model is not yet supported by a sufficiently detailed official source, so the specification area is deliberately withheld. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":[],"specifications":[],"sort_order":75,"images":[{"storage_path":"/upcoming/xiaomi-17-pro-max.png","alt_text":"Xiaomi 17 Pro Max product preview","sort_order":0,"is_primary":true}]},{"slug":"xiaomi-17-pro","name":"Xiaomi 17 Pro","brand_name":"Xiaomi","brand_slug":"xiaomi","category":"phone","short_description":"Xiaomi 17 Pro is a phone preview centered on a premium compact flagship identity whose available official listing remains China-specific, with exact Philippine availability still to be confirmed.","full_description":"Xiaomi 17 Pro is presented as a phone for enthusiasts monitoring Xiaomi’s Pro hardware before international details are confirmed. Its preview focuses on a premium compact flagship identity whose available official listing remains China-specific. An exact official specification page could not be confirmed for this submitted model, so detailed hardware claims are intentionally omitted. GadgetMoTo keeps this record separate from the purchasable catalog while the exact Philippine model, configuration, and release details are reviewed. The assigned media is preserved for identification, but it does not establish technical specifications.","highlights":[],"specifications":[],"sort_order":76,"images":[{"storage_path":"/upcoming/xiaomi-17-pro.png","alt_text":"Xiaomi 17 Pro product preview","sort_order":0,"is_primary":true}]},{"slug":"xiaomi-17t","name":"Xiaomi 17T","brand_name":"Xiaomi","brand_slug":"xiaomi","category":"phone","short_description":"A phone preview for Xiaomi 17T, bringing together a Leica camera system, 1.5K AMOLED display, and efficient high-end mobile performance while GadgetMoTo verifies its final Philippine catalog details.","full_description":"Designed with photography and media users seeking a fast, durable Xiaomi handset in mind, Xiaomi 17T is a coming-soon phone emphasizing a Leica camera system, 1.5K AMOLED display, and efficient high-end mobile performance. Xiaomi specifies Dimensity 8500-Ultra, a 6.59-inch 1.5K 120Hz AMOLED display, Leica triple cameras, a 6500mAh battery with 67W charging, and IP68. This page is an informational preview rather than a sale listing. GadgetMoTo will only move the product into the transactional catalog after its Philippine identity, configuration, and supporting records are confirmed.","highlights":["Dimensity 8500-Ultra","6.59-inch 1.5K 120Hz AMOLED","Leica triple-camera system","67W wired charging","IP68 resistance"],"specifications":[{"label":"Processor","value":"Dimensity 8500-Ultra"},{"label":"Display","value":"6.59-inch 1.5K AMOLED, up to 120Hz"},{"label":"Rear cameras","value":"50MP + 50MP + 12MP Leica system"},{"label":"Battery","value":"6500mAh"},{"label":"Charging","value":"67W wired"},{"label":"Durability","value":"IP68"}],"sort_order":77,"images":[{"storage_path":"/upcoming/xiaomi-17t.png","alt_text":"Xiaomi 17T product preview","sort_order":0,"is_primary":true}]},{"slug":"xiaomi-17","name":"Xiaomi 17","brand_name":"Xiaomi","brand_slug":"xiaomi","category":"phone","short_description":"Xiaomi 17 offers a closer look at compact flagship dimensions, Leica triple cameras, and flexible wired and wireless charging in a non-purchasable phone preview pending local confirmation.","full_description":"Xiaomi 17 joins the preview catalog as a phone aimed at power users wanting premium imaging and performance in a smaller handset. The current content highlights compact flagship dimensions, Leica triple cameras, and flexible wired and wireless charging. Xiaomi lists Snapdragon 8 Elite Gen 5, a 6.3-inch display, three 50MP Leica rear cameras, a 6330mAh battery, 100W wired charging, and 50W wireless charging. It remains isolated from search, comparison, cart, checkout, inventory, and ordering. GadgetMoTo will review the local configuration before publishing any transactional information.","highlights":["Snapdragon 8 Elite Gen 5","Compact 6.3-inch display","Triple 50MP Leica cameras","100W wired charging","50W wireless charging"],"specifications":[{"label":"Processor","value":"Snapdragon 8 Elite Gen 5"},{"label":"Display","value":"6.3-inch"},{"label":"Rear cameras","value":"Triple 50MP Leica system with OIS"},{"label":"Battery","value":"6330mAh"},{"label":"Charging","value":"100W wired; 50W wireless"}],"sort_order":78,"images":[{"storage_path":"/upcoming/xiaomi-17.png","alt_text":"Xiaomi 17 product preview","sort_order":0,"is_primary":true}]},{"slug":"xiaomi-17t-pro","name":"Xiaomi 17T Pro","brand_name":"Xiaomi","brand_slug":"xiaomi","category":"phone","short_description":"Explore Xiaomi 17T Pro, a coming-soon phone shaped around flagship processing, a 144Hz AMOLED display, and a versatile Leica camera system, without unconfirmed local variants or purchase claims.","full_description":"This early look at Xiaomi 17T Pro introduces a phone suited to demanding users moving between gaming, photography, video, and productive mobile work. Its identifiable direction is flagship processing, a 144Hz AMOLED display, and a versatile Leica camera system. Xiaomi specifies Dimensity 9500, a 6.83-inch 1.5K 144Hz AMOLED display, Leica triple cameras, a 7000mAh battery, wired and wireless charging, and IP68. The preview communicates only reviewed information and preserves the supplied imagery without treating poster text as product data. Confirmed Philippine details will be evaluated separately before any future catalog activation.","highlights":["Dimensity 9500","6.83-inch 1.5K 144Hz AMOLED","Leica triple-camera system","100W wired and 50W wireless charging","IP68 resistance"],"specifications":[{"label":"Processor","value":"Dimensity 9500"},{"label":"Display","value":"6.83-inch 1.5K AMOLED, up to 144Hz"},{"label":"Rear cameras","value":"50MP + 50MP + 12MP Leica system"},{"label":"Battery","value":"7000mAh"},{"label":"Charging","value":"100W wired; 50W wireless"},{"label":"Network","value":"5G"}],"sort_order":79,"images":[{"storage_path":"/upcoming/xiaomi-17t-pro.png","alt_text":"Xiaomi 17T Pro product preview","sort_order":0,"is_primary":true}]}]$upcoming$::jsonb;
  live_images jsonb := $liveimages$[{"slug":"xiaomi-17-ultra-5g-leica-kit","storage_path":"/products/xiaomi-17-ultra-5g-leica-kit/original.png","alt_text":"Xiaomi 17 Ultra 5G Leica Kit"},{"slug":"apple-iphone-17","storage_path":"/products/apple-iphone-17/original.png","alt_text":"Apple iPhone 17"},{"slug":"poco-f8-ultra","storage_path":"/products/poco-f8-ultra/original.png","alt_text":"POCO F8 Ultra"},{"slug":"redmi-note-15-pro-plus-5g","storage_path":"/products/redmi-note-15-pro-plus-5g/original.png","alt_text":"Redmi Note 15 Pro Plus 5G"},{"slug":"redmi-turbo-5","storage_path":"/products/redmi-turbo-5/original.png","alt_text":"Redmi Turbo 5"},{"slug":"infinix-note-60-pro-5g","storage_path":"/products/infinix-note-60-pro-5g/original.png","alt_text":"Infinix Note 60 Pro 5G"},{"slug":"tecno-camon-50","storage_path":"/products/tecno-camon-50/original.png","alt_text":"TECNO Camon 50"},{"slug":"poco-pad-x1","storage_path":"/products/poco-pad-x1/original.png","alt_text":"POCO Pad X1"},{"slug":"xiaomi-pad-8","storage_path":"/products/xiaomi-pad-8/original.png","alt_text":"Xiaomi Pad 8"},{"slug":"redmi-pad-2-pro-5g","storage_path":"/products/redmi-pad-2-pro-5g/original.png","alt_text":"Redmi Pad 2 Pro 5G"},{"slug":"tecno-mega-pad-pro","storage_path":"/products/tecno-mega-pad-pro/original.png","alt_text":"TECNO Mega Pad Pro"}]$liveimages$::jsonb;
  affected_count integer;
begin
  if (select count(*) from public.products) <> 12 then
    raise exception
      'Admin migration expected exactly 12 products before backfill.';
  end if;

  if (select count(*) from public.product_variants) <> 12 then
    raise exception
      'Admin migration expected exactly 12 variants before backfill.';
  end if;

  if (select count(*) from public.product_images) <> 0 then
    raise exception
      'Admin migration expected no product-image rows before backfill.';
  end if;

  if (
    select count(*)
    from public.products
    where status = 'active'::public.product_status
  ) <> 12 then
    raise exception
      'Admin migration expected exactly 12 active products before backfill.';
  end if;

  if (
    select count(*)
    from public.products
    where status = 'active'::public.product_status
      and slug = any(expected_live_slugs)
  ) <> 12 then
    raise exception
      'Admin migration expected the exact 12 active canonical product slugs.';
  end if;

  if (
    select count(*)
    from public.product_variants
    where sku = any(expected_live_skus)
  ) <> 12 then
    raise exception
      'Admin migration expected the exact 12 canonical SKUs.';
  end if;

  if jsonb_array_length(upcoming) <> 68 then
    raise exception
      'Coming Soon backfill expected exactly 68 source records.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(upcoming) as source(slug text)
    group by lower(source.slug)
    having count(*) <> 1
  ) then
    raise exception
      'Coming Soon backfill contains duplicate slugs.';
  end if;

  if exists (
    select 1
    from public.products
    inner join jsonb_to_recordset(upcoming) as source(slug text)
      on lower(public.products.slug) = lower(source.slug)
  ) then
    raise exception
      'Coming Soon backfill collided with an existing product slug.';
  end if;

  insert into public.brands (
    name,
    slug,
    description,
    is_active,
    sort_order
  )
  select distinct on (source.brand_slug)
    source.brand_name,
    source.brand_slug,
    null,
    true,
    (6 + dense_rank() over (order by source.brand_slug) - 1)::integer
  from jsonb_to_recordset(upcoming) as source(
    brand_name text,
    brand_slug text
  )
  order by source.brand_slug, source.brand_name
  on conflict (slug) do nothing;

  insert into public.products (
    brand_id,
    name,
    slug,
    category,
    short_description,
    full_description,
    highlights,
    specifications,
    status,
    is_featured,
    is_public_preview,
    published_at,
    archived_at,
    sort_order
  )
  select
    brands.id,
    source.name,
    source.slug,
    case
      when source.category is null then null
      else source.category::public.product_category
    end,
    source.short_description,
    source.full_description,
    source.highlights,
    source.specifications,
    'draft'::public.product_status,
    false,
    true,
    null,
    null,
    source.sort_order
  from jsonb_to_recordset(upcoming) as source(
    slug text,
    name text,
    brand_name text,
    brand_slug text,
    category text,
    short_description text,
    full_description text,
    highlights jsonb,
    specifications jsonb,
    sort_order integer,
    images jsonb
  )
  inner join public.brands
    on public.brands.slug = source.brand_slug;

  get diagnostics affected_count = row_count;

  if affected_count <> 68 then
    raise exception
      'Coming Soon product backfill expected exactly 68 inserts.';
  end if;

  insert into public.product_images (
    product_id,
    storage_path,
    alt_text,
    media_type,
    sort_order,
    is_primary,
    is_published
  )
  select
    products.id,
    image.storage_path,
    image.alt_text,
    'image'::public.product_media_type,
    image.sort_order,
    image.is_primary,
    true
  from jsonb_to_recordset(upcoming) as source(
    slug text,
    images jsonb
  )
  inner join public.products
    on public.products.slug = source.slug
  cross join lateral jsonb_to_recordset(source.images) as image(
    storage_path text,
    alt_text text,
    sort_order integer,
    is_primary boolean
  );

  get diagnostics affected_count = row_count;

  if affected_count <> 69 then
    raise exception
      'Coming Soon image backfill expected exactly 69 inserts.';
  end if;

  insert into public.product_images (
    product_id,
    storage_path,
    alt_text,
    media_type,
    sort_order,
    is_primary,
    is_published
  )
  select
    products.id,
    source.storage_path,
    source.alt_text,
    'image'::public.product_media_type,
    0,
    true,
    true
  from jsonb_to_recordset(live_images) as source(
    slug text,
    storage_path text,
    alt_text text
  )
  inner join public.products
    on public.products.slug = source.slug;

  get diagnostics affected_count = row_count;

  if affected_count <> 11 then
    raise exception
      'Live product image backfill expected exactly 11 inserts.';
  end if;

  update public.product_variants
  set extended_ram_gb = 8
  where sku in (
    'GMT-INF-PH-N60P5G-16-256',
    'GMT-TEC-PH-CAMON50-16-256'
  );

  get diagnostics affected_count = row_count;

  if affected_count <> 2 then
    raise exception
      'Extended-RAM backfill expected exactly two canonical variants.';
  end if;

  if (
    select count(*)
    from public.products
    where is_public_preview is true
      and status = 'draft'::public.product_status
  ) <> 68 then
    raise exception
      'Coming Soon backfill final product count must be 68.';
  end if;

  if exists (
    select 1
    from public.products
    inner join public.product_variants
      on public.product_variants.product_id = public.products.id
      and public.product_variants.is_active is true
    where public.products.is_public_preview is true
  ) then
    raise exception
      'Coming Soon products must remain non-purchasable.';
  end if;
end;
$$;

create trigger products_record_admin_audit
after insert or update or delete on public.products
for each row execute function public.record_product_admin_audit();

create trigger product_variants_record_admin_audit
after insert or update or delete on public.product_variants
for each row execute function public.record_product_variant_admin_audit();

create trigger product_images_record_admin_audit
after insert or update or delete on public.product_images
for each row execute function public.record_product_image_admin_audit();

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
  primary_image.alt_text as primary_image_alt
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
where brands.is_active is true
  and products.status = 'active'::public.product_status
  and products.is_public_preview is false
  and products.archived_at is null
  and products.published_at is not null
  and products.published_at <= current_timestamp
  and variants.is_active is true;

comment on view storefront.catalog_products is
  'Reviewed server-only purchasable catalog projection with approved descriptions and primary media; no write path or private fields.';

create view storefront.coming_soon_products
with (security_barrier = true)
as
select
  products.slug as product_slug,
  products.name as product_name,
  brands.name as brand_name,
  brands.slug as brand_slug,
  products.category as category,
  products.short_description as short_description,
  products.full_description as full_description,
  products.highlights as highlights,
  products.specifications as specifications,
  products.sort_order as product_sort_order,
  coalesce(images.items, '[]'::jsonb) as images
from public.products as products
inner join public.brands as brands
  on products.brand_id = brands.id
left join lateral (
  select jsonb_agg(
    jsonb_build_object(
      'storagePath', product_images.storage_path,
      'altText', product_images.alt_text,
      'sortOrder', product_images.sort_order,
      'isPrimary', product_images.is_primary
    )
    order by
      product_images.is_primary desc,
      product_images.sort_order asc,
      product_images.id asc
  ) as items
  from public.product_images
  where product_images.product_id = products.id
    and product_images.is_published is true
    and product_images.media_type = 'image'::public.product_media_type
) as images on true
where brands.is_active is true
  and products.status = 'draft'::public.product_status
  and products.is_public_preview is true
  and products.archived_at is null;

comment on view storefront.coming_soon_products is
  'Reviewed server-only non-purchasable preview projection. It exposes no SKU, price, inventory, staff, audit, or commerce data.';

revoke all privileges on table storefront.coming_soon_products
  from public, anon, authenticated;

grant select on table storefront.coming_soon_products
  to gadgetmoto_storefront_reader;

-- Administrator writes require both the authenticated role and an active
-- administrator staff profile. No staff user, public signup, browser secret,
-- service-role key, login credential, or anonymous product write is created.
-- Repository image paths are metadata only; future managed uploads must use
-- product-scoped Storage object paths and the reviewed 8 MB MIME allowlist.
