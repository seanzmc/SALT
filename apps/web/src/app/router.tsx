import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";

import { AppShellLayout } from "./layouts/app-shell-layout";
import { RequireAuth } from "../features/auth/components/require-auth";
import { RequireOwner } from "../features/auth/components/require-owner";
import { AccountSettingsPage } from "../features/account/routes/account-settings-page";
import { AdminSetupPage } from "../features/admin/routes/admin-setup-page";
import { LoginPage } from "../features/auth/routes/login-page";
import { ForgotPasswordPage } from "../features/auth/routes/forgot-password-page";
import { ResetPasswordPage } from "../features/auth/routes/reset-password-page";
import { DashboardWorkspacePage } from "../features/dashboard/routes/dashboard-workspace-page";
import { BudgetWorkspacePage } from "../features/budget/routes/budget-workspace-page";
import { DocumentsWorkspacePage } from "../features/documents/routes/documents-workspace-page";
import { MessagesWorkspacePage } from "../features/messages/routes/messages-workspace-page";
import { TasksWorkspacePage } from "../features/tasks/routes/tasks-workspace-page";
import { TimelineWorkspacePage } from "../features/timeline/routes/timeline-workspace-page";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />
  },
  {
    path: "/reset-password",
    element: <ResetPasswordPage />
  },
  {
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
        element: <DashboardWorkspacePage />
      },
      {
        path: "/settings/account",
        element: <AccountSettingsPage />
      },
      {
        path: "/settings/setup",
        element: (
          <RequireOwner>
            <AdminSetupPage />
          </RequireOwner>
        )
      },
      {
        path: "/budget",
        element: <BudgetWorkspacePage />
      },
      {
        path: "/tasks",
        element: <TasksWorkspacePage />
      },
      {
        path: "/tasks/:taskId",
        element: <TasksWorkspacePage />
      },
      {
        path: "/documents",
        element: <DocumentsWorkspacePage />
      },
      {
        path: "/documents/:documentId",
        element: <DocumentsWorkspacePage />
      },
      {
        path: "/messages",
        element: <MessagesWorkspacePage />
      },
      {
        path: "/messages/:threadId",
        element: <MessagesWorkspacePage />
      },
      {
        path: "/timeline",
        element: <TimelineWorkspacePage />
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
