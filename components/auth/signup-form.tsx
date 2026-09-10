"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SignupFormProps = {
  configured: boolean;
};

function messageForSignupError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (lower.includes("password")) {
    return message;
  }
  return message;
}

export function SignupForm({ configured }: SignupFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!configured) {
    return (
      <p className="rounded-md border border-line bg-accent-soft/60 px-3 py-3 text-sm leading-relaxed text-ink">
        Supabase is not configured. Copy <code className="font-medium">.env.example</code> to{" "}
        <code className="font-medium">.env.local</code> and add your project URL and anon
        key.
      </p>
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(messageForSignupError(signUpError.message));
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setInfo(
        "Account created. If email confirmation is enabled in Supabase, confirm your inbox before signing in.",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Sign up failed. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={6}
        required
      />
      {error ? (
        <p className="text-sm text-warning" role="alert">
          {error}
        </p>
      ) : null}
      {info ? (
        <p className="text-sm text-muted" role="status">
          {info}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
