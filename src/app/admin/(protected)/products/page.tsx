import Image from "next/image";
import Link from "next/link";
import { ArchiveProductButton } from "@/components/admin/archive-product-button";
import type {
  AdminProductLifecycle,
  AdminProductListItem,
} from "@/lib/admin/products/types";
import { getAdminProductList } from "@/lib/admin/server/products";

type AdminProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const pageSize = 20;
const lifecycleLabels: Record<AdminProductLifecycle, string> = {
  active: "Active",
  coming_soon: "Coming Soon",
  draft: "Draft",
  archived: "Archived",
};

function readParam(
  params: Record<string, string | string[] | undefined>,
  name: string,
): string {
  const value = params[name];
  return typeof value === "string" ? value.trim() : "";
}

function formatMoney(centavos: number | null): string {
  if (centavos === null) return "Not set";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: centavos % 100 === 0 ? 0 : 2,
  }).format(centavos / 100);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function lifecycleClass(lifecycle: AdminProductLifecycle): string {
  if (lifecycle === "active") return "bg-emerald-100 text-emerald-800";
  if (lifecycle === "coming_soon") return "bg-sky-100 text-sky-800";
  if (lifecycle === "archived") return "bg-slate-200 text-slate-700";
  return "bg-amber-100 text-amber-900";
}

function ProductThumbnail({ product }: { product: AdminProductListItem }) {
  return (
    <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-ice)]">
      {product.primaryImage ? (
        <Image
          alt={product.primaryImage.alt}
          className="h-full w-full object-contain p-1"
          height={64}
          sizes="64px"
          src={product.primaryImage.src}
          width={64}
        />
      ) : (
        <span aria-hidden="true" className="text-2xl text-sky-700">
          ◇
        </span>
      )}
    </div>
  );
}

function pageHref(
  current: URLSearchParams,
  page: number,
): string {
  const params = new URLSearchParams(current);
  params.set("page", String(page));
  return `/admin/products?${params.toString()}`;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const [{ products, brands }, params] = await Promise.all([
    getAdminProductList(),
    searchParams,
  ]);
  const query = readParam(params, "q").toLocaleLowerCase();
  const brand = readParam(params, "brand");
  const category = readParam(params, "category");
  const status = readParam(params, "status");
  const sort = readParam(params, "sort") === "name" ? "name" : "updated";
  const requestedPage = Number.parseInt(readParam(params, "page"), 10);

  const filtered = products
    .filter((product) => {
      const searchable = `${product.name} ${product.slug} ${product.sku ?? ""}`.toLocaleLowerCase();
      return (
        (!query || searchable.includes(query)) &&
        (!brand || product.brandId === brand) &&
        (!category || product.category === category) &&
        (!status || product.lifecycle === status)
      );
    })
    .sort((left, right) =>
      sort === "name"
        ? left.name.localeCompare(right.name)
        : right.updatedAt.localeCompare(left.updatedAt),
    );

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Number.isSafeInteger(requestedPage)
    ? Math.min(Math.max(requestedPage, 1), pageCount)
    : 1;
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const currentParams = new URLSearchParams();
  ["q", "brand", "category", "status", "sort"].forEach((key) => {
    const value = readParam(params, key);
    if (value) currentParams.set(key, value);
  });

  return (
    <section aria-labelledby="admin-products-title">
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="type-eyebrow text-[var(--color-action)]">
            Product management
          </p>
          <h1
            className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-bold tracking-[-0.045em] sm:text-5xl"
            id="admin-products-title"
          >
            Catalog products
          </h1>
          <p className="mt-3 text-[var(--color-muted)]">
            {filtered.length} of {products.length} products
          </p>
        </div>
        <Link
          className="button-link button-link--primary"
          href="/admin/products/new"
        >
          Add draft product
        </Link>
      </header>

      <form
        className="mt-8 grid gap-4 rounded-[var(--radius-lg)] border bg-white p-5 shadow-[var(--shadow-sm)] md:grid-cols-2 xl:grid-cols-6"
        method="get"
      >
        <div className="grid gap-2 md:col-span-2">
          <label className="text-sm font-bold" htmlFor="product-search">
            Search name, SKU, or slug
          </label>
          <input
            className="min-h-11 rounded-[var(--radius-sm)] border px-3"
            defaultValue={readParam(params, "q")}
            id="product-search"
            name="q"
            placeholder="Search catalog"
            type="search"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-bold" htmlFor="brand-filter">
            Brand
          </label>
          <select
            className="min-h-11 rounded-[var(--radius-sm)] border bg-white px-3"
            defaultValue={brand}
            id="brand-filter"
            name="brand"
          >
            <option value="">All brands</option>
            {brands.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-bold" htmlFor="category-filter">
            Category
          </label>
          <select
            className="min-h-11 rounded-[var(--radius-sm)] border bg-white px-3"
            defaultValue={category}
            id="category-filter"
            name="category"
          >
            <option value="">All categories</option>
            <option value="phone">Phones</option>
            <option value="tablet">Tablets</option>
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-bold" htmlFor="status-filter">
            Status
          </label>
          <select
            className="min-h-11 rounded-[var(--radius-sm)] border bg-white px-3"
            defaultValue={status}
            id="status-filter"
            name="status"
          >
            <option value="">All statuses</option>
            {Object.entries(lifecycleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-bold" htmlFor="sort-products">
            Sort
          </label>
          <select
            className="min-h-11 rounded-[var(--radius-sm)] border bg-white px-3"
            defaultValue={sort}
            id="sort-products"
            name="sort"
          >
            <option value="updated">Recently updated</option>
            <option value="name">Product name</option>
          </select>
        </div>
        <div className="flex flex-wrap items-end gap-3 md:col-span-2 xl:col-span-6">
          <button
            className="min-h-11 rounded-[var(--radius-round)] bg-[var(--color-action)] px-5 font-bold text-white"
            type="submit"
          >
            Apply filters
          </button>
          <Link
            className="min-h-11 rounded-[var(--radius-round)] border px-5 py-2.5 font-bold text-[var(--color-action)]"
            href="/admin/products"
          >
            Clear
          </Link>
        </div>
      </form>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-lg)] border bg-white p-8 text-center">
          <h2 className="text-xl font-bold">No products found</h2>
          <p className="mt-2 text-[var(--color-muted)]">
            Adjust the search or filters, or create a new draft product.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:hidden">
            {visible.map((product) => (
              <article
                className={`rounded-[var(--radius-lg)] border bg-white p-5 shadow-[var(--shadow-sm)] ${
                  product.lifecycle === "archived" ? "opacity-75" : ""
                }`}
                key={product.id}
              >
                <div className="flex gap-4">
                  <ProductThumbnail product={product} />
                  <div className="min-w-0">
                    <h2 className="font-bold">{product.name}</h2>
                    <p className="mt-1 break-all text-sm text-[var(--color-muted)]">
                      {product.slug}
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${lifecycleClass(product.lifecycle)}`}
                    >
                      {lifecycleLabels[product.lifecycle]}
                    </span>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-[var(--color-muted)]">Brand</dt>
                    <dd className="font-bold">{product.brandName}</dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-muted)]">Category</dt>
                    <dd className="font-bold capitalize">
                      {product.category ?? "Unresolved"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-muted)]">SKU</dt>
                    <dd className="break-all font-bold">
                      {product.sku ?? "Not set"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[var(--color-muted)]">Price</dt>
                    <dd className="font-bold">
                      {formatMoney(product.currentPriceCentavos)}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 text-xs text-[var(--color-muted)]">
                  Updated {formatDate(product.updatedAt)}
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    className="min-h-11 rounded-[var(--radius-round)] bg-[var(--color-action)] px-5 py-2.5 font-bold text-white"
                    href={`/admin/products/${product.id}`}
                  >
                    Edit
                  </Link>
                  {product.lifecycle !== "archived" ? (
                    <ArchiveProductButton
                      compact
                      productId={product.id}
                      productName={product.name}
                    />
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 hidden overflow-x-auto rounded-[var(--radius-lg)] border bg-white shadow-[var(--shadow-sm)] lg:block">
            <table className="w-full min-w-[72rem] border-collapse text-left">
              <caption className="sr-only">
                GadgetMoTo products with current catalog status and actions
              </caption>
              <thead className="bg-[var(--color-ice)] text-sm">
                <tr>
                  {[
                    "Product",
                    "Brand",
                    "Category",
                    "Status",
                    "SKU",
                    "Price",
                    "Updated",
                    "Actions",
                  ].map((label) => (
                    <th className="px-4 py-3 font-bold" key={label} scope="col">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => (
                  <tr
                    className={`border-t align-middle ${
                      product.lifecycle === "archived" ? "bg-slate-50" : ""
                    }`}
                    key={product.id}
                  >
                    <th className="px-4 py-4 font-normal" scope="row">
                      <div className="flex items-center gap-3">
                        <ProductThumbnail product={product} />
                        <div className="min-w-0">
                          <p className="font-bold">{product.name}</p>
                          <p className="mt-1 max-w-64 break-all text-xs text-[var(--color-muted)]">
                            {product.slug}
                          </p>
                        </div>
                      </div>
                    </th>
                    <td className="px-4 py-4">{product.brandName}</td>
                    <td className="px-4 py-4 capitalize">
                      {product.category ?? "Unresolved"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${lifecycleClass(product.lifecycle)}`}
                      >
                        {lifecycleLabels[product.lifecycle]}
                      </span>
                    </td>
                    <td className="max-w-56 break-all px-4 py-4 text-sm">
                      {product.sku ?? "Not set"}
                    </td>
                    <td className="px-4 py-4 font-bold">
                      {formatMoney(product.currentPriceCentavos)}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      {formatDate(product.updatedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <Link
                          className="min-h-11 rounded-[var(--radius-round)] bg-[var(--color-action)] px-4 py-2.5 text-sm font-bold text-white"
                          href={`/admin/products/${product.id}`}
                        >
                          Edit
                        </Link>
                        {product.lifecycle !== "archived" ? (
                          <ArchiveProductButton
                            compact
                            productId={product.id}
                            productName={product.name}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {pageCount > 1 ? (
        <nav
          aria-label="Product pagination"
          className="mt-6 flex items-center justify-between gap-4"
        >
          {currentPage > 1 ? (
            <Link
              className="min-h-11 rounded-[var(--radius-round)] border bg-white px-5 py-2.5 font-bold"
              href={pageHref(currentParams, currentPage - 1)}
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-[var(--color-muted)]">
            Page {currentPage} of {pageCount}
          </span>
          {currentPage < pageCount ? (
            <Link
              className="min-h-11 rounded-[var(--radius-round)] border bg-white px-5 py-2.5 font-bold"
              href={pageHref(currentParams, currentPage + 1)}
            >
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </section>
  );
}
