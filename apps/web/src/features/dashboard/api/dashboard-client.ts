import type { DashboardActivityResponse, DashboardSummary } from "@salt/types";

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
