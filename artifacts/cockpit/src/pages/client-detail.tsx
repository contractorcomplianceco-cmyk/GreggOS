import { SidebarLayout } from "@/components/layout/SidebarLayout";
import {
  useGetClientDetail,
  useUpdateClient,
  useHandoffClient,
  useUpdateExpansionMilestone,
  useListActivity,
  getGetClientDetailQueryKey,
  getListActivityQueryKey,
} from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAudits, useAuditDetail, levelColor, layerAFactors, getPortalBaseUrl } from "@/lib/auditPortal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
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
  Activity,
  ChevronRight,
  ExternalLink,
  Pin,
  PinOff,
  ArrowRightLeft,
  History,
  UserCog,
  MessageSquareText,
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
  CurrentClient,
  CallNote,
  Task,
  Escalation,
  OpportunitySignal,
  ClientProcess,
  ClientAudit,
  ClientRiskProfile,
  ExpansionMilestone,
  Invoice,
  SLA,
  ScheduledEvent,
  ContactLogEntry,
} from "@/lib/types";
import { LoadingState } from "@/components/layout/FishingSpinner";

const BASE_URL = import.meta.env.BASE_URL;

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  el.classList.add("ring-2", "ring-primary", "ring-offset-2");
  window.setTimeout(() => el.classList.remove("ring-2", "ring-primary", "ring-offset-2"), 1600);
}

function openNote(noteId: string | null | undefined) {
  if (!noteId) return;
  window.location.href = `${BASE_URL}processor?noteId=${encodeURIComponent(noteId)}`;
}

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

function fmtDateTime(value: string): string {
  const d = parseDate(value);
  if (!d) return "—";
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
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
  "Renewal Pending": "#c79a3b",
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

// Overall health (higher = healthier). Green -> amber -> red -> dark red.
function healthColor(score: number): string {
  if (score >= 80) return "#16a34a";
  if (score >= 60) return "#d97706";
  if (score >= 40) return "#ef4444";
  return "#b91c1c";
}

function healthBand(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Stable";
  if (score >= 40) return "At Risk";
  return "Critical";
}

const AUDIT_BADGE: Record<AuditStatus, string> = {
  "Not Started": "bg-slate-100 text-slate-700 border-slate-300",
  Scheduled: "bg-blue-50 text-blue-700 border-blue-300",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-300",
  "Under Review": "bg-amber-50 text-amber-700 border-amber-300",
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

const ROADMAP_STAGES: RoadmapStage[] = ["Identified", "Qualifying", "Proposed", "Negotiation", "Closing"];

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

// Semicircular dial gauge for the overall health meter. `score` is null when
// there is not enough signal to compute a meaningful health figure.
function HealthGauge({ score }: { score: number | null }) {
  const cx = 110;
  const cy = 110;
  const r = 90;
  const sw = 14;
  const has = score !== null;
  const clamped = has ? Math.max(0, Math.min(100, score)) : 0;
  const polar = (pct: number, radius = r) => {
    const t = Math.PI * (1 - pct / 100);
    return { x: cx + radius * Math.cos(t), y: cy - radius * Math.sin(t) };
  };
  const arc = (from: number, to: number, radius = r) => {
    const s = polar(from, radius);
    const e = polar(to, radius);
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 0 1 ${e.x} ${e.y}`;
  };
  const color = has ? healthColor(clamped) : "#94a3b8";
  const dot = polar(clamped);
  const zero = polar(0);
  const hundred = polar(100);
  return (
    <div className="relative w-full max-w-[240px]">
      <svg viewBox="0 0 220 128" className="w-full" role="img" aria-label={has ? `Overall health ${clamped} of 100` : "Overall health not available"}>
        <path d={arc(0, 100)} fill="none" stroke="#e2e8f0" strokeWidth={sw} strokeLinecap="round" />
        {has && <path d={arc(0, Math.max(0.5, clamped))} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" />}
        {has && <circle cx={dot.x} cy={dot.y} r={7} fill="#ffffff" stroke={color} strokeWidth={3} />}
        <text x={zero.x} y={cy + 18} fontSize="10" fill="#94a3b8" textAnchor="middle">0</text>
        <text x={hundred.x} y={cy + 18} fontSize="10" fill="#94a3b8" textAnchor="middle">100</text>
      </svg>
      <div className="absolute inset-x-0 bottom-1 flex flex-col items-center">
        {has ? (
          <>
            <span className="text-4xl font-bold leading-none tabular-nums" style={{ color }}>{clamped}</span>
            <span className="mt-1 text-xs font-semibold" style={{ color }}>{healthBand(clamped)}</span>
            <span className="text-[10px] text-muted-foreground">/ 100 health</span>
          </>
        ) : (
          <>
            <span className="text-2xl font-bold leading-none text-muted-foreground">N/A</span>
            <span className="mt-1 text-[10px] text-muted-foreground">Insufficient data</span>
          </>
        )}
      </div>
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
  targetId,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent: string;
  alert?: boolean;
  targetId?: string;
}) {
  const clickable = !!targetId;
  return (
    <Card
      className={`relative overflow-hidden transition ${alert ? "border-red-300" : ""} ${
        clickable ? "cursor-pointer hover:shadow-md hover:border-primary/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" : ""
      }`}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => scrollToSection(targetId!) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                scrollToSection(targetId!);
              }
            }
          : undefined
      }
    >
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

const OWNER_OPTIONS = ["Gregg", "Landon", "Tara"];
const INVOLVEMENT_OPTIONS = ["Sole", "Shared", "Pre-sale support", "Monitoring", "Handed off"];

function HandoffDialog({
  clientId,
  currentOwner,
  onDone,
}: {
  clientId: string;
  currentOwner: string;
  onDone: () => void;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [toOwner, setToOwner] = useState("");
  const [involvementState, setInvolvementState] = useState("Shared");
  const [note, setNote] = useState("");
  const handoffM = useHandoffClient({
    mutation: {
      onSuccess: () => {
        toast({ title: "Handoff recorded", description: `Ownership moved to ${toOwner}.` });
        setOpen(false);
        setToOwner("");
        setNote("");
        onDone();
      },
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ArrowRightLeft className="h-3.5 w-3.5" /> Hand off
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hand off client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Current owner: <span className="font-medium text-foreground">{currentOwner}</span>
          </p>
          <div className="space-y-1.5">
            <Label>Hand off to</Label>
            <Select value={toOwner} onValueChange={setToOwner}>
              <SelectTrigger>
                <SelectValue placeholder="Select new owner" />
              </SelectTrigger>
              <SelectContent>
                {OWNER_OPTIONS.filter((o) => o !== currentOwner).map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Outgoing owner involvement</Label>
            <Select value={involvementState} onValueChange={setInvolvementState}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVOLVEMENT_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Handoff note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Context for the receiving owner…"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!toOwner || handoffM.isPending}
            onClick={() =>
              handoffM.mutate({
                clientId,
                data: { toOwner, involvementState, note: note.trim() || undefined },
              })
            }
          >
            {handoffM.isPending ? "Recording…" : "Record handoff"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: detail } = useGetClientDetail(id);
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: activity } = useListActivity(
    { clientId: id, limit: 30 },
    { query: { queryKey: getListActivityQueryKey({ clientId: id, limit: 30 }) } }
  );

  const invalidateClient = () => {
    qc.invalidateQueries({ queryKey: getGetClientDetailQueryKey(id) });
    qc.invalidateQueries({ queryKey: getListActivityQueryKey({ clientId: id, limit: 30 }) });
    // Pin/boost, overlap and handoff changes also feed the portfolio views.
    qc.invalidateQueries({ queryKey: ["/api/expansion-pipeline"] });
    qc.invalidateQueries({ queryKey: ["/api/relationships"] });
    qc.invalidateQueries({ queryKey: ["/api/clients"] });
  };

  const updateClientM = useUpdateClient({
    mutation: { onSuccess: invalidateClient },
  });
  const updateMilestoneM = useUpdateExpansionMilestone({
    mutation: { onSuccess: invalidateClient },
  });

  const clients = (detail?.client ? [detail.client] : []) as unknown as CurrentClient[];
  const callNotes = (detail?.callNotes ?? []) as unknown as CallNote[];
  const tasks = (detail?.tasks ?? []) as unknown as Task[];
  const escalations = (detail?.escalations ?? []) as unknown as Escalation[];
  const signals = (detail?.signals ?? []) as unknown as OpportunitySignal[];
  const processes = (detail?.processes ?? []) as unknown as ClientProcess[];
  const audits = (detail?.audit ? [detail.audit] : []) as unknown as ClientAudit[];
  const riskProfiles = (detail?.riskProfile ? [detail.riskProfile] : []) as unknown as ClientRiskProfile[];
  const expansion = (detail?.expansion ?? []) as unknown as ExpansionMilestone[];
  const invoices = (detail?.invoices ?? []) as unknown as Invoice[];
  const slas = (detail?.slas ?? []) as unknown as SLA[];
  const events = (detail?.events ?? []) as unknown as ScheduledEvent[];
  const contactLog = (detail?.contactLog ?? []) as unknown as ContactLogEntry[];

  const client = clients.find((c) => c.id === id);
  const { data: liveAudits } = useAudits();

  // Best-effort name match against the live CCA Audit Risk Portal (the two
  // systems share no common ID), then pull the full audit detail when matched.
  const liveAudit = useMemo(() => {
    if (!client || !liveAudits) return undefined;
    const norm = (s: string) => s.toLowerCase().replace(/[.,]/g, "").replace(/\s+/g, " ").trim();
    return liveAudits.find(
      (a) => norm(a.clientName) === norm(client.clientName) || norm(a.clientName) === norm(client.companyName),
    );
  }, [client, liveAudits]);
  const { data: liveAuditDetail, isLoading: liveAuditDetailLoading, isError: liveAuditDetailError } = useAuditDetail(liveAudit?.id ?? null);

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

  // Overall client health (0-100, higher = healthier). Weighted blend of the
  // available signals; weights renormalize when risk/audit/SLA data is absent.
  const healthParts: { label: string; score: number; weight: number; target: string }[] = [];
  if (data.risk) healthParts.push({ label: "Risk profile", score: 100 - data.risk.overallScore, weight: 30, target: "section-risk" });
  if (liveAudit)
    healthParts.push({ label: "Audit compliance", score: Math.max(0, 100 - liveAudit.layerANormalized), weight: 25, target: "section-audit" });
  else if (data.audit && data.audit.overallScore > 0)
    healthParts.push({ label: "Audit compliance", score: data.audit.overallScore, weight: 25, target: "section-audit" });
  if (data.clientSlas.length > 0) {
    const bad = data.missedSlas.length + data.atRiskSlas.length * 0.5;
    healthParts.push({ label: "SLA adherence", score: Math.max(0, 100 - (bad / data.clientSlas.length) * 100), weight: 15, target: "section-slas" });
  }
  healthParts.push({
    label: "Task timeliness",
    score: data.openTasks.length === 0 ? 100 : Math.max(0, 100 - (data.overdueTasks.length / data.openTasks.length) * 100),
    weight: 10,
    target: "section-tasks",
  });
  healthParts.push({
    label: "Billing / AR",
    score: data.arOutstanding > 0 ? Math.max(0, 100 - (data.arOverdue / data.arOutstanding) * 100) : 100,
    weight: 10,
    target: "section-invoices",
  });
  healthParts.push({
    label: "Escalations",
    score: data.openEscalations.length === 0 ? 100 : Math.max(0, 100 - data.openEscalations.length * 34),
    weight: 10,
    target: data.clientEscalations.length > 0 ? "section-escalations" : "",
  });
  // Clamp each component to [0,100] so an out-of-range upstream value can't skew the blend.
  healthParts.forEach((p) => (p.score = Math.max(0, Math.min(100, p.score))));
  // Require at least one substantive signal (risk, audit, or SLAs). The
  // operational factors (tasks/AR/escalations) default to 100 when empty, so on
  // their own they would inflate a data-less client to a misleading perfect score.
  const healthHasSignal = !!data.risk || !!liveAudit || !!(data.audit && data.audit.overallScore > 0) || data.clientSlas.length > 0;
  const healthWeight = healthParts.reduce((s, p) => s + p.weight, 0);
  const healthScore =
    !healthHasSignal || healthWeight === 0
      ? null
      : Math.round(healthParts.reduce((s, p) => s + p.score * p.weight, 0) / healthWeight);

  // Build critical alerts.
  const alerts: { label: string; detail: string; target: string }[] = [];
  if (client.clientStatus === "At Risk") alerts.push({ label: "Account At Risk", detail: client.nextAction, target: "section-tasks" });
  data.openEscalations.forEach((e) => alerts.push({ label: `Escalation: ${e.reason}`, detail: e.decisionNeeded, target: "section-escalations" }));
  data.missedSlas.forEach((s) => alerts.push({ label: `Missed SLA: ${s.name}`, detail: `${s.description} (due ${relLabel(s.dueDate)})`, target: "section-slas" }));
  if (data.arOverdue > 0) alerts.push({ label: "Overdue invoice", detail: `${money(data.arOverdue)} past due`, target: "section-invoices" });
  data.clientProcesses
    .filter((p) => p.status === "Blocked")
    .forEach((p) => alerts.push({ label: `Blocked: ${p.name}`, detail: p.blockedReason, target: "section-processes" }));
  data.overdueTasks.forEach((t) => alerts.push({ label: "Overdue task", detail: `${t.title} (due ${relLabel(t.dueDate)})`, target: "section-tasks" }));

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
                {client.contactName} ·{" "}
                <a href={`tel:${client.phone.replace(/[^+\d]/g, "")}`} className="hover:text-foreground hover:underline">
                  {client.phone}
                </a>{" "}
                ·{" "}
                <a href={`mailto:${client.email}`} className="hover:text-foreground hover:underline">
                  {client.email}
                </a>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() =>
                  (window.location.href = `${BASE_URL}communications?clientId=${encodeURIComponent(client.id)}`)
                }
                data-testid="button-draft-communication"
              >
                <MessageSquareText className="h-4 w-4" /> Draft communication
              </Button>
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

        {/* Overlap & handoff */}
        <Card id="section-overlap" className="scroll-mt-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <SectionTitle icon={<UserCog className="h-4 w-4" />}>Ownership & Overlap</SectionTitle>
              <HandoffDialog clientId={client.id} currentOwner={client.nextOwner} onDone={invalidateClient} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Co-owner</Label>
                <Select
                  value={client.coOwner || "__none__"}
                  onValueChange={(v) =>
                    updateClientM.mutate({ clientId: client.id, data: { coOwner: v === "__none__" ? "" : v } })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {OWNER_OPTIONS.filter((o) => o !== client.nextOwner).map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Involvement state</Label>
                <Select
                  value={client.involvementState || "Sole"}
                  onValueChange={(v) => updateClientM.mutate({ clientId: client.id, data: { involvementState: v } })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOLVEMENT_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Touch cadence (days)</Label>
                <Input
                  type="number"
                  min={1}
                  defaultValue={client.touchCadenceDays}
                  key={client.touchCadenceDays}
                  onBlur={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!Number.isNaN(n) && n > 0 && n !== client.touchCadenceDays) {
                      updateClientM.mutate({ clientId: client.id, data: { touchCadenceDays: n } });
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Critical alerts */}
        {alerts.length > 0 && (
          <Card className="border-red-300 bg-red-50/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700 font-semibold mb-2">
                <AlertTriangle className="h-4 w-4" /> Critical Alerts ({alerts.length})
              </div>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {alerts.map((a, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(a.target)}
                      className="group flex w-full gap-2 rounded-md p-1 text-left text-sm transition-colors hover:bg-red-100/70"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                      <span>
                        <span className="font-medium text-red-800 group-hover:underline">{a.label}.</span>{" "}
                        <span className="text-red-700/90">{a.detail}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Overall client health */}
        <Card id="section-health" className="scroll-mt-6 transition-all">
          <CardHeader className="pb-3">
            <SectionTitle icon={<Activity className="h-4 w-4" />}>Overall Client Health</SectionTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-[240px_1fr] sm:items-center">
              <div className="flex justify-center">
                <HealthGauge score={healthScore} />
              </div>
              <div className="space-y-1">
                {healthParts.map((p) => {
                  const clickable = !!p.target;
                  const row = (
                    <>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5">
                          {p.label} <span className="text-muted-foreground">· {p.weight}%</span>
                        </span>
                        <span className="font-medium tabular-nums" style={{ color: healthColor(p.score) }}>
                          {Math.round(p.score)}
                        </span>
                      </div>
                      <Bar value={p.score} color={healthColor(p.score)} />
                    </>
                  );
                  return clickable ? (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => scrollToSection(p.target)}
                      className="block w-full rounded-md p-1.5 text-left transition-colors hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {row}
                    </button>
                  ) : (
                    <div key={p.label} className="p-1.5">{row}</div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
          <Kpi
            icon={<ShieldAlert className="h-4 w-4" />}
            label="Risk Score"
            value={data.risk ? String(data.risk.overallScore) : "—"}
            sub={data.risk ? `trend ${data.risk.trend}` : undefined}
            accent={data.risk ? riskColor(data.risk.overallScore) : "#64748b"}
            alert={!!data.risk && data.risk.overallScore >= 67}
            targetId="section-risk"
          />
          <Kpi
            icon={<ClipboardCheck className="h-4 w-4" />}
            label="Audit Risk"
            value={liveAudit ? String(liveAudit.layerANormalized) : data.audit && data.audit.overallScore > 0 ? `${data.audit.overallScore}%` : "—"}
            sub={liveAudit ? `Live · ${liveAudit.layerABand}` : data.audit?.status}
            accent={liveAudit ? levelColor(liveAudit.finalLevel) : data.audit && data.audit.overallScore > 0 ? scoreColor(data.audit.overallScore) : "#64748b"}
            alert={!!liveAudit && liveAudit.finalLevel === "critical"}
            targetId="section-audit"
          />
          <Kpi
            icon={<Workflow className="h-4 w-4" />}
            label="Open Processes"
            value={String(data.openProcesses.length)}
            sub={`${data.clientProcesses.length} total`}
            accent="#1d6fd6"
            targetId="section-processes"
          />
          <Kpi
            icon={<ListChecks className="h-4 w-4" />}
            label="Open Tasks"
            value={String(data.openTasks.length)}
            sub={data.overdueTasks.length > 0 ? `${data.overdueTasks.length} overdue` : "on track"}
            accent={data.overdueTasks.length > 0 ? "#dc2626" : "#1d6fd6"}
            alert={data.overdueTasks.length > 0}
            targetId="section-tasks"
          />
          <Kpi
            icon={<CircleDollarSign className="h-4 w-4" />}
            label="AR Outstanding"
            value={money(data.arOutstanding)}
            sub={data.arOverdue > 0 ? `${money(data.arOverdue)} overdue` : "current"}
            accent={data.arOverdue > 0 ? "#dc2626" : "#16a34a"}
            alert={data.arOverdue > 0}
            targetId="section-invoices"
          />
          <Kpi
            icon={<Timer className="h-4 w-4" />}
            label="Missed SLAs"
            value={String(data.missedSlas.length)}
            sub={data.atRiskSlas.length > 0 ? `${data.atRiskSlas.length} at risk` : undefined}
            accent={data.missedSlas.length > 0 ? "#dc2626" : "#16a34a"}
            alert={data.missedSlas.length > 0}
            targetId="section-slas"
          />
          <Kpi
            icon={<ShieldAlert className="h-4 w-4" />}
            label="Escalations"
            value={String(data.openEscalations.length)}
            accent={data.openEscalations.length > 0 ? "#dc2626" : "#16a34a"}
            alert={data.openEscalations.length > 0}
            targetId={data.clientEscalations.length > 0 ? "section-escalations" : undefined}
          />
          <Kpi
            icon={<TrendingUp className="h-4 w-4" />}
            label="Expansion Pipeline"
            value={money(data.pipelineValue)}
            sub={`${data.roadmap.length} opportunities`}
            accent="#c79a3b"
            targetId="section-roadmap"
          />
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left + middle (2 cols of content) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live risk scoring */}
            <Card id="section-risk" className="scroll-mt-6 transition-all">
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
            <Card id="section-audit" className="scroll-mt-6 transition-all">
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
                    {!liveAudit && data.audit && (
                      <Badge variant="outline" className={AUDIT_BADGE[data.audit.status]}>
                        {data.audit.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {liveAudit ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground">Layer A (normalized)</div>
                        <div className="text-xl font-bold tabular-nums" style={{ color: levelColor(liveAudit.finalLevel) }}>
                          {liveAudit.layerANormalized}
                        </div>
                        <div className="text-xs text-muted-foreground">{liveAudit.layerABand}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Overall Score</div>
                        <div className="text-xl font-bold tabular-nums">{liveAudit.overallScore}</div>
                        <div className="text-xs text-muted-foreground">Layer B: {liveAudit.layerBBand}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Active Triggers</div>
                        <div className="text-xl font-bold tabular-nums" style={{ color: liveAudit.activeTriggerCount > 0 ? "#b91c1c" : "#16a34a" }}>
                          {liveAudit.activeTriggerCount}
                        </div>
                        <div className="text-xs text-muted-foreground">{liveAudit.findingsCount} findings · {liveAudit.documentsCount} docs</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Audited</div>
                        <div className="font-medium">{fmtDate(liveAudit.auditDate)}</div>
                        <div className="text-xs text-muted-foreground">{liveAudit.reviewer}</div>
                      </div>
                    </div>
                    {liveAuditDetail ? (
                      (() => {
                        const factors = layerAFactors(liveAuditDetail.layerAScores);
                        const max = Math.max(1, ...factors.map((x) => x.value));
                        return (
                          <div className="space-y-2.5">
                            {factors.map((f) => (
                              <div key={f.key}>
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span>{f.label}</span>
                                  <span className="font-medium tabular-nums">{f.value}</span>
                                </div>
                                <Bar value={(f.value / max) * 100} color={levelColor(liveAudit.finalLevel)} />
                              </div>
                            ))}
                          </div>
                        );
                      })()
                    ) : liveAuditDetailLoading ? (
                      <LoadingState message="Reading the depth sounder…" />
                    ) : liveAuditDetailError ? (
                      <p className="text-sm text-red-600">Could not load the live Layer A scoresheet from the portal.</p>
                    ) : null}
                    <div className="mt-4 flex items-center gap-4 text-xs">
                      <Link href="/audit-risk">
                        <span className="inline-flex cursor-pointer items-center gap-1 font-medium text-primary hover:underline">
                          View full audit detail <ChevronRight className="h-3 w-3" />
                        </span>
                      </Link>
                      <a
                        href={getPortalBaseUrl()}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                      >
                        Open portal <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </>
                ) : data.audit ? (
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
            <Card id="section-processes" className="scroll-mt-6 transition-all">
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
            <Card id="section-roadmap" className="scroll-mt-6 transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <SectionTitle icon={<GitBranch className="h-4 w-4" />}>Expansion Roadmap</SectionTitle>
                  <span className="text-sm font-medium text-amber-700">{money(data.pipelineValue)} pipeline</span>
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
                        <div key={x.id} className={`rounded-md border p-3 ${x.pinned ? "border-amber-300 bg-amber-50/40" : ""}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-medium text-sm">
                              {x.pinned && <Pin className="h-3.5 w-3.5 text-amber-700" />}
                              {x.title}
                              {x.priorityBoost > 0 && (
                                <Badge variant="outline" className="border-amber-300 text-amber-700">+{x.priorityBoost} boost</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <div className="text-sm font-semibold text-amber-700">{money(x.potentialValue)}</div>
                              <div className="flex items-center gap-0.5">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  title={x.pinned ? "Unpin" : "Pin"}
                                  disabled={updateMilestoneM.isPending}
                                  onClick={() =>
                                    updateMilestoneM.mutate({ milestoneId: x.id, data: { pinned: !x.pinned } })
                                  }
                                >
                                  {x.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  title="Boost priority"
                                  disabled={updateMilestoneM.isPending}
                                  onClick={() =>
                                    updateMilestoneM.mutate({
                                      milestoneId: x.id,
                                      data: { priorityBoost: Math.min(x.priorityBoost + 10, 50) },
                                    })
                                  }
                                >
                                  <ArrowUp className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  title="Lower priority"
                                  disabled={updateMilestoneM.isPending || x.priorityBoost <= 0}
                                  onClick={() =>
                                    updateMilestoneM.mutate({
                                      milestoneId: x.id,
                                      data: { priorityBoost: Math.max(x.priorityBoost - 10, 0) },
                                    })
                                  }
                                >
                                  <ArrowDown className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {x.description} · {x.owner} · target {fmtDate(x.targetDate)}
                          </div>
                          <div className="flex items-center gap-1">
                            {ROADMAP_STAGES.map((stage, i) => (
                              <div key={stage} className="flex-1 flex flex-col items-center gap-1">
                                <div
                                  className="h-1.5 w-full rounded-full"
                                  style={{ backgroundColor: i <= stageIdx ? "#c79a3b" : "#e2e8f0" }}
                                />
                                <span className={`text-[10px] ${i === stageIdx ? "font-semibold text-amber-700" : "text-muted-foreground"}`}>
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

            {/* Shared activity timeline */}
            <Card id="section-activity" className="scroll-mt-6 transition-all">
              <CardHeader className="pb-3">
                <SectionTitle icon={<History className="h-4 w-4" />}>Shared Activity Timeline</SectionTitle>
              </CardHeader>
              <CardContent>
                {!activity || activity.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No recorded activity yet.</p>
                ) : (
                  <ol className="relative space-y-3 border-l pl-4">
                    {activity.map((a) => (
                      <li key={a.id} className="relative">
                        <span className="absolute -left-[1.3rem] top-1 h-2 w-2 rounded-full bg-amber-600" />
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-medium">{a.summary}</span>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">{fmtDateTime(a.createdAt)}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {a.actorLabel} · {a.action} · {a.entityType}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>

            {/* Invoices / AR */}
            <Card id="section-invoices" className="scroll-mt-6 transition-all">
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
            <Card id="section-notes" className="scroll-mt-6 transition-all">
              <CardHeader className="pb-3">
                <SectionTitle icon={<Phone className="h-4 w-4" />}>Recent Call Notes</SectionTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.notes.length === 0 && <p className="text-sm text-muted-foreground">No call notes yet.</p>}
                {data.notes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => openNote(note.id)}
                    className="block w-full rounded-md border p-3 text-left transition-colors hover:border-primary/50 hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    title="Open in Call Note Processor"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-sm">{fmtDate(note.callDate)} · {note.callType} · {note.caller}</span>
                      <Badge variant="secondary">{note.routingStatus}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{note.cleanSummary || note.rawRingCentralNote}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            {/* Next actions / tasks */}
            <Card id="section-tasks" className="scroll-mt-6 transition-all">
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
                    const linkable = !!t.sourceCallNoteId;
                    return (
                      <div
                        key={t.id}
                        className={`flex items-start justify-between gap-2 rounded-md border p-2.5 ${
                          linkable ? "cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" : ""
                        }`}
                        role={linkable ? "button" : undefined}
                        tabIndex={linkable ? 0 : undefined}
                        onClick={linkable ? () => openNote(t.sourceCallNoteId) : undefined}
                        onKeyDown={
                          linkable
                            ? (e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  openNote(t.sourceCallNoteId);
                                }
                              }
                            : undefined
                        }
                        title={linkable ? "Open source call note in Processor" : undefined}
                      >
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
            <Card id="section-slas" className="scroll-mt-6 transition-all">
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
            <Card id="section-schedule" className="scroll-mt-6 transition-all">
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
            <Card id="section-contact" className="scroll-mt-6 transition-all">
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
              <Card id="section-escalations" className="scroll-mt-6 transition-all">
                <CardHeader className="pb-3">
                  <SectionTitle icon={<ShieldAlert className="h-4 w-4" />}>Escalations</SectionTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.clientEscalations.map((esc) => (
                    <div
                      key={esc.id}
                      className={`rounded-md border border-red-200 bg-red-50/60 p-3 ${
                        esc.sourceCallNoteId ? "cursor-pointer transition-colors hover:border-red-400 hover:bg-red-100/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" : ""
                      }`}
                      role={esc.sourceCallNoteId ? "button" : undefined}
                      tabIndex={esc.sourceCallNoteId ? 0 : undefined}
                      onClick={esc.sourceCallNoteId ? () => openNote(esc.sourceCallNoteId) : undefined}
                      onKeyDown={
                        esc.sourceCallNoteId
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openNote(esc.sourceCallNoteId);
                              }
                            }
                          : undefined
                      }
                      title={esc.sourceCallNoteId ? "Open source call note in Processor" : undefined}
                    >
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
              <Card id="section-signals" className="scroll-mt-6 transition-all">
                <CardHeader className="pb-3">
                  <SectionTitle icon={<TrendingUp className="h-4 w-4" />}>Opportunity Signals</SectionTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.clientSignals.map((s) => (
                    <div
                      key={s.id}
                      className={`rounded-md border p-2.5 ${
                        s.sourceCallNoteId ? "cursor-pointer transition-colors hover:border-primary/50 hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary" : ""
                      }`}
                      role={s.sourceCallNoteId ? "button" : undefined}
                      tabIndex={s.sourceCallNoteId ? 0 : undefined}
                      onClick={s.sourceCallNoteId ? () => openNote(s.sourceCallNoteId) : undefined}
                      onKeyDown={
                        s.sourceCallNoteId
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                openNote(s.sourceCallNoteId);
                              }
                            }
                          : undefined
                      }
                      title={s.sourceCallNoteId ? "Open source call note in Processor" : undefined}
                    >
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
