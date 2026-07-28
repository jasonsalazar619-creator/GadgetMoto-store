import Link from "next/link";

const budgets = [
  ["Under ₱10,000", "Essential picks", "under-10"],
  ["₱10,000–₱20,000", "Everyday upgrades", "10-20"],
  ["₱20,000–₱40,000", "Power meets value", "20-40"],
  ["Flagship Picks", "Premium technology", "40-plus"],
] as const;

export function BudgetGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {budgets.map(([title, label, price], index) => (
        <Link
          aria-label={`Shop ${title}`}
          className="budget-tile"
          href={`/shop?price=${price}`}
          key={title}
        >
          <span aria-hidden="true" className="budget-tile__orb" />
          <span className="type-eyebrow text-[var(--color-action)]">0{index + 1}</span>
          <span className="mt-8 font-[family-name:var(--font-heading)] text-2xl font-bold tracking-tight">{title}</span>
          <span className="mt-2 text-sm text-[var(--color-muted)]">{label}</span>
          <span aria-hidden="true" className="mt-auto pt-6 text-3xl text-[var(--color-action)]">↗</span>
        </Link>
      ))}
    </div>
  );
}
