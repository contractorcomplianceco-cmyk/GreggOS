import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { useMemo, useState } from "react";
import {
  useGetStaffOverview,
  getGetStaffOverviewQueryKey,
} from "@workspace/api-client-react";
import type { StaffMember, StaffOverview } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";

const WINDOWS = [
  { value: 7, label: "7 days" },
  { value: 14, label: "14 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

function scoreColor(score: number, invert = false): string {
  const high = invert ? score >= 60 : score < 40;
  const mid = score >= 40 && score < 60;
  if (high) return "text-rose-600";
  if (mid) return "text-amber-600";
  return "text-emerald-600";
}

function ScoreBar({
  value,
  tone,
}: {
  value: number;
  tone: "good" | "warn" | "bad";
}) {
  const color =
    tone === "bad"
      ? "bg-rose-500"
      : tone === "warn"
        ? "bg-amber-500"
        : "bg-emerald-500";
  return (
    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className={`h-full ${color}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function toneFor(score: number, invert = false): "good" | "warn" | "bad" {
  const bad = invert ? score >= 60 : score < 40;
  const warn = score >= 40 && score < 60;
  if (bad) return "bad";
  if (warn) return "warn";
  return "good";
}

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "Overloaded" || status === "At risk") return "destructive";
  if (status === "Stretched" || status === "Watch") return "outline";
  if (status === "Steady") return "default";
  return "secondary";
}

export default function StaffOverviewPage() {
  const [windowDays, setWindowDays] = useState<number>(14);

  const params = { windowDays };
  const { data, isLoading } = useGetStaffOverview(params, {
    query: { queryKey: getGetStaffOverviewQueryKey(params) },
  });

  const overview = data as unknown as StaffOverview | undefined;
  const staff = useMemo<StaffMember[]>(
    () => overview?.staff ?? [],
    [overview],
  );

  const summary = useMemo(() => {
    const active = staff.filter((s) => s.active).length;
    const stuck = staff.filter((s) => s.stuckScore >= 60).length;
    const burnout = staff.filter((s) => s.burnoutScore >= 60).length;
    return { active, stuck, burnout };
  }, [staff]);

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader
          tag="The Bridge"
          title="Staff Overview"
          subtitle="Team workload signals derived from live account, task, escalation, and activity data. Productivity, stuck, and burnout scores are advisory indicators to guide conversations — they are not performance ratings or HR decisions."
        />

        <div className="flex flex-wrap items-center gap-3 mb-8">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Activity window
          </Label>
          <Select
            value={String(windowDays)}
            onValueChange={(v) => setWindowDays(Number(v))}
          >
            <SelectTrigger className="w-40" data-testid="select-staff-window">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WINDOWS.map((w) => (
                <SelectItem key={w.value} value={String(w.value)}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard label="Active Staff" value={summary.active} accent="primary" />
          <StatCard label="Showing Stuck Signals" value={summary.stuck} accent="accent" />
          <StatCard label="Burnout Watch" value={summary.burnout} accent="destructive" />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading staff signals…</p>
        ) : staff.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No staff to show yet. Add staff profiles and assign accounts so
              metrics can be derived.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {staff.map((member) => (
              <Card
                key={member.name}
                className="shadow-sm"
                data-testid={`card-staff-${member.name}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="h-4 w-4 text-accent shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.title || "—"}
                          {member.focusArea ? ` · ${member.focusArea}` : ""}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariant(member.status)}>
                      {member.status}
                    </Badge>
                  </div>

                  <div className="mt-5 space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">
                          Productivity
                        </span>
                        <span
                          className={`font-semibold tabular-nums ${scoreColor(member.productivityScore)}`}
                        >
                          {member.productivityScore}
                        </span>
                      </div>
                      <ScoreBar
                        value={member.productivityScore}
                        tone={toneFor(member.productivityScore)}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Stuck</span>
                        <span
                          className={`font-semibold tabular-nums ${scoreColor(member.stuckScore, true)}`}
                        >
                          {member.stuckScore}
                        </span>
                      </div>
                      <ScoreBar
                        value={member.stuckScore}
                        tone={toneFor(member.stuckScore, true)}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Burnout</span>
                        <span
                          className={`font-semibold tabular-nums ${scoreColor(member.burnoutScore, true)}`}
                        >
                          {member.burnoutScore}
                        </span>
                      </div>
                      <ScoreBar
                        value={member.burnoutScore}
                        tone={toneFor(member.burnoutScore, true)}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                    <Metric label="Clients" value={member.clientsOwned} />
                    <Metric label="Open" value={member.openTasks} />
                    <Metric
                      label="Overdue"
                      value={member.overdueTasks}
                      warn={member.overdueTasks > 0}
                    />
                    <Metric label="Done" value={member.completedTasks} />
                    <Metric
                      label="Escal."
                      value={member.openEscalations}
                      warn={member.openEscalations > 0}
                    />
                    <Metric label="Touches" value={member.touchesDue} />
                    <Metric
                      label="Stalled"
                      value={member.stalledExpansions}
                      warn={member.stalledExpansions > 0}
                    />
                    <Metric label="Activity" value={member.recentActivity} />
                  </div>

                  {member.signals.length > 0 ? (
                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {member.signals.map((sig, i) => (
                        <span
                          key={i}
                          className="text-[11px] rounded-full bg-slate-100 text-slate-600 px-2 py-0.5"
                        >
                          {sig}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

function Metric({
  label,
  value,
  warn = false,
}: {
  label: string;
  value: number;
  warn?: boolean;
}) {
  return (
    <div>
      <p
        className={`text-lg font-semibold tabular-nums ${warn ? "text-rose-600" : "text-foreground"}`}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
