import Image from "next/image";

import type { PrototypeProduct } from "@/data/prototype-products";
import { DevicePlaceholder } from "./device-placeholder";

type ProductArtworkProps = Readonly<{
  product: PrototypeProduct;
  className?: string;
  loading?: "eager" | "lazy";
  sizes: string;
}>;

export function ProductArtwork({
  product,
  className = "",
  loading,
  sizes,
}: ProductArtworkProps) {
  const image = product.primaryImage;

  if (!image) {
    return (
      <DevicePlaceholder
        category={product.category}
        className={className}
      />
    );
  }

  return (
    <Image
      alt={image.alt}
      className={`product-artwork ${className}`.trim()}
      height={image.height}
      loading={loading}
      sizes={sizes}
      src={image.src}
      width={image.width}
    />
  );
}
