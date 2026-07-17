import { BrandLockup } from "@/components/brand/brand-lockup";
import { Container } from "@/components/ui/container";

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
              <a href="#new-arrivals">New arrivals</a><a href="#new-arrivals">Phones</a><a href="#tablets">Tablets</a><a href="#compare">Compare</a>
            </nav>
          </div>
          <div>
            <h2 className="font-bold">Customer help</h2>
            <div className="mt-6 flex flex-col items-start gap-3.5 text-[0.95rem] text-[#c7d1da]"><span>Delivery information</span><span>Store pickup</span><span>Payment options</span><span>Price-drop alerts</span></div>
          </div>
          <div>
            <h2 className="font-bold">Connect</h2>
            <p className="mt-6 text-[0.95rem] leading-relaxed text-[#c7d1da]">Payment and financing options are outlined above.</p>
            <a className="mt-6 inline-flex min-h-12 items-center rounded-[var(--radius-round)] bg-[var(--color-messenger)] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgb(8_102_255_/_0.2)]" href={messengerUrl} rel="noopener noreferrer" target="_blank">Facebook Messenger</a>
          </div>
        </div>
        <div className="flex flex-col gap-3 pt-7 text-xs text-[#91a0ad] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} GadgetMoTo. Your Next Upgrade, Mo ’To.</p>
          <p>Product availability and prices may change.</p>
        </div>
      </Container>
    </footer>
  );
}
