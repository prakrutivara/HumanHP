import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";
import { isSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const actions = [
  {
    href: "/dashboard/health",
    label: "Health",
    description: "Log a health event or record how you're feeling.",
  },
  {
    href: "/dashboard/wellness",
    label: "Wellness",
    description: "Track sleep, water, energy and mood.",
  },
  {
    href: "/dashboard/fitness",
    label: "Fitness",
    description: "Record workouts, running and movement.",
  },
  {
    href: "/dashboard/nutrition",
    label: "Nutrition",
    description: "Log meals, calories and nutrition.",
  },
  {
    href: "/dashboard/goals",
    label: "Goals",
    description: "Set personal goals and track progress.",
  },
];

export default async function DashboardPage() {
  let email: string | null = null;

  if (isSupabaseConfigured()) {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    email = user?.email ?? null;
  }

  return (
    <AppShell email={email} currentPath="/dashboard">
      <div className="max-w-4xl">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted">
          Personal Human State
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          What do you want to do today?
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {email ? `Welcome back. ` : ""}
          HUMANHP brings your health, wellness, fitness, nutrition, and goals
          together in one personal space.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <Link key={action.href} href={action.href} className="group">
              <Card>
                <div className="flex min-h-28 flex-col justify-between">
                  <div>
                    <h2 className="text-base font-medium group-hover:underline group-hover:underline-offset-4">
                      {action.label}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted">
                      {action.description}
                    </p>
                  </div>

                  <p className="mt-4 text-xs font-medium text-muted">
                    Open →
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-6">
          <Link href="/dashboard/state">
            <Card>
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                Human State
              </p>
              <h2 className="mt-2 text-lg font-medium">
                View My Human State
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                See your information brought together across the different
                parts of your life.
              </p>
            </Card>
          </Link>
        </div>

        <div className="mt-8">
          <Card>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              How HUMANHP works
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium">1. Log</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Record what happened — how you feel, what you did, what you
                  ate, and how you slept.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">2. Connect</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  HUMANHP brings information from different areas together
                  without pretending correlation is causation.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">3. Understand</p>
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  Your Human State becomes a useful picture of your habits,
                  experiences, and progress over time.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}