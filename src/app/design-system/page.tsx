import type { Metadata } from "next";
import Image from "next/image";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { PriceDisplay } from "@/components/ui/price-display";
import { SearchField } from "@/components/ui/search-field";
import { Surface } from "@/components/ui/surface";

export const metadata: Metadata = {
  title: "Design System | GadgetMoTo",
  description: "GadgetMoTo visual design-system review page.",
};

const colors = [
  ["GadgetMoTo Blue", "#4C91C8", "var(--color-brand)"],
  ["Action Blue", "#1D67C1", "var(--color-action)"],
  ["Bright Blue", "#247FE5", "var(--color-bright)"],
  ["Graphite", "#37363B", "var(--color-graphite)"],
  ["Deep Ink", "#171A20", "var(--color-ink)"],
  ["Ice Blue", "#F3F9FE", "var(--color-ice)"],
  ["Soft Sky", "#E3F2FC", "var(--color-sky)"],
  ["White", "#FFFFFF", "var(--color-white)"],
] as const;

function ReviewSection({
  eyebrow,
  title,
  children,
}: Readonly<{
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}>) {
  return (
    <section className="border-t border-[var(--color-border)] py-[var(--space-section)]">
      <p className="type-eyebrow text-[var(--color-action)]">{eyebrow}</p>
      <h2 className="type-h2 mt-3 max-w-3xl text-[var(--color-ink)]">{title}</h2>
      <div className="mt-10">{children}</div>
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="overflow-hidden bg-[var(--color-ice)] text-[var(--color-ink)]">
      <Container>
        <header className="flex min-h-[72vh] flex-col justify-between py-[var(--space-page)] sm:min-h-[78vh]">
          <BrandLockup variant="compact" />
          <div className="max-w-4xl py-16">
            <p className="type-eyebrow text-[var(--color-action)]">Design system · Foundation</p>
            <h1 className="type-display mt-5">Technology, made approachable.</h1>
            <p className="type-body-lg mt-7 max-w-[var(--width-reading)] text-[var(--color-muted)]">
              A light, spacious visual language for phones and tablets—grounded in GadgetMoTo blue and built for clear commerce decisions.
            </p>
          </div>
          <p className="type-small pb-2 text-[var(--color-muted)]">Checkpoint 2B · Visual review</p>
        </header>

        <ReviewSection eyebrow="01 · Brand" title="One identity, adapted thoughtfully for the web.">
          <div className="grid gap-5 lg:grid-cols-2">
            <Surface className="flex min-h-80 flex-col items-center justify-center bg-white text-center">
              <p className="type-eyebrow mb-6 text-[var(--color-muted)]">Official original logo</p>
              <Image
                alt="Original GadgetMoTo logo"
                className="h-auto w-full max-w-64 rounded-[var(--radius-md)]"
                height={900}
                priority
                src="/brand/gadgetmoto-logo-original.jpg"
                width={901}
              />
            </Surface>
            <Surface className="flex min-h-80 flex-col items-center justify-center bg-[linear-gradient(145deg,#ffffff,#e3f2fc)] text-center">
              <p className="type-eyebrow mb-10 text-[var(--color-muted)]">Simplified web lockup</p>
              <div className="flex flex-col items-center gap-10">
                <BrandLockup />
                <BrandLockup variant="compact" />
              </div>
            </Surface>
          </div>
        </ReviewSection>

        <ReviewSection eyebrow="02 · Color" title="Blue creates momentum. Ink keeps every decision clear.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {colors.map(([name, hex, color]) => (
              <div key={name} className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white">
                <div className="aspect-[4/3] border-b border-[var(--color-border)]" style={{ backgroundColor: color }} />
                <div className="p-4">
                  <p className="font-semibold">{name}</p>
                  <p className="type-small mt-1 text-[var(--color-muted)]">{hex}</p>
                </div>
              </div>
            ))}
          </div>
        </ReviewSection>

        <ReviewSection eyebrow="03 · Type" title="A fluid hierarchy that stays confident at every screen size.">
          <Surface className="divide-y divide-[var(--color-border)] overflow-hidden p-0">
            {[
              ["Display", "type-display", "Next upgrade"],
              ["Heading 1", "type-h1", "Phones and tablets"],
              ["Heading 2", "type-h2", "Made for your lifestyle"],
              ["Heading 3", "type-h3", "Clear ways to pay"],
              ["Body large", "type-body-lg", "Technology should feel simple, useful, and within reach."],
              ["Body", "", "Phones and tablets for every lifestyle, budget, and way to pay."],
              ["Small", "type-small", "Supporting details remain readable and calm."],
              ["Eyebrow", "type-eyebrow", "GadgetMoTo"],
            ].map(([label, className, copy]) => (
              <div className="grid gap-3 p-5 sm:grid-cols-[8rem_1fr] sm:p-7" key={label}>
                <p className="type-small text-[var(--color-muted)]">{label}</p>
                <p className={className}>{copy}</p>
              </div>
            ))}
          </Surface>
        </ReviewSection>

        <ReviewSection eyebrow="04 · Actions" title="A concise hierarchy for high-intent commerce moments.">
          <div className="space-y-8">
            <div className="flex flex-wrap items-center gap-3">
              <Button size="large">Primary action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost" size="small">Ghost</Button>
              <Button variant="messenger">Message Us</Button>
              <Button disabled>Disabled</Button>
            </div>
            <Surface>
              <p className="type-eyebrow text-[var(--color-muted)]">Product states</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge variant="new">New</Badge>
                <Badge variant="sale">Sale</Badge>
                <Badge variant="in-stock">In stock</Badge>
                <Badge variant="low-stock">Low stock</Badge>
                <Badge variant="preorder">Preorder</Badge>
                <Badge variant="unavailable">Unavailable</Badge>
              </div>
            </Surface>
          </div>
        </ReviewSection>

        <ReviewSection eyebrow="05 · Search" title="A clear entry point, ready for live suggestions later.">
          <div className="max-w-2xl">
            <SearchField />
            <p className="type-small mt-3 text-[var(--color-muted)]">Static visual component—no search behavior in this checkpoint.</p>
          </div>
        </ReviewSection>

        <ReviewSection eyebrow="06 · Surfaces" title="Quiet depth separates content without visual noise.">
          <div className="grid gap-5 md:grid-cols-3">
            <Surface>
              <Badge variant="new">Default</Badge>
              <h3 className="type-h3 mt-6">Clear structure</h3>
              <p className="mt-3 text-[var(--color-muted)]">A subtle border and compact shadow define everyday content.</p>
            </Surface>
            <Surface variant="elevated">
              <Badge variant="in-stock">Elevated</Badge>
              <h3 className="type-h3 mt-6">Premium emphasis</h3>
              <p className="mt-3 text-[var(--color-muted)]">Reserved depth gives priority to important moments.</p>
            </Surface>
            <Surface variant="interactive">
              <Badge variant="preorder">Interactive</Badge>
              <h3 className="type-h3 mt-6">Responsive feedback</h3>
              <p className="mt-3 text-[var(--color-muted)]">A restrained lift signals that the surface can be explored.</p>
            </Surface>
          </div>
        </ReviewSection>

        <ReviewSection eyebrow="07 · Price" title="Prices are prominent, precise, and easy to compare.">
          <div className="grid gap-5 sm:grid-cols-3">
            <Surface><PriceDisplay currentPrice={84990} label="Xiaomi 17 Ultra 5G Leica Kit" /></Surface>
            <Surface><PriceDisplay currentPrice={57990} label="Apple iPhone 17" vatExclusive /></Surface>
            <Surface><PriceDisplay currentPrice={7990} label="POCO C85" /></Surface>
          </div>
          <p className="type-small mt-4 max-w-2xl text-[var(--color-muted)]">
            VAT-exclusive messaging is informational only. No VAT rate or tax calculation is assumed.
          </p>
        </ReviewSection>

        <ReviewSection eyebrow="08 · Foundations" title="Consistent spacing, shape, and depth keep the system coherent.">
          <div className="grid gap-8 lg:grid-cols-3">
            <Surface>
              <h3 className="type-h3">Spacing</h3>
              <div className="mt-6 flex items-end gap-4" aria-label="Spacing scale examples">
                {[8, 16, 24, 32].map((size) => (
                  <div className="bg-[var(--color-brand)]" key={size} style={{ height: size, width: size }} title={`${size} pixels`} />
                ))}
              </div>
            </Surface>
            <Surface>
              <h3 className="type-h3">Radius</h3>
              <div className="mt-6 flex gap-3">
                {["var(--radius-sm)", "var(--radius-md)", "var(--radius-lg)"].map((radius) => (
                  <div className="size-14 border-2 border-[var(--color-brand)] bg-[var(--color-sky)]" key={radius} style={{ borderRadius: radius }} />
                ))}
              </div>
            </Surface>
            <Surface>
              <h3 className="type-h3">Shadow</h3>
              <div className="mt-6 flex gap-4">
                <div className="size-14 rounded-[var(--radius-md)] bg-white shadow-[var(--shadow-sm)]" />
                <div className="size-14 rounded-[var(--radius-md)] bg-white shadow-[var(--shadow-md)]" />
                <div className="size-14 rounded-[var(--radius-md)] bg-white shadow-[var(--shadow-lg)]" />
              </div>
            </Surface>
          </div>
        </ReviewSection>

        <ReviewSection eyebrow="09 · Accessibility" title="Clarity is part of the visual language.">
          <div className="grid gap-6 md:grid-cols-2">
            <Surface>
              <h3 className="type-h3">Built into the foundation</h3>
              <ul className="mt-5 space-y-3 text-[var(--color-muted)]">
                <li>Visible keyboard focus rings on interactive controls.</li>
                <li>High-contrast action colors and readable supporting text.</li>
                <li>Semantic headings, labels, buttons, and meaningful image text.</li>
                <li>Fluid type and responsive spacing for small and large screens.</li>
              </ul>
            </Surface>
            <Surface className="bg-[var(--color-ink)] text-white">
              <p className="type-eyebrow text-[var(--color-sky)]">Motion principle</p>
              <p className="type-h3 mt-5">Movement should clarify state, preserve focus, and never delay a purchase decision.</p>
              <p className="mt-5 text-[#cbd5df]">Reduced-motion preferences are respected at the global level.</p>
            </Surface>
          </div>
        </ReviewSection>

        <footer className="flex flex-col gap-6 border-t border-[var(--color-border)] py-10 sm:flex-row sm:items-end sm:justify-between">
          <BrandLockup />
          <p className="type-small max-w-sm text-[var(--color-muted)] sm:text-right">
            Visual foundation only. Commerce experiences will be built in later checkpoints.
          </p>
        </footer>
      </Container>
    </main>
  );
}
