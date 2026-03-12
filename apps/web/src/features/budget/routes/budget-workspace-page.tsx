import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BudgetItemRecord,
  BudgetItemUpdateInput,
  BudgetWorkspaceData
} from "@salt/types";
import { useSearchParams } from "react-router-dom";

import { ApiClientError } from "../../../lib/api-client";
import { useToast } from "../../../app/providers/toast-provider";
import { useAuthSessionQuery } from "../../auth/hooks/use-auth-session-query";
import { budgetQueryKeys } from "../lib/query-keys";
import {
  getBudgetSearchState,
  toBudgetListFilters,
  updateBudgetSearchState
} from "../lib/url-state";
import { getBudgetWorkspace, updateBudgetItem } from "../api/budget-client";
import { BudgetSummaryCards } from "../components/budget-summary-cards";
import { BudgetTable } from "../components/budget-table";

function patchBudgetWorkspace(
  current: BudgetWorkspaceData | undefined,
  itemId: string,
  patch: Partial<BudgetItemRecord>
) {
  if (!current) {
    return current;
  }

  const items = current.items.map((item) =>
    item.id === itemId
        ? {
            ...item,
            ...patch,
            variance:
              patch.actual !== undefined
                ? patch.actual - item.estimate
                : patch.estimate !== undefined
                  ? item.actual - patch.estimate
                  : item.variance,
            updatedAt: patch.updatedAt ?? new Date().toISOString()
          }
        : item
  );

  const totals = items.reduce(
    (acc, item) => {
      acc.estimated += item.estimate;
      acc.actual += item.actual;

      if (item.openingPriority === "MUST_HAVE_BEFORE_OPENING") {
        acc.mustHave += item.estimate;
      } else {
        acc.optional += item.estimate;
      }

      return acc;
    },
    {
      estimated: 0,
      actual: 0,
      variance: 0,
      mustHave: 0,
      optional: 0
    }
  );

  totals.variance = totals.actual - totals.estimated;

  return {
    ...current,
    items,
    totals
  };
}

export function BudgetWorkspacePage() {
  const queryClient = useQueryClient();
  const sessionQuery = useAuthSessionQuery();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [saveError, setSaveError] = useState<string>();
  const searchState = getBudgetSearchState(searchParams);
  const filters = useMemo(() => toBudgetListFilters(searchState), [searchState]);
  const workspaceKey = budgetQueryKeys.workspace(filters);

  const budgetQuery = useQuery({
    queryKey: workspaceKey,
    queryFn: () => getBudgetWorkspace(filters),
    placeholderData: (previous) => previous
  });

  const updateMutation = useMutation({
    mutationFn: updateBudgetItem,
    onMutate: async (payload) => {
      setSaveError(undefined);
      await queryClient.cancelQueries({ queryKey: workspaceKey });
      const previousWorkspace = queryClient.getQueryData<BudgetWorkspaceData>(workspaceKey);

      queryClient.setQueryData<BudgetWorkspaceData>(
        workspaceKey,
        (current) =>
          patchBudgetWorkspace(current, payload.itemId, {
            actual: payload.actual,
            vendor: payload.vendor,
            paidStatus: payload.paidStatus,
            notes: payload.notes
          })
      );

      return { previousWorkspace };
    },
    onError: (error, _payload, context) => {
      const message =
        error instanceof ApiClientError ? error.message : "Unable to update the budget item.";
      setSaveError(message);
      toast.error("Budget save failed", message);

      if (context?.previousWorkspace) {
        queryClient.setQueryData(workspaceKey, context.previousWorkspace);
      }
    },
    onSuccess: (item) => {
      setSaveError(undefined);
      queryClient.setQueryData<BudgetWorkspaceData>(
        workspaceKey,
        (current) => patchBudgetWorkspace(current, item.id, item)
      );
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "activity"] });
      toast.success("Budget item saved", item.lineItem);
    }
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Budget v2</p>
        <h2 className="mt-2 text-3xl font-semibold">Operational spending workspace</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Category-filtered budget tracking with inline actuals, payment status updates, and the
          same budget formulas as the legacy SALT control surface.
        </p>
      </section>

      {budgetQuery.data ? <BudgetSummaryCards totals={budgetQuery.data.totals} /> : null}

      <section className="rounded-[1.75rem] border border-border bg-white/85 p-5 shadow-sm backdrop-blur">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Category
            </span>
            <select
              className="w-full rounded-2xl border border-border bg-card px-4 py-3"
              onChange={(event) =>
                setSearchParams(
                  updateBudgetSearchState(searchParams, {
                    category: event.target.value
                  })
                )
              }
              value={searchState.category}
            >
              <option value="">All categories</option>
              {(budgetQuery.data?.categories ?? []).map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {saveError ? (
        <section className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {saveError}
        </section>
      ) : null}

      {budgetQuery.isLoading ? (
        <section className="rounded-[1.75rem] border border-border bg-white/85 p-6 text-sm text-muted-foreground shadow-sm backdrop-blur">
          Loading budget workspace…
        </section>
      ) : budgetQuery.error instanceof ApiClientError ? (
        <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {budgetQuery.error.message}
        </section>
      ) : budgetQuery.data ? (
        budgetQuery.data.items.length === 0 ? (
          <section className="rounded-[1.75rem] border border-dashed border-border bg-card/80 p-8 text-center shadow-sm">
            <p className="font-medium">No budget items match this filter.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try a different category or clear the filter to see the full budget.
            </p>
          </section>
        ) : (
          <BudgetTable
            items={budgetQuery.data.items}
            onSave={async (payload: BudgetItemUpdateInput) => {
              await updateMutation.mutateAsync(payload);
            }}
            role={sessionQuery.data?.user.role}
            savingItemId={updateMutation.variables?.itemId}
          />
        )
      ) : null}
    </div>
  );
}
