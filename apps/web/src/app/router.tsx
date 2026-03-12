import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";

import { AppShellLayout } from "./layouts/app-shell-layout";
import { RequireAuth } from "../features/auth/components/require-auth";
import { LoginPage } from "../features/auth/routes/login-page";
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
