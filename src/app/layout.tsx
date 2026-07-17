import type { Metadata } from "next";
import "./globals.css";
import { ComparisonProvider } from "@/components/comparison/comparison-provider";
import { ComparisonTray } from "@/components/comparison/comparison-tray";

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
      <body className="min-h-full flex flex-col"><ComparisonProvider>{children}<ComparisonTray /></ComparisonProvider></body>
    </html>
  );
}
