import { BrandLockup } from "@/components/brand/brand-lockup";
import { Container } from "@/components/ui/container";
import Link from "next/link";

const messengerUrl = "https://www.facebook.com/profile.php?id=100063905416187";

export function StorefrontFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-ink)] py-16 text-white lg:py-20">
      <Container className="storefront-container">
        <div className="grid gap-12 border-b border-white/15 pb-14 sm:grid-cols-2 lg:grid-cols-[1.55fr_1fr_1fr_1fr] lg:gap-14">
          <div>
            <BrandLockup className="[&_span]:!text-white" />
            <p className="mt-6 max-w-sm text-base leading-relaxed text-[#c7d1da]">Phones and tablets for every lifestyle, budget, and way to pay.</p>
            <p className="mt-5 font-semibold">Cavite City</p>
          </div>
          <div>
            <h2 className="font-bold">Shop</h2>
            <nav aria-label="Footer shop navigation" className="mt-6 flex flex-col items-start gap-3.5 text-[0.95rem] text-[#c7d1da]">
              <Link href="/shop">All products</Link><Link href="/phones">Phones</Link><Link href="/tablets">Tablets</Link><Link href="/compare">Compare</Link>
            </nav>
          </div>
          <div>
            <h2 className="font-bold">Customer help</h2>
            <nav aria-label="Footer customer navigation" className="mt-6 flex flex-col items-start gap-3.5 text-[0.95rem] text-[#c7d1da]">
              <Link href="/#delivery">Delivery information</Link>
              <Link href="/#payments">Payment options</Link>
              <Link href="/contact">Contact GadgetMoTo</Link>
              <Link href="/privacy-policy">Privacy Policy</Link>
              <Link href="/terms-and-conditions">Terms and Conditions</Link>
            </nav>
          </div>
          <div>
            <h2 className="font-bold">Connect</h2>
            <p className="mt-6 text-[0.95rem] leading-relaxed text-[#c7d1da]">Contact our sales team to confirm availability, delivery, and payment instructions.</p>
            <a className="mt-6 inline-flex min-h-12 items-center rounded-[var(--radius-round)] bg-[var(--color-messenger)] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgb(8_102_255_/_0.2)]" href={messengerUrl} rel="noopener noreferrer" target="_blank">Facebook Messenger</a>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-7 text-xs text-[#91a0ad] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} GadgetMoTo. Your Next Upgrade, Mo ’To.</p>
          <p>Contact us to confirm availability.</p>
        </div>
      </Container>
    </footer>
  );
}
