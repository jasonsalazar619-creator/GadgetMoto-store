import {
  productSpecificationsBySlug,
  type ProductSpecification,
} from "./product-specifications";
import {
  productMediaBySlug,
  type ProductImage,
} from "./product-images";
import { activeProductResearchBySlug } from "./product-variant-research";

export type ProductCategory = "Phone" | "Tablet";

export type ProductColor = Readonly<{
  id: string;
  name: string;
  hexCode: string | null;
  purchasable: boolean;
}>;

export type ProductVariant = Readonly<{
  id: string;
  name: string;
  sku: string | null;
  ramGb?: number;
  extendedRamGb?: number;
  storageGb: number;
  condition: "Brand New";
  currentPrice: number | null;
  srp?: number;
  badge?: "new" | "sale";
  financingAvailable: boolean;
  isActive: boolean;
  isDefault: boolean;
  purchasable: boolean;
  availabilityMessage: string;
}>;

export type ProductVariantColorOption = Readonly<{
  variantId: string;
  colorId: string;
  isAvailable: boolean;
}>;

export type ProductManufacturerCombination = Readonly<{
  colorName: string;
  ramGb?: number;
  extendedRamGb?: number;
  storageGb: number;
}>;

export type PrototypeProduct = {
  id: string;
  slug: string;
  sku: string;
  brand: string;
  name: string;
  category: ProductCategory;
  variant: string;
  currentPrice: number;
  srp?: number;
  ramGb?: number;
  storageGb: number;
  condition: "Brand New";
  badge?: "new" | "sale";
  financingMessage: "Financing options available";
  financingAvailable: boolean;
  artSeed: string;
  primaryImage: ProductImage | null;
  images: readonly ProductImage[];
  specifications: readonly ProductSpecification[];
  shortDescription?: string;
  fullDescription?: string;
  colors?: readonly ProductColor[];
  variants: readonly ProductVariant[];
  variantColorOptions: readonly ProductVariantColorOption[];
  manufacturerCombinations: readonly ProductManufacturerCombination[];
};

type LegacyProduct = Omit<
  PrototypeProduct,
  "variants" | "variantColorOptions" | "manufacturerCombinations"
>;

const baseProducts: readonly LegacyProduct[] = [
  { id: "xiaomi-17-ultra", slug: "xiaomi-17-ultra-5g-leica-kit", sku: "GMT-XIA-PH-17ULTRA-16-512", brand: "Xiaomi", name: "Xiaomi 17 Ultra 5G Leica Kit", category: "Phone", variant: "16GB/512GB", currentPrice: 84990, srp: 89990, ramGb: 16, storageGb: 512, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "orbit-blue", ...productMediaBySlug["xiaomi-17-ultra-5g-leica-kit"], specifications: productSpecificationsBySlug["xiaomi-17-ultra-5g-leica-kit"] },
  { id: "iphone-17", slug: "apple-iphone-17", sku: "GMT-APL-PH-IP17-256", brand: "Apple", name: "Apple iPhone 17", category: "Phone", variant: "256GB", currentPrice: 57990, storageGb: 256, condition: "Brand New", badge: "new", financingMessage: "Financing options available", financingAvailable: true, artSeed: "sky-line", ...productMediaBySlug["apple-iphone-17"], specifications: productSpecificationsBySlug["apple-iphone-17"] },
  { id: "poco-f8-ultra", slug: "poco-f8-ultra", sku: "GMT-POC-PH-F8ULTRA-16-512", brand: "POCO", name: "POCO F8 Ultra", category: "Phone", variant: "16GB/512GB", currentPrice: 46990, ramGb: 16, storageGb: 512, condition: "Brand New", badge: "new", financingMessage: "Financing options available", financingAvailable: true, artSeed: "bright-arc", ...productMediaBySlug["poco-f8-ultra"], specifications: productSpecificationsBySlug["poco-f8-ultra"] },
  { id: "redmi-note-15-pro-plus", slug: "redmi-note-15-pro-plus-5g", sku: "GMT-RED-PH-N15PP5G-12-512", brand: "Redmi", name: "Redmi Note 15 Pro Plus 5G", category: "Phone", variant: "12GB/512GB", currentPrice: 27990, srp: 28990, ramGb: 12, storageGb: 512, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "ice-ring", ...productMediaBySlug["redmi-note-15-pro-plus-5g"], specifications: productSpecificationsBySlug["redmi-note-15-pro-plus-5g"] },
  { id: "redmi-turbo-5", slug: "redmi-turbo-5", sku: "GMT-RED-PH-TURBO5-12-256", brand: "Redmi", name: "Redmi Turbo 5", category: "Phone", variant: "12GB/256GB", currentPrice: 20990, srp: 22990, ramGb: 12, storageGb: 256, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "blue-shift", ...productMediaBySlug["redmi-turbo-5"], specifications: productSpecificationsBySlug["redmi-turbo-5"] },
  { id: "infinix-note-60-pro", slug: "infinix-note-60-pro-5g", sku: "GMT-INF-PH-N60P5G-16-256", brand: "Infinix", name: "Infinix Note 60 Pro 5G", category: "Phone", variant: "8GB RAM + 8GB Extended / 256GB", currentPrice: 19990, srp: 20990, ramGb: 8, storageGb: 256, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "soft-wave", ...productMediaBySlug["infinix-note-60-pro-5g"], specifications: productSpecificationsBySlug["infinix-note-60-pro-5g"] },
  { id: "tecno-camon-50", slug: "tecno-camon-50", sku: "GMT-TEC-PH-CAMON50-16-256", brand: "TECNO", name: "TECNO Camon 50", category: "Phone", variant: "8GB RAM + 8GB Extended / 256GB", currentPrice: 13490, srp: 13990, ramGb: 8, storageGb: 256, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "sky-orbit", ...productMediaBySlug["tecno-camon-50"], specifications: productSpecificationsBySlug["tecno-camon-50"] },
  { id: "poco-c85", slug: "poco-c85", sku: "GMT-POC-PH-C85-8-256", brand: "POCO", name: "POCO C85", category: "Phone", variant: "8GB/256GB", currentPrice: 7990, srp: 8990, ramGb: 8, storageGb: 256, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "ice-beam", ...productMediaBySlug["poco-c85"], specifications: productSpecificationsBySlug["poco-c85"] },
  { id: "poco-pad-x1", slug: "poco-pad-x1", sku: "GMT-POC-TB-PADX1-8-512", brand: "POCO", name: "POCO Pad X1", category: "Tablet", variant: "8GB/512GB", currentPrice: 23990, srp: 24990, ramGb: 8, storageGb: 512, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "wide-orbit", ...productMediaBySlug["poco-pad-x1"], specifications: productSpecificationsBySlug["poco-pad-x1"] },
  { id: "xiaomi-pad-8", slug: "xiaomi-pad-8", sku: "GMT-XIA-TB-PAD8-8-128", brand: "Xiaomi", name: "Xiaomi Pad 8", category: "Tablet", variant: "8GB/128GB", currentPrice: 19990, srp: 20990, ramGb: 8, storageGb: 128, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "wide-sky", ...productMediaBySlug["xiaomi-pad-8"], specifications: productSpecificationsBySlug["xiaomi-pad-8"] },
  { id: "redmi-pad-2-pro", slug: "redmi-pad-2-pro-5g", sku: "GMT-RED-TB-PAD2PRO5G-8-256", brand: "Redmi", name: "Redmi Pad 2 Pro 5G", category: "Tablet", variant: "8GB/256GB", currentPrice: 18990, srp: 19990, ramGb: 8, storageGb: 256, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "wide-arc", ...productMediaBySlug["redmi-pad-2-pro-5g"], specifications: productSpecificationsBySlug["redmi-pad-2-pro-5g"] },
  { id: "tecno-mega-pad-pro", slug: "tecno-mega-pad-pro", sku: "GMT-TEC-TB-MEGAPADPRO-8-256", brand: "TECNO", name: "TECNO Mega Pad Pro", category: "Tablet", variant: "8GB/256GB", currentPrice: 13990, srp: 14990, ramGb: 8, storageGb: 256, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "wide-beam", ...productMediaBySlug["tecno-mega-pad-pro"], specifications: productSpecificationsBySlug["tecno-mega-pad-pro"] },
] as const;

function commercialVariant(product: LegacyProduct): ProductVariant {
  return {
    id: product.sku,
    name: product.variant,
    sku: product.sku,
    ...(product.ramGb ? { ramGb: product.ramGb } : {}),
    ...(product.slug === "infinix-note-60-pro-5g" ||
    product.slug === "tecno-camon-50"
      ? { extendedRamGb: 8 }
      : {}),
    storageGb: product.storageGb,
    condition: product.condition,
    currentPrice: product.currentPrice,
    ...(product.srp === undefined ? {} : { srp: product.srp }),
    ...(product.badge === undefined ? {} : { badge: product.badge }),
    financingAvailable: product.financingAvailable,
    isActive: true,
    isDefault: true,
    purchasable: true,
    availabilityMessage: "Available",
  };
}

const products: readonly PrototypeProduct[] = baseProducts.map((product) => {
  const commercial = commercialVariant(product);
  const research = activeProductResearchBySlug[product.slug];
  const manufacturerOnly = (research?.configurations ?? [])
    .filter(
      (configuration) =>
        configuration.ramGb !== commercial.ramGb ||
        configuration.storageGb !== commercial.storageGb,
    )
    .map(
      (configuration): ProductVariant => ({
        id: configuration.id,
        name: configuration.label,
        sku: null,
        ...(configuration.ramGb
          ? { ramGb: configuration.ramGb }
          : {}),
        ...(configuration.extendedRamGb
          ? { extendedRamGb: configuration.extendedRamGb }
          : {}),
        storageGb: configuration.storageGb,
        condition: "Brand New",
        currentPrice: null,
        financingAvailable: false,
        isActive: true,
        isDefault: false,
        purchasable: false,
        availabilityMessage: "Unavailable",
      }),
    );

  return {
    ...product,
    ...(research?.colors.length
      ? {
          colors: research.colors.map((color) => ({
            ...color,
            purchasable: false,
          })),
        }
    : {}),
    variants: [commercial, ...manufacturerOnly],
    variantColorOptions: [],
    manufacturerCombinations: research?.exactCombinations ?? [],
  };
});

if (
  products.length !== 12 ||
  products.some((product) => !product.sku.trim()) ||
  products.some(
    (product) =>
      product.variants.length < 1 ||
      product.variants.filter((variant) => variant.isDefault).length !== 1 ||
      new Set(product.variants.map((variant) => variant.id)).size !==
        product.variants.length,
  ) ||
  new Set(products.map((product) => product.slug)).size !== products.length ||
  new Set(products.map((product) => product.sku.toLocaleLowerCase())).size !==
    products.length
) {
  throw new Error("Static catalog validation failed.");
}

export const getAllProducts = (): readonly PrototypeProduct[] => products;
export const getPhones = () => products.filter((product) => product.category === "Phone");
export const getTablets = () => products.filter((product) => product.category === "Tablet");
export const getProductBySlug = (slug: string) => products.find((product) => product.slug === slug);
export const formatProductTitle = (product: PrototypeProduct) => `${product.name} | GadgetMoTo`;

export const newArrivalProducts = getPhones();
export const featuredTablets = getTablets();
