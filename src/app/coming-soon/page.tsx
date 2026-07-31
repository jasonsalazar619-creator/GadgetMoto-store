import type { Metadata } from "next";

import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { UpcomingProductCard } from "@/components/storefront/upcoming-product-card";
import { Container } from "@/components/ui/container";
import { getUpcomingProducts } from "@/lib/catalog/server/upcoming-catalog";

export const metadata: Metadata = {
  title: "Coming Soon | GadgetMoTo",
  description:
    "Preview phones and tablets that may be added to GadgetMoTo in the future.",
  alternates: { canonical: "/coming-soon" },
};

export default async function ComingSoonPage() {
  const upcomingProducts = await getUpcomingProducts();
  const productGroups = Array.from(
    upcomingProducts.reduce((groups, product) => {
      const products = groups.get(product.brand) ?? [];
      groups.set(product.brand, [...products, product]);
      return groups;
    }, new Map<string, typeof upcomingProducts>()),
  );
  return (
    <StorefrontPageShell>
      <div className="upcoming-page">
        <section className="upcoming-hero">
          <Container className="storefront-container">
            <p className="type-eyebrow text-[var(--color-action)]">
              Product previews
            </p>
            <h1>New products coming soon.</h1>
            <p>
              Explore products we are preparing for future GadgetMoTo catalog
              updates. These previews are not yet available to purchase, and
              exact Philippine variants and availability have not been
              confirmed.
            </p>
            <div className="upcoming-hero__summary" aria-label="Preview summary">
              <strong>{upcomingProducts.length}</strong>
              <span>identified product previews</span>
            </div>
          </Container>
        </section>

        <Container className="storefront-container py-[var(--space-section)]">
          <div className="upcoming-notice" role="note">
            <strong>Preview only</strong>
            <p>
              Contact GadgetMoTo before making plans around any product shown
              here. Confirmed products will move to the regular shop only after
              their exact catalog details are approved.
            </p>
          </div>

          <div className="upcoming-groups">
            {productGroups.map(([brand, products]) => (
              <section className="upcoming-group" key={brand}>
                <div className="upcoming-group__heading">
                  <div>
                    <p className="type-eyebrow text-[var(--color-action)]">
                      Brand preview
                    </p>
                    <h2>{brand}</h2>
                  </div>
                  <p>
                    {products.length} {products.length === 1 ? "product" : "products"}
                  </p>
                </div>
                <div className="upcoming-product-grid">
                  {products.map((product) => (
                    <UpcomingProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </Container>
      </div>
    </StorefrontPageShell>
  );
}
