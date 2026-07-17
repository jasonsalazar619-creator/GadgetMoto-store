import Link from "next/link";
import { Container } from "@/components/ui/container";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";

const messengerUrl = "https://www.facebook.com/profile.php?id=100063905416187";

export default function ProductNotFound() {
  return <StorefrontPageShell><Container className="storefront-container flex min-h-[55vh] flex-col items-start justify-center py-20"><p className="type-eyebrow text-[var(--color-action)]">PRODUCT NOT FOUND</p><h1 className="type-h1 mt-5">This upgrade isn’t in our prototype catalog.</h1><p className="type-body-lg mt-6 max-w-2xl text-[var(--color-muted)]">Browse the current GadgetMoTo selection or message our sales team for help.</p><div className="mt-8 flex flex-wrap gap-3"><Link className="button-link button-link--primary" href="/shop">Browse the catalog</Link><a className="button-link product-message-link" href={messengerUrl} rel="noopener noreferrer" target="_blank">Message Us</a></div></Container></StorefrontPageShell>;
}
