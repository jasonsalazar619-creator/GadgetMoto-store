const brands = ["Xiaomi", "POCO", "Apple", "Infinix", "TECNO", "Vivo", "Oppo", "Itel", "Nubia", "OnePlus", "Samsung", "iQOO"] as const;

export function BrandGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {brands.map((brand) => (
        <button className="brand-tile" key={brand} type="button"><span>{brand}</span><span aria-hidden="true">↗</span></button>
      ))}
    </div>
  );
}
