import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ label, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block space-y-1.5" htmlFor={inputId}>
      <span className="text-xs font-medium tracking-wide text-muted">{label}</span>
      <input
        id={inputId}
        className={`h-10 w-full rounded-md border border-line bg-surface px-3 text-sm text-ink outline-none transition-[border-color,box-shadow] placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent-soft ${className}`}
        {...props}
      />
    </label>
  );
}
