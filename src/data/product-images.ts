export type ProductImage = Readonly<{
  src: string;
  alt: string;
  width: number;
  height: number;
}>;

const primaryImage = (slug: string, productName: string): ProductImage => ({
  src: `/products/${slug}/primary.png`,
  alt: `${productName} product image`,
  width: 800,
  height: 600,
});

export const productImagesBySlug: Readonly<
  Record<string, readonly ProductImage[]>
> = {
  "xiaomi-17-ultra-5g-leica-kit": [
    primaryImage(
      "xiaomi-17-ultra-5g-leica-kit",
      "Xiaomi 17 Ultra 5G Leica Kit",
    ),
  ],
  "apple-iphone-17": [
    primaryImage("apple-iphone-17", "Apple iPhone 17"),
  ],
  "poco-f8-ultra": [primaryImage("poco-f8-ultra", "POCO F8 Ultra")],
  "redmi-note-15-pro-plus-5g": [
    primaryImage(
      "redmi-note-15-pro-plus-5g",
      "Redmi Note 15 Pro Plus 5G",
    ),
  ],
  "redmi-turbo-5": [primaryImage("redmi-turbo-5", "Redmi Turbo 5")],
  "infinix-note-60-pro-5g": [
    primaryImage("infinix-note-60-pro-5g", "Infinix Note 60 Pro 5G"),
  ],
  "tecno-camon-50": [primaryImage("tecno-camon-50", "TECNO Camon 50")],
  "poco-c85": [],
  "poco-pad-x1": [primaryImage("poco-pad-x1", "POCO Pad X1")],
  "xiaomi-pad-8": [primaryImage("xiaomi-pad-8", "Xiaomi Pad 8")],
  "redmi-pad-2-pro-5g": [
    primaryImage("redmi-pad-2-pro-5g", "Redmi Pad 2 Pro 5G"),
  ],
  "tecno-mega-pad-pro": [
    primaryImage("tecno-mega-pad-pro", "TECNO Mega Pad Pro"),
  ],
};

if (
  Object.values(productImagesBySlug)
    .flat()
    .some(
      (image) =>
        !image.src.startsWith("/") ||
        !image.alt.trim() ||
        image.width < 1 ||
        image.height < 1,
    )
) {
  throw new Error("Product image validation failed.");
}
