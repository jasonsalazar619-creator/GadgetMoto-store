import type { HTMLAttributes } from "react";

type SurfaceVariant = "default" | "elevated" | "interactive";

type SurfaceProps = HTMLAttributes<HTMLDivElement> & {
  variant?: SurfaceVariant;
};

const surfaceClasses: Record<SurfaceVariant, string> = {
  default: "border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)]",
  elevated: "border border-white/80 bg-white shadow-[var(--shadow-lg)]",
  interactive:
    "border border-[var(--color-border)] bg-white shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] duration-[var(--duration-base)] ease-[var(--ease-standard)] hover:-translate-y-1 hover:border-[var(--color-brand)] hover:shadow-[var(--shadow-md)]",
};

export function Surface({
  variant = "default",
  className = "",
  ...props
}: SurfaceProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] p-[var(--space-component)] ${surfaceClasses[variant]} ${className}`.trim()}
      {...props}
    />
  );
}
