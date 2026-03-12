import type { PropsWithChildren } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { ApiClientError } from "../../../lib/api-client";
import { useAuthSessionQuery } from "../hooks/use-auth-session-query";

export function RequireAuth({ children }: PropsWithChildren) {
  const location = useLocation();
  const sessionQuery = useAuthSessionQuery();

  if (sessionQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-3xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
          Loading workspace…
        </div>
      </div>
    );
  }

  if (
    sessionQuery.error instanceof ApiClientError &&
    sessionQuery.error.status === 401
  ) {
    return (
      <Navigate
        replace
        to={`/login?redirectTo=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
      />
    );
  }

  if (!sessionQuery.data) {
    return <Navigate replace to="/login" />;
  }

  return <>{children}</>;
}
