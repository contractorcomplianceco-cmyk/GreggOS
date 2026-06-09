import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useStore } from "@/lib/store";
import { useParams, Link } from "wouter";
import { useMemo } from "react";
import { useAudits, levelColor } from "@/lib/auditPortal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUp,
  ArrowDown,
  Minus,
  AlertTriangle,
  ChevronLeft,
  ClipboardCheck,
  GitBranch,
  ShieldAlert,
  Workflow,
  TrendingUp,
  Receipt,
  Timer,
  CalendarClock,
  Phone,
  ListChecks,
  CircleDollarSign,
} from "lucide-react";
import type {
  RiskLevel,
  ClientStatus,
  AuditStatus,
  ProcessStatus,
  SLAStatus,
  RoadmapStage,
  Trend,
  InvoiceStatus,
} from "@/lib/types";

function parseDate(value: string): Date | null {
  if (!value) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return new Date(Number(y), Number(m) - 1, Number(d));
  }
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function today(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysUntil(value: string): number | null {
  const d = parseDate(value);
  if (!d) return null;
  return Math.round((d.getTime() - today().getTime()) / 86400000);
}

function fmtDate(value: string): string {
  const d = parseDate(value);
  if (!d) return "—";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function relLabel(value: string): string {
  const n = daysUntil(value);
  if (n === null) return "";
  if (n === 0) return "today";
  if (n > 0) return `in ${n}d`;
  return `${Math.abs(n)}d ago`;
}

function money(n: number): string {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const RISK_HEX: Record<RiskLevel, string> = {
  Low: "#16a34a",
  Medium: "#d97706",
  High: "#ef4444",
  Critical: "#b91c1c",
};

const STATUS_HEX: Record<ClientStatus, string> = {
  Active: "#16a34a",
  "At Risk": "#dc2626",
  Onboarding: "#1d6fd6",
  "Renewal Pending": "#0e9bb8",
  Stalled: "#64748b",
};

// Higher score = riskier. Green (low) -> amber -> red (high).
function riskColor(score: number): string {
  if (score >= 67) return "#dc2626";
  if (score >= 34) return "#d97706";
  return "#16a34a";
}

// Higher score = better. Red (low) -> amber -> green (high).
function scoreColor(score: number): string {
  if (score >= 85) return "#16a34a";
  if (score >= 70) return "#d97706";
  return "#dc2626";
}

const AUDIT_BADGE: Record<AuditStatus, string> = {
  "Not Started": "bg-slate-100 text-slate-700 border-slate-300",
  Scheduled: "bg-blue-50 text-blue-700 border-blue-300",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-300",
  "Under Review": "bg-cyan-50 text-cyan-700 border-cyan-300",
  Passed: "bg-green-50 text-green-700 border-green-300",
  Remediation: "bg-amber-50 text-amber-700 border-amber-300",
  Failed: "bg-red-50 text-red-700 border-red-300",
};

const PROCESS_BADGE: Record<ProcessStatus, string> = {
  "Not Started": "bg-slate-100 text-slate-700 border-slate-300",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-300",
  Blocked: "bg-red-50 text-red-700 border-red-300",
  "Waiting on Client": "bg-amber-50 text-amber-700 border-amber-300",
  Completed: "bg-green-50 text-green-700 border-green-300",
};

function processBarColor(status: ProcessStatus): string {
  if (status === "Blocked") return "#dc2626";
  if (status === "Waiting on Client") return "#d97706";
  if (status === "Completed") return "#16a34a";
  return "#1d6fd6";
}

const SLA_BADGE: Record<SLAStatus, string> = {
  "On Track": "bg-green-50 text-green-700 border-green-300",
  "At Risk": "bg-amber-50 text-amber-700 border-amber-300",
  Met: "bg-green-50 text-green-700 border-green-300",
  Missed: "bg-red-50 text-red-700 border-red-300",
  Upcoming: "bg-blue-50 text-blue-700 border-blue-300",
};

const INVOICE_BADGE: Record<InvoiceStatus, string> = {
  Draft: "bg-slate-100 text-slate-700 border-slate-300",
  Sent: "bg-blue-50 text-blue-700 border-blue-300",
  Paid: "bg-green-50 text-green-700 border-green-300",
  Partial: "bg-amber-50 text-amber-700 border-amber-300",
  Overdue: "bg-red-50 text-red-700 border-red-300",
};

const ROADMAP_STAGES: RoadmapStage[] = ["Identified", "Proposed", "In Discussion", "Committed", "Live"];

function TrendIcon({ trend, invert = false }: { trend: Trend; invert?: boolean }) {
  if (trend === "flat") return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  // For risk, "up" is bad (red); for positive metrics, invert.
  const up = trend === "up";
  const good = invert ? up : !up;
  const cls = good ? "text-green-600" : "text-red-600";
  return up ? <ArrowUp className={`h-3.5 w-3.5 ${cls}`} /> : <ArrowDown className={`h-3.5 w-3.5 ${cls}`} />;
}

function Bar({ value, color, height = 8 }: { value: number; color: string; height?: number }) {
  return (
    <div className="w-full rounded-full bg-muted overflow-hidden" style={{ height }}>
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: color }} />
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
  accent,
  alert = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: string;
  alert?: boolean;
}) {
  return (
    <Card className={`relative overflow-hidden ${alert ? "border-red-300" : ""}`}>
      <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: accent }} />
      <CardContent className="p-3 pl-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span style={{ color: accent }}>{icon}</span>
          <span className="truncate">{label}</span>
        </div>
        <div className="mt-1 text-2xl font-bold leading-none tabular-nums">{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground truncate">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <CardTitle className="flex items-center gap-2 text-base">
      <span className="text-muted-foreground">{icon}</span>
      {children}
    </CardTitle>
  );
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const store = useStore();
  const { clients, callNotes, tasks, escalations, signals, processes, audits, riskProfiles, expansion, invoices, slas, events, contactLog } = store;

  const client = clients.find((c) => c.id === id);
  const { data: liveAudits } = useAudits();

  const data = useMemo(() => {
    if (!client) return null;
    const cid = client.id;
    const clientTasks = tasks.filter((t) => t.clientId === cid);
    const openTasks = clientTasks.filter((t) => t.status !== "Completed" && t.status !== "Canceled");
    const clientProcesses = processes.filter((p) => p.clientId === cid);
    const openProcesses = clientProcesses.filter((p) => p.status !== "Completed");
    const clientEscalations = escalations.filter((e) => e.clientId === cid);
    const openEscalations = clientEscalations.filter((e) => e.status !== "Resolved");
    const clientSignals = signals.filter((s) => s.clientId === cid);
    const audit = audits.find((a) => a.clientId === cid) ?? null;
    const risk = riskProfiles.find((r) => r.clientId === cid) ?? null;
    const roadmap = expansion.filter((x) => x.clientId === cid);
    const clientInvoices = invoices.filter((i) => i.clientId === cid);
    const clientSlas = slas.filter((s) => s.clientId === cid);
    const missedSlas = clientSlas.filter((s) => s.status === "Missed");
    const atRiskSlas = clientSlas.filter((s) => s.status === "At Risk");
    const upcomingSlas = clientSlas
      .filter((s) => s.status === "Upcoming" || s.status === "On Track" || s.status === "At Risk")
      .sort((a, b) => (daysUntil(a.dueDate) ?? 0) - (daysUntil(b.dueDate) ?? 0));
    const upcomingEvents = events
      .filter((e) => e.clientId === cid)
      .sort((a, b) => (daysUntil(a.date) ?? 0) - (daysUntil(b.date) ?? 0));
    const log = contactLog
      .filter((l) => l.clientId === cid)
      .sort((a, b) => (parseDate(b.date)?.getTime() ?? 0) - (parseDate(a.date)?.getTime() ?? 0));
    const lastContact = log[0] ?? null;
    const notes = callNotes
      .filter((n) => n.clientId === cid)
      .sort((a, b) => (parseDate(b.callDate)?.getTime() ?? 0) - (parseDate(a.callDate)?.getTime() ?? 0));

    const arOutstanding = clientInvoices.reduce((sum, i) => sum + (i.amount - i.amountPaid), 0);
    const arOverdue = clientInvoices
      .filter((i) => i.status === "Overdue")
      .reduce((sum, i) => sum + (i.amount - i.amountPaid), 0);
    const pipelineValue = roadmap.reduce((sum, x) => sum + x.potentialValue, 0);

    const overdueTasks = openTasks.filter((t) => {
      const n = daysUntil(t.dueDate);
      return n !== null && n < 0;
    });

    return {
      clientTasks,
      openTasks,
      overdueTasks,
      clientProcesses,
      openProcesses,
      clientEscalations,
      openEscalations,
      clientSignals,
      audit,
      risk,
      roadmap,
      clientInvoices,
      clientSlas,
      missedSlas,
      atRiskSlas,
      upcomingSlas,
      upcomingEvents,
      log,
      lastContact,
      notes,
      arOutstanding,
      arOverdue,
      pipelineValue,
    };
  }, [client, tasks, processes, escalations, signals, audits, riskProfiles, expansion, invoices, slas, events, contactLog, callNotes]);

  if (!client || !data) {
    return (
      <SidebarLayout>
        <div className="p-8">
          <h1 className="text-2xl">Client not found</h1>
          <Link href="/clients">
            <Button className="mt-4">Back to Clients</Button>
          </Link>
        </div>
      </SidebarLayout>
    );
  }

  const isHighRisk = client.riskLevel === "High" || client.riskLevel === "Critical";

  const norm = (s: string) => s.toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim();
  const liveAudit = liveAudits?.find(
    (a) => norm(a.clientName) === norm(client.clientName) || norm(a.clientName) === norm(client.companyName),
  );

  // Build critical alerts.
  const alerts: { label: string; detail: string }[] = [];
  if (client.clientStatus === "At Risk") alerts.push({ label: "Account At Risk", detail: client.nextAction });
  data.openEscalations.forEach((e) => alerts.push({ label: `Escalation: ${e.reason}`, detail: e.decisionNeeded }));
  data.missedSlas.forEach((s) => alerts.push({ label: `Missed SLA: ${s.name}`, detail: `${s.description} (due ${relLabel(s.dueDate)})` }));
  if (data.arOverdue > 0) alerts.push({ label: "Overdue invoice", detail: `${money(data.arOverdue)} past due` });
  data.clientProcesses
    .filter((p) => p.status === "Blocked")
    .forEach((p) => alerts.push({ label: `Blocked: ${p.name}`, detail: p.blockedReason }));
  data.overdueTasks.forEach((t) => alerts.push({ label: "Overdue task", detail: `${t.title} (due ${relLabel(t.dueDate)})` }));

  return (
    <SidebarLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <Link href="/clients">
            <button className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3">
              <ChevronLeft className="h-4 w-4" /> Back to Clients
            </button>
          </Link>
          <div className="flex flex-wrap justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{client.clientName}</h1>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: STATUS_HEX[client.clientStatus] }}
                >
                  {client.clientStatus}
                </span>
              </div>
              <p className="text-muted-foreground">{client.companyName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {client.contactName} · {client.phone} · {client.email}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="rounded-md border px-3 py-1.5 text-sm">
                <span className="text-muted-foreground">Owner: </span>
                <span className="font-semibold">{client.nextOwner}</span>
              </div>
              <Badge variant={client.greggPriority === "Urgent" ? "destructive" : "outline"} className="px-3 py-1.5 text-sm">
                Priority: {client.greggPriority}
              </Badge>
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white"
                style={{ backgroundColor: RISK_HEX[client.riskLevel] }}
              >
                <ShieldAlert className="h-4 w-4" /> {client.riskLevel} Risk
              </span>
            </div>
          </div>
        </div>

        {/* Critical alerts */}
        {alerts.length > 0 && (
          <Card className="border-red-300 bg-red-50/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                <AlertTriangle className="h-4 w-4" /> Critical Alerts ({alerts.length})
              </div>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {alerts.map((a, i) => (
                  <li key={i} className="text-sm flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    <span>
                      <span className="font-medium text-red-800">{a.label}.</span>{" "}
                      <span className="text-red-700/90">{a.detail}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          <Kpi
            icon={<ShieldAlert className="h-4 w-4" />}
            label="Risk Score"
            value={data.risk ? String(data.risk.overallScore) : "—"}
            sub={data.risk ? `trend ${data.risk.trend}` : undefined}
            accent={data.risk ? riskColor(data.risk.overallScore) : "#64748b"}
            alert={!!data.risk && data.risk.overallScore >= 67}
          />
          <Kpi
            icon={<ClipboardCheck className="h-4 w-4" />}
            label="Audit Score"
            value={data.audit && data.audit.overallScore > 0 ? `${data.audit.overallScore}%` : "—"}
            sub={data.audit?.status}
            accent={data.audit && data.audit.overallScore > 0 ? scoreColor(data.audit.overallScore) : "#64748b"}
          />
          <Kpi
            icon={<Workflow className="h-4 w-4" />}
            label="Open Processes"
            value={String(data.openProcesses.length)}
            sub={`${data.clientProcesses.length} total`}
            accent="#1d6fd6"
          />
          <Kpi
            icon={<ListChecks className="h-4 w-4" />}
            label="Open Tasks"
            value={String(data.openTasks.length)}
            sub={data.overdueTasks.length > 0 ? `${data.overdueTasks.length} overdue` : "on track"}
            accent={data.overdueTasks.length > 0 ? "#dc2626" : "#1d6fd6"}
            alert={data.overdueTasks.length > 0}
          />
          <Kpi
            icon={<CircleDollarSign className="h-4 w-4" />}
            label="AR Outstanding"
            value={money(data.arOutstanding)}
            sub={data.arOverdue > 0 ? `${money(data.arOverdue)} overdue` : "current"}
            accent={data.arOverdue > 0 ? "#dc2626" : "#16a34a"}
            alert={data.arOverdue > 0}
          />
          <Kpi
            icon={<Timer className="h-4 w-4" />}
            label="Missed SLAs"
            value={String(data.missedSlas.length)}
            sub={data.atRiskSlas.length > 0 ? `${data.atRiskSlas.length} at risk` : undefined}
            accent={data.missedSlas.length > 0 ? "#dc2626" : "#16a34a"}
            alert={data.missedSlas.length > 0}
          />
          <Kpi
            icon={<ShieldAlert className="h-4 w-4" />}
            label="Escalations"
            value={String(data.openEscalations.length)}
            accent={data.openEscalations.length > 0 ? "#dc2626" : "#16a34a"}
            alert={data.openEscalations.length > 0}
          />
          <Kpi
            icon={<TrendingUp className="h-4 w-4" />}
            label="Expansion Pipeline"
            value={money(data.pipelineValue)}
            sub={`${data.roadmap.length} opportunities`}
            accent="#0e9bb8"
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left + middle (2 cols of content) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live risk scoring */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <SectionTitle icon={<ShieldAlert className="h-4 w-4" />}>Live Risk Scoring</SectionTitle>
                  {data.risk && (
                    <span className="text-xs text-muted-foreground">Updated {relLabel(data.risk.updatedAt)}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {data.risk ? (
                  <div className="grid gap-5 sm:grid-cols-[140px_1fr]">
                    <div className="flex flex-col items-center justify-center rounded-lg border p-4">
                      <div className="text-4xl font-bold tabular-nums" style={{ color: riskColor(data.risk.overallScore) }}>
                        {data.risk.overallScore}
                      </div>
                      <div className="text-xs text-muted-foreground">/ 100 risk</div>
                      <div className="mt-2 flex items-center gap-1 text-xs">
                        <TrendIcon trend={data.risk.trend} /> {data.risk.trend === "flat" ? "stable" : data.risk.trend === "up" ? "rising" : "falling"}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {data.risk.factors.map((f) => (
                        <div key={f.label}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="flex items-center gap-1.5">
                              {f.label}
                              <TrendIcon trend={f.trend} />
                              <span className="text-muted-foreground">· {f.weight}%</span>
                            </span>
                            <span className="font-medium tabular-nums" style={{ color: riskColor(f.score) }}>
                              {f.score}
                            </span>
                          </div>
                          <Bar value={f.score} color={riskColor(f.score)} />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No risk profile available.</p>
                )}
              </CardContent>
            </Card>

            {/* Audit + scoresheet */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <SectionTitle icon={<ClipboardCheck className="h-4 w-4" />}>Audit Status & Scoresheet</SectionTitle>
                  <div className="flex items-center gap-2">
                    {liveAudit && (
                      <Link href="/audit-risk">
                        <span
                          className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
                          style={{ backgroundColor: `${levelColor(liveAudit.finalLevel)}1a`, color: levelColor(liveAudit.finalLevel) }}
                          title="Live audit from CCA Audit Risk Portal"
                        >
                          <ShieldAlert className="h-3 w-3" /> Live: {liveAudit.finalStatus}
                        </span>
                      </Link>
                    )}
                    {data.audit && (
                      <Badge variant="outline" className={AUDIT_BADGE[data.audit.status]}>
                        {data.audit.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.audit ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Overall</div>
                        <div className="text-xl font-bold tabular-nums" style={{ color: data.audit.overallScore > 0 ? scoreColor(data.audit.overallScore) : "#64748b" }}>
                          {data.audit.overallScore > 0 ? `${data.audit.overallScore}%` : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Type</div>
                        <div className="font-medium">{data.audit.auditType}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Last Audit</div>
                        <div className="font-medium">{data.audit.lastAuditDate ? fmtDate(data.audit.lastAuditDate) : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Next Audit</div>
                        <div className="font-medium">{fmtDate(data.audit.nextAuditDate)} <span className="text-muted-foreground">({relLabel(data.audit.nextAuditDate)})</span></div>
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      {data.audit.scoresheet.map((s) => (
                        <div key={s.category}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>{s.category} <span className="text-muted-foreground">· {s.weight}%</span></span>
                            <span className="font-medium tabular-nums" style={{ color: s.score > 0 ? scoreColor(s.score) : "#64748b" }}>
                              {s.score > 0 ? s.score : "—"}
                            </span>
                          </div>
                          <Bar value={s.score} color={s.score > 0 ? scoreColor(s.score) : "#cbd5e1"} />
                          {s.notes && <div className="text-xs text-muted-foreground mt-0.5">{s.notes}</div>}
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No audit on record.</p>
                )}
              </CardContent>
            </Card>

            {/* Processes */}
            <Card>
              <CardHeader className="pb-3">
                <SectionTitle icon={<Workflow className="h-4 w-4" />}>
                  Processing Status ({data.openProcesses.length} open)
                </SectionTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.clientProcesses.length === 0 && <p className="text-sm text-muted-foreground">No active processes.</p>}
                {data.clientProcesses.map((p) => {
                  const overdue = (daysUntil(p.dueDate) ?? 0) < 0 && p.status !== "Completed";
                  return (
                    <div key={p.id} className="rounded-md border p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-medium text-sm">{p.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {p.type} · {p.owner} · due {fmtDate(p.dueDate)}{" "}
                            <span className={overdue ? "text-red-600 font-medium" : ""}>({relLabel(p.dueDate)})</span>
                          </div>
                        </div>
                        <Badge variant="outline" className={PROCESS_BADGE[p.status]}>{p.status}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Bar value={p.progress} color={processBarColor(p.status)} />
                        <span className="text-xs tabular-nums text-muted-foreground w-9 text-right">{p.progress}%</span>
                      </div>
                      {p.blockedReason && (
                        <div className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> {p.blockedReason}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Expansion roadmap */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <SectionTitle icon={<GitBranch className="h-4 w-4" />}>Expansion Roadmap</SectionTitle>
                  <span className="text-sm font-medium text-cyan-700">{money(data.pipelineValue)} pipeline</span>
                </div>
              </CardHeader>
              <CardContent>
                {data.roadmap.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No expansion opportunities identified.</p>
                ) : (
                  <div className="space-y-4">
                    {data.roadmap.map((x) => {
                      const stageIdx = ROADMAP_STAGES.indexOf(x.stage);
                      return (
                        <div key={x.id} className="rounded-md border p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="font-medium text-sm">{x.title}</div>
                            <div className="text-sm font-semibold text-cyan-700 whitespace-nowrap">{money(x.potentialValue)}</div>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">{x.description} · target {fmtDate(x.targetDate)}</div>
                          <div className="flex items-center gap-1">
                            {ROADMAP_STAGES.map((stage, i) => (
                              <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                  className="h-1.5 w-full rounded-full"
                                  style={{ backgroundColor: i <= stageIdx ? "#0e9bb8" : "#e2e8f0" }}
                                />
                                <span className={`text-[10px] ${i === stageIdx ? "font-semibold text-cyan-700" : "text-muted-foreground"}`}>
                                  {stage}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoices / AR */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <SectionTitle icon={<Receipt className="h-4 w-4" />}>Invoices / Accounts Receivable</SectionTitle>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Outstanding </span>
                    <span className="font-semibold">{money(data.arOutstanding)}</span>
                    {data.arOverdue > 0 && <span className="text-red-600 font-semibold"> · {money(data.arOverdue)} overdue</span>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {data.clientInvoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No invoices on file.</p>
                ) : (
                  <div className="space-y-2">
                    {data.clientInvoices.map((inv) => {
                      const balance = inv.amount - inv.amountPaid;
                      return (
                        <div key={inv.id} className="flex items-center justify-between gap-3 rounded-md border p-2.5 text-sm">
                          <div>
                            <div className="font-medium">{inv.invoiceNumber}</div>
                            <div className="text-xs text-muted-foreground">
                              Issued {fmtDate(inv.issueDate)} · due {fmtDate(inv.dueDate)} ({relLabel(inv.dueDate)})
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="tabular-nums font-medium">{money(inv.amount)}</div>
                              {balance > 0 ? (
                                <div className="text-xs text-muted-foreground tabular-nums">{money(balance)} due</div>
                              ) : (
                                <div className="text-xs text-green-600">paid</div>
                              )}
                            </div>
                            <Badge variant="outline" className={INVOICE_BADGE[inv.status]}>{inv.status}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent call notes */}
            <Card>
              <CardHeader className="pb-3">
                <SectionTitle icon={<Phone className="h-4 w-4" />}>Recent Call Notes</SectionTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.notes.length === 0 && <p className="text-sm text-muted-foreground">No call notes yet.</p>}
                {data.notes.map((note) => (
                  <div key={note.id} className="rounded-md border p-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">{fmtDate(note.callDate)} · {note.callType} · {note.caller}</span>
                      <Badge variant="secondary">{note.routingStatus}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{note.cleanSummary || note.rawRingCentralNote}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            {/* Next actions / tasks */}
            <Card>
              <CardHeader className="pb-3">
                <SectionTitle icon={<ListChecks className="h-4 w-4" />}>Next Action Items</SectionTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border bg-muted/40 p-3 mb-3">
                  <div className="text-xs text-muted-foreground">Primary next action</div>
                  <div className="font-medium text-sm">{client.nextAction}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {client.nextOwner} · due {fmtDate(client.dueDate)} ({relLabel(client.dueDate)})
                  </div>
                  {client.missingInformation && client.missingInformation !== "None" && (
                    <div className="text-xs text-amber-700 mt-1">Missing: {client.missingInformation}</div>
                  )}
                </div>
                <div className="space-y-2">
                  {data.clientTasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks.</p>}
                  {data.clientTasks.map((t) => {
                    const overdue = (daysUntil(t.dueDate) ?? 0) < 0 && t.status !== "Completed" && t.status !== "Canceled";
                    return (
                      <div key={t.id} className="flex items-start justify-between gap-2 rounded-md border p-2.5">
                        <div>
                          <div className="text-sm font-medium flex items-center gap-1.5">
                            {t.escalationFlag && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                            {t.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {t.owner} · due {fmtDate(t.dueDate)}{" "}
                            <span className={overdue ? "text-red-600 font-medium" : ""}>({relLabel(t.dueDate)})</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="shrink-0">{t.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* SLAs */}
            <Card>
              <CardHeader className="pb-3">
                <SectionTitle icon={<Timer className="h-4 w-4" />}>SLAs</SectionTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.missedSlas.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-red-700 mb-1.5">Missed</div>
                    <div className="space-y-2">
                      {data.missedSlas.map((s) => (
                        <div key={s.id} className="rounded-md border border-red-200 bg-red-50/60 p-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{s.name}</span>
                            <Badge variant="outline" className={SLA_BADGE[s.status]}>{s.status}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">{s.description} · due {relLabel(s.dueDate)} · {s.owner}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground mb-1.5">Upcoming</div>
                  <div className="space-y-2">
                    {data.upcomingSlas.length === 0 && <p className="text-sm text-muted-foreground">None upcoming.</p>}
                    {data.upcomingSlas.map((s) => (
                      <div key={s.id} className="rounded-md border p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{s.name}</span>
                          <Badge variant="outline" className={SLA_BADGE[s.status]}>{s.status}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">{s.description} · due {fmtDate(s.dueDate)} ({relLabel(s.dueDate)}) · {s.owner}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schedule */}
            <Card>
              <CardHeader className="pb-3">
                <SectionTitle icon={<CalendarClock className="h-4 w-4" />}>Schedule with Client</SectionTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.upcomingEvents.length === 0 && <p className="text-sm text-muted-foreground">Nothing scheduled.</p>}
                {data.upcomingEvents.map((e) => {
                  const past = (daysUntil(e.date) ?? 0) < 0;
                  return (
                    <div key={e.id} className="flex items-start gap-3 rounded-md border p-2.5">
                      <div className="flex flex-col items-center justify-center rounded-md bg-muted px-2 py-1 text-center min-w-[3rem]">
                        <span className="text-[10px] uppercase text-muted-foreground">{parseDate(e.date)?.toLocaleDateString(undefined, { month: "short" })}</span>
                        <span className="text-lg font-bold leading-none">{parseDate(e.date)?.getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium">{e.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {e.time} · {e.type} · {past ? "past" : relLabel(e.date)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {e.attendees} {!e.withClient && <span className="italic">(internal)</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Last contact + contact log */}
            <Card>
              <CardHeader className="pb-3">
                <SectionTitle icon={<Phone className="h-4 w-4" />}>Contact History</SectionTitle>
              </CardHeader>
              <CardContent>
                {data.lastContact ? (
                  <div className="rounded-md border bg-muted/40 p-3 mb-3">
                    <div className="text-xs text-muted-foreground">Last contact</div>
                    <div className="text-sm font-medium">
                      {fmtDate(data.lastContact.date)} ({relLabel(data.lastContact.date)}) · {data.lastContact.channel}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {data.lastContact.direction} · by {data.lastContact.internalPerson}
                    </div>
                    <div className="text-sm mt-1">{data.lastContact.summary}</div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mb-3">No contact logged.</p>
                )}
                <div className="space-y-2">
                  {data.log.slice(1).map((l) => (
                    <div key={l.id} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                      <div>
                        <div className="text-xs text-muted-foreground">
                          {fmtDate(l.date)} · {l.channel} · {l.internalPerson}
                        </div>
                        <div>{l.summary}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Escalations */}
            {data.clientEscalations.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <SectionTitle icon={<ShieldAlert className="h-4 w-4" />}>Escalations</SectionTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.clientEscalations.map((esc) => (
                    <div key={esc.id} className="rounded-md border border-red-200 bg-red-50/60 p-3">
                      <div className="flex justify-between items-start gap-2">
                        <p className="font-medium text-sm text-red-800">{esc.reason}</p>
                        <Badge variant="destructive">{esc.status}</Badge>
                      </div>
                      <p className="text-xs mt-1">Needed: {esc.decisionNeeded}</p>
                      <p className="text-xs text-muted-foreground">Routed to {esc.routedTo} · due {fmtDate(esc.deadline)}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Opportunity signals */}
            {data.clientSignals.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <SectionTitle icon={<TrendingUp className="h-4 w-4" />}>Opportunity Signals</SectionTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.clientSignals.map((s) => (
                    <div key={s.id} className="rounded-md border p-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{s.type}</span>
                        <Badge variant="outline">{s.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
