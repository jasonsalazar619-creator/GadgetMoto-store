import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { CartPageContent } from "@/components/cart/cart-page-content";
export const metadata: Metadata = { title: "Your Cart | GadgetMoTo", description: "Review the phones and tablets added to your GadgetMoTo cart." };
export default function CartPage() { return <StorefrontPageShell><Container className="storefront-container py-[var(--space-section)]"><CartPageContent /></Container></StorefrontPageShell>; }
