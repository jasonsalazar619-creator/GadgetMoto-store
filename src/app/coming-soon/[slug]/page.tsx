import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DevicePlaceholder } from "@/components/storefront/device-placeholder";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { Container } from "@/components/ui/container";
import {
  getUpcomingProductById,
  upcomingProducts,
} from "@/data/upcoming-products";

const messengerUrl =
  "https://www.facebook.com/profile.php?id=100063905416187";

type UpcomingProductPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return upcomingProducts.map(({ id }) => ({ slug: id }));
}

export async function generateMetadata({
  params,
}: UpcomingProductPageProps): Promise<Metadata> {
  const product = getUpcomingProductById((await params).slug);

  if (!product) {
    return { title: "Product preview not found | GadgetMoTo" };
  }

  const description = `${product.name} is being prepared for a future GadgetMoTo catalog update. Details and availability are coming soon.`;

  return {
    title: `${product.name} Preview | GadgetMoTo`,
    description,
    alternates: { canonical: `/coming-soon/${product.id}` },
    openGraph: product.primaryImage
      ? {
          title: `${product.name} Preview | GadgetMoTo`,
          description,
          images: [
            {
              url: product.primaryImage.src,
              width: product.primaryImage.width,
              height: product.primaryImage.height,
              alt: product.primaryImage.alt,
            },
          ],
        }
      : undefined,
  };
}

export default async function UpcomingProductPage({
  params,
}: UpcomingProductPageProps) {
  const product = getUpcomingProductById((await params).slug);

  if (!product) {
    notFound();
  }

  return (
    <StorefrontPageShell>
      <Container className="storefront-container py-8 lg:py-12">
        <nav aria-label="Breadcrumb" className="breadcrumbs text-sm text-[var(--color-muted)]">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/coming-soon">Coming Soon</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-[var(--color-ink)]">{product.name}</li>
          </ol>
        </nav>
      </Container>

      <section className="pb-[var(--space-section)]">
        <Container className="storefront-container upcoming-detail">
          <div className="upcoming-detail__media">
            <div className="upcoming-detail__primary">
              {product.primaryImage ? (
                <Image
                  alt={product.primaryImage.alt}
                  className="upcoming-detail__image"
                  height={product.primaryImage.height}
                  loading="eager"
                  sizes="(max-width: 1023px) 100vw, 55vw"
                  src={product.primaryImage.src}
                  width={product.primaryImage.width}
                />
              ) : (
                <DevicePlaceholder
                  category={product.category === "Tablet" ? "Tablet" : "Phone"}
                />
              )}
            </div>

            {product.images.length > 0 ? (
              <div className="upcoming-detail__gallery">
                {product.images.map((image) => (
                  <figure key={image.src}>
                    <Image
                      alt={image.alt}
                      className="upcoming-detail__image"
                      height={image.height}
                      sizes="(max-width: 767px) 100vw, 42vw"
                      src={image.src}
                      width={image.width}
                    />
                    <figcaption>Additional user-supplied product view</figcaption>
                  </figure>
                ))}
              </div>
            ) : null}
          </div>

          <div className="upcoming-detail__content">
            <p className="type-eyebrow text-[var(--color-action)]">
              {product.brand} · {product.category}
            </p>
            <h1>{product.name}</h1>
            <p>{product.availabilityMessage}</p>
            <div className="upcoming-detail__notice" role="note">
              <strong>Preview only</strong>
              <p>
                Pricing, variants, stock, and purchase availability have not
                been confirmed. This product is not available through the
                GadgetMoTo cart or checkout.
              </p>
            </div>
            <a
              className="button-link button-link--primary"
              href={messengerUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Message us for updates
            </a>
          </div>
        </Container>
      </section>
    </StorefrontPageShell>
  );
}
