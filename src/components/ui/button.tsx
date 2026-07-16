import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "messenger";
type ButtonSize = "small" | "medium" | "large";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[var(--color-action)] text-white hover:bg-[#15559f]",
  secondary:
    "border border-[var(--color-action)] bg-white text-[var(--color-action)] hover:bg-[var(--color-ice)]",
  ghost: "bg-transparent text-[var(--color-action)] hover:bg-[var(--color-sky)]",
  messenger: "bg-[var(--color-messenger)] text-white hover:bg-[#0754d1]",
};

const sizeClasses: Record<ButtonSize, string> = {
  small: "min-h-9 px-4 text-sm",
  medium: "min-h-11 px-5 text-base",
  large: "min-h-13 px-7 text-lg",
};

export function Button({
  className = "",
  variant = "primary",
  size = "medium",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex cursor-pointer items-center justify-center rounded-[var(--radius-round)] font-semibold transition-[background-color,color,border-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-standard)] hover:-translate-y-0.5 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim()}
      {...props}
    />
  );
}
