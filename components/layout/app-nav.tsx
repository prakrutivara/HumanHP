import Link from "next/link";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/health", label: "Health" },
  { href: "/dashboard/wellness", label: "Wellness" },
  { href: "/dashboard/fitness", label: "Fitness" },
  { href: "/dashboard/nutrition", label: "Nutrition" },
  { href: "/dashboard/goals", label: "Goals" },
  { href: "/dashboard/state", label: "Human State" },
] as const;

type AppNavProps = {
  currentPath: string;
};

export function AppNav({ currentPath }: AppNavProps) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active =
          currentPath === item.href ||
          (item.href !== "/dashboard" &&
            currentPath.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-md px-3 py-2 text-sm transition ${
              active
                ? "bg-surface font-medium text-ink"
                : "text-muted hover:bg-surface hover:text-ink"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}