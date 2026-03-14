import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DashboardActivityResponse } from "@salt/types";
import { Link } from "react-router-dom";

import { ApiClientError } from "../../lib/api-client";
import { useToast } from "../providers/toast-provider";
import { dismissDashboardActivity } from "../../features/dashboard/api/dashboard-client";
import { useDashboardActivityQuery } from "../../features/dashboard/hooks/use-dashboard-activity-query";
import { SlideOverPanel } from "./slide-over-panel";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function getActivityHref(activity: {
  entityType: string;
  entityId: string;
  task: {
    id: string;
  } | null;
}) {
  if (activity.task?.id) {
    return `/tasks/${activity.task.id}`;
  }

  if (activity.entityType === "Document" || activity.entityType === "TaskAttachment") {
    return `/documents/${activity.entityId}`;
  }

  if (activity.entityType === "Message") {
    return "/messages";
  }

  return null;
}

export function ActivityPanel({
  open,
  onClose
}: {
  open: boolean;
  onClose: () => void;
}) {
  const activityQuery = useDashboardActivityQuery();
  const queryClient = useQueryClient();
  const toast = useToast();
  const dismissMutation = useMutation({
    mutationFn: dismissDashboardActivity,
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["dashboard", "activity"] });
      const previousActivity = queryClient.getQueryData<DashboardActivityResponse>([
        "dashboard",
        "activity"
      ]);

      queryClient.setQueryData<DashboardActivityResponse>(["dashboard", "activity"], (current) =>
        current
          ? {
              ...current,
              activities: current.activities.filter((activity) => activity.id !== payload.activityId)
            }
          : current
      );

      return { previousActivity };
    },
    onError: (error, _payload, context) => {
      if (context?.previousActivity) {
        queryClient.setQueryData(["dashboard", "activity"], context.previousActivity);
      }

      const message =
        error instanceof ApiClientError ? error.message : "Unable to hide this item from your feed.";
      toast.error("Hide failed", message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "activity"] });
    }
  });

  return (
    <SlideOverPanel className="sm:w-[min(28rem,calc(100vw-1rem))]" onClose={onClose} open={open} zIndexClassName="z-40">
      <div className="flex h-full flex-col">
        <div className="border-b border-border/80 px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Activity
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">Activity feed</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Latest task, document, and messaging changes across the workspace. Hidden items stay out of this feed.
              </p>
            </div>
            <button
              className="rounded-full border border-border bg-white px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {activityQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-[1.25rem] bg-muted/70"
                />
              ))}
            </div>
          ) : activityQuery.error ? (
            <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
              Unable to load the activity feed.
            </div>
          ) : activityQuery.data?.activities.length ? (
            <div className="space-y-3">
              {activityQuery.data.activities.map((activity) => {
                const href = getActivityHref(activity);
                const isDismissPending =
                  dismissMutation.isPending &&
                  dismissMutation.variables?.activityId === activity.id;
                const body = (
                  <div className="min-w-0 flex-1">
                    {href ? (
                      <Link
                        className="block rounded-[1rem] px-1 py-1 transition hover:bg-muted/60"
                        onClick={onClose}
                        to={href}
                      >
                        <p className="font-medium text-foreground">{activity.description}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activity.actor?.name ?? "System"} · {activity.entityType}
                        </p>
                      </Link>
                    ) : (
                      <>
                        <p className="font-medium text-foreground">{activity.description}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activity.actor?.name ?? "System"} · {activity.entityType}
                        </p>
                      </>
                    )}
                  </div>
                );

                return (
                  <article
                    key={activity.id}
                    className="rounded-[1.25rem] border border-border/80 bg-white px-4 py-4"
                  >
                    <div className="flex items-start gap-3">
                      {body}
                      <div className="flex flex-col items-end gap-2">
                        <span className="rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                          {activity.type.replaceAll("_", " ")}
                        </span>
                        <button
                          className="text-xs font-medium text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={isDismissPending}
                          onClick={() => {
                            void dismissMutation.mutateAsync({ activityId: activity.id });
                          }}
                          type="button"
                        >
                          {isDismissPending ? "Hiding..." : "Hide from feed"}
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {formatDate(activity.createdAt)}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : (
            <div
              className="rounded-[1.25rem] border border-dashed border-border bg-muted/30 px-4 py-5 text-sm text-muted-foreground"
            >
              No activity in this feed right now.
            </div>
          )}
        </div>
      </div>
    </SlideOverPanel>
  );
}
