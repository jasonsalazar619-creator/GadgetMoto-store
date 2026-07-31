import "server-only";

import { requireAuthenticatedAdmin } from "@/lib/admin/server/auth";
import type {
  AdminBrand,
  AdminProductEditorData,
  AdminProductImage,
  AdminProductLifecycle,
  AdminProductListItem,
  AdminProductSpecification,
} from "@/lib/admin/products/types";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type VariantRow = Database["public"]["Tables"]["product_variants"]["Row"];
type ImageRow = Database["public"]["Tables"]["product_images"]["Row"];

const unavailableMessage =
  "Product management data could not be loaded safely.";

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

function toBrand(row: Database["public"]["Tables"]["brands"]["Row"]): AdminBrand {
  return { id: row.id, name: row.name, slug: row.slug };
}

function toImage(row: ImageRow | undefined): AdminProductImage | null {
  if (!row || !row.storage_path.startsWith("/")) return null;
  return { src: row.storage_path, alt: row.alt_text };
}

function toEditorData(
  product: ProductRow,
  variant: VariantRow | null,
): AdminProductEditorData {
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

export async function getAdminBrands(): Promise<AdminBrand[]> {
  const supabase = await getAuthorizedClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug, description, is_active, sort_order, created_at, updated_at")
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
        .eq("is_published", true)
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

  const brandById = new Map(
    brandResult.data.map((brand) => [brand.id, brand]),
  );
  const variantByProduct = new Map<string, VariantRow>();
  variantResult.data.forEach((variant) => {
    if (!variantByProduct.has(variant.product_id)) {
      variantByProduct.set(variant.product_id, variant);
    }
  });
  const imageByProduct = new Map<string, ImageRow>();
  imageResult.data.forEach((image) => {
    if (image.product_id && !imageByProduct.has(image.product_id)) {
      imageByProduct.set(image.product_id, image);
    }
  });

  const products = productResult.data.map((product): AdminProductListItem => {
    const brand = brandById.get(product.brand_id);
    const variant = variantByProduct.get(product.id);

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      brandId: product.brand_id,
      brandName: brand?.name ?? "Unavailable brand",
      category: product.category,
      lifecycle: lifecycleFromRow(product),
      sku: variant?.sku ?? null,
      currentPriceCentavos: variant?.current_price_centavos ?? null,
      updatedAt: product.updated_at,
      primaryImage: toImage(imageByProduct.get(product.id)),
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
  const [productResult, variantResult, brandResult] = await Promise.all([
    supabase.from("products").select("*").eq("id", productId).maybeSingle(),
    supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("brands")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true }),
  ]);

  if (productResult.error || variantResult.error || brandResult.error) {
    throw new Error(unavailableMessage);
  }

  if (!productResult.data) return null;

  return {
    product: toEditorData(productResult.data, variantResult.data),
    brands: (brandResult.data ?? []).map(toBrand),
  };
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
  toEditorData,
};
