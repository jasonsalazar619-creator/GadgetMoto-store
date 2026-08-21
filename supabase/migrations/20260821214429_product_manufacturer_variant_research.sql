-- GadgetMoTo manufacturer variant research foundation.
-- Research records describe manufacturer-confirmed options only. They do not
-- create commercial SKUs, prices, inventory, or GadgetMoTo availability.

create table public.product_manufacturer_sources (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  source_name text not null,
  source_url text not null,
  region text not null,
  source_type text not null,
  researched_at timestamptz not null default now(),
  verification_status text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_manufacturer_sources_product_id_fkey
    foreign key (product_id)
    references public.products (id)
    on update cascade
    on delete cascade,
  constraint product_manufacturer_sources_name_not_blank
    check (btrim(source_name) <> ''),
  constraint product_manufacturer_sources_name_trimmed
    check (source_name = btrim(source_name)),
  constraint product_manufacturer_sources_url_not_blank
    check (btrim(source_url) <> ''),
  constraint product_manufacturer_sources_url_trimmed
    check (source_url = btrim(source_url)),
  constraint product_manufacturer_sources_url_https
    check (source_url ~ '^https://[^[:space:]]+$'),
  constraint product_manufacturer_sources_region_valid
    check (region in ('ph', 'sea', 'regional', 'global')),
  constraint product_manufacturer_sources_type_valid
    check (
      source_type in (
        'manufacturer_product_page',
        'manufacturer_support_page',
        'manufacturer_newsroom',
        'manufacturer_specification_pdf',
        'authorized_retailer'
      )
    ),
  constraint product_manufacturer_sources_verification_status_valid
    check (
      verification_status in (
        'verified',
        'partial',
        'needs_manual_verification'
      )
    ),
  constraint product_manufacturer_sources_notes_not_blank
    check (notes is null or btrim(notes) <> ''),
  constraint product_manufacturer_sources_product_id_id_region_key
    unique (product_id, id, region)
);

comment on table public.product_manufacturer_sources is
  'Administrator-managed manufacturer research sources. These records make no commercial or availability claim.';
comment on column public.product_manufacturer_sources.region is
  'Research scope: ph, sea, another official regional market, or global.';
comment on column public.product_manufacturer_sources.verification_status is
  'Research confidence only; it does not imply GadgetMoTo availability.';

create unique index product_manufacturer_sources_product_url_lower_key
  on public.product_manufacturer_sources (product_id, lower(source_url));
create index product_manufacturer_sources_verification_status_idx
  on public.product_manufacturer_sources (verification_status, product_id);

create trigger product_manufacturer_sources_set_updated_at
before update on public.product_manufacturer_sources
for each row execute function public.set_updated_at();

create table public.product_manufacturer_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  source_id uuid not null,
  region text not null,
  physical_ram_gb smallint,
  physical_ram_not_published boolean not null default false,
  extended_ram_gb smallint,
  storage_gb integer not null,
  verification_status text not null,
  mapped_product_variant_id uuid,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_manufacturer_variants_product_id_fkey
    foreign key (product_id)
    references public.products (id)
    on update cascade
    on delete cascade,
  constraint product_manufacturer_variants_source_fkey
    foreign key (product_id, source_id, region)
    references public.product_manufacturer_sources (product_id, id, region)
    on update cascade
    on delete cascade,
  constraint product_manufacturer_variants_mapped_variant_fkey
    foreign key (product_id, mapped_product_variant_id)
    references public.product_variants (product_id, id)
    on update cascade
    on delete set null (mapped_product_variant_id),
  constraint product_manufacturer_variants_region_valid
    check (region in ('ph', 'sea', 'regional', 'global')),
  constraint product_manufacturer_variants_ram_positive
    check (physical_ram_gb is null or physical_ram_gb > 0),
  constraint product_manufacturer_variants_ram_publication_consistent
    check (not physical_ram_not_published or physical_ram_gb is null),
  constraint product_manufacturer_variants_extended_ram_positive
    check (extended_ram_gb is null or extended_ram_gb > 0),
  constraint product_manufacturer_variants_extended_ram_requires_physical
    check (extended_ram_gb is null or physical_ram_gb is not null),
  constraint product_manufacturer_variants_storage_positive
    check (storage_gb > 0),
  constraint product_manufacturer_variants_verification_status_valid
    check (
      verification_status in (
        'verified',
        'partial',
        'needs_manual_verification'
      )
    ),
  constraint product_manufacturer_variants_sort_order_nonnegative
    check (sort_order >= 0),
  constraint product_manufacturer_variants_product_id_id_region_key
    unique (product_id, id, region)
);

comment on table public.product_manufacturer_variants is
  'Manufacturer memory and storage research independent from commercial GadgetMoTo product variants.';
comment on column public.product_manufacturer_variants.physical_ram_not_published is
  'True only when the manufacturer does not publish customer-facing physical RAM, such as an Apple storage-only option.';
comment on column public.product_manufacturer_variants.mapped_product_variant_id is
  'Optional same-product mapping to a commercial variant after GadgetMoTo supplies its SKU and price.';

create unique index product_manufacturer_variants_configuration_key
  on public.product_manufacturer_variants (
    product_id,
    region,
    coalesce(physical_ram_gb, 0),
    physical_ram_not_published,
    coalesce(extended_ram_gb, 0),
    storage_gb
  );
create index product_manufacturer_variants_mapped_variant_idx
  on public.product_manufacturer_variants (mapped_product_variant_id)
  where mapped_product_variant_id is not null;
create index product_manufacturer_variants_verification_status_idx
  on public.product_manufacturer_variants (verification_status, product_id);

create trigger product_manufacturer_variants_set_updated_at
before update on public.product_manufacturer_variants
for each row execute function public.set_updated_at();

create table public.product_manufacturer_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  source_id uuid not null,
  region text not null,
  official_name text not null,
  normalized_name text generated always as (lower(btrim(official_name))) stored,
  hex_code text,
  verification_status text not null,
  mapped_product_color_variant_id uuid,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_manufacturer_colors_product_id_fkey
    foreign key (product_id)
    references public.products (id)
    on update cascade
    on delete cascade,
  constraint product_manufacturer_colors_source_fkey
    foreign key (product_id, source_id, region)
    references public.product_manufacturer_sources (product_id, id, region)
    on update cascade
    on delete cascade,
  constraint product_manufacturer_colors_mapped_color_fkey
    foreign key (product_id, mapped_product_color_variant_id)
    references public.product_color_variants (product_id, id)
    on update cascade
    on delete set null (mapped_product_color_variant_id),
  constraint product_manufacturer_colors_region_valid
    check (region in ('ph', 'sea', 'regional', 'global')),
  constraint product_manufacturer_colors_name_not_blank
    check (btrim(official_name) <> ''),
  constraint product_manufacturer_colors_name_trimmed
    check (official_name = btrim(official_name)),
  constraint product_manufacturer_colors_hex_code_format
    check (hex_code is null or hex_code ~ '^#[0-9A-Fa-f]{6}$'),
  constraint product_manufacturer_colors_verification_status_valid
    check (
      verification_status in (
        'verified',
        'partial',
        'needs_manual_verification'
      )
    ),
  constraint product_manufacturer_colors_sort_order_nonnegative
    check (sort_order >= 0),
  constraint product_manufacturer_colors_product_name_region_key
    unique (product_id, normalized_name, region),
  constraint product_manufacturer_colors_product_id_id_region_key
    unique (product_id, id, region)
);

comment on table public.product_manufacturer_colors is
  'Official manufacturer finish names with optional presentation swatches and no availability implication.';
comment on column public.product_manufacturer_colors.official_name is
  'Manufacturer display name preserved exactly after trimming outer whitespace.';
comment on column public.product_manufacturer_colors.mapped_product_color_variant_id is
  'Optional same-product mapping to an administrator-managed GadgetMoTo color.';

create index product_manufacturer_colors_mapped_color_idx
  on public.product_manufacturer_colors (mapped_product_color_variant_id)
  where mapped_product_color_variant_id is not null;
create index product_manufacturer_colors_verification_status_idx
  on public.product_manufacturer_colors (verification_status, product_id);

create trigger product_manufacturer_colors_set_updated_at
before update on public.product_manufacturer_colors
for each row execute function public.set_updated_at();

create table public.product_manufacturer_combinations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  source_id uuid not null,
  region text not null,
  manufacturer_variant_id uuid not null,
  manufacturer_color_id uuid not null,
  verification_status text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_manufacturer_combinations_product_id_fkey
    foreign key (product_id)
    references public.products (id)
    on update cascade
    on delete cascade,
  constraint product_manufacturer_combinations_source_fkey
    foreign key (product_id, source_id, region)
    references public.product_manufacturer_sources (product_id, id, region)
    on update cascade
    on delete cascade,
  constraint product_manufacturer_combinations_variant_fkey
    foreign key (product_id, manufacturer_variant_id, region)
    references public.product_manufacturer_variants (product_id, id, region)
    on update cascade
    on delete cascade,
  constraint product_manufacturer_combinations_color_fkey
    foreign key (product_id, manufacturer_color_id, region)
    references public.product_manufacturer_colors (product_id, id, region)
    on update cascade
    on delete cascade,
  constraint product_manufacturer_combinations_region_valid
    check (region in ('ph', 'sea', 'regional', 'global')),
  constraint product_manufacturer_combinations_verification_status_valid
    check (
      verification_status in (
        'verified',
        'partial',
        'needs_manual_verification'
      )
    ),
  constraint product_manufacturer_combinations_sort_order_nonnegative
    check (sort_order >= 0),
  constraint product_manufacturer_combinations_exact_key
    unique (
      product_id,
      manufacturer_variant_id,
      manufacturer_color_id,
      region
    )
);

comment on table public.product_manufacturer_combinations is
  'Explicit manufacturer-supported color and memory/storage relationships. A row never means GadgetMoTo has the combination available.';

create index product_manufacturer_combinations_verification_status_idx
  on public.product_manufacturer_combinations (verification_status, product_id);

create trigger product_manufacturer_combinations_set_updated_at
before update on public.product_manufacturer_combinations
for each row execute function public.set_updated_at();

alter table public.product_manufacturer_sources enable row level security;
alter table public.product_manufacturer_variants enable row level security;
alter table public.product_manufacturer_colors enable row level security;
alter table public.product_manufacturer_combinations enable row level security;

revoke all privileges on table public.product_manufacturer_sources
  from public, anon, authenticated;
revoke all privileges on table public.product_manufacturer_variants
  from public, anon, authenticated;
revoke all privileges on table public.product_manufacturer_colors
  from public, anon, authenticated;
revoke all privileges on table public.product_manufacturer_combinations
  from public, anon, authenticated;

create policy product_manufacturer_sources_administrator_all
  on public.product_manufacturer_sources
  for all
  to authenticated
  using ((select public.is_active_administrator()))
  with check ((select public.is_active_administrator()));

create policy product_manufacturer_variants_administrator_all
  on public.product_manufacturer_variants
  for all
  to authenticated
  using ((select public.is_active_administrator()))
  with check ((select public.is_active_administrator()));

create policy product_manufacturer_colors_administrator_all
  on public.product_manufacturer_colors
  for all
  to authenticated
  using ((select public.is_active_administrator()))
  with check ((select public.is_active_administrator()));

create policy product_manufacturer_combinations_administrator_all
  on public.product_manufacturer_combinations
  for all
  to authenticated
  using ((select public.is_active_administrator()))
  with check ((select public.is_active_administrator()));

grant select, insert, update, delete
  on table public.product_manufacturer_sources
  to authenticated;
grant select, insert, update, delete
  on table public.product_manufacturer_variants
  to authenticated;
grant select, insert, update, delete
  on table public.product_manufacturer_colors
  to authenticated;
grant select, insert, update, delete
  on table public.product_manufacturer_combinations
  to authenticated;

comment on policy product_manufacturer_sources_administrator_all
  on public.product_manufacturer_sources is
  'Only authenticated active administrators may manage manufacturer research sources.';
comment on policy product_manufacturer_variants_administrator_all
  on public.product_manufacturer_variants is
  'Only authenticated active administrators may manage manufacturer memory and storage research.';
comment on policy product_manufacturer_colors_administrator_all
  on public.product_manufacturer_colors is
  'Only authenticated active administrators may manage manufacturer color research.';
comment on policy product_manufacturer_combinations_administrator_all
  on public.product_manufacturer_combinations is
  'Only authenticated active administrators may manage exact manufacturer combinations.';

-- No seed or backfill is performed. Migration 19 remains the sole authority
-- for actual product variant/color availability.
