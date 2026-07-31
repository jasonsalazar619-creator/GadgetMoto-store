"use client";

import { useActionState, useState } from "react";
import {
  createDraftProductAction,
  type CreateDraftState,
} from "@/app/admin/(protected)/products/actions";
import type { AdminBrand } from "@/lib/admin/products/types";

const initialState: CreateDraftState = {
  status: "idle",
  message: null,
  fieldErrors: {},
};

function slugify(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160)
    .replace(/-+$/g, "");
}

function proposeUniqueSlug(name: string, existing: Set<string>): string {
  const base = slugify(name);
  if (!base || !existing.has(base)) return base;

  let suffix = 2;
  while (existing.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function CreateProductForm({
  brands,
  existingSlugs,
}: {
  brands: AdminBrand[];
  existingSlugs: string[];
}) {
  const [state, action, pending] = useActionState(
    createDraftProductAction,
    initialState,
  );
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const knownSlugs = new Set(existingSlugs);

  return (
    <form action={action} className="mt-8 grid gap-6">
      <div className="grid gap-2">
        <label className="font-bold" htmlFor="new-product-name">
          Product name
        </label>
        <input
          aria-describedby={
            state.fieldErrors.name ? "new-product-name-error" : undefined
          }
          className="min-h-12 rounded-[var(--radius-sm)] border px-4"
          id="new-product-name"
          maxLength={160}
          name="name"
          onChange={(event) => {
            const nextName = event.target.value;
            setName(nextName);
            if (!slugEdited) {
              setSlug(proposeUniqueSlug(nextName, knownSlugs));
            }
          }}
          required
          value={name}
        />
        {state.fieldErrors.name ? (
          <p className="text-sm text-[var(--color-error)]" id="new-product-name-error">
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <label className="font-bold" htmlFor="new-product-slug">
          Product slug
        </label>
        <input
          aria-describedby={
            state.fieldErrors.slug
              ? "new-product-slug-error"
              : "new-product-slug-help"
          }
          autoCapitalize="none"
          className="min-h-12 rounded-[var(--radius-sm)] border px-4 font-mono text-sm"
          id="new-product-slug"
          maxLength={160}
          name="slug"
          onChange={(event) => {
            setSlugEdited(true);
            setSlug(event.target.value.toLocaleLowerCase());
          }}
          pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
          required
          value={slug}
        />
        <p className="text-sm text-[var(--color-muted)]" id="new-product-slug-help">
          A unique proposal is generated from the name. You can edit it before
          creating the draft.
        </p>
        {state.fieldErrors.slug ? (
          <p className="text-sm text-[var(--color-error)]" id="new-product-slug-error">
            {state.fieldErrors.slug}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="font-bold" htmlFor="new-product-brand">
            Brand
          </label>
          <select
            aria-describedby={
              state.fieldErrors.brandId ? "new-product-brand-error" : undefined
            }
            className="min-h-12 rounded-[var(--radius-sm)] border bg-white px-4"
            defaultValue=""
            id="new-product-brand"
            name="brandId"
            required
          >
            <option disabled value="">
              Select a brand
            </option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
          {state.fieldErrors.brandId ? (
            <p className="text-sm text-[var(--color-error)]" id="new-product-brand-error">
              {state.fieldErrors.brandId}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <label className="font-bold" htmlFor="new-product-category">
            Category
          </label>
          <select
            aria-describedby={
              state.fieldErrors.category
                ? "new-product-category-error"
                : undefined
            }
            className="min-h-12 rounded-[var(--radius-sm)] border bg-white px-4"
            defaultValue=""
            id="new-product-category"
            name="category"
            required
          >
            <option disabled value="">
              Select a category
            </option>
            <option value="phone">Phone</option>
            <option value="tablet">Tablet</option>
          </select>
          {state.fieldErrors.category ? (
            <p
              className="text-sm text-[var(--color-error)]"
              id="new-product-category-error"
            >
              {state.fieldErrors.category}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-[var(--radius-md)] bg-[var(--color-ice)] p-5">
        <input name="status" type="hidden" value="draft" />
        <p className="font-bold">Initial status: Draft</p>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
          No SKU, price, inventory, or public listing is created. Complete the
          product editor before changing its visibility.
        </p>
      </div>

      <div aria-live="polite" className="min-h-6">
        {state.message ? (
          <p className="rounded-[var(--radius-sm)] bg-[var(--color-error-soft)] px-4 py-3 text-sm text-[var(--color-error)]">
            {state.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="min-h-12 rounded-[var(--radius-round)] bg-[var(--color-action)] px-6 font-bold text-white disabled:cursor-wait disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Creating draft…" : "Create Draft"}
        </button>
      </div>
    </form>
  );
}
