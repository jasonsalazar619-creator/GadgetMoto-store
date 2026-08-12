import type { MetadataRoute } from "next";

import { getCatalogProducts } from "@/lib/catalog/server/catalog";
import { getUpcomingProducts } from "@/lib/catalog/server/upcoming-catalog";
import { absoluteSiteUrl } from "@/lib/site/server";

const storefrontRoutes = [
  "/",
  "/shop",
  "/phones",
  "/tablets",
  "/sale",
  "/coming-soon",
  "/compare",
  "/cart",
  "/checkout",
  "/contact",
  "/privacy-policy",
  "/terms-and-conditions",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalogProducts, upcomingProducts] = await Promise.all([
    getCatalogProducts(),
    getUpcomingProducts(),
  ]);
  const pages: MetadataRoute.Sitemap = storefrontRoutes.map(
    (pathname) => ({
      url: absoluteSiteUrl(pathname),
      changeFrequency: pathname === "/" ? "weekly" : "monthly",
      priority: pathname === "/" ? 1 : pathname === "/shop" ? 0.9 : 0.7,
    }),
  );
  const products: MetadataRoute.Sitemap = catalogProducts.map(
    (product) => ({
      url: absoluteSiteUrl(`/products/${product.slug}`),
      changeFrequency: "weekly",
      priority: 0.8,
      images: [
        ...(product.primaryImage ? [product.primaryImage] : []),
        ...product.images,
      ].map((image) => absoluteSiteUrl(image.src)),
    }),
  );
  const previews: MetadataRoute.Sitemap = upcomingProducts.map((product) => ({
    url: absoluteSiteUrl(`/coming-soon/${product.id}`),
    changeFrequency: "monthly",
    priority: 0.5,
    images: [
      ...(product.primaryImage ? [product.primaryImage] : []),
      ...product.images,
    ].map((image) => absoluteSiteUrl(image.src)),
  }));

  return [...pages, ...products, ...previews];
}
