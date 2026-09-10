"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type LoginFormProps = {
  nextPath: string;
  configured: boolean;
};

function messageForLoginError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Those credentials are not valid. Check your email and password and try again.";
  }
  if (lower.includes("email not confirmed")) {
    return "This account exists, but the email address has not been confirmed yet.";
  }
  return message;
}

export function LoginForm({ nextPath, configured }: LoginFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
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
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      const supabase = createBrowserSupabaseClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(messageForLoginError(signInError.message));
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Sign in failed. Please try again.",
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
        autoComplete="current-password"
        required
      />
      {error ? (
        <p className="text-sm text-warning" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
