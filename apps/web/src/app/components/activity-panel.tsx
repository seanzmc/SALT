import { Link } from "react-router-dom";

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

  return (
    <SlideOverPanel className="sm:w-[min(28rem,calc(100vw-1rem))]" onClose={onClose} open={open} zIndexClassName="z-40">
      <div className="flex h-full flex-col">
        <div className="border-b border-border/80 px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Recent activity
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">Operational changes</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Latest task, document, and messaging changes across the rebuild workspace.
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
              Unable to load recent activity.
            </div>
          ) : activityQuery.data?.activities.length ? (
            <div className="space-y-3">
              {activityQuery.data.activities.map((activity) => {
                const href = getActivityHref(activity);
                const content = (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">{activity.description}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {activity.actor?.name ?? "System"} · {activity.entityType}
                        </p>
                      </div>
                      <span className="rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                        {activity.type.replaceAll("_", " ")}
                      </span>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                      {formatDate(activity.createdAt)}
                    </p>
                  </>
                );

                if (!href) {
                  return (
                    <div
                      key={activity.id}
                      className="rounded-[1.25rem] border border-border/80 bg-white px-4 py-4"
                    >
                      {content}
                    </div>
                  );
                }

                return (
                  <Link
                    key={activity.id}
                    className="block rounded-[1.25rem] border border-border/80 bg-white px-4 py-4 transition hover:bg-muted/60"
                    onClick={onClose}
                    to={href}
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[1.25rem] border border-dashed border-border bg-muted/30 px-4 py-5 text-sm text-muted-foreground">
              No recent activity yet.
            </div>
          )}
        </div>
      </div>
    </SlideOverPanel>
  );
}
