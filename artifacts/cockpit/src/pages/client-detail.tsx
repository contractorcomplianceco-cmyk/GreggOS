import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useStore } from "@/lib/store";
import { useParams, Link } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { clients, callNotes, tasks, escalations, signals } = useStore();

  const client = clients.find(c => c.id === id);

  if (!client) {
    return (
      <SidebarLayout>
        <div className="p-8">
          <h1 className="text-2xl">Client not found</h1>
          <Link href="/clients"><Button className="mt-4">Back to Clients</Button></Link>
        </div>
      </SidebarLayout>
    );
  }

  const clientNotes = callNotes.filter(n => n.clientId === id);
  const clientTasks = tasks.filter(t => t.clientId === id);
  const clientEscalations = escalations.filter(e => e.clientId === id);
  const clientSignals = signals.filter(s => s.clientId === id);

  return (
    <SidebarLayout>
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold">{client.clientName}</h1>
            <p className="text-muted-foreground text-lg">{client.companyName}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-sm px-3 py-1">{client.clientStatus}</Badge>
            <Badge variant={client.greggPriority === 'Urgent' ? 'destructive' : 'default'} className="text-sm px-3 py-1">Priority: {client.greggPriority}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Contact</CardTitle></CardHeader>
            <CardContent>
              <p className="font-medium">{client.contactName}</p>
              <p className="text-sm">{client.phone}</p>
              <p className="text-sm">{client.email}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Relationship Status</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm"><strong>Last Contact:</strong> {client.lastMeaningfulContact}</p>
              <p className="text-sm"><strong>Next Action:</strong> {client.nextAction}</p>
              <p className="text-sm"><strong>Due:</strong> {client.dueDate}</p>
              <p className="text-sm"><strong>Owner:</strong> {client.nextOwner}</p>
            </CardContent>
          </Card>
          <Card className={client.riskLevel === 'High' || client.riskLevel === 'Critical' ? 'border-destructive' : ''}>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Risk & Needs</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm"><strong>Risk Level:</strong> <Badge variant={client.riskLevel === 'High' || client.riskLevel === 'Critical' ? 'destructive' : 'outline'}>{client.riskLevel}</Badge></p>
              <p className="text-sm"><strong>Missing Info:</strong> {client.missingInformation}</p>
              <p className="text-sm"><strong>Open Tasks:</strong> {clientTasks.length}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Recent Call Notes</h2>
            <div className="space-y-4">
              {clientNotes.map(note => (
                <Card key={note.id} className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">{note.callDate} - {note.callType}</span>
                    <Badge variant="secondary">{note.routingStatus}</Badge>
                  </div>
                  <p className="text-sm mt-2">{note.crmReadyNote || note.cleanSummary || note.rawRingCentralNote}</p>
                </Card>
              ))}
              {clientNotes.length === 0 && <p className="text-sm text-muted-foreground">No call notes yet.</p>}
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">Tasks</h2>
              <div className="space-y-2">
                {clientTasks.map(task => (
                  <div key={task.id} className="p-3 border rounded-md flex justify-between items-center bg-card">
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-muted-foreground">Due: {task.dueDate} | Owner: {task.owner}</p>
                    </div>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">Escalations</h2>
              <div className="space-y-2">
                {clientEscalations.map(esc => (
                  <div key={esc.id} className="p-3 border border-destructive/50 rounded-md bg-destructive/10">
                    <div className="flex justify-between">
                      <p className="font-medium text-sm text-destructive">{esc.reason}</p>
                      <Badge variant="destructive">{esc.status}</Badge>
                    </div>
                    <p className="text-xs mt-1">Needed: {esc.decisionNeeded}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}