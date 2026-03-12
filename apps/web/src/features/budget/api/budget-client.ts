import type {
  BudgetItemRecord,
  BudgetItemUpdateInput,
  BudgetListFilters,
  BudgetWorkspaceData
} from "@salt/types";

import { apiClient } from "../../../lib/api-client";

function buildBudgetQuery(filters: BudgetListFilters) {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `/api/budget?${query}` : "/api/budget";
}

export function getBudgetWorkspace(filters: BudgetListFilters) {
  return apiClient<BudgetWorkspaceData>(buildBudgetQuery(filters), {
    method: "GET"
  });
}

export function updateBudgetItem(payload: BudgetItemUpdateInput) {
  return apiClient<BudgetItemRecord>(`/api/budget/items/${payload.itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
