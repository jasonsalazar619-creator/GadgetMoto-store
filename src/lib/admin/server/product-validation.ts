import "server-only";

import type {
  AdminProductSpecification,
  ProductEditorSubmission,
} from "@/lib/admin/products/types";
import type { ProductCategory } from "@/lib/supabase/database.types";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

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
  confirmSlugChange: boolean;
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
      "confirmSlugChange",
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
  if (typeof input.confirmSlugChange !== "boolean") {
    errors.form = "Invalid confirmation state.";
  }

  const sortOrder = readOptionalInteger(
    input.sortOrder,
    "sortOrder",
    errors,
    1_000_000,
  );
  if (sortOrder === null) errors.sortOrder = "Display order is required.";

  if (lifecycle === "active") {
    if (!category) errors.category = "Active products need a category.";
    if (!shortDescription) {
      errors.shortDescription = "Active products need a short description.";
    }
    if (!fullDescription) {
      errors.fullDescription = "Active products need a full description.";
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
      confirmSlugChange: input.confirmSlugChange as boolean,
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
