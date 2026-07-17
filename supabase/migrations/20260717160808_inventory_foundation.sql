-- GadgetMoTo inventory foundation. This migration intentionally contains no seed data.

create table public.inventory_levels (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null,
  location_id uuid not null,
  quantity_on_hand integer not null default 0,
  quantity_reserved integer not null default 0,
  reorder_level integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_levels_variant_id_fkey foreign key (variant_id)
    references public.product_variants (id) on update cascade on delete restrict,
  constraint inventory_levels_location_id_fkey foreign key (location_id)
    references public.store_locations (id) on update cascade on delete restrict,
  constraint inventory_levels_variant_location_key unique (variant_id, location_id),
  constraint inventory_levels_on_hand_nonnegative check (quantity_on_hand >= 0),
  constraint inventory_levels_reserved_nonnegative check (quantity_reserved >= 0),
  constraint inventory_levels_reserved_not_above_on_hand check (
    quantity_reserved <= quantity_on_hand
  ),
  constraint inventory_levels_reorder_level_nonnegative check (
    reorder_level is null or reorder_level >= 0
  )
);

comment on table public.inventory_levels is
  'Staff-only exact inventory quantities; mutations require future controlled transactional workflows.';
comment on column public.inventory_levels.quantity_on_hand is
  'Available quantity is derived as quantity_on_hand minus quantity_reserved.';

create index inventory_levels_location_variant_idx
  on public.inventory_levels (location_id, variant_id);

create trigger inventory_levels_set_updated_at
before update on public.inventory_levels
for each row execute function public.set_updated_at();

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null,
  location_id uuid not null,
  movement_type public.inventory_movement_type not null,
  quantity_delta integer not null,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint inventory_movements_level_fkey foreign key (variant_id, location_id)
    references public.inventory_levels (variant_id, location_id)
    on update cascade on delete restrict,
  constraint inventory_movements_delta_nonzero check (quantity_delta <> 0),
  constraint inventory_movements_reference_type_not_blank check (
    reference_type is null or btrim(reference_type) <> ''
  ),
  constraint inventory_movements_notes_not_blank check (
    notes is null or btrim(notes) <> ''
  )
);

comment on table public.inventory_movements is
  'Append-oriented inventory history; rows should not normally be updated or deleted.';
comment on column public.inventory_movements.quantity_delta is
  'Positive and negative deltas are valid; this row does not automatically update inventory levels.';
comment on column public.inventory_movements.created_by is
  'Nullable until a later migration can reference public.staff_profiles(user_id).';

create index inventory_movements_variant_created_at_idx
  on public.inventory_movements (variant_id, created_at desc);
create index inventory_movements_location_created_at_idx
  on public.inventory_movements (location_id, created_at desc);
create index inventory_movements_reference_idx
  on public.inventory_movements (reference_type, reference_id)
  where reference_type is not null and reference_id is not null;

alter table public.inventory_levels enable row level security;
alter table public.inventory_movements enable row level security;

revoke all privileges on table public.inventory_levels from anon, authenticated;
revoke all privileges on table public.inventory_movements from anon, authenticated;

-- RLS is enabled immediately on both inventory tables, with no policies yet.
-- Direct table privileges for anon and authenticated are revoked. Staff and
-- trusted server policies remain deferred, and no public inventory path is introduced.
-- A later reviewed transactional function will atomically update levels and write movements.
