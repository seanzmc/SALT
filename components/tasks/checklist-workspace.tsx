"use client";

import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition
} from "react";
import { Role } from "@prisma/client";
import { ExternalLink, LayoutList, PanelsRightBottom } from "lucide-react";

import { TaskBoard } from "@/components/tasks/task-board";
import { TaskDetailContent } from "@/components/tasks/task-detail-content";
import { TaskFilters } from "@/components/tasks/task-filters";
import { TaskListManager } from "@/components/tasks/task-list-manager";
import { TaskQueueShortcuts } from "@/components/tasks/task-queue-shortcuts";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  buildChecklistSearchParams,
  filterChecklistTasks,
  getChecklistCleanupMode,
  getChecklistQueueCounts,
  getCleanupCopy,
  getInitialChecklistState,
  type ChecklistBulkAction,
  type ChecklistTaskRecord,
  type ChecklistWorkspaceState,
  type SerializedTaskWorkspaceData
} from "@/lib/checklist-workspace";
import { cn } from "@/lib/utils";

function toChecklistHref(state: ChecklistWorkspaceState, taskId?: string) {
  const search = buildChecklistSearchParams(state, { taskId });
  const query = search.toString();
  return query ? `/checklists?${query}` : "/checklists";
}

function parseLocationState() {
  const searchParams = new URLSearchParams(window.location.search);
  const raw: Record<string, string | undefined> = {};

  searchParams.forEach((value, key) => {
    raw[key] = value;
  });

  return {
    state: getInitialChecklistState(raw),
    taskId: searchParams.get("taskId") ?? ""
  };
}

type ChecklistWorkspaceProps = {
  currentRole: Role;
  currentUserId: string;
  initialState: ChecklistWorkspaceState;
  initialSelectedTaskId?: string;
  initialSelectedTaskData?: SerializedTaskWorkspaceData | null;
  sections: Array<{ slug: string; title: string }>;
  users: Array<{ id: string; name: string; role: Role }>;
  tasks: ChecklistTaskRecord[];
};

export function ChecklistWorkspace({
  currentRole,
  currentUserId,
  initialState,
  initialSelectedTaskId,
  initialSelectedTaskData,
  sections,
  users,
  tasks
}: ChecklistWorkspaceProps) {
  const [state, setState] = useState(initialState);
  const [selectedTaskId, setSelectedTaskId] = useState(initialSelectedTaskId ?? "");
  const [detailCache, setDetailCache] = useState<Record<string, SerializedTaskWorkspaceData>>(() =>
    initialSelectedTaskId && initialSelectedTaskData
      ? { [initialSelectedTaskId]: initialSelectedTaskData }
      : {}
  );
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(state.q);
  const inFlightTaskIds = useRef(new Set<string>());

  useEffect(() => {
    setState(initialState);
  }, [initialState]);

  useEffect(() => {
    setSelectedTaskId(initialSelectedTaskId ?? "");
  }, [initialSelectedTaskId]);

  useEffect(() => {
    if (initialSelectedTaskId && initialSelectedTaskData) {
      setDetailCache((current) => ({
        ...current,
        [initialSelectedTaskId]: initialSelectedTaskData
      }));
    }
  }, [initialSelectedTaskData, initialSelectedTaskId]);

  const queueCounts = useMemo(
    () => getChecklistQueueCounts(tasks, currentUserId),
    [currentUserId, tasks]
  );

  const effectiveState = useMemo(
    () => ({
      ...state,
      q: deferredSearch
    }),
    [deferredSearch, state]
  );

  const visibleTasks = useMemo(
    () => filterChecklistTasks(tasks, effectiveState, currentUserId),
    [currentUserId, effectiveState, tasks]
  );

  const cleanupMode = getChecklistCleanupMode(state);
  const cleanupCopy = getCleanupCopy(cleanupMode);
  const selectedTaskVisible = visibleTasks.some((task) => task.id === selectedTaskId);
  const selectedTaskIndex = selectedTaskVisible
    ? visibleTasks.findIndex((task) => task.id === selectedTaskId)
    : -1;
  const previousTaskId = selectedTaskIndex > 0 ? visibleTasks[selectedTaskIndex - 1].id : undefined;
  const nextTaskId =
    selectedTaskIndex >= 0 && selectedTaskIndex < visibleTasks.length - 1
      ? visibleTasks[selectedTaskIndex + 1].id
      : undefined;
  const selectedTaskData = selectedTaskId ? detailCache[selectedTaskId] : undefined;
  const activeFilterCount = [
    Boolean(state.q),
    state.status !== "ALL",
    Boolean(state.section),
    Boolean(state.priority),
    Boolean(state.assignee),
    state.queue !== "all",
    state.archived !== "active",
    state.group !== "none",
    state.sort !== "dueDate"
  ].filter(Boolean).length;
  const visibleSections = new Set(visibleTasks.map((task) => task.section.title)).size;
  const preferredBulkAction =
    state.bulk === "assign" ||
    state.bulk === "status" ||
    state.bulk === "setDueDate" ||
    state.bulk === "shiftDueDate" ||
    state.bulk === "clearAssignee" ||
    state.bulk === "priority" ||
    state.bulk === "markComplete" ||
    state.bulk === "archive" ||
    state.bulk === "restore"
      ? (state.bulk as ChecklistBulkAction)
      : undefined;

  useEffect(() => {
    if (state.view !== "list" && selectedTaskId) {
      setSelectedTaskId("");
    }
  }, [selectedTaskId, state.view]);

  useEffect(() => {
    if (selectedTaskId && !selectedTaskVisible) {
      setSelectedTaskId("");
    }
  }, [selectedTaskId, selectedTaskVisible]);

  useEffect(() => {
    const nextHref = toChecklistHref(
      {
        ...state,
        q: deferredSearch
      },
      selectedTaskId || undefined
    );

    if (`${window.location.pathname}${window.location.search}` !== nextHref) {
      window.history.replaceState(null, "", nextHref);
    }
  }, [deferredSearch, selectedTaskId, state]);

  useEffect(() => {
    const handlePopState = () => {
      const next = parseLocationState();
      setState(next.state);
      setSelectedTaskId(next.taskId);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!selectedTaskId || detailCache[selectedTaskId] || inFlightTaskIds.current.has(selectedTaskId)) {
      return;
    }

    let cancelled = false;
    inFlightTaskIds.current.add(selectedTaskId);
    setLoadingTaskId(selectedTaskId);

    fetch(`/api/tasks/${selectedTaskId}/workspace`, {
      credentials: "same-origin"
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load task workspace.");
        }

        return (await response.json()) as SerializedTaskWorkspaceData;
      })
      .then((payload) => {
        if (cancelled) {
          return;
        }

        setDetailCache((current) => ({
          ...current,
          [selectedTaskId]: payload
        }));
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        setDetailCache((current) => ({
          ...current,
          [selectedTaskId]: {
            task: null,
            users: [],
            sections: [],
            phases: [],
            dependencyCandidates: [],
            availableDocuments: []
          }
        }));
      })
      .finally(() => {
        inFlightTaskIds.current.delete(selectedTaskId);

        if (!cancelled) {
          setLoadingTaskId((current) => (current === selectedTaskId ? null : current));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [detailCache, selectedTaskId]);

  useEffect(() => {
    if (!previousTaskId || detailCache[previousTaskId] || inFlightTaskIds.current.has(previousTaskId)) {
      return;
    }

    inFlightTaskIds.current.add(previousTaskId);

    fetch(`/api/tasks/${previousTaskId}/workspace`, {
      credentials: "same-origin"
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        return (await response.json()) as SerializedTaskWorkspaceData;
      })
      .then((payload) => {
        if (!payload) {
          return;
        }

        setDetailCache((current) => ({
          ...current,
          [previousTaskId]: payload
        }));
      })
      .catch(() => undefined)
      .finally(() => {
        inFlightTaskIds.current.delete(previousTaskId);
      });
  }, [detailCache, previousTaskId]);

  useEffect(() => {
    if (!nextTaskId || detailCache[nextTaskId] || inFlightTaskIds.current.has(nextTaskId)) {
      return;
    }

    inFlightTaskIds.current.add(nextTaskId);

    fetch(`/api/tasks/${nextTaskId}/workspace`, {
      credentials: "same-origin"
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        return (await response.json()) as SerializedTaskWorkspaceData;
      })
      .then((payload) => {
        if (!payload) {
          return;
        }

        setDetailCache((current) => ({
          ...current,
          [nextTaskId]: payload
        }));
      })
      .catch(() => undefined)
      .finally(() => {
        inFlightTaskIds.current.delete(nextTaskId);
      });
  }, [detailCache, nextTaskId]);

  function updateState(patch: Partial<ChecklistWorkspaceState>) {
    startTransition(() => {
      setState((current) => ({
        ...current,
        ...patch
      }));
    });
  }

  function handleQueueChange(queue: ChecklistWorkspaceState["queue"]) {
    updateState({
      queue,
      cleanup:
        state.cleanup === "1" &&
        (queue === "overdue" ||
          queue === "blocked" ||
          queue === "unassigned" ||
          queue === "stale" ||
          queue === "upcoming")
          ? "1"
          : ""
    });
  }

  function handleReset() {
    startTransition(() => {
      setState({
        ...initialState,
        q: "",
        status: "ALL",
        section: "",
        priority: "",
        assignee: "",
        queue: "all",
        archived: "active",
        group: "none",
        sort: "dueDate",
        cleanup: "",
        bulk: "",
        view: "list"
      });
      setSelectedTaskId("");
      window.history.replaceState(null, "", "/checklists");
    });
  }

  function handleOpenTask(taskId: string) {
    if (state.view !== "list") {
      return;
    }

    startTransition(() => {
      setSelectedTaskId(taskId);
    });

    window.history.pushState(null, "", toChecklistHref(state, taskId));
  }

  function handleCloseTask() {
    setSelectedTaskId("");
    window.history.replaceState(null, "", toChecklistHref(state));
  }

  function prefetchTask(taskId: string) {
    if (!taskId || detailCache[taskId] || inFlightTaskIds.current.has(taskId)) {
      return;
    }

    inFlightTaskIds.current.add(taskId);

    fetch(`/api/tasks/${taskId}/workspace`, {
      credentials: "same-origin"
    })
      .then(async (response) => {
        if (!response.ok) {
          return null;
        }

        return (await response.json()) as SerializedTaskWorkspaceData;
      })
      .then((payload) => {
        if (!payload) {
          return;
        }

        setDetailCache((current) => ({
          ...current,
          [taskId]: payload
        }));
      })
      .catch(() => undefined)
      .finally(() => {
        inFlightTaskIds.current.delete(taskId);
      });
  }

  const showBoardView = state.view === "board" && state.archived === "active";
  const fullPageHref = selectedTaskId
    ? `/checklists/${selectedTaskId}?${new URLSearchParams({
        returnTo: toChecklistHref(state)
      }).toString()}`
    : undefined;

  return (
    <div className="space-y-6">
      <section className="space-y-5 rounded-[2rem] border border-border/80 bg-gradient-to-br from-white via-white to-secondary/35 p-5 shadow-[0_32px_80px_-48px_rgba(15,23,42,0.55)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Workspace</Badge>
              <Badge variant="secondary">{visibleTasks.length} shown</Badge>
              {activeFilterCount ? <Badge variant="outline">{activeFilterCount} active filters</Badge> : null}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Checklist flow
              </p>
              <h2 className="text-2xl font-semibold tracking-tight">
                Search, filter, and move through tasks without losing the list.
              </h2>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
                The workspace keeps queue context stable, moves task selection into a proper shelf,
                and syncs the URL without forcing a full checklist refresh.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => updateState({ view: "list" })}
              type="button"
              variant={state.view === "list" ? "default" : "outline"}
            >
              <LayoutList className="mr-2 h-4 w-4" />
              List view
            </Button>
            <Button
              onClick={() => updateState({ view: "board" })}
              type="button"
              variant={state.view === "board" ? "default" : "outline"}
            >
              <PanelsRightBottom className="mr-2 h-4 w-4" />
              Board view
            </Button>
            <a className={cn(buttonVariants({ variant: "outline" }))} href="/api/export/tasks">
              <ExternalLink className="mr-2 h-4 w-4" />
              Export CSV
            </a>
          </div>
        </div>

        <TaskQueueShortcuts
          counts={queueCounts}
          currentQueue={state.queue}
          onChange={handleQueueChange}
        />

        <TaskFilters
          current={state}
          isUpdating={isPending}
          onChange={updateState}
          onReset={handleReset}
          sections={sections}
          users={users}
        />

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{visibleTasks.length} tasks shown</Badge>
          <Badge variant="outline">Sections: {visibleSections}</Badge>
          <Badge variant="outline">Queue: {state.queue.replaceAll("-", " ")}</Badge>
          <Badge variant="outline">Archive: {state.archived}</Badge>
        </div>
      </section>

      {cleanupMode && state.view === "list" && cleanupCopy ? (
        <Card className="rounded-[1.5rem] border-border/80 bg-card/95 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.42)]">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-medium">{cleanupCopy.title}</p>
              <p className="text-sm text-muted-foreground">{cleanupCopy.description}</p>
            </div>
            <Button onClick={() => updateState({ cleanup: "" })} type="button" variant="outline">
              Exit cleanup mode
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {visibleTasks.length === 0 ? (
        <EmptyState
          title="No tasks match the current filters"
          description="Reset the filters or search terms to reveal the seeded build-out checklist items."
        />
      ) : showBoardView ? (
        <TaskBoard tasks={visibleTasks as never} />
      ) : (
        <div
          className={cn(
            "grid gap-6 xl:items-start",
            selectedTaskId
              ? "xl:grid-cols-[minmax(0,1fr)_minmax(24rem,36vw)]"
              : "grid-cols-1"
          )}
        >
          <div className="min-w-0">
            <TaskListManager
              archiveView={state.archived}
              cleanupMode={cleanupMode}
              currentRole={currentRole}
              groupBy={state.group}
              onOpenTask={handleOpenTask}
              onPrefetchTask={prefetchTask}
              openTaskId={selectedTaskId || undefined}
              preferredBulkAction={preferredBulkAction}
              tasks={visibleTasks as never}
              users={users}
            />
          </div>

          {selectedTaskId ? (
            <aside className="min-w-0 xl:sticky xl:top-6 xl:h-[calc(100vh-3rem)] xl:self-start">
              <div className="flex h-full flex-col overflow-hidden rounded-[1.9rem] border border-border/80 bg-card/95 shadow-[0_36px_90px_-48px_rgba(15,23,42,0.65)]">
                <div className="border-b border-border/70 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Side shelf
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Task detail stays in context while the list remains visible.
                      </p>
                    </div>
                    {loadingTaskId === selectedTaskId && !selectedTaskData ? (
                      <Badge variant="outline">Loading…</Badge>
                    ) : null}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5">
                  {selectedTaskData ? (
                    <TaskDetailContent
                      compact
                      currentRole={currentRole}
                      currentUserId={currentUserId}
                      data={selectedTaskData}
                      navigation={{
                        closeLabel: "Close shelf",
                        contextLabel: "Checklist queue",
                        fullPageHref,
                        onClose: handleCloseTask,
                        onNext: nextTaskId ? () => handleOpenTask(nextTaskId) : undefined,
                        onPrevious: previousTaskId ? () => handleOpenTask(previousTaskId) : undefined
                      }}
                      notFoundBehavior="card"
                    />
                  ) : (
                    <div className="space-y-4">
                      <div className="h-24 animate-pulse rounded-[1.5rem] bg-secondary/60" />
                      <div className="h-56 animate-pulse rounded-[1.5rem] bg-secondary/40" />
                      <div className="h-40 animate-pulse rounded-[1.5rem] bg-secondary/35" />
                    </div>
                  )}
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      )}
    </div>
  );
}
