# GadgetMoTo Content, Alerts, and Audit Migration 4 Plan

## Status and scope

This document is implementation planning, not executable SQL. Migration 4 has not been created, and no database command has been run. It plans four remaining approved application tables: `price_alert_subscriptions`, `homepage_sections`, `homepage_section_products`, and `audit_logs`.

No public alert-subscription workflow exists yet. No homepage content has been seeded, and no audit-trigger automation exists. Public reads and guest writes remain deferred to later reviewed migrations and trusted server workflows. Migration 4 will introduce no public access, policies, functions, automation, or seed records.

## `price_alert_subscriptions`

Purpose: store guest requests for product-variant price-drop notifications while keeping subscriber information private.

| Column | Planned definition |
| --- | --- |
| `id` | `uuid primary key default gen_random_uuid()` |
| `variant_id` | `uuid not null` |
| `email` | `text not null` |
| `status` | `public.price_alert_status not null default 'active'` |
| `consent_at` | `timestamptz not null` |
| `last_notified_price_centavos` | `bigint null` |
| `last_notified_at` | `timestamptz null` |
| `unsubscribe_token_hash` | `text not null` |
| `created_at` | `timestamptz not null default now()` |
| `updated_at` | `timestamptz not null default now()` |

The `variant_id` foreign key references `public.product_variants(id)` with `ON UPDATE CASCADE` and `ON DELETE RESTRICT`.

Planned constraints:

- Trimmed `email` and `unsubscribe_token_hash` must not be blank.
- `last_notified_price_centavos` must be nonnegative when supplied.
- `last_notified_price_centavos` and `last_notified_at` must either both be populated or both be null.
- `unsubscribe_token_hash` must be unique.
- `status` reuses the existing `public.price_alert_status` enum.

### Email, token, and uniqueness strategy

The submitted email is preserved for operational delivery. Uniqueness comparisons use `lower(trim(email))`; the database does not claim complete RFC email validation, so application or trusted-server validation remains required.

Plaintext unsubscribe tokens must never be stored. Trusted server logic will generate a high-entropy token, store only its cryptographic hash, and compare hashes during unsubscribe handling. The hashing implementation remains unresolved and is not invented here.

Only one active subscription may exist for the same normalized email and variant. A partial unique index may cover `variant_id` and `lower(trim(email))` where `status = 'active'`. Historical notified or unsubscribed rows may remain for operational history, subject to future retention requirements.

Planned indexes:

- `variant_id` plus `status`.
- Normalized email only where an operational query justifies it.
- Unique `unsubscribe_token_hash`.
- Partial unique active subscription per variant and normalized email.

One `updated_at` trigger will reuse `public.set_updated_at()`.

Security intent:

- No direct anonymous insert and no public read.
- No authenticated non-staff access.
- Future creation and unsubscribe actions require validated trusted server logic.
- Subscriber emails and token hashes must never appear in public storefront responses.

## `homepage_sections`

Purpose: store staff-managed homepage presentation and copy without duplicating canonical catalog data.

| Column | Planned definition |
| --- | --- |
| `id` | `uuid primary key default gen_random_uuid()` |
| `section_key` | `text not null` |
| `title` | `text null` |
| `subtitle` | `text null` |
| `content` | `jsonb not null default '{}'::jsonb` |
| `is_active` | `boolean not null default true` |
| `sort_order` | `integer not null default 0` |
| `starts_at` | `timestamptz null` |
| `ends_at` | `timestamptz null` |
| `created_at` | `timestamptz not null default now()` |
| `updated_at` | `timestamptz not null default now()` |

Planned constraints:

- `section_key` must be nonblank, lowercase, unique, and match a safe lowercase letters, numbers, and hyphen-separated pattern.
- Optional `title` and `subtitle` must not contain only whitespace.
- `content` must be a JSON object.
- `sort_order` must be zero or greater.
- `ends_at` must be later than `starts_at` when both are supplied.

JSON content is limited to flexible presentation settings and supporting copy. Products, variants, prices, inventory, orders, and payments must not be embedded as authoritative JSON. Product placements belong in `homepage_section_products`. The application must later define and validate the supported content structure for each section key.

Scheduled content is active only when `is_active` is true and the current timestamp falls within every supplied start/end boundary. Migration 4 will insert no homepage section records.

Planned indexes:

- Unique `section_key`.
- Active, scheduled, ordered lookup using `is_active`, `starts_at`, `ends_at`, and `sort_order` where justified.

One `updated_at` trigger will reuse `public.set_updated_at()`.

## `homepage_section_products`

Purpose: associate curated canonical products or variants with a homepage section.

| Column | Planned definition |
| --- | --- |
| `id` | `uuid primary key default gen_random_uuid()` |
| `section_id` | `uuid not null` |
| `product_id` | `uuid null` |
| `variant_id` | `uuid null` |
| `sort_order` | `integer not null default 0` |
| `created_at` | `timestamptz not null default now()` |

Planned foreign keys:

- `section_id -> public.homepage_sections(id)` with `ON UPDATE CASCADE` and `ON DELETE CASCADE`.
- `product_id -> public.products(id)` with `ON UPDATE CASCADE` and `ON DELETE RESTRICT`.
- `variant_id -> public.product_variants(id)` with `ON UPDATE CASCADE` and `ON DELETE RESTRICT`.

Exactly one of `product_id` or `variant_id` must be populated, using `num_nonnulls(product_id, variant_id) = 1` or an equally clear constraint. `sort_order` must be zero or greater.

Separate partial unique indexes prevent duplicate product and variant placements within one section:

- `section_id, product_id` where `product_id is not null`.
- `section_id, variant_id` where `variant_id is not null`.

An additional `section_id, sort_order` index supports ordered placement reads.

Placement rows reference canonical catalog records. Product names, brands, prices, availability, and inventory remain authoritative in catalog and inventory tables; placements do not duplicate them. No `updated_at` column or trigger is planned because placements are simple ordered associations. Later content workflows may delete and recreate placements transactionally.

## `audit_logs`

Purpose: preserve append-only records of important staff and trusted-server administrative actions.

| Column | Planned definition |
| --- | --- |
| `id` | `uuid primary key default gen_random_uuid()` |
| `actor_user_id` | `uuid null` |
| `action` | `text not null` |
| `entity_type` | `text not null` |
| `entity_id` | `uuid null` |
| `before_data` | `jsonb null` |
| `after_data` | `jsonb null` |
| `created_at` | `timestamptz not null default now()` |

The `actor_user_id` foreign key references `public.staff_profiles(user_id)` with `ON UPDATE CASCADE` and `ON DELETE SET NULL`. A null actor supports trusted server or system actions.

Planned constraints:

- Trimmed `action` and `entity_type` must not be blank and together describe a meaningful change or event.
- `before_data` and `after_data` must be JSON objects when supplied.
- `entity_id` remains optional because system-level events may not target one row.

Planned indexes:

- `actor_user_id` plus `created_at desc`.
- `entity_type`, `entity_id`, and `created_at desc`.
- `action` plus `created_at` only if a real administrative query justifies it.

Audit logs have no `updated_at` column or trigger. They are append-only in intent and should not normally be updated or deleted. Append-only enforcement and role-specific policies remain deferred.

Audit JSON must be minimized. Secrets, access tokens, passwords, card information, PINs, provider credentials, and complete banking details must never be logged. Personal customer data must not be copied unless strictly necessary. Logging, retention, and deletion requirements require later privacy and legal review; no retention period is assumed. Migration 4 creates no automatic audit triggers; later trusted application and database workflows will write explicit events where appropriate.

Candidate future audited actions include product creation, archival and major edits; variant price changes; inventory adjustments; order-status changes; payment verification or refund-status changes; staff-role or active-status changes; and homepage publishing changes. Not every read action requires an audit row.

## `updated_at` strategy

Migration 4 will plan `updated_at` columns and triggers only for:

- `price_alert_subscriptions`
- `homepage_sections`

No `updated_at` column or trigger is planned for `homepage_section_products` or `audit_logs`. Homepage placements are simple associations, while audit records are append-only historical events that must not be casually rewritten.

## Security, RLS, and privileges

All four tables will enable RLS immediately, create zero policies, revoke all table privileges from `anon` and `authenticated`, add no public grants, keep Data API access unavailable, and introduce no anonymous insert or public-read path.

- Alert subscriber information is private. Future guest creation and unsubscribe actions require trusted server validation.
- Homepage tables receive no public read access in Migration 4. Draft, inactive, and scheduled content must not become publicly visible accidentally.
- Audit logs are for staff and trusted-server access only. Authenticated non-staff access is prohibited.
- Staff policies, trusted-server access mechanisms, and append-only enforcement remain deferred.
- Service-role credentials must never appear in browser code.

## Future homepage public-access options

The later access migration may use one of these approaches:

1. Direct `SELECT` policies on homepage and catalog tables exposing only active, published, currently scheduled content.
2. Restricted database views exposing only approved storefront columns.
3. Trusted server-rendered data access with no browser-facing Data API access.

The application deployment architecture must be reviewed before choosing. No option is implemented in Migration 4 planning.

## Future price-alert workflows

### Subscription

1. Receive email and variant ID through a trusted server endpoint.
2. Normalize and validate the email.
3. Confirm the variant exists and is active.
4. Generate a cryptographically secure unsubscribe token.
5. Store only the token hash.
6. Create or safely reactivate the subscription without duplicate active rows.
7. Send confirmation only through a future approved email provider.
8. Record explicit consent time.
9. Avoid disclosing whether another person's email is already subscribed.

### Price-drop notification

1. A trusted job identifies a verified price reduction.
2. Load active subscriptions.
3. Send through an approved email provider.
4. Record the last notified price and timestamp.
5. Prevent duplicate notifications for the same price.
6. Recheck unsubscribe status before sending.

Scheduled jobs, email integrations, and functions remain unimplemented.

## Homepage-content integrity

Homepage records must not become a second product database. `homepage_sections` stores presentation and copy; `homepage_section_products` stores curated associations and ordering. Canonical product names, brands, prices, availability, and variant information remain in catalog tables.

Inactive, draft, or archived catalog products must not appear publicly. Future storefront queries must verify both section visibility and catalog publication status. Migration 4 will seed no homepage data.

## Index strategy

The proposed indexes are limited to known integrity and operational needs:

- Alerts: variant/status, unique token hash, and partial unique active normalized email/variant.
- Sections: unique key and active/scheduled ordered lookup.
- Placements: ordered section lookup and partial unique product/variant placements.
- Audits: actor/time and entity/type/ID/time.

No speculative full-text, vector, analytics, or other excessive indexes are planned.

## Deletion and retention intent

- Products and variants referenced by homepage placements use restrictive deletion behavior.
- Deleting a homepage section may cascade only its placement rows.
- Alert subscriptions should normally move to `unsubscribed` rather than be casually deleted.
- Subscriber emails and token hashes are private operational data.
- Audit logs should not be casually deleted.
- Final personal-data retention and deletion rules require legal and business review; no retention period is invented.

## Required migration creation order

1. `price_alert_subscriptions`
2. `homepage_sections`
3. `homepage_section_products`
4. `audit_logs`
5. Indexes
6. `updated_at` triggers
7. RLS enablement
8. Privilege revocation
9. Security comments

No new enum is required because `public.price_alert_status` already exists.

## Open decisions

- Price-alert email provider
- Subscription confirmation or double-opt-in requirements
- Email normalization and validation library
- Cryptographic unsubscribe-token hashing implementation
- Price-drop threshold and notification rules
- Alert retention and deletion rules
- Supported homepage section keys
- JSON content schema for each section
- Homepage scheduling and timezone behavior
- Whether storefront reads use direct policies, safe views, or server-only data access
- Audit-event retention
- Which staff actions require audit records
- Whether append-only enforcement requires triggers or restricted update/delete grants
- Final customer-data privacy and retention requirements

These unresolved decisions do not block documentation planning and are not decided in this checkpoint.

## Migration status

Migration 4 is drafted locally as `20260717184621_content_alerts_audit_foundation.sql` and remains unexecuted. It creates the four planned tables and includes immediate RLS enablement and revocation of public-facing table privileges. It creates no policies, public access, records, functions, jobs, email integrations, views, or audit automation. A complete static review and linked remote dry run remain required before any deployment decision.
