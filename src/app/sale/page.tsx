import type { Metadata } from "next";
import Link from "next/link";
import { ProductArtwork } from "@/components/storefront/product-artwork";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { Container } from "@/components/ui/container";
import { PriceDisplay } from "@/components/ui/price-display";
import { getCatalogProducts } from "@/lib/catalog/server/catalog";

export const metadata: Metadata = {
  title: "Sale | GadgetMoTo",
  description:
    "Browse GadgetMoTo devices whose confirmed current price is below their confirmed SRP.",
  alternates: { canonical: "/sale" },
};

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export default async function SalePage() {
  const products = await getCatalogProducts();
  const discountedProducts = products.filter(
    (product) =>
      product.srp !== undefined && product.currentPrice < product.srp,
  );

  return (
    <StorefrontPageShell>
      <section className="bg-[linear-gradient(145deg,var(--color-ice),white_62%,var(--color-sky))] py-[var(--space-section)]">
        <Container className="storefront-container">
          <p className="type-eyebrow text-[var(--color-action)]">
            Verified savings
          </p>
          <h1 className="type-h1 mt-5">Sale</h1>
          <p className="type-body-lg mt-5 max-w-3xl text-[var(--color-muted)]">
            Discover devices whose current GadgetMoTo selling price is below
            their confirmed original SRP. Products appear here automatically
            whenever authoritative pricing shows a genuine discount.
          </p>
        </Container>
      </section>

      <section className="py-[var(--space-section)]">
        <Container className="storefront-container">
          {discountedProducts.length ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {discountedProducts.map((product, index) => {
                const originalPrice = product.srp as number;
                const savings = originalPrice - product.currentPrice;
                const savingsPercent = Math.round(
                  (savings / originalPrice) * 100,
                );

                return (
                  <article
                    className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)] transition hover:-translate-y-1 hover:border-[var(--color-brand)] hover:shadow-[var(--shadow-md)]"
                    key={product.id}
                  >
                    <div className="product-card__art relative flex items-center justify-center overflow-hidden">
                      <ProductArtwork
                        className="product-card__image"
                        loading={index === 0 ? "eager" : undefined}
                        product={product}
                        sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <p className="type-eyebrow text-[var(--color-action)]">
                        {product.brand} · {product.category}
                      </p>
                      <h2 className="mt-3 font-[family-name:var(--font-heading)] text-xl font-bold leading-snug tracking-tight">
                        <Link href={`/products/${product.slug}`}>
                          {product.name}
                        </Link>
                      </h2>
                      <p className="mt-2 text-sm text-[var(--color-muted)]">
                        {product.variant}
                      </p>
                      <p className="product-availability mt-3">
                        Contact us to confirm availability.
                      </p>
                      <div className="mt-auto pt-5">
                        <PriceDisplay
                          currentPrice={product.currentPrice}
                          originalPrice={originalPrice}
                        />
                        <p className="mt-3 font-bold text-emerald-700">
                          Save {pesoFormatter.format(savings)} ({savingsPercent}%)
                        </p>
                        <Link
                          className="mt-5 inline-flex min-h-11 items-center font-bold text-[var(--color-action)]"
                          href={`/products/${product.slug}`}
                        >
                          View product details →
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[var(--radius-xl)] border bg-white p-8 text-center shadow-[var(--shadow-sm)] sm:p-12">
              <h2 className="type-h2">
                No discounted devices are available right now.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[var(--color-muted)]">
                Browse the complete GadgetMoTo catalog for current verified
                prices.
              </p>
              <Link
                className="button-link button-link--primary mt-7"
                href="/shop"
              >
                Browse all products
              </Link>
            </div>
          )}
        </Container>
      </section>
    </StorefrontPageShell>
  );
}
