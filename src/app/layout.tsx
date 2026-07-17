import type { Metadata } from "next";
import "./globals.css";
import { ComparisonProvider } from "@/components/comparison/comparison-provider";
import { ComparisonTray } from "@/components/comparison/comparison-tray";
import { GlobalSearchProvider } from "@/components/search/global-search";
import { getAllProducts } from "@/data/prototype-products";
import { CartProvider } from "@/components/cart/cart-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";

export const metadata: Metadata = {
  title: "GadgetMoTo",
  description: "Phones and tablets for every lifestyle, budget, and way to pay.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="min-h-full flex flex-col"><ComparisonProvider><CartProvider products={getAllProducts()}><GlobalSearchProvider products={getAllProducts()}>{children}</GlobalSearchProvider><CartDrawer /></CartProvider><ComparisonTray /></ComparisonProvider></body>
    </html>
  );
}
