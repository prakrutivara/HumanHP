import Link from "next/link";

type LogoProps = {
  href?: string;
  compact?: boolean;
};

export function Logo({ href = "/", compact = false }: LogoProps) {
  const mark = (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="flex h-7 w-7 items-center justify-center rounded-md border border-line bg-accent text-[10px] font-semibold tracking-[0.14em] text-surface"
      >
        HP
      </span>
      {!compact ? (
        <span className="text-[15px] font-semibold tracking-[0.18em]">HUMANHP</span>
      ) : null}
    </span>
  );

  if (!href) {
    return mark;
  }

  return (
    <Link href={href} className="text-ink transition-opacity hover:opacity-80">
      {mark}
    </Link>
  );
}
