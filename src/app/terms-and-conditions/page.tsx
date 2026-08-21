import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";

export const metadata: Metadata = {
  title: "Terms and Conditions Draft | GadgetMoTo",
  description: "Read the pre-launch GadgetMoTo terms and conditions draft.",
  alternates: { canonical: "/terms-and-conditions" },
};

export default function TermsPage() {
  return (
    <StorefrontPageShell>
      <Container className="storefront-container policy-page py-[var(--space-section)]">
        <p className="type-eyebrow text-[var(--color-action)]">
          PRE-LAUNCH DRAFT · BUSINESS AND LEGAL REVIEW REQUIRED
        </p>
        <h1>Terms and Conditions</h1>
        <p>
          These cautious pre-launch statements require final business and
          legal review.
        </p>
        <h2>Products and order confirmation</h2>
        <p>
          Product prices and exact variant availability may change. The
          storefront displays the combinations currently enabled for ordering.
        </p>
        <h2>VAT, delivery, pickup, and payment</h2>
        <p>
          VAT treatment, delivery charges, timing, and final payment
          instructions require sales-team confirmation. Store pickup, cash on
          delivery, and live Maya payment remain subject to current site
          availability. Financing options are inquiries only until GadgetMoTo
          confirms the available provider, eligibility requirements,
          installment price, term, down payment, fees, and approval.
        </p>
        <h2>Financing inquiry and contact</h2>
        <p>
          Selecting financing does not create an order, submit a financing
          application, guarantee approval, or process payment. After explicit
          acknowledgement, the website copies the entered checkout details
          locally and opens GadgetMoTo&apos;s Facebook Messenger conversation.
          The customer must review, paste, and deliberately send the inquiry.
        </p>
        <p>
          Final terms must be reviewed and approved before launch. This draft
          does not invent refund periods, warranty promises,
          company-registration details, or legal guarantees.
        </p>
      </Container>
    </StorefrontPageShell>
  );
}
