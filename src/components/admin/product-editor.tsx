"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MakeOfficialButton } from "@/components/admin/make-official-button";
import { ProductImageManager } from "@/components/admin/product-image-manager";
import {
  archiveProductAction,
  deleteDraftProductAction,
  saveProductAction,
} from "@/app/admin/(protected)/products/actions";
import type {
  AdminBrand,
  AdminProductEditorData,
  AdminProductSpecification,
  ProductEditorSubmission,
} from "@/lib/admin/products/types";

type SaveStatus = "saved" | "unsaved" | "saving" | "failed";

type EditorForm = Omit<ProductEditorSubmission, "productId">;

function centavosToPesos(value: number | null): string {
  if (value === null) return "";
  const whole = Math.floor(value / 100);
  const fractional = String(value % 100).padStart(2, "0");
  return `${whole}.${fractional}`;
}

function formFromProduct(product: AdminProductEditorData): EditorForm {
  const variant = product.variant ?? product.variantDraft;

  return {
    name: product.name,
    slug: product.slug,
    brandId: product.brandId,
    category: product.category ?? "",
    lifecycle: product.lifecycle,
    shortDescription: product.shortDescription,
    fullDescription: product.fullDescription,
    isFeatured: product.isFeatured,
    sortOrder: String(product.sortOrder),
    specifications: product.specifications,
    variant: {
      sku: variant.sku ?? "",
      variantName: variant.variantName ?? "",
      ramGb:
        variant.ramGb === null || variant.ramGb === undefined
          ? ""
          : String(variant.ramGb),
      ramNotApplicable:
        "ramNotApplicable" in variant
          ? variant.ramNotApplicable
          : variant.ramGb === null,
      extendedRamGb:
        variant.extendedRamGb === null ||
        variant.extendedRamGb === undefined
          ? ""
          : String(variant.extendedRamGb),
      storageGb:
        variant.storageGb === null || variant.storageGb === undefined
          ? ""
          : String(variant.storageGb),
      currentPricePesos: centavosToPesos(
        variant.currentPriceCentavos ?? null,
      ),
      srpPesos: centavosToPesos(variant.srpCentavos ?? null),
      badge: variant.badge ?? "",
      financingAvailable: variant.financingAvailable,
    },
    confirmSlugChange: false,
    confirmSkuChange: false,
  };
}

function serializeForm(form: EditorForm): string {
  return JSON.stringify(form);
}

function validInteger(value: string, allowBlank = true): boolean {
  return (allowBlank && value === "") || /^[0-9]+$/.test(value);
}

function validPositiveInteger(value: string): boolean {
  return value === "" || (/^[0-9]+$/.test(value) && Number(value) > 0);
}

function readClientCentavos(value: string): bigint | null | undefined {
  if (value === "") return null;
  const match = /^(0|[1-9][0-9]*)(?:\.([0-9]{1,2}))?$/.exec(value);
  if (!match) return undefined;

  const centavos =
    BigInt(match[1]) * BigInt(100) +
    BigInt((match[2] ?? "").padEnd(2, "0"));
  return centavos <= BigInt(Number.MAX_SAFE_INTEGER)
    ? centavos
    : undefined;
}

function clientFormIsValid(form: EditorForm, hasVariant: boolean): boolean {
  const currentPriceCentavos = readClientCentavos(
    form.variant.currentPricePesos,
  );
  const srpCentavos = readClientCentavos(form.variant.srpPesos);
  const normalizedSpecificationLabels = form.specifications.map(({ label }) =>
    label.trim().toLocaleLowerCase(),
  );

  if (
    !form.name.trim() ||
    form.name.trim().length > 160 ||
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug) ||
    !form.brandId ||
    !validInteger(form.sortOrder, false) ||
    Number(form.sortOrder) > 1_000_000 ||
    form.specifications.length > 40 ||
    form.specifications.some(
      ({ label, value }) =>
        !label.trim() ||
        !value.trim() ||
        label.trim().length > 80 ||
        value.trim().length > 300,
    ) ||
    new Set(normalizedSpecificationLabels).size !==
      normalizedSpecificationLabels.length
  ) {
    return false;
  }

  if (
    form.lifecycle === "coming_soon" &&
    (!form.shortDescription.trim() || !form.fullDescription.trim())
  ) {
    return false;
  }

  const variantRequested =
    hasVariant ||
    Boolean(
      form.variant.sku ||
        form.variant.variantName ||
        form.variant.ramGb ||
        form.variant.extendedRamGb ||
        form.variant.storageGb ||
        form.variant.currentPricePesos ||
        form.variant.srpPesos ||
        form.variant.badge,
    );

  if (
    !validPositiveInteger(form.variant.ramGb) ||
    !validPositiveInteger(form.variant.extendedRamGb) ||
    !validPositiveInteger(form.variant.storageGb) ||
    currentPriceCentavos === undefined ||
    srpCentavos === undefined ||
    (form.variant.sku !== "" &&
      !/^[A-Z0-9][A-Z0-9-]{2,79}$/.test(form.variant.sku)) ||
    (form.variant.ramNotApplicable && form.variant.ramGb !== "")
  ) {
    return false;
  }

  if (
    srpCentavos !== null &&
    currentPriceCentavos !== null &&
    srpCentavos < currentPriceCentavos
  ) {
    return false;
  }

  return !(
    form.lifecycle === "active" &&
    (!form.category ||
      !form.shortDescription.trim() ||
      !form.fullDescription.trim() ||
      !variantRequested ||
      !form.variant.sku.trim() ||
      !form.variant.variantName.trim() ||
      (!form.variant.ramGb && !form.variant.ramNotApplicable) ||
      !form.variant.storageGb ||
      currentPriceCentavos === null ||
      currentPriceCentavos <= BigInt(0))
  );
}

function FieldError({
  field,
  errors,
}: {
  field: string;
  errors: Record<string, string>;
}) {
  return errors[field] ? (
    <p className="text-sm text-[var(--color-error)]">{errors[field]}</p>
  ) : null;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="rounded-[var(--radius-lg)] border bg-white p-5 shadow-[var(--shadow-sm)] sm:p-7">
      <legend className="px-2 font-[family-name:var(--font-heading)] text-2xl font-bold">
        {title}
      </legend>
      {description ? (
        <p className="mb-5 text-sm leading-6 text-[var(--color-muted)]">
          {description}
        </p>
      ) : null}
      {children}
    </fieldset>
  );
}

export function ProductEditor({
  initialProduct,
  brands,
}: {
  initialProduct: AdminProductEditorData;
  brands: AdminBrand[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<EditorForm>(() =>
    formFromProduct(initialProduct),
  );
  const [baseline, setBaseline] = useState(initialProduct);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [message, setMessage] = useState("Saved");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [skuUnlocked, setSkuUnlocked] = useState(false);
  const [deleteName, setDeleteName] = useState("");
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const [destructivePending, startDestructiveTransition] = useTransition();
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef(form);
  const baselineSnapshotRef = useRef(serializeForm(form));
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const queuedRef = useRef(false);
  const versionRef = useRef(0);
  const latestResponseRef = useRef(0);

  const performSave = useCallback(async () => {
    const currentForm = formRef.current;
    if (serializeForm(currentForm) === baselineSnapshotRef.current) {
      setStatus("saved");
      setMessage("Saved");
      return;
    }

    if (!clientFormIsValid(currentForm, baseline.variant !== null)) {
      setStatus("unsaved");
      setMessage("Unsaved changes — complete the invalid fields to save.");
      return;
    }

    if (savingRef.current) {
      queuedRef.current = true;
      return;
    }

    savingRef.current = true;
    const requestVersion = versionRef.current;
    const submitted = structuredClone(currentForm);
    setStatus("saving");
    setMessage("Saving…");
    setFieldErrors({});

    try {
      const result = await saveProductAction({
        productId: baseline.id,
        ...submitted,
      });

      if (requestVersion < latestResponseRef.current) return;
      latestResponseRef.current = requestVersion;

      if (!result.ok) {
        setStatus("failed");
        setMessage(result.message);
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }

      setBaseline(result.product);
      baselineSnapshotRef.current = serializeForm(submitted);

      if (versionRef.current === requestVersion) {
        setForm(formFromProduct(result.product));
        baselineSnapshotRef.current = serializeForm(
          formFromProduct(result.product),
        );
        setStatus("saved");
        setMessage("Saved");
      } else {
        setStatus("unsaved");
        setMessage("Unsaved changes");
      }
    } catch {
      setStatus("failed");
      setMessage("Save failed. Refresh and try again.");
    } finally {
      savingRef.current = false;
      if (queuedRef.current) {
        queuedRef.current = false;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          void performSave();
        }, 800);
      }
    }
  }, [baseline]);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    const dirty = serializeForm(form) !== baselineSnapshotRef.current;
    if (!dirty) return;

    versionRef.current += 1;
    setStatus("unsaved");
    setMessage("Unsaved changes");

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    if (clientFormIsValid(form, baseline.variant !== null)) {
      saveTimerRef.current = setTimeout(() => {
        void performSave();
      }, 800);
    }

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [baseline.variant, form, performSave]);

  useEffect(() => {
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      if (
        serializeForm(formRef.current) !== baselineSnapshotRef.current ||
        savingRef.current
      ) {
        event.preventDefault();
      }
    };

    const warnBeforeLink = (event: MouseEvent) => {
      if (
        serializeForm(formRef.current) === baselineSnapshotRef.current &&
        !savingRef.current
      ) {
        return;
      }
      const target = event.target;
      const anchor =
        target instanceof Element ? target.closest("a[href]") : null;
      if (!anchor || event.defaultPrevented) return;

      const confirmed = window.confirm(
        "This product has unsaved changes. Leave this page?",
      );
      if (!confirmed) event.preventDefault();
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    document.addEventListener("click", warnBeforeLink, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      document.removeEventListener("click", warnBeforeLink, true);
    };
  }, []);

  function updateForm(update: (current: EditorForm) => EditorForm) {
    setForm((current) => update(current));
  }

  function updateSpecification(
    index: number,
    key: keyof AdminProductSpecification,
    value: string,
  ) {
    updateForm((current) => ({
      ...current,
      specifications: current.specifications.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item,
      ),
    }));
  }

  function archive() {
    const confirmed = window.confirm(
      `Archive “${baseline.name}”? It will leave public listings, while catalog and historical records remain preserved.`,
    );
    if (!confirmed) return;

    startDestructiveTransition(async () => {
      const result = await archiveProductAction({
        productId: baseline.id,
        confirmationName: baseline.name,
      });
      if (!result.ok) {
        setStatus("failed");
        setMessage(result.message);
        return;
      }
      router.refresh();
    });
  }

  function permanentlyDelete() {
    setDeleteMessage(null);
    startDestructiveTransition(async () => {
      const result = await deleteDraftProductAction({
        productId: baseline.id,
        confirmationName: deleteName,
      });
      if (!result.ok) {
        setDeleteMessage(result.message);
        return;
      }
      deleteDialogRef.current?.close();
      router.push(result.redirectTo ?? "/admin/products");
      router.refresh();
    });
  }

  const slugChanged = form.slug !== baseline.slug;
  const skuChanged =
    baseline.variant !== null && form.variant.sku !== baseline.variant.sku;
  const canOfferDelete =
    baseline.lifecycle === "draft" && baseline.variant === null;

  return (
    <>
      <div className="sticky top-0 z-20 -mx-[var(--space-page)] mb-6 border-b bg-white/95 px-[var(--space-page)] py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center justify-between gap-4">
          <div aria-live="polite" role="status">
            <p
              className={`font-bold ${
                status === "failed"
                  ? "text-[var(--color-error)]"
                  : status === "saved"
                    ? "text-emerald-700"
                    : "text-amber-800"
              }`}
            >
              {message}
            </p>
            <p className="text-xs text-[var(--color-muted)]">
              Valid changes autosave after 800 ms.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="min-h-11 rounded-[var(--radius-round)] border px-5 py-2.5 font-bold"
              href="/admin/products"
            >
              Back to products
            </Link>
            <button
              className="min-h-11 rounded-[var(--radius-round)] bg-[var(--color-action)] px-5 font-bold text-white disabled:cursor-wait disabled:opacity-60"
              disabled={status === "saving"}
              onClick={() => void performSave()}
              type="button"
            >
              {status === "saving" ? "Saving…" : "Save now"}
            </button>
          </div>
        </div>
      </div>

      <header>
        <p className="type-eyebrow text-[var(--color-action)]">
          Secure product editor
        </p>
        <h1 className="mt-3 break-words font-[family-name:var(--font-heading)] text-4xl font-bold tracking-[-0.045em] sm:text-5xl">
          {form.name || "Untitled product"}
        </h1>
        <p className="mt-3 break-all text-sm text-[var(--color-muted)]">
          Product ID: {baseline.id}
        </p>
      </header>

      {Object.keys(fieldErrors).length > 0 ? (
        <div
          className="mt-6 rounded-[var(--radius-md)] bg-[var(--color-error-soft)] p-5 text-[var(--color-error)]"
          role="alert"
        >
          <p className="font-bold">Some changes need attention.</p>
          <p className="mt-1 text-sm">
            Review the messages in the relevant editor sections.
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6">
        <Section title="Basic Information">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="grid gap-2">
              <label className="font-bold" htmlFor="product-name">
                Product name
              </label>
              <input
                className="min-h-12 rounded-[var(--radius-sm)] border px-4"
                id="product-name"
                maxLength={160}
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                value={form.name}
              />
              <FieldError errors={fieldErrors} field="name" />
            </div>

            <div className="grid gap-2">
              <label className="font-bold" htmlFor="product-brand">
                Brand
              </label>
              <select
                className="min-h-12 rounded-[var(--radius-sm)] border bg-white px-4"
                id="product-brand"
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    brandId: event.target.value,
                  }))
                }
                value={form.brandId}
              >
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
              <FieldError errors={fieldErrors} field="brandId" />
            </div>

            <div className="grid gap-2">
              <label className="font-bold" htmlFor="product-category">
                Category
              </label>
              <select
                className="min-h-12 rounded-[var(--radius-sm)] border bg-white px-4"
                id="product-category"
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    category: event.target.value as EditorForm["category"],
                  }))
                }
                value={form.category}
              >
                <option value="">Unresolved</option>
                <option value="phone">Phone</option>
                <option value="tablet">Tablet</option>
              </select>
              <FieldError errors={fieldErrors} field="category" />
            </div>

            <div className="grid gap-2">
              <label className="font-bold" htmlFor="product-sort-order">
                Display order
              </label>
              <input
                className="min-h-12 rounded-[var(--radius-sm)] border px-4"
                id="product-sort-order"
                inputMode="numeric"
                min="0"
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    sortOrder: event.target.value,
                  }))
                }
                pattern="[0-9]+"
                value={form.sortOrder}
              />
              <FieldError errors={fieldErrors} field="sortOrder" />
            </div>
          </div>
        </Section>

        <Section
          description="Changing a published route requires an explicit confirmation."
          title="Publishing"
        >
          <div className="grid gap-2">
            <label className="font-bold" htmlFor="product-slug">
              Product slug
            </label>
            <input
              autoCapitalize="none"
              className="min-h-12 rounded-[var(--radius-sm)] border px-4 font-mono text-sm"
              id="product-slug"
              maxLength={160}
              onChange={(event) =>
                updateForm((current) => ({
                  ...current,
                  slug: event.target.value.toLocaleLowerCase(),
                  confirmSlugChange: false,
                }))
              }
              value={form.slug}
            />
            <FieldError errors={fieldErrors} field="slug" />
          </div>
          {slugChanged ? (
            <label className="mt-4 flex gap-3 rounded-[var(--radius-sm)] bg-amber-50 p-4 text-sm">
              <input
                checked={form.confirmSlugChange}
                className="mt-1 h-4 w-4"
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    confirmSlugChange: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span>
                I confirm this changes the product’s public URL from{" "}
                <strong>{baseline.slug}</strong>.
              </span>
            </label>
          ) : null}
          <div className="mt-5 grid gap-2">
            <label className="flex gap-3">
              <input
                checked={form.isFeatured}
                className="mt-1 h-4 w-4"
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    isFeatured: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span>
                <strong>Featured product</strong>
                <span className="mt-1 block text-sm text-[var(--color-muted)]">
                  Makes the product eligible for featured storefront placement.
                </span>
              </span>
            </label>
          </div>
        </Section>

        <Section title="Descriptions">
          <div className="grid gap-5">
            <div className="grid gap-2">
              <label className="font-bold" htmlFor="short-description">
                Short description
              </label>
              <textarea
                className="min-h-28 rounded-[var(--radius-sm)] border p-4"
                id="short-description"
                maxLength={500}
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    shortDescription: event.target.value,
                  }))
                }
                value={form.shortDescription}
              />
              <FieldError errors={fieldErrors} field="shortDescription" />
            </div>
            <div className="grid gap-2">
              <label className="font-bold" htmlFor="full-description">
                Full description
              </label>
              <textarea
                className="min-h-52 rounded-[var(--radius-sm)] border p-4"
                id="full-description"
                maxLength={5000}
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    fullDescription: event.target.value,
                  }))
                }
                value={form.fullDescription}
              />
              <FieldError errors={fieldErrors} field="fullDescription" />
            </div>
          </div>
        </Section>

        <Section
          description="Coming Soon products stay non-purchasable. Archive uses the separate confirmed action below."
          title="Status and Visibility"
        >
          {baseline.lifecycle === "archived" ? (
            <div className="rounded-[var(--radius-sm)] bg-slate-100 p-4">
              <p className="font-bold">Archived</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                This product remains private and its history is preserved.
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              <label className="font-bold" htmlFor="product-lifecycle">
                Catalog status
              </label>
              <select
                className="min-h-12 rounded-[var(--radius-sm)] border bg-white px-4"
                id="product-lifecycle"
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    lifecycle: event.target.value as EditorForm["lifecycle"],
                  }))
                }
                value={form.lifecycle}
              >
                <option value="draft">Draft — private</option>
                <option value="coming_soon">
                  Coming Soon — public preview only
                </option>
                {baseline.lifecycle === "active" ? (
                  <option value="active">Active — purchasable</option>
                ) : null}
              </select>
              <FieldError errors={fieldErrors} field="lifecycle" />
            </div>
          )}
        </Section>

        <Section
          description="Prices are entered in Philippine pesos and stored as integer centavos."
          title="Pricing"
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-2">
              <label className="font-bold" htmlFor="current-price">
                Current price (₱)
              </label>
              <input
                className="min-h-12 rounded-[var(--radius-sm)] border px-4"
                id="current-price"
                inputMode="decimal"
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    variant: {
                      ...current.variant,
                      currentPricePesos: event.target.value,
                    },
                  }))
                }
                placeholder="0.00"
                value={form.variant.currentPricePesos}
              />
              <FieldError errors={fieldErrors} field="currentPricePesos" />
            </div>
            <div className="grid gap-2">
              <label className="font-bold" htmlFor="srp-price">
                SRP (₱)
              </label>
              <input
                className="min-h-12 rounded-[var(--radius-sm)] border px-4"
                id="srp-price"
                inputMode="decimal"
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    variant: {
                      ...current.variant,
                      srpPesos: event.target.value,
                    },
                  }))
                }
                placeholder="Optional"
                value={form.variant.srpPesos}
              />
              <FieldError errors={fieldErrors} field="srpPesos" />
            </div>
            <div className="grid gap-2">
              <label className="font-bold" htmlFor="product-badge">
                Badge
              </label>
              <select
                className="min-h-12 rounded-[var(--radius-sm)] border bg-white px-4"
                id="product-badge"
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    variant: {
                      ...current.variant,
                      badge: event.target.value as EditorForm["variant"]["badge"],
                    },
                  }))
                }
                value={form.variant.badge}
              >
                <option value="">No badge</option>
                <option value="new">New</option>
                <option value="sale">Sale</option>
              </select>
              <FieldError errors={fieldErrors} field="badge" />
            </div>
          </div>
          <label className="mt-5 flex gap-3">
            <input
              checked={form.variant.financingAvailable}
              className="mt-1 h-4 w-4"
              onChange={(event) =>
                updateForm((current) => ({
                  ...current,
                  variant: {
                    ...current.variant,
                    financingAvailable: event.target.checked,
                  },
                }))
              }
              type="checkbox"
            />
            <span className="font-bold">Financing availability confirmed</span>
          </label>
        </Section>

        <Section
          description={
            baseline.lifecycle === "coming_soon"
              ? "Incomplete commercial details autosave safely without making this product purchasable."
              : "Active products require a complete canonical variant."
          }
          title="Variant"
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-2 sm:col-span-2">
              <label className="font-bold" htmlFor="product-sku">
                SKU
              </label>
              <input
                autoCapitalize="characters"
                className="min-h-12 rounded-[var(--radius-sm)] border px-4 font-mono text-sm disabled:bg-slate-100"
                disabled={baseline.variant !== null && !skuUnlocked}
                id="product-sku"
                maxLength={80}
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    variant: {
                      ...current.variant,
                      sku: event.target.value.toLocaleUpperCase(),
                    },
                    confirmSkuChange: false,
                  }))
                }
                placeholder="No SKU is generated automatically"
                value={form.variant.sku}
              />
              <FieldError errors={fieldErrors} field="sku" />
              {baseline.variant ? (
                <label className="flex gap-2 text-sm text-[var(--color-muted)]">
                  <input
                    checked={skuUnlocked}
                    onChange={(event) => {
                      setSkuUnlocked(event.target.checked);
                      if (!event.target.checked) {
                        updateForm((current) => ({
                          ...current,
                          variant: {
                            ...current.variant,
                            sku: baseline.variant?.sku ?? "",
                          },
                          confirmSkuChange: false,
                        }));
                      }
                    }}
                    type="checkbox"
                  />
                  Allow canonical SKU editing
                </label>
              ) : null}
            </div>

            <div className="grid gap-2">
              <label className="font-bold" htmlFor="variant-name">
                Variant name
              </label>
              <input
                className="min-h-12 rounded-[var(--radius-sm)] border px-4"
                id="variant-name"
                maxLength={160}
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    variant: {
                      ...current.variant,
                      variantName: event.target.value,
                    },
                  }))
                }
                value={form.variant.variantName}
              />
              <FieldError errors={fieldErrors} field="variantName" />
            </div>

            {[
              ["ramGb", "Physical RAM (GB)"],
              ["extendedRamGb", "Extended RAM (GB)"],
              ["storageGb", "Storage (GB)"],
            ].map(([field, label]) => (
              <div className="grid gap-2" key={field}>
                <label className="font-bold" htmlFor={`variant-${field}`}>
                  {label}
                </label>
                <input
                  className="min-h-12 rounded-[var(--radius-sm)] border px-4"
                  id={`variant-${field}`}
                  inputMode="numeric"
                  min="0"
                  onChange={(event) =>
                    updateForm((current) => ({
                      ...current,
                      variant: {
                        ...current.variant,
                        [field]: event.target.value,
                      },
                    }))
                  }
                  pattern="[0-9]*"
                  value={
                    form.variant[field as "ramGb" | "extendedRamGb" | "storageGb"]
                  }
                />
                <FieldError errors={fieldErrors} field={field} />
              </div>
            ))}
          </div>
          <label className="mt-5 flex gap-3 rounded-[var(--radius-sm)] bg-[var(--color-ice)] p-4">
            <input
              checked={form.variant.ramNotApplicable}
              className="mt-1 h-4 w-4"
              onChange={(event) =>
                updateForm((current) => ({
                  ...current,
                  variant: {
                    ...current.variant,
                    ramNotApplicable: event.target.checked,
                    ...(event.target.checked ? { ramGb: "" } : {}),
                  },
                }))
              }
              type="checkbox"
            />
            <span>
              <strong>Physical RAM is not applicable</strong>
              <span className="mt-1 block text-sm text-[var(--color-muted)]">
                Use only when the official variant does not have an applicable
                physical RAM value. Do not use this to guess an unknown value.
              </span>
            </span>
          </label>
          <FieldError errors={fieldErrors} field="ramNotApplicable" />
          {skuChanged ? (
            <label className="mt-5 flex gap-3 rounded-[var(--radius-sm)] bg-amber-50 p-4 text-sm">
              <input
                checked={form.confirmSkuChange}
                className="mt-1 h-4 w-4"
                onChange={(event) =>
                  updateForm((current) => ({
                    ...current,
                    confirmSkuChange: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span>
                I confirm this replaces the canonical SKU{" "}
                <strong>{baseline.variant?.sku}</strong>.
              </span>
            </label>
          ) : null}
          <FieldError errors={fieldErrors} field="variant" />
        </Section>

        <Section title="Specifications">
          <div className="grid gap-4">
            {form.specifications.map((specification, index) => (
              <div
                className="grid gap-3 rounded-[var(--radius-sm)] bg-[var(--color-ice)] p-4 sm:grid-cols-[1fr_2fr_auto]"
                key={`${index}-${specification.label}`}
              >
                <div className="grid gap-2">
                  <label className="text-sm font-bold" htmlFor={`spec-label-${index}`}>
                    Label
                  </label>
                  <input
                    className="min-h-11 rounded-[var(--radius-sm)] border bg-white px-3"
                    id={`spec-label-${index}`}
                    maxLength={80}
                    onChange={(event) =>
                      updateSpecification(index, "label", event.target.value)
                    }
                    value={specification.label}
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-bold" htmlFor={`spec-value-${index}`}>
                    Value
                  </label>
                  <input
                    className="min-h-11 rounded-[var(--radius-sm)] border bg-white px-3"
                    id={`spec-value-${index}`}
                    maxLength={300}
                    onChange={(event) =>
                      updateSpecification(index, "value", event.target.value)
                    }
                    value={specification.value}
                  />
                </div>
                <button
                  className="min-h-11 self-end rounded-[var(--radius-round)] border px-4 text-sm font-bold text-[var(--color-error)]"
                  onClick={() =>
                    updateForm((current) => ({
                      ...current,
                      specifications: current.specifications.filter(
                        (_, itemIndex) => itemIndex !== index,
                      ),
                    }))
                  }
                  type="button"
                >
                  Remove
                </button>
                <FieldError
                  errors={fieldErrors}
                  field={`specifications.${index}`}
                />
              </div>
            ))}
          </div>
          <FieldError errors={fieldErrors} field="specifications" />
          <button
            className="mt-4 min-h-11 rounded-[var(--radius-round)] border px-5 font-bold text-[var(--color-action)]"
            disabled={form.specifications.length >= 40}
            onClick={() =>
              updateForm((current) => ({
                ...current,
                specifications: [
                  ...current.specifications,
                  { label: "", value: "" },
                ],
              }))
            }
            type="button"
          >
            Add specification
          </button>
        </Section>

        <Section
          description="Keep the primary image, or add and remove optional gallery images for this product only."
          title="Product Images"
        >
          <ProductImageManager
            initialImages={baseline.images}
            productId={baseline.id}
            productName={form.name || baseline.name}
          />
        </Section>

        {baseline.lifecycle === "coming_soon" ? (
          <Section
            description="Publication is a separate confirmed transaction. Autosave never publishes this product."
            title="Make this product official"
          >
            <ul className="grid gap-3 sm:grid-cols-2">
              {baseline.readiness.items.map((item) => (
                <li
                  className={`flex items-start gap-3 rounded-[var(--radius-sm)] p-3 text-sm ${
                    item.complete
                      ? "bg-emerald-50 text-emerald-900"
                      : "bg-amber-50 text-amber-950"
                  }`}
                  key={item.key}
                >
                  <span aria-hidden="true" className="font-bold">
                    {item.complete ? "✓" : "○"}
                  </span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <MakeOfficialButton
                disabled={
                  !baseline.readiness.isReady ||
                  status !== "saved"
                }
                productId={baseline.id}
              />
            </div>
            {!baseline.readiness.isReady ? (
              <p className="mt-3 text-sm text-[var(--color-muted)]">
                Complete and save every checklist item to enable publication.
              </p>
            ) : null}
          </Section>
        ) : null}

        <Section
          description="Archive preserves history. Permanent deletion is restricted by the deployed database guard."
          title="Destructive Actions"
        >
          <div className="flex flex-wrap gap-3">
            {baseline.lifecycle !== "archived" ? (
              <button
                className="min-h-11 rounded-[var(--radius-round)] border border-amber-300 bg-amber-50 px-5 font-bold text-amber-900"
                disabled={destructivePending}
                onClick={archive}
                type="button"
              >
                Archive product
              </button>
            ) : null}
            {canOfferDelete ? (
              <button
                className="min-h-11 rounded-[var(--radius-round)] bg-[var(--color-error)] px-5 font-bold text-white"
                disabled={destructivePending}
                onClick={() => {
                  setDeleteName("");
                  setDeleteMessage(null);
                  deleteDialogRef.current?.showModal();
                }}
                type="button"
              >
                Permanently delete unused draft
              </button>
            ) : null}
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--color-muted)]">
            Permanent deletion is blocked for previews and any product with a
            variant, image, order item, inventory relationship, reservation,
            fulfillment dependency, payment history, or homepage placement.
          </p>
        </Section>
      </div>

      <dialog
        aria-labelledby="delete-draft-title"
        className="w-[min(34rem,calc(100%-2rem))] rounded-[var(--radius-xl)] p-0 shadow-2xl backdrop:bg-slate-950/60"
        ref={deleteDialogRef}
      >
        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold" id="delete-draft-title">
            Permanently delete draft
          </h2>
          <p className="mt-3 leading-7 text-[var(--color-muted)]">
            This cannot be undone. Type the exact product name:
          </p>
          <p className="mt-3 break-words rounded-[var(--radius-sm)] bg-[var(--color-ice)] p-3 font-bold">
            {baseline.name}
          </p>
          <label className="mt-5 grid gap-2 font-bold" htmlFor="delete-confirmation">
            Product name confirmation
            <input
              className="min-h-12 rounded-[var(--radius-sm)] border px-4 font-normal"
              id="delete-confirmation"
              onChange={(event) => setDeleteName(event.target.value)}
              value={deleteName}
            />
          </label>
          {deleteMessage ? (
            <p
              aria-live="polite"
              className="mt-4 text-sm text-[var(--color-error)]"
            >
              {deleteMessage}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              className="min-h-11 rounded-[var(--radius-round)] border px-5 font-bold"
              disabled={destructivePending}
              onClick={() => deleteDialogRef.current?.close()}
              type="button"
            >
              Cancel
            </button>
            <button
              className="min-h-11 rounded-[var(--radius-round)] bg-[var(--color-error)] px-5 font-bold text-white disabled:opacity-50"
              disabled={
                destructivePending || deleteName !== baseline.name
              }
              onClick={permanentlyDelete}
              type="button"
            >
              {destructivePending ? "Deleting…" : "Delete permanently"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
