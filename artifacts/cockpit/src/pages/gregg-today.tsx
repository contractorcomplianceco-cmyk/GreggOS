import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { Flag, AlertTriangle, ListChecks, ArrowUpRight } from "lucide-react";

type Filter = "All" | "High priority" | "At risk" | "Due soon" | "Has escalation";

const FILTERS: Filter[] = ["All", "High priority", "At risk", "Due soon", "Has escalation"];

export default function GreggToday() {
  const { clients, tasks, escalations } = useStore();
  const [, setLocation] = useLocation();
  const [filter, setFilter] = useState<Filter>("All");

  const openEscalations = escalations.filter(
    (e) => e.status === "Open" || e.status === "Under Review"
  );
  const greggTasks = tasks.filter((t) => t.owner === "Gregg" && t.status !== "Completed");
  const escalationClientIds = new Set(openEscalations.map((e) => e.clientId));

  const today = new Date();
  const soon = new Date();
  soon.setDate(today.getDate() + 7);

  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const isDueSoon = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime()) && d <= soon;
  };

  const matchesFilter = (clientId: string) => {
    const c = clients.find((cl) => cl.id === clientId);
    if (!c) return false;
    switch (filter) {
      case "High priority":
        return c.greggPriority === "High" || c.greggPriority === "Urgent";
      case "At risk":
        return c.clientStatus === "At Risk" || c.riskLevel === "High" || c.riskLevel === "Critical";
      case "Due soon":
        return isDueSoon(c.dueDate);
      case "Has escalation":
        return escalationClientIds.has(c.id);
      case "All":
      default:
        return true;
    }
  };

  const focusClients = clients
    .filter((c) => c.greggPriority === "High" || c.greggPriority === "Urgent" || matchesFilter(c.id))
    .filter((c) => matchesFilter(c.id));

  const priorityCount = clients.filter(
    (c) => c.greggPriority === "High" || c.greggPriority === "Urgent"
  ).length;

  const summaryParts: string[] = [];
  if (priorityCount > 0)
    summaryParts.push(`${priorityCount} priority ${priorityCount === 1 ? "account" : "accounts"}`);
  if (openEscalations.length > 0)
    summaryParts.push(
      `${openEscalations.length} open ${openEscalations.length === 1 ? "escalation" : "escalations"}`
    );
  if (greggTasks.length > 0)
    summaryParts.push(`${greggTasks.length} open ${greggTasks.length === 1 ? "task" : "tasks"}`);

  const summary =
    summaryParts.length > 0
      ? `${summaryParts.join(", ")} on your desk today.`
      : "No priority items outstanding. The portfolio is current.";

  const kpis = [
    {
      label: "Priority Clients",
      value: priorityCount,
      sub: "High & urgent accounts",
      icon: Flag,
      accent: "bg-primary",
      filter: "High priority" as Filter,
    },
    {
      label: "Open Escalations",
      value: openEscalations.length,
      sub: "Awaiting your decision",
      icon: AlertTriangle,
      accent: openEscalations.length > 0 ? "bg-destructive" : "bg-border",
      filter: "Has escalation" as Filter,
    },
    {
      label: "My Open Tasks",
      value: greggTasks.length,
      sub: "Assigned to Gregg",
      icon: ListChecks,
      accent: "bg-accent",
      filter: null,
      href: "/oversight",
    },
  ];

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <header className="border-b border-border pb-6 mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            Executive Briefing
          </p>
          <div className="flex flex-wrap items-end justify-between gap-2 mt-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">Gregg Today</h1>
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">{summary}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            const activate = () => {
              if (kpi.filter) setFilter(kpi.filter);
              else if (kpi.href) setLocation(kpi.href);
            };
            const active = kpi.filter != null && filter === kpi.filter;
            return (
              <Card
                key={kpi.label}
                role="button"
                tabIndex={0}
                onClick={activate}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    activate();
                  }
                }}
                className={`relative overflow-hidden shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-px focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active ? "ring-2 ring-accent" : ""
                }`}
              >
                <div className={`absolute inset-x-0 top-0 h-1 ${kpi.accent}`} />
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                      {kpi.label}
                    </p>
                    <Icon className="h-4 w-4 text-muted-foreground/50" />
                  </div>
                  <div className="mt-4 text-4xl font-semibold tracking-tight tabular-nums">
                    {kpi.value}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{kpi.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground mr-1">
            Filter
          </span>
          {FILTERS.map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <section>
            <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/80">
                Client Focus
              </h2>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {focusClients.length}
              </span>
            </div>
            <div className="space-y-4">
              {focusClients.map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <Card className="group p-5 border-l-4 border-l-primary cursor-pointer transition-all hover:shadow-md hover:-translate-y-px">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold text-lg leading-tight">{client.clientName}</h3>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors" />
                        </div>
                        <p className="text-sm text-muted-foreground">{client.companyName}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={client.greggPriority === "Urgent" ? "destructive" : "default"}>
                          {client.greggPriority}
                        </Badge>
                        <Badge variant="outline">{client.clientStatus}</Badge>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/60 space-y-2 text-sm">
                      <div>
                        <span className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                          Next Action
                        </span>
                        <p className="text-foreground">{client.nextAction}</p>
                      </div>
                      <div className="flex gap-6 text-xs text-muted-foreground">
                        <span>
                          <span className="font-medium uppercase tracking-[0.1em]">Owner</span>{" "}
                          <span className="text-foreground">{client.nextOwner}</span>
                        </span>
                        <span>
                          <span className="font-medium uppercase tracking-[0.1em]">Due</span>{" "}
                          <span className="text-foreground tabular-nums">{client.dueDate}</span>
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
              {focusClients.length === 0 && (
                <p className="text-muted-foreground text-sm">No clients match this filter.</p>
              )}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between border-b border-border pb-2 mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/80">
                Open Escalations
              </h2>
              <span className="text-xs font-medium text-muted-foreground tabular-nums">
                {openEscalations.length}
              </span>
            </div>
            <div className="space-y-4">
              {openEscalations.map((esc) => {
                const client = clients.find((c) => c.id === esc.clientId);
                return (
                  <Link key={esc.id} href={`/clients/${esc.clientId}`}>
                  <Card className="group p-5 border-l-4 border-l-destructive cursor-pointer transition-all hover:shadow-md hover:-translate-y-px">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-semibold leading-tight">{esc.reason}</h3>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/60 transition-colors" />
                        </div>
                        <p className="text-sm text-muted-foreground">{client?.clientName}</p>
                      </div>
                      <Badge variant="destructive">{esc.riskLevel} Risk</Badge>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/60 text-sm">
                      <p className="text-foreground">{esc.decisionNeeded}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium uppercase tracking-[0.1em]">Deadline</span>{" "}
                        <span className="tabular-nums">{esc.deadline}</span>
                      </p>
                    </div>
                  </Card>
                  </Link>
                );
              })}
              {openEscalations.length === 0 && (
                <p className="text-muted-foreground text-sm">No open escalations.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </SidebarLayout>
  );
}
