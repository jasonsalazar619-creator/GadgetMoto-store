"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import {
  deleteProductColor,
  saveProductColor,
  saveProductVariant,
  setDefaultProductVariant,
} from "@/app/admin/(protected)/products/actions";
import type {
  AdminProductColor,
  AdminProductEditorData,
  AdminProductVariant,
} from "@/lib/admin/products/types";

type Feedback = { tone: "success" | "error"; message: string } | null;

function pesos(centavos: number | null): string {
  return centavos === null ? "" : (centavos / 100).toFixed(2);
}

function VariantForm({
  productId,
  variant,
  isDefault,
}: {
  productId: string;
  variant?: AdminProductVariant;
  isDefault?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [ramNotApplicable, setRamNotApplicable] = useState(
    variant?.ramGb === null,
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveProductVariant({
        productId,
        ...(variant ? { variantId: variant.id } : {}),
        sku: String(form.get("sku") ?? ""),
        variantName: String(form.get("variantName") ?? ""),
        ramGb: String(form.get("ramGb") ?? ""),
        ramNotApplicable,
        extendedRamGb: String(form.get("extendedRamGb") ?? ""),
        storageGb: String(form.get("storageGb") ?? ""),
        currentPricePesos: String(form.get("currentPricePesos") ?? ""),
        srpPesos: String(form.get("srpPesos") ?? ""),
        financingAvailable: form.get("financingAvailable") === "on",
        isActive: form.get("isActive") === "on",
      });
      setFeedback({
        tone: result.ok ? "success" : "error",
        message: result.message,
      });
      if (result.ok) router.refresh();
    });
  }

  return (
    <form className="admin-configuration-card" onSubmit={submit}>
      <div className="admin-configuration-card__heading">
        <div>
          <strong>{variant ? variant.variantName : "Add configuration"}</strong>
          {isDefault ? <span className="admin-configuration-tag">Default</span> : null}
        </div>
        {variant && !isDefault ? (
          <button
            className="admin-configuration-link"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await setDefaultProductVariant(productId, variant.id);
                setFeedback({
                  tone: result.ok ? "success" : "error",
                  message: result.message,
                });
                if (result.ok) router.refresh();
              })
            }
            type="button"
          >
            Make default
          </button>
        ) : null}
      </div>
      <div className="admin-configuration-grid">
        <label>SKU<input defaultValue={variant?.sku} name="sku" required /></label>
        <label>Configuration name<input defaultValue={variant?.variantName} name="variantName" required /></label>
        <label>Physical RAM (GB)<input defaultValue={variant?.ramGb ?? ""} disabled={ramNotApplicable} inputMode="numeric" name="ramGb" /></label>
        <label className="admin-configuration-check"><input checked={ramNotApplicable} onChange={(event) => setRamNotApplicable(event.target.checked)} type="checkbox" />RAM not officially applicable</label>
        <label>Extended RAM (GB, optional)<input defaultValue={variant?.extendedRamGb ?? ""} inputMode="numeric" name="extendedRamGb" /></label>
        <label>Storage (GB)<input defaultValue={variant?.storageGb} inputMode="numeric" name="storageGb" required /></label>
        <label>Selling price (PHP)<input defaultValue={pesos(variant?.currentPriceCentavos ?? null)} inputMode="decimal" name="currentPricePesos" required /></label>
        <label>SRP (PHP, optional)<input defaultValue={pesos(variant?.srpCentavos ?? null)} inputMode="decimal" name="srpPesos" /></label>
        <label className="admin-configuration-check"><input defaultChecked={variant?.financingAvailable ?? true} name="financingAvailable" type="checkbox" />Financing available</label>
        <label className="admin-configuration-check"><input defaultChecked={variant?.isActive ?? true} name="isActive" type="checkbox" />Active and purchasable</label>
      </div>
      <div className="admin-configuration-actions">
        <button className="button button--primary" disabled={pending} type="submit">
          {pending ? "Saving…" : variant ? "Save configuration" : "Add configuration"}
        </button>
        {feedback ? <p className={`admin-configuration-feedback admin-configuration-feedback--${feedback.tone}`} role="status">{feedback.message}</p> : null}
      </div>
    </form>
  );
}

function ColorForm({
  productId,
  color,
  nextSortOrder,
}: {
  productId: string;
  color?: AdminProductColor;
  nextSortOrder: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await saveProductColor({
        productId,
        ...(color ? { colorId: color.id } : {}),
        name: String(form.get("name") ?? ""),
        hexCode: String(form.get("hexCode") ?? ""),
        isActive: form.get("isActive") === "on",
        sortOrder: String(form.get("sortOrder") ?? ""),
      });
      setFeedback({
        tone: result.ok ? "success" : "error",
        message: result.message,
      });
      if (result.ok) router.refresh();
    });
  }

  return (
    <form className="admin-color-card" onSubmit={submit}>
      <div className="admin-color-card__swatch" style={{ background: color?.hexCode ?? "var(--color-ice)" }} />
      <label>Color name<input defaultValue={color?.name} name="name" required /></label>
      <label>Hex (optional)<input defaultValue={color?.hexCode ?? ""} name="hexCode" placeholder="#4C91C8" /></label>
      <label>Sort order<input defaultValue={color?.sortOrder ?? nextSortOrder} inputMode="numeric" min="0" name="sortOrder" required type="number" /></label>
      <label className="admin-configuration-check"><input defaultChecked={color?.isActive ?? true} name="isActive" type="checkbox" />Active</label>
      <div className="admin-configuration-actions">
        <button className="button button--secondary" disabled={pending} type="submit">{pending ? "Saving…" : color ? "Save color" : "Add color"}</button>
        {color ? (
          <button
            className="admin-configuration-link admin-configuration-link--danger"
            disabled={pending}
            onClick={() => {
              if (!window.confirm(`Delete ${color.name}? Deactivate it instead if it has order history.`)) return;
              startTransition(async () => {
                const result = await deleteProductColor(productId, color.id);
                setFeedback({ tone: result.ok ? "success" : "error", message: result.message });
                if (result.ok) router.refresh();
              });
            }}
            type="button"
          >Delete</button>
        ) : null}
        {feedback ? <p className={`admin-configuration-feedback admin-configuration-feedback--${feedback.tone}`} role="status">{feedback.message}</p> : null}
      </div>
    </form>
  );
}

export function ProductVariantManager({ product }: { product: AdminProductEditorData }) {
  const nextColorSortOrder = product.colors.reduce(
    (highest, color) => Math.max(highest, color.sortOrder + 1),
    0,
  );
  return (
    <div className="admin-product-configurations">
      <section className="admin-product-configurations__section">
        <div className="admin-product-configurations__intro">
          <p className="eyebrow">Commercial configurations</p>
          <h2>RAM, storage, SKU, and price</h2>
          <p>The first configuration is the storefront default. Only active configurations with an exact SKU and selling price can be purchased.</p>
        </div>
        <div className="admin-configuration-list">
          {product.variants.map((variant, index) => (
            <VariantForm isDefault={index === 0} key={variant.id} productId={product.id} variant={variant} />
          ))}
          <VariantForm productId={product.id} />
        </div>
      </section>

      <section className="admin-product-configurations__section">
        <div className="admin-product-configurations__intro">
          <p className="eyebrow">Product colors</p>
          <h2>Official display colors</h2>
          <p>Colors are product-level choices. An optional hex value controls the accessible swatch; the color name remains visible.</p>
        </div>
        <div className="admin-color-list">
          {product.colors.map((color) => (
            <ColorForm color={color} key={color.id} nextSortOrder={nextColorSortOrder} productId={product.id} />
          ))}
          <ColorForm nextSortOrder={nextColorSortOrder} productId={product.id} />
        </div>
      </section>
    </div>
  );
}
