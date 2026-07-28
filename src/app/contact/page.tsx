import type { Metadata } from "next";
import Link from "next/link";

import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { Container } from "@/components/ui/container";

const messengerUrl =
  "https://www.facebook.com/profile.php?id=100063905416187";

export const metadata: Metadata = {
  title: "Contact GadgetMoTo",
  description:
    "Contact GadgetMoTo through Facebook Messenger for product availability, delivery, and payment guidance.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <StorefrontPageShell>
      <Container className="storefront-container contact-page py-[var(--space-section)]">
        <div className="contact-page__intro">
          <p className="type-eyebrow text-[var(--color-action)]">
            CONTACT GADGETMOTO
          </p>
          <h1 className="type-h1 mt-5">
            Let’s talk about your next upgrade.
          </h1>
          <p className="type-body-lg mt-6 text-[var(--color-muted)]">
            Message our sales team to confirm product availability,
            delivery charges, and payment instructions before completing
            an order.
          </p>
          <a
            className="button-link button-link--primary mt-8"
            href={messengerUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            Open Facebook Messenger
          </a>
        </div>
        <div className="contact-page__details">
          <section>
            <h2>What we can help with</h2>
            <ul>
              <li>Confirming current product availability</li>
              <li>Discussing nationwide or same-day delivery</li>
              <li>Providing payment instructions after review</li>
              <li>Answering questions about confirmed product details</li>
            </ul>
          </section>
          <section>
            <h2>Before you message</h2>
            <p>
              Add products to your cart and use checkout to prepare a
              concise order summary. Do not send passwords, payment
              credentials, PINs, or one-time codes.
            </p>
            <Link href="/checkout">Prepare your order inquiry</Link>
          </section>
          <section>
            <h2>Current ordering status</h2>
            <p>
              Online order submission and store pickup are currently
              unavailable. No payment is processed through this website.
            </p>
          </section>
        </div>
      </Container>
    </StorefrontPageShell>
  );
}
