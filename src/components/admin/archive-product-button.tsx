"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveProductAction } from "@/app/admin/(protected)/products/actions";

type ArchiveProductButtonProps = {
  productId: string;
  productName: string;
  compact?: boolean;
};

export function ArchiveProductButton({
  productId,
  productName,
  compact = false,
}: ArchiveProductButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function archive() {
    const confirmed = window.confirm(
      `Archive “${productName}”? It will be removed from public listings while its records and history are preserved.`,
    );
    if (!confirmed) return;

    setMessage(null);
    startTransition(async () => {
      const result = await archiveProductAction({
        productId,
        confirmationName: productName,
      });

      if (!result.ok) {
        setMessage(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className={compact ? "inline-grid" : "grid gap-2"}>
      <button
        className="min-h-11 rounded-[var(--radius-round)] border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-900 hover:bg-amber-100 disabled:cursor-wait disabled:opacity-60"
        disabled={pending}
        onClick={archive}
        type="button"
      >
        {pending ? "Archiving…" : "Archive"}
      </button>
      {message ? (
        <p aria-live="polite" className="text-sm text-[var(--color-error)]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
