import type { ProductImage } from "@/data/product-images";

const managedProductImagePattern =
  /^products\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[a-z0-9][a-z0-9._-]*\.(?:jpg|jpeg|png|webp|avif)$/;

export function isManagedProductImagePath(path: string): boolean {
  return managedProductImagePattern.test(path);
}

export function getManagedProductImageSource(path: string): string {
  return `/api/product-images/${path
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

export function resolveProductImage(
  storagePath: string,
  altText: string,
  knownImage?: ProductImage,
): ProductImage | null {
  if (knownImage) return knownImage;
  if (!isManagedProductImagePath(storagePath) || !altText.trim()) return null;

  return {
    src: getManagedProductImageSource(storagePath),
    alt: altText.trim(),
    width: 1200,
    height: 1500,
  };
}
