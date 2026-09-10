export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="h-3 w-16 animate-pulse rounded bg-line" />
      <div className="mt-3 h-8 w-40 animate-pulse rounded bg-line" />
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="h-28 animate-pulse rounded-lg border border-line bg-surface" />
        <div className="h-28 animate-pulse rounded-lg border border-line bg-surface" />
      </div>
    </div>
  );
}
