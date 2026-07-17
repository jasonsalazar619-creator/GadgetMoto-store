# GadgetMoTo Checkout Foundation

## Architecture and guest scope

`/checkout` remains a Server Component route using the shared storefront shell. A focused `CheckoutForm` Client Component consumes live canonical cart context and owns transient guest form, validation, delivery, payment, consent, and review state. No order is submitted, stored, emailed, numbered, or paid.

## Fields and validation

Checkout collects full name, Philippine mobile number, email, conditional street/province/city/barangay/postal address, and optional 500-character notes. Typed React state and native input semantics are supplemented with validation on Review Order, inline associated errors, an error summary, and first-invalid-field focus. Customer details are never written to localStorage; draft persistence is deferred.

## Delivery and payment behavior

Nationwide and same-day delivery require address fields. Store pickup preserves typed address state while hiding it as unnecessary. Delivery, timing, courier, fees, exact pickup location, and schedule remain pending confirmation. Payment choices are Maya online preview, Maya manual transfer, GCash, bank transfer, and pickup-only cash. Switching from pickup to delivery clears incompatible cash-on-pickup state and provides guidance. No payment credentials or proof are collected.

## Confirmations and review-only flow

Privacy Policy, Terms and Conditions, and pending availability/VAT/delivery/payment acknowledgements are separate and unchecked by default. A valid review shows customer, delivery, payment, live items and canonical subtotal, while VAT, delivery fee, and final payable amount remain pending. It prominently states that no order or payment exists and provides editing and Messenger actions—never Place Order.

## Cart changes and coexistence

Live cart changes update the summary and invalidate an existing review. An empty cart replaces the form with recovery navigation. Checkout shares the existing search, comparison, and cart providers without duplication or resetting their state.

## Policies, accessibility, and mobile

`/privacy-policy` and `/terms-and-conditions` are visibly marked pre-launch drafts requiring review and contain no invented guarantees. Checkout uses one H1, logical section headings, fieldsets and legends, descriptive policy links, live review guidance, keyboard-accessible controls, visible focus, and non-color error text. Desktop uses a two-column form/summary layout; mobile stacks into one readable column without horizontal overflow.

## Future integrations

A future Supabase workflow must validate canonical products, prices, inventory, customer details, and consent server-side before creating an order. Maya Checkout must begin and confirm payment through trusted server endpoints and never rely on a browser redirect alone. Courier selection, address validation, delivery fees, and tax calculation remain deferred until verified business rules and applicable rates are approved.
