import type { HTMLAttributes } from "react";

type BadgeVariant =
  | "new"
  | "sale"
  | "in-stock"
  | "low-stock"
  | "preorder"
  | "unavailable";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant: BadgeVariant;
};

const badgeClasses: Record<BadgeVariant, string> = {
  new: "bg-[var(--color-sky)] text-[#155188]",
  sale: "bg-[var(--color-sale-soft)] text-[var(--color-sale)]",
  "in-stock": "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  "low-stock": "bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
  preorder: "bg-[#eeeefe] text-[#4a3c92]",
  unavailable: "bg-[#eceff2] text-[var(--color-graphite)]",
};

export function Badge({ variant, className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-[var(--radius-round)] px-2.5 py-1 text-xs font-bold leading-none ${badgeClasses[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
