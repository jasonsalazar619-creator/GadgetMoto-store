import type { Metadata } from "next";
import "./globals.css";
import { ComparisonProvider } from "@/components/comparison/comparison-provider";
import { ComparisonTray } from "@/components/comparison/comparison-tray";
import { GlobalSearchProvider } from "@/components/search/global-search";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CatalogProvider } from "@/components/catalog/catalog-provider";
import { getCatalogProducts } from "@/lib/catalog/server/catalog";

export const metadata: Metadata = {
  title: "GadgetMoTo",
  description: "Phones and tablets for every lifestyle, budget, and way to pay.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const products = await getCatalogProducts();

  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col"><CatalogProvider products={products}><ComparisonProvider><CartProvider><GlobalSearchProvider>{children}</GlobalSearchProvider><CartDrawer /></CartProvider><ComparisonTray /></ComparisonProvider></CatalogProvider></body>
    </html>
  );
}
