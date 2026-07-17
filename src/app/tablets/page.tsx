import type { Metadata } from "next";
import { CatalogPage } from "@/components/storefront/catalog-page";
import { getTablets } from "@/data/prototype-products";

export const metadata: Metadata = { title: "Tablets | GadgetMoTo", description: "Browse four prototype tablets at GadgetMoTo with confirmed variants, prices, and payment options." };

export default function TabletsPage() { return <CatalogPage eyebrow="TABLETS" title="More room to work, watch, and explore." description="Explore four verified prototype tablets with confirmed variants and prices, without unverified compatibility claims." products={getTablets()} backToShop />; }
