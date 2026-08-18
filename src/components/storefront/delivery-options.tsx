import { Container } from "@/components/ui/container";
import { SectionHeading } from "./section-heading";

const options = [
  ["Nationwide Delivery", "Delivery ordering is available for planning. Charges, timing, and product availability are confirmed by the sales team."],
  ["Same-Day Delivery", "Same-day service may be discussed where available and requires sales-team confirmation."],
  ["Store Pickup", "Available at Barangay Sabang, Dasmariñas. Product availability and pickup timing require confirmation."],
] as const;

export function DeliveryOptions() {
  return (
    <section className="py-[var(--space-section)]" id="delivery">
      <Container className="storefront-container">
        <SectionHeading align="center" eyebrow="Delivery" title="Your upgrade, your way." />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {options.map(([title, copy], index) => (
            <article className="delivery-card rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-[var(--space-component)] shadow-[var(--shadow-sm)]" key={title}>
              <span className="flex size-14 items-center justify-center rounded-full bg-[var(--color-sky)] text-lg font-bold text-[var(--color-action)]">0{index + 1}</span>
              <h3 className="type-h3 mt-7">{title}</h3>
              <p className="mt-4 leading-relaxed text-[var(--color-muted)]">{copy}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
