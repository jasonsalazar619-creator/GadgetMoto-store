import type { PrototypeProduct } from "@/data/prototype-products";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/ui/price-display";
import { DevicePlaceholder } from "./device-placeholder";
import Link from "next/link";

type ProductCardProps = {
  product: PrototypeProduct;
  layout?: "standard" | "tablet";
};

function HeartIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="M20.8 4.7a5.4 5.4 0 0 0-7.7 0L12 5.8l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.4 5.4 0 0 0 0-7.7Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CompareIcon() {
  return (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path d="M8 4 4 8l4 4M4 8h13M16 20l4-4-4-4m4 4H7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export function ProductCard({ product, layout = "standard" }: ProductCardProps) {
  return (
    <article className="product-card group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:-translate-y-1 hover:border-[var(--color-brand)] hover:shadow-[var(--shadow-md)] focus-within:border-[var(--color-action)] focus-within:shadow-[var(--focus-ring)]">
      <div className={`product-card__art relative flex items-center justify-center overflow-hidden bg-[linear-gradient(145deg,var(--color-ice),var(--color-sky))] p-8 ${layout === "tablet" ? "min-h-60" : "min-h-72"}`}>
        {product.badge ? <Badge className="absolute left-4 top-4" variant={product.badge}>{product.badge === "sale" ? "Sale" : "New"}</Badge> : null}
        <div className="absolute right-3 top-3 flex gap-2">
          <button aria-label={`Save ${product.name} to wishlist (preview)`} className="icon-control" disabled type="button"><HeartIcon /></button>
          <button aria-label={`Compare ${product.name} (preview)`} className="icon-control" disabled type="button"><CompareIcon /></button>
        </div>
        <DevicePlaceholder category={product.category} />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div>
          <p className="type-eyebrow text-[var(--color-action)]">{product.brand} · {product.category}</p>
          <h3 className="mt-3 min-h-[3.5rem] font-[family-name:var(--font-heading)] text-xl font-bold leading-snug tracking-tight text-[var(--color-ink)]"><Link className="product-card__link" href={`/products/${product.slug}`}>{product.name}</Link></h3>
          <p className="mt-2 text-[0.95rem] text-[var(--color-muted)]">{product.variant}</p>
        </div>
        <div className="mt-auto pt-5">
          <PriceDisplay className="product-price" currentPrice={product.price} originalPrice={product.srp} />
          <p className="mt-4 text-sm font-medium text-[var(--color-action)]">{product.financingMessage}</p>
        </div>
      </div>
    </article>
  );
}
