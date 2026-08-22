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

type Feedback = {
  tone: "success" | "error";
  message: string;
  fieldErrors?: Record<string, string>;
} | null;

function pesos(centavos: number | null): string {
  return centavos === null ? "" : (centavos / 100).toFixed(2);
}

function memoryLabel(variant: AdminProductVariant): string {
  const ram = variant.ramGb === null ? "RAM not published" : `${variant.ramGb}GB RAM`;
  const storage = variant.storageGb === 1024 ? "1TB" : `${variant.storageGb}GB`;
  return `${ram} · ${storage}`;
}

function priceLabel(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString("en-PH")}`;
}

function VariantFieldError({ feedback, field }: { feedback: Feedback; field: string }) {
  const message = feedback?.fieldErrors?.[field];
  return message ? <small className="admin-configuration-field-error">{message}</small> : null;
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
        badge: String(form.get("badge") ?? "") as "" | "new" | "sale",
        financingAvailable: form.get("financingAvailable") === "on",
        isActive: form.get("isActive") === "on",
      });
      setFeedback({
        tone: result.ok ? "success" : "error",
        message: result.message,
        ...(!result.ok && result.fieldErrors
          ? { fieldErrors: result.fieldErrors }
          : {}),
      });
      if (result.ok) router.refresh();
    });
  }

  return (
    <details className="admin-configuration-card">
      <summary className="admin-configuration-summary">
        <span className="admin-configuration-summary__name">
          <strong>{variant ? variant.variantName : "Add memory / storage option"}</strong>
          {isDefault ? <span className="admin-configuration-tag">Default</span> : null}
          {variant && !variant.isActive ? (
            <span className="admin-configuration-tag admin-configuration-tag--muted">Inactive</span>
          ) : null}
        </span>
        {variant ? (
          <span className="admin-configuration-summary__facts">
            <span>{memoryLabel(variant)}</span>
            <span>{priceLabel(variant.currentPriceCentavos)}</span>
          </span>
        ) : (
          <span className="admin-configuration-summary__hint">Create only the options customers can actually buy.</span>
        )}
      </summary>

      <form className="admin-configuration-form" onSubmit={submit}>
        <div className="admin-configuration-grid admin-configuration-grid--primary">
          <label>
            Option label
            <input defaultValue={variant?.variantName} name="variantName" required />
            <VariantFieldError feedback={feedback} field="variantName" />
          </label>
          <label>
            Physical RAM (GB)
            <input
              defaultValue={variant?.ramGb ?? ""}
              disabled={ramNotApplicable}
              inputMode="numeric"
              min="1"
              name="ramGb"
              type="number"
            />
            <VariantFieldError feedback={feedback} field="ramGb" />
          </label>
          <label>
            Storage (GB)
            <input
              defaultValue={variant?.storageGb}
              inputMode="numeric"
              min="1"
              name="storageGb"
              required
              type="number"
            />
            <VariantFieldError feedback={feedback} field="storageGb" />
          </label>
          <label>
            Selling price (₱)
            <input
              defaultValue={pesos(variant?.currentPriceCentavos ?? null)}
              inputMode="decimal"
              min="0.01"
              name="currentPricePesos"
              required
              step="0.01"
              type="number"
            />
            <VariantFieldError feedback={feedback} field="currentPricePesos" />
          </label>
          <label>
            SKU
            <input
              autoCapitalize="characters"
              defaultValue={variant?.sku}
              name="sku"
              required
            />
            <VariantFieldError feedback={feedback} field="sku" />
          </label>
          <label>
            SRP (₱, optional)
            <input
              defaultValue={pesos(variant?.srpCentavos ?? null)}
              inputMode="decimal"
              min="0.01"
              name="srpPesos"
              step="0.01"
              type="number"
            />
            <VariantFieldError feedback={feedback} field="srpPesos" />
          </label>
        </div>

        <details className="admin-configuration-advanced">
          <summary>Optional settings</summary>
          <div className="admin-configuration-grid">
            <label>
              Extended RAM (GB)
              <input
                defaultValue={variant?.extendedRamGb ?? ""}
                inputMode="numeric"
                min="1"
                name="extendedRamGb"
                type="number"
              />
              <VariantFieldError feedback={feedback} field="extendedRamGb" />
            </label>
            <label>
              Storefront badge
              <select defaultValue={variant?.badge ?? ""} name="badge">
                <option value="">No badge</option>
                <option value="new">New</option>
                <option value="sale">Sale</option>
              </select>
              <VariantFieldError feedback={feedback} field="badge" />
            </label>
            <label className="admin-configuration-check">
              <input
                checked={ramNotApplicable}
                onChange={(event) => setRamNotApplicable(event.target.checked)}
                type="checkbox"
              />
              RAM is not officially applicable
            </label>
            <label className="admin-configuration-check">
              <input
                defaultChecked={variant?.financingAvailable ?? true}
                name="financingAvailable"
                type="checkbox"
              />
              Financing available
            </label>
            <label className="admin-configuration-check">
              <input defaultChecked={variant?.isActive ?? true} name="isActive" type="checkbox" />
              Active option
            </label>
          </div>
        </details>

        <div className="admin-configuration-actions">
          <button className="button button--primary" disabled={pending} type="submit">
            {pending ? "Saving…" : variant ? "Save option" : "Add option"}
          </button>
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
              Make storefront default
            </button>
          ) : null}
          {feedback ? (
            <p
              className={`admin-configuration-feedback admin-configuration-feedback--${feedback.tone}`}
              role="status"
            >
              {feedback.message}
            </p>
          ) : null}
        </div>
      </form>
    </details>
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

function VariantAvailabilityCell({
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
    <td>
      <label className="admin-availability-switch admin-availability-switch--matrix">
        <input
          aria-label={`${available ? "Make" : "Mark"} ${color.name}, ${memoryLabel(variant)} ${available ? "unavailable" : "available"}`}
          checked={available}
          disabled={disabled}
          onChange={(event) => changeAvailability(event.target.checked)}
          type="checkbox"
        />
        <span aria-hidden="true" />
        <b>{available ? "Available" : "Unavailable"}</b>
      </label>
      {!commerciallyReady ? (
        <small>Complete and activate this option first.</small>
      ) : null}
      {feedback ? (
        <small
          className={`admin-configuration-feedback admin-configuration-feedback--${feedback.tone}`}
          role="status"
        >
          {feedback.message}
        </small>
      ) : null}
    </td>
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
          <p className="eyebrow">Selling options</p>
          <h2>Memory, SKU, and price</h2>
          <p>Edit each value once here. Open an option to change its RAM, storage, SKU, price, badge, or active state.</p>
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
          <p className="eyebrow">Storefront availability</p>
          <h2>Choose what customers can select</h2>
          <p>Each row is a color and each column is a memory option. Turn on only the exact combinations currently available.</p>
        </div>
        {product.colors.length && product.variants.length ? (
          <div className="admin-variant-availability-table">
            <table>
              <thead>
                <tr>
                  <th scope="col">Color</th>
                  {product.variants.map((variant) => (
                    <th key={variant.id} scope="col">
                      <strong>{memoryLabel(variant)}</strong>
                      <small>{variant.variantName}</small>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {product.colors.map((color) => (
                  <tr key={color.id}>
                    <th scope="row">
                      <span
                        aria-hidden="true"
                        className="admin-color-card__swatch"
                        style={{ background: color.hexCode ?? "var(--color-ice)" }}
                      />
                      <span>
                        <strong>{color.name}</strong>
                        <small>{color.isActive ? "Active color" : "Inactive color"}</small>
                      </span>
                    </th>
                    {product.variants.map((variant) => (
                      <VariantAvailabilityCell
                        color={color}
                        initialAvailable={availableCombinations.has(
                          `${variant.id}:${color.id}`,
                        )}
                        key={`${variant.id}:${color.id}`}
                        productId={product.id}
                        variant={variant}
                      />
                    ))}
                  </tr>
                ))}
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
