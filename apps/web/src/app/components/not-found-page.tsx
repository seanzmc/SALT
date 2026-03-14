import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <section className="w-full max-w-lg rounded-[2rem] border border-border bg-white/90 p-8 text-center shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          SALT Business Planner
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The route you opened does not exist in SALT Business Planner.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link
            className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
            to="/dashboard"
          >
            Go to dashboard
          </Link>
          <Link
            className="rounded-2xl border border-border px-4 py-3 text-sm font-medium hover:bg-muted"
            to="/tasks"
          >
            Open tasks
          </Link>
        </div>
      </section>
    </div>
  );
}
