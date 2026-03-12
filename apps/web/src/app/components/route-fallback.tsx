export function RouteFallback({ label = "Loading workspace…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="rounded-3xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
        {label}
      </div>
    </div>
  );
}
