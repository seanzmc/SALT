import type { BudgetListFilters } from "@salt/types";

export const budgetQueryKeys = {
  all: ["budget"] as const,
  workspace(filters: BudgetListFilters) {
    return ["budget", "workspace", filters] as const;
  }
};
