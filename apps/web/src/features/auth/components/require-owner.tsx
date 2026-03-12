import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

import { ApiClientError } from "../../../lib/api-client";
import { RouteFallback } from "../../../app/components/route-fallback";
import { useAuthSessionQuery } from "../hooks/use-auth-session-query";

export function RequireOwner({ children }: PropsWithChildren) {
  const sessionQuery = useAuthSessionQuery();

  if (sessionQuery.isLoading) {
    return <RouteFallback label="Loading owner workspace…" />;
  }

  if (sessionQuery.error) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4">
        <section className="w-full max-w-lg rounded-[2rem] border border-rose-200 bg-white/95 p-8 text-center shadow-[0_24px_70px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
          <p className="text-xs uppercase tracking-[0.18em] text-rose-600">Owner access error</p>
          <h1 className="mt-3 text-3xl font-semibold">Unable to confirm owner access</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {sessionQuery.error instanceof ApiClientError
              ? sessionQuery.error.message
              : "An unexpected authentication error occurred."}
          </p>
          <button
            className="mt-6 rounded-2xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground"
            onClick={() => {
              void sessionQuery.refetch();
            }}
            type="button"
          >
            Try again
          </button>
        </section>
      </div>
    );
  }

  if (sessionQuery.data?.user.role !== "OWNER_ADMIN") {
    return <Navigate replace to="/dashboard" />;
  }

  return <>{children}</>;
}
