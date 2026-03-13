import type { PropsWithChildren } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  NavLink,
  matchPath,
  useLocation,
  useNavigate
} from "react-router-dom";

import { ActivityPanel } from "../components/activity-panel";
import { logout } from "../../features/auth/api/auth-client";
import { useAuthSessionQuery } from "../../features/auth/hooks/use-auth-session-query";
import { useDashboardActivityQuery } from "../../features/dashboard/hooks/use-dashboard-activity-query";

type NavigationItem = {
  to: string;
  label: string;
  description: string;
  ownerOnly?: boolean;
};

const navigationItems: NavigationItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    description: "Control surface"
  },
  {
    to: "/tasks",
    label: "Tasks",
    description: "Queue and shelf"
  },
  {
    to: "/timeline",
    label: "Timeline",
    description: "Opening phases"
  },
  {
    to: "/budget",
    label: "Budget",
    description: "Spend tracking"
  },
  {
    to: "/documents",
    label: "Documents",
    description: "Protected vault"
  },
  {
    to: "/messages",
    label: "Messages",
    description: "Thread workspace"
  },
  {
    to: "/settings/setup",
    label: "Setup",
    description: "Owner controls",
    ownerOnly: true
  }
];

const routeMeta = [
  {
    pattern: "/dashboard",
    eyebrow: "Workspace",
    title: "Dashboard",
    description: "Cross-workspace signals, active queues, and recent movement."
  },
  {
    pattern: "/tasks/:taskId",
    eyebrow: "Workspace",
    title: "Tasks",
    description: "Queue-first task flow with a shared detail shelf."
  },
  {
    pattern: "/tasks",
    eyebrow: "Workspace",
    title: "Tasks",
    description: "Queue-first task flow with a shared detail shelf."
  },
  {
    pattern: "/timeline",
    eyebrow: "Workspace",
    title: "Timeline",
    description: "Opening phases, milestones, and task context."
  },
  {
    pattern: "/budget",
    eyebrow: "Workspace",
    title: "Budget",
    description: "Budget lines, spend updates, and quote signals."
  },
  {
    pattern: "/documents/:documentId",
    eyebrow: "Workspace",
    title: "Documents",
    description: "Upload flow, protected files, and task links."
  },
  {
    pattern: "/documents",
    eyebrow: "Workspace",
    title: "Documents",
    description: "Upload flow, protected files, and task links."
  },
  {
    pattern: "/messages/:threadId",
    eyebrow: "Workspace",
    title: "Messages",
    description: "Focused thread list with reply work in a shelf."
  },
  {
    pattern: "/messages",
    eyebrow: "Workspace",
    title: "Messages",
    description: "Focused thread list with reply work in a shelf."
  },
  {
    pattern: "/settings/setup",
    eyebrow: "Settings",
    title: "Setup",
    description: "Owner-admin controls for workspace structure and users."
  },
  {
    pattern: "/settings/account",
    eyebrow: "Settings",
    title: "Account",
    description: "Profile, password, and personal access settings."
  }
];

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Z" />
      <path d="M4.5 19.5a8.5 8.5 0 0 1 15 0" />
    </svg>
  );
}

function getInitials(name?: string | null) {
  const tokens = name
    ?.trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!tokens || tokens.length === 0) {
    return "AC";
  }

  return tokens.map((token) => token[0]?.toUpperCase() ?? "").join("");
}

function getRouteMeta(pathname: string) {
  return (
    routeMeta.find((entry) => matchPath(entry.pattern, pathname)) ?? {
      eyebrow: "Workspace",
      title: "SALT",
      description: "Protected rebuild workspace."
    }
  );
}

export function AppShellLayout({ children }: PropsWithChildren) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data } = useAuthSessionQuery();
  const activityQuery = useDashboardActivityQuery();
  const [activityOpen, setActivityOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      navigate("/login", { replace: true });
    }
  });

  const meta = useMemo(() => getRouteMeta(location.pathname), [location.pathname]);
  const visibleNavigationItems = navigationItems.filter(
    (item) => !item.ownerOnly || data?.user.role === "OWNER_ADMIN"
  );
  const activityCount = activityQuery.data?.activities.length ?? 0;
  const initials = getInitials(data?.user.name);
  const accountLabel = data?.user.role === "OWNER_ADMIN" ? "Owner admin" : "Collaborator";

  useEffect(() => {
    setAccountMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!accountMenuOpen) {
      return undefined;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [accountMenuOpen]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(41,128,110,0.18),transparent_24%),radial-gradient(circle_at_top_right,rgba(245,166,35,0.12),transparent_18%),linear-gradient(180deg,rgba(253,250,244,0.98),rgba(244,239,229,1))]">
      <div className="lg:grid lg:min-h-screen lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="border-b border-white/55 bg-[rgba(255,255,255,0.58)] px-4 py-4 backdrop-blur-xl lg:border-b-0 lg:border-r lg:px-5 lg:py-6">
          <div className="lg:sticky lg:top-0 lg:flex lg:h-[calc(100vh-3rem)] lg:flex-col">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                SALT rebuild
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-foreground">
                Workspace
              </h1>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Dense, connected workspaces for launch planning, execution, and audit history.
              </p>
            </div>

            <nav className="mt-6 flex gap-2 overflow-x-auto pb-1 lg:flex-1 lg:flex-col lg:overflow-visible">
              {visibleNavigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  className={({ isActive }) =>
                    joinClasses(
                      "min-w-[10.5rem] rounded-[1.25rem] border px-4 py-3 transition lg:min-w-0",
                      isActive
                        ? "border-primary/30 bg-primary text-primary-foreground shadow-[0_14px_40px_-24px_rgba(33,95,84,0.75)]"
                        : "border-border/70 bg-white/70 text-foreground hover:bg-white"
                    )
                  }
                  to={item.to}
                >
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="mt-1 text-xs opacity-80">{item.description}</p>
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <div className="min-w-0 flex min-h-screen flex-col">
          <header className="sticky top-0 z-30 border-b border-white/55 bg-[rgba(255,251,245,0.74)] backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-[112rem] items-center justify-between gap-4 px-4 py-4 sm:px-6 xl:px-8">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {meta.eyebrow}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
                    {meta.title}
                  </h2>
                  <p className="hidden text-sm text-muted-foreground xl:block">
                    {meta.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  aria-label="Open recent activity"
                  className="relative inline-flex items-center gap-2 rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted"
                  onClick={() => setActivityOpen(true)}
                  type="button"
                >
                  <BellIcon />
                  <span className="hidden sm:inline">Activity</span>
                  {activityCount > 0 ? (
                    <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
                      {activityCount > 9 ? "9+" : activityCount}
                    </span>
                  ) : null}
                </button>

                <div className="relative" ref={accountMenuRef}>
                  <button
                    aria-expanded={accountMenuOpen}
                    aria-haspopup="menu"
                    aria-label="Open account menu"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-white text-sm font-semibold text-foreground transition hover:bg-muted"
                    onClick={() => setAccountMenuOpen((open) => !open)}
                    type="button"
                  >
                    <span className="sr-only">Account</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(33,95,84,0.16),rgba(245,166,35,0.22))]">
                      {data?.user.name ? (
                        <span aria-hidden="true">{initials}</span>
                      ) : (
                        <ProfileIcon />
                      )}
                    </span>
                  </button>

                  {accountMenuOpen ? (
                    <div className="absolute right-0 z-40 mt-2 w-[18rem] rounded-[1.2rem] border border-border bg-white p-3 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)]">
                      <div className="rounded-[1rem] bg-[linear-gradient(180deg,rgba(248,246,241,0.96),rgba(255,255,255,0.98))] px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Signed in
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">
                          {data?.user.name ?? "Account"}
                        </p>
                        <p className="text-sm text-muted-foreground">{data?.user.email}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{accountLabel}</p>
                      </div>

                      <div className="mt-3 space-y-2">
                        <NavLink
                          className="flex items-center justify-between rounded-[0.95rem] border border-border px-3 py-2.5 text-sm text-foreground transition hover:bg-muted"
                          onClick={() => setAccountMenuOpen(false)}
                          to="/settings/account"
                        >
                          <span>Account settings</span>
                          <span className="text-xs text-muted-foreground">Profile and access</span>
                        </NavLink>

                        <button
                          className="flex w-full items-center justify-between rounded-[0.95rem] border border-border px-3 py-2.5 text-sm text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70"
                          disabled={logoutMutation.isPending}
                          onClick={async () => {
                            setAccountMenuOpen(false);
                            await logoutMutation.mutateAsync();
                          }}
                          type="button"
                        >
                          <span>{logoutMutation.isPending ? "Signing out..." : "Sign out"}</span>
                          <span className="text-xs text-muted-foreground">End session</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 xl:px-8">
            <div className="mx-auto flex w-full max-w-[112rem] flex-col gap-6">{children}</div>
          </main>

          <footer className="border-t border-white/55 bg-[rgba(255,255,255,0.44)] px-4 py-4 backdrop-blur-xl sm:px-6 xl:px-8">
            <div className="mx-auto flex w-full max-w-[112rem] flex-col gap-1 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <p>SALT rebuild workspace</p>
              <p>Protected internal operations environment for planning, execution, and audit review.</p>
            </div>
          </footer>
        </div>
      </div>

      <ActivityPanel onClose={() => setActivityOpen(false)} open={activityOpen} />
    </div>
  );
}
