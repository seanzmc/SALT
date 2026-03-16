import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TimelinePhaseRecord, TimelinePhaseUpdateInput, TimelineWorkspaceData } from "@salt/types";
import { useSearchParams } from "react-router-dom";

import { ApiClientError } from "../../../lib/api-client";
import { SlideOverPanel } from "../../../app/components/slide-over-panel";
import {
  WorkspacePageHeader,
  WorkspaceSurface
} from "../../../app/components/workspace-page";
import { useToast } from "../../../app/providers/toast-provider";
import { getTimelineWorkspace, updateTimelinePhase } from "../api/timeline-client";
import { TimelinePhaseEditShelf } from "../components/timeline-phase-edit-shelf";
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

function phaseStatusClasses(status: TimelinePhaseRecord["status"]) {
  switch (status) {
    case "COMPLETE":
      return "bg-emerald-100 text-emerald-700";
    case "BLOCKED":
      return "bg-rose-100 text-rose-700";
    case "IN_PROGRESS":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function TimelineWorkspacePage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [saveError, setSaveError] = useState<string>();
  const toast = useToast();

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
      const message =
        error instanceof ApiClientError ? error.message : "Unable to update the timeline phase.";
      setSaveError(message);
      toast.error("Timeline save failed", message);

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
      toast.success("Timeline phase saved", phase.title);
    }
  });

  const phases = timelineQuery.data?.phases ?? [];
  const activePhase = useMemo(() => {
    const selectedPhaseId = searchParams.get("phase");

    return phases.find((phase) => phase.id === selectedPhaseId) ?? phases[0] ?? null;
  }, [phases, searchParams]);
  const activePhaseIndex = activePhase
    ? phases.findIndex((phase) => phase.id === activePhase.id)
    : -1;
  const editingPhase = useMemo(() => {
    const editingPhaseId = searchParams.get("editPhase");

    return phases.find((phase) => phase.id === editingPhaseId) ?? null;
  }, [phases, searchParams]);

  function setEditingPhase(phaseId?: string) {
    const next = new URLSearchParams(searchParams);

    if (phaseId) {
      next.set("editPhase", phaseId);
    } else {
      next.delete("editPhase");
    }

    setSearchParams(next, { replace: true });
  }

  return (
    <div className="space-y-6">
      <WorkspacePageHeader
        description="Treat phases as opening stages, not isolated cards. Select one stage at a time, see its identity clearly, and keep linked tasks connected to execution."
        eyebrow="Timeline"
        title="Opening timeline"
      />

      {saveError ? (
        <section className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {saveError}
        </section>
      ) : null}

      {timelineQuery.isLoading ? (
        <WorkspaceSurface bodyClassName="text-sm text-muted-foreground" title="Opening phases">
          Loading timeline workspace...
        </WorkspaceSurface>
      ) : timelineQuery.error instanceof ApiClientError ? (
        <WorkspaceSurface bodyClassName="p-0" title="Opening phases">
          <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {timelineQuery.error.message}
          </div>
        </WorkspaceSurface>
      ) : timelineQuery.data ? (
        timelineQuery.data.phases.length === 0 ? (
          <WorkspaceSurface
            bodyClassName="text-center"
            description="Seed or create phases before using the timeline workspace."
            title="Opening phases"
          >
            <div className="rounded-[1.25rem] border border-dashed border-border bg-muted/20 px-4 py-8">
              <p className="font-medium text-foreground">No timeline phases are available.</p>
            </div>
          </WorkspaceSurface>
        ) : (
          <WorkspaceSurface
            bodyClassName="space-y-6"
            description="A phase groups milestones, linked tasks, dates, and blockers for one opening stage. The navigator is built to feel like a true sequence, not a generic sidebar."
            title="Opening phases"
          >
            <TimelineOverview phases={timelineQuery.data.phases} />

            <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
              <aside className="overflow-hidden rounded-[1.4rem] border border-border/75 bg-[linear-gradient(180deg,rgba(230,244,239,0.96),rgba(255,255,255,0.84))] shadow-[0_18px_50px_-42px_rgba(15,23,42,0.35)]">
                <div className="border-b border-border/70 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Phase navigator
                  </p>
                  <p className="mt-2 font-medium text-foreground">Opening sequence</p>
                  <p className="text-sm text-muted-foreground">
                    Select the stage you want to review or update.
                  </p>
                </div>
                <div className="border-b border-border/60 bg-white/45 px-4 py-3 text-xs leading-5 text-muted-foreground">
                  Review each stage here, then use Edit for status, dates, blockers, and notes.
                  Linked tasks still open in the task workspace.
                </div>
                <div className="divide-y divide-border/60">
                  {phases.map((phase, index) => (
                    <button
                      aria-current={activePhase?.id === phase.id ? "step" : undefined}
                      key={phase.id}
                      className={[
                        "flex w-full items-start gap-3 px-4 py-4 text-left transition",
                        activePhase?.id === phase.id
                          ? "bg-white/82 shadow-[inset_4px_0_0_0_rgba(33,95,84,0.9)]"
                          : "hover:bg-white/55"
                      ].join(" ")}
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.set("phase", phase.id);
                        setSearchParams(next, { replace: true });
                      }}
                      type="button"
                    >
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-white text-sm font-semibold text-foreground shadow-sm">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-foreground">{phase.title}</p>
                          <span
                            className={[
                              "rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]",
                              phaseStatusClasses(phase.status)
                            ].join(" ")}
                          >
                            {phase.status.replaceAll("_", " ")}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {phase.tasks.length} tasks • {phase.milestones.length} milestones
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                          {phase.startDate ? phase.startDate.slice(0, 10) : "No start"} to{" "}
                          {phase.endDate ? phase.endDate.slice(0, 10) : "No end"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </aside>

              {activePhase ? (
                <TimelinePhaseCard
                  onEdit={() => setEditingPhase(activePhase.id)}
                  phase={activePhase}
                  phaseCount={phases.length}
                  phaseNumber={activePhaseIndex + 1}
                />
              ) : null}
            </div>
          </WorkspaceSurface>
        )
      ) : null}

      <SlideOverPanel onClose={() => setEditingPhase(undefined)} open={Boolean(editingPhase)}>
        {editingPhase ? (
          <TimelinePhaseEditShelf
            error={saveError}
            isSaving={
              updateMutation.isPending && updateMutation.variables?.phaseId === editingPhase.id
            }
            onClose={() => setEditingPhase(undefined)}
            onSave={async (payload: TimelinePhaseUpdateInput) => {
              await updateMutation.mutateAsync(payload);
              setEditingPhase(undefined);
            }}
            phase={editingPhase}
          />
        ) : null}
      </SlideOverPanel>
    </div>
  );
}
