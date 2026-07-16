type BrandLockupProps = {
  variant?: "compact" | "full";
  className?: string;
};

export function BrandLockup({
  variant = "full",
  className = "",
}: BrandLockupProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <svg
        aria-hidden="true"
        className="size-11 shrink-0 sm:size-12"
        viewBox="0 0 48 48"
      >
        <circle cx="24" cy="24" r="24" fill="var(--color-brand)" />
        <rect
          x="16.5"
          y="9.5"
          width="15"
          height="29"
          rx="3.5"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
        />
        <path d="M21 13h6M22.5 34.5h3" stroke="white" strokeLinecap="round" strokeWidth="2" />
      </svg>
      <span className="flex flex-col text-left">
        <span className="font-[family-name:var(--font-heading)] text-xl font-bold tracking-[-0.04em] text-[var(--color-ink)] sm:text-2xl">
          GadgetMoTo
        </span>
        {variant === "full" ? (
          <span className="mt-0.5 text-xs font-medium text-[var(--color-muted)] sm:text-sm">
            Your Next Upgrade, Mo ’To.
          </span>
        ) : null}
      </span>
    </div>
  );
}
