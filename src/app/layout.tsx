import type { Metadata } from "next";
import "./globals.css";
import { ComparisonProvider } from "@/components/comparison/comparison-provider";
import { ComparisonTray } from "@/components/comparison/comparison-tray";
import { GlobalSearchProvider } from "@/components/search/global-search";
import { getAllProducts } from "@/data/prototype-products";

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
      <body className="min-h-full flex flex-col"><ComparisonProvider><GlobalSearchProvider products={getAllProducts()}>{children}</GlobalSearchProvider><ComparisonTray /></ComparisonProvider></body>
    </html>
  );
}
