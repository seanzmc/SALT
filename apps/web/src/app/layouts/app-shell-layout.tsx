import type { PropsWithChildren } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import { logout } from "../../features/auth/api/auth-client";
import { useAuthSessionQuery } from "../../features/auth/hooks/use-auth-session-query";

export function AppShellLayout({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useAuthSessionQuery();
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      navigate("/login", { replace: true });
    }
  });

  return (
    <div className="min-h-screen xl:grid xl:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="border-r border-border/80 bg-white/75 px-6 py-8 backdrop-blur">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            SALT rebuild
          </p>
          <h1 className="text-2xl font-semibold">Workspace v2</h1>
          <p className="text-sm text-muted-foreground">
            Core workspaces on the rebuild stack.
          </p>
        </div>

        <nav className="mt-8 space-y-2">
          <NavLink
            className={({ isActive }) =>
              [
                "block rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-muted"
              ].join(" ")
            }
            to="/dashboard"
          >
            Dashboard
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [
                "block rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-muted"
              ].join(" ")
            }
            to="/tasks"
          >
            Tasks Workspace
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [
                "block rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-muted"
              ].join(" ")
            }
            to="/documents"
          >
            Documents
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [
                "block rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-muted"
              ].join(" ")
            }
            to="/messages"
          >
            Messages
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [
                "block rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-muted"
              ].join(" ")
            }
            to="/budget"
          >
            Budget
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              [
                "block rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-muted"
              ].join(" ")
            }
            to="/timeline"
          >
            Timeline
          </NavLink>
          {data?.user.role === "OWNER_ADMIN" ? (
            <NavLink
              className={({ isActive }) =>
                [
                  "block rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-foreground hover:bg-muted"
                ].join(" ")
              }
              to="/settings/setup"
            >
              Setup
            </NavLink>
          ) : null}
          <NavLink
            className={({ isActive }) =>
              [
                "block rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground hover:bg-muted"
              ].join(" ")
            }
            to="/settings/account"
          >
            Account
          </NavLink>
        </nav>

        <div className="mt-8 rounded-2xl border border-border bg-card/80 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Signed in</p>
          <p className="mt-2 font-medium">{data?.user.name}</p>
          <p className="text-sm text-muted-foreground">{data?.user.email}</p>
          <p className="text-sm text-muted-foreground">{data?.user.role}</p>
          <button
            className="mt-4 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
            disabled={logoutMutation.isPending}
            onClick={async () => {
              await logoutMutation.mutateAsync();
            }}
            type="button"
          >
            {logoutMutation.isPending ? "Signing out…" : "Sign out"}
          </button>
        </div>
      </aside>

      <main className="px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
