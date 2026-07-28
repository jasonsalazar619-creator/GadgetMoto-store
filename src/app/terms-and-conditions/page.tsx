import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
export const metadata: Metadata = {
  title: "Terms and Conditions Draft | GadgetMoTo",
  description: "Read the pre-launch GadgetMoTo terms and conditions draft.",
  alternates: { canonical: "/terms-and-conditions" },
};
export default function TermsPage() { return <StorefrontPageShell><Container className="storefront-container policy-page py-[var(--space-section)]"><p className="type-eyebrow text-[var(--color-action)]">PRE-LAUNCH DRAFT · BUSINESS AND LEGAL REVIEW REQUIRED</p><h1>Terms and Conditions</h1><p>These cautious pre-launch statements require final business and legal review.</p><h2>Products and order confirmation</h2><p>Product prices and availability may change. Contact us to confirm availability before completing an order.</p><h2>VAT, delivery, pickup, and payment</h2><p>VAT treatment, delivery charges, timing, and final payment instructions require sales-team confirmation. Store pickup, cash on delivery, and live Maya payment are currently unavailable. Financing options are informational only.</p><h2>Checkout and contact</h2><p>The current checkout prepares an order inquiry for deliberate customer contact through Messenger. It does not create a binding order, process payment, or provide an order number while online ordering is disabled.</p><p>Final terms must be reviewed and approved before launch. This draft does not invent refund periods, warranty promises, company-registration details, or legal guarantees.</p></Container></StorefrontPageShell>; }
