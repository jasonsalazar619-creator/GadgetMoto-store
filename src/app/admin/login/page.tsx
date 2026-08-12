import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/app/admin/login/login-form";
import { redirectAuthenticatedAdminFromLogin } from "@/lib/admin/server/auth";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin sign in | GadgetMoTo",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  await redirectAuthenticatedAdminFromLogin();
  const configurationAvailable = getSupabasePublicConfig() !== null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(145deg,var(--color-ice),white_55%,var(--color-sky))] px-[var(--space-page)] py-12">
      <section
        aria-labelledby="admin-login-title"
        className="w-full max-w-lg rounded-[var(--radius-xl)] border bg-white p-6 shadow-[var(--shadow-lg)] sm:p-10"
      >
        <Image
          alt="GadgetMoTo"
          className="mx-auto h-auto w-full max-w-40 rounded-[var(--radius-lg)] object-contain sm:max-w-48"
          height={900}
          priority
          sizes="(max-width: 640px) 10rem, 12rem"
          src="/brand/gadgetmoto-admin-logo.jpg"
          width={901}
        />
        <p className="mt-7 text-center type-eyebrow text-[var(--color-action)]">
          Secure staff access
        </p>
        <h1
          className="mt-3 text-center font-[family-name:var(--font-heading)] text-4xl font-bold tracking-[-0.045em] text-[var(--color-ink)]"
          id="admin-login-title"
        >
          Admin Portal
        </h1>
        <p className="mt-4 text-center leading-7 text-[var(--color-muted)]">
          Sign in with an invited staff account. Administrator authorization is
          verified against the protected staff directory.
        </p>

        <LoginForm configurationAvailable={configurationAvailable} />

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          <Link
            className="font-bold text-[var(--color-action)] underline-offset-4 hover:underline"
            href="/"
          >
            Return to the storefront
          </Link>
        </p>
      </section>
    </main>
  );
}
