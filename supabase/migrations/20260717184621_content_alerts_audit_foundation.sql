create table public.price_alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants (id) on update cascade on delete restrict,
  email text not null,
  status public.price_alert_status not null default 'active',
  consent_at timestamptz not null,
  last_notified_price_centavos bigint,
  last_notified_at timestamptz,
  unsubscribe_token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_alert_subscriptions_email_not_blank check (btrim(email) <> ''),
  constraint price_alert_subscriptions_token_hash_not_blank check (btrim(unsubscribe_token_hash) <> ''),
  constraint price_alert_subscriptions_notified_price_nonnegative check (
    last_notified_price_centavos is null or last_notified_price_centavos >= 0
  ),
  constraint price_alert_subscriptions_notification_pair check (
    (last_notified_price_centavos is null) = (last_notified_at is null)
  )
);

create table public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  title text,
  subtitle text,
  content jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint homepage_sections_key_not_blank check (btrim(section_key) <> ''),
  constraint homepage_sections_key_lowercase check (section_key = lower(section_key)),
  constraint homepage_sections_key_format check (section_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint homepage_sections_title_not_blank check (title is null or btrim(title) <> ''),
  constraint homepage_sections_subtitle_not_blank check (subtitle is null or btrim(subtitle) <> ''),
  constraint homepage_sections_content_object check (jsonb_typeof(content) = 'object'),
  constraint homepage_sections_sort_order_nonnegative check (sort_order >= 0),
  constraint homepage_sections_schedule_valid check (
    starts_at is null or ends_at is null or ends_at > starts_at
  )
);

create table public.homepage_section_products (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.homepage_sections (id) on update cascade on delete cascade,
  product_id uuid references public.products (id) on update cascade on delete restrict,
  variant_id uuid references public.product_variants (id) on update cascade on delete restrict,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint homepage_section_products_owner_exactly_one check (
    num_nonnulls(product_id, variant_id) = 1
  ),
  constraint homepage_section_products_sort_order_nonnegative check (sort_order >= 0)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.staff_profiles (user_id) on update cascade on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_not_blank check (btrim(action) <> ''),
  constraint audit_logs_entity_type_not_blank check (btrim(entity_type) <> ''),
  constraint audit_logs_before_data_object check (
    before_data is null or jsonb_typeof(before_data) = 'object'
  ),
  constraint audit_logs_after_data_object check (
    after_data is null or jsonb_typeof(after_data) = 'object'
  )
);

create unique index price_alert_subscriptions_token_hash_uidx
  on public.price_alert_subscriptions (unsubscribe_token_hash);

create index price_alert_subscriptions_variant_status_idx
  on public.price_alert_subscriptions (variant_id, status);

create unique index price_alert_subscriptions_active_email_variant_uidx
  on public.price_alert_subscriptions (variant_id, lower(btrim(email)))
  where status = 'active'::public.price_alert_status;

create unique index homepage_sections_key_uidx
  on public.homepage_sections (section_key);

create index homepage_sections_schedule_order_idx
  on public.homepage_sections (is_active, sort_order, starts_at, ends_at);

create index homepage_section_products_section_order_idx
  on public.homepage_section_products (section_id, sort_order);

create unique index homepage_section_products_product_uidx
  on public.homepage_section_products (section_id, product_id)
  where product_id is not null;

create unique index homepage_section_products_variant_uidx
  on public.homepage_section_products (section_id, variant_id)
  where variant_id is not null;

create index audit_logs_actor_created_idx
  on public.audit_logs (actor_user_id, created_at desc);

create index audit_logs_entity_created_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);

create trigger price_alert_subscriptions_set_updated_at
before update on public.price_alert_subscriptions
for each row execute function public.set_updated_at();

create trigger homepage_sections_set_updated_at
before update on public.homepage_sections
for each row execute function public.set_updated_at();

alter table public.price_alert_subscriptions enable row level security;
alter table public.homepage_sections enable row level security;
alter table public.homepage_section_products enable row level security;
alter table public.audit_logs enable row level security;

revoke all on table public.price_alert_subscriptions from anon, authenticated;
revoke all on table public.homepage_sections from anon, authenticated;
revoke all on table public.homepage_section_products from anon, authenticated;
revoke all on table public.audit_logs from anon, authenticated;

comment on table public.price_alert_subscriptions is 'Private subscriber emails and token hashes. Plaintext unsubscribe tokens are prohibited. Email normalization and validation require trusted server logic. RLS is enabled with no policies, anon and authenticated privileges are revoked, and future guest/server subscription access requires a separate reviewed migration or trusted workflow.';
comment on table public.homepage_sections is 'Homepage presentation configuration and supporting copy only. Canonical products, prices, inventory, orders, and payments are not authoritative JSON here. No records are seeded. RLS is enabled with no policies, anon and authenticated privileges are revoked, and future storefront/staff access requires a separate reviewed migration or trusted workflow.';
comment on table public.homepage_section_products is 'Simple ordered associations to canonical catalog records. Names, prices, availability, and inventory are not duplicated. RLS is enabled with no policies, anon and authenticated privileges are revoked, and no public homepage-read path exists.';
comment on table public.audit_logs is 'Append-only administrative history in intent. System actors may be null and audit JSON must be minimized. Passwords, access tokens, API keys, card data, PINs, provider secrets, banking details, and unnecessary customer data are prohibited. RLS is enabled with no policies and no public or authenticated non-staff access; future staff/server access and automation require separate review.';

comment on column public.price_alert_subscriptions.unsubscribe_token_hash is 'Cryptographic hash only; plaintext unsubscribe tokens must never be stored.';
comment on column public.homepage_sections.content is 'Validated presentation settings and supporting copy, never authoritative catalog or commerce data.';
comment on column public.audit_logs.before_data is 'Minimized JSON object with no secrets or unnecessary personal data.';
comment on column public.audit_logs.after_data is 'Minimized JSON object with no secrets or unnecessary personal data.';
