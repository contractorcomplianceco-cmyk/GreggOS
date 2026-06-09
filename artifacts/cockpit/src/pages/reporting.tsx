import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import {
  useGetRelationshipReport,
  useGetExpansionReport,
  useGetActivityReport,
  useListCrmLinks,
  useListCrmExport,
} from "@workspace/api-client-react";
import type {
  RelationshipReport,
  ExpansionReport,
  ActivityReport,
  CrmLink,
  CrmExportPayload,
} from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, CheckCircle2, Eye } from "lucide-react";

const WINDOWS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

function money(n: number): string {
  return `$${(n ?? 0).toLocaleString("en-US")}`;
}

function Kpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "primary" | "accent" | "destructive" | "border";
}) {
  const bar =
    accent === "accent"
      ? "bg-accent"
      : accent === "destructive"
        ? "bg-destructive"
        : accent === "border"
          ? "bg-border"
          : "bg-primary";
  return (
    <Card className="relative overflow-hidden shadow-sm">
      <div className={`absolute inset-x-0 top-0 h-1 ${bar}`} />
      <CardContent className="p-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <div className="mt-3 text-3xl font-semibold tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

export default function Reporting() {
  const [windowDays, setWindowDays] = useState(30);

  const relQ = useGetRelationshipReport({ windowDays });
  const expQ = useGetExpansionReport();
  const actQ = useGetActivityReport({ windowDays });

  const rel = relQ.data as RelationshipReport | undefined;
  const exp = expQ.data as ExpansionReport | undefined;
  const act = actQ.data as ActivityReport | undefined;

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <header className="border-b border-border pb-6 mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            Operations &amp; Leadership
          </p>
          <div className="flex flex-wrap items-end justify-between gap-3 mt-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              Reporting &amp; CRM
            </h1>
            <div className="flex items-center gap-1">
              {WINDOWS.map((w) => (
                <Button
                  key={w.value}
                  variant={windowDays === w.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWindowDays(w.value)}
                  data-testid={`window-${w.value}`}
                >
                  {w.label}
                </Button>
              ))}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
            Portfolio health for Gregg&apos;s operations and leadership review,
            plus the CRM export queue. Nothing is pushed automatically — every
            record is human-reviewed and exported on demand.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70 mb-3">
            Expansion revenue
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="Open" value={exp?.openCount ?? "—"} />
            <Kpi
              label="Pipeline value"
              value={exp ? money(exp.pipelineValue) : "—"}
              accent="accent"
            />
            <Kpi
              label="Converted revenue"
              value={exp ? money(exp.convertedRevenue) : "—"}
              accent="accent"
            />
            <Kpi
              label="Win rate"
              value={exp ? `${exp.winRatePct}%` : "—"}
            />
            <Kpi label="Won" value={exp?.wonCount ?? "—"} />
            <Kpi label="Lost" value={exp?.lostCount ?? "—"} />
            <Kpi
              label="Stalled"
              value={exp?.stalledCount ?? "—"}
              accent={exp && exp.stalledCount > 0 ? "destructive" : "border"}
            />
            <Kpi
              label="Tara converted"
              value={exp ? money(exp.taraSharedConvertedRevenue) : "—"}
            />
          </div>
          {exp && exp.byOwner.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Owner</th>
                    <th className="py-2 pr-4 font-medium tabular-nums">Open</th>
                    <th className="py-2 pr-4 font-medium tabular-nums">
                      Pipeline
                    </th>
                    <th className="py-2 pr-4 font-medium tabular-nums">Won</th>
                    <th className="py-2 pr-4 font-medium tabular-nums">
                      Converted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exp.byOwner.map((r) => (
                    <tr key={r.owner} className="border-b border-border/50">
                      <td className="py-2 pr-4">{r.owner}</td>
                      <td className="py-2 pr-4 tabular-nums">{r.openCount}</td>
                      <td className="py-2 pr-4 tabular-nums">
                        {money(r.pipelineValue)}
                      </td>
                      <td className="py-2 pr-4 tabular-nums">{r.wonCount}</td>
                      <td className="py-2 pr-4 tabular-nums">
                        {money(r.convertedRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70 mb-3">
            Relationships ({windowDays}d)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="Clients" value={rel?.totalClients ?? "—"} />
            <Kpi
              label="Touches due"
              value={rel?.touchesDue ?? "—"}
              accent={rel && rel.touchesDue > 0 ? "destructive" : "border"}
            />
            <Kpi
              label="Going cold"
              value={rel?.goingCold ?? "—"}
              accent={rel && rel.goingCold > 0 ? "destructive" : "border"}
            />
            <Kpi
              label="Cadence adherence"
              value={rel ? `${rel.cadenceAdherencePct}%` : "—"}
            />
            <Kpi label="Visits" value={rel?.visitsCompleted ?? "—"} />
            <Kpi label="Meals" value={rel?.mealsCompleted ?? "—"} />
            <Kpi
              label="Tara accounts"
              value={rel?.taraSharedAccounts ?? "—"}
            />
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70 mb-3">
            Follow-through ({windowDays}d)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Kpi label="Open tasks" value={act?.openTasks ?? "—"} />
            <Kpi
              label="Overdue"
              value={act?.overdueTasks ?? "—"}
              accent={act && act.overdueTasks > 0 ? "destructive" : "border"}
            />
            <Kpi label="Completed" value={act?.completedTasks ?? "—"} />
            <Kpi
              label="Completion rate"
              value={act ? `${act.followUpCompletionPct}%` : "—"}
            />
            <Kpi label="Touches logged" value={act?.touchesLogged ?? "—"} />
            <Kpi label="Handoffs" value={act?.handoffs ?? "—"} />
          </div>
        </section>

        <CrmExportCenter />
      </div>
    </SidebarLayout>
  );
}

function CrmExportCenter() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { callNotes, tasks, clients, approveForCrm, updateCrmLink } =
    useStore();

  const linksQ = useListCrmLinks();
  const exportQ = useListCrmExport();
  const links = (linksQ.data ?? []) as CrmLink[];
  const payloads = (exportQ.data ?? []) as CrmExportPayload[];

  const [preview, setPreview] = useState<CrmExportPayload | null>(null);
  const [recordIds, setRecordIds] = useState<Record<string, string>>({});

  const clientName = (id?: string | null) =>
    id ? clients.find((c) => c.id === id)?.clientName ?? "Unknown" : "—";

  const linkFor = (entityType: string, entityId: string) =>
    links.find((l) => l.entityType === entityType && l.entityId === entityId);

  const invalidate = () => {
    void qc.invalidateQueries();
  };

  const approve = async (
    entityType: string,
    entityId: string,
    crmModule: string,
    clientId?: string | null,
  ) => {
    try {
      await approveForCrm({
        entityType,
        entityId,
        crmModule,
        ...(clientId ? { clientId } : {}),
      });
      invalidate();
      toast({
        title: "Approved for CRM",
        description: `Queued for Zoho ${crmModule} export.`,
      });
    } catch {
      toast({
        title: "Could not approve",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const markPushed = async (link: CrmLink) => {
    try {
      await updateCrmLink(link.id, {
        syncStatus: "pushed",
        crmRecordId: recordIds[link.id] || undefined,
      });
      invalidate();
      toast({
        title: "Marked pushed",
        description: "Recorded as exported to the CRM.",
      });
    } catch {
      toast({
        title: "Could not update",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const crmReadyNotes = callNotes.filter(
    (n) => n.routingStatus === "CRM-ready" || n.routingStatus === "Copied to CRM",
  );
  const openTasks = tasks.filter(
    (t) => t.status !== "Completed" && t.status !== "Canceled",
  );

  const statusBadge = (status: string) => {
    const variant: "default" | "secondary" | "outline" =
      status === "pushed" ? "default" : "secondary";
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <section>
      <div className="border-b border-border pb-2 mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
          CRM export queue
        </h2>
        <p className="text-[11px] text-muted-foreground mt-1">
          Approve records here, then export and mark them pushed once entered in
          Zoho. Export-only — no live sync.
        </p>
      </div>

      <Tabs defaultValue="queue">
        <TabsList className="mb-4">
          <TabsTrigger value="queue">
            Export queue
            <Badge variant="secondary" className="ml-2">
              {links.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="notes">
            Call notes
            <Badge variant="secondary" className="ml-2">
              {crmReadyNotes.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks
            <Badge variant="secondary" className="ml-2">
              {openTasks.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          {links.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing approved yet. Approve call notes, tasks, or expansion
              deals to populate the export queue.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-[0.1em] text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Record</th>
                    <th className="py-2 pr-4 font-medium">Module</th>
                    <th className="py-2 pr-4 font-medium">Client</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                    <th className="py-2 pr-4 font-medium">CRM record id</th>
                    <th className="py-2 pr-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((link) => {
                    const p = payloads.find(
                      (x) =>
                        x.entityType === link.entityType &&
                        x.entityId === link.entityId,
                    );
                    return (
                      <tr
                        key={link.id}
                        className="border-b border-border/50 align-top"
                        data-testid={`crm-link-${link.id}`}
                      >
                        <td className="py-2 pr-4 max-w-[260px]">
                          {p?.recordTitle ?? link.entityType}
                        </td>
                        <td className="py-2 pr-4">{link.crmModule}</td>
                        <td className="py-2 pr-4">{clientName(link.clientId)}</td>
                        <td className="py-2 pr-4">
                          {statusBadge(link.syncStatus)}
                        </td>
                        <td className="py-2 pr-4">
                          {link.syncStatus === "pushed" ? (
                            <span className="text-xs text-muted-foreground">
                              {link.crmRecordId || "—"}
                            </span>
                          ) : (
                            <Input
                              value={recordIds[link.id] ?? ""}
                              onChange={(e) =>
                                setRecordIds((s) => ({
                                  ...s,
                                  [link.id]: e.target.value,
                                }))
                              }
                              placeholder="Zoho id"
                              className="h-8 w-[120px]"
                              data-testid={`record-id-${link.id}`}
                            />
                          )}
                        </td>
                        <td className="py-2 pr-0">
                          <div className="flex items-center justify-end gap-1">
                            {p ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8"
                                onClick={() => setPreview(p)}
                                data-testid={`preview-${link.id}`}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            ) : null}
                            {link.syncStatus !== "pushed" ? (
                              <Button
                                size="sm"
                                className="h-8"
                                onClick={() => markPushed(link)}
                                data-testid={`mark-pushed-${link.id}`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Mark pushed
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="notes">
          <div className="space-y-2">
            {crmReadyNotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No CRM-ready call notes.
              </p>
            ) : (
              crmReadyNotes.map((n) => {
                const link = linkFor("call_note", n.id);
                return (
                  <Card
                    key={n.id}
                    className="p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {clientName(n.clientId)} — {n.callType}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {n.crmReadyNote || n.cleanSummary || "No summary"}
                      </p>
                    </div>
                    {link ? (
                      statusBadge(link.syncStatus)
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          approve("call_note", n.id, "Notes", n.clientId)
                        }
                        data-testid={`approve-note-${n.id}`}
                      >
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        Approve for CRM
                      </Button>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="space-y-2">
            {openTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open tasks.</p>
            ) : (
              openTasks.map((t) => {
                const link = linkFor("task", t.id);
                return (
                  <Card
                    key={t.id}
                    className="p-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {clientName(t.clientId)} · {t.owner || "Unassigned"} ·{" "}
                        {t.status}
                      </p>
                    </div>
                    {link ? (
                      statusBadge(link.syncStatus)
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => approve("task", t.id, "Tasks", t.clientId)}
                        data-testid={`approve-task-${t.id}`}
                      >
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        Approve for CRM
                      </Button>
                    )}
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={preview !== null}
        onOpenChange={(o) => (!o ? setPreview(null) : undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CRM export payload</DialogTitle>
          </DialogHeader>
          {preview ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{preview.crmModule}</Badge>
                <span className="text-muted-foreground">
                  {preview.recordTitle}
                </span>
              </div>
              <pre className="text-xs bg-muted/40 rounded-md p-3 overflow-x-auto max-h-[360px]">
                {JSON.stringify(preview.fields, null, 2)}
              </pre>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void navigator.clipboard?.writeText(
                    JSON.stringify(preview.fields, null, 2),
                  );
                  toast({ title: "Copied", description: "Payload copied." });
                }}
                data-testid="copy-payload"
              >
                Copy JSON
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
