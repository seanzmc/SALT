import type { ReactNode } from "react";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

type WorkspacePageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
};

export function WorkspacePageHeader({
  eyebrow,
  title,
  description,
  actions
}: WorkspacePageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-4xl min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="mt-2 break-words text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-[2.15rem]">
          {title}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground [text-wrap:pretty]">
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
        "overflow-hidden rounded-[1.75rem] border border-white/65 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,251,244,0.88))] shadow-[0_30px_90px_-56px_rgba(15,23,42,0.42)] ring-1 ring-slate-950/5 backdrop-blur-md",
        className
      )}
    >
      {title || description || actions || toolbar ? (
        <div className="border-b border-border/70 bg-white/35 px-5 py-5 sm:px-6">
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

      <div className={joinClasses("min-w-0 px-5 py-5 sm:px-6", bodyClassName)}>{children}</div>
    </section>
  );
}
