import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

type Filter = "All" | "High priority" | "At risk" | "Due soon" | "Has escalation";

const FILTERS: Filter[] = ["All", "High priority", "At risk", "Due soon", "Has escalation"];

export default function GreggToday() {
  const { clients, tasks, escalations } = useStore();
  const [filter, setFilter] = useState<Filter>("All");

  const openEscalations = escalations.filter(
    (e) => e.status === "Open" || e.status === "Under Review"
  );
  const greggTasks = tasks.filter((t) => t.owner === "Gregg" && t.status !== "Completed");
  const escalationClientIds = new Set(openEscalations.map((e) => e.clientId));

  const today = new Date();
  const soon = new Date();
  soon.setDate(today.getDate() + 7);

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

  return (
    <SidebarLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Gregg Today</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Priority Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{priorityCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Open Escalations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{openEscalations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">My Open Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{greggTasks.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Client Focus</h2>
            <div className="space-y-4">
              {focusClients.map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <Card className="p-4 border-l-4 border-l-primary cursor-pointer hover:bg-accent/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">{client.clientName}</h3>
                        <p className="text-sm text-muted-foreground">{client.companyName}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={client.greggPriority === "Urgent" ? "destructive" : "default"}>
                          {client.greggPriority}
                        </Badge>
                        <Badge variant="outline">{client.clientStatus}</Badge>
                      </div>
                    </div>
                    <div className="mt-3 text-sm">
                      <strong>Next Action:</strong> {client.nextAction} <br />
                      <strong>Owner:</strong> {client.nextOwner} &middot; <strong>Due:</strong>{" "}
                      {client.dueDate}
                    </div>
                  </Card>
                </Link>
              ))}
              {focusClients.length === 0 && (
                <p className="text-muted-foreground text-sm">No clients match this filter.</p>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Open Escalations</h2>
            <div className="space-y-4">
              {openEscalations.map((esc) => {
                const client = clients.find((c) => c.id === esc.clientId);
                return (
                  <Card key={esc.id} className="p-4 border-l-4 border-l-destructive">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{esc.reason}</h3>
                        <p className="text-sm text-muted-foreground">{client?.clientName}</p>
                      </div>
                      <Badge variant="destructive">{esc.riskLevel} Risk</Badge>
                    </div>
                    <div className="mt-2 text-sm">
                      <p>{esc.decisionNeeded}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Deadline: {esc.deadline}</p>
                    </div>
                  </Card>
                );
              })}
              {openEscalations.length === 0 && (
                <p className="text-muted-foreground text-sm">No open escalations.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
