import { Container } from "@/components/ui/container";

export function PriceAlertPreview() {
  return (
    <section className="py-[var(--space-section)]">
      <Container className="storefront-container">
        <div className="price-alert rounded-[var(--radius-xl)] bg-[linear-gradient(135deg,var(--color-action),#4c91c8)] px-[var(--space-page)] py-14 text-white shadow-[var(--shadow-lg)] sm:py-20 lg:px-16 lg:py-24">
          <div className="grid items-end gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
            <div>
              <p className="type-eyebrow text-[var(--color-sky)]">Price-drop alert · Preview</p>
              <h2 className="type-h2 mt-4">Waiting for the right price?</h2>
              <p className="type-body-lg mt-5 max-w-2xl text-[#e8f4ff]">Get notified when selected GadgetMoTo products receive a new promotional price.</p>
            </div>
            <div>
              <div aria-label="Price alert preview" className="flex flex-col gap-3 sm:flex-row" role="group">
                <label className="sr-only" htmlFor="price-alert-email">Email address</label>
                <input className="min-h-14 w-full rounded-[var(--radius-round)] border border-white/50 bg-white px-6 text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]" disabled id="price-alert-email" placeholder="Email address" type="email" />
                <button className="min-h-14 shrink-0 cursor-not-allowed rounded-[var(--radius-round)] bg-[var(--color-ink)] px-8 font-semibold text-white opacity-70" disabled type="button">Notify Me</button>
              </div>
              <p className="mt-3 text-sm text-[#e8f4ff]">Coming soon. Your email will not be collected in this preview.</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
