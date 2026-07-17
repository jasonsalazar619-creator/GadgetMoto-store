export type ProductCategory = "Phone" | "Tablet";

export type PrototypeProduct = {
  id: string;
  slug: string;
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
};

const products: readonly PrototypeProduct[] = [
  { id: "xiaomi-17-ultra", slug: "xiaomi-17-ultra-5g-leica-kit", brand: "Xiaomi", name: "Xiaomi 17 Ultra 5G Leica Kit", category: "Phone", variant: "16GB/512GB", currentPrice: 84990, srp: 89990, ramGb: 16, storageGb: 512, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "orbit-blue" },
  { id: "iphone-17", slug: "apple-iphone-17", brand: "Apple", name: "Apple iPhone 17", category: "Phone", variant: "256GB", currentPrice: 57990, storageGb: 256, condition: "Brand New", badge: "new", financingMessage: "Financing options available", financingAvailable: true, artSeed: "sky-line" },
  { id: "poco-f8-ultra", slug: "poco-f8-ultra", brand: "POCO", name: "POCO F8 Ultra", category: "Phone", variant: "16GB/512GB", currentPrice: 46990, ramGb: 16, storageGb: 512, condition: "Brand New", badge: "new", financingMessage: "Financing options available", financingAvailable: true, artSeed: "bright-arc" },
  { id: "redmi-note-15-pro-plus", slug: "redmi-note-15-pro-plus-5g", brand: "Redmi", name: "Redmi Note 15 Pro Plus 5G", category: "Phone", variant: "12GB/512GB", currentPrice: 27990, srp: 28990, ramGb: 12, storageGb: 512, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "ice-ring" },
  { id: "redmi-turbo-5", slug: "redmi-turbo-5", brand: "Redmi", name: "Redmi Turbo 5", category: "Phone", variant: "12GB/256GB", currentPrice: 20990, srp: 22990, ramGb: 12, storageGb: 256, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "blue-shift" },
  { id: "infinix-note-60-pro", slug: "infinix-note-60-pro-5g", brand: "Infinix", name: "Infinix Note 60 Pro 5G", category: "Phone", variant: "16GB/256GB", currentPrice: 19990, srp: 20990, ramGb: 16, storageGb: 256, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "soft-wave" },
  { id: "tecno-camon-50", slug: "tecno-camon-50", brand: "TECNO", name: "TECNO Camon 50", category: "Phone", variant: "16GB/256GB", currentPrice: 13490, srp: 13990, ramGb: 16, storageGb: 256, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "sky-orbit" },
  { id: "poco-c85", slug: "poco-c85", brand: "POCO", name: "POCO C85", category: "Phone", variant: "8GB/256GB", currentPrice: 7990, srp: 8990, ramGb: 8, storageGb: 256, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "ice-beam" },
  { id: "poco-pad-x1", slug: "poco-pad-x1", brand: "POCO", name: "POCO Pad X1", category: "Tablet", variant: "8GB/512GB", currentPrice: 23990, srp: 24990, ramGb: 8, storageGb: 512, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "wide-orbit" },
  { id: "xiaomi-pad-8", slug: "xiaomi-pad-8", brand: "Xiaomi", name: "Xiaomi Pad 8", category: "Tablet", variant: "8GB/128GB", currentPrice: 19990, srp: 20990, ramGb: 8, storageGb: 128, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "wide-sky" },
  { id: "redmi-pad-2-pro", slug: "redmi-pad-2-pro-5g", brand: "Redmi", name: "Redmi Pad 2 Pro 5G", category: "Tablet", variant: "8GB/256GB", currentPrice: 18990, srp: 19990, ramGb: 8, storageGb: 256, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "wide-arc" },
  { id: "tecno-mega-pad-pro", slug: "tecno-mega-pad-pro", brand: "TECNO", name: "TECNO Mega Pad Pro", category: "Tablet", variant: "8GB/256GB", currentPrice: 13990, srp: 14990, ramGb: 8, storageGb: 256, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", financingAvailable: true, artSeed: "wide-beam" },
] as const;

export const getAllProducts = (): readonly PrototypeProduct[] => products;
export const getPhones = () => products.filter((product) => product.category === "Phone");
export const getTablets = () => products.filter((product) => product.category === "Tablet");
export const getProductBySlug = (slug: string) => products.find((product) => product.slug === slug);
export const formatProductTitle = (product: PrototypeProduct) => `${product.name} | GadgetMoTo`;

export const newArrivalProducts = getPhones();
export const featuredTablets = getTablets();
