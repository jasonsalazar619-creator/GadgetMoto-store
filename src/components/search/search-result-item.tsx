"use client";

import Link from "next/link";
import type { PrototypeProduct } from "@/data/prototype-products";
import { DevicePlaceholder } from "@/components/storefront/device-placeholder";

const priceFormatter = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

export function SearchResultItem({ active, onHover, onNavigate, product }: { active: boolean; onHover: () => void; onNavigate: () => void; product: PrototypeProduct }) {
  return <Link aria-label={`View ${product.name}, ${product.variant}, ${priceFormatter.format(product.currentPrice)}`} aria-selected={active} className={active ? "global-search-result global-search-result--active" : "global-search-result"} href={`/products/${product.slug}`} id={`global-search-result-${product.slug}`} onClick={onNavigate} onMouseEnter={onHover} role="option"><span className="global-search-result__art"><DevicePlaceholder category={product.category} /></span><span className="global-search-result__content"><span><small>{product.brand} · {product.category}</small>{product.badge ? <em>{product.badge === "sale" ? "Sale" : "New"}</em> : null}</span><strong>{product.name}</strong><small>{product.variant}</small></span><span className="global-search-result__price">{priceFormatter.format(product.currentPrice)}<small>View product →</small></span></Link>;
}
