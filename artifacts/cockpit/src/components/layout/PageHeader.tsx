import type { ReactNode } from "react";
import { DashboardHero } from "@/components/dashboard/DashboardHero";

/**
 * Section page header. Now renders the shared compact animated coastal hero
 * (parallax waves, caustic shimmer, swimming fish, drifting boat) so every
 * section view matches the Today's Catch dashboard and the cockpit feels like
 * one unified coastal experience.
 */
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
    <div className="mb-8">
      <DashboardHero
        size="compact"
        eyebrow={tag ?? "GreggOS"}
        greeting={title}
        subtitle={typeof subtitle === "string" ? subtitle : undefined}
        action={action}
      />
      {/* render non-string subtitles (rare) below the hero */}
      {subtitle && typeof subtitle !== "string" ? (
        <p className="mt-3 text-sm text-muted-foreground max-w-2xl">{subtitle}</p>
      ) : null}
    </div>
  );
}
