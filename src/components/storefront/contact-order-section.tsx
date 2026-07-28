import Link from "next/link";

import { Container } from "@/components/ui/container";

const messengerUrl =
  "https://www.facebook.com/profile.php?id=100063905416187";

const steps = [
  [
    "Build your cart",
    "Add the phones or tablets you want and adjust each quantity.",
  ],
  [
    "Review your details",
    "Use checkout to prepare your delivery preference and order summary.",
  ],
  [
    "Message GadgetMoTo",
    "Contact the sales team to confirm availability, delivery charges, and payment instructions.",
  ],
] as const;

export function ContactOrderSection() {
  return (
    <section
      className="bg-[var(--color-ink)] py-[var(--space-section)] text-white"
      id="ordering"
    >
      <Container className="storefront-container">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="type-eyebrow text-[var(--color-sky)]">
              How to order
            </p>
            <h2 className="type-h2 mt-4">
              Plan your upgrade, then talk with our team.
            </h2>
            <p className="type-body-lg mt-5 text-[#cbd5df]">
              Online order submission is currently unavailable. Your cart
              stays available while you contact GadgetMoTo to complete
              your order.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="button-link bg-white text-[var(--color-ink)]"
                href="/shop"
              >
                Browse Products
              </Link>
              <a
                className="button-link border-white/40 text-white"
                href={messengerUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                Message GadgetMoTo
              </a>
            </div>
          </div>
          <ol className="grid gap-4 sm:grid-cols-3">
            {steps.map(([title, description], index) => (
              <li
                className="rounded-[var(--radius-lg)] border border-white/15 bg-white/5 p-6"
                key={title}
              >
                <span className="type-eyebrow text-[var(--color-sky)]">
                  0{index + 1}
                </span>
                <h3 className="mt-5 font-[family-name:var(--font-heading)] text-xl font-bold">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[#cbd5df]">
                  {description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
