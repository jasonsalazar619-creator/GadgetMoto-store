"use client";

import { useComparison } from "./comparison-provider";

export function ComparisonButton({ slug, name, className = "", compact = false }: { slug: string; name: string; className?: string; compact?: boolean }) {
  const { isSelected, toggleProduct, canAddMore } = useComparison();
  const selected = isSelected(slug);
  const disabled = !selected && !canAddMore;
  return <button aria-label={`${selected ? "Remove" : "Add"} ${name} ${selected ? "from" : "to"} comparison`} aria-pressed={selected} className={`${className} ${selected ? "comparison-control--selected" : ""} ${disabled ? "comparison-control--limit" : ""}`.trim()} onClick={() => toggleProduct(slug)} title={disabled ? "Comparison limit reached" : undefined} type="button">{compact ? <><span aria-hidden="true">⇄</span><span className="sr-only">{selected ? "Selected" : "Compare"}</span></> : selected ? "Remove from comparison" : "Compare product"}</button>;
}
