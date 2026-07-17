import { Container } from "@/components/ui/container";

export function ComparePromo() {
  return (
    <section className="py-[var(--space-section)]" id="compare">
      <Container className="storefront-container">
        <div className="overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-ink)] px-[var(--space-page)] py-14 text-white shadow-[var(--shadow-lg)] sm:py-20 lg:px-16 lg:py-24">
          <div className="grid items-center gap-14 lg:grid-cols-[0.82fr_1.18fr] xl:gap-20">
            <div>
              <p className="type-eyebrow text-[var(--color-sky)]">Device comparison</p>
              <h2 className="type-h2 mt-4">Compare before you upgrade.</h2>
              <p className="type-body-lg mt-5 text-[#cbd5df]">Place phones and tablets side by side to find the device that fits your budget and everyday needs.</p>
              <button className="mt-8 min-h-12 cursor-not-allowed rounded-[var(--radius-round)] bg-white px-6 font-semibold text-[var(--color-ink)] opacity-60" disabled type="button">Start Comparing</button>
              <p className="mt-3 text-sm text-[#aebbc7]">Comparison tools are coming in a later checkpoint.</p>
            </div>
            <div aria-label="Three empty comparison slots" className="grid grid-cols-3 gap-3 sm:gap-5">
              {[1, 2, 3].map((slot) => (
                <div className="compare-slot flex aspect-[3/4] flex-col items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-white/30 bg-white/5 p-3 text-center" key={slot}>
                  <span aria-hidden="true" className="compare-slot__device"><i /></span>
                  <span aria-hidden="true" className="mt-3 text-2xl font-light text-[var(--color-sky)]">+</span>
                  <span className="mt-2 text-xs text-[#cbd5df]">Device {slot}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
