import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

const ACCENTS = {
  primary: "bg-primary",      /* GREGG gold */
  accent: "bg-accent",        /* sunset orange */
  destructive: "bg-destructive",
  border: "bg-border",
} as const;

export type StatCardAccent = keyof typeof ACCENTS;

export function StatCard({
  label,
  value,
  accent = "primary",
}: {
  label: string;
  value: ReactNode;
  accent?: StatCardAccent;
}) {
  return (
    <Card className="group relative overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <div className={`absolute inset-x-0 top-0 h-1 ${ACCENTS[accent]}`} />
      {/* thin gold top-sheen like the poster nameplate trim */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#e6c25a]/50 to-transparent" />
      {/* faint seabed wave wash in the corner */}
      <div className="coastal-waves pointer-events-none absolute inset-x-0 bottom-0 h-6 opacity-40" />
      {/* decorative game fish swimming in the corner */}
      <img
        src="/img-fish-mark.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute -right-4 -bottom-3 w-24 opacity-[0.08] transition-all duration-300 group-hover:opacity-[0.16] group-hover:-translate-x-1 [filter:sepia(1)_saturate(2.5)_hue-rotate(3deg)_brightness(0.85)]"
      />
      <CardContent className="relative z-10 p-6">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <div className="mt-4 font-display text-4xl font-bold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
