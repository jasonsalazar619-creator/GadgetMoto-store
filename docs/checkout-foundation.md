# GadgetMoTo Checkout Foundation

## Architecture and guest scope

`/checkout` remains a Server Component route using the shared storefront shell. A focused `CheckoutForm` Client Component consumes cart items that the cart provider resolves from the shared server-initialized catalog payload, then owns only transient guest form, validation, delivery, payment, consent, and review state. Current product names and prices are never restored from copied browser product objects. No order is submitted, stored, emailed, numbered, or paid.

## Fields and validation

Checkout collects full name, Philippine mobile number, required email, conditional street/province/city/barangay/postal address, and optional 500-character notes. Typed React state and native input semantics are supplemented with validation on Review Order, inline associated errors, an error summary, and first-invalid-field focus. Customer details are never written to localStorage; draft persistence is deferred. Selecting Maya Payment opens the approved Maya amount-entry invoice in a separate tab and keeps the checkout draft available. The order is submitted first; its confirmation view then lets the customer attach, preview, remove before upload, or replace a validated JPEG, PNG, WebP, or PDF proof of no more than 8 MB. A redirect or proof attachment never marks an order paid; administrator review and matching confirmed amounts remain mandatory.

## Delivery and payment behavior

Nationwide and same-day delivery require address fields. The checkout delivery selector applies the selected fulfillment method to every cart line, so customers can freely switch an order between Delivery and Store Pickup without returning to a product page. Store pickup preserves typed delivery-address state while hiding it as unnecessary and uses the approved GadgetMoTo pickup location at LOT 1 DON PLACEDO CAMPUS AVE BRGY SABANG, Dasmariñas, Philippines, 4114. Pickup timing and product availability remain pending confirmation. Customer-facing payment choices are Maya Payment and Cash on Store Pickup only when pickup is selected; GCash and Bank Transfer are no longer offered in checkout. A financing-inquiry option is available only when every cart item is marked financing-eligible. It does not create an order or financing application: after explicit acknowledgement, the browser prepares and copies the entered customer, address or pickup location, product, variant, color, quantity, current cash-price, subtotal, and fulfillment-preference details, then opens the official GadgetMoTo Messenger conversation for the customer to review, paste, and send. No personal details are placed in the Messenger URL, and no financing provider, installment amount, term, fee, eligibility, or approval is assumed.

Each product detail page presents accessible, combined color and RAM/storage choices. Only an exact combination enabled by an administrator can be selected or added to cart; unavailable combinations remain visible and disabled. Products without colors continue to use their commercial RAM/storage variants normally. Additional RAM sizes, colors, SKUs, or prices must not be fabricated.

The forward-only migration `20260817120000_store_pickup_location.sql` creates or reconciles the approved active branch record. It does not add pickup instructions, schedules, inventory, or public database access. The storefront code requires that exact active branch slug, and the server transaction verifies it again before accepting pickup fulfillment.

## Confirmations and review-only flow

Privacy Policy, Terms and Conditions, and pending availability/VAT/delivery/payment acknowledgements are separate and unchecked by default. A valid review shows customer, delivery, payment, catalog-resolved live items, line totals, and the current merchandise subtotal, while VAT, delivery fee, and final payable amount remain pending. It prominently states that no order or payment exists and provides editing and Messenger actions—never Place Order.

## Catalog integration status

Checkout is catalog-integrated through the shared `CatalogProvider` and `CartProvider` boundary. Browser persistence continues to contain only stable product slug, exact supported variant label, and quantity; checkout calculations use current resolved catalog prices. Customer details, checkout review data, cart data, and order data are not sent to Supabase. Order creation, inventory reservation, customer submission, and live Maya payment processing remain pending backend phases.

## Cart changes and coexistence

Live cart changes update the summary and invalidate an existing review. An empty cart replaces the form with recovery navigation. Checkout shares the existing search, comparison, and cart providers without duplication or resetting their state.

## Policies, accessibility, and mobile

`/privacy-policy` and `/terms-and-conditions` are visibly marked pre-launch drafts requiring review and contain no invented guarantees. Checkout uses one H1, logical section headings, fieldsets and legends, descriptive policy links, live review guidance, keyboard-accessible controls, visible focus, and non-color error text. Desktop uses a two-column form/summary layout; mobile stacks into one readable column without horizontal overflow.

## Future integrations

A future Supabase workflow must validate canonical products, prices, inventory, customer details, and consent server-side before creating an order. Maya Checkout must begin and confirm payment through trusted server endpoints and never rely on a browser redirect alone. Courier selection, address validation, delivery fees, and tax calculation remain deferred until verified business rules and applicable rates are approved.
