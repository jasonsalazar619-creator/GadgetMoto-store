import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { CheckoutForm } from "@/components/checkout/checkout-form";
export const metadata: Metadata = { title: "Checkout | GadgetMoTo", description: "Review your GadgetMoTo order and provide delivery and payment details." };
export default function CheckoutPage() { return <StorefrontPageShell><Container className="storefront-container py-[var(--space-section)]"><CheckoutForm /></Container></StorefrontPageShell>; }
