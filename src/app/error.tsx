"use client";

import Link from "next/link";

export default function StorefrontError({
  unstable_retry,
}: {
  unstable_retry: () => void;
}) {
  return (
    <main className="storefront-error" role="alert">
      <p className="type-eyebrow text-[var(--color-action)]">
        SOMETHING WENT WRONG
      </p>
      <h1>We couldn’t load this part of the storefront.</h1>
      <p>
        Try again, browse the catalog, or contact GadgetMoTo for help.
      </p>
      <div>
        <button onClick={() => unstable_retry()} type="button">
          Try Again
        </button>
        <Link href="/shop">Browse Products</Link>
        <Link href="/contact">Contact GadgetMoTo</Link>
      </div>
    </main>
  );
}
