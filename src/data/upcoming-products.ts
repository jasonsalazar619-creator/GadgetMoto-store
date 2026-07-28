import {
  upcomingProductContent,
  type UpcomingProductSpecification,
} from "@/data/upcoming-product-content";

export type UpcomingProductCategory =
  | "Phone"
  | "Tablet"
  | "To be confirmed";

export type UpcomingProductImage = Readonly<{
  src: string;
  alt: string;
  width: number;
  height: number;
}>;

export type UpcomingProduct = Readonly<{
  id: string;
  name: string;
  brand: string;
  category: UpcomingProductCategory;
  primaryImage: UpcomingProductImage | null;
  images: readonly UpcomingProductImage[];
  shortDescription: string;
  description: string;
  highlights: readonly string[];
  specifications: readonly UpcomingProductSpecification[];
  availabilityMessage: "Details and availability coming soon.";
}>;

const previewImage = (
  src: string,
  alt: string,
  width: number,
  height: number,
): UpcomingProductImage => ({ src, alt, width, height });

const upcoming = (
  id: string,
  name: string,
  brand: string,
  category: UpcomingProductCategory,
  width: number | null,
  height: number | null,
  images: readonly UpcomingProductImage[] = [],
): UpcomingProduct => ({
  id,
  name,
  brand,
  category,
  primaryImage:
    width === null || height === null
      ? null
      : previewImage(
          `/upcoming/${id}.png`,
          `${name} product preview`,
          width,
          height,
        ),
  images,
  ...upcomingProductContent[id],
  availabilityMessage: "Details and availability coming soon.",
});

export const upcomingProducts: readonly UpcomingProduct[] = [
  upcoming("honor-600", "HONOR 600", "HONOR", "Phone", 1024, 1536),
  upcoming("honor-win-rt", "HONOR WIN RT", "HONOR", "Phone", 1024, 1536),
  upcoming("honor-win", "HONOR WIN", "HONOR", "Phone", 1024, 1536),
  upcoming("honor-x9d", "HONOR X9D", "HONOR", "Phone", 1024, 1536),
  upcoming("infinix-gt30-5g", "Infinix GT30 5G", "Infinix", "Phone", 1024, 1536),
  upcoming("infinix-gt30-pro", "Infinix GT30 Pro", "Infinix", "Phone", 1024, 1536),
  upcoming("infinix-hot-70", "Infinix Hot 70", "Infinix", "Phone", 1024, 1535),
  upcoming("infinix-note-edge-5g", "Infinix Note Edge 5G", "Infinix", "Phone", 1024, 1536),
  upcoming("infinix-note-60-ultra", "Infinix Note 60 Ultra", "Infinix", "Phone", 1024, 1536),
  upcoming("infinix-smart-20", "Infinix Smart 20", "Infinix", "Phone", 1024, 1536),
  upcoming("identity-to-be-confirmed", "Product identity to be confirmed", "To be confirmed", "To be confirmed", null, null),
  upcoming("apple-ipad-a16-11th-gen", "Apple iPad A16 11th Gen", "Apple", "Tablet", 1024, 1536),
  upcoming("apple-iphone-14", "Apple iPhone 14", "Apple", "Phone", 1024, 1536),
  upcoming("apple-iphone-15", "Apple iPhone 15", "Apple", "Phone", 1024, 1536),
  upcoming("apple-iphone-16", "Apple iPhone 16", "Apple", "Phone", 1024, 1536),
  upcoming("iqoo-15-ultra", "iQOO 15 Ultra", "iQOO", "Phone", 1024, 1536),
  upcoming("iqoo-15", "iQOO 15", "iQOO", "Phone", 1024, 1536),
  upcoming("iqoo-z10-turbo-plus", "iQOO Z10 Turbo Plus", "iQOO", "Phone", 1023, 1537),
  upcoming("iqoo-z10-turbo-pro", "iQOO Z10 Turbo Pro", "iQOO", "Phone", 1024, 1536),
  upcoming("iqoo-z11-turbo", "iQOO Z11 Turbo", "iQOO", "Phone", 1023, 1537),
  upcoming("iqoo-z11", "iQOO Z11", "iQOO", "Phone", 1024, 1536),
  upcoming("itel-power70", "itel Power70", "itel", "Phone", 1024, 1536),
  upcoming("itel-s26-ultra", "itel S26 Ultra", "itel", "Phone", 1023, 1537),
  upcoming("lenovo-legion-tab-y700-gen5", "Lenovo Legion Tab Y700 Gen5", "Lenovo", "Tablet", 1024, 1536),
  upcoming(
    "lenovo-legion-y70-2026",
    "Lenovo Legion Y70 2026",
    "Lenovo",
    "To be confirmed",
    1024,
    1536,
    [
      previewImage(
        "/upcoming/lenovo-legion-y70-2026-gallery-01.png",
        "Lenovo Legion Y70 2026 alternate product poster",
        1024,
        1536,
      ),
    ],
  ),
  upcoming("lenovo-legion-tab-y700", "Lenovo Legion Tab Y700", "Lenovo", "Tablet", 1024, 1536),
  upcoming("oneplus-ace6t", "OnePlus Ace6T", "OnePlus", "Phone", 1024, 1536),
  upcoming("oppo-a6t", "OPPO A6T", "OPPO", "Phone", 1024, 1536),
  upcoming("poco-c71", "POCO C71", "POCO", "Phone", 1024, 1536),
  upcoming("poco-c81-pro", "POCO C81 Pro", "POCO", "Phone", 1024, 1536),
  upcoming("poco-f6", "POCO F6", "POCO", "Phone", 1024, 1536),
  upcoming("poco-f7", "POCO F7", "POCO", "Phone", 1023, 1537),
  upcoming("poco-m8-5g", "POCO M8 5G", "POCO", "Phone", 1024, 1536),
  upcoming("poco-m8-pro-5g", "POCO M8 Pro 5G", "POCO", "Phone", 1024, 1536),
  upcoming("poco-m8s", "POCO M8s", "POCO", "Phone", 1024, 1536),
  upcoming("poco-pad-m1", "POCO Pad M1", "POCO", "Tablet", 1023, 1537),
  upcoming("poco-x7-pro", "POCO X7 Pro", "POCO", "Phone", 1024, 1536),
  upcoming("poco-x8-pro-max", "POCO X8 Pro Max", "POCO", "Phone", 1023, 1537),
  upcoming("poco-x8-pro", "POCO X8 Pro", "POCO", "Phone", 1023, 1537),
  upcoming("redmi-15-5g", "Redmi 15 5G", "Redmi", "Phone", 1024, 1536),
  upcoming("redmi-15c-5g", "Redmi 15C 5G", "Redmi", "Phone", 1024, 1535),
  upcoming("redmi-a5", "Redmi A5", "Redmi", "Phone", 1024, 1536),
  upcoming("redmi-a7-pro", "Redmi A7 Pro", "Redmi", "Phone", 1024, 1535),
  upcoming("redmi-k90-max", "Redmi K90 Max", "Redmi", "Phone", 1023, 1537),
  upcoming("redmi-k90-pro-max", "Redmi K90 Pro Max", "Redmi", "Phone", 1024, 1536),
  upcoming("redmi-k90", "Redmi K90", "Redmi", "Phone", 1024, 1536),
  upcoming("redmi-note-15", "Redmi Note 15", "Redmi", "Phone", 1024, 1535),
  upcoming("redmi-note-15-pro-5g", "Redmi Note 15 Pro 5G", "Redmi", "Phone", 1024, 1535),
  upcoming("redmi-pad-2-4g", "Redmi Pad 2 4G", "Redmi", "Tablet", 1024, 1536),
  upcoming("redmi-pad-2-se", "Redmi Pad 2 SE", "Redmi", "Tablet", 1024, 1535),
  upcoming(
    "redmi-turbo-4-pro",
    "Redmi Turbo 4 Pro",
    "Redmi",
    "Phone",
    1023,
    1537,
    [
      previewImage(
        "/upcoming/redmi-turbo-4-pro-gallery-01.png",
        "Redmi Turbo 4 Pro alternate product poster",
        1024,
        1536,
      ),
    ],
  ),
  upcoming("redmi-turbo-4", "Redmi Turbo 4", "Redmi", "Phone", 1024, 1536),
  upcoming("redmi-turbo-5-max", "Redmi Turbo 5 Max", "Redmi", "Phone", 1024, 1536),
  upcoming("samsung-galaxy-a07-lte", "Samsung Galaxy A07 LTE", "Samsung", "Phone", 1023, 1537),
  upcoming("tecno-camon-50-ultra", "TECNO Camon 50 Ultra", "TECNO", "Phone", 1023, 1537),
  upcoming("tecno-pova-curve-2", "TECNO Pova Curve 2", "TECNO", "Phone", 1039, 1513),
  upcoming("tecno-pova-curve", "TECNO Pova Curve", "TECNO", "Phone", 1022, 1538),
  upcoming("tecno-pova-7", "TECNO Pova 7", "TECNO", "Phone", 1024, 1536),
  upcoming("tecno-spark-50", "TECNO Spark 50", "TECNO", "Phone", 1024, 1536),
  upcoming("tecno-spark-go-3", "TECNO Spark Go 3", "TECNO", "Phone", 1054, 1492),
  upcoming("tecno-spark-slim", "TECNO Spark Slim", "TECNO", "Phone", 1024, 1536),
  upcoming("vivo-y05", "vivo Y05", "vivo", "Phone", 1024, 1536),
  upcoming("vivo-y11d", "vivo Y11D", "vivo", "Phone", 1024, 1536),
  upcoming("xiaomi-17-pro-max", "Xiaomi 17 Pro Max", "Xiaomi", "Phone", 1024, 1536),
  upcoming("xiaomi-17-pro", "Xiaomi 17 Pro", "Xiaomi", "Phone", 1024, 1536),
  upcoming("xiaomi-17t", "Xiaomi 17T", "Xiaomi", "Phone", 1024, 1536),
  upcoming("xiaomi-17", "Xiaomi 17", "Xiaomi", "Phone", 1024, 1536),
  upcoming("xiaomi-17t-pro", "Xiaomi 17T Pro", "Xiaomi", "Phone", 1024, 1535),
];

if (
  upcomingProducts.length !== 68 ||
  new Set(upcomingProducts.map(({ id }) => id)).size !==
    upcomingProducts.length ||
  upcomingProducts.some(
    ({
      id,
      name,
      brand,
      primaryImage,
      images,
      shortDescription,
      description,
    }) =>
      !id.trim() ||
      !name.trim() ||
      !brand.trim() ||
      !shortDescription?.trim() ||
      !description?.trim() ||
      (primaryImage !== null &&
        (!primaryImage.src.startsWith("/upcoming/") ||
          !primaryImage.alt.trim() ||
          primaryImage.width < 1 ||
          primaryImage.height < 1)) ||
      images.some(
        (image) =>
          !image.src.startsWith("/upcoming/") ||
          !image.alt.trim() ||
          image.width < 1 ||
          image.height < 1 ||
          image.src === primaryImage?.src,
      ),
  )
) {
  throw new Error("Upcoming product preview validation failed.");
}

if (
  Object.keys(upcomingProductContent).some(
    (id) => !upcomingProducts.some((product) => product.id === id),
  )
) {
  throw new Error("Upcoming product content assignment validation failed.");
}

const assignedImages = upcomingProducts.flatMap((product) => [
  ...(product.primaryImage ? [product.primaryImage] : []),
  ...product.images,
]);

if (
  assignedImages.length !== 69 ||
  new Set(assignedImages.map(({ src }) => src)).size !== assignedImages.length
) {
  throw new Error("Upcoming product image assignment validation failed.");
}

export function getUpcomingProductById(
  id: string,
): UpcomingProduct | undefined {
  return upcomingProducts.find((product) => product.id === id);
}
