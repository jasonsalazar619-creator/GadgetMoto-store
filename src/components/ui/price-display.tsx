type PriceDisplayProps = {
  className?: string;
  currentPrice: number;
  originalPrice?: number;
  vatExclusive?: boolean;
  label?: string;
};

const pesoFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

export function PriceDisplay({
  className = "",
  currentPrice,
  originalPrice,
  vatExclusive = false,
  label,
}: PriceDisplayProps) {
  return (
    <div className={className}>
      {label ? <p className="mb-1 text-sm text-[var(--color-muted)]">{label}</p> : null}
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-[family-name:var(--font-heading)] text-2xl font-bold tracking-tight text-[var(--color-ink)]">
          {pesoFormatter.format(currentPrice)}
        </span>
        {originalPrice && originalPrice > currentPrice ? (
          <del className="text-sm text-[var(--color-muted)]">
            <span className="sr-only">Original price: </span>
            {pesoFormatter.format(originalPrice)}
          </del>
        ) : null}
      </div>
      {vatExclusive ? (
        <p className="mt-1 text-xs text-[var(--color-muted)]">VAT exclusive</p>
      ) : null}
    </div>
  );
}
