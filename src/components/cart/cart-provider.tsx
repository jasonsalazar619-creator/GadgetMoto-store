"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useCatalog } from "@/components/catalog/catalog-provider";
import type {
  ProductColor,
  PrototypeProduct,
} from "@/data/prototype-products";

const storageKey = "gadgetmoto:cart:v1";
const maxQuantity = 99;
export const modalEvent = "gadgetmoto:modal-open";

export type CartLine = Readonly<{
  lineId: string;
  productSlug: string;
  variant: string;
  colorId?: string;
  quantity: number;
}>;

export type ResolvedCartLine = CartLine &
  Readonly<{
    product: PrototypeProduct;
    color: ProductColor | null;
    lineTotal: number;
  }>;

type CartAction =
  | Readonly<{
      type: "add";
      productSlug: string;
      variant: string;
      colorId?: string;
    }>
  | Readonly<{ type: "remove"; lineId: string }>
  | Readonly<{ type: "set"; lineId: string; quantity: number }>
  | Readonly<{ type: "clear" }>;

const normalizeLineSegment = (value: string): string =>
  value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const makeLineId = (
  slug: string,
  variant: string,
  colorId?: string,
): string =>
  [slug, normalizeLineSegment(variant), colorId ?? "no-color"].join("::");

function applyCartAction(
  lines: readonly CartLine[],
  action: CartAction,
): CartLine[] {
  if (action.type === "clear") return [];
  if (action.type === "remove") {
    return lines.filter((line) => line.lineId !== action.lineId);
  }
  if (action.type === "set") {
    if (action.quantity < 1) {
      return lines.filter((line) => line.lineId !== action.lineId);
    }
    return lines.map((line) =>
      line.lineId === action.lineId
        ? {
            ...line,
            quantity: Math.min(maxQuantity, Math.floor(action.quantity)),
          }
        : line,
    );
  }

  const lineId = makeLineId(
    action.productSlug,
    action.variant,
    action.colorId,
  );
  const existing = lines.find((line) => line.lineId === lineId);
  if (existing) {
    return lines.map((line) =>
      line.lineId === lineId
        ? { ...line, quantity: Math.min(maxQuantity, line.quantity + 1) }
        : line,
    );
  }
  return [
    ...lines,
    {
      lineId,
      productSlug: action.productSlug,
      variant: action.variant,
      ...(action.colorId ? { colorId: action.colorId } : {}),
      quantity: 1,
    },
  ];
}

type CartContextValue = Readonly<{
  items: readonly ResolvedCartLine[];
  itemCount: number;
  uniqueItemCount: number;
  subtotal: number;
  isCartOpen: boolean;
  announcement: string;
  openCart: (trigger?: HTMLElement | null) => void;
  closeCart: () => void;
  toggleCart: (trigger?: HTMLElement | null) => void;
  addItem: (productSlug: string, variant: string, colorId?: string) => void;
  removeItem: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  incrementItem: (lineId: string) => void;
  decrementItem: (lineId: string) => void;
  clearCart: () => void;
  getItemQuantity: (
    productSlug: string,
    variant: string,
    colorId?: string,
  ) => number;
}>;

const CartContext = createContext<CartContextValue | null>(null);

const resolveColor = (
  product: PrototypeProduct,
  colorId: unknown,
): ProductColor | null | undefined => {
  const colors = product.colors ?? [];
  if (!colors.length) return colorId === undefined ? null : undefined;
  if (typeof colorId !== "string") return undefined;
  return colors.find((color) => color.id === colorId);
};

export function CartProvider({ children }: { children: ReactNode }) {
  const { productBySlug } = useCatalog();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isCartOpen, setCartOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const hydratedRef = useRef(false);
  const pendingRef = useRef<CartAction[]>([]);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const dispatch = (action: CartAction) => {
    if (!hydratedRef.current) pendingRef.current.push(action);
    setLines((current) => applyCartAction(current, action));
  };
  const closeCart = useCallback(() => {
    setCartOpen(false);
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }, []);
  const openCart = useCallback((trigger?: HTMLElement | null) => {
    returnFocusRef.current =
      trigger ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null);
    window.dispatchEvent(new CustomEvent(modalEvent, { detail: "cart" }));
    setCartOpen(true);
  }, []);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      let restored: CartLine[] = [];
      try {
        const stored: unknown = JSON.parse(
          localStorage.getItem(storageKey) ?? "[]",
        );
        if (Array.isArray(stored)) {
          const deduped = new Map<string, CartLine>();
          for (const value of stored) {
            if (!value || typeof value !== "object") continue;
            const line = value as Partial<CartLine>;
            const product =
              typeof line.productSlug === "string"
                ? productBySlug(line.productSlug)
                : undefined;
            const color = product
              ? resolveColor(product, line.colorId)
              : undefined;
            if (
              !product ||
              line.variant !== product.variant ||
              color === undefined ||
              typeof line.quantity !== "number" ||
              !Number.isFinite(line.quantity)
            ) {
              continue;
            }
            const lineId = makeLineId(
              product.slug,
              product.variant,
              color?.id,
            );
            const quantity = Math.min(
              maxQuantity,
              Math.max(1, Math.floor(line.quantity)),
            );
            deduped.set(lineId, {
              lineId,
              productSlug: product.slug,
              variant: product.variant,
              ...(color ? { colorId: color.id } : {}),
              quantity: Math.min(
                maxQuantity,
                (deduped.get(lineId)?.quantity ?? 0) + quantity,
              ),
            });
          }
          restored = [...deduped.values()];
        }
      } catch {
        // The in-memory session cart remains available when storage is blocked.
      }
      setLines(pendingRef.current.reduce(applyCartAction, restored));
      pendingRef.current = [];
      hydratedRef.current = true;
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, [productBySlug]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(lines));
    } catch {
      // The in-memory session cart remains available when storage is blocked.
    }
  }, [hydrated, lines]);

  useEffect(() => {
    const closeForSearch = (event: Event) => {
      if ((event as CustomEvent).detail === "search") setCartOpen(false);
    };
    window.addEventListener(modalEvent, closeForSearch);
    return () => window.removeEventListener(modalEvent, closeForSearch);
  }, []);

  const items = lines.flatMap((line): readonly ResolvedCartLine[] => {
    const product = productBySlug(line.productSlug);
    const color = product ? resolveColor(product, line.colorId) : undefined;
    if (!product || product.variant !== line.variant || color === undefined) {
      return [];
    }
    return [
      {
        ...line,
        product,
        color,
        lineTotal: product.currentPrice * line.quantity,
      },
    ];
  });
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const value: CartContextValue = {
    items,
    itemCount,
    uniqueItemCount: items.length,
    subtotal: items.reduce((sum, item) => sum + item.lineTotal, 0),
    isCartOpen,
    announcement,
    openCart,
    closeCart,
    toggleCart: (trigger) =>
      isCartOpen ? closeCart() : openCart(trigger),
    addItem: (productSlug, variant, colorId) => {
      const product = productBySlug(productSlug);
      const color = product ? resolveColor(product, colorId) : undefined;
      if (!product || product.variant !== variant || color === undefined) {
        return;
      }
      dispatch({
        type: "add",
        productSlug,
        variant,
        ...(color ? { colorId: color.id } : {}),
      });
      setAnnouncement(
        `${product.name}${color ? ` in ${color.name}` : ""} added to cart.`,
      );
      openCart();
    },
    removeItem: (lineId) => {
      const item = items.find((line) => line.lineId === lineId);
      dispatch({ type: "remove", lineId });
      setAnnouncement(
        item ? `${item.product.name} removed from cart.` : "Item removed from cart.",
      );
    },
    setQuantity: (lineId, quantity) =>
      dispatch({ type: "set", lineId, quantity }),
    incrementItem: (lineId) => {
      const item = items.find((line) => line.lineId === lineId);
      if (item) {
        dispatch({ type: "set", lineId, quantity: item.quantity + 1 });
      }
    },
    decrementItem: (lineId) => {
      const item = items.find((line) => line.lineId === lineId);
      if (item) {
        dispatch({ type: "set", lineId, quantity: item.quantity - 1 });
      }
    },
    clearCart: () => {
      dispatch({ type: "clear" });
      setAnnouncement("Cart cleared.");
    },
    getItemQuantity: (productSlug, variant, colorId) =>
      lines.find(
        (line) =>
          line.lineId === makeLineId(productSlug, variant, colorId),
      )?.quantity ?? 0,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <span aria-atomic="true" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
