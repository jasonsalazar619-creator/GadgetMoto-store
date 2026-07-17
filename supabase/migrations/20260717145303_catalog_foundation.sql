-- GadgetMoTo catalog foundation. This migration intentionally contains no seed data.

create type public.product_category as enum (
  'phone',
  'tablet'
);

create type public.product_condition as enum (
  'brand_new',
  'pre_loved',
  'open_box',
  'refurbished'
);

create type public.product_status as enum (
  'draft',
  'active',
  'archived'
);

create type public.product_badge as enum (
  'new',
  'sale'
);

create type public.product_media_type as enum (
  'image',
  'video'
);

create type public.inventory_movement_type as enum (
  'initial',
  'purchase',
  'sale',
  'reservation',
  'reservation_release',
  'adjustment',
  'return',
  'damage'
);

create type public.order_status as enum (
  'draft',
  'pending_review',
  'confirmed',
  'awaiting_payment',
  'paid',
  'processing',
  'ready_for_pickup',
  'shipped',
  'completed',
  'cancelled'
);

create type public.delivery_method as enum (
  'nationwide_delivery',
  'same_day_delivery',
  'store_pickup'
);

create type public.fulfillment_status as enum (
  'pending_confirmation',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'dispatched',
  'delivered',
  'completed',
  'cancelled'
);

create type public.payment_method as enum (
  'maya_online',
  'maya_manual',
  'gcash',
  'bank_transfer',
  'cash_on_pickup',
  'home_credit',
  'skyro',
  'ggives',
  'atome',
  'billease',
  'maya_credit'
);

create type public.payment_status as enum (
  'pending',
  'instructions_pending',
  'awaiting_payment',
  'processing',
  'paid',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded'
);

create type public.staff_role as enum (
  'owner',
  'administrator',
  'sales',
  'inventory',
  'content'
);

create type public.price_alert_status as enum (
  'active',
  'notified',
  'unsubscribed'
);

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = current_timestamp;
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Sets a row updated_at timestamp immediately before an update.';

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brands_name_not_blank check (btrim(name) <> ''),
  constraint brands_slug_not_blank check (btrim(slug) <> ''),
  constraint brands_slug_lowercase check (slug = lower(slug)),
  constraint brands_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint brands_sort_order_nonnegative check (sort_order >= 0),
  constraint brands_slug_key unique (slug)
);

comment on table public.brands is
  'Canonical product brands; deactivate records instead of casually deleting them.';

create unique index brands_name_lower_key on public.brands (lower(name));

create trigger brands_set_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null,
  name text not null,
  slug text not null,
  category public.product_category not null,
  short_description text,
  status public.product_status not null default 'draft',
  is_featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_brand_id_fkey foreign key (brand_id)
    references public.brands (id) on update cascade on delete restrict,
  constraint products_name_not_blank check (btrim(name) <> ''),
  constraint products_slug_not_blank check (btrim(slug) <> ''),
  constraint products_slug_lowercase check (slug = lower(slug)),
  constraint products_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint products_active_requires_published_at check (
    status <> 'active' or published_at is not null
  ),
  constraint products_slug_key unique (slug)
);

comment on table public.products is
  'Model-level catalog records shared by purchasable variants.';

create index products_brand_id_idx on public.products (brand_id);
create index products_category_status_idx on public.products (category, status);
create index products_active_featured_idx
  on public.products (published_at desc, id)
  where status = 'active' and is_featured;

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  sku text not null,
  variant_name text not null,
  ram_gb smallint,
  storage_gb integer not null,
  condition public.product_condition not null default 'brand_new',
  current_price_centavos bigint not null,
  srp_centavos bigint,
  badge public.product_badge,
  financing_available boolean not null default true,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_product_id_fkey foreign key (product_id)
    references public.products (id) on update cascade on delete restrict,
  constraint product_variants_sku_not_blank check (btrim(sku) <> ''),
  constraint product_variants_name_not_blank check (btrim(variant_name) <> ''),
  constraint product_variants_ram_positive check (ram_gb is null or ram_gb > 0),
  constraint product_variants_storage_positive check (storage_gb > 0),
  constraint product_variants_current_price_nonnegative check (current_price_centavos >= 0),
  constraint product_variants_srp_nonnegative check (srp_centavos is null or srp_centavos >= 0),
  constraint product_variants_srp_not_below_price check (
    srp_centavos is null or srp_centavos >= current_price_centavos
  ),
  constraint product_variants_sort_order_nonnegative check (sort_order >= 0)
);

comment on table public.product_variants is
  'Purchasable variants; money uses integer centavos and RAM stays nullable when unconfirmed.';
comment on column public.product_variants.current_price_centavos is
  'Canonical current price represented as integer centavos.';
comment on column public.product_variants.ram_gb is
  'Nullable because some products do not yet have a confirmed RAM value.';

create unique index product_variants_sku_lower_key
  on public.product_variants (lower(sku));
create unique index product_variants_product_name_lower_key
  on public.product_variants (product_id, lower(variant_name));
create index product_variants_product_id_idx on public.product_variants (product_id);
create index product_variants_active_product_sort_idx
  on public.product_variants (product_id, sort_order, id)
  where is_active;

create trigger product_variants_set_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid,
  variant_id uuid,
  storage_path text not null,
  alt_text text not null,
  media_type public.product_media_type not null default 'image',
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint product_images_product_id_fkey foreign key (product_id)
    references public.products (id) on update cascade on delete restrict,
  constraint product_images_variant_id_fkey foreign key (variant_id)
    references public.product_variants (id) on update cascade on delete restrict,
  constraint product_images_exactly_one_owner check (num_nonnulls(product_id, variant_id) = 1),
  constraint product_images_storage_path_not_blank check (btrim(storage_path) <> ''),
  constraint product_images_alt_text_not_blank check (btrim(alt_text) <> ''),
  constraint product_images_sort_order_nonnegative check (sort_order >= 0)
);

comment on table public.product_images is
  'Ordered product media metadata whose storage_path will reference Supabase Storage.';

create index product_images_product_sort_idx
  on public.product_images (product_id, sort_order, id)
  where product_id is not null;
create index product_images_variant_sort_idx
  on public.product_images (variant_id, sort_order, id)
  where variant_id is not null;
create unique index product_images_one_primary_per_product_key
  on public.product_images (product_id)
  where product_id is not null and is_primary;
create unique index product_images_one_primary_per_variant_key
  on public.product_images (variant_id)
  where variant_id is not null and is_primary;

create table public.store_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  city text not null,
  province text not null,
  public_address text,
  pickup_instructions text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_locations_name_not_blank check (btrim(name) <> ''),
  constraint store_locations_slug_not_blank check (btrim(slug) <> ''),
  constraint store_locations_slug_lowercase check (slug = lower(slug)),
  constraint store_locations_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint store_locations_city_not_blank check (btrim(city) <> ''),
  constraint store_locations_province_not_blank check (btrim(province) <> ''),
  constraint store_locations_slug_key unique (slug)
);

comment on table public.store_locations is
  'Store branches available for operations and future pickup fulfillment.';

create index store_locations_active_name_idx
  on public.store_locations (name, id)
  where is_active;

create trigger store_locations_set_updated_at
before update on public.store_locations
for each row execute function public.set_updated_at();

alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.store_locations enable row level security;

revoke all privileges on table public.brands from anon, authenticated;
revoke all privileges on table public.products from anon, authenticated;
revoke all privileges on table public.product_variants from anon, authenticated;
revoke all privileges on table public.product_images from anon, authenticated;
revoke all privileges on table public.store_locations from anon, authenticated;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- RLS is enabled immediately on every exposed application table, with no policies yet.
-- Direct table privileges for anon and authenticated are revoked as defense in depth.
-- Public storefront reads remain unavailable until a later reviewed migration adds
-- narrowly scoped policies and minimum grants. No public write path is introduced.
