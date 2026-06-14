import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

const ACCENTS = {
  primary: "bg-primary",
  accent: "bg-accent",
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
    <Card className="relative overflow-hidden shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1 ${ACCENTS[accent]}`} />
      <CardContent className="p-6">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <div className="mt-4 text-4xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}
