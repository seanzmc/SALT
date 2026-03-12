import type { BudgetListFilters } from "@salt/types";

export type BudgetSearchState = {
  category: string;
};

export function getBudgetSearchState(searchParams: URLSearchParams): BudgetSearchState {
  return {
    category: searchParams.get("category") ?? ""
  };
}

export function toBudgetListFilters(state: BudgetSearchState): BudgetListFilters {
  return {
    category: state.category || undefined
  };
}

export function updateBudgetSearchState(
  current: URLSearchParams,
  patch: Partial<BudgetSearchState>
) {
  const next = new URLSearchParams(current);

  Object.entries(patch).forEach(([key, value]) => {
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
  });

  return next;
}
