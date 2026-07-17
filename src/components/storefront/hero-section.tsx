import { Container } from "@/components/ui/container";

function HeroDevices() {
  return (
    <div aria-hidden="true" className="hero-orbit">
      <div className="hero-orbit__ring hero-orbit__ring--one" />
      <div className="hero-orbit__ring hero-orbit__ring--two" />
      <div className="hero-tablet"><span /></div>
      <div className="hero-phone"><span /><i /></div>
      <div className="hero-float-card hero-float-card--one"><strong>New</strong><span>arrivals</span></div>
      <div className="hero-float-card hero-float-card--two"><strong>Flexible</strong><span>payments</span></div>
      <div className="hero-float-card hero-float-card--three"><strong>Nationwide</strong><span>delivery</span></div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(145deg,#ffffff_0%,var(--color-ice)_50%,var(--color-sky)_100%)]" id="top">
      <div aria-hidden="true" className="absolute -left-40 top-12 size-96 rounded-full bg-white/80 blur-3xl" />
      <Container className="storefront-container hero-layout grid items-center gap-8 py-12 md:grid-cols-[0.92fr_1.08fr] md:gap-4 md:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:py-20">
        <div className="relative z-10 max-w-2xl">
          <p className="type-eyebrow text-[var(--color-action)]">New arrivals</p>
          <h1 className="hero-title type-display mt-5 text-[var(--color-ink)]">Your Next Upgrade, Mo ’To.</h1>
          <p className="hero-copy type-body-lg mt-7 max-w-2xl text-[var(--color-muted)]">Discover the latest phones and tablets, flexible payment options, and delivery that works around you.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a className="button-link button-link--primary" href="#new-arrivals">Shop New Arrivals</a>
            <a className="button-link button-link--secondary" href="#compare">Compare Devices</a>
          </div>
        </div>
        <HeroDevices />
      </Container>
    </section>
  );
}
