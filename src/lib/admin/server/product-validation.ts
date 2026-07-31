import "server-only";

import type {
  AdminProductSpecification,
  ProductEditorSubmission,
} from "@/lib/admin/products/types";
import type {
  ProductBadge,
  ProductCategory,
} from "@/lib/supabase/database.types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const skuPattern = /^[A-Z0-9][A-Z0-9-]{2,79}$/;

type UnknownRecord = Record<string, unknown>;

export type NormalizedProductSubmission = {
  productId: string;
  name: string;
  slug: string;
  brandId: string;
  category: ProductCategory | null;
  lifecycle: "draft" | "coming_soon" | "active" | "archived";
  shortDescription: string | null;
  fullDescription: string | null;
  isFeatured: boolean;
  sortOrder: number;
  specifications: AdminProductSpecification[];
  variant: {
    requested: boolean;
    sku: string | null;
    variantName: string | null;
    ramGb: number | null;
    extendedRamGb: number | null;
    storageGb: number | null;
    currentPriceCentavos: number | null;
    srpCentavos: number | null;
    badge: ProductBadge | null;
    financingAvailable: boolean;
  };
  confirmSlugChange: boolean;
  confirmSkuChange: boolean;
};

export type ValidationResult =
  | { ok: true; value: NormalizedProductSubmission }
  | { ok: false; fieldErrors: Record<string, string> };

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: UnknownRecord, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return (
    keys.length === allowed.length &&
    keys.every((key) => allowed.includes(key))
  );
}

function readTrimmedString(
  value: unknown,
  field: string,
  errors: Record<string, string>,
  options: { required?: boolean; max: number },
): string {
  if (typeof value !== "string") {
    errors[field] = "Enter a valid value.";
    return "";
  }

  const normalized = value.trim();
  if (options.required && !normalized) {
    errors[field] = "This field is required.";
  } else if (normalized.length > options.max) {
    errors[field] = `Use ${options.max} characters or fewer.`;
  }

  return normalized;
}

function readOptionalInteger(
  value: unknown,
  field: string,
  errors: Record<string, string>,
  maximum: number,
): number | null {
  const normalized = readTrimmedString(value, field, errors, { max: 12 });
  if (!normalized) return null;

  if (!/^[0-9]+$/.test(normalized)) {
    errors[field] = "Enter a whole nonnegative number.";
    return null;
  }

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed) || parsed > maximum) {
    errors[field] = "Enter a smaller whole number.";
    return null;
  }

  return parsed;
}

function readPesosAsCentavos(
  value: unknown,
  field: string,
  errors: Record<string, string>,
): number | null {
  const normalized = readTrimmedString(value, field, errors, { max: 24 });
  if (!normalized) return null;

  const match = /^(0|[1-9][0-9]*)(?:\.([0-9]{1,2}))?$/.exec(normalized);
  if (!match) {
    errors[field] = "Enter pesos using up to two decimal places.";
    return null;
  }

  const whole = BigInt(match[1]);
  const fractional = BigInt((match[2] ?? "").padEnd(2, "0"));
  const centavos = whole * BigInt(100) + fractional;

  if (centavos > BigInt(Number.MAX_SAFE_INTEGER)) {
    errors[field] = "Enter a smaller price.";
    return null;
  }

  return Number(centavos);
}

function readSpecifications(
  value: unknown,
  errors: Record<string, string>,
): AdminProductSpecification[] {
  if (!Array.isArray(value) || value.length > 40) {
    errors.specifications = "Use no more than 40 specifications.";
    return [];
  }

  const specifications: AdminProductSpecification[] = [];

  value.forEach((item, index) => {
    if (
      !isRecord(item) ||
      !hasExactKeys(item, ["label", "value"]) ||
      typeof item.label !== "string" ||
      typeof item.value !== "string"
    ) {
      errors.specifications = "Each specification needs a label and value.";
      return;
    }

    const label = item.label.trim();
    const specificationValue = item.value.trim();

    if (!label || !specificationValue) {
      errors[`specifications.${index}`] =
        "Complete or remove this specification.";
    } else if (label.length > 80 || specificationValue.length > 300) {
      errors[`specifications.${index}`] =
        "Keep labels under 80 characters and values under 300.";
    } else {
      specifications.push({ label, value: specificationValue });
    }
  });

  const normalizedLabels = specifications.map(({ label }) =>
    label.toLocaleLowerCase(),
  );
  if (new Set(normalizedLabels).size !== normalizedLabels.length) {
    errors.specifications = "Specification labels must be unique.";
  }

  return specifications;
}

export function validateProductSubmission(
  input: unknown,
  hasExistingVariant: boolean,
): ValidationResult {
  const errors: Record<string, string> = {};

  if (
    !isRecord(input) ||
    !hasExactKeys(input, [
      "productId",
      "name",
      "slug",
      "brandId",
      "category",
      "lifecycle",
      "shortDescription",
      "fullDescription",
      "isFeatured",
      "sortOrder",
      "specifications",
      "variant",
      "confirmSlugChange",
      "confirmSkuChange",
    ]) ||
    !isRecord(input.variant) ||
    !hasExactKeys(input.variant, [
      "sku",
      "variantName",
      "ramGb",
      "extendedRamGb",
      "storageGb",
      "currentPricePesos",
      "srpPesos",
      "badge",
      "financingAvailable",
    ])
  ) {
    return { ok: false, fieldErrors: { form: "Invalid product request." } };
  }

  const productId = readTrimmedString(input.productId, "productId", errors, {
    required: true,
    max: 36,
  });
  const name = readTrimmedString(input.name, "name", errors, {
    required: true,
    max: 160,
  });
  const slug = readTrimmedString(input.slug, "slug", errors, {
    required: true,
    max: 160,
  }).toLocaleLowerCase();
  const brandId = readTrimmedString(input.brandId, "brandId", errors, {
    required: true,
    max: 36,
  });
  const shortDescription = readTrimmedString(
    input.shortDescription,
    "shortDescription",
    errors,
    { max: 500 },
  );
  const fullDescription = readTrimmedString(
    input.fullDescription,
    "fullDescription",
    errors,
    { max: 5000 },
  );

  if (!uuidPattern.test(productId)) errors.productId = "Invalid product.";
  if (!uuidPattern.test(brandId)) errors.brandId = "Select a valid brand.";
  if (!slugPattern.test(slug)) {
    errors.slug = "Use lowercase letters, numbers, and single hyphens.";
  }

  const category =
    input.category === "phone" || input.category === "tablet"
      ? input.category
      : input.category === ""
        ? null
        : undefined;
  if (category === undefined) errors.category = "Select a valid category.";

  const lifecycle =
    input.lifecycle === "draft" ||
    input.lifecycle === "coming_soon" ||
    input.lifecycle === "active" ||
    input.lifecycle === "archived"
      ? input.lifecycle
      : undefined;
  if (!lifecycle) errors.lifecycle = "Select a valid status.";

  if (typeof input.isFeatured !== "boolean") {
    errors.isFeatured = "Select a valid featured state.";
  }
  if (
    typeof input.confirmSlugChange !== "boolean" ||
    typeof input.confirmSkuChange !== "boolean"
  ) {
    errors.form = "Invalid confirmation state.";
  }

  const sortOrder = readOptionalInteger(
    input.sortOrder,
    "sortOrder",
    errors,
    1_000_000,
  );
  if (sortOrder === null) errors.sortOrder = "Display order is required.";

  const sku = readTrimmedString(input.variant.sku, "sku", errors, {
    max: 80,
  }).toLocaleUpperCase();
  const variantName = readTrimmedString(
    input.variant.variantName,
    "variantName",
    errors,
    { max: 160 },
  );
  const ramGb = readOptionalInteger(input.variant.ramGb, "ramGb", errors, 4096);
  const extendedRamGb = readOptionalInteger(
    input.variant.extendedRamGb,
    "extendedRamGb",
    errors,
    4096,
  );
  const storageGb = readOptionalInteger(
    input.variant.storageGb,
    "storageGb",
    errors,
    100_000,
  );
  const currentPriceCentavos = readPesosAsCentavos(
    input.variant.currentPricePesos,
    "currentPricePesos",
    errors,
  );
  const srpCentavos = readPesosAsCentavos(
    input.variant.srpPesos,
    "srpPesos",
    errors,
  );

  if (sku && !skuPattern.test(sku)) {
    errors.sku = "Use 3–80 uppercase letters, numbers, or hyphens.";
  }
  if (ramGb === 0) errors.ramGb = "Physical RAM must be positive.";
  if (extendedRamGb === 0) {
    errors.extendedRamGb = "Extended RAM must be positive.";
  }
  if (storageGb === 0) errors.storageGb = "Storage must be positive.";
  if (
    srpCentavos !== null &&
    currentPriceCentavos !== null &&
    srpCentavos < currentPriceCentavos
  ) {
    errors.srpPesos = "SRP cannot be below the current price.";
  }

  const badge =
    input.variant.badge === "new" || input.variant.badge === "sale"
      ? input.variant.badge
      : input.variant.badge === ""
        ? null
        : undefined;
  if (badge === undefined) errors.badge = "Select a valid badge.";
  if (typeof input.variant.financingAvailable !== "boolean") {
    errors.financingAvailable = "Select a valid financing state.";
  }

  const requested =
    hasExistingVariant ||
    Boolean(
      sku ||
        variantName ||
        input.variant.ramGb ||
        input.variant.extendedRamGb ||
        input.variant.storageGb ||
        input.variant.currentPricePesos ||
        input.variant.srpPesos ||
        input.variant.badge,
    );

  if (requested) {
    if (!sku) errors.sku = "SKU is required for a variant.";
    if (!variantName) errors.variantName = "Variant name is required.";
    if (storageGb === null) errors.storageGb = "Storage is required.";
    if (currentPriceCentavos === null) {
      errors.currentPricePesos = "Current price is required.";
    }
  }

  if (lifecycle === "active") {
    if (!category) errors.category = "Active products need a category.";
    if (!shortDescription) {
      errors.shortDescription = "Active products need a short description.";
    }
    if (!fullDescription) {
      errors.fullDescription = "Active products need a full description.";
    }
    if (!requested) {
      errors.variant = "Active products need a complete purchasable variant.";
    }
  }

  if (lifecycle === "coming_soon") {
    if (!shortDescription) {
      errors.shortDescription =
        "Coming Soon products need a short description.";
    }
    if (!fullDescription) {
      errors.fullDescription =
        "Coming Soon products need a full description.";
    }
  }

  const specifications = readSpecifications(input.specifications, errors);

  if (Object.keys(errors).length > 0) {
    return { ok: false, fieldErrors: errors };
  }

  return {
    ok: true,
    value: {
      productId,
      name,
      slug,
      brandId,
      category: category ?? null,
      lifecycle: lifecycle ?? "draft",
      shortDescription: shortDescription || null,
      fullDescription: fullDescription || null,
      isFeatured: input.isFeatured as boolean,
      sortOrder: sortOrder ?? 0,
      specifications,
      variant: {
        requested,
        sku: sku || null,
        variantName: variantName || null,
        ramGb,
        extendedRamGb,
        storageGb,
        currentPriceCentavos,
        srpCentavos,
        badge: badge ?? null,
        financingAvailable: input.variant.financingAvailable as boolean,
      },
      confirmSlugChange: input.confirmSlugChange as boolean,
      confirmSkuChange: input.confirmSkuChange as boolean,
    },
  };
}

export function isValidUuid(value: string): boolean {
  return uuidPattern.test(value);
}

export function isValidSlug(value: string): boolean {
  return value.length <= 160 && slugPattern.test(value);
}

export function slugifyProductName(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160)
    .replace(/-+$/g, "");
}

export type ProductEditorInput = ProductEditorSubmission;
