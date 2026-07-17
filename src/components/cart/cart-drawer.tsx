"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useCart } from "./cart-provider";
import { CartLineItem } from "./cart-line-item";
const money = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });

export function CartDrawer() {
  const { isCartOpen, closeCart, items, itemCount, subtotal, clearCart } = useCart();
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => { if (!isCartOpen) return; const old = document.body.style.overflow; document.body.style.overflow = "hidden"; panelRef.current?.querySelector<HTMLElement>("button")?.focus(); const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); closeCart(); return; } if (event.key !== "Tab" || !panelRef.current) return; const controls = [...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')]; if (!controls.length) return; const first = controls[0]; const last = controls[controls.length - 1]; if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }; document.addEventListener("keydown", onKey); return () => { document.body.style.overflow = old; document.removeEventListener("keydown", onKey); }; }, [closeCart, isCartOpen]);
  if (!isCartOpen) return null;
  return <div className="cart-backdrop" onClick={closeCart}><aside aria-labelledby="cart-drawer-title" aria-modal="true" className="cart-drawer" onClick={(event) => event.stopPropagation()} ref={panelRef} role="dialog"><header><div><p className="type-eyebrow text-[var(--color-action)]">YOUR GADGETMOTO CART</p><h2 id="cart-drawer-title">Cart <span>({itemCount})</span></h2></div><button aria-label="Close cart drawer" onClick={closeCart} type="button">Close ×</button></header>{items.length ? <><div className="cart-drawer__items">{items.map((item) => <CartLineItem item={item} key={item.lineId} />)}</div><footer><div><span>Current merchandise subtotal</span><strong>{money.format(subtotal)}</strong></div><p>Final availability, VAT, delivery fees, and payment details will be confirmed before payment.</p><div><Link href="/cart" onClick={closeCart}>View Cart</Link><button onClick={closeCart} type="button">Continue Shopping</button><button className="cart-clear" onClick={clearCart} type="button">Clear Cart</button></div></footer></> : <div className="cart-empty"><h3>Your cart is ready for an upgrade.</h3><p>Browse GadgetMoTo phones and tablets and add the devices you want to order.</p><Link href="/shop" onClick={closeCart}>Shop All Products</Link><Link href="/phones" onClick={closeCart}>Browse Phones</Link><Link href="/tablets" onClick={closeCart}>Browse Tablets</Link></div>}</aside></div>;
}
