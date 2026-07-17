import { Container } from "@/components/ui/container";
import { HeroMotion } from "./hero-motion";

function HeroRing({ variant }: { variant: "one" | "two" }) {
  return (
    <div className={`hero-ring-layer hero-ring-layer--${variant}`} data-hero-ring-scroll>
      <div className="hero-motion-layer" data-hero-ring-pointer>
        <div className="hero-motion-layer" data-hero-ring-ambient>
          <div className={`hero-orbit__ring hero-orbit__ring--${variant}`} data-hero-ring />
        </div>
      </div>
    </div>
  );
}

function HeroDevice({ type }: { type: "phone" | "tablet" }) {
  return (
    <div className={`hero-${type}-layer`} data-hero-device-scroll={type}>
      <div className="hero-motion-layer" data-hero-device-ambient={type}>
        <div className="hero-motion-layer" data-hero-device-pointer={type}>
          <div className={`hero-${type}`} data-hero-device-visual={type}>
            <span />
            {type === "phone" ? <i /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCard({
  position,
  title,
  label,
}: {
  position: "one" | "two" | "three";
  title: string;
  label: string;
}) {
  return (
    <div className={`hero-card-layer hero-card-layer--${position}`} data-hero-card-scroll>
      <div className="hero-motion-layer" data-hero-card-pointer>
        <div className="hero-motion-layer" data-hero-card-ambient>
          <div className="hero-float-card" data-hero-card>
            <strong>{title}</strong>
            <span>{label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroDevices() {
  return (
    <div aria-hidden="true" className="hero-orbit">
      <HeroRing variant="one" />
      <HeroRing variant="two" />
      <HeroDevice type="tablet" />
      <HeroDevice type="phone" />
      <HeroCard label="arrivals" position="one" title="New" />
      <HeroCard label="payments" position="two" title="Flexible" />
      <HeroCard label="delivery" position="three" title="Nationwide" />
    </div>
  );
}

export function HeroSection() {
  return (
    <HeroMotion>
      <section className="relative isolate overflow-hidden bg-[linear-gradient(145deg,#ffffff_0%,var(--color-ice)_50%,var(--color-sky)_100%)]" data-hero-root id="top">
        <div aria-hidden="true" className="absolute -left-40 top-12 size-96 rounded-full bg-white/80 blur-3xl" data-hero-glow />
        <Container className="storefront-container hero-layout grid items-center gap-8 py-12 md:grid-cols-[0.92fr_1.08fr] md:gap-4 md:py-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:py-20">
          <div className="relative z-10 max-w-2xl" data-hero-text-scroll>
            <p className="type-eyebrow text-[var(--color-action)]" data-hero-eyebrow>New arrivals</p>
            <h1 className="hero-title type-display mt-5 text-[var(--color-ink)]">
              <span className="block" data-hero-line>Your Next</span>
              <span className="block" data-hero-line>Upgrade,</span>
              <span className="block" data-hero-line>Mo ’To.</span>
            </h1>
            <p className="hero-copy type-body-lg mt-7 max-w-2xl text-[var(--color-muted)]" data-hero-copy>Discover the latest phones and tablets, flexible payment options, and delivery that works around you.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a className="button-link button-link--primary" data-hero-action href="#new-arrivals">Shop New Arrivals</a>
              <a className="button-link button-link--secondary" data-hero-action href="#compare">Compare Devices</a>
            </div>
          </div>
          <HeroDevices />
        </Container>
      </section>
    </HeroMotion>
  );
}
