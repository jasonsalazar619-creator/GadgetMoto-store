import Link from "next/link";
import type { PrototypeProduct } from "@/data/prototype-products";
import { Container } from "@/components/ui/container";
import { CatalogToolbar } from "./catalog-toolbar";
import { ProductCard } from "./product-card";
import { StorefrontPageShell } from "./storefront-page-shell";

type CatalogPageProps = { eyebrow: string; title: string; description: string; products: readonly PrototypeProduct[]; showAllTools?: boolean; backToShop?: boolean };

export function CatalogPage({ eyebrow, title, description, products, showAllTools = false, backToShop = false }: CatalogPageProps) {
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
          <CatalogToolbar compact={!showAllTools} />
          <div className="mt-10 flex items-end justify-between gap-4">
            <h2 className="type-h3">Current prototype selection</h2>
            <p className="shrink-0 text-sm font-semibold text-[var(--color-muted)]">{products.length} prototype {products.length === 1 ? "product" : "products"}</p>
          </div>
          <div className="product-grid mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => <ProductCard key={product.id} layout={product.category === "Tablet" ? "tablet" : "standard"} product={product} />)}
          </div>
        </Container>
      </section>
    </StorefrontPageShell>
  );
}
