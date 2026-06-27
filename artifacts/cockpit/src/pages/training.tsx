import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTrainingModules,
  useUpdateTrainingModule,
  getListTrainingModulesQueryKey,
} from "@workspace/api-client-react";
import type { TrainingModule } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Award, GraduationCap } from "lucide-react";
import { LoadingState } from "@/components/layout/FishingSpinner";

const LEVELS: { name: string; minXp: number }[] = [
  { name: "Awareness", minXp: 0 },
  { name: "Operator", minXp: 300 },
  { name: "Strategic", minXp: 700 },
  { name: "Executive", minXp: 1200 },
  { name: "Command", minXp: 2000 },
];

function levelForXp(xp: number): { current: string; next: string | null; nextXp: number | null; floorXp: number } {
  let current = LEVELS[0]!;
  for (const l of LEVELS) {
    if (xp >= l.minXp) current = l;
  }
  const idx = LEVELS.findIndex((l) => l.name === current.name);
  const next = idx < LEVELS.length - 1 ? LEVELS[idx + 1]! : null;
  return {
    current: current.name,
    next: next ? next.name : null,
    nextXp: next ? next.minXp : null,
    floorXp: current.minXp,
  };
}

export default function Training() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useListTrainingModules();
  const updateM = useUpdateTrainingModule({
    mutation: {
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: getListTrainingModulesQueryKey() }),
    },
  });

  const [busyId, setBusyId] = useState<string | null>(null);

  const modules = (data ?? []) as unknown as TrainingModule[];

  const earnedXp = useMemo(
    () => modules.filter((m) => m.completed).reduce((s, m) => s + m.xp, 0),
    [modules],
  );
  const totalXp = useMemo(
    () => modules.reduce((s, m) => s + m.xp, 0),
    [modules],
  );
  const level = levelForXp(earnedXp);
  const completedCount = modules.filter((m) => m.completed).length;

  const progressPct = level.nextXp
    ? Math.min(
        100,
        Math.round(
          ((earnedXp - level.floorXp) / (level.nextXp - level.floorXp)) * 100,
        ),
      )
    : 100;

  const byCategory = useMemo(() => {
    const map = new Map<string, TrainingModule[]>();
    for (const m of modules) {
      const list = map.get(m.category) ?? [];
      list.push(m);
      map.set(m.category, list);
    }
    return Array.from(map.entries());
  }, [modules]);

  async function toggle(mod: TrainingModule) {
    setBusyId(mod.id);
    try {
      await updateM.mutateAsync({
        moduleId: mod.id,
        data: { completed: !mod.completed },
      });
      toast({
        title: mod.completed
          ? "Module marked incomplete"
          : `+${mod.xp} XP earned`,
      });
    } catch {
      toast({ title: "Could not update module", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <header className="border-b border-border pb-6 mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            Executive Development
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mt-2">
            Training &amp; Leveling
          </h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
            Build executive capability across compliance, CRM, AI, and client
            strategy. Complete modules to earn XP and level up.
          </p>
        </header>

        <Card className="shadow-sm mb-8 overflow-hidden">
          <div className="absolute" />
          <CardContent className="p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                    Current Level
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {level.current}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  XP Earned
                </p>
                <p className="text-2xl font-semibold tabular-nums">
                  {earnedXp}
                  <span className="text-sm text-muted-foreground">
                    {" "}
                    / {totalXp}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Modules Done
                </p>
                <p className="text-2xl font-semibold tabular-nums">
                  {completedCount}
                  <span className="text-sm text-muted-foreground">
                    {" "}
                    / {modules.length}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                <span>{level.current}</span>
                <span>{level.next ?? "Max level"}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              {level.next ? (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {(level.nextXp ?? 0) - earnedXp} XP to {level.next}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <LoadingState message="Leveling the lines…" />
        ) : modules.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              <GraduationCap className="h-6 w-6 mx-auto mb-3 opacity-50" />
              No training modules configured yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {byCategory.map(([category, mods]) => (
              <div key={category}>
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-3">
                  {category}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {mods.map((mod) => (
                    <Card
                      key={mod.id}
                      className={`shadow-sm transition-colors ${mod.completed ? "bg-primary/5" : ""}`}
                      data-testid={`card-module-${mod.id}`}
                    >
                      <CardContent className="p-5 flex items-start gap-4">
                        <Checkbox
                          checked={mod.completed}
                          disabled={busyId === mod.id}
                          onCheckedChange={() => toggle(mod)}
                          className="mt-1"
                          data-testid={`checkbox-module-${mod.id}`}
                        />
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-foreground">
                              {mod.title}
                            </p>
                            <Badge variant="secondary" className="shrink-0">
                              {mod.xp} XP
                            </Badge>
                          </div>
                          {mod.description ? (
                            <p className="mt-1 text-sm text-muted-foreground">
                              {mod.description}
                            </p>
                          ) : null}
                          <div className="mt-2 flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {mod.tier}
                            </Badge>
                            {mod.completed ? (
                              <span className="text-[11px] text-primary font-medium">
                                Completed
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
