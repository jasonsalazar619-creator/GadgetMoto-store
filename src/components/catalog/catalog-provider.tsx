"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { PrototypeProduct } from "@/data/prototype-products";

type CatalogContextValue = {
  products: readonly PrototypeProduct[];
  productBySlug: (slug: string) => PrototypeProduct | undefined;
  productsBySlugs: (slugs: readonly string[]) => readonly PrototypeProduct[];
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({
  children,
  products,
}: {
  children: ReactNode;
  products: readonly PrototypeProduct[];
}) {
  const productMap = useMemo(
    () => new Map(products.map((product) => [product.slug, product])),
    [products],
  );
  const productBySlug = useCallback(
    (slug: string) => productMap.get(slug),
    [productMap],
  );
  const productsBySlugs = useCallback(
    (slugs: readonly string[]) =>
      slugs.flatMap((slug) => {
        const product = productMap.get(slug);
        return product ? [product] : [];
      }),
    [productMap],
  );
  const value = useMemo<CatalogContextValue>(
    () => ({ products, productBySlug, productsBySlugs }),
    [productBySlug, products, productsBySlugs],
  );

  return (
    <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error("useCatalog must be used within CatalogProvider");
  }
  return context;
}
