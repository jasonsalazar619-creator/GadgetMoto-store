import "server-only";

import {
  getAllProducts,
  type ProductCategory,
  type ProductColor,
  type ProductVariant,
  type ProductVariantColorOption,
  type PrototypeProduct,
} from "@/data/prototype-products";
import { upcomingProducts } from "@/data/upcoming-products";
import type { ProductImage } from "@/data/product-images";
import type { ProductSpecification } from "@/data/product-specifications";
import { resolveProductImage } from "@/lib/catalog/product-image-source";
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
  variantColorOptions: readonly ProductVariantColorOption[];
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
      typeof item.storagePath !== "string" ||
      !("altText" in item) ||
      typeof item.altText !== "string" ||
      !item.altText.trim()
    ) {
      return failValidation();
    }
    const image = resolveProductImage(
      item.storagePath,
      item.altText,
      imageByPath.get(item.storagePath),
    );
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
    return { id: item.id, name: item.name, hexCode: item.hexCode, purchasable: true };
  });

  assertUnique(colors.map(({ id }) => id.toLocaleLowerCase()));
  assertUnique(colors.map(({ name }) => name.toLocaleLowerCase()));
  return colors;
}

function readVariantColorOptions(
  value: unknown,
): readonly ProductVariantColorOption[] {
  if (!Array.isArray(value) || value.length > 2500) return failValidation();

  const options = value.map((item): ProductVariantColorOption => {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item) ||
      !("variantId" in item) ||
      !("colorId" in item) ||
      typeof item.variantId !== "string" ||
      !uuidPattern.test(item.variantId) ||
      typeof item.colorId !== "string" ||
      !uuidPattern.test(item.colorId)
    ) {
      return failValidation();
    }
    return {
      variantId: item.variantId,
      colorId: item.colorId,
      isAvailable: true,
    };
  });

  assertUnique(
    options.map(
      ({ variantId, colorId }) =>
        `${variantId.toLocaleLowerCase()}:${colorId.toLocaleLowerCase()}`,
    ),
  );
  return options;
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
      !isSafeNonnegativeInteger(row.variant_sort_order) ||
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
    const variantColorOptions = readVariantColorOptions(
      row.variant_color_options,
    );

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
      variantColorOptions,
    };
  });

  assertUnique(validatedRows.map(({ row }) => row.sku.toLocaleLowerCase()));
  assertUnique(validatedRows.map(({ row }) => row.variant_id.toLocaleLowerCase()));

  return validatedRows;
}

export function normalizeDatabaseCatalogRows(
  rows: readonly CatalogDatabaseRow[],
): readonly PrototypeProduct[] {
  const validatedRows = validateDatabaseCatalogRows(rows);
  const ordered = [...validatedRows].sort(
    (left, right) =>
      left.row.product_sort_order - right.row.product_sort_order ||
      left.row.product_slug.localeCompare(right.row.product_slug) ||
      left.row.variant_sort_order - right.row.variant_sort_order ||
      left.row.sku.localeCompare(right.row.sku),
  );
  const grouped = new Map<string, ValidatedCatalogRow[]>();

  for (const item of ordered) {
    grouped.set(item.row.product_slug, [
      ...(grouped.get(item.row.product_slug) ?? []),
      item,
    ]);
  }

  const products = [...grouped.values()].map((productRows): PrototypeProduct => {
    const first = productRows[0];
    if (!first) return failValidation();

    for (const item of productRows.slice(1)) {
      if (
        item.row.product_id !== first.row.product_id ||
        item.row.product_name !== first.row.product_name ||
        item.row.brand_name !== first.row.brand_name ||
        item.row.brand_slug !== first.row.brand_slug ||
        item.row.category !== first.row.category ||
        item.row.product_sort_order !== first.row.product_sort_order ||
        item.row.short_description !== first.row.short_description ||
        item.row.full_description !== first.row.full_description ||
        JSON.stringify(item.images) !== JSON.stringify(first.images) ||
        JSON.stringify(item.specifications) !== JSON.stringify(first.specifications) ||
        JSON.stringify(item.colors) !== JSON.stringify(first.colors) ||
        JSON.stringify(item.variantColorOptions) !==
          JSON.stringify(first.variantColorOptions)
      ) {
        return failValidation();
      }
    }

    const databaseVariants = productRows.map(
      (item, index): ProductVariant => ({
        id: item.row.variant_id,
        name: item.row.variant_name,
        sku: item.row.sku,
        ...(item.row.ram_gb === null ? {} : { ramGb: item.row.ram_gb }),
        ...(item.row.extended_ram_gb === null
          ? {}
          : { extendedRamGb: item.row.extended_ram_gb }),
        storageGb: item.row.storage_gb,
        condition: item.condition,
        currentPrice: item.currentPriceCentavos / 100,
        ...(item.srpCentavos === null
          ? {}
          : { srp: item.srpCentavos / 100 }),
        ...(item.badge === null ? {} : { badge: item.badge }),
        financingAvailable: item.row.financing_available,
        isActive: true,
        isDefault: index === 0,
        purchasable: true,
        availabilityMessage: "Available",
      }),
    );
    const databaseVariantIds = new Set(
      databaseVariants.map(({ id }) => id.toLocaleLowerCase()),
    );
    const databaseColorIds = new Set(
      first.colors.map(({ id }) => id.toLocaleLowerCase()),
    );
    if (
      first.variantColorOptions.some(
        ({ variantId, colorId }) =>
          !databaseVariantIds.has(variantId.toLocaleLowerCase()) ||
          !databaseColorIds.has(colorId.toLocaleLowerCase()),
      )
    ) {
      return failValidation();
    }
    const staticManufacturerVariants = (first.staticProduct?.variants ?? [])
      .filter(
        (candidate) =>
          !candidate.purchasable &&
          !databaseVariants.some(
            (variant) =>
              variant.ramGb === candidate.ramGb &&
              variant.storageGb === candidate.storageGb,
          ),
      )
      .map((variant) => ({ ...variant, isDefault: false }));
    const variants = [...databaseVariants, ...staticManufacturerVariants];
    const defaultVariant = variants[0];
    if (!defaultVariant || defaultVariant.currentPrice === null || !defaultVariant.sku) {
      return failValidation();
    }
    const primaryImage = first.row.primary_image_path
      ? resolveProductImage(
          first.row.primary_image_path,
          first.row.primary_image_alt ?? "",
          imageByPath.get(first.row.primary_image_path),
        )
      : null;

    return {
      id: first.staticProduct?.id ?? first.row.product_slug,
      slug: first.row.product_slug,
      sku: defaultVariant.sku,
      brand: first.row.brand_name,
      name: first.row.product_name,
      category: first.category,
      variant: defaultVariant.name,
      currentPrice: defaultVariant.currentPrice,
      ...(defaultVariant.srp === undefined ? {} : { srp: defaultVariant.srp }),
      ...(defaultVariant.ramGb === undefined ? {} : { ramGb: defaultVariant.ramGb }),
      storageGb: defaultVariant.storageGb,
      condition: defaultVariant.condition,
      ...(defaultVariant.badge === undefined ? {} : { badge: defaultVariant.badge }),
      financingMessage: "Financing options available",
      financingAvailable: defaultVariant.financingAvailable,
      artSeed:
        first.staticProduct?.artSeed ??
        (first.category === "Tablet" ? "wide-orbit" : "orbit-blue"),
      primaryImage,
      images: first.images.filter(({ src }) => src !== primaryImage?.src),
      specifications: first.staticProduct?.specifications ?? first.specifications,
      ...(() => {
        const researchedColors = (first.staticProduct?.colors ?? []).filter(
          (candidate) =>
            !first.colors.some(
              (color) =>
                color.name.toLocaleLowerCase() ===
                candidate.name.toLocaleLowerCase(),
            ),
        );
        const colors = [...first.colors, ...researchedColors];
        return colors.length ? { colors } : {};
      })(),
      ...(first.row.short_description
        ? { shortDescription: first.row.short_description }
        : {}),
      ...(first.row.full_description
        ? { fullDescription: first.row.full_description }
        : {}),
      variants,
      variantColorOptions: first.variantColorOptions,
      manufacturerCombinations:
        first.staticProduct?.manufacturerCombinations ?? [],
    };
  });

  assertUnique(products.map(({ slug }) => slug));
  assertUnique(products.map(({ id }) => id.toLocaleLowerCase()));
  return products;
}
