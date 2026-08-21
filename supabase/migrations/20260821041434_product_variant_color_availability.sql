-- GadgetMoTo product variant/color availability foundation.
-- This migration intentionally creates no option rows or inventory data.

alter table public.product_variants
  add constraint product_variants_product_id_id_key
  unique (product_id, id);

alter table public.product_color_variants
  add constraint product_color_variants_product_id_id_key
  unique (product_id, id);

create table public.product_variant_color_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  variant_id uuid not null,
  color_id uuid not null,
  is_available boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variant_color_options_variant_fkey
    foreign key (product_id, variant_id)
    references public.product_variants (product_id, id)
    on update cascade
    on delete cascade,
  constraint product_variant_color_options_color_fkey
    foreign key (product_id, color_id)
    references public.product_color_variants (product_id, id)
    on update cascade
    on delete cascade,
  constraint product_variant_color_options_variant_color_key
    unique (variant_id, color_id),
  constraint product_variant_color_options_sort_order_nonnegative
    check (sort_order >= 0)
);

comment on table public.product_variant_color_options is
  'Authoritative administrator-managed availability for an exact product variant and color combination; no SKU, price, or inventory value is duplicated here.';
comment on column public.product_variant_color_options.product_id is
  'Owning product repeated to enforce that the selected variant and color belong to the same product.';
comment on column public.product_variant_color_options.is_available is
  'Explicit commercial availability controlled by an administrator; false is the safe default.';

create index product_variant_color_options_product_sort_idx
  on public.product_variant_color_options (
    product_id,
    sort_order,
    variant_id,
    color_id
  );

create index product_variant_color_options_available_product_sort_idx
  on public.product_variant_color_options (
    product_id,
    sort_order,
    variant_id,
    color_id
  )
  where is_available is true;

create trigger product_variant_color_options_set_updated_at
before update on public.product_variant_color_options
for each row execute function public.set_updated_at();

create function public.is_active_product_variant_color_option(
  target_product_id uuid,
  target_variant_id uuid,
  target_color_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.product_variants as variants
    inner join public.product_color_variants as colors
      on colors.product_id = variants.product_id
    where variants.id = target_variant_id
      and colors.id = target_color_id
      and variants.product_id = target_product_id
      and variants.is_active is true
      and colors.is_active is true
  );
$$;

comment on function public.is_active_product_variant_color_option(uuid, uuid, uuid) is
  'Returns only whether a variant and color are active members of the same product; used by reviewed server-role option reads.';

revoke execute on function public.is_active_product_variant_color_option(uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.is_active_product_variant_color_option(uuid, uuid, uuid)
  to gadgetmoto_storefront_reader, gadgetmoto_order_service;

alter table public.product_variant_color_options enable row level security;

revoke all privileges on table public.product_variant_color_options
  from public, anon, authenticated, gadgetmoto_storefront_reader,
    gadgetmoto_order_service;

create policy product_variant_color_options_storefront_reader_select
  on public.product_variant_color_options
  for select
  to gadgetmoto_storefront_reader
  using (
    is_available is true
    and (select public.is_publicly_visible_product(product_id))
    and (
      select public.is_active_product_variant_color_option(
        product_id,
        variant_id,
        color_id
      )
    )
  );

create policy product_variant_color_options_order_service_select
  on public.product_variant_color_options
  for select
  to gadgetmoto_order_service
  using (
    is_available is true
    and (select public.is_publicly_visible_product(product_id))
    and (
      select public.is_active_product_variant_color_option(
        product_id,
        variant_id,
        color_id
      )
    )
  );

create policy product_variant_color_options_administrator_select
  on public.product_variant_color_options
  for select
  to authenticated
  using ((select public.is_active_administrator()));

create policy product_variant_color_options_administrator_insert
  on public.product_variant_color_options
  for insert
  to authenticated
  with check ((select public.is_active_administrator()));

create policy product_variant_color_options_administrator_update
  on public.product_variant_color_options
  for update
  to authenticated
  using ((select public.is_active_administrator()))
  with check ((select public.is_active_administrator()));

create policy product_variant_color_options_administrator_delete
  on public.product_variant_color_options
  for delete
  to authenticated
  using ((select public.is_active_administrator()));

grant select (
  id,
  product_id,
  variant_id,
  color_id,
  is_available,
  sort_order
)
  on table public.product_variant_color_options
  to gadgetmoto_storefront_reader, gadgetmoto_order_service;

grant select, insert, update, delete
  on table public.product_variant_color_options
  to authenticated;

create view storefront.product_variant_color_options
with (security_barrier = true, security_invoker = true)
as
select
  options.id as option_id,
  options.product_id,
  options.variant_id,
  options.color_id,
  colors.name as color_name,
  colors.hex_code,
  colors.sort_order as color_sort_order,
  options.sort_order as option_sort_order
from public.product_variant_color_options as options
inner join public.product_color_variants as colors
  on colors.id = options.color_id
  and colors.product_id = options.product_id
where options.is_available is true
  and colors.is_active is true
  and (
    select public.is_active_product_variant_color_option(
      options.product_id,
      options.variant_id,
      options.color_id
    )
  )
  and (select public.is_publicly_visible_product(options.product_id));

comment on view storefront.product_variant_color_options is
  'Reviewed server-only projection of selectable color and memory/storage combinations; no browser or write path is provided.';

revoke all privileges on table storefront.product_variant_color_options
  from public, anon, authenticated;
grant select on table storefront.product_variant_color_options
  to gadgetmoto_storefront_reader;

create or replace function public.validate_order_item_color_selection()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
declare
  selected_color_name text;
begin
  if new.color_variant_id is not null then
    if new.product_id is null or new.variant_id is null then
      raise exception using
        errcode = '23514',
        message = 'Order item color requires product and variant references.';
    end if;

    select colors.name
      into selected_color_name
    from public.product_variant_color_options as options
    inner join public.product_variants as variants
      on variants.id = options.variant_id
      and variants.product_id = options.product_id
    inner join public.product_color_variants as colors
      on colors.id = options.color_id
      and colors.product_id = options.product_id
    where options.product_id = new.product_id
      and options.variant_id = new.variant_id
      and options.color_id = new.color_variant_id
      and options.is_available is true
      and variants.is_active is true
      and colors.is_active is true;

    if selected_color_name is null then
      raise exception using
        errcode = '23514',
        message = 'Order item color is unavailable for the selected product variant.';
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
  'Validates an available exact product, variant, and color combination and derives the immutable color snapshot from trusted database data.';

drop trigger order_items_validate_color_selection on public.order_items;

create trigger order_items_validate_color_selection
before insert or update of product_id, variant_id, color_variant_id, color_name_snapshot
on public.order_items
for each row execute function public.validate_order_item_color_selection();

create function public.record_product_variant_color_option_admin_audit()
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
      case when old.product_id is distinct from new.product_id then 'productId' end,
      case when old.variant_id is distinct from new.variant_id then 'variantId' end,
      case when old.color_id is distinct from new.color_id then 'colorId' end,
      case when old.is_available is distinct from new.is_available then 'isAvailable' end,
      case when old.sort_order is distinct from new.sort_order then 'sortOrder' end
    ]::text[], null);
  end if;

  if cardinality(changed_fields) = 0 then
    return new;
  end if;

  summary := jsonb_build_object(
    'productId', case when tg_op = 'DELETE' then old.product_id else new.product_id end,
    'variantId', case when tg_op = 'DELETE' then old.variant_id else new.variant_id end,
    'colorId', case when tg_op = 'DELETE' then old.color_id else new.color_id end,
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
    'product_variant_color_option.' || lower(tg_op),
    'product_variant_color_option',
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

comment on function public.record_product_variant_color_option_admin_audit() is
  'Trigger-only audit writer for administrator changes to exact variant/color availability; records identifiers and changed field names only.';

revoke execute on function public.record_product_variant_color_option_admin_audit()
  from public, anon, authenticated;

create trigger product_variant_color_options_record_admin_audit
after insert or update or delete on public.product_variant_color_options
for each row execute function public.record_product_variant_color_option_admin_audit();
