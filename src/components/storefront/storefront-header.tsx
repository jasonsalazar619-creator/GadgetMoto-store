import { BrandLockup } from "@/components/brand/brand-lockup";
import { Container } from "@/components/ui/container";
import Link from "next/link";
import { ComparisonCountLink } from "@/components/comparison/comparison-count-link";
import { GlobalSearchTrigger } from "@/components/search/global-search-trigger";
import { CartTrigger } from "@/components/cart/cart-trigger";

const messengerUrl = "https://www.facebook.com/profile.php?id=100063905416187";

export function StorefrontHeader() {
  return (
    <header className="relative z-30 bg-white">
      <div className="bg-[var(--color-ink)] py-2.5 text-center text-xs font-semibold tracking-wide text-white sm:text-sm">
        <Container>Flexible ways to pay <span aria-hidden="true">•</span> Nationwide delivery <span aria-hidden="true">•</span> Availability confirmed by our sales team</Container>
      </div>
      <Container className="storefront-container flex min-h-20 items-center justify-between gap-5 lg:min-h-24">
        <Link aria-label="GadgetMoTo home" className="storefront-lockup" href="/"><BrandLockup variant="compact" /></Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 text-[0.95rem] font-semibold text-[var(--color-graphite)] lg:flex xl:gap-8 xl:text-base">
          <Link className="nav-link" href="/shop">Shop</Link>
          <Link className="nav-link" href="/phones">Phones</Link>
          <Link className="nav-link" href="/tablets">Tablets</Link>
          <ComparisonCountLink />
          <Link className="nav-link" href="/#payments">Financing</Link>
          <Link className="nav-link" href="/contact">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <GlobalSearchTrigger />
          <a className="hidden min-h-12 items-center rounded-[var(--radius-round)] bg-[var(--color-messenger)] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgb(8_102_255_/_0.18)] transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-[#0754d1] sm:inline-flex" href={messengerUrl} rel="noopener noreferrer" target="_blank">Messenger</a>
          <CartTrigger />
        </div>
      </Container>
      <nav aria-label="Mobile navigation" className="border-y border-[var(--color-border)] lg:hidden">
        <Container className="mobile-nav-scroll storefront-container flex gap-6 overflow-x-auto py-3.5 text-sm font-semibold text-[var(--color-graphite)]">
          <Link className="whitespace-nowrap" href="/shop">Shop</Link>
          <Link className="whitespace-nowrap" href="/phones">Phones</Link>
          <Link className="whitespace-nowrap" href="/tablets">Tablets</Link>
          <ComparisonCountLink mobile />
          <Link className="whitespace-nowrap" href="/#payments">Ways to pay</Link>
          <Link className="whitespace-nowrap" href="/contact">Contact</Link>
          <a className="whitespace-nowrap text-[var(--color-action)]" href={messengerUrl} rel="noopener noreferrer" target="_blank">Messenger</a>
        </Container>
      </nav>
    </header>
  );
}
