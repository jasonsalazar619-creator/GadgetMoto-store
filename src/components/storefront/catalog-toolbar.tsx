const controls = ["Search products", "Category", "Brand", "Price range", "RAM", "Storage", "4G or 5G", "On Sale", "New Arrivals", "Financing Available"] as const;

export function CatalogToolbar({ compact = false }: { compact?: boolean }) {
  const visible = compact ? controls.slice(1, 6) : controls;
  return (
    <section aria-labelledby="catalog-tools-title" className="catalog-toolbar">
      <div>
        <p className="type-eyebrow text-[var(--color-action)]">Filter preview</p>
        <h2 className="mt-2 font-[family-name:var(--font-heading)] text-xl font-bold" id="catalog-tools-title">Explore the catalog</h2>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Live filtering will be connected in a later development phase.</p>
      </div>
      <div className="catalog-toolbar__controls" aria-label="Catalog filter previews">
        {visible.map((control) => <button className="catalog-preview-control" disabled key={control} type="button">{control}<span aria-hidden="true">⌄</span></button>)}
      </div>
    </section>
  );
}
