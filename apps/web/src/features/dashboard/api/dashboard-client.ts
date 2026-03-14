import type {
  DashboardActivityDismissInput,
  DashboardActivityDismissResponse,
  DashboardActivityResponse,
  DashboardSummary
} from "@salt/types";

import { apiClient } from "../../../lib/api-client";

export function getDashboardSummary() {
  return apiClient<DashboardSummary>("/api/dashboard/summary", {
    method: "GET"
  });
}

export function getDashboardActivity() {
  return apiClient<DashboardActivityResponse>("/api/dashboard/activity", {
    method: "GET"
  });
}

export function dismissDashboardActivity(payload: DashboardActivityDismissInput) {
  return apiClient<DashboardActivityDismissResponse>(
    `/api/dashboard/activity/${payload.activityId}/dismiss`,
    {
      method: "POST"
    }
  );
}
