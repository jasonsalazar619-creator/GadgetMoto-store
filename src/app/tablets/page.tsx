import type { Metadata } from "next";
import { CatalogPage } from "@/components/storefront/catalog-page";
import { getCatalogProducts } from "@/lib/catalog/server/catalog";

export const metadata: Metadata = {
  title: "Tablets | GadgetMoTo",
  description:
    "Browse four GadgetMoTo tablets with confirmed variants, prices, and contact-based ordering.",
  alternates: { canonical: "/tablets" },
};

export default async function TabletsPage() {
  const products = await getCatalogProducts();
  const tablets = products.filter((product) => product.category === "Tablet");

  return <CatalogPage eyebrow="TABLETS" title="More room to work, watch, and explore." description="Explore four verified tablets with confirmed variants and prices, without unverified compatibility claims." fixedCategory="Tablet" products={tablets} resultsLabel="tablets" backToShop />;
}
