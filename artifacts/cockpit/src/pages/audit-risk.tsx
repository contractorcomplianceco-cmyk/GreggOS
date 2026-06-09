import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ShieldAlert,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  FileWarning,
  Building2,
  ExternalLink,
} from "lucide-react";
import {
  useAudits,
  useAuditDetail,
  useAuditPortalHealth,
  getPortalBaseUrl,
  levelColor,
  layerAFactors,
  type AuditSummary,
  type AuditFinding,
} from "@/lib/auditPortal";

function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtMoney(value: number | null | undefined): string {
  if (value == null) return "—";
  return `$${value.toLocaleString()}`;
}

function ProfileItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}

function LevelBadge({ level, label }: { level: string; label: string }) {
  const color = levelColor(level);
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: `${color}1a`, color }}
    >
      {label}
    </span>
  );
}

function FindingRow({ f }: { f: AuditFinding }) {
  return (
    <div className="rounded-md border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          {f.isCriticalTrigger && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />}
          <div>
            <div className="text-sm font-semibold">{f.title}</div>
            <div className="text-xs text-muted-foreground">
              {f.domain}
              {f.jurisdiction ? ` · ${f.jurisdiction}` : ""}
            </div>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-base font-bold tabular-nums" style={{ color: f.rawRisk >= 30 ? "#b91c1c" : f.rawRisk >= 15 ? "#d97706" : "#16a34a" }}>
            {f.rawRisk}
          </div>
          <div className="text-[10px] uppercase text-muted-foreground">raw risk</div>
        </div>
      </div>
      {f.summary && <p className="mt-2 text-sm text-muted-foreground">{f.summary}</p>}
      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        <Badge variant="outline">Severity {f.severity}</Badge>
        <Badge variant="outline">Likelihood {f.likelihood}</Badge>
        {f.actionPriority && (
          <Badge
            variant="outline"
            className={f.actionPriority === "Critical" ? "border-red-300 text-red-700" : ""}
          >
            {f.actionPriority}
          </Badge>
        )}
        {f.evidenceStatus && <Badge variant="outline">{f.evidenceStatus}</Badge>}
        {f.reviewerClearance && <Badge variant="outline">{f.reviewerClearance}</Badge>}
      </div>
      {f.recommendedAction && (
        <div className="mt-2 text-xs">
          <span className="font-semibold">Recommended: </span>
          <span className="text-muted-foreground">{f.recommendedAction}</span>
        </div>
      )}
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
        {f.actionOwner && <span>Owner: {f.actionOwner}</span>}
        {f.dueDate && <span>Due: {fmtDate(f.dueDate)}</span>}
        {f.reviewer && <span>Reviewer: {f.reviewer}</span>}
      </div>
    </div>
  );
}

function AuditDetailPanel({ summary }: { summary: AuditSummary }) {
  const { data, isLoading, isError, error } = useAuditDetail(summary.id);

  if (isLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading audit detail…</div>;
  }
  if (isError || !data) {
    return (
      <div className="p-6 text-sm text-red-600">
        Could not load audit detail. {error instanceof Error ? error.message : ""}
      </div>
    );
  }

  const factors = layerAFactors(data.layerAScores);
  const maxFactor = Math.max(1, ...factors.map((f) => f.value));
  const sortedFindings = [...data.findings].sort((a, b) => {
    if (a.isCriticalTrigger !== b.isCriticalTrigger) return a.isCriticalTrigger ? -1 : 1;
    return b.rawRisk - a.rawRisk;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-lg font-bold">{data.clientName}</div>
              <div className="text-xs text-muted-foreground">
                {data.auditCode} · {data.legalEntityName || data.clientName}
                {data.dba ? ` (DBA ${data.dba})` : ""}
              </div>
            </div>
            <LevelBadge level={summary.finalLevel} label={summary.finalStatus} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Layer A (normalized)</div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: levelColor(summary.finalLevel) }}>
                {summary.layerANormalized}
              </div>
              <div className="text-xs text-muted-foreground">{summary.layerABand}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Overall Score</div>
              <div className="text-2xl font-bold tabular-nums">{summary.overallScore}</div>
              <div className="text-xs text-muted-foreground">Layer B: {summary.layerBBand}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Active Triggers</div>
              <div className="text-2xl font-bold tabular-nums" style={{ color: summary.activeTriggerCount > 0 ? "#b91c1c" : "#16a34a" }}>
                {summary.activeTriggerCount}
              </div>
              <div className="text-xs text-muted-foreground">{summary.findingsCount} findings</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</div>
              <div className="text-sm font-semibold">{data.status}</div>
              <div className="text-xs text-muted-foreground">QA: {data.qaStatus || "—"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="h-4 w-4" /> Layer A Scoresheet
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {factors.map((f) => (
            <div key={f.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span>{f.label}</span>
                <span className="font-semibold tabular-nums">{f.value}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${(f.value / maxFactor) * 100}%`, backgroundColor: levelColor(summary.finalLevel) }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Building2 className="h-4 w-4" /> Entity Profile
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <ProfileItem label="EIN" value={data.ein} />
            <ProfileItem label="Entity Type" value={data.entityType} />
            <ProfileItem label="Home State" value={data.homeState} />
            <ProfileItem label="Active States" value={data.activeStates} />
            <ProfileItem label="Target States" value={data.targetStates} />
            <ProfileItem label="Primary Trades" value={data.primaryTrades} />
            <ProfileItem label="Annual Revenue" value={fmtMoney(data.annualRevenue)} />
            <ProfileItem label="Largest Contract" value={fmtMoney(data.largestContract)} />
            <ProfileItem
              label="Headcount"
              value={`${data.w2Count ?? "—"} W-2 · ${data.contractor1099Count ?? "—"} 1099 · ${data.subCount ?? "—"} sub`}
            />
            <ProfileItem label="Qualifier" value={data.qualifierName} />
            <ProfileItem label="Key Owners" value={data.keyOwners} />
            <ProfileItem label="Reviewer" value={data.reviewer} />
          </div>
          {data.expansionGoal && (
            <div className="mt-3 rounded-md bg-muted/50 p-2 text-xs">
              <span className="font-semibold">Expansion goal: </span>
              {data.expansionGoal}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4" /> Findings ({data.findings.length})
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {sortedFindings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No findings recorded.</p>
          ) : (
            sortedFindings.map((f) => <FindingRow key={f.id} f={f} />)
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <FileWarning className="h-4 w-4" /> Documents ({data.documents.length})
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents tracked.</p>
          ) : (
            data.documents.map((doc) => (
              <div key={doc.id} className="flex items-start justify-between gap-3 rounded-md border p-2.5 text-sm">
                <div>
                  <div className="font-medium">{doc.documentType}</div>
                  <div className="text-xs text-muted-foreground">
                    {doc.domain}
                    {doc.required ? " · Required" : ""}
                    {doc.deficiencyNote ? ` · ${doc.deficiencyNote}` : ""}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    (doc.evidenceStatus || "").toLowerCase().includes("missing")
                      ? "border-red-300 text-red-700"
                      : (doc.evidenceStatus || "").toLowerCase().includes("received")
                        ? "border-green-300 text-green-700"
                        : ""
                  }
                >
                  {doc.evidenceStatus || "—"}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="text-sm font-semibold">Monitoring</div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ProfileItem label="Monitoring" value={data.monitoringStatus} />
            <ProfileItem label="Frequency" value={data.reviewFrequency} />
            <ProfileItem label="Next Review" value={fmtDate(data.nextReviewDate)} />
            <ProfileItem label="Last Reviewed" value={fmtDateTime(data.lastReviewedAt)} />
          </div>
          {data.scope && (
            <div className="mt-3 text-xs">
              <span className="font-semibold">Scope: </span>
              <span className="text-muted-foreground">{data.scope}</span>
            </div>
          )}
          {data.notes && (
            <div className="mt-1 text-xs">
              <span className="font-semibold">Notes: </span>
              <span className="text-muted-foreground">{data.notes}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuditRisk() {
  const health = useAuditPortalHealth();
  const { data: audits, isLoading, isError, error, refetch, isFetching } = useAudits();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const sortedAudits = useMemo(() => {
    if (!audits) return [];
    const rank: Record<string, number> = { critical: 3, elevated: 2, low: 1 };
    return [...audits].sort((a, b) => {
      const ra = rank[(a.finalLevel || "").toLowerCase()] ?? 0;
      const rb = rank[(b.finalLevel || "").toLowerCase()] ?? 0;
      if (ra !== rb) return rb - ra;
      return b.layerANormalized - a.layerANormalized;
    });
  }, [audits]);

  useEffect(() => {
    if (selectedId == null && sortedAudits.length > 0) {
      setSelectedId(sortedAudits[0].id);
    }
  }, [sortedAudits, selectedId]);

  const selected = sortedAudits.find((a) => a.id === selectedId) ?? null;
  const portalHost = getPortalBaseUrl().replace(/^https?:\/\//, "");
  const online = health.isSuccess && health.data?.status === "ok";

  return (
    <SidebarLayout>
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Risk</h1>
            <p className="text-sm text-muted-foreground">
              Live audit risk assessments from the CCA Audit Risk Portal.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                online
                  ? "bg-green-100 text-green-700"
                  : health.isLoading
                    ? "bg-slate-100 text-slate-600"
                    : "bg-red-100 text-red-700"
              }`}
              title={getPortalBaseUrl()}
            >
              {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {online ? "Live" : health.isLoading ? "Connecting…" : "Offline"}
              <span className="opacity-70">· {portalHost}</span>
            </span>
            <a
              href={getPortalBaseUrl()}
              target="_blank"
              rel="noreferrer"
              className="text-muted-foreground hover:text-foreground"
              title="Open portal"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">Loading audits…</div>
        ) : isError ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-6 text-sm text-red-700">
            <div className="font-semibold">Unable to reach the audit portal.</div>
            <div className="mt-1">{error instanceof Error ? error.message : "Unknown error."}</div>
            <div className="mt-1 text-red-600/80">
              The portal at {portalHost} may be asleep or unavailable. Use Refresh to retry.
            </div>
          </div>
        ) : sortedAudits.length === 0 ? (
          <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
            No audits found in the portal.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_1fr]">
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {sortedAudits.length} audit{sortedAudits.length === 1 ? "" : "s"}
              </div>
              {sortedAudits.map((a) => {
                const isActive = a.id === selectedId;
                return (
                  <button
                    key={a.id}
                    onClick={() => setSelectedId(a.id)}
                    className={`w-full rounded-md border p-3 text-left transition-colors ${
                      isActive ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold leading-tight">{a.clientName}</div>
                      <span
                        className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: levelColor(a.finalLevel) }}
                        title={a.finalStatus}
                      />
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {a.auditCode} · {a.homeState}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{a.status}</span>
                      <span className="font-semibold tabular-nums" style={{ color: levelColor(a.finalLevel) }}>
                        {a.layerANormalized} · {a.layerABand}
                      </span>
                    </div>
                    {a.activeTriggerCount > 0 && (
                      <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-red-700">
                        <AlertTriangle className="h-3 w-3" />
                        {a.activeTriggerCount} active trigger{a.activeTriggerCount === 1 ? "" : "s"}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div>{selected ? <AuditDetailPanel summary={selected} /> : null}</div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}
