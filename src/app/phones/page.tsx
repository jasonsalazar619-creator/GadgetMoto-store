import type { Metadata } from "next";
import { CatalogPage } from "@/components/storefront/catalog-page";
import { getCatalogProducts } from "@/lib/catalog/server/catalog";

export const metadata: Metadata = {
  title: "Phones | GadgetMoTo",
  description:
    "Browse GadgetMoTo phones with confirmed variants, prices, and contact-based ordering.",
  alternates: { canonical: "/phones" },
};

export default async function PhonesPage() {
  const products = await getCatalogProducts();
  const phones = products.filter((product) => product.category === "Phone");

  return <CatalogPage eyebrow="PHONES" title="Phones for every kind of upgrade." description={`Explore ${phones.length} verified ${phones.length === 1 ? "phone" : "phones"} across a range of budgets, with confirmed variants and prices.`} fixedCategory="Phone" products={phones} resultsLabel="phones" backToShop />;
}
