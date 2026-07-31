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
  src: string;
  alt: string;
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
