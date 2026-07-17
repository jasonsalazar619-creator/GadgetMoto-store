"use client";

import Link from "next/link";
import { useComparison } from "./comparison-provider";

export function ComparisonCountLink({ mobile = false }: { mobile?: boolean }) {
  const { selectionCount } = useComparison();
  return <Link aria-label={`Compare products${selectionCount ? `, ${selectionCount} selected` : ""}`} className={mobile ? "whitespace-nowrap" : "nav-link comparison-nav-link"} href="/compare">Compare{selectionCount ? <span aria-hidden="true" className="comparison-count">{selectionCount}</span> : null}</Link>;
}
