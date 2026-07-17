create table public.staff_profiles (
  user_id uuid primary key references auth.users (id) on update cascade on delete cascade,
  display_name text not null,
  role public.staff_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint staff_profiles_display_name_not_blank check (btrim(display_name) <> '')
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  public_order_number text not null,
  status public.order_status not null default 'pending_review',
  customer_full_name text not null,
  customer_mobile text not null,
  customer_email text not null,
  delivery_method public.delivery_method not null,
  payment_method public.payment_method not null,
  merchandise_subtotal_centavos bigint not null,
  vat_rate_bps integer,
  vat_amount_centavos bigint,
  delivery_fee_centavos bigint,
  final_total_centavos bigint,
  customer_notes text,
  internal_notes text,
  consent_privacy_at timestamptz not null,
  consent_terms_at timestamptz not null,
  consent_final_review_at timestamptz not null,
  reviewed_by uuid references public.staff_profiles (user_id) on update cascade on delete set null,
  reviewed_at timestamptz,
  confirmed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_public_order_number_not_blank check (btrim(public_order_number) <> ''),
  constraint orders_customer_full_name_not_blank check (btrim(customer_full_name) <> ''),
  constraint orders_customer_mobile_not_blank check (btrim(customer_mobile) <> ''),
  constraint orders_customer_email_not_blank check (btrim(customer_email) <> ''),
  constraint orders_merchandise_subtotal_nonnegative check (merchandise_subtotal_centavos >= 0),
  constraint orders_vat_rate_valid check (vat_rate_bps is null or vat_rate_bps between 0 and 10000),
  constraint orders_vat_amount_nonnegative check (vat_amount_centavos is null or vat_amount_centavos >= 0),
  constraint orders_delivery_fee_nonnegative check (delivery_fee_centavos is null or delivery_fee_centavos >= 0),
  constraint orders_final_total_nonnegative check (final_total_centavos is null or final_total_centavos >= 0),
  constraint orders_customer_notes_not_blank check (customer_notes is null or btrim(customer_notes) <> ''),
  constraint orders_internal_notes_not_blank check (internal_notes is null or btrim(internal_notes) <> ''),
  constraint orders_cash_pickup_compatibility check (payment_method <> 'cash_on_pickup' or delivery_method = 'store_pickup'),
  constraint orders_review_pair check ((reviewed_by is null) = (reviewed_at is null))
);

create table public.order_addresses (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on update cascade on delete cascade,
  street_address text not null,
  province text not null,
  city_municipality text not null,
  barangay text not null,
  postal_code text not null,
  created_at timestamptz not null default now(),
  constraint order_addresses_order_unique unique (order_id),
  constraint order_addresses_street_not_blank check (btrim(street_address) <> ''),
  constraint order_addresses_province_not_blank check (btrim(province) <> ''),
  constraint order_addresses_city_not_blank check (btrim(city_municipality) <> ''),
  constraint order_addresses_barangay_not_blank check (btrim(barangay) <> ''),
  constraint order_addresses_postal_code_not_blank check (btrim(postal_code) <> '')
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on update cascade on delete cascade,
  product_id uuid references public.products (id) on update cascade on delete set null,
  variant_id uuid references public.product_variants (id) on update cascade on delete set null,
  product_name_snapshot text not null,
  brand_name_snapshot text not null,
  variant_snapshot text not null,
  sku_snapshot text not null,
  unit_price_centavos bigint not null,
  quantity integer not null,
  line_total_centavos bigint not null,
  created_at timestamptz not null default now(),
  constraint order_items_product_name_not_blank check (btrim(product_name_snapshot) <> ''),
  constraint order_items_brand_name_not_blank check (btrim(brand_name_snapshot) <> ''),
  constraint order_items_variant_not_blank check (btrim(variant_snapshot) <> ''),
  constraint order_items_sku_not_blank check (btrim(sku_snapshot) <> ''),
  constraint order_items_unit_price_nonnegative check (unit_price_centavos >= 0),
  constraint order_items_quantity_valid check (quantity between 1 and 99),
  constraint order_items_line_total_nonnegative check (line_total_centavos >= 0),
  constraint order_items_line_total_valid check (line_total_centavos = unit_price_centavos * quantity::bigint)
);

create table public.order_fulfillments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on update cascade on delete cascade,
  status public.fulfillment_status not null default 'pending_confirmation',
  location_id uuid references public.store_locations (id) on update cascade on delete restrict,
  courier_name text,
  tracking_number text,
  same_day_confirmation_notes text,
  pickup_schedule timestamptz,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint order_fulfillments_order_unique unique (order_id),
  constraint order_fulfillments_courier_not_blank check (courier_name is null or btrim(courier_name) <> ''),
  constraint order_fulfillments_tracking_not_blank check (tracking_number is null or btrim(tracking_number) <> ''),
  constraint order_fulfillments_same_day_notes_not_blank check (same_day_confirmation_notes is null or btrim(same_day_confirmation_notes) <> '')
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on update cascade on delete cascade,
  method public.payment_method not null,
  status public.payment_status not null default 'pending',
  amount_centavos bigint,
  external_reference text,
  provider_checkout_id text,
  provider_payment_id text,
  proof_storage_path text,
  staff_notes text,
  verified_by uuid references public.staff_profiles (user_id) on update cascade on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_nonnegative check (amount_centavos is null or amount_centavos >= 0),
  constraint payments_external_reference_not_blank check (external_reference is null or btrim(external_reference) <> ''),
  constraint payments_provider_checkout_not_blank check (provider_checkout_id is null or btrim(provider_checkout_id) <> ''),
  constraint payments_provider_payment_not_blank check (provider_payment_id is null or btrim(provider_payment_id) <> ''),
  constraint payments_proof_path_not_blank check (proof_storage_path is null or btrim(proof_storage_path) <> ''),
  constraint payments_staff_notes_not_blank check (staff_notes is null or btrim(staff_notes) <> ''),
  constraint payments_verification_pair check ((verified_by is null) = (verified_at is null))
);

create table public.payment_events (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments (id) on update cascade on delete cascade,
  event_type text not null,
  external_event_id text,
  payload jsonb,
  created_at timestamptz not null default now(),
  constraint payment_events_type_not_blank check (btrim(event_type) <> ''),
  constraint payment_events_external_id_not_blank check (external_event_id is null or btrim(external_event_id) <> ''),
  constraint payment_events_payload_object check (payload is null or jsonb_typeof(payload) = 'object')
);

alter table public.inventory_movements
  add constraint inventory_movements_created_by_staff_fk
  foreign key (created_by) references public.staff_profiles (user_id)
  on update cascade on delete set null;

create index staff_profiles_active_role_idx on public.staff_profiles (role) where is_active;
create unique index orders_public_order_number_uidx on public.orders (public_order_number);
create index orders_status_created_idx on public.orders (status, created_at desc);
create index orders_customer_email_created_idx on public.orders (lower(customer_email), created_at desc);
create index order_items_order_idx on public.order_items (order_id);
create index payments_order_created_idx on public.payments (order_id, created_at desc);
create unique index payments_provider_checkout_uidx on public.payments (provider_checkout_id) where provider_checkout_id is not null;
create unique index payments_provider_payment_uidx on public.payments (provider_payment_id) where provider_payment_id is not null;
create unique index payments_method_external_reference_uidx on public.payments (method, external_reference) where external_reference is not null;
create index payment_events_payment_created_idx on public.payment_events (payment_id, created_at desc);
create unique index payment_events_external_event_uidx on public.payment_events (external_event_id) where external_event_id is not null;

create trigger staff_profiles_set_updated_at
before update on public.staff_profiles
for each row execute function public.set_updated_at();

create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create trigger order_fulfillments_set_updated_at
before update on public.order_fulfillments
for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.staff_profiles enable row level security;
alter table public.orders enable row level security;
alter table public.order_addresses enable row level security;
alter table public.order_items enable row level security;
alter table public.order_fulfillments enable row level security;
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;

revoke all on table public.staff_profiles from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
revoke all on table public.order_addresses from anon, authenticated;
revoke all on table public.order_items from anon, authenticated;
revoke all on table public.order_fulfillments from anon, authenticated;
revoke all on table public.payments from anon, authenticated;
revoke all on table public.payment_events from anon, authenticated;

comment on table public.staff_profiles is 'Application authorization records for Supabase Auth users. Client-controlled authentication metadata is untrusted; customer profiles are outside launch scope. RLS is enabled with no policies, anon and authenticated privileges are revoked, and staff/server access remains deferred.';
comment on table public.orders is 'Private order records containing PII. UUIDs are internal, public order numbers are assigned by trusted server logic, and browser totals are untrusted. RLS is enabled with no policies and no anonymous order or personal-data path.';
comment on table public.order_addresses is 'Purchase-time delivery snapshots. Future trusted delivery workflows require one address; pickup orders require none. This is not an address book. RLS is enabled with no policies and public-facing privileges revoked.';
comment on table public.order_items is 'Authoritative purchase snapshots with informational catalog references. Prices must be loaded by trusted server logic. RLS is enabled with no policies and public-facing privileges revoked.';
comment on table public.order_fulfillments is 'One fulfillment per launch order. Split fulfillment and pickup/delivery compatibility enforcement are deferred. RLS is enabled with no policies and public-facing privileges revoked.';
comment on table public.payments is 'Multiple payment attempts may exist per order. Browser redirects do not prove payment; provider or webhook data requires server verification and secrets are prohibited. RLS is enabled with no policies and no anonymous payment path.';
comment on table public.payment_events is 'Append-only payment event history. External IDs support idempotency; payloads must be minimized and contain no sensitive data. RLS is enabled with no policies and public-facing privileges revoked.';

comment on column public.orders.public_order_number is 'Customer-facing identifier assigned by trusted server logic.';
comment on column public.order_items.product_id is 'Informational catalog reference; the snapshot fields remain authoritative.';
comment on column public.order_items.variant_id is 'Informational catalog reference; the snapshot fields remain authoritative.';
comment on column public.payment_events.payload is 'Minimized provider event metadata only; never store secrets or full sensitive payloads.';
