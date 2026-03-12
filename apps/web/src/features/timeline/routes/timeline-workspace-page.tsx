import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TimelinePhaseRecord, TimelinePhaseUpdateInput, TimelineWorkspaceData } from "@salt/types";

import { ApiClientError } from "../../../lib/api-client";
import { getTimelineWorkspace, updateTimelinePhase } from "../api/timeline-client";
import { TimelineOverview } from "../components/timeline-overview";
import { TimelinePhaseCard } from "../components/timeline-phase-card";
import { timelineQueryKeys } from "../lib/query-keys";

function patchTimelineWorkspace(
  current: TimelineWorkspaceData | undefined,
  phaseId: string,
  patch: Partial<TimelinePhaseRecord>
) {
  if (!current) {
    return current;
  }

  return {
    ...current,
    phases: current.phases.map((phase) =>
      phase.id === phaseId
        ? {
            ...phase,
            ...patch,
            updatedAt: patch.updatedAt ?? new Date().toISOString()
          }
        : phase
    )
  };
}

export function TimelineWorkspacePage() {
  const queryClient = useQueryClient();
  const [saveError, setSaveError] = useState<string>();

  const timelineQuery = useQuery({
    queryKey: timelineQueryKeys.workspace,
    queryFn: getTimelineWorkspace
  });

  const updateMutation = useMutation({
    mutationFn: updateTimelinePhase,
    onMutate: async (payload) => {
      setSaveError(undefined);
      await queryClient.cancelQueries({ queryKey: timelineQueryKeys.workspace });
      const previousWorkspace = queryClient.getQueryData<TimelineWorkspaceData>(
        timelineQueryKeys.workspace
      );

      queryClient.setQueryData<TimelineWorkspaceData>(
        timelineQueryKeys.workspace,
        (current) =>
          patchTimelineWorkspace(current, payload.phaseId, {
            status: payload.status,
            notes: payload.notes,
            blockers: payload.blockers,
            startDate: payload.startDate,
            endDate: payload.endDate
          })
      );

      return { previousWorkspace };
    },
    onError: (error, _payload, context) => {
      setSaveError(
        error instanceof ApiClientError ? error.message : "Unable to update the timeline phase."
      );

      if (context?.previousWorkspace) {
        queryClient.setQueryData(timelineQueryKeys.workspace, context.previousWorkspace);
      }
    },
    onSuccess: (phase) => {
      setSaveError(undefined);
      queryClient.setQueryData<TimelineWorkspaceData>(
        timelineQueryKeys.workspace,
        (current) => patchTimelineWorkspace(current, phase.id, phase)
      );
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "activity"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    }
  });

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Timeline v2</p>
        <h2 className="mt-2 text-3xl font-semibold">Opening sequence workspace</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Phase-level operational planning with status, blockers, notes, dates, and direct links
          back into the task workspace.
        </p>
      </section>

      {saveError ? (
        <section className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {saveError}
        </section>
      ) : null}

      {timelineQuery.isLoading ? (
        <section className="rounded-[1.75rem] border border-border bg-white/85 p-6 text-sm text-muted-foreground shadow-sm backdrop-blur">
          Loading timeline workspace…
        </section>
      ) : timelineQuery.error instanceof ApiClientError ? (
        <section className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {timelineQuery.error.message}
        </section>
      ) : timelineQuery.data ? (
        timelineQuery.data.phases.length === 0 ? (
          <section className="rounded-[1.75rem] border border-dashed border-border bg-card/80 p-8 text-center shadow-sm">
            <p className="font-medium">No timeline phases are available.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Seed or create phases before using the timeline workspace.
            </p>
          </section>
        ) : (
          <>
          <TimelineOverview phases={timelineQuery.data.phases} />

          <div className="space-y-4">
            {timelineQuery.data.phases.map((phase) => (
              <TimelinePhaseCard
                key={phase.id}
                isSaving={updateMutation.isPending && updateMutation.variables?.phaseId === phase.id}
                onSave={async (payload: TimelinePhaseUpdateInput) => {
                  await updateMutation.mutateAsync(payload);
                }}
                phase={phase}
              />
            ))}
          </div>
          </>
        )
      ) : null}
    </div>
  );
}
