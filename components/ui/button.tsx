import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-accent text-surface hover:opacity-90 disabled:opacity-50",
  secondary:
    "border border-line bg-surface text-ink hover:bg-accent-soft disabled:opacity-50",
  ghost: "text-muted hover:text-ink disabled:opacity-50",
};

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-opacity ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
