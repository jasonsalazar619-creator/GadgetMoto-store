import Link from "next/link";
import { CreateProductForm } from "@/components/admin/create-product-form";
import { getAdminDraftCreationData } from "@/lib/admin/server/products";

export default async function NewAdminProductPage() {
  const { brands, existingSlugs } = await getAdminDraftCreationData();

  return (
    <section
      aria-labelledby="new-product-title"
      className="mx-auto max-w-3xl rounded-[var(--radius-xl)] border bg-white p-6 shadow-[var(--shadow-md)] sm:p-10"
    >
      <Link
        className="font-bold text-[var(--color-action)] underline-offset-4 hover:underline"
        href="/admin/products"
      >
        ← Back to products
      </Link>
      <p className="mt-8 type-eyebrow text-[var(--color-action)]">
        New catalog record
      </p>
      <h1
        className="mt-3 font-[family-name:var(--font-heading)] text-4xl font-bold tracking-[-0.045em]"
        id="new-product-title"
      >
        Create a draft product
      </h1>
      <p className="mt-4 leading-7 text-[var(--color-muted)]">
        Start with confirmed identity fields only. The draft stays private
        until an administrator completes and validates its catalog details.
      </p>

      <CreateProductForm brands={brands} existingSlugs={existingSlugs} />
    </section>
  );
}
