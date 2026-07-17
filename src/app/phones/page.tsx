import type { Metadata } from "next";
import { CatalogPage } from "@/components/storefront/catalog-page";
import { getPhones } from "@/data/prototype-products";

export const metadata: Metadata = { title: "Phones | GadgetMoTo", description: "Browse eight prototype phones at GadgetMoTo with confirmed variants, prices, and payment options." };

export default function PhonesPage() { return <CatalogPage eyebrow="PHONES" title="Phones for every kind of upgrade." description="Explore eight verified prototype phones across a range of budgets, with confirmed variants and prices." fixedCategory="Phone" products={getPhones()} resultsLabel="phones" backToShop />; }
