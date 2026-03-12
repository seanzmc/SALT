import { isRouteErrorResponse, Link, useRouteError } from "react-router-dom";

export function RouteErrorBoundary() {
  const error = useRouteError();

  const message = isRouteErrorResponse(error)
    ? error.status === 404
      ? "The route you opened does not exist."
      : error.statusText || "A route error occurred."
    : error instanceof Error
      ? error.message
      : "An unexpected routing error occurred.";

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <section className="w-full max-w-lg rounded-[2rem] border border-rose-200 bg-white/95 p-8 text-center shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-rose-600">Workspace error</p>
        <h1 className="mt-3 text-3xl font-semibold">Unable to load this route</h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            className="rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
            type="button"
          >
            Reload
          </button>
          <Link
            className="rounded-2xl border border-border px-4 py-3 text-sm font-medium hover:bg-muted"
            to="/dashboard"
          >
            Go to dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}
