import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";

import { useAuthSessionQuery } from "../hooks/use-auth-session-query";

export function RequireOwner({ children }: PropsWithChildren) {
  const sessionQuery = useAuthSessionQuery();

  if (sessionQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="rounded-3xl border border-border bg-card px-6 py-4 text-sm text-muted-foreground shadow-sm">
          Loading owner workspace…
        </div>
      </div>
    );
  }

  if (sessionQuery.data?.user.role !== "OWNER_ADMIN") {
    return <Navigate replace to="/dashboard" />;
  }

  return <>{children}</>;
}
