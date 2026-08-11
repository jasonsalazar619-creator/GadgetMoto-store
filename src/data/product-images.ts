export type ProductImage = Readonly<{
  src: string;
  alt: string;
  width: number;
  height: number;
}>;

export type ProductMedia = Readonly<{
  primaryImage: ProductImage | null;
  images: readonly ProductImage[];
}>;

const primaryImage = (
  slug: string,
  productName: string,
  width: number,
  height: number,
): ProductImage => ({
  src: `/products/${slug}/original.png`,
  alt: productName,
  width,
  height,
});

const media = (
  slug: string,
  productName: string,
  width: number,
  height: number,
  images: readonly ProductImage[] = [],
): ProductMedia => ({
  primaryImage: primaryImage(slug, productName, width, height),
  images,
});

export const productMediaBySlug: Readonly<
  Record<string, ProductMedia>
> = {
  "xiaomi-17-ultra-5g-leica-kit": media(
    "xiaomi-17-ultra-5g-leica-kit",
    "Xiaomi 17 Ultra 5G Leica Kit",
    1122,
    1402,
  ),
  "apple-iphone-17": media(
    "apple-iphone-17",
    "Apple iPhone 17",
    1122,
    1402,
  ),
  "poco-f8-ultra": media(
    "poco-f8-ultra",
    "POCO F8 Ultra",
    1122,
    1402,
  ),
  "redmi-note-15-pro-plus-5g": media(
    "redmi-note-15-pro-plus-5g",
    "Redmi Note 15 Pro Plus 5G",
    1024,
    1536,
  ),
  "redmi-turbo-5": media(
    "redmi-turbo-5",
    "Redmi Turbo 5",
    1024,
    1536,
  ),
  "infinix-note-60-pro-5g": media(
    "infinix-note-60-pro-5g",
    "Infinix Note 60 Pro 5G",
    1024,
    1536,
  ),
  "tecno-camon-50": media(
    "tecno-camon-50",
    "TECNO Camon 50",
    1024,
    1536,
  ),
  "poco-c85": { primaryImage: null, images: [] },
  "poco-pad-x1": media(
    "poco-pad-x1",
    "POCO Pad X1",
    1024,
    1536,
  ),
  "xiaomi-pad-8": media(
    "xiaomi-pad-8",
    "Xiaomi Pad 8",
    1023,
    1537,
  ),
  "redmi-pad-2-pro-5g": media(
    "redmi-pad-2-pro-5g",
    "Redmi Pad 2 Pro 5G",
    1024,
    1535,
  ),
  "tecno-mega-pad-pro": media(
    "tecno-mega-pad-pro",
    "TECNO Mega Pad Pro",
    1023,
    1537,
  ),
};

const allProductImages = Object.values(productMediaBySlug).flatMap(
  ({ primaryImage, images }) =>
    primaryImage ? [primaryImage, ...images] : images,
);

if (
  Object.keys(productMediaBySlug).length !== 12 ||
  Object.values(productMediaBySlug).filter(
    ({ primaryImage }) => primaryImage === null,
  ).length !== 1 ||
  allProductImages.some(
    (image) =>
      !image.src.startsWith("/") ||
      !image.alt.trim() ||
      image.width < 1 ||
      image.height < 1,
  ) ||
  new Set(allProductImages.map(({ src }) => src)).size !==
    allProductImages.length ||
  Object.values(productMediaBySlug).some(
    ({ primaryImage, images }) =>
      primaryImage !== null &&
      images.some(({ src }) => src === primaryImage.src),
  )
) {
  throw new Error("Product image validation failed.");
}
