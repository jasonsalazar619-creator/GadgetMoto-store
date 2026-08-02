create function public.is_publicly_visible_product(target_product_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.products
    inner join public.brands
      on public.brands.id = public.products.brand_id
    where public.products.id = target_product_id
      and public.brands.is_active is true
      and public.products.archived_at is null
      and (
        (
          public.products.status = 'active'::public.product_status
          and public.products.is_public_preview is false
          and public.products.published_at is not null
          and public.products.published_at <= current_timestamp
        )
        or (
          public.products.status = 'draft'::public.product_status
          and public.products.is_public_preview is true
        )
      )
  );
$$;

comment on function public.is_publicly_visible_product(uuid) is
  'Returns true for a live catalog product or an approved Coming Soon preview; used only by reviewed server-side color reads.';

revoke execute on function public.is_publicly_visible_product(uuid)
  from public, anon, authenticated;
grant execute on function public.is_publicly_visible_product(uuid)
  to gadgetmoto_storefront_reader, gadgetmoto_order_service;

create table public.product_color_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  name text not null,
  normalized_name text generated always as (lower(btrim(name))) stored,
  hex_code text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_color_variants_product_id_fkey foreign key (product_id)
    references public.products (id) on update cascade on delete cascade,
  constraint product_color_variants_name_not_blank check (btrim(name) <> ''),
  constraint product_color_variants_name_trimmed check (name = btrim(name)),
  constraint product_color_variants_hex_code_format check (
    hex_code is null or hex_code ~ '^#[0-9A-Fa-f]{6}$'
  ),
  constraint product_color_variants_sort_order_nonnegative check (sort_order >= 0),
  constraint product_color_variants_product_normalized_name_key
    unique (product_id, normalized_name)
);

comment on table public.product_color_variants is
  'Product-level display colors. Colors do not imply a SKU, price, inventory level, or purchasable storage/RAM variant.';
comment on column public.product_color_variants.name is
  'Trimmed administrator-supplied display name with capitalization preserved.';
comment on column public.product_color_variants.normalized_name is
  'Database-generated lowercase trimmed name used only for per-product duplicate prevention.';
comment on column public.product_color_variants.hex_code is
  'Optional display swatch in #RRGGBB format; null uses a neutral labeled swatch.';

create index product_color_variants_active_product_sort_idx
  on public.product_color_variants (product_id, sort_order, id)
  where is_active is true;

create trigger product_color_variants_set_updated_at
before update on public.product_color_variants
for each row execute function public.set_updated_at();

alter table public.product_color_variants enable row level security;

revoke all privileges on table public.product_color_variants
  from public, anon, authenticated, gadgetmoto_storefront_reader,
    gadgetmoto_order_service;

create policy product_color_variants_storefront_reader_select
  on public.product_color_variants
  for select
  to gadgetmoto_storefront_reader
  using (
    is_active is true
    and (select public.is_publicly_visible_product(product_id))
  );

create policy product_color_variants_order_service_select
  on public.product_color_variants
  for select
  to gadgetmoto_order_service
  using (
    is_active is true
    and (select public.is_publicly_visible_product(product_id))
  );

create policy product_color_variants_administrator_select
  on public.product_color_variants
  for select
  to authenticated
  using ((select public.is_active_administrator()));

create policy product_color_variants_administrator_insert
  on public.product_color_variants
  for insert
  to authenticated
  with check ((select public.is_active_administrator()));

create policy product_color_variants_administrator_update
  on public.product_color_variants
  for update
  to authenticated
  using ((select public.is_active_administrator()))
  with check ((select public.is_active_administrator()));

create policy product_color_variants_administrator_delete
  on public.product_color_variants
  for delete
  to authenticated
  using ((select public.is_active_administrator()));

grant select (id, product_id, name, hex_code, is_active, sort_order)
  on table public.product_color_variants
  to gadgetmoto_storefront_reader;
grant select (id, product_id, name, is_active)
  on table public.product_color_variants
  to gadgetmoto_order_service;
grant select, insert, update, delete
  on table public.product_color_variants
  to authenticated;

create view storefront.product_colors
with (security_barrier = true, security_invoker = true)
as
select
  id as color_id,
  product_id,
  name as color_name,
  hex_code,
  sort_order
from public.product_color_variants
where is_active is true
  and (select public.is_publicly_visible_product(product_id));

comment on view storefront.product_colors is
  'Reviewed server-only active color projection for live products and approved Coming Soon previews; no browser or write path is provided.';

revoke all privileges on table storefront.product_colors
  from public, anon, authenticated;
grant select on table storefront.product_colors
  to gadgetmoto_storefront_reader;

alter table public.order_items
  add column color_variant_id uuid,
  add column color_name_snapshot text,
  add constraint order_items_color_variant_id_fkey foreign key (color_variant_id)
    references public.product_color_variants (id)
    on update cascade
    on delete set null,
  add constraint order_items_color_name_snapshot_not_blank check (
    color_name_snapshot is null or btrim(color_name_snapshot) <> ''
  ),
  add constraint order_items_color_reference_requires_snapshot check (
    color_variant_id is null or color_name_snapshot is not null
  );

comment on column public.order_items.color_variant_id is
  'Nullable validated product-color reference. Deletion clears the reference while retaining the immutable name snapshot.';
comment on column public.order_items.color_name_snapshot is
  'Trusted server snapshot of the selected color name for historical order display after later rename or deletion.';

create index order_items_color_variant_id_idx
  on public.order_items (color_variant_id)
  where color_variant_id is not null;

create function public.validate_order_item_color_selection()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare
  selected_color_name text;
begin
  if new.color_variant_id is not null then
    if new.product_id is null then
      raise exception using
        errcode = '23514',
        message = 'Order item color requires a product reference.';
    end if;

    select name
      into selected_color_name
    from public.product_color_variants
    where id = new.color_variant_id
      and product_id = new.product_id
      and is_active is true;

    if selected_color_name is null then
      raise exception using
        errcode = '23514',
        message = 'Order item color is unavailable for the selected product.';
    end if;

    new.color_name_snapshot = selected_color_name;
    return new;
  end if;

  if tg_op = 'UPDATE'
    and old.color_name_snapshot is not null
    and new.color_name_snapshot is not distinct from old.color_name_snapshot
  then
    return new;
  end if;

  new.color_name_snapshot = null;

  if new.product_id is not null and exists (
    select 1
    from public.product_color_variants
    where product_id = new.product_id
      and is_active is true
  ) then
    raise exception using
      errcode = '23514',
      message = 'Order item color selection is required.';
  end if;

  return new;
end;
$$;

comment on function public.validate_order_item_color_selection() is
  'Validates active product-color membership and derives the immutable order snapshot from trusted database data.';

revoke execute on function public.validate_order_item_color_selection()
  from public, anon, authenticated;

create trigger order_items_validate_color_selection
before insert or update of product_id, color_variant_id, color_name_snapshot
on public.order_items
for each row execute function public.validate_order_item_color_selection();

create function public.record_product_color_variant_admin_audit()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  actor_id uuid := auth.uid();
  changed_fields text[];
  owning_product_id uuid;
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
      case when old.name is distinct from new.name then 'name' end,
      case when old.hex_code is distinct from new.hex_code then 'hexCode' end,
      case when old.is_active is distinct from new.is_active then 'isActive' end,
      case when old.sort_order is distinct from new.sort_order then 'sortOrder' end
    ]::text[], null);
  end if;

  if cardinality(changed_fields) = 0 then
    return new;
  end if;

  owning_product_id :=
    case when tg_op = 'DELETE' then old.product_id else new.product_id end;
  summary := jsonb_build_object(
    'productId', owning_product_id,
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
    'product_color_variant.' || lower(tg_op),
    'product_color_variant',
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

comment on function public.record_product_color_variant_admin_audit() is
  'Trigger-only color audit writer that records product and color IDs plus changed field names, never color values.';

revoke execute on function public.record_product_color_variant_admin_audit()
  from public, anon, authenticated;

create trigger product_color_variants_record_admin_audit
after insert or update or delete on public.product_color_variants
for each row execute function public.record_product_color_variant_admin_audit();
