"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { PrototypeProduct } from "@/data/prototype-products";
import { useCatalog } from "@/components/catalog/catalog-provider";

const storageKey = "gadgetmoto:cart:v1";
const maxQuantity = 99;
export const modalEvent = "gadgetmoto:modal-open";

export type CartLine = { lineId: string; productSlug: string; variant: string; quantity: number };
export type ResolvedCartLine = CartLine & { product: PrototypeProduct; lineTotal: number };
type CartAction = { type: "add"; productSlug: string; variant: string } | { type: "remove"; lineId: string } | { type: "set"; lineId: string; quantity: number } | { type: "clear" };

const makeLineId = (slug: string, variant: string) => `${slug}::${variant.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;

function applyCartAction(lines: CartLine[], action: CartAction) {
  if (action.type === "clear") return [];
  if (action.type === "remove") return lines.filter((line) => line.lineId !== action.lineId);
  if (action.type === "set") return action.quantity < 1 ? lines.filter((line) => line.lineId !== action.lineId) : lines.map((line) => line.lineId === action.lineId ? { ...line, quantity: Math.min(maxQuantity, Math.floor(action.quantity)) } : line);
  const lineId = makeLineId(action.productSlug, action.variant);
  const existing = lines.find((line) => line.lineId === lineId);
  return existing ? lines.map((line) => line.lineId === lineId ? { ...line, quantity: Math.min(maxQuantity, line.quantity + 1) } : line) : [...lines, { lineId, productSlug: action.productSlug, variant: action.variant, quantity: 1 }];
}

type CartContextValue = {
  items: readonly ResolvedCartLine[]; itemCount: number; uniqueItemCount: number; subtotal: number; isCartOpen: boolean; announcement: string;
  openCart: (trigger?: HTMLElement | null) => void; closeCart: () => void; toggleCart: (trigger?: HTMLElement | null) => void;
  addItem: (productSlug: string, variant: string) => void; removeItem: (lineId: string) => void; setQuantity: (lineId: string, quantity: number) => void;
  incrementItem: (lineId: string) => void; decrementItem: (lineId: string) => void; clearCart: () => void; getItemQuantity: (productSlug: string, variant: string) => number;
};
const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { productBySlug } = useCatalog();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const hydratedRef = useRef(false);
  const pendingRef = useRef<CartAction[]>([]);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const dispatch = (action: CartAction) => { if (!hydratedRef.current) pendingRef.current.push(action); setLines((current) => applyCartAction(current, action)); };
  const closeCart = useCallback(() => { setCartOpen(false); window.setTimeout(() => returnFocusRef.current?.focus(), 0); }, []);
  const openCart = useCallback((trigger?: HTMLElement | null) => { returnFocusRef.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null); window.dispatchEvent(new CustomEvent(modalEvent, { detail: "cart" })); setCartOpen(true); }, []);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      let restored: CartLine[] = [];
      try {
        const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
        if (Array.isArray(stored)) {
          const deduped = new Map<string, CartLine>();
          for (const value of stored) {
            if (!value || typeof value !== "object") continue;
            const line = value as Partial<CartLine>;
            const product = typeof line.productSlug === "string" ? productBySlug(line.productSlug) : undefined;
            if (!product || line.variant !== product.variant || typeof line.quantity !== "number" || !Number.isFinite(line.quantity)) continue;
            const lineId = makeLineId(product.slug, product.variant);
            const quantity = Math.min(maxQuantity, Math.max(1, Math.floor(line.quantity)));
            deduped.set(lineId, { lineId, productSlug: product.slug, variant: product.variant, quantity: Math.min(maxQuantity, (deduped.get(lineId)?.quantity ?? 0) + quantity) });
          }
          restored = [...deduped.values()];
        }
      } catch { /* Session cart remains available. */ }
      setLines(pendingRef.current.reduce(applyCartAction, restored)); pendingRef.current = []; hydratedRef.current = true; setHydrated(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, [productBySlug]);

  useEffect(() => { if (!hydrated) return; try { localStorage.setItem(storageKey, JSON.stringify(lines)); } catch { /* Session state still works. */ } }, [hydrated, lines]);
  useEffect(() => { const closeForSearch = (event: Event) => { if ((event as CustomEvent).detail === "search") setCartOpen(false); }; window.addEventListener(modalEvent, closeForSearch); return () => window.removeEventListener(modalEvent, closeForSearch); }, []);

  const items = lines.flatMap((line) => { const product = productBySlug(line.productSlug); return product && product.variant === line.variant ? [{ ...line, product, lineTotal: product.currentPrice * line.quantity }] : []; });
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const value: CartContextValue = { items, itemCount, uniqueItemCount: items.length, subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0), isCartOpen, announcement,
    openCart, closeCart, toggleCart: (trigger) => isCartOpen ? closeCart() : openCart(trigger),
    addItem: (productSlug, variant) => { const product = productBySlug(productSlug); if (!product || product.variant !== variant) return; dispatch({ type: "add", productSlug, variant }); setAnnouncement(`${product.name} added to cart.`); openCart(); },
    removeItem: (lineId) => { const item = items.find((line) => line.lineId === lineId); dispatch({ type: "remove", lineId }); setAnnouncement(item ? `${item.product.name} removed from cart.` : "Item removed from cart."); },
    setQuantity: (lineId, quantity) => dispatch({ type: "set", lineId, quantity }), incrementItem: (lineId) => { const item = items.find((line) => line.lineId === lineId); if (item) dispatch({ type: "set", lineId, quantity: item.quantity + 1 }); },
    decrementItem: (lineId) => { const item = items.find((line) => line.lineId === lineId); if (item) dispatch({ type: "set", lineId, quantity: item.quantity - 1 }); }, clearCart: () => { dispatch({ type: "clear" }); setAnnouncement("Cart cleared."); },
    getItemQuantity: (productSlug, variant) => lines.find((line) => line.lineId === makeLineId(productSlug, variant))?.quantity ?? 0 };
  return <CartContext.Provider value={value}>{children}<span aria-atomic="true" aria-live="polite" className="sr-only">{announcement}</span></CartContext.Provider>;
}

export function useCart() { const context = useContext(CartContext); if (!context) throw new Error("useCart must be used within CartProvider"); return context; }
