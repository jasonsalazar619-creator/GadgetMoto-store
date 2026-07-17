import type { Metadata } from "next";
import { CatalogPage } from "@/components/storefront/catalog-page";
import { getAllProducts } from "@/data/prototype-products";

export const metadata: Metadata = { title: "Shop Phones and Tablets | GadgetMoTo", description: "Browse GadgetMoTo's prototype selection of phones and tablets with confirmed prices and payment options." };

export default function ShopPage() { return <CatalogPage eyebrow="GADGETMOTO CATALOG" title="Find your next phone or tablet." description="Browse our current prototype selection and compare prices, categories, and available payment options." products={getAllProducts()} resultsLabel="products" showCategoryFilter />; }
