import Link from "next/link";

import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { Container } from "@/components/ui/container";

export default function UpcomingProductNotFound() {
  return (
    <StorefrontPageShell>
      <Container className="storefront-container flex min-h-[55vh] flex-col items-start justify-center py-20">
        <p className="type-eyebrow text-[var(--color-action)]">PREVIEW NOT FOUND</p>
        <h1 className="type-h1 mt-5">This product preview is not available.</h1>
        <p className="type-body-lg mt-6 max-w-2xl text-[var(--color-muted)]">
          Browse the current Coming Soon collection for future GadgetMoTo
          catalog updates.
        </p>
        <Link className="button-link button-link--primary mt-8" href="/coming-soon">
          Browse Coming Soon
        </Link>
      </Container>
    </StorefrontPageShell>
  );
}
