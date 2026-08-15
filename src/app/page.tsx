import type { Metadata } from "next";

import { BrandLogoCarousel } from "@/components/storefront/brand-logo-carousel";
import { BudgetGrid } from "@/components/storefront/budget-grid";
import { ContactOrderSection } from "@/components/storefront/contact-order-section";
import { DeliveryOptions } from "@/components/storefront/delivery-options";
import { HeroSection } from "@/components/storefront/hero-section";
import { ProductCard } from "@/components/storefront/product-card";
import { SectionHeading } from "@/components/storefront/section-heading";
import { StorefrontFooter } from "@/components/storefront/storefront-footer";
import { StorefrontHeader } from "@/components/storefront/storefront-header";
import { UpgradePathSection } from "@/components/storefront/upgrade-path-section";
import { Container } from "@/components/ui/container";
import { getCatalogProducts } from "@/lib/catalog/server/catalog";

const trustPoints = [
  ["Brand-new gadgets", "All launch products are treated as brand new."],
  ["Flexible ways to pay", "Explore available payment and financing options."],
  ["Secure payment process", "Payment confirmation will follow a secure server-verified process."],
  ["Helpful sales support", "Connect with the GadgetMoTo sales team through Messenger."],
] as const;

export const metadata: Metadata = {
  title: "GadgetMoTo",
  description:
    "Shop phones and tablets with confirmed prices, flexible ways to pay, and nationwide delivery planning.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const products = await getCatalogProducts();
  const newArrivalProducts = products.filter(
    (product) => product.category === "Phone",
  );
  const featuredTablets = products.filter(
    (product) => product.category === "Tablet",
  );

  return (
    <>
      <StorefrontHeader />
      <main className="storefront-main">
        <HeroSection />
        <BrandLogoCarousel />

        <section className="py-[var(--space-section)]" id="new-arrivals">
          <Container className="storefront-container">
            <SectionHeading eyebrow="Featured phones" title="Fresh upgrades worth exploring." description="Browse verified phones with confirmed variants and current GadgetMoTo prices." />
            <div className="product-grid mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {newArrivalProducts.map((product) => <ProductCard key={product.id} product={product} />)}
            </div>
          </Container>
        </section>

        <UpgradePathSection />

        <section className="py-[var(--space-section)]">
          <Container className="storefront-container">
            <SectionHeading eyebrow="Shop by budget" title="Start with what feels right." description="Choose a price range to open the matching catalog selection." />
            <div className="mt-12"><BudgetGrid /></div>
          </Container>
        </section>

        <section className="overflow-hidden bg-[var(--color-sky)] py-[var(--space-section)]" id="tablets">
          <Container className="storefront-container">
            <SectionHeading eyebrow="Featured tablets" title="More room to work, watch, and explore." description="Verified tablet picks with confirmed variants and current GadgetMoTo prices." />
            <div className="product-grid mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {featuredTablets.map((product) => <ProductCard key={product.id} layout="tablet" product={product} />)}
            </div>
          </Container>
        </section>

        <DeliveryOptions />

        <section className="bg-white py-[var(--space-section)]">
          <Container className="storefront-container">
            <SectionHeading align="center" eyebrow="Why GadgetMoTo" title="Support at every step of the upgrade." />
            <div className="mt-12 grid gap-px overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2 lg:grid-cols-4">
              {trustPoints.map(([title, copy], index) => (
                <article className="trust-card bg-[var(--color-ice)] p-[var(--space-component)]" key={title}>
                  <p className="type-eyebrow text-[var(--color-action)]">0{index + 1}</p>
                  <h3 className="type-h3 mt-5">{title}</h3>
                  <p className="mt-4 text-[0.95rem] leading-relaxed text-[var(--color-muted)]">{copy}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        <ContactOrderSection />
      </main>
      <StorefrontFooter />
    </>
  );
}
