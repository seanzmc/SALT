import { useQuery } from "@tanstack/react-query";

import { getDashboardSummary } from "../api/dashboard-client";

export function useDashboardSummaryQuery() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: getDashboardSummary
  });
}
