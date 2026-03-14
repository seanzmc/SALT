import type { DashboardAttentionQueue } from "@salt/types";
import { Link } from "react-router-dom";

type AttentionQueueCardProps = {
  title: string;
  detail: string;
  href: string;
  linkLabel: string;
  items: DashboardAttentionQueue["items"];
  breakdown?: DashboardAttentionQueue["breakdown"];
  itemHref: (taskId: string) => string;
  itemMeta: (task: DashboardAttentionQueue["items"][number]) => string;
  tone?: "default" | "warning" | "danger";
};

export function AttentionQueueCard({
  title,
  detail,
  href,
  linkLabel,
  items,
  breakdown,
  itemHref,
  itemMeta,
  tone = "default"
}: AttentionQueueCardProps) {
  return (
    <section
      className={[
        "rounded-[1.35rem] border p-4 shadow-sm lg:p-4",
        tone === "danger"
          ? "border-rose-200 bg-rose-50/80"
          : tone === "warning"
            ? "border-amber-200 bg-amber-50/80"
            : "border-border bg-white/85 backdrop-blur"
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold lg:text-[1.05rem]">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground lg:text-[13px]">{detail}</p>
        </div>
        <Link
          className="inline-flex min-h-9 items-center justify-center rounded-full border border-border px-3 py-1.5 text-center text-sm text-muted-foreground hover:bg-muted"
          to={href}
        >
          {linkLabel}
        </Link>
      </div>

      <div className="mt-3 space-y-2.5">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/35 p-3 text-sm text-muted-foreground">
            Nothing in this queue right now.
          </div>
        ) : (
          items.map((task) => (
            <Link
              key={task.id}
              className="block rounded-2xl border border-border bg-white/80 p-3.5 hover:bg-muted/60"
              to={itemHref(task.id)}
            >
              <p className="font-medium">{task.title}</p>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">{itemMeta(task)}</p>
            </Link>
          ))
        )}
      </div>

      {breakdown && breakdown.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {breakdown.map((item) => (
            <span
              key={item.label}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
            >
              {item.label}: {item.value}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
