"use server";

import { redirect } from "next/navigation";
import { getAuthenticatedAdmin } from "@/lib/admin/server/auth";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  status: "idle" | "error" | "configuration";
  message: string | null;
};

const genericLoginMessage =
  "Unable to sign in. Check your credentials and try again.";

function getCredential(formData: FormData, name: string): string | null {
  const value = formData.get(name);
  return typeof value === "string" ? value : null;
}

export async function signInAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = getCredential(formData, "email")?.trim() ?? null;
  const password = getCredential(formData, "password");

  if (
    !email ||
    !password ||
    email.length > 320 ||
    password.length > 1024 ||
    !email.includes("@")
  ) {
    return { status: "error", message: genericLoginMessage };
  }

  const supabase = await createClient();

  if (!supabase) {
    return {
      status: "configuration",
      message: "Admin authentication configuration is required.",
    };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { status: "error", message: genericLoginMessage };
  }

  const authorization = await getAuthenticatedAdmin();

  if (!authorization.ok) {
    await supabase.auth.signOut({ scope: "local" });
    return { status: "error", message: genericLoginMessage };
  }

  redirect("/admin");
}
