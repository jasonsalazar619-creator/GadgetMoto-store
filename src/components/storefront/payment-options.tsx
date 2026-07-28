import { Container } from "@/components/ui/container";
import { SectionHeading } from "./section-heading";

const payments = [
  "Maya online payment · coming later",
  "Manual bank or e-wallet transfer · confirmed after review",
  "Cash on store pickup · unavailable",
] as const;
const financing = ["Home Credit", "Skyro", "GGives", "Atome", "BillEase", "Maya Credit"] as const;

function OptionTiles({ options }: { options: readonly string[] }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{options.map((option) => <div className="payment-tile" key={option}>{option}</div>)}</div>;
}

export function PaymentOptions() {
  return (
    <section className="bg-[var(--color-ice)] py-[var(--space-section)]" id="payments">
      <Container className="storefront-container">
        <SectionHeading eyebrow="Ways to pay" title="Choose what works for you." description="Payment and financing options are informational until the sales team confirms availability, delivery, and payment instructions." />
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="payment-panel rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-[var(--space-component)]">
            <h3 className="type-h3">Planned payment options</h3>
            <div className="mt-6"><OptionTiles options={payments} /></div>
          </div>
          <div className="payment-panel rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-[var(--space-component)]">
            <h3 className="type-h3">Financing options</h3>
            <div className="mt-6"><OptionTiles options={financing} /></div>
            <p className="mt-6 text-sm leading-relaxed text-[var(--color-muted)]">Financing options are informational only. Availability and approval depend on the selected provider and sales-team confirmation.</p>
          </div>
        </div>
      </Container>
    </section>
  );
}
