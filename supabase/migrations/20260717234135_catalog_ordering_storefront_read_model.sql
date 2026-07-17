-- GadgetMoTo global catalog ordering and server-only storefront read model.
-- Product slugs remain stable route and browser-state identifiers. UUID,
-- insertion, brand, and variant order must not be used as storefront order.

alter table public.products
  add column sort_order integer;

comment on column public.products.sort_order is
  'Defines global storefront catalog order; slugs remain stable route and browser-state identifiers.';

update public.products
set sort_order = case slug
  when 'xiaomi-17-ultra-5g-leica-kit' then 0
  when 'apple-iphone-17' then 1
  when 'poco-f8-ultra' then 2
  when 'redmi-note-15-pro-plus-5g' then 3
  when 'redmi-turbo-5' then 4
  when 'infinix-note-60-pro-5g' then 5
  when 'tecno-camon-50' then 6
  when 'poco-c85' then 7
  when 'poco-pad-x1' then 8
  when 'xiaomi-pad-8' then 9
  when 'redmi-pad-2-pro-5g' then 10
  when 'tecno-mega-pad-pro' then 11
end
where slug in (
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
);

do $$
begin
  if (select count(*) from public.products) <> 12 then
    raise exception
      'Catalog sort-order backfill expected exactly 12 products.';
  end if;

  if exists (
    select 1
    from public.products
    where sort_order is null
  ) then
    raise exception
      'Catalog sort-order backfill left an unexpected or unmapped product.';
  end if;
end;
$$ language plpgsql;

alter table public.products
  alter column sort_order set not null,
  add constraint products_sort_order_nonnegative check (sort_order >= 0);

-- No ordering index is created until measured query plans justify one.

create schema storefront;

revoke all privileges on schema storefront from public;
revoke all privileges on schema storefront from anon;
revoke all privileges on schema storefront from authenticated;

comment on schema storefront is
  'Reviewed server-only storefront read models; not intended for browser or Data API access.';

create role gadgetmoto_storefront_reader
  nologin
  nosuperuser
  nocreatedb
  nocreaterole
  noinherit
  noreplication
  nobypassrls;

comment on role gadgetmoto_storefront_reader is
  'Non-login, read-only privilege role for server-side catalog access; separate server login configuration remains pending.';

-- The security barrier keeps caller predicates outside the reviewed row filters.
create view storefront.catalog_products
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
  variants.financing_available as financing_available
from public.products as products
inner join public.brands as brands
  on products.brand_id = brands.id
inner join public.product_variants as variants
  on variants.product_id = products.id
where brands.is_active is true
  and products.status = 'active'::public.product_status
  and products.published_at is not null
  and products.published_at <= current_timestamp
  and variants.is_active is true;

comment on view storefront.catalog_products is
  'Reviewed public-catalog projection for server-only reads. It excludes private and operational fields, provides no write path, and leaves product images to the application placeholder system.';

revoke all privileges on table storefront.catalog_products from public;
revoke all privileges on table storefront.catalog_products from anon;
revoke all privileges on table storefront.catalog_products from authenticated;

grant usage on schema storefront to gadgetmoto_storefront_reader;
grant select on table storefront.catalog_products to gadgetmoto_storefront_reader;

-- Only the dedicated non-login role can read the view. No browser or public
-- Data API access, base-table privilege, write path, or login credential is introduced.
