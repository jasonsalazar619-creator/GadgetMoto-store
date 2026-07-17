"use client";

import Link from "next/link";
import { useState } from "react";
import { useComparison } from "./comparison-provider";

export function ComparisonTray() {
  const { selectedProducts, selectionCount, removeProduct, clearProducts, feedback } = useComparison();
  const [expanded, setExpanded] = useState(false);
  if (!selectionCount) return null;
  return <aside aria-label="Product comparison tray" className="comparison-tray">
    <div className="comparison-tray__bar">
      <div><strong aria-live="polite">{selectionCount} of 3 selected</strong><button aria-controls="comparison-tray-items" aria-expanded={expanded} className="comparison-tray__expand" onClick={() => setExpanded((open) => !open)} type="button">{expanded ? "Hide products" : "Show products"}</button></div>
      <div className="comparison-tray__actions"><button onClick={clearProducts} type="button">Clear All</button><Link href="/compare">Compare Now</Link></div>
    </div>
    <div className={`comparison-tray__items ${expanded ? "comparison-tray__items--open" : ""}`} id="comparison-tray-items">{selectedProducts.map((product) => <div className="comparison-tray__item" key={product.slug}><span><strong>{product.name}</strong><small>{product.category}</small></span><button aria-label={`Remove ${product.name} from comparison`} onClick={() => removeProduct(product.slug)} type="button">×</button></div>)}</div>
    {feedback ? <p className="comparison-tray__feedback" role="alert">{feedback}</p> : null}
  </aside>;
}
