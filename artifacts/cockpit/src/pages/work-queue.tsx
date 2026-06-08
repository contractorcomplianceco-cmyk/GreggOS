import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const BASE_URL = import.meta.env.BASE_URL;

const STATUSES = ["New", "In review", "Summary drafted", "Gregg review", "CRM-ready", "Copied to CRM"];

export default function WorkQueue() {
  const { callNotes, clients, updateCallNote } = useStore();
  const { toast } = useToast();
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);

  const getClientName = (id: string) => clients.find((c) => c.id === id)?.clientName || "Unknown";

  const notesByStatus = callNotes.reduce(
    (acc, note) => {
      if (note.routingStatus === "Archived") return acc;
      if (!acc[note.routingStatus]) acc[note.routingStatus] = [];
      acc[note.routingStatus].push(note);
      return acc;
    },
    {} as Record<string, typeof callNotes>
  );

  const handleRefresh = () => {
    setRefreshedAt(new Date().toLocaleTimeString());
    toast({ title: "Queue refreshed", description: "Showing the latest call notes." });
  };

  const handleArchive = (id: string) => {
    updateCallNote(id, { routingStatus: "Archived", updatedAt: new Date().toISOString() });
    toast({ title: "Archived", description: "Call note moved to the archive." });
  };

  return (
    <SidebarLayout>
      <div className="p-8 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Landon Work Queue</h1>
            {refreshedAt && (
              <p className="text-xs text-muted-foreground mt-1">Last refreshed at {refreshedAt}</p>
            )}
          </div>
          <Button variant="outline" onClick={handleRefresh}>
            Refresh Queue
          </Button>
        </div>

        <Tabs defaultValue="New" className="flex-1 flex flex-col">
          <TabsList className="mb-4">
            {STATUSES.map((status) => (
              <TabsTrigger key={status} value={status}>
                {status}{" "}
                <Badge variant="secondary" className="ml-2">
                  {notesByStatus[status]?.length || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {STATUSES.map((status) => (
            <TabsContent key={status} value={status} className="flex-1">
              <div className="space-y-4">
                {notesByStatus[status]?.map((note) => (
                  <Card
                    key={note.id}
                    className="p-4 flex flex-col md:flex-row gap-4 justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{getClientName(note.clientId)}</h3>
                        <Badge variant="outline">{note.callType}</Badge>
                        <Badge>{note.routingStatus}</Badge>
                        {note.escalationFlags && note.escalationFlags !== "None" && (
                          <Badge variant="destructive">Escalation</Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">
                        <strong>Caller:</strong> {note.caller} | <strong>Date:</strong>{" "}
                        {note.callDate}
                      </div>
                      <p className="text-sm border-l-2 pl-3 py-1 bg-muted/30">
                        {note.cleanSummary || "No summary yet."}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 min-w-[150px]">
                      <Button
                        className="w-full"
                        onClick={() => {
                          window.location.href = `${BASE_URL}processor?noteId=${note.id}`;
                        }}
                      >
                        Process Note
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleArchive(note.id)}
                      >
                        Archive
                      </Button>
                    </div>
                  </Card>
                ))}
                {(!notesByStatus[status] || notesByStatus[status].length === 0) && (
                  <div className="text-center p-8 text-muted-foreground border rounded-md border-dashed">
                    No items in this queue.
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </SidebarLayout>
  );
}
