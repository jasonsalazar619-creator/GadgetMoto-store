import Link from "next/link";
import type { PrototypeProduct } from "@/data/prototype-products";
import { Container } from "@/components/ui/container";
import { CatalogExplorer } from "./catalog-explorer";
import { StorefrontPageShell } from "./storefront-page-shell";

type CatalogPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  products: readonly PrototypeProduct[];
  fixedCategory?: "Phone" | "Tablet";
  resultsLabel: string;
  showCategoryFilter?: boolean;
  backToShop?: boolean;
};

export function CatalogPage({
  eyebrow,
  title,
  description,
  products,
  fixedCategory,
  resultsLabel,
  showCategoryFilter = false,
  backToShop = false,
}: CatalogPageProps) {
  return (
    <StorefrontPageShell>
      <section className="catalog-hero">
        <Container className="storefront-container">
          <p className="type-eyebrow text-[var(--color-action)]">{eyebrow}</p>
          <h1 className="type-h1 mt-5 max-w-[15ch]">{title}</h1>
          <p className="type-body-lg mt-6 max-w-3xl text-[var(--color-muted)]">{description}</p>
          {backToShop ? <Link className="mt-7 inline-flex font-semibold text-[var(--color-action)]" href="/shop">← Back to the full catalog</Link> : null}
        </Container>
      </section>
      <section className="pb-[var(--space-section)]">
        <Container className="storefront-container">
          <CatalogExplorer
            fixedCategory={fixedCategory}
            products={products}
            resultsLabel={resultsLabel}
            showCategoryFilter={showCategoryFilter}
          />
        </Container>
      </section>
    </StorefrontPageShell>
  );
}
