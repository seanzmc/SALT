import type { ReactNode } from "react";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type WorkspacePageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  compact?: boolean;
};

export function WorkspacePageHeader({
  eyebrow,
  title,
  description,
  actions,
  compact = false
}: WorkspacePageHeaderProps) {
  return (
    <header
      className={joinClasses(
        "flex flex-col lg:flex-row lg:items-end lg:justify-between",
        compact ? "gap-2 lg:gap-3" : "gap-4"
      )}
    >
      <div className="max-w-4xl min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1
          className={joinClasses(
            "break-words font-semibold tracking-[-0.03em] text-foreground",
            compact ? "mt-1 text-[1.9rem] md:text-[2rem]" : "mt-2 text-3xl md:text-[2.15rem]"
          )}
        >
          {title}
        </h1>
        <p
          className={joinClasses(
            "max-w-3xl text-sm text-muted-foreground [text-wrap:pretty]",
            compact ? "mt-2 leading-5 lg:max-w-2xl" : "mt-3 leading-6"
          )}
        >
          {description}
        </p>
      </div>

      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

type WorkspaceSurfaceProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function WorkspaceSurface({
  title,
  description,
  actions,
  toolbar,
  children,
  className,
  bodyClassName
}: WorkspaceSurfaceProps) {
  return (
    <section
      className={joinClasses(
        "overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(251,247,239,0.92))] shadow-[0_30px_90px_-56px_rgba(15,23,42,0.36)] ring-1 ring-slate-950/5 backdrop-blur-md",
        className
      )}
    >
      {title || description || actions || toolbar ? (
        <div className="border-b border-border/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(244,239,229,0.46))] px-5 py-5 sm:px-6">
          {title || description || actions ? (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl min-w-0">
                {title ? <h2 className="break-words text-lg font-semibold text-foreground">{title}</h2> : null}
                {description ? (
                  <p className="mt-1 text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
                    {description}
                  </p>
                ) : null}
              </div>
              {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
            </div>
          ) : null}

          {toolbar ? (
            <div
              className={joinClasses(
                Boolean(title || description || actions) &&
                  "mt-5 border-t border-border/70 pt-5"
              )}
            >
              {toolbar}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={joinClasses("min-w-0 px-5 py-5 sm:px-6 lg:px-7", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
