import Image from "next/image";

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
      <Image
        alt=""
        aria-hidden="true"
        className="size-11 shrink-0 rounded-full object-cover sm:size-12"
        height={900}
        sizes="(max-width: 639px) 2.75rem, 3rem"
        src="/brand/gadgetmoto-admin-logo.jpg"
        width={901}
      />
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
