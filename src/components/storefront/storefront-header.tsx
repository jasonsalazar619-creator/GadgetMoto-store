import { BrandLockup } from "@/components/brand/brand-lockup";
import { Container } from "@/components/ui/container";
import Link from "next/link";
import { ComparisonCountLink } from "@/components/comparison/comparison-count-link";
import { GlobalSearchTrigger } from "@/components/search/global-search-trigger";

const messengerUrl = "https://www.facebook.com/profile.php?id=100063905416187";

function CartIcon() {
  return <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24"><path d="M3 4h2l2.1 10.1a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L20 8H6M10 20h.01M17 20h.01" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>;
}

export function StorefrontHeader() {
  return (
    <header className="relative z-30 bg-white">
      <div className="bg-[var(--color-ink)] py-2.5 text-center text-xs font-semibold tracking-wide text-white sm:text-sm">
        <Container>Flexible ways to pay <span aria-hidden="true">•</span> Nationwide delivery <span aria-hidden="true">•</span> Store pickup in Cavite City</Container>
      </div>
      <Container className="storefront-container flex min-h-20 items-center justify-between gap-5 lg:min-h-24">
        <Link aria-label="GadgetMoTo home" className="storefront-lockup" href="/"><BrandLockup variant="compact" /></Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-[0.95rem] font-semibold text-[var(--color-graphite)] lg:flex xl:gap-8 xl:text-base">
          <Link className="nav-link" href="/shop">Shop</Link>
          <Link className="nav-link" href="/phones">Phones</Link>
          <Link className="nav-link" href="/tablets">Tablets</Link>
          <ComparisonCountLink />
          <Link className="nav-link" href="/#payments">Financing</Link>
        </nav>
        <div className="flex items-center gap-2">
          <GlobalSearchTrigger />
          <a className="hidden min-h-12 items-center rounded-[var(--radius-round)] bg-[var(--color-messenger)] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgb(8_102_255_/_0.18)] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#0754d1] sm:inline-flex" href={messengerUrl} rel="noopener noreferrer" target="_blank">Messenger</a>
          <button aria-label="View cart (preview)" className="header-icon-control icon-control" type="button"><CartIcon /></button>
        </div>
      </Container>
      <nav aria-label="Mobile navigation" className="border-y border-[var(--color-border)] lg:hidden">
        <Container className="storefront-container flex gap-6 overflow-x-auto py-3.5 text-sm font-semibold text-[var(--color-graphite)]">
          <Link className="whitespace-nowrap" href="/shop">Shop</Link>
          <Link className="whitespace-nowrap" href="/phones">Phones</Link>
          <Link className="whitespace-nowrap" href="/tablets">Tablets</Link>
          <ComparisonCountLink mobile />
          <Link className="whitespace-nowrap" href="/#payments">Ways to pay</Link>
          <a className="whitespace-nowrap text-[var(--color-action)]" href={messengerUrl} rel="noopener noreferrer" target="_blank">Message Us</a>
        </Container>
      </nav>
    </header>
  );
}
