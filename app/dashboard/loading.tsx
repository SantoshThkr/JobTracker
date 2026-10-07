export default function DashboardLoading() {
  return (
    <main className="container mx-auto grid gap-8 px-4 py-8" aria-busy="true">
      <p className="sr-only" role="status">
        Loading…
      </p>
      <div className="h-12 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </main>
  );
}
