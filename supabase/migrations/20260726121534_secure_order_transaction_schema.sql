-- GadgetMoTo secure order-transaction schema.
-- This forward-only migration adds no records, browser policy, login credential,
-- payment-provider behavior, automatic tax rule, or automatic delivery fee.

create type public.inventory_reservation_status as enum (
  'active',
  'converted',
  'released',
  'expired'
);

alter table public.orders
  alter column customer_email drop not null,
  add column public_lookup_token_hash text not null,
  add constraint orders_public_lookup_token_hash_format check (
    public_lookup_token_hash ~ '^[0-9a-f]{64}$'
  ),
  add constraint orders_vat_fields_pair check (
    (vat_rate_bps is null) = (vat_amount_centavos is null)
  ),
  add constraint orders_final_total_components check (
    final_total_centavos is null
    or (
      delivery_fee_centavos is not null
      and vat_amount_centavos is not null
      and final_total_centavos = (
        merchandise_subtotal_centavos
        + delivery_fee_centavos
        + vat_amount_centavos
      )
    )
  );

comment on column public.orders.customer_email is
  'Optional normalized customer email. Null means the guest did not supply one.';
comment on column public.orders.public_lookup_token_hash is
  'SHA-256 hash of a high-entropy order lookup token. Plaintext lookup tokens must never be stored.';

create unique index orders_public_lookup_token_hash_uidx
  on public.orders (public_lookup_token_hash);

create table public.order_submissions (
  id uuid primary key default gen_random_uuid(),
  idempotency_key_hash text not null,
  request_fingerprint text not null,
  order_id uuid references public.orders (id) on update cascade on delete restrict,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_submissions_key_hash_format check (
    idempotency_key_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint order_submissions_fingerprint_format check (
    request_fingerprint ~ '^[0-9a-f]{64}$'
  ),
  constraint order_submissions_completion_pair check (
    (order_id is null) = (completed_at is null)
  ),
  constraint order_submissions_idempotency_key_hash_key unique (
    idempotency_key_hash
  ),
  constraint order_submissions_order_id_key unique (order_id)
);

comment on table public.order_submissions is
  'Private order-submission idempotency claims. Only hashes and request fingerprints are stored; no raw key, credential, or customer payload is allowed.';
comment on column public.order_submissions.idempotency_key_hash is
  'SHA-256 hash of the browser-generated high-entropy submission key.';
comment on column public.order_submissions.request_fingerprint is
  'SHA-256 fingerprint of the normalized trusted request contract.';

create trigger order_submissions_set_updated_at
before update on public.order_submissions
for each row execute function public.set_updated_at();

alter table public.order_items
  add constraint order_items_id_order_variant_key unique (
    id,
    order_id,
    variant_id
  );

create unique index order_items_order_variant_uidx
  on public.order_items (order_id, variant_id)
  where variant_id is not null;

alter table public.order_fulfillments
  alter column location_id set not null;

comment on column public.order_fulfillments.location_id is
  'Required single fulfillment and inventory-allocation location. Split fulfillment is disabled at launch.';

create table public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null,
  order_item_id uuid not null,
  variant_id uuid not null,
  location_id uuid not null,
  quantity integer not null,
  status public.inventory_reservation_status not null default 'active',
  expires_at timestamptz not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint inventory_reservations_order_fkey foreign key (order_id)
    references public.orders (id) on update cascade on delete restrict,
  constraint inventory_reservations_order_item_fkey foreign key (
    order_item_id,
    order_id,
    variant_id
  ) references public.order_items (id, order_id, variant_id)
    on update cascade on delete restrict,
  constraint inventory_reservations_level_fkey foreign key (
    variant_id,
    location_id
  ) references public.inventory_levels (variant_id, location_id)
    on update cascade on delete restrict,
  constraint inventory_reservations_order_item_key unique (order_item_id),
  constraint inventory_reservations_quantity_valid check (
    quantity between 1 and 99
  ),
  constraint inventory_reservations_expiry_after_creation check (
    expires_at > created_at
  ),
  constraint inventory_reservations_resolution_state check (
    (
      status = 'active'::public.inventory_reservation_status
      and resolved_at is null
    )
    or (
      status <> 'active'::public.inventory_reservation_status
      and resolved_at is not null
    )
  )
);

comment on table public.inventory_reservations is
  'One launch reservation per order item at one location. Active reservations require a future approved expiry duration and trusted transactional lifecycle.';
comment on column public.inventory_reservations.expires_at is
  'Required reservation expiry instant; the duration remains a separately approved business rule.';

create index inventory_reservations_order_idx
  on public.inventory_reservations (order_id);
create index inventory_reservations_active_expiry_idx
  on public.inventory_reservations (expires_at)
  where status = 'active'::public.inventory_reservation_status;
create index inventory_reservations_level_status_idx
  on public.inventory_reservations (variant_id, location_id, status);

create trigger inventory_reservations_set_updated_at
before update on public.inventory_reservations
for each row execute function public.set_updated_at();

alter table public.inventory_movements
  add column reservation_id uuid,
  add constraint inventory_movements_reservation_fkey foreign key (
    reservation_id
  ) references public.inventory_reservations (id)
    on update cascade on delete restrict,
  add constraint inventory_movements_reservation_required check (
    movement_type not in (
      'reservation'::public.inventory_movement_type,
      'reservation_release'::public.inventory_movement_type
    )
    or reservation_id is not null
  ),
  add constraint inventory_movements_reservation_type_valid check (
    reservation_id is null
    or movement_type in (
      'reservation'::public.inventory_movement_type,
      'reservation_release'::public.inventory_movement_type,
      'sale'::public.inventory_movement_type
    )
  ),
  add constraint inventory_movements_transaction_direction check (
    (
      movement_type <> 'reservation'::public.inventory_movement_type
      or quantity_delta > 0
    )
    and (
      movement_type not in (
        'reservation_release'::public.inventory_movement_type,
        'sale'::public.inventory_movement_type
      )
      or quantity_delta < 0
    )
  );

comment on column public.inventory_movements.reservation_id is
  'Links reservation, release, and optional sale movements to the durable reservation lifecycle.';
comment on column public.inventory_movements.quantity_delta is
  'Reservation deltas are positive reserved units; reservation-release and sale deltas are negative units. Rows do not mutate inventory levels automatically.';

create unique index inventory_movements_reservation_type_uidx
  on public.inventory_movements (reservation_id, movement_type)
  where reservation_id is not null;

alter table public.payments
  add column idempotency_key_hash text,
  add column request_fingerprint text,
  add constraint payments_idempotency_fields_pair check (
    (idempotency_key_hash is null) = (request_fingerprint is null)
  ),
  add constraint payments_idempotency_key_hash_format check (
    idempotency_key_hash is null
    or idempotency_key_hash ~ '^[0-9a-f]{64}$'
  ),
  add constraint payments_request_fingerprint_format check (
    request_fingerprint is null
    or request_fingerprint ~ '^[0-9a-f]{64}$'
  );

comment on column public.payments.idempotency_key_hash is
  'Optional SHA-256 hash for one trusted payment-attempt initialization key.';
comment on column public.payments.request_fingerprint is
  'Optional SHA-256 fingerprint paired with the payment-attempt idempotency key.';

create unique index payments_idempotency_key_hash_uidx
  on public.payments (idempotency_key_hash)
  where idempotency_key_hash is not null;

create function public.reject_append_only_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'Append-only records cannot be updated or deleted.';
end;
$$;

comment on function public.reject_append_only_mutation() is
  'Rejects updates and deletes on append-only operational history tables.';

create trigger inventory_movements_reject_mutation
before update or delete on public.inventory_movements
for each row execute function public.reject_append_only_mutation();

create trigger payment_events_reject_mutation
before update or delete on public.payment_events
for each row execute function public.reject_append_only_mutation();

create trigger audit_logs_reject_mutation
before update or delete on public.audit_logs
for each row execute function public.reject_append_only_mutation();

alter table public.order_submissions enable row level security;
alter table public.inventory_reservations enable row level security;

revoke all privileges on table public.order_submissions
  from public, anon, authenticated;
revoke all privileges on table public.inventory_reservations
  from public, anon, authenticated;

revoke execute on function public.reject_append_only_mutation()
  from public, anon, authenticated;

create role gadgetmoto_order_service
  nologin
  nosuperuser
  nocreatedb
  nocreaterole
  noinherit
  noreplication
  nobypassrls;

comment on role gadgetmoto_order_service is
  'Non-login least-privilege role for trusted server order creation. Login credentials and role membership remain manual and outside migrations.';

create policy brands_order_service_select
  on public.brands
  for select
  to gadgetmoto_order_service
  using (true);

create policy products_order_service_select
  on public.products
  for select
  to gadgetmoto_order_service
  using (true);

create policy product_variants_order_service_select
  on public.product_variants
  for select
  to gadgetmoto_order_service
  using (true);

create policy store_locations_order_service_select
  on public.store_locations
  for select
  to gadgetmoto_order_service
  using (true);

create policy inventory_levels_order_service_select
  on public.inventory_levels
  for select
  to gadgetmoto_order_service
  using (true);

create policy inventory_levels_order_service_update
  on public.inventory_levels
  for update
  to gadgetmoto_order_service
  using (true)
  with check (true);

create policy order_submissions_order_service_select
  on public.order_submissions
  for select
  to gadgetmoto_order_service
  using (true);

create policy order_submissions_order_service_insert
  on public.order_submissions
  for insert
  to gadgetmoto_order_service
  with check (true);

create policy order_submissions_order_service_update
  on public.order_submissions
  for update
  to gadgetmoto_order_service
  using (true)
  with check (true);

create policy orders_order_service_select
  on public.orders
  for select
  to gadgetmoto_order_service
  using (true);

create policy orders_order_service_insert
  on public.orders
  for insert
  to gadgetmoto_order_service
  with check (true);

create policy order_addresses_order_service_select
  on public.order_addresses
  for select
  to gadgetmoto_order_service
  using (true);

create policy order_addresses_order_service_insert
  on public.order_addresses
  for insert
  to gadgetmoto_order_service
  with check (true);

create policy order_items_order_service_select
  on public.order_items
  for select
  to gadgetmoto_order_service
  using (true);

create policy order_items_order_service_insert
  on public.order_items
  for insert
  to gadgetmoto_order_service
  with check (true);

create policy order_fulfillments_order_service_select
  on public.order_fulfillments
  for select
  to gadgetmoto_order_service
  using (true);

create policy order_fulfillments_order_service_insert
  on public.order_fulfillments
  for insert
  to gadgetmoto_order_service
  with check (true);

create policy payments_order_service_select
  on public.payments
  for select
  to gadgetmoto_order_service
  using (true);

create policy payments_order_service_insert
  on public.payments
  for insert
  to gadgetmoto_order_service
  with check (true);

create policy inventory_reservations_order_service_select
  on public.inventory_reservations
  for select
  to gadgetmoto_order_service
  using (true);

create policy inventory_reservations_order_service_insert
  on public.inventory_reservations
  for insert
  to gadgetmoto_order_service
  with check (true);

create policy inventory_reservations_order_service_update
  on public.inventory_reservations
  for update
  to gadgetmoto_order_service
  using (true)
  with check (true);

create policy inventory_movements_order_service_insert
  on public.inventory_movements
  for insert
  to gadgetmoto_order_service
  with check (true);

create policy audit_logs_order_service_insert
  on public.audit_logs
  for insert
  to gadgetmoto_order_service
  with check (true);

grant usage on schema public to gadgetmoto_order_service;

grant select on table
  public.brands,
  public.products,
  public.product_variants,
  public.store_locations
to gadgetmoto_order_service;

grant select on table public.inventory_levels
  to gadgetmoto_order_service;
grant update (quantity_on_hand, quantity_reserved)
  on table public.inventory_levels
  to gadgetmoto_order_service;

grant select, insert on table
  public.order_submissions,
  public.orders,
  public.order_addresses,
  public.order_items,
  public.order_fulfillments,
  public.payments,
  public.inventory_reservations
to gadgetmoto_order_service;

grant update (order_id, completed_at)
  on table public.order_submissions
  to gadgetmoto_order_service;

grant update (status, resolved_at)
  on table public.inventory_reservations
  to gadgetmoto_order_service;

grant insert on table
  public.inventory_movements,
  public.audit_logs
to gadgetmoto_order_service;

-- The existing unique public order number and payment-provider event indexes
-- remain authoritative. No direct browser role receives a policy or grant.
-- A future manually provisioned server login may inherit only
-- gadgetmoto_order_service; this migration creates no LOGIN role or secret.
