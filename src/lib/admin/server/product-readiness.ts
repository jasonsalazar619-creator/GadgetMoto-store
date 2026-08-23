import "server-only";

import type {
  AdminProductReadiness,
  AdminProductVariantDraft,
} from "@/lib/admin/products/types";
import type { ProductCategory } from "@/lib/supabase/database.types";

type ReadinessInput = {
  name: string;
  slug: string;
  brandIsActive: boolean;
  category: ProductCategory | null;
  shortDescription: string | null;
  fullDescription: string | null;
  hasPublishedPrimaryImage: boolean;
  hasCommerciallyCompleteActiveVariant: boolean;
  slugIsUnique: boolean;
  skuIsUnique: boolean;
  variant: AdminProductVariantDraft;
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const skuPattern = /^[A-Z0-9][A-Z0-9-]{2,79}$/;

export function assessAdminProductReadiness({
  name,
  slug,
  brandIsActive,
  category,
  shortDescription,
  fullDescription,
  hasPublishedPrimaryImage,
  hasCommerciallyCompleteActiveVariant,
  slugIsUnique,
  skuIsUnique,
  variant,
}: ReadinessInput): AdminProductReadiness {
  const currentPriceCentavos = variant.currentPriceCentavos;
  const priceEntered = currentPriceCentavos !== null;
  const priceValid =
    currentPriceCentavos !== null &&
    Number.isSafeInteger(currentPriceCentavos) &&
    currentPriceCentavos > 0;
  const srpValid =
    variant.srpCentavos === null ||
    (priceValid &&
      Number.isSafeInteger(variant.srpCentavos) &&
      currentPriceCentavos !== null &&
      variant.srpCentavos >= currentPriceCentavos);

  const items: AdminProductReadiness["items"] = [
    {
      key: "name",
      label: "Product name complete",
      complete: Boolean(name.trim()),
    },
    {
      key: "slug",
      label: "Unique slug",
      complete: slugPattern.test(slug) && slugIsUnique,
    },
    {
      key: "brand",
      label: "Brand selected",
      complete: brandIsActive,
    },
    {
      key: "category",
      label: "Category selected",
      complete: category === "phone" || category === "tablet",
    },
    {
      key: "description",
      label: "Description complete",
      complete: Boolean(shortDescription?.trim() && fullDescription?.trim()),
    },
    {
      key: "primaryImage",
      label: "Primary image available",
      complete: hasPublishedPrimaryImage,
    },
    {
      key: "activeVariant",
      label: "At least one complete active memory/storage configuration",
      complete: hasCommerciallyCompleteActiveVariant,
    },
    {
      key: "sku",
      label: "Canonical SKU entered",
      complete: Boolean(variant.sku && skuPattern.test(variant.sku)),
    },
    {
      key: "uniqueSku",
      label: "SKU is unique",
      complete: Boolean(variant.sku && skuIsUnique),
    },
    {
      key: "variantName",
      label: "Variant name entered",
      complete: Boolean(variant.variantName?.trim()),
    },
    {
      key: "ram",
      label: "Physical RAM entered when applicable",
      complete:
        (variant.ramGb !== null &&
          Number.isSafeInteger(variant.ramGb) &&
          variant.ramGb > 0) ||
        variant.ramNotApplicable,
    },
    {
      key: "storage",
      label: "Storage entered",
      complete:
        variant.storageGb !== null &&
        Number.isSafeInteger(variant.storageGb) &&
        variant.storageGb > 0,
    },
    {
      key: "priceEntered",
      label: "Selling price entered",
      complete: priceEntered,
    },
    {
      key: "priceValid",
      label: "Selling price is valid",
      complete: priceValid,
    },
    {
      key: "srp",
      label: "SRP is valid or intentionally blank",
      complete: srpValid,
    },
  ];

  return {
    isReady: items.every(({ complete }) => complete),
    items,
  };
}
