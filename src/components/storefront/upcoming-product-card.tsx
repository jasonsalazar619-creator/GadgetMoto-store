import Image from "next/image";

import type { UpcomingProduct } from "@/data/upcoming-products";

type UpcomingProductCardProps = {
  product: UpcomingProduct;
};

export function UpcomingProductCard({ product }: UpcomingProductCardProps) {
  return (
    <article className="upcoming-product-card">
      <div className="upcoming-product-card__media">
        <Image
          alt={product.image.alt}
          className="upcoming-product-card__image"
          height={product.image.height}
          sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) 45vw, (max-width: 1279px) 30vw, 22vw"
          src={product.image.src}
          width={product.image.width}
        />
        <span className="upcoming-product-card__badge">Coming soon</span>
      </div>
      <div className="upcoming-product-card__content">
        <p className="type-eyebrow text-[var(--color-action)]">
          {product.brand} · {product.category}
        </p>
        <h3>{product.name}</h3>
        <p>{product.availabilityMessage}</p>
      </div>
    </article>
  );
}
