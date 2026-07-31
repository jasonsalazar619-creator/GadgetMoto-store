"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  signInAction,
  type LoginState,
} from "@/app/admin/login/actions";

const initialLoginState: LoginState = {
  status: "idle",
  message: null,
};

type LoginFormProps = {
  configurationAvailable: boolean;
};

export function LoginForm({ configurationAvailable }: LoginFormProps) {
  const [state, action, pending] = useActionState(
    signInAction,
    initialLoginState,
  );
  const message = configurationAvailable
    ? state.message
    : "Admin authentication configuration is required.";

  return (
    <form action={action} className="mt-8 grid gap-5">
      <div className="grid gap-2">
        <label className="text-sm font-bold text-[var(--color-ink)]" htmlFor="admin-email">
          Email
        </label>
        <input
          autoComplete="email"
          className="min-h-12 rounded-[var(--radius-sm)] border bg-white px-4 text-[var(--color-ink)] disabled:bg-slate-100"
          disabled={!configurationAvailable || pending}
          id="admin-email"
          inputMode="email"
          maxLength={320}
          name="email"
          required
          type="email"
        />
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-bold text-[var(--color-ink)]" htmlFor="admin-password">
          Password
        </label>
        <input
          autoComplete="current-password"
          className="min-h-12 rounded-[var(--radius-sm)] border bg-white px-4 text-[var(--color-ink)] disabled:bg-slate-100"
          disabled={!configurationAvailable || pending}
          id="admin-password"
          maxLength={1024}
          name="password"
          required
          type="password"
        />
      </div>

      <div aria-live="polite" className="min-h-6">
        {message ? (
          <p
            className={`rounded-[var(--radius-sm)] px-4 py-3 text-sm ${
              state.status === "error"
                ? "bg-[var(--color-error-soft)] text-[var(--color-error)]"
                : "bg-[var(--color-warning-soft)] text-[var(--color-warning)]"
            }`}
            role={state.status === "error" ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}
      </div>

      <Button
        className="w-full"
        disabled={!configurationAvailable || pending}
        size="large"
        type="submit"
      >
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
