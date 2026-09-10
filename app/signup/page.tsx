import { Logo } from "@/components/brand/logo";
import { SignupForm } from "@/components/auth/signup-form";
import { isSupabaseConfigured } from "@/lib/env";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <Logo />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          HUMANHP keeps your wellness notes, activity, and goals in one
          private space.
        </p>
        <div className="mt-8">
          <SignupForm configured={isSupabaseConfigured()} />
        </div>
        <p className="mt-6 text-sm text-muted">
          Already have an account?{" "}
          <a className="font-medium text-ink underline-offset-4 hover:underline" href="/login">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
