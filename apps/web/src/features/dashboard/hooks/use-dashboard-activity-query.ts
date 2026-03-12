import { useQuery } from "@tanstack/react-query";

import { getDashboardActivity } from "../api/dashboard-client";

export function useDashboardActivityQuery() {
  return useQuery({
    queryKey: ["dashboard", "activity"],
    queryFn: getDashboardActivity
  });
}
