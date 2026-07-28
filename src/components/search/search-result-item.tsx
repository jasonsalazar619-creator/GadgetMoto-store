"use client";

import Link from "next/link";
import type { PrototypeProduct } from "@/data/prototype-products";
import { ProductArtwork } from "@/components/storefront/product-artwork";

const priceFormatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

export function SearchResultItem({ active, onHover, onNavigate, product }: { active: boolean; onHover: () => void; onNavigate: () => void; product: PrototypeProduct }) {
  return <Link aria-label={`View ${product.name}, ${product.variant}, ${priceFormatter.format(product.currentPrice)}`} aria-selected={active} className={active ? "global-search-result global-search-result--active" : "global-search-result"} href={`/products/${product.slug}`} id={`global-search-result-${product.slug}`} onClick={onNavigate} onMouseEnter={onHover} role="option"><span className="global-search-result__art"><ProductArtwork product={product} sizes="5rem" /></span><span className="global-search-result__content"><span><small>{product.brand} · {product.category}</small>{product.badge ? <em>{product.badge === "sale" ? "Sale" : "New"}</em> : null}</span><strong>{product.name}</strong><small>{product.variant}</small><small className="global-search-result__availability">Contact us to confirm availability.</small></span><span className="global-search-result__price">{priceFormatter.format(product.currentPrice)}<small>View product →</small></span></Link>;
}
