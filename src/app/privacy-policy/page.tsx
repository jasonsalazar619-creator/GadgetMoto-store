import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy Draft | GadgetMoTo",
  description: "Read the pre-launch GadgetMoTo privacy policy draft.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <StorefrontPageShell>
      <Container className="storefront-container policy-page py-[var(--space-section)]">
        <p className="type-eyebrow text-[var(--color-action)]">
          PRE-LAUNCH DRAFT · BUSINESS AND LEGAL REVIEW REQUIRED
        </p>
        <h1>Privacy Policy</h1>
        <p>
          This cautious draft describes the planned checkout-information
          workflow and requires final business and legal review.
        </p>
        <h2>Information supplied through checkout</h2>
        <p>
          Checkout fields help customers review order or financing inquiries.
          Depending on the selected path, entered contact, address, consent,
          delivery, and product details may be submitted to GadgetMoTo or
          deliberately shared by the customer through an external contact
          service.
        </p>
        <h2>Planned uses</h2>
        <p>
          Supplied information may be used to review orders or financing
          inquiries, contact customers, and coordinate delivery and payment.
          Final retention, access, and deletion rules remain subject to
          business and legal approval.
        </p>
        <h2>Facebook Messenger financing inquiries</h2>
        <p>
          When financing is selected, the browser prepares and copies the
          entered name, address, contact, email, product, variant, color,
          quantity, current cash-price, subtotal, and delivery-preference
          details only after explicit acknowledgement. Personal details are
          not placed in the Messenger URL. The customer opens Facebook
          Messenger, reviews the copied text, and chooses whether to paste and
          send it. Information sent through Messenger is also subject to
          Meta&apos;s terms and privacy practices.
        </p>
        <p>
          This policy requires final business and legal review before launch.
          It does not claim unconfirmed certifications, retention periods, or
          legal guarantees.
        </p>
        <a
          href="https://www.facebook.com/profile.php?id=100063905416187"
          rel="noopener noreferrer"
          target="_blank"
        >
          Contact GadgetMoTo through Facebook Messenger
        </a>
      </Container>
    </StorefrontPageShell>
  );
}
