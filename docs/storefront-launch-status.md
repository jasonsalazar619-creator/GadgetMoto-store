# GadgetMoTo Storefront Launch Status

## Customer-facing storefront

The production storefront is complete for its approved contact-first launch
state. It preserves the established light-blue and white visual direction,
mobile-first layout, and GSAP hero motion.

Completed and validated:

- Homepage content flow and navigation
- Shop, phones, and tablets catalog pages
- Twelve unique product-detail routes
- Twelve canonical and unique product SKUs and slugs
- Product search, comparison, cart, and checkout interface
- Contact page and Facebook Messenger ordering path
- Eleven approved product images and the POCO C85 generated placeholder
- Verified catalog specifications and corrected memory variants
- Consistent square, centered, non-cropping product media
- Product, cart, search, comparison, and checkout empty states
- Header, mobile navigation, footer, global not-found, loading, and error states
- Responsive review at 320, 375, 430, 768, 1024, and 1440 pixels
- Keyboard, labeling, focus, dialog, form-error, and alt-text review
- Route-specific metadata, product metadata, canonical URLs, Open Graph,
  Twitter metadata, sitemap, and robots directives
- Secure order endpoint code retained for controlled future activation
- Vercel project connected to `origin/main`; pushes trigger production
  redeployment

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
- The canonical static catalog is the default and build-safe fallback.
- All eight deployed migration files are user-confirmed as synchronized and
  were not edited during storefront completion.
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
- Staff authentication
- Admin order and inventory tools
- Approved POCO C85 product image
- Final privacy, terms, warranty, cancellation, refund, and retention policies
  supplied or approved by the business
