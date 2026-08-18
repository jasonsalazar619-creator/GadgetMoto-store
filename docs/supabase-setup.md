# GadgetMoTo Supabase Setup

- Hosted project name: gadgetmoto-store
- Hosted project region: Southeast Asia (Singapore)
- The hosted project is healthy.
- Forward-only migration `20260812143000_pending_inventory_order_submission.sql` was dry-run as the only pending migration and deployed successfully. Its local and remote history versions match. It permits a fulfillment to remain without an assigned location only while it is pending confirmation; it creates no location, inventory, reservation, public access, or seed data.
- The confirmed region is Southeast Asia (Singapore).
- Secure order migration `20260726121534_secure_order_transaction_schema.sql` was deployed successfully, and migration version `20260726121534` matches locally and remotely.
- The secure order migration created schema and a non-login privilege role only; it contains no login credential, password, environment value, record, browser policy, tax rule, delivery-fee rule, or payment-provider behavior.
- All nine deployed migrations are user-confirmed as synchronized, immutable, and unchanged during storefront completion.
- Corrective migration
  `20260726175847_correct_product_physical_ram.sql` is deployed and synchronized.
  It preserves both canonical SKUs and changes only the
  approved physical-RAM and display-variant fields.
- The uncalled server-only order-service code targets the deployed secure-order schema.
- `ORDER_DATABASE_URL` remains unset, no order database client was instantiated, and no order connection or query occurred during order-service implementation.
- The Supabase CLI is installed as a project development dependency.
- Supabase commands on this Windows computer must use `npx.cmd`.
- `supabase/` contains version-controlled database configuration and will contain future migrations.
- Database planning is documented in `docs/database-schema.md`.
- CLI login succeeded through the manual browser flow.
- The repository is linked to the healthy hosted `gadgetmoto-store` project in Southeast Asia (Singapore).
- CLI authentication and credentials remain outside the repository.
- Catalog Migration 1 was successfully deployed to the healthy hosted GadgetMoTo project in Southeast Asia (Singapore).
- Migration version `20260717145303` now matches in local and remote migration history.
- The migration created `brands`, `products`, `product_variants`, `product_images`, and `store_locations`.
- The migration also created the reviewed enums and the `updated_at` trigger helper.
- All five catalog tables have RLS enabled and zero RLS policies.
- The catalog tables remain disabled from Data API access.
- No seed data or public storefront database access exists yet.
- A Docker-related catalog-cache warning was non-blocking and did not prevent deployment.
- Schema changes must continue through version-controlled migration files.
- Inventory Migration 2 was successfully deployed to the healthy hosted GadgetMoTo project in Southeast Asia (Singapore).
- Migration version `20260717160808` now matches in local and remote migration history.
- The migration created `inventory_levels` and `inventory_movements`.
- Both inventory tables have RLS enabled and zero RLS policies.
- Both inventory tables remain disabled from Data API access.
- No inventory data exists, and exact inventory quantities remain unavailable to public users.
- Transactional stock mutation, reservations, expiry, and preorder behavior remain deferred.
- The Docker-related catalog-cache warning was non-blocking.
- All future schema changes must use new timestamped migration files.
- Commerce Migration 3 was successfully deployed to the healthy hosted GadgetMoTo project in Southeast Asia (Singapore).
- Migration version `20260717164359` now matches in local and remote migration history.
- The migration created seven empty commerce tables and added the inventory movement staff reference.
- Fourteen application tables now exist, and all currently contain zero rows.
- All seven commerce tables have RLS enabled and zero policies.
- The commerce tables remain disabled from Data API access.
- No staff accounts, orders, payments, payment events, or seed records were created.
- The Docker-related catalog-cache warning was non-blocking and did not prevent deployment.
- Migration 4 was successfully deployed to the healthy hosted GadgetMoTo project in Southeast Asia (Singapore).
- Migration version `20260717184621` now matches in local and remote migration history.
- The migration created the empty `price_alert_subscriptions`, `homepage_sections`, `homepage_section_products`, and `audit_logs` tables.
- The hosted application schema now contains 18 tables, all with zero rows.
- All four Migration 4 tables have RLS enabled and zero policies.
- The Migration 4 tables remain disabled from Data API access.
- No subscribers, homepage content, placements, audit records, integrations, or seed data were created.
- The Docker-related catalog-cache warning was non-blocking and did not prevent deployment.
- The six migrations deployed by that stage remain unchanged; future schema or data corrections must use new timestamped migrations.
- Initial production catalog data is deployed and manually verified.
- No seed file exists.
- Catalog bootstrap migration `20260717205111_catalog_bootstrap_data.sql` is deployed and immutable.
- The catalog bootstrap migration was deployed successfully.
- Migration version `20260717205111` now matches locally and remotely.
- Remote catalog row counts are 6 brands, 12 products, and 12 variants; every other application table remains empty.
- Manual Table Editor checks confirmed product and variant parity.
- The Docker catalog-cache warning was non-blocking.
- No Dashboard record edits were made.
- Static application data remains the live storefront source.
- Future corrections must use a new timestamped migration or a protected administrative workflow.
- Database-backed catalog integration is in planning.
- Data API access remains disabled.
- No RLS policy or grant was added.
- No environment credential or application dependency was added.
- The hosted database was unchanged by this planning checkpoint.
- Catalog ordering and secure read-access decisions are approved.
- Ordering and secure read-model migration `20260717234135_catalog_ordering_storefront_read_model.sql` deployed successfully.
- Migration version `20260717234135` now matches locally and remotely.
- Product ordering from 0 through 11 was manually verified against the approved sequence.
- `storefront.catalog_products` was manually verified with 17 approved columns and 12 catalog rows.
- The `gadgetmoto_storefront_reader` role has login, superuser, role creation, database creation, RLS bypass, and replication disabled, and it has zero active connections.
- No login credential, password, project identifier, environment value, Data API exposure, or browser access was created.
- The Docker-related catalog-cache warning was non-blocking.
- The six migrations deployed by that stage remain unchanged; future migration corrections must use a new timestamped migration.
- The server login role `gadgetmoto_storefront_app` was created manually with `LOGIN` enabled and all five elevated capability toggles disabled.
- The server login role has zero active connections and inherits `gadgetmoto_storefront_reader`.
- Effective `USAGE` on the `storefront` schema and `SELECT` on `storefront.catalog_products` were verified.
- Direct `SELECT` on `public.products` and `public.orders` remains unavailable.
- The credential was not committed or documented.
- Production catalog configuration uses `database-with-static-fallback` with a server-only, least-privilege storefront connection managed outside Git.
- Data API and browser access remain unchanged.
- Postgres.js `3.4.9` is installed for future server-only database access.
- The repository expects `CATALOG_SOURCE` and `STOREFRONT_DATABASE_URL`, but contains no secret values.
- No environment file or connection string was created.
- No connection attempt or query occurred during adapter implementation.
- The server adapter now targets only `storefront.catalog_products`.
- No environment value was created, and no database connection or query occurred while implementing the adapter.
- `gadgetmoto_storefront_app` successfully authenticated through the Session pooler during a controlled local test.
- The storefront catalog view returned 12 validated rows.
- The server adapter completed its query, complete-result validation, normalization, and ordering checks successfully.
- Temporary local environment variables were used and removed.
- No connection string or password was saved in the repository.
- The temporary verification API route was deleted, and no permanent diagnostic endpoint remains.
- Hosted database records, roles, privileges, and migrations remain unchanged.
- Future environments must supply `CATALOG_SOURCE` and `STOREFRONT_DATABASE_URL` securely outside Git. The transaction-pooler client disables prepared statements and uses a one-connection-per-instance ceiling.
- `static` remains the default catalog source.
- Hosted database configuration and records remain unchanged by the adapter checkpoint.
- Project references and credentials remain excluded.
- The project reference, project URL, database password, access tokens, API keys, and connection strings are intentionally excluded.
- API keys and database passwords must never be committed.
- Local Supabase services are not running, and Docker is not required for this checkpoint.
- Admin product-management migration
  `20260731090806_admin_product_management_schema.sql` is deployed and
  synchronized as migration 9.
- The deployed migration provides administrator-only catalog policies,
  guarded deletion, a restricted private `product-images` bucket, reviewed
  storefront read models, and the exact 68-product Coming Soon backfill.
- Supabase SSR authentication uses only
  `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Configuration values remain outside Git and must be supplied separately in
  local and Vercel environments.
- No service-role key, database password, PostgreSQL connection string, staff
  credential, staff account, or populated environment file was added.
- `/admin/login`, the protected `/admin` shell, the protected products
  placeholder, and POST-based logout are implemented.
- Product CRUD and autosave are active for authenticated administrators.
- Product gallery migration `20260816113000_admin_product_gallery_storage.sql`
  is deployed and matches local and remote migration history.
- The additive policy lets active administrators read product-scoped objects
  in the existing private `product-images` bucket for secure previews and
  deletion. It adds no public write path, bucket, table, record, credential, or
  environment value.
- Managed product gallery upload and removal use the existing administrator
  policies and trigger-enforced product-image audit log.
- Primary-image selection and deletion-with-replacement use migration
  `20260816153000_admin_product_primary_image_management.sql`; the existing
  administrator authorization and image audit boundaries remain unchanged.
- Store-pickup location migration
  `20260817120000_store_pickup_location.sql` is deployed. It records
  only the approved Barangay Sabang, Dasmariñas pickup address and active
  branch state. It creates no schedule, instructions, inventory, policy,
  privilege, credential, or public database path.
- Catalog variant-ordering migration
  `20260819120000_catalog_variant_ordering.sql` is deployed. It
  appends the existing variant sort order to the security-barrier storefront
  read model so an administrator-selected default is deterministic. It adds no
  table, policy, grant, public access, seed data, or write path.
- Both migrations were manually deployed and verified. All 18 migration
  versions now match in local and remote history. Future changes must use a new
  timestamped migration; neither deployed file may be edited in place.
