"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import {
  deleteProductColor,
  saveProductColor,
  saveProductVariant,
  setDefaultProductVariant,
  setProductVariantColorAvailability,
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
        <label>Selling price (PHP)<input defaultValue={pesos(variant?.currentPriceCentavos ?? null)} inputMode="decimal" min="0.01" name="currentPricePesos" required type="number" step="0.01" /></label>
        <label>SRP (PHP, optional)<input defaultValue={pesos(variant?.srpCentavos ?? null)} inputMode="decimal" name="srpPesos" /></label>
        <label className="admin-configuration-check"><input defaultChecked={variant?.financingAvailable ?? true} name="financingAvailable" type="checkbox" />Financing available</label>
        <label className="admin-configuration-check"><input defaultChecked={variant?.isActive ?? true} name="isActive" type="checkbox" />Active configuration</label>
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
      <label className="admin-configuration-check"><input defaultChecked={color?.isActive ?? true} name="isActive" type="checkbox" />Active color</label>
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

function VariantAvailabilityRow({
  productId,
  color,
  variant,
  initialAvailable,
}: {
  productId: string;
  color: AdminProductColor;
  variant: AdminProductVariant;
  initialAvailable: boolean;
}) {
  const router = useRouter();
  const [available, setAvailable] = useState(initialAvailable);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<Feedback>(null);
  const commerciallyReady = Boolean(
    color.isActive &&
      variant.isActive &&
      variant.sku.trim() &&
      variant.currentPriceCentavos > 0,
  );
  const disabled = pending || (!commerciallyReady && !available);

  function changeAvailability(nextAvailable: boolean) {
    setAvailable(nextAvailable);
    setFeedback(null);
    startTransition(async () => {
      const result = await setProductVariantColorAvailability({
        productId,
        variantId: variant.id,
        colorId: color.id,
        isAvailable: nextAvailable,
      });
      if (!result.ok) setAvailable(!nextAvailable);
      setFeedback({
        tone: result.ok ? "success" : "error",
        message: result.message,
      });
      if (result.ok) router.refresh();
    });
  }

  return (
    <tr>
      <td>
        <span
          aria-hidden="true"
          className="admin-color-card__swatch"
          style={{
            background: color.hexCode ?? "var(--color-ice)",
          }}
        />
      </td>
      <td>
        <strong>{color.name}</strong>
        <small>{color.isActive ? "Active color" : "Inactive color"}</small>
      </td>
      <td>
        <strong>
          {variant.ramGb === null
            ? "RAM not published"
            : `${variant.ramGb}GB RAM`}
          {variant.extendedRamGb
            ? ` + ${variant.extendedRamGb}GB extended`
            : ""}
        </strong>
        <small>{variant.storageGb === 1024 ? "1TB" : `${variant.storageGb}GB`} storage</small>
      </td>
      <td>
        <code>{variant.sku || "Needs SKU"}</code>
      </td>
      <td>
        {variant.currentPriceCentavos > 0
          ? `₱${(variant.currentPriceCentavos / 100).toLocaleString("en-PH")}`
          : "Needs price"}
      </td>
      <td>
        <strong>{commerciallyReady ? "Ready" : "Needs setup"}</strong>
        {!variant.isActive ? <small>Activate the configuration.</small> : null}
        {!color.isActive ? <small>Activate the color.</small> : null}
        {!variant.sku.trim() || variant.currentPriceCentavos <= 0 ? (
          <small>Configure a valid SKU and positive price.</small>
        ) : null}
      </td>
      <td>
        <label className="admin-availability-switch">
          <input
            aria-label={`${available ? "Make" : "Mark"} ${color.name}, ${variant.storageGb}GB ${available ? "unavailable" : "available"}`}
            checked={available}
            disabled={disabled}
            onChange={(event) => changeAvailability(event.target.checked)}
            type="checkbox"
          />
          <span aria-hidden="true" />
          <b>{available ? "Available" : "Unavailable"}</b>
        </label>
        {feedback ? (
          <small
            className={`admin-configuration-feedback admin-configuration-feedback--${feedback.tone}`}
            role="status"
          >
            {feedback.message}
          </small>
        ) : null}
      </td>
    </tr>
  );
}

export function ProductVariantManager({ product }: { product: AdminProductEditorData }) {
  const nextColorSortOrder = product.colors.reduce(
    (highest, color) => Math.max(highest, color.sortOrder + 1),
    0,
  );
  const availableCombinations = new Set(
    product.variantColorOptions
      .filter(({ isAvailable }) => isAvailable)
      .map(({ variantId, colorId }) => `${variantId}:${colorId}`),
  );
  return (
    <div className="admin-product-configurations">
      <section className="admin-product-configurations__section">
        <div className="admin-product-configurations__intro">
          <p className="eyebrow">Commercial configurations</p>
          <h2>RAM, storage, SKU, and price</h2>
          <p>The first available configuration is the storefront default. Use the availability checkbox to control which memory and storage choices customers can select.</p>
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
          <h2>Variant availability</h2>
          <p>Use one switch to mark each exact color and memory/storage combination available or unavailable. Changes save automatically.</p>
        </div>
        {product.colors.length && product.variants.length ? (
          <div className="admin-variant-availability-table">
            <table>
              <thead>
                <tr>
                  <th>Swatch</th>
                  <th>Color</th>
                  <th>Memory / Storage</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Readiness</th>
                  <th>Available</th>
                </tr>
              </thead>
              <tbody>
                {product.colors.flatMap((color) =>
                  product.variants.map((variant) => (
                    <VariantAvailabilityRow
                      color={color}
                      initialAvailable={availableCombinations.has(
                        `${variant.id}:${color.id}`,
                      )}
                      key={`${variant.id}:${color.id}`}
                      productId={product.id}
                      variant={variant}
                    />
                  )),
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-color-checklist__empty">Add at least one commercial configuration and one product color to manage exact availability. Manufacturer research remains separate and never controls this matrix.</p>
        )}
        <details className="admin-color-management">
          <summary>Manage colors: add, rename, reorder, activate, or delete</summary>
          <div className="admin-color-list">
            {product.colors.map((color) => (
              <ColorForm color={color} key={color.id} nextSortOrder={nextColorSortOrder} productId={product.id} />
            ))}
            <ColorForm nextSortOrder={nextColorSortOrder} productId={product.id} />
          </div>
        </details>
      </section>
    </div>
  );
}
