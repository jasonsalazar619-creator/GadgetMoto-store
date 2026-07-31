import type { Metadata } from "next";
import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { signOutAction } from "@/app/admin/(protected)/actions";
import { requireAuthenticatedAdmin } from "@/lib/admin/server/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin | GadgetMoTo",
  robots: { index: false, follow: false },
};

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const admin = await requireAuthenticatedAdmin();

  return (
    <div className="min-h-screen bg-[var(--color-ice)] lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="hidden min-h-screen flex-col bg-[var(--color-ink)] p-6 text-white lg:flex">
        <div className="rounded-[var(--radius-md)] bg-white p-4">
          <BrandLockup variant="compact" />
        </div>
        <p className="mt-5 type-eyebrow text-sky-300">Admin workspace</p>
        <nav aria-label="Admin navigation" className="mt-8 grid gap-2">
          <Link
            className="rounded-[var(--radius-sm)] px-4 py-3 font-bold hover:bg-white/10"
            href="/admin"
          >
            Dashboard
          </Link>
          <Link
            className="rounded-[var(--radius-sm)] px-4 py-3 font-bold hover:bg-white/10"
            href="/admin/products"
          >
            Products
          </Link>
          <Link
            className="rounded-[var(--radius-sm)] px-4 py-3 font-bold hover:bg-white/10"
            href="/admin/products/new"
          >
            Add product
          </Link>
        </nav>
        <div className="mt-auto border-t border-white/15 pt-5">
          <p className="font-bold">{admin.displayName}</p>
          {admin.email ? (
            <p className="mt-1 break-all text-sm text-slate-300">{admin.email}</p>
          ) : null}
          <form action={signOutAction} className="mt-4">
            <button
              className="min-h-11 w-full rounded-[var(--radius-round)] border border-white/25 px-4 font-bold hover:bg-white hover:text-[var(--color-ink)]"
              type="submit"
            >
              Logout
            </button>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="border-b bg-white px-[var(--space-page)] py-4 lg:hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <BrandLockup variant="compact" />
            <form action={signOutAction}>
              <button
                className="min-h-11 rounded-[var(--radius-round)] border px-4 text-sm font-bold text-[var(--color-action)]"
                type="submit"
              >
                Logout
              </button>
            </form>
          </div>
          <nav
            aria-label="Mobile admin navigation"
            className="mt-4 flex gap-2 overflow-x-auto pb-1"
          >
            <Link
              className="min-h-11 shrink-0 rounded-[var(--radius-round)] bg-[var(--color-action)] px-5 py-2.5 font-bold text-white"
              href="/admin"
            >
              Dashboard
            </Link>
            <Link
              className="min-h-11 shrink-0 rounded-[var(--radius-round)] border bg-white px-5 py-2.5 font-bold text-[var(--color-action)]"
              href="/admin/products"
            >
              Products
            </Link>
            <Link
              className="min-h-11 shrink-0 rounded-[var(--radius-round)] border bg-white px-5 py-2.5 font-bold text-[var(--color-action)]"
              href="/admin/products/new"
            >
              Add product
            </Link>
          </nav>
        </header>

        <main className="mx-auto w-full max-w-[90rem] p-[var(--space-page)]">
          {children}
        </main>
      </div>
    </div>
  );
}
