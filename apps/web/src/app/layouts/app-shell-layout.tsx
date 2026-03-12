import type { PropsWithChildren } from "react";
import { NavLink } from "react-router-dom";

import { useAuthSessionQuery } from "../../features/auth/hooks/use-auth-session-query";

export function AppShellLayout({ children }: PropsWithChildren) {
  const { data } = useAuthSessionQuery();

  return (
    <div className="min-h-screen xl:grid xl:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="border-r border-border/80 bg-white/75 px-6 py-8 backdrop-blur">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            SALT rebuild
          </p>
          <h1 className="text-2xl font-semibold">Workspace v2</h1>
          <p className="text-sm text-muted-foreground">
            Tasks Workspace milestone scaffold.
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
            to="/tasks"
          >
            Tasks Workspace
          </NavLink>
        </nav>

        <div className="mt-8 rounded-2xl border border-border bg-card/80 p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Signed in</p>
          <p className="mt-2 font-medium">{data?.user.name}</p>
          <p className="text-sm text-muted-foreground">{data?.user.role}</p>
        </div>
      </aside>

      <main className="px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
