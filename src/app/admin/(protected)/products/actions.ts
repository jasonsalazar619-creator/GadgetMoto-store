"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthenticatedAdmin } from "@/lib/admin/server/auth";
import { adminProductInternals } from "@/lib/admin/server/products";
import {
  isValidSlug,
  isValidUuid,
  slugifyProductName,
  validateProductSubmission,
} from "@/lib/admin/server/product-validation";
import type {
  AdminProductEditorData,
  ProductMutationCode,
  ProductMutationResult,
} from "@/lib/admin/products/types";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type VariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
type VariantUpdate =
  Database["public"]["Tables"]["product_variants"]["Update"];
type AuthorizedContext = {
  supabase: SupabaseClient<Database>;
  administratorId: string;
};

type DestructiveResult =
  | { ok: true; message: string; redirectTo?: string }
  | {
      ok: false;
      code: ProductMutationCode;
      message: string;
    };

export type CreateDraftState = {
  status: "idle" | "error";
  message: string | null;
  fieldErrors: Record<string, string>;
};

const invalidProductMessage =
  "Review the highlighted fields before saving.";
const saveFailedMessage =
  "The product could not be saved safely. Refresh and try again.";

function failure(
  code: ProductMutationCode,
  message: string,
  fieldErrors?: Record<string, string>,
): ProductMutationResult {
  return { ok: false, code, message, ...(fieldErrors ? { fieldErrors } : {}) };
}

async function authorizeMutation():
  Promise<AuthorizedContext | ProductMutationResult> {
  const authorization = await getAuthenticatedAdmin();

  if (!authorization.ok) {
    const forbidden =
      authorization.code === "ADMIN_FORBIDDEN" ||
      authorization.code === "ADMIN_PROFILE_NOT_FOUND" ||
      authorization.code === "ADMIN_PROFILE_INACTIVE";

    return failure(
      forbidden ? "ADMIN_FORBIDDEN" : "ADMIN_UNAUTHENTICATED",
      forbidden
        ? "Administrator access is required."
        : "Your administrator session is unavailable. Sign in again.",
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return failure(
      "ADMIN_UNAUTHENTICATED",
      "Administrator authentication is not configured.",
    );
  }

  return { supabase, administratorId: authorization.admin.id };
}

function isAuthorizedContext(
  value: AuthorizedContext | ProductMutationResult,
): value is AuthorizedContext {
  return "supabase" in value;
}

async function loadCurrentProduct(
  supabase: SupabaseClient<Database>,
  productId: string,
): Promise<{ product: ProductRow; variant: VariantRow | null } | null> {
  const [productResult, variantResult] = await Promise.all([
    supabase.from("products").select("*").eq("id", productId).maybeSingle(),
    supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (productResult.error || variantResult.error || !productResult.data) {
    return null;
  }

  return { product: productResult.data, variant: variantResult.data };
}

function productUpdateDiff(
  current: ProductRow,
  desired: ProductUpdate,
): ProductUpdate {
  return Object.fromEntries(
    Object.entries(desired).filter(([key, value]) => {
      const currentValue = current[key as keyof ProductRow];
      if (key === "specifications") {
        return JSON.stringify(currentValue) !== JSON.stringify(value);
      }
      return currentValue !== value;
    }),
  ) as ProductUpdate;
}

function variantUpdateDiff(
  current: VariantRow,
  desired: VariantUpdate,
): VariantUpdate {
  return Object.fromEntries(
    Object.entries(desired).filter(
      ([key, value]) => current[key as keyof VariantRow] !== value,
    ),
  ) as VariantUpdate;
}

async function updateProduct(
  supabase: SupabaseClient<Database>,
  productId: string,
  update: ProductUpdate,
): Promise<boolean> {
  if (Object.keys(update).length === 0) return true;

  const { data, error } = await supabase
    .from("products")
    .update(update)
    .eq("id", productId)
    .select("id")
    .maybeSingle();

  return !error && data?.id === productId;
}

async function updateVariant(
  supabase: SupabaseClient<Database>,
  variantId: string,
  update: VariantUpdate,
): Promise<boolean> {
  if (Object.keys(update).length === 0) return true;

  const { data, error } = await supabase
    .from("product_variants")
    .update(update)
    .eq("id", variantId)
    .select("id")
    .maybeSingle();

  return !error && data?.id === variantId;
}

function revalidateStorefront(oldSlug: string, newSlug = oldSlug): void {
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/phones");
  revalidatePath("/tablets");
  revalidatePath("/coming-soon");
  revalidatePath(`/products/${oldSlug}`);
  revalidatePath(`/coming-soon/${oldSlug}`);
  if (newSlug !== oldSlug) {
    revalidatePath(`/products/${newSlug}`);
    revalidatePath(`/coming-soon/${newSlug}`);
  }
  revalidatePath("/sitemap.xml");
}

async function reloadEditor(
  supabase: SupabaseClient<Database>,
  productId: string,
): Promise<AdminProductEditorData | null> {
  const current = await loadCurrentProduct(supabase, productId);
  return current
    ? adminProductInternals.toEditorData(current.product, current.variant)
    : null;
}

export async function saveProductAction(
  input: unknown,
): Promise<ProductMutationResult> {
  const context = await authorizeMutation();
  if (!isAuthorizedContext(context)) return context;

  if (
    typeof input !== "object" ||
    input === null ||
    !("productId" in input) ||
    typeof input.productId !== "string" ||
    !isValidUuid(input.productId)
  ) {
    return failure("INVALID_PRODUCT", invalidProductMessage, {
      productId: "Invalid product.",
    });
  }

  const current = await loadCurrentProduct(context.supabase, input.productId);
  if (!current) {
    return failure("PRODUCT_NOT_FOUND", "The product no longer exists.");
  }

  const validation = validateProductSubmission(
    input,
    current.variant !== null,
  );
  if (!validation.ok) {
    return failure(
      "INVALID_PRODUCT",
      invalidProductMessage,
      validation.fieldErrors,
    );
  }

  const value = validation.value;

  if (
    value.lifecycle === "archived" &&
    current.product.status !== "archived"
  ) {
    return failure("INVALID_PRODUCT", invalidProductMessage, {
      lifecycle: "Use the confirmed Archive action to archive this product.",
    });
  }

  if (
    value.slug !== current.product.slug &&
    !value.confirmSlugChange
  ) {
    return failure("INVALID_PRODUCT", invalidProductMessage, {
      slug: "Confirm the route change before saving a new slug.",
    });
  }

  if (
    current.variant &&
    value.variant.sku !== current.variant.sku &&
    !value.confirmSkuChange
  ) {
    return failure("INVALID_PRODUCT", invalidProductMessage, {
      sku: "Confirm the canonical SKU change before saving.",
    });
  }

  const [brandResult, slugResult, skuResult] = await Promise.all([
    context.supabase
      .from("brands")
      .select("id")
      .eq("id", value.brandId)
      .eq("is_active", true)
      .maybeSingle(),
    context.supabase
      .from("products")
      .select("id")
      .eq("slug", value.slug)
      .neq("id", value.productId)
      .maybeSingle(),
    value.variant.sku
      ? context.supabase
          .from("product_variants")
          .select("id")
          .ilike("sku", value.variant.sku)
          .neq("id", current.variant?.id ?? "00000000-0000-0000-0000-000000000000")
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (brandResult.error || !brandResult.data) {
    return failure("INVALID_PRODUCT", invalidProductMessage, {
      brandId: "Select an active brand.",
    });
  }
  if (slugResult.error) {
    return failure("PRODUCT_SAVE_FAILED", saveFailedMessage);
  }
  if (slugResult.data) {
    return failure(
      "DUPLICATE_PRODUCT_SLUG",
      "That product slug is already in use.",
      { slug: "Choose a unique slug." },
    );
  }
  if (skuResult.error) {
    return failure("PRODUCT_SAVE_FAILED", saveFailedMessage);
  }
  if (skuResult.data) {
    return failure(
      "DUPLICATE_PRODUCT_SKU",
      "That SKU is already assigned to another product.",
      { sku: "Choose a unique SKU." },
    );
  }

  const targetActive = value.lifecycle === "active";
  const targetPreview = value.lifecycle === "coming_soon";
  const targetArchived = value.lifecycle === "archived";
  const oldSlug = current.product.slug;
  let workingProduct = current.product;

  const needsVisibilityBridge =
    (targetActive && current.product.is_public_preview) ||
    (targetPreview &&
      (current.product.status !== "draft" ||
        current.product.archived_at !== null));

  if (needsVisibilityBridge) {
    const bridge: ProductUpdate = {
      status: "draft",
      is_public_preview: false,
      published_at: null,
      archived_at: null,
    };
    if (
      !(await updateProduct(
        context.supabase,
        value.productId,
        productUpdateDiff(workingProduct, bridge),
      ))
    ) {
      return failure("PRODUCT_SAVE_FAILED", saveFailedMessage);
    }
    workingProduct = { ...workingProduct, ...bridge };
  }

  let variant = current.variant;
  if (value.variant.requested) {
    const variantValues = {
      sku: value.variant.sku as string,
      variant_name: value.variant.variantName as string,
      ram_gb: value.variant.ramGb,
      extended_ram_gb: value.variant.extendedRamGb,
      storage_gb: value.variant.storageGb as number,
      current_price_centavos: value.variant.currentPriceCentavos as number,
      srp_centavos: value.variant.srpCentavos,
      badge: value.variant.badge,
      financing_available: value.variant.financingAvailable,
      is_active: targetActive
        ? true
        : targetPreview
          ? false
          : (variant?.is_active ?? false),
    } satisfies VariantUpdate;

    if (variant) {
      if (
        !(await updateVariant(
          context.supabase,
          variant.id,
          variantUpdateDiff(variant, variantValues),
        ))
      ) {
        return failure("PRODUCT_SAVE_FAILED", saveFailedMessage);
      }
      variant = { ...variant, ...variantValues };
    } else {
      const { data, error } = await context.supabase
        .from("product_variants")
        .insert({
          product_id: value.productId,
          sku: variantValues.sku,
          variant_name: variantValues.variant_name,
          ram_gb: variantValues.ram_gb,
          extended_ram_gb: variantValues.extended_ram_gb,
          storage_gb: variantValues.storage_gb,
          condition: "brand_new",
          current_price_centavos: variantValues.current_price_centavos,
          srp_centavos: variantValues.srp_centavos,
          badge: variantValues.badge,
          financing_available: variantValues.financing_available,
          is_active: variantValues.is_active,
          sort_order: 0,
        })
        .select("*")
        .maybeSingle();

      if (error || !data) {
        return failure("PRODUCT_SAVE_FAILED", saveFailedMessage);
      }
      variant = data;
    }
  }

  const desiredProduct: ProductUpdate = {
    brand_id: value.brandId,
    name: value.name,
    slug: value.slug,
    category: value.category,
    short_description: value.shortDescription,
    full_description: value.fullDescription,
    specifications: value.specifications,
    is_featured: value.isFeatured,
    sort_order: value.sortOrder,
    status: targetArchived ? "archived" : targetActive ? "active" : "draft",
    is_public_preview: targetPreview,
    published_at: targetActive
      ? current.product.published_at ?? new Date().toISOString()
      : null,
    archived_at: targetArchived ? current.product.archived_at : null,
  };

  if (
    !(await updateProduct(
      context.supabase,
      value.productId,
      productUpdateDiff(workingProduct, desiredProduct),
    ))
  ) {
    return failure("PRODUCT_SAVE_FAILED", saveFailedMessage);
  }

  const product = await reloadEditor(context.supabase, value.productId);
  if (!product) {
    return failure("PRODUCT_SAVE_FAILED", saveFailedMessage);
  }

  revalidateStorefront(oldSlug, value.slug);
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${value.productId}`);

  return { ok: true, product, message: "Saved" };
}

export async function archiveProductAction(
  input: unknown,
): Promise<DestructiveResult> {
  const context = await authorizeMutation();
  if (!isAuthorizedContext(context)) return context;

  if (
    typeof input !== "object" ||
    input === null ||
    Object.keys(input).length !== 2 ||
    !("productId" in input) ||
    !("confirmationName" in input) ||
    typeof input.productId !== "string" ||
    typeof input.confirmationName !== "string" ||
    !isValidUuid(input.productId)
  ) {
    return {
      ok: false,
      code: "INVALID_PRODUCT",
      message: "Invalid archive request.",
    };
  }

  const current = await loadCurrentProduct(context.supabase, input.productId);
  if (!current) {
    return {
      ok: false,
      code: "PRODUCT_NOT_FOUND",
      message: "The product no longer exists.",
    };
  }
  if (input.confirmationName !== current.product.name) {
    return {
      ok: false,
      code: "INVALID_PRODUCT",
      message: "Product confirmation did not match.",
    };
  }
  if (current.product.status === "archived") {
    return { ok: true, message: "Product is already archived." };
  }

  const archivedAt = new Date().toISOString();
  const archived = await updateProduct(context.supabase, input.productId, {
    status: "archived",
    is_public_preview: false,
    published_at: null,
    archived_at: archivedAt,
  });

  if (!archived) {
    return {
      ok: false,
      code: "PRODUCT_SAVE_FAILED",
      message: "The product could not be archived safely.",
    };
  }

  revalidateStorefront(current.product.slug);
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${input.productId}`);

  return { ok: true, message: "Product archived." };
}

export async function deleteDraftProductAction(
  input: unknown,
): Promise<DestructiveResult> {
  const context = await authorizeMutation();
  if (!isAuthorizedContext(context)) return context;

  if (
    typeof input !== "object" ||
    input === null ||
    Object.keys(input).length !== 2 ||
    !("productId" in input) ||
    !("confirmationName" in input) ||
    typeof input.productId !== "string" ||
    typeof input.confirmationName !== "string" ||
    !isValidUuid(input.productId)
  ) {
    return {
      ok: false,
      code: "INVALID_PRODUCT",
      message: "Invalid delete request.",
    };
  }

  const current = await loadCurrentProduct(context.supabase, input.productId);
  if (!current) {
    return {
      ok: false,
      code: "PRODUCT_NOT_FOUND",
      message: "The product no longer exists.",
    };
  }
  if (input.confirmationName !== current.product.name) {
    return {
      ok: false,
      code: "INVALID_PRODUCT",
      message: "Type the exact product name to confirm permanent deletion.",
    };
  }
  if (
    current.product.status !== "draft" ||
    current.product.is_public_preview ||
    current.variant !== null
  ) {
    return {
      ok: false,
      code: "PRODUCT_DELETE_BLOCKED",
      message:
        "Permanent deletion is limited to unused non-preview drafts. Archive this product instead.",
    };
  }

  const { data: canDelete, error: eligibilityError } =
    await context.supabase.rpc("can_permanently_delete_product", {
      target_product_id: input.productId,
    });

  if (eligibilityError || canDelete !== true) {
    return {
      ok: false,
      code: "PRODUCT_DELETE_BLOCKED",
      message:
        "This draft has retained dependencies and cannot be deleted. Archive it instead.",
    };
  }

  const { data, error } = await context.supabase
    .from("products")
    .delete()
    .eq("id", input.productId)
    .eq("status", "draft")
    .eq("is_public_preview", false)
    .select("id")
    .maybeSingle();

  if (error || data?.id !== input.productId) {
    return {
      ok: false,
      code: "PRODUCT_DELETE_BLOCKED",
      message:
        "The draft could not be deleted safely. Archive it instead.",
    };
  }

  revalidateStorefront(current.product.slug);
  revalidatePath("/admin");
  revalidatePath("/admin/products");

  return {
    ok: true,
    message: "Draft permanently deleted.",
    redirectTo: "/admin/products",
  };
}

function readCreateField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function createDraftProductAction(
  _previousState: CreateDraftState,
  formData: FormData,
): Promise<CreateDraftState> {
  const fieldNames = [...formData.keys()].filter(
    (key) => !key.startsWith("$ACTION_"),
  );
  const allowedFields = ["name", "slug", "brandId", "category", "status"];
  if (
    fieldNames.some((field) => !allowedFields.includes(field)) ||
    fieldNames.length !== allowedFields.length ||
    new Set(fieldNames).size !== allowedFields.length
  ) {
    return {
      status: "error",
      message: "Invalid draft request.",
      fieldErrors: {},
    };
  }

  const context = await authorizeMutation();
  if (!isAuthorizedContext(context)) {
    return {
      status: "error",
      message: context.message,
      fieldErrors: {},
    };
  }

  const name = readCreateField(formData, "name");
  const suppliedSlug = readCreateField(formData, "slug").toLocaleLowerCase();
  const slug = suppliedSlug || slugifyProductName(name);
  const brandId = readCreateField(formData, "brandId");
  const category = readCreateField(formData, "category");
  const status = readCreateField(formData, "status");
  const fieldErrors: Record<string, string> = {};

  if (!name || name.length > 160) {
    fieldErrors.name = "Enter a product name using 160 characters or fewer.";
  }
  if (!isValidSlug(slug)) {
    fieldErrors.slug = "Use lowercase letters, numbers, and single hyphens.";
  }
  if (!isValidUuid(brandId)) {
    fieldErrors.brandId = "Select an active brand.";
  }
  if (category !== "phone" && category !== "tablet") {
    fieldErrors.category = "Select a category.";
  }
  if (status !== "draft") {
    fieldErrors.status = "New products must begin as drafts.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Review the highlighted fields.",
      fieldErrors,
    };
  }

  const [brandResult, slugResult, orderResult] = await Promise.all([
    context.supabase
      .from("brands")
      .select("id")
      .eq("id", brandId)
      .eq("is_active", true)
      .maybeSingle(),
    context.supabase
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle(),
    context.supabase
      .from("products")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (brandResult.error || !brandResult.data) {
    return {
      status: "error",
      message: "Review the highlighted fields.",
      fieldErrors: { brandId: "Select an active brand." },
    };
  }
  if (slugResult.error || orderResult.error) {
    return {
      status: "error",
      message: "The draft could not be created safely.",
      fieldErrors: {},
    };
  }
  if (slugResult.data) {
    return {
      status: "error",
      message: "That product slug is already in use.",
      fieldErrors: { slug: "Choose a unique slug." },
    };
  }

  const sortOrder = (orderResult.data?.sort_order ?? -1) + 1;
  const { data, error } = await context.supabase
    .from("products")
    .insert({
      brand_id: brandId,
      name,
      slug,
      category: category as "phone" | "tablet",
      status: "draft",
      is_public_preview: false,
      is_featured: false,
      short_description: null,
      full_description: null,
      highlights: [],
      specifications: [],
      published_at: null,
      archived_at: null,
      sort_order: sortOrder,
    })
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      status: "error",
      message: "The draft could not be created safely.",
      fieldErrors: {},
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/products");
  redirect(`/admin/products/${data.id}`);
}
