"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { PrototypeProduct } from "@/data/prototype-products";
import { SearchResultItem } from "./search-result-item";

const messengerUrl = "https://www.facebook.com/profile.php?id=100063905416187";
const resultLimit = 6;

type SearchContextValue = { openSearch: (trigger?: HTMLElement | null) => void };
const SearchContext = createContext<SearchContextValue | null>(null);

function scoreProduct(product: PrototypeProduct, query: string) {
  const name = product.name.toLocaleLowerCase();
  const brand = product.brand.toLocaleLowerCase();
  const variant = product.variant.toLocaleLowerCase();
  const category = product.category.toLocaleLowerCase();
  if (name.startsWith(query)) return 0;
  if (brand.startsWith(query)) return 1;
  if (name.includes(query)) return 2;
  if (brand.includes(query)) return 3;
  if (variant.includes(query) || category.includes(query)) return 4;
  return null;
}

export function GlobalSearchProvider({ children, products }: { children: ReactNode; products: readonly PrototypeProduct[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return [];
    return products
      .map((product, index) => ({ product, index, score: scoreProduct(product, normalized) }))
      .filter((entry): entry is { product: PrototypeProduct; index: number; score: number } => entry.score !== null)
      .sort((a, b) => a.score - b.score || a.index - b.index)
      .slice(0, resultLimit)
      .map(({ product }) => product);
  }, [products, query]);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }, []);

  const openSearch = useCallback((trigger?: HTMLElement | null) => {
    returnFocusRef.current = trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setOpen(true);
  }, []);

  const navigate = useCallback((href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  }, [router]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    inputRef.current?.focus();
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeSearch(); return; }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener("keydown", onKeyDown); };
  }, [closeSearch, open]);

  useEffect(() => {
    const onShortcut = (event: globalThis.KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLocaleLowerCase() !== "k") return;
      const target = event.target;
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || (target instanceof HTMLElement && target.isContentEditable)) return;
      event.preventDefault();
      openSearch();
    };
    document.addEventListener("keydown", onShortcut);
    return () => document.removeEventListener("keydown", onShortcut);
  }, [openSearch]);

  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!results.length) return;
    if (event.key === "ArrowDown") { event.preventDefault(); setActiveIndex((index) => (index + 1) % results.length); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActiveIndex((index) => (index - 1 + results.length) % results.length); }
    else if (event.key === "Enter") { event.preventDefault(); navigate(`/products/${results[activeIndex]?.slug}`); }
  };

  return <SearchContext.Provider value={{ openSearch }}>
    {children}
    {open ? <div className="global-search-backdrop" onClick={closeSearch}>
      <div aria-labelledby="global-search-title" aria-modal="true" className="global-search-panel" onClick={(event) => event.stopPropagation()} ref={panelRef} role="dialog">
        <div className="global-search-heading"><div><p className="type-eyebrow text-[var(--color-action)]">GLOBAL PRODUCT SEARCH</p><h2 id="global-search-title">Find your next upgrade.</h2></div><button aria-label="Close product search" className="global-search-close" onClick={closeSearch} type="button">Close <span aria-hidden="true">×</span></button></div>
        <label className="global-search-field" htmlFor="global-product-search"><span className="sr-only">Search GadgetMoTo products</span><span aria-hidden="true" className="global-search-icon">⌕</span><input aria-activedescendant={results.length ? `global-search-result-${results[activeIndex]?.slug}` : undefined} aria-autocomplete="list" aria-controls="global-search-results" aria-expanded={results.length > 0} autoComplete="off" id="global-product-search" onChange={(event) => { setQuery(event.target.value); setActiveIndex(0); }} onKeyDown={onInputKeyDown} placeholder="Search phones, tablets, brands, or storage" ref={inputRef} role="combobox" type="search" value={query} />{query ? <button aria-label="Clear search query" onClick={() => { setQuery(""); setActiveIndex(0); inputRef.current?.focus(); }} type="button">Clear</button> : <kbd>Ctrl K</kbd>}</label>
        <p aria-atomic="true" aria-live="polite" className="sr-only">{query.trim() ? `${results.length} search ${results.length === 1 ? "result" : "results"}` : "Trending searches shown"}</p>
        {!query.trim() ? <section className="global-search-trending"><h3>Trending searches</h3><p>Curated launch suggestions</p><div>{["Xiaomi", "POCO", "iPhone", "512GB"].map((item) => <button key={item} onClick={() => { setQuery(item); setActiveIndex(0); inputRef.current?.focus(); }} type="button">{item}</button>)}<button onClick={() => navigate("/shop")} type="button">Phones under ₱10,000</button><button onClick={() => navigate("/tablets")} type="button">Tablets</button></div><small>Catalog-filter URL sharing will be added later.</small></section> : results.length ? <div className="global-search-results" id="global-search-results" role="listbox">{results.map((product, index) => <SearchResultItem active={index === activeIndex} key={product.slug} onHover={() => setActiveIndex(index)} onNavigate={closeSearch} product={product} />)}</div> : <section className="global-search-empty"><h3>No products matched that search.</h3><p>Try a brand, product name, storage variant, or browse the full GadgetMoTo catalog.</p><div><button onClick={() => navigate("/shop")} type="button">Browse All Products</button><a href={messengerUrl} rel="noopener noreferrer" target="_blank">Facebook Messenger</a></div></section>}
      </div>
    </div> : null}
  </SearchContext.Provider>;
}

export function useGlobalSearch() {
  const context = useContext(SearchContext);
  if (!context) throw new Error("useGlobalSearch must be used within GlobalSearchProvider");
  return context;
}
