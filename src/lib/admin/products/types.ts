import type {
  ProductBadge,
  ProductCategory,
} from "@/lib/supabase/database.types";

export type AdminProductLifecycle =
  | "draft"
  | "coming_soon"
  | "active"
  | "archived";

export type AdminBrand = {
  id: string;
  name: string;
  slug: string;
};

export type AdminProductSpecification = {
  label: string;
  value: string;
};

export type AdminProductImage = {
  id: string;
  src: string;
  alt: string;
  isPrimary: boolean;
  isPublished: boolean;
};

export type AdminProductReadinessItem = {
  key:
    | "name"
    | "slug"
    | "brand"
    | "category"
    | "description"
    | "primaryImage"
    | "sku"
    | "uniqueSku"
    | "variantName"
    | "ram"
    | "storage"
    | "priceEntered"
    | "priceValid"
    | "srp";
  label: string;
  complete: boolean;
};

export type AdminProductReadiness = {
  isReady: boolean;
  items: AdminProductReadinessItem[];
};

export type AdminProductListItem = {
  id: string;
  name: string;
  slug: string;
  brandId: string;
  brandName: string;
  category: ProductCategory | null;
  lifecycle: AdminProductLifecycle;
  sku: string | null;
  currentPriceCentavos: number | null;
  updatedAt: string;
  primaryImage: AdminProductImage | null;
  readiness: AdminProductReadiness;
};

export type AdminProductVariant = {
  id: string;
  sku: string;
  variantName: string;
  ramGb: number | null;
  extendedRamGb: number | null;
  storageGb: number;
  currentPriceCentavos: number;
  srpCentavos: number | null;
  badge: ProductBadge | null;
  financingAvailable: boolean;
  isActive: boolean;
  updatedAt: string;
  sortOrder: number;
};

export type AdminProductColor = {
  id: string;
  name: string;
  hexCode: string | null;
  isActive: boolean;
  sortOrder: number;
  updatedAt: string;
};

export type AdminProductVariantColorOption = {
  id: string;
  variantId: string;
  colorId: string;
  isAvailable: boolean;
  sortOrder: number;
  updatedAt: string;
};

export type AdminProductVariantDraft = {
  sku: string | null;
  variantName: string | null;
  ramGb: number | null;
  ramNotApplicable: boolean;
  extendedRamGb: number | null;
  storageGb: number | null;
  currentPriceCentavos: number | null;
  srpCentavos: number | null;
  badge: ProductBadge | null;
  financingAvailable: boolean;
};

export type AdminProductEditorData = {
  id: string;
  name: string;
  originalName: string;
  slug: string;
  brandId: string;
  category: ProductCategory | null;
  lifecycle: AdminProductLifecycle;
  shortDescription: string;
  fullDescription: string;
  isFeatured: boolean;
  sortOrder: number;
  specifications: AdminProductSpecification[];
  variant: AdminProductVariant | null;
  variants: readonly AdminProductVariant[];
  colors: readonly AdminProductColor[];
  variantColorOptions: readonly AdminProductVariantColorOption[];
  variantDraft: AdminProductVariantDraft;
  images: AdminProductImage[];
  readiness: AdminProductReadiness;
  updatedAt: string;
};

export type ProductMutationCode =
  | "INVALID_PRODUCT"
  | "PRODUCT_NOT_FOUND"
  | "DUPLICATE_PRODUCT_SLUG"
  | "DUPLICATE_PRODUCT_SKU"
  | "PRODUCT_SAVE_FAILED"
  | "PRODUCT_DELETE_BLOCKED"
  | "ADMIN_UNAUTHENTICATED"
  | "ADMIN_FORBIDDEN";

export type ProductMutationResult =
  | {
      ok: true;
      product: AdminProductEditorData;
      message: string;
    }
  | {
      ok: false;
      code: ProductMutationCode;
      message: string;
      fieldErrors?: Record<string, string>;
    };

export type ProductImageMutationResult =
  | {
      ok: true;
      message: string;
      images: AdminProductImage[];
    }
  | {
      ok: false;
      message: string;
    };

export type ProductPromotionResult =
  | {
      ok: true;
      message: "Product published successfully.";
    }
  | {
      ok: false;
      code: ProductMutationCode;
      message: string;
      fieldErrors?: Record<string, string>;
    };

export type ProductEditorSubmission = {
  productId: string;
  name: string;
  slug: string;
  brandId: string;
  category: ProductCategory | "";
  lifecycle: AdminProductLifecycle;
  shortDescription: string;
  fullDescription: string;
  isFeatured: boolean;
  sortOrder: string;
  specifications: AdminProductSpecification[];
  variant: {
    sku: string;
    variantName: string;
    ramGb: string;
    ramNotApplicable: boolean;
    extendedRamGb: string;
    storageGb: string;
    currentPricePesos: string;
    srpPesos: string;
    badge: ProductBadge | "";
    financingAvailable: boolean;
  };
  confirmSlugChange: boolean;
  confirmSkuChange: boolean;
};

export type ProductVariantEditorSubmission = {
  productId: string;
  variantId?: string;
  sku: string;
  variantName: string;
  ramGb: string;
  ramNotApplicable: boolean;
  extendedRamGb: string;
  storageGb: string;
  currentPricePesos: string;
  srpPesos: string;
  financingAvailable: boolean;
  isActive: boolean;
};

export type ProductVariantMutationResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export type ProductColorEditorSubmission = {
  productId: string;
  colorId?: string;
  name: string;
  hexCode: string;
  isActive: boolean;
  sortOrder: string;
};

export type ProductColorMutationResult =
  | { ok: true; message: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> };

export type ProductVariantColorAvailabilitySubmission = {
  productId: string;
  variantId: string;
  colorId?: string;
  officialColorName?: string;
  isAvailable: boolean;
};

export type ProductVariantColorAvailabilityResult =
  | { ok: true; message: string }
  | { ok: false; message: string };
