"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { PrototypeProduct } from "@/data/prototype-products";
import { useCatalog } from "@/components/catalog/catalog-provider";

const storageKey = "gadgetmoto:compare:v1";
const maxProducts = 3;

type SelectionAction =
  | { type: "add"; slug: string }
  | { type: "remove"; slug: string }
  | { type: "clear" };

function applySelectionAction(current: string[], action: SelectionAction, validSlugs: ReadonlySet<string>) {
  if (action.type === "clear") return [];
  if (action.type === "remove") return current.filter((slug) => slug !== action.slug);
  if (!validSlugs.has(action.slug) || current.includes(action.slug) || current.length >= maxProducts) return current;
  return [...current, action.slug];
}

type ComparisonContextValue = {
  selectedSlugs: readonly string[];
  selectedProducts: readonly PrototypeProduct[];
  selectionCount: number;
  canAddMore: boolean;
  feedback: string;
  isSelected: (slug: string) => boolean;
  addProduct: (slug: string) => void;
  removeProduct: (slug: string) => void;
  toggleProduct: (slug: string) => void;
  clearProducts: () => void;
};

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const { products, productsBySlugs } = useCatalog();
  const validSlugs = useMemo(
    () => new Set(products.map((product) => product.slug)),
    [products],
  );
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [feedback, setFeedback] = useState("");
  const hydratedRef = useRef(false);
  const pendingActionsRef = useRef<SelectionAction[]>([]);

  const dispatchSelection = useCallback((action: SelectionAction) => {
    if (!hydratedRef.current) pendingActionsRef.current.push(action);
    setSelectedSlugs((current) => applySelectionAction(current, action, validSlugs));
  }, [validSlugs]);

  useEffect(() => {
    const restore = window.setTimeout(() => {
      try {
        const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "[]");
        const validated = Array.isArray(stored) ? [...new Set(stored.filter((slug): slug is string => typeof slug === "string" && validSlugs.has(slug)))].slice(0, maxProducts) : [];
        setSelectedSlugs(
          pendingActionsRef.current.reduce(
            (current, action) =>
              applySelectionAction(current, action, validSlugs),
            validated,
          ),
        );
      } catch {
        // Comparison remains available for this session when storage is unavailable or invalid.
      }
      pendingActionsRef.current = [];
      hydratedRef.current = true;
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(restore);
  }, [validSlugs]);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(storageKey, JSON.stringify(selectedSlugs)); } catch { /* Session state still works. */ }
  }, [hydrated, selectedSlugs]);

  const value = useMemo<ComparisonContextValue>(() => {
    const isSelected = (slug: string) => selectedSlugs.includes(slug);
    const removeProduct = (slug: string) => { dispatchSelection({ type: "remove", slug }); setFeedback(""); };
    const addProduct = (slug: string) => {
      if (!validSlugs.has(slug) || selectedSlugs.includes(slug)) return;
      if (selectedSlugs.length >= maxProducts) { setFeedback("You can compare up to three products. Remove one before adding another."); return; }
      dispatchSelection({ type: "add", slug }); setFeedback("");
    };
    const toggleProduct = (slug: string) => isSelected(slug) ? removeProduct(slug) : addProduct(slug);
    return { selectedSlugs, selectedProducts: productsBySlugs(selectedSlugs), selectionCount: selectedSlugs.length, canAddMore: selectedSlugs.length < maxProducts, feedback, isSelected, addProduct, removeProduct, toggleProduct, clearProducts: () => { dispatchSelection({ type: "clear" }); setFeedback(""); } };
  }, [dispatchSelection, feedback, productsBySlugs, selectedSlugs, validSlugs]);

  return <ComparisonContext.Provider value={value}>{children}</ComparisonContext.Provider>;
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) throw new Error("useComparison must be used within ComparisonProvider");
  return context;
}
