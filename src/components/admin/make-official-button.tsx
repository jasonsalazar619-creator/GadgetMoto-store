"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { makeOfficialProductAction } from "@/app/admin/(protected)/products/actions";

type MakeOfficialButtonProps = {
  productId: string;
  disabled?: boolean;
  compact?: boolean;
};

export function MakeOfficialButton({
  productId,
  disabled = false,
  compact = false,
}: MakeOfficialButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  function makeOfficial() {
    const confirmed = window.confirm(
      "Make this product official and publish it to the live GadgetMoTo catalog?",
    );
    if (!confirmed) return;

    setMessage(null);
    setFailed(false);
    startTransition(async () => {
      const result = await makeOfficialProductAction({ productId });

      setMessage(result.message);
      setFailed(!result.ok);
      if (result.ok) {
        router.push("/admin/products?published=1");
        router.refresh();
      }
    });
  }

  return (
    <div className={compact ? "inline-grid gap-1" : "grid gap-2"}>
      <button
        className="min-h-11 rounded-[var(--radius-round)] bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled || pending}
        onClick={makeOfficial}
        type="button"
      >
        {pending ? "Publishing…" : "Make Official"}
      </button>
      {message ? (
        <p
          aria-live="polite"
          className={
            failed
              ? "text-sm text-[var(--color-error)]"
              : "text-sm font-semibold text-emerald-700"
          }
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
