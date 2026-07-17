type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionHeadingProps) {
  const alignment = align === "center" ? "mx-auto items-center text-center" : "items-start";

  return (
    <div className={`section-heading flex max-w-3xl flex-col ${alignment}`}>
      {eyebrow ? <p className="type-eyebrow text-[var(--color-action)]">{eyebrow}</p> : null}
      <h2 className="type-h2 mt-4 text-[var(--color-ink)]">{title}</h2>
      {description ? (
        <p className="section-heading__copy type-body-lg mt-5 text-[var(--color-muted)]">{description}</p>
      ) : null}
    </div>
  );
}
