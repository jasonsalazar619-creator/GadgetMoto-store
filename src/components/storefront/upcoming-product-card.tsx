import Image from "next/image";
import Link from "next/link";

import type { UpcomingProduct } from "@/data/upcoming-products";
import { DevicePlaceholder } from "@/components/storefront/device-placeholder";

type UpcomingProductCardProps = {
  product: UpcomingProduct;
};

export function UpcomingProductCard({ product }: UpcomingProductCardProps) {
  return (
    <article className="upcoming-product-card">
      <Link
        aria-label={`Preview ${product.name}`}
        className="upcoming-product-card__media"
        href={`/coming-soon/${product.id}`}
      >
        {product.primaryImage ? (
          <Image
            alt={product.primaryImage.alt}
            className="upcoming-product-card__image"
            height={product.primaryImage.height}
            sizes="(max-width: 639px) calc(100vw - 2rem), (max-width: 1023px) 45vw, (max-width: 1279px) 30vw, 22vw"
            src={product.primaryImage.src}
            width={product.primaryImage.width}
          />
        ) : (
          <DevicePlaceholder
            category={product.category === "Tablet" ? "Tablet" : "Phone"}
          />
        )}
        <span className="upcoming-product-card__badge">Coming soon</span>
      </Link>
      <div className="upcoming-product-card__content">
        <p className="type-eyebrow text-[var(--color-action)]">
          {product.brand} · {product.category}
        </p>
        <h3>
          <Link href={`/coming-soon/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="upcoming-product-card__description">
          {product.shortDescription}
        </p>
        <Link
          className="upcoming-product-card__link"
          href={`/coming-soon/${product.id}`}
        >
          View details
        </Link>
      </div>
    </article>
  );
}
