type SearchFieldProps = {
  label?: string;
  placeholder?: string;
};

export function SearchField({
  label = "Search products",
  placeholder = "Search phones and tablets",
}: SearchFieldProps) {
  return (
    <label className="block w-full">
      <span className="sr-only">{label}</span>
      <span className="flex min-h-12 items-center gap-3 rounded-[var(--radius-round)] border border-[var(--color-border-strong)] bg-white px-4 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] focus-within:border-[var(--color-action)] focus-within:shadow-[var(--focus-ring)]">
        <svg
          aria-hidden="true"
          className="size-5 shrink-0 text-[var(--color-muted)]"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
          <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        </svg>
        <input
          className="w-full bg-transparent text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]"
          name="design-system-search"
          placeholder={placeholder}
          type="search"
        />
      </span>
    </label>
  );
}
