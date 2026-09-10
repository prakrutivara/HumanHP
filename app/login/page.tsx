import { Logo } from "@/components/brand/logo";
import { LoginForm } from "@/components/auth/login-form";
import { isSupabaseConfigured } from "@/lib/env";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; config?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") ? params.next : "/dashboard";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Logo />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Continue to your HUMANHP dashboard. Your records stay tied to your
          account.
        </p>
        <div className="mt-8">
          <LoginForm
            nextPath={nextPath}
            configured={isSupabaseConfigured()}
          />
        </div>
        <p className="mt-6 text-sm text-muted">
          New here?{" "}
          <a className="font-medium text-ink underline-offset-4 hover:underline" href="/signup">
            Create an account
          </a>
        </p>
      </div>
    </div>
  );
}
