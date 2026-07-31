# GadgetMoTo Storefront Launch Status

## Customer-facing storefront

The production storefront is complete for its approved contact-first launch
state. It preserves the established light-blue and white visual direction,
mobile-first layout, and GSAP hero motion.

Completed and validated:

- Homepage content flow and navigation
- Shop, phones, and tablets catalog pages
- Coming Soon page with all 68 unique folder candidates shown as
  non-purchasable previews
- Sixty-eight static Coming Soon preview routes, 67 assigned primary images,
  two additional gallery images, and one safe unresolved-identity placeholder
- Twelve unique product-detail routes
- Twelve canonical and unique product SKUs and slugs
- Product search, comparison, cart, and checkout interface
- Contact page and Facebook Messenger ordering path
- Eleven original-aspect approved product images and the POCO C85 generated
  placeholder
- Verified catalog specifications and corrected memory variants
- Consistent square, centered, non-cropping product media
- Explicit primary-image and non-duplicating gallery data shared across every
  catalog consumer
- Product, cart, search, comparison, and checkout empty states
- Header, mobile navigation, footer, global not-found, loading, and error states
- Responsive review at 320, 375, 430, 768, 1024, and 1440 pixels
- Keyboard, labeling, focus, dialog, form-error, and alt-text review
- Route-specific metadata, product metadata, canonical URLs, Open Graph,
  Twitter metadata, sitemap, and robots directives
- Secure order endpoint code retained for controlled future activation
- Secure Supabase staff login, protected admin shell, read-only dashboard, and
  protected product management
- Searchable, filterable, paginated admin product list; validated draft
  creation; product and variant editing; 800 ms autosave with manual fallback;
  archival; and guarded unused-draft deletion
- Automatic catalog audit triggers and storefront route revalidation after
  successful administrator mutations
- Vercel project connected to `origin/main`; pushes trigger production
  redeployment
- All 68 Coming Soon products have unique short and full descriptions,
  product-specific metadata, and responsive preview layouts
- Thirty-five Coming Soon products display officially verified highlights and
  specifications; incomplete or unresolved records hide those sections

## Current ordering mode

Live online submission is disabled by default and may be activated later only
with the server-side `ONLINE_ORDERING_ENABLED` configuration. No value is stored
in this repository.

While disabled:

- Checkout never calls `POST /api/orders`.
- Cart contents remain available and are not deleted.
- Customers can review their items and deliberately continue through Facebook
  Messenger.
- No order number, payment success, stock quantity, delivery charge, or VAT
  amount is fabricated.
- Products remain visible and use: “Contact us to confirm availability.”
- Checkout states: “Online order submission is currently unavailable. Please
  contact us to complete your order.”
- Checkout also states: “Contact us to confirm product availability, delivery
  charges, and payment instructions.”
- Pickup and cash on delivery remain unavailable.
- Maya and financing partners remain informational only.

`POST /api/orders` remains compiled for later controlled activation and fails
safely when ordering or database configuration is unavailable. It has not been
called during storefront completion. No order, reservation, payment, database
connection, query, SQL command, or Supabase command occurred.

## Data and deployment boundary

- The catalog remains exactly 12 products.
- The image-folder review found 68 incomplete candidate products represented by
  70 source files. Sixty-nine confidently mapped images are assigned across 67
  products; one ambiguous image remains unassigned and its neutral record uses
  a placeholder. All 68 products are visible once at `/coming-soon` and remain
  excluded from purchasing and every transactional catalog consumer. Their
  descriptions are complete, but this does not constitute commercial approval.
- The catalog remains 12 unique SKUs and 12 unique slugs, with 11 approved
  primary images and one placeholder.
- The canonical static catalog is the default and build-safe fallback.
- All nine deployed migration files are user-confirmed as synchronized and
  remain unchanged.
- No migration, dependency, environment file, credential, customer record, or
  application secret was added.
- Vercel is connected to the GitHub `main` branch. The completion commit is
  intended to trigger its automatic production deployment.

## Ready to add later

- Starting inventory and stock-reservation readiness
- Branch address, schedule, pickup instructions, and pickup activation
- Secure `ORDER_DATABASE_URL` configuration outside Git
- Controlled order transaction and endpoint testing
- Explicit live online-order activation
- Approved automatic delivery-fee rules
- Approved VAT rules and rate
- Maya merchant credentials, server initialization, and verified webhooks
- Admin product-image uploads and gallery controls
- Admin order and inventory tools
- Approved POCO C85 product image
- Final privacy, terms, warranty, cancellation, refund, and retention policies
  supplied or approved by the business
