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
  ProductImageMutationResult,
  ProductMutationCode,
  ProductMutationResult,
  ProductPromotionResult,
  ProductColorEditorSubmission,
  ProductColorMutationResult,
  ProductVariantColorAvailabilitySubmission,
  ProductVariantColorAvailabilityResult,
  ProductVariantEditorSubmission,
  ProductVariantMutationResult,
} from "@/lib/admin/products/types";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type VariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
type VariantUpdate =
  Database["public"]["Tables"]["product_variants"]["Update"];
type ImageRow = Database["public"]["Tables"]["product_images"]["Row"];
type AuthorizedContext = {
  supabase: SupabaseClient<Database>;
  administratorId: string;
};
type ProductMutationFailure = Extract<ProductMutationResult, { ok: false }>;

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
): ProductMutationFailure {
  return { ok: false, code, message, ...(fieldErrors ? { fieldErrors } : {}) };
}

async function authorizeMutation():
  Promise<AuthorizedContext | ProductMutationFailure> {
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
  value: AuthorizedContext | ProductMutationFailure,
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
  revalidatePath("/sale");
  revalidatePath("/coming-soon");
  revalidatePath("/compare");
  revalidatePath("/cart");
  revalidatePath("/checkout");
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
  return adminProductInternals.loadEditorData(supabase, productId);
}

const imageBucket = "product-images";
const maximumImageBytes = 8_388_608;
const maximumImagesPerProduct = 20;
const imageExtensions = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
} as const;

function imageFailure(message: string): ProductImageMutationResult {
  return { ok: false, message };
}

async function hasMatchingImageSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (file.type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (file.type === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => bytes[index] === value,
    );
  }
  if (file.type === "image/webp") {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }
  if (file.type === "image/avif") {
    const brand = String.fromCharCode(...bytes.slice(8, 12));
    return (
      String.fromCharCode(...bytes.slice(4, 8)) === "ftyp" &&
      ["avif", "avis", "mif1", "msf1"].includes(brand)
    );
  }
  return false;
}

async function loadProductImages(
  supabase: SupabaseClient<Database>,
  productId: string,
) {
  const product = await reloadEditor(supabase, productId);
  return product?.images ?? null;
}

export async function uploadProductGalleryImageAction(
  formData: FormData,
): Promise<ProductImageMutationResult> {
  const fields = [...formData.keys()].filter(
    (key) => !key.startsWith("$ACTION_"),
  );
  if (
    fields.length !== 3 ||
    new Set(fields).size !== 3 ||
    fields.some((field) => !["productId", "altText", "image"].includes(field))
  ) {
    return imageFailure("Invalid image upload request.");
  }

  const productId = formData.get("productId");
  const altTextValue = formData.get("altText");
  const image = formData.get("image");
  const altText =
    typeof altTextValue === "string" ? altTextValue.trim() : "";

  if (
    typeof productId !== "string" ||
    !isValidUuid(productId) ||
    !(image instanceof File) ||
    image.size === 0 ||
    image.size > maximumImageBytes ||
    !(image.type in imageExtensions) ||
    !altText ||
    altText.length > 300
  ) {
    return imageFailure(
      "Choose a valid JPEG, PNG, WebP, or AVIF image up to 8 MB and include its description.",
    );
  }

  if (!(await hasMatchingImageSignature(image))) {
    return imageFailure("The selected file does not match its image format.");
  }

  const context = await authorizeMutation();
  if (!isAuthorizedContext(context)) return imageFailure(context.message);

  const [productResult, imageResult] = await Promise.all([
    context.supabase
      .from("products")
      .select("id, slug")
      .eq("id", productId)
      .maybeSingle(),
    context.supabase
      .from("product_images")
      .select("id, sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: false }),
  ]);

  if (productResult.error || !productResult.data) {
    return imageFailure("The product no longer exists.");
  }
  if (imageResult.error || !imageResult.data) {
    return imageFailure("Product images could not be loaded safely.");
  }
  if (imageResult.data.length >= maximumImagesPerProduct) {
    return imageFailure("This product already has the maximum of 20 images.");
  }

  const extension = imageExtensions[image.type as keyof typeof imageExtensions];
  const storagePath = `products/${productId}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await context.supabase.storage
    .from(imageBucket)
    .upload(storagePath, image, {
      cacheControl: "31536000",
      contentType: image.type,
      upsert: false,
    });

  if (uploadError) {
    return imageFailure("The image could not be uploaded safely.");
  }

  const nextSortOrder =
    (imageResult.data[0]?.sort_order ?? -1) + 1;
  const isFirstImage = imageResult.data.length === 0;
  const { error: insertError } = await context.supabase
    .from("product_images")
    .insert({
      product_id: productId,
      variant_id: null,
      storage_path: storagePath,
      alt_text: altText,
      media_type: "image",
      sort_order: nextSortOrder,
      is_primary: isFirstImage,
      is_published: true,
    });

  if (insertError) {
    await context.supabase.storage.from(imageBucket).remove([storagePath]);
    return imageFailure("The image assignment could not be saved safely.");
  }

  const images = await loadProductImages(context.supabase, productId);
  if (!images) {
    return imageFailure("The updated gallery could not be loaded safely.");
  }

  revalidateStorefront(productResult.data.slug);
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);

  return {
    ok: true,
    message: isFirstImage
      ? "Primary storefront image added."
      : "Gallery image added.",
    images,
  };
}

export async function setProductPrimaryImageAction(
  input: unknown,
): Promise<ProductImageMutationResult> {
  if (
    typeof input !== "object" ||
    input === null ||
    Object.keys(input).length !== 2 ||
    !("productId" in input) ||
    !("imageId" in input) ||
    typeof input.productId !== "string" ||
    typeof input.imageId !== "string" ||
    !isValidUuid(input.productId) ||
    !isValidUuid(input.imageId)
  ) {
    return imageFailure("Invalid primary-image request.");
  }

  const context = await authorizeMutation();
  if (!isAuthorizedContext(context)) return imageFailure(context.message);

  const productResult = await context.supabase
    .from("products")
    .select("id, slug")
    .eq("id", input.productId)
    .maybeSingle();

  if (productResult.error || !productResult.data) {
    return imageFailure("The product no longer exists.");
  }

  const { data: result, error } = await context.supabase.rpc(
    "set_product_primary_image",
    {
      target_product_id: input.productId,
      target_image_id: input.imageId,
    },
  );

  if (error || result !== "UPDATED") {
    return imageFailure(
      result === "NOT_PUBLISHED"
        ? "Only a published product image can be used as the primary image."
        : result === "NOT_FOUND"
          ? "The selected image no longer belongs to this product."
          : "The primary image could not be changed safely.",
    );
  }

  const images = await loadProductImages(context.supabase, input.productId);
  if (!images) {
    return imageFailure("The updated product images could not be loaded safely.");
  }

  revalidateStorefront(productResult.data.slug);
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${input.productId}`);

  return { ok: true, message: "Primary storefront image updated.", images };
}

export async function deleteProductGalleryImageAction(
  input: unknown,
): Promise<ProductImageMutationResult> {
  if (
    typeof input !== "object" ||
    input === null ||
    Object.keys(input).length !== 2 ||
    !("productId" in input) ||
    !("imageId" in input) ||
    typeof input.productId !== "string" ||
    typeof input.imageId !== "string" ||
    !isValidUuid(input.productId) ||
    !isValidUuid(input.imageId)
  ) {
    return imageFailure("Invalid image removal request.");
  }

  const context = await authorizeMutation();
  if (!isAuthorizedContext(context)) return imageFailure(context.message);

  const [productResult, imageResult] = await Promise.all([
    context.supabase
      .from("products")
      .select("id, slug")
      .eq("id", input.productId)
      .maybeSingle(),
    context.supabase
      .from("product_images")
      .select("*")
      .eq("id", input.imageId)
      .eq("product_id", input.productId)
      .maybeSingle(),
  ]);

  if (productResult.error || !productResult.data || imageResult.error) {
    return imageFailure("The gallery image could not be loaded safely.");
  }
  if (!imageResult.data) {
    return imageFailure("The gallery image no longer exists.");
  }
  const imageRow: ImageRow = imageResult.data;
  let storageBackup: Blob | null = null;
  if (!imageRow.storage_path.startsWith("/")) {
    const downloadResult = await context.supabase.storage
      .from(imageBucket)
      .download(imageRow.storage_path);
    if (downloadResult.error || !downloadResult.data) {
      return imageFailure("The stored image could not be verified for removal.");
    }
    storageBackup = downloadResult.data;

    const removeResult = await context.supabase.storage
      .from(imageBucket)
      .remove([imageRow.storage_path]);
    if (removeResult.error) {
      return imageFailure("The stored image could not be removed safely.");
    }
  }

  const { data: deleteResult, error: deleteError } = await context.supabase.rpc(
    "delete_product_image_with_replacement",
    {
      target_product_id: input.productId,
      target_image_id: imageRow.id,
    },
  );

  if (deleteError || deleteResult !== "DELETED") {
    if (storageBackup) {
      await context.supabase.storage
        .from(imageBucket)
        .upload(imageRow.storage_path, storageBackup, {
          contentType: storageBackup.type,
          upsert: false,
        });
    }
    return imageFailure("The gallery image could not be removed safely.");
  }

  const images = await loadProductImages(context.supabase, input.productId);
  if (!images) {
    return imageFailure("The updated gallery could not be loaded safely.");
  }

  revalidateStorefront(productResult.data.slug);
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${input.productId}`);

  return {
    ok: true,
    message: imageRow.is_primary
      ? images.some((image) => image.isPrimary)
        ? "Primary image removed. The next image is now primary."
        : "Primary image removed. This product currently has no storefront image."
      : "Gallery image removed.",
    images,
  };
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
    value.lifecycle === "active" &&
    current.product.status !== "active"
  ) {
    return failure("INVALID_PRODUCT", invalidProductMessage, {
      lifecycle:
        "Use Make Official to validate and publish a Coming Soon product.",
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

  const [brandResult, slugResult, skuResult, draftSkuResult] = await Promise.all([
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
    value.variant.sku
      ? context.supabase
          .from("products")
          .select("id, commerce_draft")
          .neq("id", value.productId)
      : Promise.resolve({ data: [], error: null }),
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
  if (draftSkuResult.error) {
    return failure("PRODUCT_SAVE_FAILED", saveFailedMessage);
  }
  const duplicateDraftSku = (draftSkuResult.data ?? []).some(({ commerce_draft }) => {
    if (
      typeof commerce_draft !== "object" ||
      commerce_draft === null ||
      Array.isArray(commerce_draft) ||
      typeof commerce_draft.sku !== "string"
    ) {
      return false;
    }
    return (
      commerce_draft.sku.trim().toLocaleLowerCase() ===
      value.variant.sku?.toLocaleLowerCase()
    );
  });
  if (skuResult.data || duplicateDraftSku) {
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
  const saveCanonicalVariant =
    current.product.status === "active" ||
    (current.product.status === "draft" &&
      !current.product.is_public_preview &&
      current.variant !== null);
  if (value.variant.requested && saveCanonicalVariant) {
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
    commerce_draft: targetActive
      ? {}
      : {
          sku: value.variant.sku,
          variantName: value.variant.variantName,
          ramGb: value.variant.ramGb,
          ramNotApplicable: value.variant.ramNotApplicable,
          extendedRamGb: value.variant.extendedRamGb,
          storageGb: value.variant.storageGb,
          currentPriceCentavos: value.variant.currentPriceCentavos,
          srpCentavos: value.variant.srpCentavos,
          badge: value.variant.badge,
          financingAvailable: value.variant.financingAvailable,
        },
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

export async function makeOfficialProductAction(
  input: unknown,
): Promise<ProductPromotionResult> {
  const context = await authorizeMutation();
  if (!isAuthorizedContext(context)) return context;

  if (
    typeof input !== "object" ||
    input === null ||
    Object.keys(input).length !== 1 ||
    !("productId" in input) ||
    typeof input.productId !== "string" ||
    !isValidUuid(input.productId)
  ) {
    return failure("INVALID_PRODUCT", "Invalid publication request.");
  }

  const current = await loadCurrentProduct(context.supabase, input.productId);
  if (!current) {
    return failure("PRODUCT_NOT_FOUND", "The product no longer exists.");
  }

  const { data, error } = await context.supabase.rpc(
    "promote_coming_soon_product",
    { target_product_id: input.productId },
  );

  if (error) {
    return failure(
      "PRODUCT_SAVE_FAILED",
      "The product could not be published safely. Refresh and try again.",
    );
  }

  if (data === "DUPLICATE_SLUG") {
    return failure(
      "DUPLICATE_PRODUCT_SLUG",
      "That product slug is already in use.",
      { slug: "Choose a unique slug." },
    );
  }
  if (data === "DUPLICATE_SKU") {
    return failure(
      "DUPLICATE_PRODUCT_SKU",
      "That SKU is already assigned to another product.",
      { sku: "Choose a unique SKU." },
    );
  }
  if (data === "NOT_FOUND") {
    return failure("PRODUCT_NOT_FOUND", "The product no longer exists.");
  }
  if (data === "FORBIDDEN") {
    return failure(
      "ADMIN_FORBIDDEN",
      "Administrator access is required.",
    );
  }
  if (data === "NOT_COMING_SOON") {
    return failure(
      "INVALID_PRODUCT",
      "Only a Coming Soon product can use Make Official.",
    );
  }
  if (data !== "PUBLISHED") {
    return failure(
      "INVALID_PRODUCT",
      "Complete every readiness item before publishing.",
    );
  }

  revalidateStorefront(current.product.slug);
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${input.productId}`);

  return { ok: true, message: "Product published successfully." };
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

function readVariantInteger(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) return undefined;
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function readVariantCentavos(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(trimmed)) return undefined;
  const [pesos, cents = ""] = trimmed.split(".");
  const result = Number(pesos) * 100 + Number(cents.padEnd(2, "0"));
  return Number.isSafeInteger(result) && result >= 0 ? result : undefined;
}

export async function saveProductVariant(
  input: ProductVariantEditorSubmission,
): Promise<ProductVariantMutationResult> {
  if (
    !isValidUuid(input.productId) ||
    (input.variantId !== undefined && !isValidUuid(input.variantId))
  ) {
    return { ok: false, message: invalidProductMessage };
  }
  const sku = input.sku.trim().toUpperCase();
  const variantName = input.variantName.trim();
  const ramGb = input.ramNotApplicable ? null : readVariantInteger(input.ramGb);
  const extendedRamGb = readVariantInteger(input.extendedRamGb);
  const storageGb = readVariantInteger(input.storageGb);
  const currentPriceCentavos = readVariantCentavos(input.currentPricePesos);
  const srpCentavos = readVariantCentavos(input.srpPesos);
  const fieldErrors: Record<string, string> = {};

  if (!/^[A-Z0-9][A-Z0-9-]{2,79}$/.test(sku)) {
    fieldErrors.sku = "Use 3–80 uppercase letters, numbers, or hyphens.";
  }
  if (!variantName || variantName.length > 120) {
    fieldErrors.variantName = "Enter a variant name using 120 characters or fewer.";
  }
  if (ramGb === undefined || (!input.ramNotApplicable && ramGb === null)) {
    fieldErrors.ramGb = "Enter positive physical RAM or mark RAM not applicable.";
  }
  if (extendedRamGb === undefined) {
    fieldErrors.extendedRamGb = "Extended RAM must be a positive whole number when supplied.";
  }
  if (storageGb === null || storageGb === undefined) {
    fieldErrors.storageGb = "Enter positive storage in GB.";
  }
  if (
    currentPriceCentavos === null ||
    currentPriceCentavos === undefined ||
    currentPriceCentavos <= 0
  ) {
    fieldErrors.currentPricePesos =
      "Enter the exact positive GadgetMoTo selling price.";
  }
  if (srpCentavos === undefined) {
    fieldErrors.srpPesos = "Enter a valid SRP or leave it blank.";
  } else if (
    srpCentavos !== null &&
    currentPriceCentavos !== null &&
    currentPriceCentavos !== undefined &&
    srpCentavos < currentPriceCentavos
  ) {
    fieldErrors.srpPesos = "SRP cannot be below the selling price.";
  }
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: invalidProductMessage, fieldErrors };
  }

  const context = await authorizeMutation();
  if (!isAuthorizedContext(context)) {
    return { ok: false, message: context.message };
  }
  const excludedVariantId =
    input.variantId ?? "00000000-0000-0000-0000-000000000000";
  const [productResult, duplicateSkuResult, duplicateNameResult, orderResult] =
    await Promise.all([
      context.supabase
        .from("products")
        .select("id, slug")
        .eq("id", input.productId)
        .maybeSingle(),
      context.supabase
        .from("product_variants")
        .select("id")
        .ilike("sku", sku)
        .neq("id", excludedVariantId)
        .maybeSingle(),
      context.supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", input.productId)
        .ilike("variant_name", variantName)
        .neq("id", excludedVariantId)
        .maybeSingle(),
      context.supabase
        .from("product_variants")
        .select("sort_order")
        .eq("product_id", input.productId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
  if (
    productResult.error ||
    !productResult.data ||
    duplicateSkuResult.error ||
    duplicateNameResult.error ||
    orderResult.error
  ) {
    return { ok: false, message: saveFailedMessage };
  }
  if (duplicateSkuResult.data) {
    return {
      ok: false,
      message: "That SKU is already assigned.",
      fieldErrors: { sku: "Use a unique SKU." },
    };
  }
  if (duplicateNameResult.data) {
    return {
      ok: false,
      message: "That configuration already exists for this product.",
      fieldErrors: { variantName: "Use a unique configuration name." },
    };
  }

  const values = {
    sku,
    variant_name: variantName,
    ram_gb: ramGb as number | null,
    extended_ram_gb: extendedRamGb as number | null,
    storage_gb: storageGb as number,
    current_price_centavos: currentPriceCentavos as number,
    srp_centavos: srpCentavos as number | null,
    financing_available: input.financingAvailable,
    is_active: input.isActive,
  };
  const result = input.variantId
    ? await context.supabase
        .from("product_variants")
        .update(values)
        .eq("id", input.variantId)
        .eq("product_id", input.productId)
        .select("id")
        .maybeSingle()
    : await context.supabase
        .from("product_variants")
        .insert({
          ...values,
          product_id: input.productId,
          condition: "brand_new",
          sort_order: (orderResult.data?.sort_order ?? -1) + 1,
        })
        .select("id")
        .maybeSingle();

  if (result.error || !result.data) {
    return { ok: false, message: saveFailedMessage };
  }
  revalidateStorefront(productResult.data.slug);
  revalidatePath(`/admin/products/${input.productId}`);
  return {
    ok: true,
    message: input.variantId ? "Configuration saved." : "Configuration added.",
  };
}

export async function setDefaultProductVariant(
  productId: string,
  variantId: string,
): Promise<ProductVariantMutationResult> {
  if (!isValidUuid(productId) || !isValidUuid(variantId)) {
    return { ok: false, message: invalidProductMessage };
  }
  const context = await authorizeMutation();
  if (!isAuthorizedContext(context)) {
    return { ok: false, message: context.message };
  }
  const [productResult, variantsResult] = await Promise.all([
    context.supabase
      .from("products")
      .select("slug")
      .eq("id", productId)
      .maybeSingle(),
    context.supabase
      .from("product_variants")
      .select("id, sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
  ]);
  if (productResult.error || !productResult.data || variantsResult.error) {
    return { ok: false, message: saveFailedMessage };
  }
  const ordered = variantsResult.data ?? [];
  const selected = ordered.find((variant) => variant.id === variantId);
  if (!selected) {
    return { ok: false, message: "The selected configuration is unavailable." };
  }
  const updates = [selected, ...ordered.filter((variant) => variant.id !== variantId)];
  for (const [sortOrder, variant] of updates.entries()) {
    const { error } = await context.supabase
      .from("product_variants")
      .update({ sort_order: sortOrder })
      .eq("id", variant.id)
      .eq("product_id", productId);
    if (error) return { ok: false, message: saveFailedMessage };
  }
  revalidateStorefront(productResult.data.slug);
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true, message: "Default configuration updated." };
}

export async function saveProductColor(
  input: ProductColorEditorSubmission,
): Promise<ProductColorMutationResult> {
  if (
    !isValidUuid(input.productId) ||
    (input.colorId !== undefined && !isValidUuid(input.colorId))
  ) {
    return { ok: false, message: invalidProductMessage };
  }
  const name = input.name.trim();
  const hexCode = input.hexCode.trim().toUpperCase();
  const sortOrder = Number(input.sortOrder);
  const fieldErrors: Record<string, string> = {};
  if (!name || name.length > 80) {
    fieldErrors.name = "Enter a color name using 80 characters or fewer.";
  }
  if (hexCode && !/^#[0-9A-F]{6}$/.test(hexCode)) {
    fieldErrors.hexCode = "Use #RRGGBB or leave the swatch value blank.";
  }
  if (!Number.isSafeInteger(sortOrder) || sortOrder < 0) {
    fieldErrors.sortOrder = "Use a non-negative whole number.";
  }
  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: invalidProductMessage, fieldErrors };
  }

  const context = await authorizeMutation();
  if (!isAuthorizedContext(context)) {
    return { ok: false, message: context.message };
  }
  const excludedColorId =
    input.colorId ?? "00000000-0000-0000-0000-000000000000";
  const [productResult, duplicateResult] = await Promise.all([
    context.supabase
      .from("products")
      .select("id, slug")
      .eq("id", input.productId)
      .maybeSingle(),
    context.supabase
      .from("product_color_variants")
      .select("id")
      .eq("product_id", input.productId)
      .eq("normalized_name", name.toLocaleLowerCase())
      .neq("id", excludedColorId)
      .maybeSingle(),
  ]);
  if (productResult.error || !productResult.data || duplicateResult.error) {
    return { ok: false, message: saveFailedMessage };
  }
  if (duplicateResult.data) {
    return {
      ok: false,
      message: "That color already exists for this product.",
      fieldErrors: { name: "Use a unique color name." },
    };
  }
  const values = {
    name,
    hex_code: hexCode || null,
    is_active: input.isActive,
    sort_order: sortOrder,
  };
  const result = input.colorId
    ? await context.supabase
        .from("product_color_variants")
        .update(values)
        .eq("id", input.colorId)
        .eq("product_id", input.productId)
        .select("id")
        .maybeSingle()
    : await context.supabase
        .from("product_color_variants")
        .insert({ ...values, product_id: input.productId })
        .select("id")
        .maybeSingle();
  if (result.error || !result.data) {
    return { ok: false, message: saveFailedMessage };
  }
  revalidateStorefront(productResult.data.slug);
  revalidatePath(`/admin/products/${input.productId}`);
  return {
    ok: true,
    message: input.colorId ? "Color saved." : "Color added.",
  };
}

export async function setProductVariantColorAvailability(
  input: ProductVariantColorAvailabilitySubmission,
): Promise<ProductVariantColorAvailabilityResult> {
  if (
    !isValidUuid(input.productId) ||
    !isValidUuid(input.variantId) ||
    !isValidUuid(input.colorId)
  ) {
    return { ok: false, message: invalidProductMessage };
  }

  const context = await authorizeMutation();
  if (!isAuthorizedContext(context)) {
    return { ok: false, message: context.message };
  }

  const [productResult, variantResult, colorResult] = await Promise.all([
    context.supabase
      .from("products")
      .select("id, slug")
      .eq("id", input.productId)
      .maybeSingle(),
    context.supabase
      .from("product_variants")
      .select("id, sku, current_price_centavos, is_active, sort_order")
      .eq("id", input.variantId)
      .eq("product_id", input.productId)
      .maybeSingle(),
    context.supabase
      .from("product_color_variants")
      .select("id, is_active")
      .eq("id", input.colorId)
      .eq("product_id", input.productId)
      .maybeSingle(),
  ]);
  if (
    productResult.error ||
    !productResult.data ||
    variantResult.error ||
    !variantResult.data ||
    colorResult.error ||
    !colorResult.data
  ) {
    return { ok: false, message: saveFailedMessage };
  }

  if (
    input.isAvailable &&
    (!variantResult.data.is_active ||
      !variantResult.data.sku.trim() ||
      variantResult.data.current_price_centavos <= 0 ||
      !colorResult.data.is_active)
  ) {
    return {
      ok: false,
      message:
        "Activate the color and configuration, then provide a valid SKU and positive price.",
    };
  }

  const optionResult = await context.supabase
    .from("product_variant_color_options")
    .upsert(
      {
        product_id: input.productId,
        variant_id: input.variantId,
        color_id: input.colorId,
        is_available: input.isAvailable,
        sort_order: variantResult.data.sort_order,
      },
      { onConflict: "variant_id,color_id" },
    )
    .select("id")
    .maybeSingle();
  if (optionResult.error || !optionResult.data) {
    return { ok: false, message: saveFailedMessage };
  }

  revalidateStorefront(productResult.data.slug);
  revalidatePath(`/admin/products/${input.productId}`);
  return {
    ok: true,
    message: input.isAvailable
      ? "Combination is available."
      : "Combination is unavailable.",
  };
}

export async function deleteProductColor(
  productId: string,
  colorId: string,
): Promise<ProductColorMutationResult> {
  if (!isValidUuid(productId) || !isValidUuid(colorId)) {
    return { ok: false, message: invalidProductMessage };
  }
  const context = await authorizeMutation();
  if (!isAuthorizedContext(context)) {
    return { ok: false, message: context.message };
  }
  const productResult = await context.supabase
    .from("products")
    .select("slug")
    .eq("id", productId)
    .maybeSingle();
  if (productResult.error || !productResult.data) {
    return { ok: false, message: saveFailedMessage };
  }
  const { data, error } = await context.supabase
    .from("product_color_variants")
    .delete()
    .eq("id", colorId)
    .eq("product_id", productId)
    .select("id")
    .maybeSingle();
  if (error || !data) {
    return {
      ok: false,
      message:
        "The color could not be deleted. Deactivate it if order history references it.",
    };
  }
  revalidateStorefront(productResult.data.slug);
  revalidatePath(`/admin/products/${productId}`);
  return { ok: true, message: "Color deleted." };
}
