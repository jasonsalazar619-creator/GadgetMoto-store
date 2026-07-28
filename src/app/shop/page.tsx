import type { Metadata } from "next";
import { CatalogPage } from "@/components/storefront/catalog-page";
import { getCatalogProducts } from "@/lib/catalog/server/catalog";

export const metadata: Metadata = {
  title: "Shop Phones and Tablets | GadgetMoTo",
  description:
    "Browse GadgetMoTo phones and tablets with confirmed variants, prices, and contact-based ordering.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const products = await getCatalogProducts();

  return <CatalogPage eyebrow="GADGETMOTO CATALOG" title="Find your next phone or tablet." description="Browse our current selection, compare confirmed details, and contact our sales team to confirm availability." products={products} resultsLabel="products" showCategoryFilter />;
}
