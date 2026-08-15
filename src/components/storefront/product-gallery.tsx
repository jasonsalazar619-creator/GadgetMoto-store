"use client";

import Image from "next/image";
import { useState } from "react";
import type { PrototypeProduct } from "@/data/prototype-products";
import { DevicePlaceholder } from "./device-placeholder";

export function ProductGallery({ product }: { product: PrototypeProduct }) {
  const images = [
    ...(product.primaryImage ? [product.primaryImage] : []),
    ...product.images,
  ];
  const [selectedSrc, setSelectedSrc] = useState(images[0]?.src ?? null);
  const selectedImage =
    images.find((image) => image.src === selectedSrc) ?? images[0] ?? null;

  return (
    <div className="product-gallery">
      <div
        className={`product-gallery__main product-art--${product.artSeed}`}
      >
        {selectedImage ? (
          <Image
            alt={selectedImage.alt}
            className="product-artwork object-contain"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 55vw"
            src={selectedImage.src}
          />
        ) : (
          <DevicePlaceholder category={product.category} />
        )}
      </div>

      {images.length > 1 ? (
        <div aria-label="Product image gallery" className="product-gallery__thumbs">
          {images.map((image, index) => {
            const selected = image.src === selectedImage?.src;
            return (
              <button
                aria-label={`View image ${index + 1} of ${images.length}: ${image.alt}`}
                aria-pressed={selected}
                className="product-gallery__thumb"
                key={image.src}
                onClick={() => setSelectedSrc(image.src)}
                type="button"
              >
                <span className="relative block h-full min-h-[6.5rem] w-full">
                  <Image
                    alt=""
                    className="object-contain p-1"
                    fill
                    sizes="(max-width: 639px) 25vw, 8rem"
                    src={image.src}
                  />
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <p className="mt-4 text-xs text-[var(--color-muted)]">
        {product.primaryImage
          ? "Product appearance may vary by color or regional configuration."
          : "Product imagery is being prepared. The catalog details remain available below."}
      </p>
    </div>
  );
}
