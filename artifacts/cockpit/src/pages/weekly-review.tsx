import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeeklyReview() {
  const { clients, tasks, escalations, signals, callNotes } = useStore();

  const chartData = [
    { name: 'Mon', processed: 4, tasks: 3 },
    { name: 'Tue', processed: 3, tasks: 5 },
    { name: 'Wed', processed: 2, tasks: 2 },
    { name: 'Thu', processed: 6, tasks: 4 },
    { name: 'Fri', processed: 1, tasks: 1 },
  ];

  return (
    <SidebarLayout>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Weekly Review</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Calls Processed</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-primary">{callNotes.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Tasks Created</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-accent">{tasks.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Open Escalations</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-destructive">{escalations.filter(e => e.status !== 'Resolved').length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Opportunities</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-green-600">{signals.length}</div></CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Activity Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="processed" name="Notes Processed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="tasks" name="Tasks Created" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2 border-b mb-2">
                <CardTitle className="text-lg">At-Risk Accounts</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y text-sm">
                  {clients.filter(c => c.riskLevel === 'High' || c.riskLevel === 'Critical').map(client => (
                    <li key={client.id} className="p-4 hover:bg-muted/50">
                      <div className="font-medium">{client.clientName}</div>
                      <div className="text-muted-foreground text-xs mt-1">Next Action: {client.nextAction}</div>
                    </li>
                  ))}
                  {clients.filter(c => c.riskLevel === 'High' || c.riskLevel === 'Critical').length === 0 && (
                    <li className="p-4 text-muted-foreground text-center">No high-risk accounts.</li>
                  )}
                </ul>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2 border-b mb-2">
                <CardTitle className="text-lg">Stalled Clients</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y text-sm">
                  {clients.filter(c => c.clientStatus === 'Stalled').map(client => (
                    <li key={client.id} className="p-4 hover:bg-muted/50">
                      <div className="font-medium">{client.clientName}</div>
                      <div className="text-muted-foreground text-xs mt-1">Waiting on: {client.nextOwner}</div>
                    </li>
                  ))}
                  {clients.filter(c => c.clientStatus === 'Stalled').length === 0 && (
                    <li className="p-4 text-muted-foreground text-center">No stalled clients.</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}