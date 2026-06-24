import type { ReactNode } from "react";

export function PageHeader({
  tag,
  title,
  subtitle,
  action,
}: {
  tag?: string;
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="relative border-b border-border pb-6 mb-8 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        {tag ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            {tag}
          </p>
        ) : null}
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground mt-2">
          {title}
        </h1>
        {subtitle ? (
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">{subtitle}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
      {/* coastal current-line accent riding the bottom border */}
      <span className="coastal-rule pointer-events-none absolute -bottom-px left-0 h-0.5 w-24 opacity-70" />
    </header>
  );
}
