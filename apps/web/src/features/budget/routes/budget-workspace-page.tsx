import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BudgetItemRecord,
  BudgetItemUpdateInput,
  BudgetWorkspaceData
} from "@salt/types";
import { useSearchParams } from "react-router-dom";

import { ApiClientError } from "../../../lib/api-client";
import { SlideOverPanel } from "../../../app/components/slide-over-panel";
import {
  WorkspacePageHeader,
  WorkspaceSurface
} from "../../../app/components/workspace-page";
import { useToast } from "../../../app/providers/toast-provider";
import { useAuthSessionQuery } from "../../auth/hooks/use-auth-session-query";
import { budgetQueryKeys } from "../lib/query-keys";
import {
  getBudgetSearchState,
  toBudgetListFilters,
  updateBudgetSearchState
} from "../lib/url-state";
import { getBudgetWorkspace, updateBudgetItem } from "../api/budget-client";
import { BudgetItemEditShelf } from "../components/budget-item-edit-shelf";
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

  const editingItem = useMemo(() => {
    const editingItemId = searchParams.get("editItem");

    return budgetQuery.data?.items.find((item) => item.id === editingItemId) ?? null;
  }, [budgetQuery.data?.items, searchParams]);

  function setEditingItem(itemId?: string) {
    const next = new URLSearchParams(searchParams);

    if (itemId) {
      next.set("editItem", itemId);
    } else {
      next.delete("editItem");
    }

    setSearchParams(next, { replace: true });
  }

  return (
    <div className="space-y-6">
      <WorkspacePageHeader
        description="Budget lines stay grouped by category, edits move into a dedicated shelf, and the workspace leads with spend signal before row-level changes."
        eyebrow="Budget"
        title="Budget workspace"
      />

      {saveError ? (
        <section className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {saveError}
        </section>
      ) : null}

      {budgetQuery.isLoading ? (
        <WorkspaceSurface bodyClassName="text-sm text-muted-foreground" title="Budget lines">
          Loading budget workspace...
        </WorkspaceSurface>
      ) : budgetQuery.error instanceof ApiClientError ? (
        <WorkspaceSurface bodyClassName="p-0" title="Budget lines">
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {budgetQuery.error.message}
          </div>
        </WorkspaceSurface>
      ) : budgetQuery.data ? (
        budgetQuery.data.items.length === 0 ? (
          <WorkspaceSurface
            bodyClassName="text-center"
            description="Try a different category or clear the filter to see the full budget."
            title="Budget lines"
          >
            <div className="rounded-[1.25rem] border border-dashed border-border bg-muted/20 px-4 py-8">
              <p className="font-medium text-foreground">No budget items match this filter.</p>
            </div>
          </WorkspaceSurface>
        ) : (
          <WorkspaceSurface
            actions={
              <span className="rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {budgetQuery.data.items.length} lines
              </span>
            }
            bodyClassName="space-y-6"
            description="Category groups can collapse when you want less page length. Each line keeps the financial signal visible while owner edits live behind an explicit shelf action."
            title="Budget lines"
            toolbar={
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(16rem,auto)]">
                <label className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Category
                  </span>
                  <select
                    className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
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
                    {(budgetQuery.data.categories ?? []).map((category) => (
                      <option key={category.id} value={category.slug}>
                        {category.title}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="rounded-[1rem] border border-border/70 bg-white/78 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Editing rights
                  </p>
                  <p className="mt-2 text-sm leading-6 text-foreground">
                    {sessionQuery.data?.user.role === "OWNER_ADMIN"
                      ? "Owner admins can update actuals, vendor movement, payment state, and notes."
                      : "Collaborators stay in review mode here. Actuals and payment changes remain owner-admin only."}
                  </p>
                </div>
              </div>
            }
          >
            <div className="rounded-[1.25rem] border border-border/75 bg-[rgba(255,251,244,0.78)] px-5 py-4 text-sm leading-6 text-muted-foreground shadow-[0_18px_50px_-44px_rgba(15,23,42,0.3)]">
              Read left to right: first confirm the line’s estimate, actuals, and variance, then
              open Edit only when vendor or payment movement needs to change. This keeps budget work
              labeled and intentional instead of leaving the whole page in edit mode.
            </div>
            <BudgetSummaryCards totals={budgetQuery.data.totals} />
            <BudgetTable
              items={budgetQuery.data.items}
              onEdit={(itemId) => setEditingItem(itemId)}
              role={sessionQuery.data?.user.role}
            />
          </WorkspaceSurface>
        )
      ) : null}

      <SlideOverPanel onClose={() => setEditingItem(undefined)} open={Boolean(editingItem)}>
        {editingItem ? (
          <BudgetItemEditShelf
            error={saveError}
            isSaving={updateMutation.isPending && updateMutation.variables?.itemId === editingItem.id}
            item={editingItem}
            onClose={() => setEditingItem(undefined)}
            onSave={async (payload: BudgetItemUpdateInput) => {
              await updateMutation.mutateAsync(payload);
              setEditingItem(undefined);
            }}
          />
        ) : null}
      </SlideOverPanel>
    </div>
  );
}
