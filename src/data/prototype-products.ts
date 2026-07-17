export type ProductCategory = "Phone" | "Tablet";

export type PrototypeProduct = {
  id: string;
  brand: string;
  name: string;
  variant: string;
  price: number;
  srp?: number;
  category: ProductCategory;
  badge: "new" | "sale";
};

export const newArrivalProducts: readonly PrototypeProduct[] = [
  { id: "xiaomi-17-ultra", brand: "Xiaomi", name: "Xiaomi 17 Ultra 5G Leica Kit", variant: "16GB/512GB", price: 84990, srp: 89990, category: "Phone", badge: "sale" },
  { id: "iphone-17", brand: "Apple", name: "Apple iPhone 17", variant: "256GB", price: 57990, category: "Phone", badge: "new" },
  { id: "poco-f8-ultra", brand: "POCO", name: "POCO F8 Ultra", variant: "16GB/512GB", price: 46990, category: "Phone", badge: "new" },
  { id: "redmi-note-15-pro-plus", brand: "Redmi", name: "Redmi Note 15 Pro Plus 5G", variant: "12GB/512GB", price: 27990, srp: 28990, category: "Phone", badge: "sale" },
  { id: "redmi-turbo-5", brand: "Redmi", name: "Redmi Turbo 5", variant: "12GB/256GB", price: 20990, srp: 22990, category: "Phone", badge: "sale" },
  { id: "infinix-note-60-pro", brand: "Infinix", name: "Infinix Note 60 Pro 5G", variant: "16GB/256GB", price: 19990, srp: 20990, category: "Phone", badge: "sale" },
  { id: "tecno-camon-50", brand: "TECNO", name: "TECNO Camon 50", variant: "16GB/256GB", price: 13490, srp: 13990, category: "Phone", badge: "sale" },
  { id: "poco-c85", brand: "POCO", name: "POCO C85", variant: "8GB/256GB", price: 7990, srp: 8990, category: "Phone", badge: "sale" },
];

export const featuredTablets: readonly PrototypeProduct[] = [
  { id: "poco-pad-x1", brand: "POCO", name: "POCO Pad X1", variant: "8GB/512GB", price: 23990, srp: 24990, category: "Tablet", badge: "sale" },
  { id: "xiaomi-pad-8", brand: "Xiaomi", name: "Xiaomi Pad 8", variant: "8GB/128GB", price: 19990, srp: 20990, category: "Tablet", badge: "sale" },
  { id: "redmi-pad-2-pro", brand: "Redmi", name: "Redmi Pad 2 Pro 5G", variant: "8GB/256GB", price: 18990, srp: 19990, category: "Tablet", badge: "sale" },
  { id: "tecno-mega-pad-pro", brand: "TECNO", name: "TECNO Mega Pad Pro", variant: "8GB/256GB", price: 13990, srp: 14990, category: "Tablet", badge: "sale" },
];
