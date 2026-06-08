import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Clients() {
  const { clients } = useStore();
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("all");
  const [status, setStatus] = useState("all");
  const [risk, setRisk] = useState("all");
  const [owner, setOwner] = useState("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients.filter((c) => {
      const matchesSearch =
        !q ||
        c.clientName.toLowerCase().includes(q) ||
        c.companyName.toLowerCase().includes(q) ||
        c.contactName.toLowerCase().includes(q);
      const matchesPriority = priority === "all" || c.greggPriority === priority;
      const matchesStatus = status === "all" || c.clientStatus === status;
      const matchesRisk = risk === "all" || c.riskLevel === risk;
      const matchesOwner = owner === "all" || c.nextOwner === owner;
      return matchesSearch && matchesPriority && matchesStatus && matchesRisk && matchesOwner;
    });
  }, [clients, search, priority, status, risk, owner]);

  return (
    <SidebarLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Current Clients</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          <Input
            placeholder="Search name, company, contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="lg:col-span-1"
          />
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="At Risk">At Risk</SelectItem>
              <SelectItem value="Onboarding">Onboarding</SelectItem>
              <SelectItem value="Renewal Pending">Renewal Pending</SelectItem>
              <SelectItem value="Stalled">Stalled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={risk} onValueChange={setRisk}>
            <SelectTrigger>
              <SelectValue placeholder="Risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Critical">Critical</SelectItem>
            </SelectContent>
          </Select>
          <Select value={owner} onValueChange={setOwner}>
            <SelectTrigger>
              <SelectValue placeholder="Owner" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Owners</SelectItem>
              <SelectItem value="Gregg">Gregg</SelectItem>
              <SelectItem value="Landon">Landon</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Showing {filtered.length} of {clients.length} clients
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="cursor-pointer hover:bg-accent/10 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{client.clientName}</CardTitle>
                    <Badge variant="outline">{client.clientStatus}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{client.companyName}</p>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <p>
                      <strong>Contact:</strong> {client.contactName}
                    </p>
                    <p className="flex items-center gap-2">
                      <strong>Priority:</strong>{" "}
                      <Badge variant={client.greggPriority === "Urgent" ? "destructive" : "secondary"}>
                        {client.greggPriority}
                      </Badge>
                      <Badge variant="outline">{client.riskLevel} Risk</Badge>
                    </p>
                    <p>
                      <strong>Next Action:</strong> {client.nextAction}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
          {filtered.length === 0 && (
            <p className="text-muted-foreground text-sm col-span-full">
              No clients match the current filters.
            </p>
          )}
        </div>
      </div>
    </SidebarLayout>
  );
}
