"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { ProductCategory, PrototypeProduct } from "@/data/prototype-products";
import { ProductCard } from "./product-card";

export type PriceFilter =
  | "all"
  | "under-10"
  | "10-20"
  | "20-40"
  | "40-plus";
type PromotionFilter = "all" | "sale" | "new";
type SortOption = "featured" | "price-asc" | "price-desc" | "name" | "brand";
type CatalogExplorerProps = {
  products: readonly PrototypeProduct[];
  fixedCategory?: ProductCategory;
  resultsLabel: string;
  showCategoryFilter?: boolean;
};

const priceOptions: readonly [PriceFilter, string][] = [["all", "All prices"], ["under-10", "Under ₱10,000"], ["10-20", "₱10,000–₱19,999"], ["20-40", "₱20,000–₱39,999"], ["40-plus", "₱40,000 and above"]];
const messengerUrl = "https://www.facebook.com/profile.php?id=100063905416187";

function SelectField({ id, label, value, onChange, children }: { id: string; label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label className="catalog-field" htmlFor={id}><span>{label}</span><select id={id} onChange={(event) => onChange(event.target.value)} value={value}>{children}</select></label>;
}

export function CatalogExplorer({
  products,
  fixedCategory,
  resultsLabel,
  showCategoryFilter = false,
}: CatalogExplorerProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"All" | ProductCategory>(
    fixedCategory ?? "All",
  );
  const [brand, setBrand] = useState("all");
  const [price, setPrice] = useState<PriceFilter>("all");
  const [ram, setRam] = useState("all");
  const [storage, setStorage] = useState("all");
  const [promotion, setPromotion] = useState<PromotionFilter>("all");
  const [financingOnly, setFinancingOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("featured");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const brands = useMemo(() => [...new Set(products.map((product) => product.brand))].sort(), [products]);
  const ramValues = useMemo(() => [...new Set(products.flatMap((product) => product.ramGb === undefined ? [] : [product.ramGb]))].sort((a, b) => a - b), [products]);
  const storageValues = useMemo(() => [...new Set(products.map((product) => product.storageGb))].sort((a, b) => a - b), [products]);

  useEffect(() => {
    if (!showCategoryFilter) return;
    const parameters = new URLSearchParams(window.location.search);
    const requestedBrand = parameters.get("brand");
    const requestedCategory = parameters.get("category");
    const requestedPrice = parameters.get("price");
    const applyUrlFilters = window.setTimeout(() => {
      if (requestedBrand && brands.includes(requestedBrand)) {
        setBrand(requestedBrand);
      }
      if (
        !fixedCategory &&
        (requestedCategory === "Phone" ||
          requestedCategory === "Tablet")
      ) {
        setCategory(requestedCategory);
      }
      if (
        requestedPrice &&
        priceOptions.some(([value]) => value === requestedPrice)
      ) {
        setPrice(requestedPrice as PriceFilter);
      }
    }, 0);

    return () => window.clearTimeout(applyUrlFilters);
  }, [brands, fixedCategory, showCategoryFilter]);

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const matchesPrice = (product: PrototypeProduct) => price === "all" || (price === "under-10" && product.currentPrice < 10000) || (price === "10-20" && product.currentPrice >= 10000 && product.currentPrice < 20000) || (price === "20-40" && product.currentPrice >= 20000 && product.currentPrice < 40000) || (price === "40-plus" && product.currentPrice >= 40000);
    const filtered = products.filter((product) => {
      const searchable = `${product.name} ${product.brand} ${product.variant} ${product.category}`.toLocaleLowerCase();
      return (!normalizedQuery || searchable.includes(normalizedQuery)) && (category === "All" || product.category === category) && (brand === "all" || product.brand === brand) && matchesPrice(product) && (ram === "all" || product.ramGb === Number(ram)) && (storage === "all" || product.storageGb === Number(storage)) && (promotion === "all" || product.badge === promotion) && (!financingOnly || product.financingAvailable);
    });
    return [...filtered].sort((a, b) => sort === "price-asc" ? a.currentPrice - b.currentPrice : sort === "price-desc" ? b.currentPrice - a.currentPrice : sort === "name" ? a.name.localeCompare(b.name) : sort === "brand" ? a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name) : products.indexOf(a) - products.indexOf(b));
  }, [brand, category, financingOnly, price, products, promotion, query, ram, sort, storage]);

  const resetCatalog = () => { setQuery(""); setCategory(fixedCategory ?? "All"); setBrand("all"); setPrice("all"); setRam("all"); setStorage("all"); setPromotion("all"); setFinancingOnly(false); setSort("featured"); };
  const activeFilters = [
    ...(query.trim() ? [{ key: "query", label: `Search: ${query.trim()}`, remove: () => setQuery("") }] : []),
    ...(showCategoryFilter && category !== "All" ? [{ key: "category", label: category === "Phone" ? "Phones" : "Tablets", remove: () => setCategory("All") }] : []),
    ...(brand !== "all" ? [{ key: "brand", label: `Brand: ${brand}`, remove: () => setBrand("all") }] : []),
    ...(price !== "all" ? [{ key: "price", label: priceOptions.find(([key]) => key === price)?.[1] ?? price, remove: () => setPrice("all") }] : []),
    ...(ram !== "all" ? [{ key: "ram", label: `RAM: ${ram}GB`, remove: () => setRam("all") }] : []),
    ...(storage !== "all" ? [{ key: "storage", label: `Storage: ${storage}GB`, remove: () => setStorage("all") }] : []),
    ...(promotion !== "all" ? [{ key: "promotion", label: promotion === "sale" ? "On Sale" : "New Arrivals", remove: () => setPromotion("all") }] : []),
    ...(financingOnly ? [{ key: "financing", label: "Financing available", remove: () => setFinancingOnly(false) }] : []),
  ];
  const noun = visibleProducts.length === 1 ? fixedCategory === "Phone" ? "phone" : fixedCategory === "Tablet" ? "tablet" : "product" : fixedCategory === "Phone" ? "phones" : fixedCategory === "Tablet" ? "tablets" : "products";
  const countText = activeFilters.length ? `${visibleProducts.length} ${noun} ${visibleProducts.length === 1 ? "matches" : "match"} your filters` : `${visibleProducts.length} ${resultsLabel}`;

  return <div className="catalog-explorer">
    <section aria-labelledby="catalog-tools-title" className="catalog-toolbar catalog-toolbar--functional">
      <div className="catalog-search-sort">
        <div className="catalog-search"><label htmlFor="catalog-search">Search products</label><div><input autoComplete="off" id="catalog-search" onChange={(event) => setQuery(event.target.value)} placeholder="Search name, brand, variant, or category" type="search" value={query} />{query ? <button aria-label="Clear product search" onClick={() => setQuery("")} type="button">Clear</button> : null}</div></div>
        <SelectField id="catalog-sort" label="Sort by" onChange={(value) => setSort(value as SortOption)} value={sort}><option value="featured">Featured</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="name">Name: A to Z</option><option value="brand">Brand: A to Z</option></SelectField>
        <button aria-controls="catalog-filter-panel" aria-expanded={filtersOpen} className="catalog-filter-toggle" onClick={() => setFiltersOpen((open) => !open)} type="button">Filters{activeFilters.length ? ` (${activeFilters.length})` : ""}<span aria-hidden="true">⌄</span></button>
      </div>
      <div className={filtersOpen ? "catalog-filter-panel catalog-filter-panel--open" : "catalog-filter-panel"} id="catalog-filter-panel">
        {showCategoryFilter ? <SelectField id="catalog-category" label="Category" onChange={(value) => setCategory(value as "All" | ProductCategory)} value={category}><option value="All">All categories</option><option value="Phone">Phones</option><option value="Tablet">Tablets</option></SelectField> : null}
        <SelectField id="catalog-brand" label="Brand" onChange={setBrand} value={brand}><option value="all">All brands</option>{brands.map((option) => <option key={option} value={option}>{option} ({products.filter((product) => product.brand === option).length})</option>)}</SelectField>
        <SelectField id="catalog-price" label="Price range" onChange={(value) => setPrice(value as PriceFilter)} value={price}>{priceOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
        <SelectField id="catalog-ram" label="RAM" onChange={setRam} value={ram}><option value="all">All confirmed RAM</option>{ramValues.map((value) => <option key={value} value={value}>{value}GB</option>)}</SelectField>
        <SelectField id="catalog-storage" label="Storage" onChange={setStorage} value={storage}><option value="all">All storage</option>{storageValues.map((value) => <option key={value} value={value}>{value}GB</option>)}</SelectField>
        <SelectField id="catalog-promotion" label="Promotion" onChange={(value) => setPromotion(value as PromotionFilter)} value={promotion}><option value="all">All promotions</option><option value="sale">On Sale</option><option value="new">New Arrivals</option></SelectField>
        <label className="catalog-checkbox"><input checked={financingOnly} onChange={(event) => setFinancingOnly(event.target.checked)} type="checkbox" /><span>Financing available</span></label>
        <label className="catalog-field catalog-field--disabled"><span>Network</span><select disabled><option>Coming after verification</option></select></label>
      </div>
    </section>
    <div className="catalog-results-bar">
      <div><p aria-atomic="true" aria-live="polite" className="catalog-result-count">{countText}</p>{activeFilters.length ? <div aria-label="Active filters" className="catalog-filter-chips">{activeFilters.map((filter) => <span className="catalog-filter-chip" key={filter.key}>{filter.label}<button aria-label={`Remove ${filter.label} filter`} onClick={filter.remove} type="button">×</button></span>)}<button className="catalog-clear-all" onClick={resetCatalog} type="button">Clear all</button></div> : null}</div>
      {sort !== "featured" ? <button className="catalog-reset" onClick={resetCatalog} type="button">Reset catalog</button> : null}
    </div>
    {visibleProducts.length ? <div className="product-grid catalog-results-grid grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{visibleProducts.map((product) => <ProductCard key={product.id} layout={product.category === "Tablet" ? "tablet" : "standard"} product={product} />)}</div> : <section className="catalog-empty"><p className="type-eyebrow text-[var(--color-action)]">ZERO RESULTS</p><h2 className="type-h2 mt-4">No upgrades matched those filters.</h2><p className="mt-5 max-w-xl text-[var(--color-muted)]">Try changing your search, brand, price range, RAM, or storage selection.</p><div className="mt-7 flex flex-wrap gap-3"><button className="button-link button-link--primary" onClick={resetCatalog} type="button">Clear Filters</button><a className="button-link product-message-link" href={messengerUrl} rel="noopener noreferrer" target="_blank">Message Us</a></div></section>}
  </div>;
}
