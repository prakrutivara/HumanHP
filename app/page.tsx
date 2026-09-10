import { Logo } from "@/components/brand/logo";

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <Logo />
      <p className="mt-10 text-[11px] font-medium uppercase tracking-[0.2em] text-muted">
        Personal status system
      </p>
      <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-ink md:text-5xl">
        Understand your state over time.
      </h1>
      <p className="mt-4 max-w-lg text-base leading-relaxed text-muted">
        HUMANHP brings how you feel, what you do, and how you recover into one
        quiet picture — not a medical diagnosis, and not a game.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <a
          href="/signup"
          className="inline-flex h-10 items-center rounded-md bg-accent px-4 text-sm font-medium text-surface transition-opacity hover:opacity-90"
        >
          Create account
        </a>
        <a
          href="/login"
          className="inline-flex h-10 items-center rounded-md border border-line bg-surface px-4 text-sm font-medium text-ink hover:bg-accent-soft"
        >
          Sign in
        </a>
      </div>
    </div>
  );
}
