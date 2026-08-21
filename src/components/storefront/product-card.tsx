import type { PrototypeProduct } from "@/data/prototype-products";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/ui/price-display";
import { ProductArtwork } from "./product-artwork";
import Link from "next/link";
import { ComparisonButton } from "@/components/comparison/comparison-button";

type ProductCardProps = {
  loading?: "eager" | "lazy";
  product: PrototypeProduct;
  layout?: "standard" | "tablet";
};

export function ProductCard({ loading, product }: ProductCardProps) {
  return (
    <article className="product-card group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:-translate-y-1 hover:border-[var(--color-brand)] hover:shadow-[var(--shadow-md)] focus-within:border-[var(--color-action)] focus-within:shadow-[var(--focus-ring)]">
      <div className="product-card__art relative flex items-center justify-center overflow-hidden">
        {product.badge === "new" ? <Badge className="absolute left-4 top-4" variant="new">New</Badge> : null}
        <div className="product-card__actions absolute right-3 top-3 flex gap-2">
          <ComparisonButton className="icon-control" compact name={product.name} slug={product.slug} />
        </div>
        <ProductArtwork
          className="product-card__image"
          loading={loading}
          product={product}
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div>
          <p className="type-eyebrow text-[var(--color-action)]">{product.brand} · {product.category}</p>
          <h3 className="mt-3 min-h-[3.5rem] font-[family-name:var(--font-heading)] text-xl font-bold leading-snug tracking-tight text-[var(--color-ink)]"><Link className="product-card__link" href={`/products/${product.slug}`}>{product.name}</Link></h3>
          <p className="mt-2 text-[0.95rem] text-[var(--color-muted)]">{product.variant}</p>
          {product.variants.length > 1 || product.colors?.length ? (
            <p className="product-card__configuration-summary">
              {product.variants.length} configuration{product.variants.length === 1 ? "" : "s"}
              {product.colors?.length ? ` · ${product.colors.length} color${product.colors.length === 1 ? "" : "s"}` : ""}
            </p>
          ) : null}
          <p className="product-availability mt-3">
            View exact variant availability
          </p>
        </div>
        <div className="mt-auto pt-5">
          <PriceDisplay className="product-price" currentPrice={product.currentPrice} originalPrice={product.srp} />
          <p className="mt-4 text-sm font-medium text-[var(--color-action)]">{product.financingMessage}</p>
        </div>
      </div>
    </article>
  );
}
