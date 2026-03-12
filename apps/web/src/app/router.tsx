import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";

import { AppShellLayout } from "./layouts/app-shell-layout";
import { RequireAuth } from "../features/auth/components/require-auth";
import { LoginPage } from "../features/auth/routes/login-page";
import { TasksWorkspacePage } from "../features/tasks/routes/tasks-workspace-page";

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
        element: <Navigate replace to="/tasks" />
      },
      {
        path: "/tasks",
        element: <TasksWorkspacePage />
      },
      {
        path: "/tasks/:taskId",
        element: <TasksWorkspacePage />
      }
    ]
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
