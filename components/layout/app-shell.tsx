import type { ReactNode } from "react";
import { Logo } from "@/components/brand/logo";
import { LogoutButton } from "@/components/auth/logout-button";
import { AppNav } from "@/components/layout/app-nav";

type AppShellProps = {
  children: ReactNode;
  email?: string | null;
  currentPath: string;
};

export function AppShell({
  children,
  email,
  currentPath,
}: AppShellProps) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col md:flex-row">
        <aside className="border-b border-line md:sticky md:top-0 md:flex md:h-screen md:w-56 md:shrink-0 md:flex-col md:overflow-hidden md:border-b-0 md:border-r">
          <div className="flex items-center justify-between gap-4 px-4 py-4 md:flex-col md:items-stretch">
            <Logo href="/dashboard" />

            <div className="md:hidden">
              <LogoutButton />
            </div>
          </div>

          <div className="px-2 pb-3 md:flex-1 md:overflow-y-auto md:px-3">
            <AppNav currentPath={currentPath} />
          </div>

          <div className="hidden border-t border-line px-4 py-4 md:block">
            {email ? (
              <p
                className="mb-2 truncate text-xs text-muted"
                title={email}
              >
                {email}
              </p>
            ) : null}

            <LogoutButton />
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}