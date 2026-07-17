import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ComparisonPageContent } from "@/components/comparison/comparison-page-content";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";

export const metadata: Metadata = { title: "Compare Products | GadgetMoTo", description: "Compare selected GadgetMoTo phones and tablets using confirmed product and pricing information." };

export default function ComparePage() { return <StorefrontPageShell><Container className="storefront-container py-[var(--space-section)]"><ComparisonPageContent /></Container></StorefrontPageShell>; }
