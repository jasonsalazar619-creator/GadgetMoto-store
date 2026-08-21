import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductCard } from "@/components/storefront/product-card";
import { StorefrontPageShell } from "@/components/storefront/storefront-page-shell";
import { formatProductTitle, getAllProducts } from "@/data/prototype-products";
import {
  getCatalogProductBySlug,
  getCatalogProducts,
} from "@/lib/catalog/server/catalog";
import { ComparisonButton } from "@/components/comparison/comparison-button";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";

const messengerUrl = "https://www.facebook.com/profile.php?id=100063905416187";
type ProductPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() { return getAllProducts().map(({ slug }) => ({ slug })); }

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getCatalogProductBySlug((await params).slug);
  if (!product) return { title: "Product not found | GadgetMoTo" };
  const description = `View the ${product.name} at GadgetMoTo. Compare confirmed details and selectable configurations.`;
  const image = product.primaryImage;
  return {
    title: formatProductTitle(product),
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      type: "website",
      title: formatProductTitle(product),
      description,
      images: image
        ? [
            {
              url: image.src,
              width: image.width,
              height: image.height,
              alt: image.alt,
            },
          ]
        : ["/brand/gadgetmoto-logo-original.jpg"],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: formatProductTitle(product),
      description,
      images: [
        image?.src ?? "/brand/gadgetmoto-logo-original.jpg",
      ],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getCatalogProductBySlug((await params).slug);
  if (!product) notFound();
  const categoryPath = product.category === "Phone" ? "/phones" : "/tablets";
  const related = (await getCatalogProducts()).filter((item) => item.category === product.category && item.slug !== product.slug).slice(0, 4);

  return (
    <StorefrontPageShell>
      <Container className="storefront-container py-8 lg:py-12">
        <nav aria-label="Breadcrumb" className="breadcrumbs text-sm text-[var(--color-muted)]"><ol className="flex flex-wrap items-center gap-2"><li><Link href="/">Home</Link></li><li aria-hidden="true">/</li><li><Link href={categoryPath}>{product.category === "Phone" ? "Phones" : "Tablets"}</Link></li><li aria-hidden="true">/</li><li aria-current="page" className="text-[var(--color-ink)]">{product.name}</li></ol></nav>
      </Container>
      <section className="pb-[var(--space-section)]">
        <Container className="storefront-container product-detail-grid">
          <ProductGallery product={product} />
          <div className="product-detail-info">
            <p className="type-eyebrow text-[var(--color-action)]">{product.brand} · {product.category}</p>
            <h1 className="type-h1 mt-5">{product.name}</h1>
            {product.shortDescription ? (
              <p className="mt-5 text-lg leading-8 text-[var(--color-muted)]">
                {product.shortDescription}
              </p>
            ) : null}
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted)]">VAT is calculated separately. The applicable VAT rate is pending confirmation.</p>
            <div className="product-actions mt-8">
              <AddToCartButton product={product} />
              <a className="button-link product-message-link" href={messengerUrl} rel="noopener noreferrer" target="_blank">Message Us</a>
              <ComparisonButton className="button-link button-link--secondary" name={product.name} slug={product.slug} />
            </div>
          </div>
        </Container>
      </section>
      <section className="bg-[var(--color-ice)] py-[var(--space-section)]">
        <Container className="storefront-container grid gap-6 lg:grid-cols-2">
          <article className="detail-summary lg:col-span-2">
            <p className="type-eyebrow text-[var(--color-action)]">
              Official product details
            </p>
            <h2 className="type-h3 mt-4">Verified specifications</h2>
            {product.fullDescription ? (
              <p className="mt-5 max-w-4xl leading-8 text-[var(--color-muted)]">
                {product.fullDescription}
              </p>
            ) : null}
            <dl className="product-facts mt-6">
              {product.specifications.map((specification) => (
                <div key={specification.label}>
                  <dt>{specification.label}</dt>
                  <dd>{specification.value}</dd>
                </div>
              ))}
            </dl>
          </article>
          <article className="detail-summary"><p className="type-eyebrow text-[var(--color-action)]">Ways to pay</p><h2 className="type-h3 mt-4">Payment options</h2><ul><li>Maya online payment · coming later</li><li>Manual bank or e-wallet transfer after confirmation</li><li>Financing options are informational only</li><li>No cash on delivery</li></ul><p>Payment instructions and financing availability require sales-team confirmation.</p></article>
          <article className="detail-summary"><p className="type-eyebrow text-[var(--color-action)]">Getting your order</p><h2 className="type-h3 mt-4">Delivery and pickup</h2><ul><li>Nationwide delivery</li><li>Same-day delivery where available</li><li>Store pickup in Barangay Sabang, Dasmariñas</li></ul><p>Exact product availability is controlled by the selectable variants above. Delivery charges and pickup timing are confirmed during order review.</p></article>
        </Container>
      </section>
      <section className="py-[var(--space-section)]">
        <Container className="storefront-container"><div className="flex items-end justify-between gap-4"><div><p className="type-eyebrow text-[var(--color-action)]">Same category</p><h2 className="type-h2 mt-4">Related products</h2></div><Link className="font-semibold text-[var(--color-action)]" href={categoryPath}>View all</Link></div><div className="product-grid mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{related.map((item) => <ProductCard key={item.id} layout={item.category === "Tablet" ? "tablet" : "standard"} product={item} />)}</div></Container>
      </section>
    </StorefrontPageShell>
  );
}
