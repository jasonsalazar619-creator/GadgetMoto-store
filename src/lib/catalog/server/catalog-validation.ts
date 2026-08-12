import "server-only";

import {
  getAllProducts,
  type ProductCategory,
  type ProductColor,
  type PrototypeProduct,
} from "@/data/prototype-products";
import { upcomingProducts } from "@/data/upcoming-products";
import type { ProductImage } from "@/data/product-images";
import type { ProductSpecification } from "@/data/product-specifications";
import { CatalogServerError } from "./catalog-error";
import type { CatalogDatabaseRow } from "./database-catalog";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type SupportedBadge = NonNullable<PrototypeProduct["badge"]>;

type ValidatedCatalogRow = Readonly<{
  row: CatalogDatabaseRow;
  staticProduct: PrototypeProduct | undefined;
  category: ProductCategory;
  condition: PrototypeProduct["condition"];
  badge: SupportedBadge | null;
  currentPriceCentavos: number;
  srpCentavos: number | null;
  images: readonly ProductImage[];
  specifications: readonly ProductSpecification[];
  colors: readonly ProductColor[];
}>;

const failValidation = (): never => {
  throw new CatalogServerError("CATALOG_DATABASE_VALIDATION_FAILED");
};

const isNonblankString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isOptionalText = (value: unknown): value is string | null =>
  value === null || (typeof value === "string" && value.trim().length > 0);

const isSafeNonnegativeInteger = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= 0;

const readCentavos = (value: unknown): number => {
  if (isSafeNonnegativeInteger(value)) return value;

  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)$/.test(value)) {
    return failValidation();
  }

  const parsed = Number(value);
  return isSafeNonnegativeInteger(parsed) ? parsed : failValidation();
};

const getCategory = (value: string): ProductCategory => {
  if (value === "phone") return "Phone";
  if (value === "tablet") return "Tablet";
  return failValidation();
};

const getCondition = (value: string): PrototypeProduct["condition"] =>
  value === "brand_new" ? "Brand New" : failValidation();

const getBadge = (value: string | null): SupportedBadge | null => {
  if (value === null || value === "new" || value === "sale") return value;
  return failValidation();
};

const assertUnique = (values: readonly string[]): void => {
  if (new Set(values).size !== values.length) failValidation();
};

const imageByPath = new Map<string, ProductImage>(
  [
    ...getAllProducts().flatMap((product) => [
      ...(product.primaryImage ? [product.primaryImage] : []),
      ...product.images,
    ]),
    ...upcomingProducts.flatMap((product) => [
      ...(product.primaryImage ? [product.primaryImage] : []),
      ...product.images,
    ]),
  ].map((image) => [image.src, image] as const),
);

function readImages(value: unknown): readonly ProductImage[] {
  if (!Array.isArray(value)) return failValidation();
  if (value.length > 20) failValidation();

  const images = value.flatMap((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item) ||
      !("storagePath" in item) ||
      typeof item.storagePath !== "string"
    ) {
      return failValidation();
    }
    const image = imageByPath.get(item.storagePath);
    return image ? [image] : [];
  });

  assertUnique(images.map(({ src }) => src));
  return images;
}

function readSpecifications(
  value: unknown,
): readonly ProductSpecification[] {
  if (!Array.isArray(value)) return failValidation();
  if (value.length > 40) failValidation();

  const specifications = value.map((item) => {
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
      return failValidation();
    }
    return { label: item.label, value: item.value };
  });

  assertUnique(
    specifications.map(({ label }) => label.trim().toLocaleLowerCase()),
  );
  return specifications;
}

function readColors(value: unknown): readonly ProductColor[] {
  if (!Array.isArray(value) || value.length > 50) return failValidation();

  const colors = value.map((item): ProductColor => {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item) ||
      !("id" in item) ||
      !("name" in item) ||
      !("hexCode" in item) ||
      typeof item.id !== "string" ||
      !uuidPattern.test(item.id) ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      item.name !== item.name.trim() ||
      !(
        item.hexCode === null ||
        (typeof item.hexCode === "string" &&
          /^#[0-9a-f]{6}$/i.test(item.hexCode))
      )
    ) {
      return failValidation();
    }
    return { id: item.id, name: item.name, hexCode: item.hexCode };
  });

  assertUnique(colors.map(({ id }) => id.toLocaleLowerCase()));
  assertUnique(colors.map(({ name }) => name.toLocaleLowerCase()));
  return colors;
}

function validateDatabaseCatalogRows(
  rows: readonly CatalogDatabaseRow[],
): readonly ValidatedCatalogRow[] {
  if (rows.length > 1000) failValidation();

  const staticBySlug = new Map(
    getAllProducts().map((product) => [product.slug, product]),
  );

  const validatedRows = rows.map((row): ValidatedCatalogRow => {
    if (
      !isNonblankString(row.product_id) ||
      !uuidPattern.test(row.product_id) ||
      !isNonblankString(row.variant_id) ||
      !uuidPattern.test(row.variant_id) ||
      !isNonblankString(row.product_slug) ||
      !slugPattern.test(row.product_slug) ||
      !isNonblankString(row.product_name) ||
      !isNonblankString(row.brand_name) ||
      !isNonblankString(row.brand_slug) ||
      !slugPattern.test(row.brand_slug) ||
      !isNonblankString(row.sku) ||
      !isNonblankString(row.variant_name) ||
      !isSafeNonnegativeInteger(row.product_sort_order) ||
      (!isSafeNonnegativeInteger(row.ram_gb) && row.ram_gb !== null) ||
      row.ram_gb === 0 ||
      (!isSafeNonnegativeInteger(row.extended_ram_gb) &&
        row.extended_ram_gb !== null) ||
      row.extended_ram_gb === 0 ||
      !isSafeNonnegativeInteger(row.storage_gb) ||
      row.storage_gb === 0 ||
      typeof row.financing_available !== "boolean" ||
      !isOptionalText(row.short_description) ||
      !isOptionalText(row.full_description) ||
      !(
        (row.primary_image_path === null && row.primary_image_alt === null) ||
        (isNonblankString(row.primary_image_path) &&
          isNonblankString(row.primary_image_alt))
      )
    ) {
      failValidation();
    }

    const category = getCategory(row.category);
    const condition = getCondition(row.condition);
    const badge = getBadge(row.badge);
    const currentPriceCentavos = readCentavos(row.current_price_centavos);
    const srpCentavos =
      row.srp_centavos === null ? null : readCentavos(row.srp_centavos);
    const images = readImages(row.images);
    const specifications = readSpecifications(row.specifications);
    const colors = readColors(row.colors);

    if (
      srpCentavos !== null &&
      srpCentavos < currentPriceCentavos
    ) {
      failValidation();
    }

    return {
      row,
      staticProduct: staticBySlug.get(row.product_slug),
      category,
      condition,
      badge,
      currentPriceCentavos,
      srpCentavos,
      images,
      specifications,
      colors,
    };
  });

  assertUnique(validatedRows.map(({ row }) => row.product_slug));
  assertUnique(validatedRows.map(({ row }) => row.sku.toLocaleLowerCase()));
  assertUnique(validatedRows.map(({ row }) => row.product_id.toLocaleLowerCase()));
  assertUnique(validatedRows.map(({ row }) => row.variant_id.toLocaleLowerCase()));

  return validatedRows;
}

export function normalizeDatabaseCatalogRows(
  rows: readonly CatalogDatabaseRow[],
): readonly PrototypeProduct[] {
  const validatedRows = validateDatabaseCatalogRows(rows);

  return [...validatedRows]
    .sort(
      (left, right) =>
        left.row.product_sort_order - right.row.product_sort_order ||
        left.row.product_slug.localeCompare(right.row.product_slug) ||
        left.row.sku.localeCompare(right.row.sku),
    )
    .map(
      ({
        row,
        staticProduct,
        category,
        condition,
        badge,
        currentPriceCentavos,
        srpCentavos,
        images,
        specifications,
        colors,
      }): PrototypeProduct => {
        const primaryImage =
          staticProduct?.primaryImage?.src === row.primary_image_path
            ? staticProduct.primaryImage
            : images.find(({ src }) => src === row.primary_image_path) ?? null;

        return {
          id: staticProduct?.id ?? row.product_slug,
          slug: row.product_slug,
          sku: row.sku,
          brand: row.brand_name,
          name: row.product_name,
          category,
          variant: row.variant_name,
          currentPrice: currentPriceCentavos / 100,
          ...(srpCentavos === null ? {} : { srp: srpCentavos / 100 }),
          ...(row.ram_gb === null ? {} : { ramGb: row.ram_gb }),
          storageGb: row.storage_gb,
          condition,
          ...(badge === null ? {} : { badge }),
          financingMessage: "Financing options available",
          financingAvailable: row.financing_available,
          artSeed:
            staticProduct?.artSeed ??
            (category === "Tablet" ? "wide-orbit" : "orbit-blue"),
          primaryImage,
          images:
            staticProduct?.images ??
            images.filter(({ src }) => src !== primaryImage?.src),
          specifications:
            staticProduct?.specifications ?? specifications,
          ...(colors.length ? { colors } : {}),
          ...(row.short_description
            ? { shortDescription: row.short_description }
            : {}),
          ...(row.full_description
            ? { fullDescription: row.full_description }
            : {}),
        };
      },
    );
}
