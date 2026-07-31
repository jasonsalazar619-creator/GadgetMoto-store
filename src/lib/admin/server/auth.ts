import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SafeAdministrator = {
  id: string;
  displayName: string;
  email: string | null;
};

export type AdminAuthFailureCode =
  | "AUTH_CONFIGURATION_MISSING"
  | "ADMIN_UNAUTHENTICATED"
  | "ADMIN_FORBIDDEN"
  | "ADMIN_PROFILE_NOT_FOUND"
  | "ADMIN_PROFILE_INACTIVE"
  | "ADMIN_SESSION_FAILED";

export type AdminAuthResult =
  | { ok: true; admin: SafeAdministrator }
  | { ok: false; code: AdminAuthFailureCode };

export const getAuthenticatedAdmin = cache(
  async (): Promise<AdminAuthResult> => {
    const supabase = await createClient();

    if (!supabase) {
      return { ok: false, code: "AUTH_CONFIGURATION_MISSING" };
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return { ok: false, code: "ADMIN_SESSION_FAILED" };
    }

    if (!user) {
      return { ok: false, code: "ADMIN_UNAUTHENTICATED" };
    }

    const { data: profile, error: profileError } = await supabase
      .from("staff_profiles")
      .select("user_id, display_name, role, is_active")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError) {
      return { ok: false, code: "ADMIN_FORBIDDEN" };
    }

    if (!profile) {
      return { ok: false, code: "ADMIN_PROFILE_NOT_FOUND" };
    }

    if (!profile.is_active) {
      return { ok: false, code: "ADMIN_PROFILE_INACTIVE" };
    }

    if (profile.role !== "administrator") {
      return { ok: false, code: "ADMIN_FORBIDDEN" };
    }

    return {
      ok: true,
      admin: {
        id: user.id,
        displayName: profile.display_name,
        email: user.email ?? null,
      },
    };
  },
);

export async function requireAuthenticatedAdmin(): Promise<SafeAdministrator> {
  const result = await getAuthenticatedAdmin();

  if (result.ok) {
    return result.admin;
  }

  if (
    result.code === "ADMIN_FORBIDDEN" ||
    result.code === "ADMIN_PROFILE_NOT_FOUND" ||
    result.code === "ADMIN_PROFILE_INACTIVE"
  ) {
    redirect("/");
  }

  const suffix =
    result.code === "AUTH_CONFIGURATION_MISSING"
      ? "?state=configuration-required"
      : "";
  redirect(`/admin/login${suffix}`);
}

export async function redirectAuthenticatedAdminFromLogin(): Promise<void> {
  const result = await getAuthenticatedAdmin();

  if (result.ok) {
    redirect("/admin");
  }
}
