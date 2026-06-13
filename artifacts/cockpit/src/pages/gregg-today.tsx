import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { Fragment, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  useListRelationships,
  useListExpansionPipeline,
  useGetActivityReport,
  useGetExpansionReport,
  type RelationshipSummary,
  type ExpansionOpportunity,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  Flag,
  AlertTriangle,
  Activity,
  Radar,
  ListChecks,
  Snowflake,
  TrendingUp,
  TrendingDown,
  Plane,
  Receipt,
  GraduationCap,
  Sparkles,
  MessageSquarePlus,
  Compass,
  Search,
  ChevronRight,
  Phone,
  Radio,
  Zap,
  ShieldAlert,
  CircleDot,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Filter =
  | "All"
  | "Critical"
  | "High Risk"
  | "Overdue Touch"
  | "Has Escalation"
  | "Opportunity";

const FILTERS: Filter[] = [
  "All",
  "Critical",
  "High Risk",
  "Overdue Touch",
  "Has Escalation",
  "Opportunity",
];

const riskRank: Record<string, number> = {
  Low: 20,
  Medium: 45,
  High: 72,
  Critical: 92,
};

function riskScore(level: string): number {
  return riskRank[level] ?? 30;
}

function riskTone(level: string): string {
  if (level === "Critical") return "text-red-400";
  if (level === "High") return "text-orange-400";
  if (level === "Medium") return "text-amber-400";
  return "text-emerald-400";
}

function riskBar(level: string): string {
  if (level === "Critical") return "bg-red-500";
  if (level === "High") return "bg-orange-500";
  if (level === "Medium") return "bg-amber-400";
  return "bg-emerald-500";
}

function engagementScore(r: RelationshipSummary): number {
  const cadence = r.touchCadenceDays || 30;
  const days = r.daysSinceTouch ?? cadence;
  const ratio = days / cadence;
  let score = 100 - Math.min(ratio, 2.2) * 34;
  if (r.warmth === "Cold") score -= 26;
  else if (r.warmth === "Cool") score -= 12;
  else if (r.warmth === "Hot") score += 6;
  return Math.max(5, Math.min(100, Math.round(score)));
}

function engTone(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 45) return "bg-amber-400";
  return "bg-red-500";
}

function dayKey(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function GreggToday() {
  const { clients, tasks, escalations, signals, callNotes } = useStore();
  const { data: relationships } = useListRelationships();
  const { data: pipeline } = useListExpansionPipeline();
  const { data: activityReport } = useGetActivityReport();
  const { data: expansionReport } = useGetExpansionReport();

  const [filter, setFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const rels = (relationships ?? []) as RelationshipSummary[];
  const pipe = (pipeline ?? []) as ExpansionOpportunity[];
  const relByClient = useMemo(() => {
    const m = new Map<string, RelationshipSummary>();
    for (const r of rels) m.set(r.clientId, r);
    return m;
  }, [rels]);

  const openEscalations = escalations.filter(
    (e) => e.status === "Open" || e.status === "Under Review",
  );
  const escClientIds = new Set(openEscalations.map((e) => e.clientId));
  const greggTasks = tasks.filter(
    (t) => t.owner === "Gregg" && t.status !== "Completed",
  );
  const today = new Date();
  const overdueTasks = greggTasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return !isNaN(d.getTime()) && d < today;
  });

  const clientName = (id: string) =>
    clients.find((c) => c.id === id)?.clientName ?? "Unknown account";

  // ---- Global risk pulse -------------------------------------------------
  const criticalClients = clients.filter((c) => c.riskLevel === "Critical");
  const highRiskClients = clients.filter((c) => c.riskLevel === "High");
  const pulse: { level: string; tone: string; ring: string; label: string } =
    criticalClients.length > 0 ||
    openEscalations.some((e) => e.riskLevel === "Critical")
      ? {
          level: "red",
          tone: "bg-red-500",
          ring: "shadow-[0_0_14px_rgba(239,68,68,0.7)]",
          label: "Critical exposure",
        }
      : highRiskClients.length > 0 ||
          openEscalations.length > 0 ||
          overdueTasks.length > 0
        ? {
            level: "yellow",
            tone: "bg-amber-400",
            ring: "shadow-[0_0_14px_rgba(251,191,36,0.6)]",
            label: "Elevated watch",
          }
        : {
            level: "green",
            tone: "bg-emerald-500",
            ring: "shadow-[0_0_14px_rgba(16,185,129,0.6)]",
            label: "Portfolio stable",
          };

  // ---- Row 1: Red flags --------------------------------------------------
  const redFlags = [
    ...criticalClients.map((c) => ({
      id: `rf-c-${c.id}`,
      clientId: c.id,
      label: `${c.clientName} — critical risk`,
      meta: c.clientStatus,
    })),
    ...openEscalations
      .filter((e) => e.riskLevel === "Critical" || e.riskLevel === "High")
      .map((e) => ({
        id: `rf-e-${e.id}`,
        clientId: e.clientId,
        label: `${clientName(e.clientId)} — ${e.reason}`,
        meta: `${e.riskLevel} • due ${e.deadline || "—"}`,
      })),
    ...overdueTasks.map((t) => ({
      id: `rf-t-${t.id}`,
      clientId: t.clientId,
      label: `Overdue: ${t.title}`,
      meta: `${clientName(t.clientId)} • ${t.dueDate}`,
    })),
  ].slice(0, 8);

  // ---- Row 1: Anomaly detection -----------------------------------------
  const anomalies: { id: string; clientId: string; label: string; tag: string }[] =
    [];
  for (const r of rels) {
    const cadence = r.touchCadenceDays || 30;
    if ((r.daysSinceTouch ?? 0) > cadence * 2) {
      anomalies.push({
        id: `an-silence-${r.clientId}`,
        clientId: r.clientId,
        label: `${r.clientName}: silent ${r.daysSinceTouch}d (2x cadence)`,
        tag: "Contact gap",
      });
    }
    if (r.warmth === "Cold" && r.openExpansionCount > 0) {
      anomalies.push({
        id: `an-coldopp-${r.clientId}`,
        clientId: r.clientId,
        label: `${r.clientName}: cold with ${r.openExpansionCount} open expansion`,
        tag: "Revenue at risk",
      });
    }
  }
  for (const o of pipe) {
    if (o.stalled) {
      anomalies.push({
        id: `an-stall-${o.milestone.id}`,
        clientId: o.milestone.clientId,
        label: `${o.clientName}: ${o.milestone.title} stalled ${o.daysSinceMovement}d`,
        tag: "Pipeline stall",
      });
    }
  }
  const escCountByClient = new Map<string, number>();
  for (const e of openEscalations)
    escCountByClient.set(
      e.clientId,
      (escCountByClient.get(e.clientId) ?? 0) + 1,
    );
  for (const [cid, n] of escCountByClient) {
    if (n >= 2) {
      anomalies.push({
        id: `an-esccluster-${cid}`,
        clientId: cid,
        label: `${clientName(cid)}: ${n} active escalations`,
        tag: "Escalation cluster",
      });
    }
  }
  const anomalyList = anomalies.slice(0, 8);

  // ---- Row 1: Opportunity radar -----------------------------------------
  const openSignals = signals.filter((s) => s.status === "Open");
  const topExpansion = pipe
    .slice()
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 5);

  // ---- Row 2: Executive priorities --------------------------------------
  const execPriorities = clients
    .filter((c) => c.greggPriority === "Urgent" || c.greggPriority === "High")
    .sort(
      (a, b) =>
        (b.greggPriority === "Urgent" ? 1 : 0) -
          (a.greggPriority === "Urgent" ? 1 : 0) ||
        riskScore(b.riskLevel) - riskScore(a.riskLevel),
    )
    .slice(0, 7);

  // ---- Row 2: Nurturing signal feed -------------------------------------
  const touchesDue = rels
    .filter(
      (r) => r.cadenceState === "Overdue" || r.cadenceState === "Due soon",
    )
    .sort((a, b) => (b.daysSinceTouch ?? 0) - (a.daysSinceTouch ?? 0));
  const goingCold = rels.filter((r) => r.warmth === "Cold");

  // ---- Row 2: Risk timeline (horizontal log) ----------------------------
  const timeline = [
    ...openEscalations.map((e) => ({
      id: `tl-e-${e.id}`,
      clientId: e.clientId,
      date: e.deadline || "",
      label: e.reason,
      sub: clientName(e.clientId),
      tone: "red" as const,
    })),
    ...signals.slice(0, 12).map((s) => ({
      id: `tl-s-${s.id}`,
      clientId: s.clientId,
      date: (s.createdAt || "").slice(0, 10),
      label: s.type,
      sub: clientName(s.clientId),
      tone: "blue" as const,
    })),
    ...callNotes
      .filter((n) => (n.escalationFlags ?? "").trim().length > 0)
      .slice(0, 8)
      .map((n) => ({
        id: `tl-n-${n.id}`,
        clientId: n.clientId,
        date: (n.callDate || n.createdAt || "").slice(0, 10),
        label: "Escalation flag",
        sub: clientName(n.clientId),
        tone: "amber" as const,
      })),
  ]
    .filter((x) => x.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 14);

  // ---- Row 3: RingCentral insight feed ----------------------------------
  const insightFeed = callNotes
    .slice()
    .sort((a, b) =>
      (a.callDate || a.createdAt) < (b.callDate || b.createdAt) ? 1 : -1,
    )
    .slice(0, 8);

  // ---- Row 3: Weekly trend (7-day buckets) ------------------------------
  const trendData = useMemo(() => {
    const days: { name: string; calls: number; signals: number; key: string }[] =
      [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({
        name: dayKey(d),
        key: localDateKey(d),
        calls: 0,
        signals: 0,
      });
    }
    const idx = new Map(days.map((d) => [d.key, d]));
    for (const n of callNotes) {
      const k = (n.callDate || n.createdAt || "").slice(0, 10);
      const bucket = idx.get(k);
      if (bucket) bucket.calls += 1;
    }
    for (const s of signals) {
      const k = (s.createdAt || "").slice(0, 10);
      const bucket = idx.get(k);
      if (bucket) bucket.signals += 1;
    }
    return days;
  }, [callNotes, signals]);

  // ---- Row 3: Top client movement ---------------------------------------
  const movement = rels
    .map((r) => {
      const cadence = r.touchCadenceDays || 30;
      const days = r.daysSinceTouch ?? cadence;
      return { r, momentum: cadence - days };
    })
    .sort((a, b) => b.momentum - a.momentum);
  const gainers = movement.filter((m) => m.momentum > 0).slice(0, 5);
  const decliners = movement
    .filter((m) => m.momentum < 0)
    .sort((a, b) => a.momentum - b.momentum)
    .slice(0, 5);

  // ---- Client Health Map + Nurturing Center -----------------------------
  const matchesFilter = (c: (typeof clients)[number]): boolean => {
    const r = relByClient.get(c.id);
    switch (filter) {
      case "Critical":
        return c.riskLevel === "Critical";
      case "High Risk":
        return c.riskLevel === "High" || c.riskLevel === "Critical";
      case "Overdue Touch":
        return r?.cadenceState === "Overdue";
      case "Has Escalation":
        return escClientIds.has(c.id);
      case "Opportunity":
        return (r?.openExpansionCount ?? 0) > 0 || c.opportunitySignals > 0;
      default:
        return true;
    }
  };

  const visibleClients = clients
    .filter((c) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        c.clientName.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q)
      );
    })
    .filter(matchesFilter)
    .sort((a, b) => riskScore(b.riskLevel) - riskScore(a.riskLevel));

  const urgencyFor = (c: (typeof clients)[number]) => {
    const r = relByClient.get(c.id);
    const overdue = r?.cadenceState === "Overdue";
    const cold = r?.warmth === "Cold";
    if (c.riskLevel === "Critical" || escClientIds.has(c.id))
      return { label: "Immediate", tone: "text-red-400 bg-red-500/15" };
    if (c.riskLevel === "High" || (overdue && cold))
      return { label: "High", tone: "text-orange-400 bg-orange-500/15" };
    if (overdue || cold || c.opportunitySignals > 0)
      return { label: "Monitor", tone: "text-amber-400 bg-amber-500/15" };
    return { label: "Stable", tone: "text-emerald-400 bg-emerald-500/15" };
  };

  const suggestedAction = (c: (typeof clients)[number]) => {
    const r = relByClient.get(c.id);
    if (escClientIds.has(c.id)) return "Resolve open escalation";
    if (c.riskLevel === "Critical") return "Executive intervention call";
    if (r?.cadenceState === "Overdue") return "Re-establish contact now";
    if (r?.warmth === "Cold") return "Warm-up touch / schedule visit";
    if ((r?.openExpansionCount ?? 0) > 0) return "Advance expansion conversation";
    return c.nextAction || "Maintain cadence";
  };

  const oppType = (c: (typeof clients)[number]) => {
    const r = relByClient.get(c.id);
    if ((r?.openExpansionCount ?? 0) > 0) return "Expansion";
    if (c.opportunitySignals > 0) return "Signal open";
    if (c.clientStatus === "Renewal Pending") return "Renewal";
    return "—";
  };

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const clock = today.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const modules = [
    { name: "Travel", href: "/travel", icon: Plane },
    { name: "Expenses", href: "/expenses", icon: Receipt },
    { name: "Training", href: "/training", icon: GraduationCap },
    { name: "Prompts", href: "/prompt-library", icon: Sparkles },
    { name: "Feedback", href: "/feedback", icon: MessageSquarePlus },
    { name: "Motivation", href: "/motivation", icon: Compass },
  ];

  return (
    <SidebarLayout>
      <div className="min-h-full bg-[#0B1220] text-slate-200 font-sans">
        {/* HEADER BAR */}
        <header className="sticky top-0 z-20 border-b border-[#1c2942] bg-[#0B1220]/95 backdrop-blur px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`h-2.5 w-2.5 rounded-full ${pulse.tone} ${pulse.ring}`}
              />
              <h1 className="text-lg font-bold tracking-tight text-white">
                GreggOS{" "}
                <span className="text-sky-400">Command Center</span>
              </h1>
              <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400 border border-emerald-500/30 rounded px-1.5 py-0.5">
                Operational
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right leading-tight">
                <div className="text-xs font-medium text-slate-300 tabular-nums">
                  {formattedDate}
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 tabular-nums">
                  {clock} local
                </div>
              </div>
              <div className="flex items-center gap-2 rounded border border-[#1c2942] bg-[#0e1729] px-2.5 py-1.5">
                <span className="text-[9px] uppercase tracking-[0.16em] text-slate-500">
                  Risk Pulse
                </span>
                <span
                  className={`h-2 w-2 rounded-full ${pulse.tone} ${pulse.ring}`}
                />
                <span className="text-[11px] font-medium text-slate-300">
                  {pulse.label}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-5 space-y-4">
          {/* GLOBAL CONTROLS */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search accounts…"
                className="w-full rounded border border-[#1c2942] bg-[#0e1729] py-1.5 pl-8 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-sky-500/60 focus:outline-none"
                data-testid="input-search-clients"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                    filter === f
                      ? "bg-sky-500 text-white"
                      : "border border-[#1c2942] bg-[#0e1729] text-slate-400 hover:text-slate-200 hover:border-sky-500/40"
                  }`}
                  data-testid={`chip-filter-${f}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* ROW 1 — CRITICAL SIGNALS (RED ZONE) */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <Panel
              tone="red"
              icon={Flag}
              title="Red Flags"
              count={redFlags.length}
            >
              <FeedList
                items={redFlags.map((f) => ({
                  id: f.id,
                  clientId: f.clientId,
                  primary: f.label,
                  secondary: f.meta,
                  tone: "red",
                }))}
                empty="No critical alerts."
              />
            </Panel>

            <Panel
              tone="red"
              icon={Zap}
              title="Anomaly Detection"
              count={anomalyList.length}
            >
              <div className="space-y-1.5">
                {anomalyList.map((a) => (
                  <Link key={a.id} href={`/clients/${a.clientId}`}>
                    <div className="group flex items-start gap-2 rounded px-1.5 py-1 hover:bg-white/5 cursor-pointer">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400" />
                      <div className="min-w-0">
                        <p className="truncate text-[11px] text-slate-200 leading-snug">
                          {a.label}
                        </p>
                        <span className="text-[9px] uppercase tracking-[0.12em] text-orange-400/80">
                          {a.tag}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
                {anomalyList.length === 0 && (
                  <p className="px-1.5 text-[11px] text-slate-500">
                    No anomalies detected.
                  </p>
                )}
              </div>
            </Panel>

            <Panel
              icon={Activity}
              title="Client Health Map"
              count={visibleClients.length}
            >
              <div className="space-y-1">
                {visibleClients.slice(0, 7).map((c) => (
                  <Link key={c.id} href={`/clients/${c.id}`}>
                    <div className="group grid grid-cols-[1fr_auto] items-center gap-2 rounded px-1.5 py-1 hover:bg-white/5 cursor-pointer">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-slate-200">
                          {c.clientName}
                        </p>
                        <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-[#1c2942]">
                          <div
                            className={`h-full ${riskBar(c.riskLevel)}`}
                            style={{ width: `${riskScore(c.riskLevel)}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-semibold uppercase tracking-[0.1em] ${riskTone(
                          c.riskLevel,
                        )}`}
                      >
                        {c.riskLevel}
                      </span>
                    </div>
                  </Link>
                ))}
                {visibleClients.length === 0 && (
                  <p className="px-1.5 text-[11px] text-slate-500">
                    No accounts match.
                  </p>
                )}
              </div>
            </Panel>

            <Panel
              icon={Radar}
              title="Opportunity Radar"
              count={openSignals.length + topExpansion.length}
            >
              <div className="space-y-1.5">
                {topExpansion.map((o) => (
                  <Link
                    key={o.milestone.id}
                    href={`/clients/${o.milestone.clientId}`}
                  >
                    <div className="group flex items-center justify-between gap-2 rounded px-1.5 py-1 hover:bg-white/5 cursor-pointer">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-slate-200">
                          {o.clientName}
                        </p>
                        <p className="truncate text-[10px] text-slate-500">
                          {o.milestone.title}
                        </p>
                      </div>
                      <span className="shrink-0 rounded bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-sky-400">
                        {o.priorityScore}
                      </span>
                    </div>
                  </Link>
                ))}
                {openSignals.slice(0, 3).map((s) => (
                  <Link key={s.id} href={`/clients/${s.clientId}`}>
                    <div className="group flex items-center gap-2 rounded px-1.5 py-1 hover:bg-white/5 cursor-pointer">
                      <CircleDot className="h-3 w-3 shrink-0 text-emerald-400" />
                      <p className="truncate text-[11px] text-slate-300">
                        {clientName(s.clientId)}: {s.type}
                      </p>
                    </div>
                  </Link>
                ))}
                {openSignals.length + topExpansion.length === 0 && (
                  <p className="px-1.5 text-[11px] text-slate-500">
                    No open opportunities.
                  </p>
                )}
              </div>
            </Panel>
          </div>

          {/* ROW 2 — EXECUTIVE ACTION LAYER */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <Panel
              icon={Flag}
              title="Today's Executive Priorities"
              count={execPriorities.length}
            >
              <div className="space-y-1.5">
                {execPriorities.map((c) => (
                  <Link key={c.id} href={`/clients/${c.id}`}>
                    <div className="group rounded px-1.5 py-1 hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[11px] font-medium text-slate-200">
                          {c.clientName}
                        </p>
                        <span
                          className={`shrink-0 text-[9px] font-bold uppercase tracking-[0.1em] ${
                            c.greggPriority === "Urgent"
                              ? "text-red-400"
                              : "text-sky-400"
                          }`}
                        >
                          {c.greggPriority}
                        </span>
                      </div>
                      <p className="truncate text-[10px] text-slate-500">
                        {c.nextAction || "No action set"}
                      </p>
                    </div>
                  </Link>
                ))}
                {execPriorities.length === 0 && (
                  <p className="px-1.5 text-[11px] text-slate-500">
                    Nothing flagged urgent.
                  </p>
                )}
              </div>
            </Panel>

            <Panel
              tone="red"
              icon={ShieldAlert}
              title="Escalation Stream"
              count={openEscalations.length}
            >
              <div className="space-y-1.5">
                {openEscalations.slice(0, 7).map((e) => (
                  <Link key={e.id} href={`/clients/${e.clientId}`}>
                    <div className="group rounded px-1.5 py-1 hover:bg-white/5 cursor-pointer">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[11px] font-medium text-slate-200">
                          {e.reason}
                        </p>
                        <span
                          className={`shrink-0 text-[9px] font-bold uppercase ${riskTone(
                            e.riskLevel,
                          )}`}
                        >
                          {e.riskLevel}
                        </span>
                      </div>
                      <p className="truncate text-[10px] text-slate-500">
                        {clientName(e.clientId)} • due {e.deadline || "—"}
                      </p>
                    </div>
                  </Link>
                ))}
                {openEscalations.length === 0 && (
                  <p className="px-1.5 text-[11px] text-slate-500">
                    No open escalations.
                  </p>
                )}
              </div>
            </Panel>

            <Panel
              icon={Snowflake}
              title="Nurturing Signal Feed"
              count={touchesDue.length + goingCold.length}
            >
              <div className="space-y-1.5">
                {touchesDue.slice(0, 4).map((r) => (
                  <Link key={`td-${r.clientId}`} href={`/clients/${r.clientId}`}>
                    <div className="group flex items-center justify-between gap-2 rounded px-1.5 py-1 hover:bg-white/5 cursor-pointer">
                      <p className="truncate text-[11px] text-slate-200">
                        {r.clientName}
                      </p>
                      <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-amber-400">
                        {r.cadenceState}
                      </span>
                    </div>
                  </Link>
                ))}
                {goingCold.slice(0, 3).map((r) => (
                  <Link key={`gc-${r.clientId}`} href={`/clients/${r.clientId}`}>
                    <div className="group flex items-center justify-between gap-2 rounded px-1.5 py-1 hover:bg-white/5 cursor-pointer">
                      <p className="truncate text-[11px] text-slate-200">
                        {r.clientName}
                      </p>
                      <span className="shrink-0 rounded bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-sky-400">
                        Cold {r.daysSinceTouch ?? "—"}d
                      </span>
                    </div>
                  </Link>
                ))}
                {touchesDue.length + goingCold.length === 0 && (
                  <p className="px-1.5 text-[11px] text-slate-500">
                    Cadence current.
                  </p>
                )}
              </div>
            </Panel>

            <Panel icon={ListChecks} title="Risk Timeline" count={timeline.length}>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {timeline.map((t) => (
                  <Link key={t.id} href={`/clients/${t.clientId}`}>
                    <div className="group w-32 shrink-0 rounded border border-[#1c2942] bg-[#0b1322] p-2 hover:border-sky-500/40 cursor-pointer">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            t.tone === "red"
                              ? "bg-red-500"
                              : t.tone === "amber"
                                ? "bg-amber-400"
                                : "bg-sky-400"
                          }`}
                        />
                        <span className="text-[9px] tabular-nums text-slate-500">
                          {t.date}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-[10px] font-medium text-slate-200">
                        {t.label}
                      </p>
                      <p className="truncate text-[9px] text-slate-500">
                        {t.sub}
                      </p>
                    </div>
                  </Link>
                ))}
                {timeline.length === 0 && (
                  <p className="px-1.5 text-[11px] text-slate-500">
                    No recent risk events.
                  </p>
                )}
              </div>
            </Panel>
          </div>

          {/* ROW 3 — SYSTEM INTELLIGENCE LAYER */}
          <Panel
            icon={Radio}
            title="RingCentral Insight Feed"
            count={insightFeed.length}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2">
              {insightFeed.map((n) => (
                <Link key={n.id} href={`/clients/${n.clientId}`}>
                  <div className="group h-full rounded border border-[#1c2942] bg-[#0b1322] p-2.5 hover:border-sky-500/40 cursor-pointer">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-300">
                        <Phone className="h-3 w-3 text-sky-400" />
                        {n.callType}
                      </span>
                      <span className="text-[9px] tabular-nums text-slate-500">
                        {(n.callDate || n.createdAt || "").slice(0, 10)}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-[11px] font-medium text-slate-200">
                      {clientName(n.clientId)}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-500">
                      {n.cleanSummary || n.clientConcern || n.rawRingCentralNote}
                    </p>
                    {(n.escalationFlags ?? "").trim() && (
                      <span className="mt-1 inline-block rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-red-400">
                        Flagged
                      </span>
                    )}
                  </div>
                </Link>
              ))}
              {insightFeed.length === 0 && (
                <p className="px-1.5 text-[11px] text-slate-500">
                  No call activity logged.
                </p>
              )}
            </div>
          </Panel>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
            <div className="xl:col-span-2">
              <Panel icon={TrendingUp} title="Weekly Trend Analytics">
                <div className="mb-2 flex gap-4">
                  <Stat
                    label="Calls (7d)"
                    value={trendData.reduce((s, d) => s + d.calls, 0)}
                  />
                  <Stat
                    label="Signals (7d)"
                    value={trendData.reduce((s, d) => s + d.signals, 0)}
                  />
                  <Stat
                    label="Open Tasks"
                    value={activityReport?.openTasks ?? greggTasks.length}
                  />
                  <Stat
                    label="Pipeline"
                    value={
                      expansionReport
                        ? `$${Math.round(
                            expansionReport.pipelineValue / 1000,
                          )}k`
                        : "—"
                    }
                  />
                </div>
                <ResponsiveContainer width="100%" height={170}>
                  <AreaChart
                    data={trendData}
                    margin={{ top: 5, right: 8, left: -22, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gCalls" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#38bdf8"
                          stopOpacity={0.5}
                        />
                        <stop
                          offset="100%"
                          stopColor="#38bdf8"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient id="gSig" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="#34d399"
                          stopOpacity={0.5}
                        />
                        <stop
                          offset="100%"
                          stopColor="#34d399"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#1c2942"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={{ stroke: "#1c2942" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0e1729",
                        border: "1px solid #1c2942",
                        borderRadius: 6,
                        fontSize: 11,
                        color: "#e2e8f0",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="calls"
                      name="Calls"
                      stroke="#38bdf8"
                      fill="url(#gCalls)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="signals"
                      name="Signals"
                      stroke="#34d399"
                      fill="url(#gSig)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Panel>
            </div>

            <Panel icon={TrendingUp} title="Top Client Movement">
              <div className="space-y-2">
                <div>
                  <p className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-400">
                    <TrendingUp className="h-3 w-3" /> Gainers
                  </p>
                  {gainers.map((m) => (
                    <Link key={`g-${m.r.clientId}`} href={`/clients/${m.r.clientId}`}>
                      <div className="group flex items-center justify-between gap-2 rounded px-1.5 py-0.5 hover:bg-white/5 cursor-pointer">
                        <p className="truncate text-[11px] text-slate-200">
                          {m.r.clientName}
                        </p>
                        <span className="shrink-0 text-[10px] font-semibold tabular-nums text-emerald-400">
                          +{m.momentum}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {gainers.length === 0 && (
                    <p className="px-1.5 text-[10px] text-slate-500">None.</p>
                  )}
                </div>
                <div>
                  <p className="mb-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-red-400">
                    <TrendingDown className="h-3 w-3" /> Decliners
                  </p>
                  {decliners.map((m) => (
                    <Link key={`d-${m.r.clientId}`} href={`/clients/${m.r.clientId}`}>
                      <div className="group flex items-center justify-between gap-2 rounded px-1.5 py-0.5 hover:bg-white/5 cursor-pointer">
                        <p className="truncate text-[11px] text-slate-200">
                          {m.r.clientName}
                        </p>
                        <span className="shrink-0 text-[10px] font-semibold tabular-nums text-red-400">
                          {m.momentum}
                        </span>
                      </div>
                    </Link>
                  ))}
                  {decliners.length === 0 && (
                    <p className="px-1.5 text-[10px] text-slate-500">None.</p>
                  )}
                </div>
              </div>
            </Panel>
          </div>

          {/* CLIENT NURTURING CENTER — data-heavy table */}
          <Panel
            icon={Activity}
            title="Client Nurturing Center"
            count={visibleClients.length}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1c2942] text-[9px] uppercase tracking-[0.12em] text-slate-500">
                    <th className="px-2 py-1.5 font-semibold">Client</th>
                    <th className="px-2 py-1.5 font-semibold">Engagement</th>
                    <th className="px-2 py-1.5 font-semibold">Risk</th>
                    <th className="px-2 py-1.5 font-semibold">Opportunity</th>
                    <th className="px-2 py-1.5 font-semibold">
                      Next Suggested Action
                    </th>
                    <th className="px-2 py-1.5 font-semibold">Urgency</th>
                    <th className="px-2 py-1.5" />
                  </tr>
                </thead>
                <tbody>
                  {visibleClients.map((c) => {
                    const r = relByClient.get(c.id);
                    const eng = r ? engagementScore(r) : 50;
                    const urg = urgencyFor(c);
                    const isOpen = expanded === c.id;
                    return (
                      <Fragment key={c.id}>
                        <tr
                          onClick={() => setExpanded(isOpen ? null : c.id)}
                          className="cursor-pointer border-b border-[#141f36] hover:bg-white/5"
                          data-testid={`row-client-${c.id}`}
                        >
                          <td className="px-2 py-1.5">
                            <p className="text-[12px] font-medium text-slate-100">
                              {c.clientName}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {c.companyName}
                            </p>
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#1c2942]">
                                <div
                                  className={`h-full ${engTone(eng)}`}
                                  style={{ width: `${eng}%` }}
                                />
                              </div>
                              <span className="text-[10px] tabular-nums text-slate-400">
                                {eng}
                              </span>
                            </div>
                          </td>
                          <td className="px-2 py-1.5">
                            <span
                              className={`text-[10px] font-semibold uppercase ${riskTone(
                                c.riskLevel,
                              )}`}
                            >
                              {c.riskLevel}
                            </span>
                          </td>
                          <td className="px-2 py-1.5">
                            <span className="text-[11px] text-slate-300">
                              {oppType(c)}
                            </span>
                          </td>
                          <td className="px-2 py-1.5">
                            <span className="text-[11px] text-slate-300">
                              {suggestedAction(c)}
                            </span>
                          </td>
                          <td className="px-2 py-1.5">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] ${urg.tone}`}
                            >
                              {urg.label}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 text-right">
                            <ChevronRight
                              className={`inline h-3.5 w-3.5 text-slate-500 transition-transform ${
                                isOpen ? "rotate-90" : ""
                              }`}
                            />
                          </td>
                        </tr>
                        {isOpen && (
                          <tr className="bg-[#0b1322]">
                            <td colSpan={7} className="px-3 py-2.5">
                              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 md:grid-cols-4">
                                <Detail label="Status" value={c.clientStatus} />
                                <Detail
                                  label="Owner"
                                  value={c.nextOwner || "—"}
                                />
                                <Detail
                                  label="Warmth"
                                  value={r?.warmth ?? "—"}
                                />
                                <Detail
                                  label="Cadence"
                                  value={r?.cadenceState ?? "—"}
                                />
                                <Detail
                                  label="Last Contact"
                                  value={c.lastMeaningfulContact || "—"}
                                />
                                <Detail
                                  label="Open Tasks"
                                  value={String(c.openTasks)}
                                />
                                <Detail
                                  label="Escalations"
                                  value={String(c.escalations)}
                                />
                                <Detail
                                  label="Signals"
                                  value={String(c.opportunitySignals)}
                                />
                                {c.missingInformation && (
                                  <div className="col-span-2 md:col-span-4">
                                    <Detail
                                      label="Missing Info"
                                      value={c.missingInformation}
                                    />
                                  </div>
                                )}
                              </div>
                              <Link href={`/clients/${c.id}`}>
                                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-sky-400 hover:underline cursor-pointer">
                                  Open account <ChevronRight className="h-3 w-3" />
                                </span>
                              </Link>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                  {visibleClients.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-2 py-4 text-center text-[11px] text-slate-500"
                      >
                        No accounts match the current filter or search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* ROW 4 — COMMAND MODULES (secondary) */}
          <div>
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Command Modules
            </p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {modules.map((m) => {
                const Icon = m.icon;
                return (
                  <Link key={m.name} href={m.href}>
                    <div className="group flex flex-col items-center justify-center gap-1.5 rounded border border-[#1c2942] bg-[#0e1729] py-3 hover:border-sky-500/40 hover:bg-[#101c33] cursor-pointer">
                      <Icon className="h-4 w-4 text-slate-400 group-hover:text-sky-400" />
                      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400 group-hover:text-slate-200">
                        {m.name}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}

// ---------------------------------------------------------------------------
// Panel + small primitives
// ---------------------------------------------------------------------------

function Panel({
  title,
  icon: Icon,
  count,
  tone,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
  tone?: "red";
  children: React.ReactNode;
}) {
  const isRed = tone === "red";
  return (
    <section
      className={`rounded-lg border bg-[#0e1729] ${
        isRed ? "border-red-500/30" : "border-[#1c2942]"
      }`}
    >
      <div
        className={`flex items-center justify-between border-b px-3 py-2 ${
          isRed ? "border-red-500/20" : "border-[#1c2942]"
        }`}
      >
        <div className="flex items-center gap-2">
          <Icon
            className={`h-3.5 w-3.5 ${isRed ? "text-red-400" : "text-sky-400"}`}
          />
          <h2 className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-300">
            {title}
          </h2>
        </div>
        {count != null && (
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
              isRed
                ? "bg-red-500/15 text-red-400"
                : "bg-sky-500/10 text-sky-400"
            }`}
          >
            {count}
          </span>
        )}
      </div>
      <div className="p-2.5">{children}</div>
    </section>
  );
}

function FeedList({
  items,
  empty,
}: {
  items: {
    id: string;
    clientId: string;
    primary: string;
    secondary: string;
    tone?: "red";
  }[];
  empty: string;
}) {
  if (items.length === 0)
    return <p className="px-1.5 text-[11px] text-slate-500">{empty}</p>;
  return (
    <div className="space-y-1.5">
      {items.map((it) => (
        <Link key={it.id} href={`/clients/${it.clientId}`}>
          <div className="group flex items-start gap-2 rounded px-1.5 py-1 hover:bg-white/5 cursor-pointer">
            <span
              className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                it.tone === "red" ? "bg-red-500" : "bg-sky-400"
              }`}
            />
            <div className="min-w-0">
              <p className="truncate text-[11px] text-slate-200 leading-snug">
                {it.primary}
              </p>
              <p className="truncate text-[9px] text-slate-500">
                {it.secondary}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-base font-bold tabular-nums text-white">{value}</div>
      <div className="text-[9px] uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.12em] text-slate-500">
        {label}
      </p>
      <p className="text-[11px] text-slate-200">{value}</p>
    </div>
  );
}
