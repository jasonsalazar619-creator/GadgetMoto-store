import type { Metadata } from "next";
import Link from "next/link";

import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Page Not Found | GadgetMoTo",
  description: "The requested GadgetMoTo page could not be found.",
};

export default function NotFound() {
  return (
    <StorefrontPageShell>
      <Container className="storefront-container flex min-h-[55vh] flex-col items-start justify-center py-20">
        <p className="type-eyebrow text-[var(--color-action)]">
          PAGE NOT FOUND
        </p>
        <h1 className="type-h1 mt-5">
          This page is not part of the GadgetMoTo storefront.
        </h1>
        <p className="type-body-lg mt-6 max-w-2xl text-[var(--color-muted)]">
          Browse the current catalog or contact our sales team for help.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            className="button-link button-link--primary"
            href="/shop"
          >
            Browse Products
          </Link>
          <Link
            className="button-link button-link--secondary"
            href="/contact"
          >
            Contact GadgetMoTo
          </Link>
        </div>
      </Container>
    </StorefrontPageShell>
  );
}
