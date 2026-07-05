import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { Link, useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { ArrowDown, ArrowUp, ArrowUpDown, AlertTriangle, X, ChevronRight } from "lucide-react";
import type {
  CurrentClient,
  ClientStatus,
  Priority,
  RiskLevel,
} from "@/lib/types";

const STATUS_COLORS: Record<ClientStatus, string> = {
  Active: "#16a34a",
  "At Risk": "#dc2626",
  Onboarding: "#1d6fd6",
  "Renewal Pending": "#c79a3b",
  Stalled: "#64748b",
};

const RISK_COLORS: Record<RiskLevel, string> = {
  Low: "#16a34a",
  Medium: "#d97706",
  High: "#ef4444",
  Critical: "#b91c1c",
};

const PRIORITY_ORDER: Record<Priority, number> = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

const RISK_ORDER: Record<RiskLevel, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

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

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(target: Date, base: Date): number {
  const ms = startOfDay(target).getTime() - startOfDay(base).getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

type SortKey =
  | "clientName"
  | "clientStatus"
  | "greggPriority"
  | "riskLevel"
  | "nextOwner"
  | "openTasks"
  | "escalations"
  | "opportunitySignals"
  | "callNotes"
  | "dueDate"
  | "lastMeaningfulContact";

type SortDir = "asc" | "desc";

type Drill =
  | { type: "all" }
  | { type: "status"; value: ClientStatus }
  | { type: "risk"; value: RiskLevel }
  | { type: "owner"; value: string }
  | { type: "atRisk" }
  | { type: "overdue" }
  | { type: "hasEscalation" }
  | { type: "hasTasks" }
  | { type: "hasSignals" };

function drillLabel(d: Drill): string {
  switch (d.type) {
    case "status":
      return `Status: ${d.value}`;
    case "risk":
      return `Risk: ${d.value}`;
    case "owner":
      return `Owner: ${d.value}`;
    case "atRisk":
      return "At-risk accounts";
    case "overdue":
      return "Accounts with overdue tasks";
    case "hasEscalation":
      return "Accounts with open escalations";
    case "hasTasks":
      return "Accounts with open tasks";
    case "hasSignals":
      return "Accounts with opportunity signals";
    case "all":
    default:
      return "All accounts";
  }
}

export default function Oversight() {
  const { clients, tasks, signals, escalations } = useStore();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("greggPriority");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [drill, setDrill] = useState<Drill | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const today = useMemo(() => startOfDay(new Date()), []);

  const openTasks = tasks.filter(
    (t) => t.status !== "Completed" && t.status !== "Canceled"
  );
  const openEscalations = escalations.filter((e) => e.status !== "Resolved");
  const openSignals = signals.filter((s) => s.status === "Open");

  const overdueTasks = openTasks.filter((t) => {
    const d = parseDate(t.dueDate);
    return d !== null && d < today;
  });

  const overdueClientIds = useMemo(
    () => new Set(overdueTasks.map((t) => t.clientId)),
    [overdueTasks]
  );

  const greggOpenTasks = openTasks.filter((t) => t.owner === "Gregg");
  const landonOpenTasks = openTasks.filter((t) => t.owner === "Landon");

  const applyDrill = (d: Drill) => {
    setDrill(d.type === "all" ? null : d);
    window.setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const statusData = useMemo(() => {
    const counts = new Map<string, number>();
    clients.forEach((c) => counts.set(c.clientStatus, (counts.get(c.clientStatus) ?? 0) + 1));
    return Array.from(counts.entries()).map(([name, value]) => ({ name, value }));
  }, [clients]);

  const riskData = useMemo(() => {
    const order: RiskLevel[] = ["Low", "Medium", "High", "Critical"];
    return order
      .map((level) => ({
        name: level,
        value: clients.filter((c) => c.riskLevel === level).length,
      }))
      .filter((d) => d.value > 0);
  }, [clients]);

  const ownerData = useMemo(() => {
    const owners = Array.from(new Set(clients.map((c) => c.nextOwner))).filter(Boolean);
    return owners.map((owner) => ({
      name: owner,
      Clients: clients.filter((c) => c.nextOwner === owner).length,
      Tasks: openTasks.filter((t) => t.owner === owner).length,
    }));
  }, [clients, openTasks]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "clientName" ? "asc" : "desc");
    }
  };

  const sortValue = (c: CurrentClient, key: SortKey): number | string => {
    switch (key) {
      case "greggPriority":
        return PRIORITY_ORDER[c.greggPriority];
      case "riskLevel":
        return RISK_ORDER[c.riskLevel];
      case "openTasks":
      case "escalations":
      case "opportunitySignals":
      case "callNotes":
        return c[key];
      case "dueDate":
      case "lastMeaningfulContact": {
        const d = parseDate(c[key]);
        return d ? d.getTime() : 0;
      }
      default:
        return c[key].toLowerCase();
    }
  };

  const matchesDrill = (c: CurrentClient): boolean => {
    if (!drill) return true;
    switch (drill.type) {
      case "status":
        return c.clientStatus === drill.value;
      case "risk":
        return c.riskLevel === drill.value;
      case "owner":
        return c.nextOwner === drill.value;
      case "atRisk":
        return (
          c.clientStatus === "At Risk" ||
          c.riskLevel === "High" ||
          c.riskLevel === "Critical"
        );
      case "overdue":
        return overdueClientIds.has(c.id);
      case "hasEscalation":
        return c.escalations > 0;
      case "hasTasks":
        return c.openTasks > 0;
      case "hasSignals":
        return c.opportunitySignals > 0;
      case "all":
      default:
        return true;
    }
  };

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = clients.filter(
      (c) =>
        (!q ||
          c.clientName.toLowerCase().includes(q) ||
          c.companyName.toLowerCase().includes(q) ||
          c.contactName.toLowerCase().includes(q) ||
          c.nextOwner.toLowerCase().includes(q)) &&
        matchesDrill(c)
    );
    const sorted = [...filtered].sort((a, b) => {
      const av = sortValue(a, sortKey);
      const bv = sortValue(b, sortKey);
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, search, sortKey, sortDir, drill, overdueClientIds]);

  const SortHeader = ({ label, k, numeric }: { label: string; k: SortKey; numeric?: boolean }) => (
    <TableHead
      scope="col"
      className={numeric ? "text-right" : undefined}
      aria-sort={sortKey === k ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 font-medium hover:text-foreground transition-colors ${
          sortKey === k ? "text-foreground" : "text-muted-foreground"
        } ${numeric ? "flex-row-reverse" : ""}`}
      >
        {label}
        {sortKey === k ? (
          sortDir === "asc" ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );

  const kpis: {
    label: string;
    value: number;
    sub: string;
    tone?: "warn" | "danger";
    drill: Drill;
  }[] = [
    {
      label: "Total Accounts",
      value: clients.length,
      sub: `${clients.filter((c) => c.clientStatus === "Active").length} active`,
      drill: { type: "all" },
    },
    {
      label: "At Risk",
      value: clients.filter(
        (c) => c.clientStatus === "At Risk" || c.riskLevel === "High" || c.riskLevel === "Critical"
      ).length,
      sub: "status or risk",
      tone: "warn",
      drill: { type: "atRisk" },
    },
    {
      label: "Open Tasks",
      value: openTasks.length,
      sub: `${greggOpenTasks.length} Gregg / ${landonOpenTasks.length} Landon`,
      drill: { type: "hasTasks" },
    },
    {
      label: "Overdue Tasks",
      value: overdueTasks.length,
      sub: "past due date",
      tone: overdueTasks.length > 0 ? "danger" : undefined,
      drill: { type: "overdue" },
    },
    {
      label: "Open Escalations",
      value: openEscalations.length,
      sub: "awaiting decision",
      tone: openEscalations.length > 0 ? "danger" : undefined,
      drill: { type: "hasEscalation" },
    },
    {
      label: "Opportunity Signals",
      value: openSignals.length,
      sub: "open / unactioned",
      drill: { type: "hasSignals" },
    },
  ];

  const isDrillActive = (d: Drill) => {
    if (!drill) return d.type === "all";
    if (drill.type !== d.type) return false;
    if (d.type === "status" || d.type === "risk" || d.type === "owner") {
      return (drill as { value: string }).value === d.value;
    }
    return true;
  };

  return (
    <SidebarLayout>
      <div className="p-8">
        <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold">Account Oversight</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Portfolio-wide view across all {clients.length} current client accounts. Select any
              metric or chart segment to drill into the matching accounts.
            </p>
          </div>
          <Input
            placeholder="Search accounts, contacts, owners..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {kpis.map((kpi) => {
            const active = isDrillActive(kpi.drill);
            return (
              <Card
                key={kpi.label}
                role="button"
                tabIndex={0}
                onClick={() => applyDrill(kpi.drill)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    applyDrill(kpi.drill);
                  }
                }}
                aria-label={`Show ${drillLabel(kpi.drill)}`}
                className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active ? "ring-2 ring-accent" : ""
                }`}
              >
                <CardHeader className="pb-1">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {kpi.label}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className={`text-3xl font-bold ${
                      kpi.tone === "danger"
                        ? "text-destructive"
                        : kpi.tone === "warn"
                        ? "text-amber-600"
                        : ""
                    }`}
                  >
                    {kpi.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Accounts by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    style={{ cursor: "pointer" }}
                    onClick={(d: { name?: string }) =>
                      d?.name && applyDrill({ type: "status", value: d.name as ClientStatus })
                    }
                  >
                    {statusData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name as ClientStatus] ?? "#6b7280"}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Accounts by Risk</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={riskData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    style={{ cursor: "pointer" }}
                    onClick={(d: { name?: string }) =>
                      d?.name && applyDrill({ type: "risk", value: d.name as RiskLevel })
                    }
                  >
                    {riskData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={RISK_COLORS[entry.name as RiskLevel] ?? "#6b7280"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Workload by Owner</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ownerData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: "rgba(0,0,0,0.04)" }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar
                    dataKey="Clients"
                    fill="#2563eb"
                    radius={[4, 4, 0, 0]}
                    style={{ cursor: "pointer" }}
                    onClick={(d: { name?: string }) =>
                      d?.name && applyDrill({ type: "owner", value: d.name })
                    }
                  />
                  <Bar
                    dataKey="Tasks"
                    fill="#64748b"
                    radius={[4, 4, 0, 0]}
                    style={{ cursor: "pointer" }}
                    onClick={(d: { name?: string }) =>
                      d?.name && applyDrill({ type: "owner", value: d.name })
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {(overdueTasks.length > 0 || openEscalations.length > 0) && (
          <Card className="mb-8 border-l-4 border-l-destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-2">
                    Overdue Tasks ({overdueTasks.length})
                  </h3>
                  <div className="space-y-2">
                    {overdueTasks.slice(0, 6).map((t) => {
                      const client = clients.find((c) => c.id === t.clientId);
                      const d = parseDate(t.dueDate);
                      const overdueBy = d ? Math.abs(daysBetween(d, today)) : 0;
                      return (
                        <Link key={t.id} href={`/clients/${t.clientId}`}>
                          <div className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0 cursor-pointer hover:text-foreground group">
                            <div className="min-w-0">
                              <span className="font-medium">{t.title}</span>
                              <span className="text-muted-foreground">
                                {" "}
                                &middot; {client?.clientName ?? "Unknown"} &middot; {t.owner}
                              </span>
                            </div>
                            <Badge variant="destructive" className="shrink-0">
                              {overdueBy}d overdue
                            </Badge>
                          </div>
                        </Link>
                      );
                    })}
                    {overdueTasks.length === 0 && (
                      <p className="text-sm text-muted-foreground">No overdue tasks.</p>
                    )}
                    {overdueTasks.length > 6 && (
                      <button
                        onClick={() => applyDrill({ type: "overdue" })}
                        className="inline-flex items-center gap-0.5 text-xs text-accent hover:underline pt-1"
                      >
                        + {overdueTasks.length - 6} more
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2">
                    Open Escalations ({openEscalations.length})
                  </h3>
                  <div className="space-y-2">
                    {openEscalations.slice(0, 6).map((e) => {
                      const client = clients.find((c) => c.id === e.clientId);
                      return (
                        <Link key={e.id} href={`/clients/${e.clientId}`}>
                          <div className="flex items-center justify-between text-sm border-b pb-1.5 last:border-0 cursor-pointer hover:text-foreground">
                            <div className="min-w-0">
                              <span className="font-medium">{e.reason}</span>
                              <span className="text-muted-foreground">
                                {" "}
                                &middot; {client?.clientName ?? "Unknown"}
                              </span>
                            </div>
                            <Badge
                              variant={
                                e.riskLevel === "Critical" || e.riskLevel === "High"
                                  ? "destructive"
                                  : "secondary"
                              }
                              className="shrink-0"
                            >
                              {e.riskLevel}
                            </Badge>
                          </div>
                        </Link>
                      );
                    })}
                    {openEscalations.length === 0 && (
                      <p className="text-sm text-muted-foreground">No open escalations.</p>
                    )}
                    {openEscalations.length > 6 && (
                      <button
                        onClick={() => applyDrill({ type: "hasEscalation" })}
                        className="inline-flex items-center gap-0.5 text-xs text-accent hover:underline pt-1"
                      >
                        + {openEscalations.length - 6} more
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card ref={tableRef}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <CardTitle className="text-base">All Accounts</CardTitle>
              {drill && (
                <button
                  onClick={() => setDrill(null)}
                  className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent hover:bg-accent/20 transition-colors"
                >
                  {drillLabel(drill)}
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              {rows.length} of {clients.length}
            </span>
          </CardHeader>
          <CardContent className="px-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortHeader label="Account" k="clientName" />
                    <SortHeader label="Status" k="clientStatus" />
                    <SortHeader label="Priority" k="greggPriority" />
                    <SortHeader label="Risk" k="riskLevel" />
                    <SortHeader label="Owner" k="nextOwner" />
                    <SortHeader label="Tasks" k="openTasks" numeric />
                    <SortHeader label="Esc." k="escalations" numeric />
                    <SortHeader label="Signals" k="opportunitySignals" numeric />
                    <SortHeader label="Notes" k="callNotes" numeric />
                    <SortHeader label="Last Contact" k="lastMeaningfulContact" />
                    <SortHeader label="Due" k="dueDate" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((c) => {
                    const due = parseDate(c.dueDate);
                    const overdue = due !== null && due < today && c.openTasks > 0;
                    return (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setLocation(`/clients/${c.id}`)}
                      >
                        <TableCell className="font-medium">
                          <Link
                            href={`/clients/${c.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline focus:outline-none focus-visible:underline"
                          >
                            {c.clientName}
                          </Link>
                          <div className="text-xs text-muted-foreground font-normal">
                            {c.companyName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            style={{
                              borderColor: STATUS_COLORS[c.clientStatus],
                              color: STATUS_COLORS[c.clientStatus],
                            }}
                          >
                            {c.clientStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.greggPriority === "Urgent"
                                ? "destructive"
                                : c.greggPriority === "High"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {c.greggPriority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span style={{ color: RISK_COLORS[c.riskLevel] }} className="font-medium">
                            {c.riskLevel}
                          </span>
                        </TableCell>
                        <TableCell>{c.nextOwner}</TableCell>
                        <TableCell className="text-right tabular-nums">{c.openTasks}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {c.escalations > 0 ? (
                            <span className="text-destructive font-semibold">{c.escalations}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {c.opportunitySignals > 0 ? (
                            c.opportunitySignals
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{c.callNotes}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.lastMeaningfulContact || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          <span className={overdue ? "text-destructive font-medium" : ""}>
                            {c.dueDate || "—"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center text-muted-foreground py-8">
                        No accounts match {drill ? "this filter" : "your search"}.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarLayout>
  );
}
