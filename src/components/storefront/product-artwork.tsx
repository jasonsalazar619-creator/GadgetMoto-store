import Image from "next/image";

import type { PrototypeProduct } from "@/data/prototype-products";
import { DevicePlaceholder } from "./device-placeholder";

type ProductArtworkProps = Readonly<{
  product: PrototypeProduct;
  className?: string;
  sizes: string;
}>;

export function ProductArtwork({
  product,
  className = "",
  sizes,
}: ProductArtworkProps) {
  const image = product.images[0];

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
      sizes={sizes}
      src={image.src}
      width={image.width}
    />
  );
}
