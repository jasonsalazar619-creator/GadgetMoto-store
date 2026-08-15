import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedAdmin } from "@/lib/admin/server/auth";
import { assessAdminProductReadiness } from "@/lib/admin/server/product-readiness";
import type {
  AdminBrand,
  AdminProductEditorData,
  AdminProductImage,
  AdminProductLifecycle,
  AdminProductListItem,
  AdminProductSpecification,
  AdminProductVariantDraft,
} from "@/lib/admin/products/types";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";
import {
  getManagedProductImageSource,
  isManagedProductImagePath,
} from "@/lib/catalog/product-image-source";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type VariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
type ImageRow = Database["public"]["Tables"]["product_images"]["Row"];

const unavailableMessage =
  "Product management data could not be loaded safely.";
const emptyVariantDraft: AdminProductVariantDraft = {
  sku: null,
  variantName: null,
  ramGb: null,
  ramNotApplicable: false,
  extendedRamGb: null,
  storageGb: null,
  currentPriceCentavos: null,
  srpCentavos: null,
  badge: null,
  financingAvailable: true,
};

function lifecycleFromRow(product: ProductRow): AdminProductLifecycle {
  if (product.status === "archived") return "archived";
  if (product.status === "active") return "active";
  return product.is_public_preview ? "coming_soon" : "draft";
}

function readSpecifications(value: Json): AdminProductSpecification[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item) => {
    if (
      typeof item !== "object" ||
      item === null ||
      Array.isArray(item) ||
      typeof item.label !== "string" ||
      typeof item.value !== "string" ||
      !item.label.trim() ||
      !item.value.trim()
    ) {
      return [];
    }

    return [{ label: item.label, value: item.value }];
  });
}

function readNullableInteger(value: Json | undefined): number | null {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
    ? value
    : null;
}

function readCommerceDraft(value: Json): AdminProductVariantDraft {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ...emptyVariantDraft };
  }

  return {
    sku: typeof value.sku === "string" && value.sku.trim() ? value.sku : null,
    variantName:
      typeof value.variantName === "string" && value.variantName.trim()
        ? value.variantName
        : null,
    ramGb: readNullableInteger(value.ramGb),
    ramNotApplicable:
      typeof value.ramNotApplicable === "boolean"
        ? value.ramNotApplicable
        : false,
    extendedRamGb: readNullableInteger(value.extendedRamGb),
    storageGb: readNullableInteger(value.storageGb),
    currentPriceCentavos: readNullableInteger(value.currentPriceCentavos),
    srpCentavos: readNullableInteger(value.srpCentavos),
    badge: value.badge === "new" || value.badge === "sale" ? value.badge : null,
    financingAvailable:
      typeof value.financingAvailable === "boolean"
        ? value.financingAvailable
        : true,
  };
}

function draftFromVariant(variant: VariantRow): AdminProductVariantDraft {
  return {
    sku: variant.sku,
    variantName: variant.variant_name,
    ramGb: variant.ram_gb,
    ramNotApplicable: variant.ram_gb === null,
    extendedRamGb: variant.extended_ram_gb,
    storageGb: variant.storage_gb,
    currentPriceCentavos: variant.current_price_centavos,
    srpCentavos: variant.srp_centavos,
    badge: variant.badge,
    financingAvailable: variant.financing_available,
  };
}

function commerceDraftForProduct(
  product: ProductRow,
  variant: VariantRow | null,
): AdminProductVariantDraft {
  const value = readCommerceDraft(product.commerce_draft);
  const hasSavedDraft =
    typeof product.commerce_draft === "object" &&
    product.commerce_draft !== null &&
    !Array.isArray(product.commerce_draft) &&
    Object.keys(product.commerce_draft).length > 0;

  return hasSavedDraft || !variant ? value : draftFromVariant(variant);
}

function toBrand(row: Database["public"]["Tables"]["brands"]["Row"]): AdminBrand {
  return { id: row.id, name: row.name, slug: row.slug };
}

function toImage(row: ImageRow): AdminProductImage | null {
  const src = row.storage_path.startsWith("/")
    ? row.storage_path
    : isManagedProductImagePath(row.storage_path)
      ? getManagedProductImageSource(row.storage_path)
      : null;
  if (!src) return null;
  return {
    id: row.id,
    src,
    alt: row.alt_text,
    isPrimary: row.is_primary,
    isPublished: row.is_published,
  };
}

function normalizedSku(value: string | null): string | null {
  const normalized = value?.trim().toLocaleLowerCase();
  return normalized || null;
}

function buildSkuCounts(
  products: readonly ProductRow[],
  variants: readonly VariantRow[],
): Map<string, number> {
  const ownersBySku = new Map<string, Set<string>>();
  const addOwner = (sku: string | null, productId: string) => {
    if (!sku) return;
    const owners = ownersBySku.get(sku) ?? new Set<string>();
    owners.add(productId);
    ownersBySku.set(sku, owners);
  };

  products.forEach((product) => {
    addOwner(
      normalizedSku(readCommerceDraft(product.commerce_draft).sku),
      product.id,
    );
  });
  variants.forEach((variant) => {
    addOwner(normalizedSku(variant.sku), variant.product_id);
  });

  return new Map(
    [...ownersBySku].map(([sku, owners]) => [sku, owners.size]),
  );
}

function buildSlugCounts(products: readonly ProductRow[]): Map<string, number> {
  return products.reduce((counts, product) => {
    const slug = product.slug.toLocaleLowerCase();
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
    return counts;
  }, new Map<string, number>());
}

function toEditorData(
  product: ProductRow,
  variant: VariantRow | null,
  imageRows: readonly ImageRow[],
  brandIsActive: boolean,
  slugIsUnique: boolean,
  skuIsUnique: boolean,
): AdminProductEditorData {
  const variantDraft = commerceDraftForProduct(product, variant);
  const images = imageRows.flatMap((image) => {
    const mapped = toImage(image);
    return mapped ? [mapped] : [];
  });
  const readiness = assessAdminProductReadiness({
    name: product.name,
    slug: product.slug,
    brandIsActive,
    category: product.category,
    shortDescription: product.short_description,
    fullDescription: product.full_description,
    hasPublishedPrimaryImage: imageRows.some(
      (image) =>
        image.media_type === "image" &&
        image.is_published &&
        image.is_primary,
    ),
    slugIsUnique,
    skuIsUnique,
    variant: variantDraft,
  });

  return {
    id: product.id,
    name: product.name,
    originalName: product.name,
    slug: product.slug,
    brandId: product.brand_id,
    category: product.category,
    lifecycle: lifecycleFromRow(product),
    shortDescription: product.short_description ?? "",
    fullDescription: product.full_description ?? "",
    isFeatured: product.is_featured,
    sortOrder: product.sort_order,
    specifications: readSpecifications(product.specifications),
    variant: variant
      ? {
          id: variant.id,
          sku: variant.sku,
          variantName: variant.variant_name,
          ramGb: variant.ram_gb,
          extendedRamGb: variant.extended_ram_gb,
          storageGb: variant.storage_gb,
          currentPriceCentavos: variant.current_price_centavos,
          srpCentavos: variant.srp_centavos,
          badge: variant.badge,
          financingAvailable: variant.financing_available,
          isActive: variant.is_active,
          updatedAt: variant.updated_at,
        }
      : null,
    variantDraft,
    images,
    readiness,
    updatedAt: product.updated_at,
  };
}

async function getAuthorizedClient() {
  await requireAuthenticatedAdmin();
  const supabase = await createClient();

  if (!supabase) {
    throw new Error(unavailableMessage);
  }

  return supabase;
}

async function loadEditorData(
  supabase: SupabaseClient<Database>,
  productId: string,
): Promise<AdminProductEditorData | null> {
  const [productResult, variantResult, brandResult, imageResult, allProductsResult, allVariantsResult] =
    await Promise.all([
      supabase.from("products").select("*").eq("id", productId).maybeSingle(),
      supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase.from("brands").select("id").eq("is_active", true),
      supabase
        .from("product_images")
        .select("*")
        .eq("product_id", productId)
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true }),
      supabase.from("products").select("*"),
      supabase.from("product_variants").select("*"),
    ]);

  if (
    productResult.error ||
    variantResult.error ||
    brandResult.error ||
    imageResult.error ||
    allProductsResult.error ||
    allVariantsResult.error
  ) {
    throw new Error(unavailableMessage);
  }

  if (!productResult.data) return null;

  const products = allProductsResult.data ?? [];
  const variants = allVariantsResult.data ?? [];
  const variantDraft = commerceDraftForProduct(
    productResult.data,
    variantResult.data,
  );
  const sku = normalizedSku(variantDraft.sku);
  const skuCounts = buildSkuCounts(products, variants);
  const slugCounts = buildSlugCounts(products);

  return toEditorData(
    productResult.data,
    variantResult.data,
    imageResult.data ?? [],
    (brandResult.data ?? []).some(
      ({ id }) => id === productResult.data?.brand_id,
    ),
    (slugCounts.get(productResult.data.slug.toLocaleLowerCase()) ?? 0) === 1,
    sku !== null && (skuCounts.get(sku) ?? 0) === 1,
  );
}

export async function getAdminBrands(): Promise<AdminBrand[]> {
  const supabase = await getAuthorizedClient();
  const { data, error } = await supabase
    .from("brands")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error || !data) throw new Error(unavailableMessage);
  return data.map(toBrand);
}

export async function getAdminProductList(): Promise<{
  products: AdminProductListItem[];
  brands: AdminBrand[];
}> {
  const supabase = await getAuthorizedClient();
  const [productResult, brandResult, variantResult, imageResult] =
    await Promise.all([
      supabase.from("products").select("*"),
      supabase
        .from("brands")
        .select("*")
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("product_variants")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true }),
      supabase
        .from("product_images")
        .select("*")
        .order("is_primary", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true }),
    ]);

  if (
    productResult.error ||
    brandResult.error ||
    variantResult.error ||
    imageResult.error ||
    !productResult.data ||
    !brandResult.data ||
    !variantResult.data ||
    !imageResult.data
  ) {
    throw new Error(unavailableMessage);
  }

  const brandsById = new Map(brandResult.data.map((brand) => [brand.id, brand]));
  const variantByProduct = new Map<string, VariantRow>();
  variantResult.data.forEach((variant) => {
    if (!variantByProduct.has(variant.product_id)) {
      variantByProduct.set(variant.product_id, variant);
    }
  });
  const imagesByProduct = new Map<string, ImageRow[]>();
  imageResult.data.forEach((image) => {
    if (!image.product_id) return;
    imagesByProduct.set(image.product_id, [
      ...(imagesByProduct.get(image.product_id) ?? []),
      image,
    ]);
  });
  const skuCounts = buildSkuCounts(productResult.data, variantResult.data);
  const slugCounts = buildSlugCounts(productResult.data);

  const products = productResult.data.map((product): AdminProductListItem => {
    const variant = variantByProduct.get(product.id) ?? null;
    const draft = commerceDraftForProduct(product, variant);
    const sku = normalizedSku(draft.sku);
    const imageRows = imagesByProduct.get(product.id) ?? [];
    const readiness = assessAdminProductReadiness({
      name: product.name,
      slug: product.slug,
      brandIsActive: brandsById.has(product.brand_id),
      category: product.category,
      shortDescription: product.short_description,
      fullDescription: product.full_description,
      hasPublishedPrimaryImage: imageRows.some(
        (image) =>
          image.media_type === "image" &&
          image.is_published &&
          image.is_primary,
      ),
      slugIsUnique:
        (slugCounts.get(product.slug.toLocaleLowerCase()) ?? 0) === 1,
      skuIsUnique: sku !== null && (skuCounts.get(sku) ?? 0) === 1,
      variant: draft,
    });
    const primaryImageRow = imageRows.find(
      (image) => image.is_primary && image.is_published,
    );

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brandId: product.brand_id,
      brandName: brandsById.get(product.brand_id)?.name ?? "Unavailable brand",
      category: product.category,
      lifecycle: lifecycleFromRow(product),
      sku: variant?.sku ?? draft.sku,
      currentPriceCentavos:
        variant?.current_price_centavos ?? draft.currentPriceCentavos,
      updatedAt: product.updated_at,
      primaryImage: primaryImageRow ? toImage(primaryImageRow) : null,
      readiness,
    };
  });

  return {
    products,
    brands: brandResult.data.map(toBrand),
  };
}

export async function getAdminProductEditor(
  productId: string,
): Promise<{ product: AdminProductEditorData; brands: AdminBrand[] } | null> {
  const supabase = await getAuthorizedClient();
  const [product, brandResult] = await Promise.all([
    loadEditorData(supabase, productId),
    supabase
      .from("brands")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  if (brandResult.error || !brandResult.data) {
    throw new Error(unavailableMessage);
  }

  return product
    ? { product, brands: brandResult.data.map(toBrand) }
    : null;
}

export async function getAdminDraftCreationData(): Promise<{
  brands: AdminBrand[];
  existingSlugs: string[];
}> {
  const supabase = await getAuthorizedClient();
  const [brandResult, slugResult] = await Promise.all([
    supabase
      .from("brands")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase.from("products").select("slug"),
  ]);

  if (
    brandResult.error ||
    slugResult.error ||
    !brandResult.data ||
    !slugResult.data
  ) {
    throw new Error(unavailableMessage);
  }

  return {
    brands: brandResult.data.map(toBrand),
    existingSlugs: slugResult.data.map(({ slug }) => slug),
  };
}

export const adminProductInternals = {
  lifecycleFromRow,
  loadEditorData,
  readCommerceDraft,
  toImage,
};
