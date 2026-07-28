import "server-only";

import {
  getAllProducts,
  type ProductCategory,
  type PrototypeProduct,
} from "@/data/prototype-products";
import { CatalogServerError } from "./catalog-error";
import type { CatalogDatabaseRow } from "./database-catalog";

const parityProductCount = 12;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type SupportedBadge = NonNullable<PrototypeProduct["badge"]>;

type ValidatedCatalogRow = Readonly<{
  row: CatalogDatabaseRow;
  staticProduct: PrototypeProduct;
  category: ProductCategory;
  condition: PrototypeProduct["condition"];
  badge: SupportedBadge | null;
  currentPriceCentavos: number;
  srpCentavos: number | null;
}>;

const failValidation = (): never => {
  throw new CatalogServerError("CATALOG_DATABASE_VALIDATION_FAILED");
};

const isNonblankString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const isSafeNonnegativeInteger = (value: unknown): value is number =>
  typeof value === "number" &&
  Number.isSafeInteger(value) &&
  value >= 0;

const readCentavos = (value: unknown): number => {
  if (isSafeNonnegativeInteger(value)) return value;

  if (
    typeof value !== "string" ||
    !/^(0|[1-9][0-9]*)$/.test(value)
  ) {
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

const getExpectedBrandSlug = (brand: string): string =>
  brand
    .trim()
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const assertUnique = (values: readonly string[]): void => {
  if (new Set(values).size !== values.length) failValidation();
};

function validateDatabaseCatalogRows(
  rows: readonly CatalogDatabaseRow[],
): readonly ValidatedCatalogRow[] {
  const staticProducts = getAllProducts();
  const staticBySlug = new Map(
    staticProducts.map((product) => [product.slug, product]),
  );
  const expectedSlugs = staticProducts.map((product) => product.slug);

  if (
    rows.length !== parityProductCount ||
    staticProducts.length !== parityProductCount
  ) {
    failValidation();
  }

  const validatedRows = rows.map((row, index): ValidatedCatalogRow => {
    if (
      !isNonblankString(row.product_id) ||
      !uuidPattern.test(row.product_id) ||
      !isNonblankString(row.variant_id) ||
      !uuidPattern.test(row.variant_id) ||
      !isNonblankString(row.product_slug) ||
      !isNonblankString(row.product_name) ||
      !isNonblankString(row.brand_name) ||
      !isNonblankString(row.brand_slug) ||
      !isNonblankString(row.sku) ||
      !isNonblankString(row.variant_name) ||
      !isSafeNonnegativeInteger(row.product_sort_order) ||
      (!isSafeNonnegativeInteger(row.ram_gb) && row.ram_gb !== null) ||
      !isSafeNonnegativeInteger(row.storage_gb) ||
      row.storage_gb === 0 ||
      typeof row.financing_available !== "boolean"
    ) {
      failValidation();
    }

    const staticProduct = staticBySlug.get(row.product_slug);
    if (!staticProduct || expectedSlugs[index] !== row.product_slug) {
      return failValidation();
    }

    const category = getCategory(row.category);
    const condition = getCondition(row.condition);
    const badge = getBadge(row.badge);
    const currentPriceCentavos = readCentavos(row.current_price_centavos);
    const srpCentavos =
      row.srp_centavos === null ? null : readCentavos(row.srp_centavos);
    const expectedRam = staticProduct.ramGb ?? null;
    const expectedSrpCentavos =
      staticProduct.srp === undefined ? null : staticProduct.srp * 100;

    if (
      row.product_sort_order !== index ||
      row.product_name !== staticProduct.name ||
      row.brand_name !== staticProduct.brand ||
      row.brand_slug !== getExpectedBrandSlug(staticProduct.brand) ||
      category !== staticProduct.category ||
      row.sku !== staticProduct.sku ||
      row.variant_name !== staticProduct.variant ||
      row.ram_gb !== expectedRam ||
      row.storage_gb !== staticProduct.storageGb ||
      condition !== staticProduct.condition ||
      badge !== (staticProduct.badge ?? null) ||
      row.financing_available !== staticProduct.financingAvailable ||
      currentPriceCentavos !== staticProduct.currentPrice * 100 ||
      srpCentavos !== expectedSrpCentavos
    ) {
      return failValidation();
    }

    return {
      row,
      staticProduct,
      category,
      condition,
      badge,
      currentPriceCentavos,
      srpCentavos,
    };
  });

  assertUnique(validatedRows.map(({ row }) => row.product_slug));
  assertUnique(validatedRows.map(({ row }) => row.sku.toLowerCase()));
  assertUnique(validatedRows.map(({ row }) => row.product_id.toLowerCase()));
  assertUnique(validatedRows.map(({ row }) => row.variant_id.toLowerCase()));

  if (
    expectedSlugs.some(
      (slug) => !validatedRows.some(({ row }) => row.product_slug === slug),
    ) ||
    validatedRows.some(({ row }) => !staticBySlug.has(row.product_slug))
  ) {
    failValidation();
  }

  const apple = validatedRows.find(
    ({ row }) => row.product_slug === "apple-iphone-17",
  );
  const pocoF8 = validatedRows.find(
    ({ row }) => row.product_slug === "poco-f8-ultra",
  );

  if (
    !apple ||
    apple.row.ram_gb !== null ||
    apple.srpCentavos !== null ||
    !pocoF8 ||
    pocoF8.srpCentavos !== null
  ) {
    failValidation();
  }

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
      }): PrototypeProduct => ({
        id: staticProduct.id,
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
        financingMessage: staticProduct.financingMessage,
        financingAvailable: row.financing_available,
        artSeed: staticProduct.artSeed,
        primaryImage: staticProduct.primaryImage,
        images: staticProduct.images,
        specifications: staticProduct.specifications,
      }),
    );
}
