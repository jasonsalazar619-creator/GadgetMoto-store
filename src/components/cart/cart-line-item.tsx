"use client";

import Link from "next/link";
import { ProductArtwork } from "@/components/storefront/product-artwork";
import { useCart, type ResolvedCartLine } from "./cart-provider";

const money = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
export function CartLineItem({ item }: { item: ResolvedCartLine }) {
  const { incrementItem, decrementItem, removeItem } = useCart();
  return <article className="cart-line"><div className="cart-line__art"><ProductArtwork product={item.product} sizes="5rem" /></div><div className="cart-line__info"><small>{item.product.brand} · {item.product.category}</small><h3>{item.product.name}</h3><p>{item.variantData.name}</p>{item.variantData.ramGb ? <p>Physical RAM: {item.variantData.ramGb}GB</p> : null}{item.variantData.extendedRamGb ? <p>Extended RAM: Up to {item.variantData.extendedRamGb}GB</p> : null}<p>Storage: {item.variantData.storageGb === 1024 ? "1TB" : `${item.variantData.storageGb}GB`}</p>{item.color ? <p>Color: {item.color.name}</p> : null}<p>{item.fulfillmentMethod === "store_pickup" ? "Store Pickup · Barangay Sabang, Dasmariñas" : "Delivery · fee and timing pending confirmation"}</p><p>Contact us to confirm availability.</p><Link href={`/products/${item.productSlug}`}>View Product</Link></div><div className="cart-line__price"><strong>{money.format(item.variantData.currentPrice)}</strong><div className="cart-quantity"><button aria-label={`Decrease quantity of ${item.product.name}`} onClick={() => decrementItem(item.lineId)} type="button">−</button><span aria-label={`Quantity ${item.quantity}`}>{item.quantity}</span><button aria-label={`Increase quantity of ${item.product.name}`} disabled={item.quantity >= 99} onClick={() => incrementItem(item.lineId)} type="button">+</button></div><span>Line total <strong>{money.format(item.lineTotal)}</strong></span><button aria-label={`Remove ${item.product.name} from cart`} className="cart-remove" onClick={() => removeItem(item.lineId)} type="button">Remove</button></div></article>;
}
