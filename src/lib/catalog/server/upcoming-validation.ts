import "server-only";

import {
  upcomingProducts,
  type UpcomingProduct,
  type UpcomingProductCategory,
  type UpcomingProductImage,
} from "@/data/upcoming-products";
import { CatalogServerError } from "./catalog-error";
import type { UpcomingDatabaseRow } from "./database-upcoming-catalog";
import { resolveProductImage } from "@/lib/catalog/product-image-source";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const fail = (): never => {
  throw new CatalogServerError("CATALOG_DATABASE_VALIDATION_FAILED");
};

const imageByPath = new Map<string, UpcomingProductImage>(
  upcomingProducts.flatMap((product) => [
    ...(product.primaryImage ? [[product.primaryImage.src, product.primaryImage] as const] : []),
    ...product.images.map((image) => [image.src, image] as const),
  ]),
);

function categoryFromValue(value: string | null): UpcomingProductCategory {
  if (value === "phone") return "Phone";
  if (value === "tablet") return "Tablet";
  if (value === null) return "To be confirmed";
  return fail();
}

function readStringArray(value: unknown): string[] {
  if (
    !Array.isArray(value) ||
    value.length > 40 ||
    value.some((item) => typeof item !== "string" || !item.trim())
  ) {
    return fail();
  }
  return value;
}

function readSpecifications(
  value: unknown,
): UpcomingProduct["specifications"] {
  if (!Array.isArray(value) || value.length > 40) return fail();

  return value.map((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item) ||
      !("label" in item) ||
      !("value" in item) ||
      typeof item.label !== "string" ||
      typeof item.value !== "string" ||
      !item.label.trim() ||
      !item.value.trim()
    ) {
      return fail();
    }
    return { label: item.label, value: item.value };
  });
}

function readImages(value: unknown): UpcomingProductImage[] {
  if (!Array.isArray(value) || value.length > 20) return fail();

  return value.flatMap((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item) ||
      !("storagePath" in item) ||
      typeof item.storagePath !== "string" ||
      !("altText" in item) ||
      typeof item.altText !== "string" ||
      !item.altText.trim()
    ) {
      return fail();
    }

    const image = resolveProductImage(
      item.storagePath,
      item.altText,
      imageByPath.get(item.storagePath),
    );
    return image ? [image] : [];
  });
}

export function normalizeDatabaseUpcomingRows(
  rows: readonly UpcomingDatabaseRow[],
): readonly UpcomingProduct[] {
  if (rows.length > 1000) fail();

  const products = rows.map((row): UpcomingProduct => {
    if (
      typeof row.product_slug !== "string" ||
      !slugPattern.test(row.product_slug) ||
      typeof row.product_name !== "string" ||
      !row.product_name.trim() ||
      typeof row.brand_name !== "string" ||
      !row.brand_name.trim() ||
      typeof row.brand_slug !== "string" ||
      !slugPattern.test(row.brand_slug) ||
      typeof row.short_description !== "string" ||
      !row.short_description.trim() ||
      typeof row.full_description !== "string" ||
      !row.full_description.trim() ||
      !Number.isSafeInteger(row.product_sort_order) ||
      row.product_sort_order < 0
    ) {
      return fail();
    }

    const images = readImages(row.images);
    const [primaryImage, ...gallery] = images;

    return {
      id: row.product_slug,
      name: row.product_name,
      brand: row.brand_name,
      category: categoryFromValue(row.category),
      primaryImage: primaryImage ?? null,
      images: gallery,
      shortDescription: row.short_description,
      description: row.full_description,
      highlights: readStringArray(row.highlights),
      specifications: readSpecifications(row.specifications),
      availabilityMessage: "Details and availability coming soon.",
    };
  });

  if (new Set(products.map(({ id }) => id)).size !== products.length) fail();
  return products;
}
