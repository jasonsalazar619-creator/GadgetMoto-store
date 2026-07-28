import Link from "next/link";

const brands = [
  "Xiaomi",
  "Apple",
  "POCO",
  "Redmi",
  "Infinix",
  "TECNO",
] as const;

export function BrandGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {brands.map((brand) => (
        <Link
          aria-label={`Shop ${brand} products`}
          className="brand-tile"
          href={`/shop?brand=${encodeURIComponent(brand)}`}
          key={brand}
        >
          <span>{brand}</span>
          <span aria-hidden="true">↗</span>
        </Link>
      ))}
    </div>
  );
}
