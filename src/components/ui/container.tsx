import type { HTMLAttributes } from "react";

export function Container({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mx-auto w-full max-w-[var(--width-content)] px-[var(--space-page)] ${className}`.trim()}
      {...props}
    />
  );
}
