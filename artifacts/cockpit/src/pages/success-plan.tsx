import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListSuccessPlanItems,
  useUpdateSuccessPlanItem,
  getListSuccessPlanItemsQueryKey,
} from "@workspace/api-client-react";
import type { SuccessPlanItem, SuccessPlanPhase } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const PHASES: { value: SuccessPlanPhase; label: string; blurb: string }[] = [
  {
    value: "first_90",
    label: "First 90 Days",
    blurb: "Stabilize, map the portfolio, and stand up the operating rhythm.",
  },
  {
    value: "first_180",
    label: "First 180 Days",
    blurb: "Demonstrate measurable results and operationalize the lanes.",
  },
];

export default function SuccessPlan() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useListSuccessPlanItems(undefined, {
    query: { queryKey: getListSuccessPlanItemsQueryKey() },
  });

  const updateM = useUpdateSuccessPlanItem({
    mutation: {
      onSuccess: () =>
        qc.invalidateQueries({ queryKey: getListSuccessPlanItemsQueryKey() }),
    },
  });

  const items = (data ?? []) as unknown as SuccessPlanItem[];

  const byPhase = useMemo(() => {
    const map: Record<string, SuccessPlanItem[]> = {};
    for (const phase of PHASES) map[phase.value] = [];
    for (const item of items) {
      (map[item.phase] ??= []).push(item);
    }
    for (const key of Object.keys(map)) {
      map[key]!.sort((a, b) => a.sortOrder - b.sortOrder);
    }
    return map;
  }, [items]);

  const overall = useMemo(() => {
    const done = items.filter((i) => i.completed).length;
    const pct = items.length ? Math.round((done / items.length) * 100) : 0;
    return { done, total: items.length, pct };
  }, [items]);

  async function toggle(item: SuccessPlanItem, completed: boolean) {
    try {
      await updateM.mutateAsync({ itemId: item.id, data: { completed } });
    } catch {
      toast({ title: "Could not update item", variant: "destructive" });
    }
  }

  return (
    <SidebarLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <PageHeader
          tag="My Executive Office"
          title="90 / 180-Day Success Plan"
          subtitle="The onboarding and ramp checklist for the executive client-relations and placement mandate. Track progress against the measures defined for the first 90 and 180 days."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="Overall completion"
            value={`${overall.pct}%`}
            accent="primary"
          />
          <StatCard
            label="Completed"
            value={overall.done}
            accent="accent"
          />
          <StatCard
            label="Remaining"
            value={overall.total - overall.done}
            accent={overall.total - overall.done > 0 ? "destructive" : "border"}
          />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading success plan…</p>
        ) : items.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No success-plan items yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {PHASES.map((phase) => {
              const phaseItems = byPhase[phase.value] ?? [];
              const done = phaseItems.filter((i) => i.completed).length;
              const pct = phaseItems.length
                ? Math.round((done / phaseItems.length) * 100)
                : 0;
              return (
                <div key={phase.value}>
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <h2 className="text-lg font-semibold">{phase.label}</h2>
                      <p className="text-sm text-muted-foreground">
                        {phase.blurb}
                      </p>
                    </div>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {done}/{phaseItems.length}
                    </span>
                  </div>
                  <Progress value={pct} className="mb-4 h-2" />
                  <div className="space-y-2">
                    {phaseItems.map((item) => (
                      <Card
                        key={item.id}
                        className="shadow-sm"
                        data-testid={`card-success-${item.id}`}
                      >
                        <CardContent className="p-4 flex items-start gap-3">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={(v) => toggle(item, v === true)}
                            className="mt-0.5"
                            data-testid={`checkbox-success-${item.id}`}
                          />
                          <div className="min-w-0">
                            <p
                              className={`font-medium ${
                                item.completed
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {item.title}
                            </p>
                            {item.description ? (
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            ) : null}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
