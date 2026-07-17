"use client";

import Link from "next/link";
import { useComparison } from "./comparison-provider";

const messengerUrl = "https://www.facebook.com/profile.php?id=100063905416187";
const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 });
const paymentMethods = "Maya online payment; Cash on store pickup; Manual bank or e-wallet transfer; Financing assistance through the sales team";
const deliveryOptions = "Nationwide delivery; Same-day delivery where available; Store pickup in Cavite City. Details confirmed by the sales team.";

export function ComparisonPageContent() {
  const { selectedProducts, selectionCount, removeProduct, clearProducts } = useComparison();
  if (!selectionCount) return <section className="comparison-empty"><p className="type-eyebrow text-[var(--color-action)]">PRODUCT COMPARISON</p><h1 className="type-h1 mt-5">Choose products to compare.</h1><p className="type-body-lg mt-6 text-[var(--color-muted)]">Add up to three phones or tablets from the GadgetMoTo catalog.</p><div className="mt-8 flex flex-wrap gap-3"><Link className="button-link button-link--primary" href="/shop">Browse All Products</Link><Link className="button-link button-link--secondary" href="/phones">Browse Phones</Link><Link className="button-link button-link--secondary" href="/tablets">Browse Tablets</Link></div></section>;

  const rows = [
    ["Brand", (index: number) => selectedProducts[index]?.brand],
    ["Category", (index: number) => selectedProducts[index]?.category],
    ["Variant", (index: number) => selectedProducts[index]?.variant],
    ["Confirmed RAM", (index: number) => selectedProducts[index]?.ramGb ? `${selectedProducts[index].ramGb}GB` : "Not confirmed"],
    ["Storage", (index: number) => `${selectedProducts[index]?.storageGb}GB`],
    ["Current price", (index: number) => peso.format(selectedProducts[index].currentPrice)],
    ["Verified SRP", (index: number) => selectedProducts[index]?.srp ? peso.format(selectedProducts[index].srp) : "Not provided"],
    ["Savings", (index: number) => selectedProducts[index]?.srp ? peso.format(selectedProducts[index].srp - selectedProducts[index].currentPrice) : "Not available"],
    ["Condition", (index: number) => selectedProducts[index]?.condition],
    ["Promotion", (index: number) => selectedProducts[index]?.badge === "sale" ? "Sale" : selectedProducts[index]?.badge === "new" ? "New" : "None"],
    ["Financing", (index: number) => selectedProducts[index]?.financingAvailable ? "Available through the sales team" : "Not available"],
    ["Store payment options", () => paymentMethods],
    ["Store delivery options", () => deliveryOptions],
  ] as const;

  return <section><div className="comparison-page-heading"><div><p className="type-eyebrow text-[var(--color-action)]">PRODUCT COMPARISON</p><h1 className="type-h1 mt-5">Compare your selected upgrades.</h1><p className="mt-5 max-w-3xl text-[var(--color-muted)]">Side-by-side details use confirmed product and store-level information only.</p></div><button className="comparison-clear" onClick={clearProducts} type="button">Clear Comparison</button></div>
    {selectionCount === 1 ? <p className="comparison-guidance">Add at least one more product to compare side by side.</p> : null}
    <div className="comparison-table-scroll"><table className="comparison-table"><thead><tr><th scope="col">Criteria</th>{selectedProducts.map((product) => <th key={product.slug} scope="col"><strong>{product.name}</strong><span>{product.category}</span><div><Link href={`/products/${product.slug}`}>View Product</Link><a href={messengerUrl} rel="noopener noreferrer" target="_blank">Message Us</a><button aria-label={`Remove ${product.name} from comparison`} onClick={() => removeProduct(product.slug)} type="button">Remove</button></div></th>)}{Array.from({ length: 3 - selectionCount }, (_, index) => <th className="comparison-empty-column" key={`empty-${index}`} scope="col"><span>Empty comparison slot</span><Link href="/shop">Add a product</Link></th>)}</tr></thead><tbody>{rows.map(([label, getValue]) => <tr key={label}><th scope="row">{label}</th>{selectedProducts.map((product, index) => <td key={product.slug}>{getValue(index)}</td>)}{Array.from({ length: 3 - selectionCount }, (_, index) => <td key={`empty-${index}`}>—</td>)}</tr>)}</tbody></table></div>
    {selectionCount < 3 ? <Link className="button-link button-link--primary mt-8" href="/shop">Add Another Product</Link> : null}</section>;
}
