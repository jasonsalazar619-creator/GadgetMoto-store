import type { MetadataRoute } from "next";

import { getAllProducts } from "@/data/prototype-products";
import { absoluteSiteUrl } from "@/lib/site/server";

const storefrontRoutes = [
  "/",
  "/shop",
  "/phones",
  "/tablets",
  "/coming-soon",
  "/compare",
  "/cart",
  "/checkout",
  "/contact",
  "/privacy-policy",
  "/terms-and-conditions",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = storefrontRoutes.map(
    (pathname) => ({
      url: absoluteSiteUrl(pathname),
      changeFrequency: pathname === "/" ? "weekly" : "monthly",
      priority: pathname === "/" ? 1 : pathname === "/shop" ? 0.9 : 0.7,
    }),
  );
  const products: MetadataRoute.Sitemap = getAllProducts().map(
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

  return [...pages, ...products];
}
