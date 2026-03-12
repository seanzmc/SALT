import { useQuery } from "@tanstack/react-query";

import { ApiClientError } from "../../../lib/api-client";
import { getCurrentSession } from "../api/auth-client";

export function useAuthSessionQuery() {
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: getCurrentSession,
    retry(failureCount, error) {
      if (error instanceof ApiClientError && error.status === 401) {
        return false;
      }

      return failureCount < 1;
    }
  });
}
