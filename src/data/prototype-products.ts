export type ProductCategory = "Phone" | "Tablet";

export type PrototypeProduct = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  category: ProductCategory;
  variant: string;
  price: number;
  srp?: number;
  condition: "Brand New";
  badge?: "new" | "sale";
  financingMessage: "Financing options available";
  artSeed: string;
};

const products: readonly PrototypeProduct[] = [
  { id: "xiaomi-17-ultra", slug: "xiaomi-17-ultra-5g-leica-kit", brand: "Xiaomi", name: "Xiaomi 17 Ultra 5G Leica Kit", category: "Phone", variant: "16GB/512GB", price: 84990, srp: 89990, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", artSeed: "orbit-blue" },
  { id: "iphone-17", slug: "apple-iphone-17", brand: "Apple", name: "Apple iPhone 17", category: "Phone", variant: "256GB", price: 57990, condition: "Brand New", badge: "new", financingMessage: "Financing options available", artSeed: "sky-line" },
  { id: "poco-f8-ultra", slug: "poco-f8-ultra", brand: "POCO", name: "POCO F8 Ultra", category: "Phone", variant: "16GB/512GB", price: 46990, condition: "Brand New", badge: "new", financingMessage: "Financing options available", artSeed: "bright-arc" },
  { id: "redmi-note-15-pro-plus", slug: "redmi-note-15-pro-plus-5g", brand: "Redmi", name: "Redmi Note 15 Pro Plus 5G", category: "Phone", variant: "12GB/512GB", price: 27990, srp: 28990, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", artSeed: "ice-ring" },
  { id: "redmi-turbo-5", slug: "redmi-turbo-5", brand: "Redmi", name: "Redmi Turbo 5", category: "Phone", variant: "12GB/256GB", price: 20990, srp: 22990, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", artSeed: "blue-shift" },
  { id: "infinix-note-60-pro", slug: "infinix-note-60-pro-5g", brand: "Infinix", name: "Infinix Note 60 Pro 5G", category: "Phone", variant: "16GB/256GB", price: 19990, srp: 20990, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", artSeed: "soft-wave" },
  { id: "tecno-camon-50", slug: "tecno-camon-50", brand: "TECNO", name: "TECNO Camon 50", category: "Phone", variant: "16GB/256GB", price: 13490, srp: 13990, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", artSeed: "sky-orbit" },
  { id: "poco-c85", slug: "poco-c85", brand: "POCO", name: "POCO C85", category: "Phone", variant: "8GB/256GB", price: 7990, srp: 8990, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", artSeed: "ice-beam" },
  { id: "poco-pad-x1", slug: "poco-pad-x1", brand: "POCO", name: "POCO Pad X1", category: "Tablet", variant: "8GB/512GB", price: 23990, srp: 24990, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", artSeed: "wide-orbit" },
  { id: "xiaomi-pad-8", slug: "xiaomi-pad-8", brand: "Xiaomi", name: "Xiaomi Pad 8", category: "Tablet", variant: "8GB/128GB", price: 19990, srp: 20990, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", artSeed: "wide-sky" },
  { id: "redmi-pad-2-pro", slug: "redmi-pad-2-pro-5g", brand: "Redmi", name: "Redmi Pad 2 Pro 5G", category: "Tablet", variant: "8GB/256GB", price: 18990, srp: 19990, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", artSeed: "wide-arc" },
  { id: "tecno-mega-pad-pro", slug: "tecno-mega-pad-pro", brand: "TECNO", name: "TECNO Mega Pad Pro", category: "Tablet", variant: "8GB/256GB", price: 13990, srp: 14990, condition: "Brand New", badge: "sale", financingMessage: "Financing options available", artSeed: "wide-beam" },
] as const;

export const getAllProducts = (): readonly PrototypeProduct[] => products;
export const getPhones = () => products.filter((product) => product.category === "Phone");
export const getTablets = () => products.filter((product) => product.category === "Tablet");
export const getProductBySlug = (slug: string) => products.find((product) => product.slug === slug);
export const formatProductTitle = (product: PrototypeProduct) => `${product.name} | GadgetMoTo`;

export const newArrivalProducts = getPhones();
export const featuredTablets = getTablets();
