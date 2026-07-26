import type { Metadata } from "next";
import { CatalogPage } from "@/components/storefront/catalog-page";
import { getCatalogProducts } from "@/lib/catalog/server/catalog";

export const metadata: Metadata = { title: "Shop Phones and Tablets | GadgetMoTo", description: "Browse GadgetMoTo's prototype selection of phones and tablets with confirmed prices and payment options." };

export default async function ShopPage() {
  const products = await getCatalogProducts();

  return <CatalogPage eyebrow="GADGETMOTO CATALOG" title="Find your next phone or tablet." description="Browse our current prototype selection and compare prices, categories, and available payment options." products={products} resultsLabel="products" showCategoryFilter />;
}
