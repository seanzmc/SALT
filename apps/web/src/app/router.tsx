import { Suspense, lazy } from "react";
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";

import { NotFoundPage } from "./components/not-found-page";
import { RouteErrorBoundary } from "./components/route-error-boundary";
import { RouteFallback } from "./components/route-fallback";
import { AppShellLayout } from "./layouts/app-shell-layout";
import { RequireAuth } from "../features/auth/components/require-auth";
import { RequireOwner } from "../features/auth/components/require-owner";

const AccountSettingsPage = lazy(() =>
  import("../features/account/routes/account-settings-page").then((module) => ({
    default: module.AccountSettingsPage
  }))
);
const AdminSetupPage = lazy(() =>
  import("../features/admin/routes/admin-setup-page").then((module) => ({
    default: module.AdminSetupPage
  }))
);
const LoginPage = lazy(() =>
  import("../features/auth/routes/login-page").then((module) => ({
    default: module.LoginPage
  }))
);
const ForgotPasswordPage = lazy(() =>
  import("../features/auth/routes/forgot-password-page").then((module) => ({
    default: module.ForgotPasswordPage
  }))
);
const ResetPasswordPage = lazy(() =>
  import("../features/auth/routes/reset-password-page").then((module) => ({
    default: module.ResetPasswordPage
  }))
);
const DashboardWorkspacePage = lazy(() =>
  import("../features/dashboard/routes/dashboard-workspace-page").then((module) => ({
    default: module.DashboardWorkspacePage
  }))
);
const BudgetWorkspacePage = lazy(() =>
  import("../features/budget/routes/budget-workspace-page").then((module) => ({
    default: module.BudgetWorkspacePage
  }))
);
const DocumentsWorkspacePage = lazy(() =>
  import("../features/documents/routes/documents-workspace-page").then((module) => ({
    default: module.DocumentsWorkspacePage
  }))
);
const MessagesWorkspacePage = lazy(() =>
  import("../features/messages/routes/messages-workspace-page").then((module) => ({
    default: module.MessagesWorkspacePage
  }))
);
const TasksWorkspacePage = lazy(() =>
  import("../features/tasks/routes/tasks-workspace-page").then((module) => ({
    default: module.TasksWorkspacePage
  }))
);
const TimelineWorkspacePage = lazy(() =>
  import("../features/timeline/routes/timeline-workspace-page").then((module) => ({
    default: module.TimelineWorkspacePage
  }))
);

function withSuspense(children: React.ReactNode, label?: string) {
  return <Suspense fallback={<RouteFallback label={label} />}>{children}</Suspense>;
}

const router = createBrowserRouter([
  {
    path: "/login",
    element: withSuspense(<LoginPage />, "Loading sign-in…"),
    errorElement: <RouteErrorBoundary />
  },
  {
    path: "/forgot-password",
    element: withSuspense(<ForgotPasswordPage />, "Loading password reset…"),
    errorElement: <RouteErrorBoundary />
  },
  {
    path: "/reset-password",
    element: withSuspense(<ResetPasswordPage />, "Loading password reset…"),
    errorElement: <RouteErrorBoundary />
  },
  {
    errorElement: <RouteErrorBoundary />,
    element: (
      <RequireAuth>
        <AppShellLayout>
          <Outlet />
        </AppShellLayout>
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate replace to="/dashboard" />
      },
      {
        path: "/dashboard",
        element: withSuspense(<DashboardWorkspacePage />, "Loading dashboard…")
      },
      {
        path: "/settings/account",
        element: withSuspense(<AccountSettingsPage />, "Loading account settings…")
      },
      {
        path: "/settings/setup",
        element: (
          <RequireOwner>
            {withSuspense(<AdminSetupPage />, "Loading setup workspace…")}
          </RequireOwner>
        )
      },
      {
        path: "/budget",
        element: withSuspense(<BudgetWorkspacePage />, "Loading budget workspace…")
      },
      {
        path: "/tasks",
        element: withSuspense(<TasksWorkspacePage />, "Loading tasks workspace…")
      },
      {
        path: "/tasks/:taskId",
        element: withSuspense(<TasksWorkspacePage />, "Loading tasks workspace…")
      },
      {
        path: "/documents",
        element: withSuspense(<DocumentsWorkspacePage />, "Loading documents…")
      },
      {
        path: "/documents/:documentId",
        element: withSuspense(<DocumentsWorkspacePage />, "Loading documents…")
      },
      {
        path: "/messages",
        element: withSuspense(<MessagesWorkspacePage />, "Loading messages…")
      },
      {
        path: "/messages/:threadId",
        element: withSuspense(<MessagesWorkspacePage />, "Loading messages…")
      },
      {
        path: "/timeline",
        element: withSuspense(<TimelineWorkspacePage />, "Loading timeline workspace…")
      },
      {
        path: "*",
        element: <NotFoundPage />
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
