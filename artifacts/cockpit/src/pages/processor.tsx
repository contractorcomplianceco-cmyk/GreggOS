import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CallNoteStatus,
  CallType,
  Priority,
  RiskLevel,
  SignalType,
  EscalationReason,
} from "@/lib/types";

const CALL_TYPES: CallType[] = [
  "Inbound",
  "Outbound",
  "Scheduled Check-in",
  "Escalation",
  "Qualifier Discussion",
  "Placement Discussion",
  "Renewal",
  "Monitoring",
  "Other",
];

const SIGNAL_TYPES: SignalType[] = [
  "Audit",
  "Monitoring",
  "Renewal",
  "Expansion",
  "Qualifier",
  "Placement",
  "Document collection",
  "Client-save",
  "Leadership review",
];

const ESCALATION_REASONS: EscalationReason[] = [
  "Refund/payment issue",
  "Pricing exception",
  "Legal-sensitive issue",
  "Compliance-sensitive issue",
  "Placement approval needed",
  "Qualifier concern",
  "High-risk complaint",
  "Possible promise/commitment risk",
  "Rose review needed",
  "Other leadership review",
];

export default function Processor() {
  const { clients, callNotes, saveProcessedNote } = useStore();
  const { toast } = useToast();

  const queryParams = new URLSearchParams(window.location.search);
  const noteId = queryParams.get("noteId");
  const existingNote = noteId ? callNotes.find((n) => n.id === noteId) : null;

  const [clientId, setClientId] = useState(existingNote?.clientId || "");
  const [callDate, setCallDate] = useState(
    existingNote?.callDate || new Date().toISOString().split("T")[0]
  );
  const [caller, setCaller] = useState(existingNote?.caller || "");
  const [callType, setCallType] = useState<CallType>(existingNote?.callType || "Inbound");
  const [rawNote, setRawNote] = useState(existingNote?.rawRingCentralNote || "");

  const [cleanSummary, setCleanSummary] = useState(existingNote?.cleanSummary || "");
  const [clientConcern, setClientConcern] = useState(existingNote?.clientConcern || "");
  const [commitmentsMade, setCommitmentsMade] = useState(existingNote?.commitmentsMade || "");
  const [missingInformation, setMissingInformation] = useState(
    existingNote?.missingInformation || ""
  );
  const [nextActions, setNextActions] = useState(existingNote?.nextActions || "");
  const [opportunitySignals, setOpportunitySignals] = useState(
    existingNote?.opportunitySignals && existingNote.opportunitySignals !== "None"
      ? existingNote.opportunitySignals
      : ""
  );
  const [escalationFlags, setEscalationFlags] = useState(
    existingNote?.escalationFlags && existingNote.escalationFlags !== "None"
      ? existingNote.escalationFlags
      : ""
  );

  const [signalType, setSignalType] = useState<SignalType>("Expansion");
  const [escalationReason, setEscalationReason] =
    useState<EscalationReason>("Other leadership review");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("Medium");
  const [nextOwner, setNextOwner] = useState(existingNote ? "Gregg" : "Gregg");
  const [dueDate, setDueDate] = useState(existingNote?.callDate || callDate);
  const [priority, setPriority] = useState<Priority>("Medium");

  const [routingStatus, setRoutingStatus] = useState<CallNoteStatus>(
    existingNote?.routingStatus || "New"
  );

  const selectedClient = clients.find((c) => c.id === clientId);
  const contactLabel = caller || selectedClient?.contactName || "[contact]";
  const dueText = dueDate || "TBD";
  const oppText = opportunitySignals.trim() || "None";
  const escText = escalationFlags.trim() || "None";

  const actionItems = nextActions
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const firstAction = actionItems[0] || "[next action]";

  const generatedCrmNote =
    `Call with ${contactLabel} on ${callDate}. Discussed ${cleanSummary || "[summary]"}. ` +
    `Client concern/request: ${clientConcern || "None"}. ` +
    `Missing information: ${missingInformation || "None"}. ` +
    `Next steps: ${actionItems.length ? actionItems.join("; ") : "[next actions]"}. ` +
    `Owner: ${nextOwner}. Due date: ${dueText}. ` +
    `Opportunity signals: ${oppText}. Escalation: ${escText}.`;

  const generatedFollowUp =
    `Hi ${contactLabel}, thank you for speaking with Gregg today. ` +
    `Based on the conversation, our next step is ${firstAction}. ` +
    `We are currently waiting on ${missingInformation || "nothing at this time"}. ` +
    `We will follow up by ${dueText}.`;

  const generatedTaskList = actionItems.length
    ? actionItems
        .map(
          (a) =>
            `Task: ${a} | Owner: ${nextOwner} | Due: ${dueText} | Priority: ${priority}`
        )
        .join("\n")
    : "No tasks generated. Add next actions to populate the task list.";

  const generatedJson = JSON.stringify(
    {
      clientId,
      clientName: selectedClient?.clientName || null,
      callDate,
      caller,
      callType,
      cleanSummary,
      clientConcern,
      commitmentsMade,
      missingInformation,
      nextActions: actionItems,
      opportunitySignals: oppText,
      escalationFlags: escText,
      routingStatus,
      owner: nextOwner,
      dueDate: dueText,
      priority,
      crmReadyNote: generatedCrmNote,
      clientFollowUpDraft: generatedFollowUp,
    },
    null,
    2
  );

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard", description: `${label} copied.` });
  };

  const handleSave = () => {
    if (!clientId) {
      toast({ title: "Error", description: "Please select a client.", variant: "destructive" });
      return;
    }

    saveProcessedNote({
      id: existingNote?.id,
      clientId,
      callDate,
      caller,
      callType,
      rawRingCentralNote: rawNote,
      cleanSummary,
      clientConcern,
      commitmentsMade,
      missingInformation,
      nextActions,
      opportunitySignals: oppText,
      escalationFlags: escText,
      routingStatus,
      crmReadyNote: generatedCrmNote,
      clientFollowUpDraft: generatedFollowUp,
      taskList: generatedTaskList,
      nextOwner,
      dueDate,
      priority,
      signalType,
      escalationReason,
      riskLevel,
    });

    toast({
      title: existingNote ? "Updated" : "Saved",
      description: existingNote
        ? "Call note updated. Tasks, signals, escalations, and the client profile were refreshed."
        : "New call note saved. Tasks, signals, escalations, and the client profile were updated.",
    });
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Call Note Processor</h1>
            <Badge
              variant="outline"
              className="px-3 py-1 bg-blue-100/60 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200"
            >
              Draft Mode
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground border-l-2 border-primary/50 pl-3 py-1">
            Drafts only. This tool does not approve pricing, refunds, legal advice, compliance
            opinions, qualifier placements, or final client commitments. Route those to leadership
            review.
          </p>

          <Card className="border-blue-200 dark:border-blue-900 shadow-sm bg-blue-50/30 dark:bg-blue-900/10">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-blue-800 dark:text-blue-300">
                  Raw RingCentral Note
                </Label>
                <span className="text-xs text-muted-foreground uppercase font-mono tracking-wider">
                  Unreviewed Source
                </span>
              </div>
              <Textarea
                value={rawNote}
                onChange={(e) => setRawNote(e.target.value)}
                className="min-h-[150px] font-mono text-sm bg-white dark:bg-background resize-y"
                placeholder="Paste raw AI transcription/notes here..."
              />
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Classification & Context</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.clientName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Call Date</Label>
                  <Input type="date" value={callDate} onChange={(e) => setCallDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Caller / Contact</Label>
                  <Input
                    value={caller}
                    onChange={(e) => setCaller(e.target.value)}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Call Type</Label>
                  <Select value={callType} onValueChange={(val: CallType) => setCallType(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CALL_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Extracted Insights</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Clean Summary</Label>
                  <Textarea
                    value={cleanSummary}
                    onChange={(e) => setCleanSummary(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Client Concern / Request</Label>
                  <Input value={clientConcern} onChange={(e) => setClientConcern(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Commitments Made</Label>
                  <Input
                    value={commitmentsMade}
                    onChange={(e) => setCommitmentsMade(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Missing Information</Label>
                  <Input
                    value={missingInformation}
                    onChange={(e) => setMissingInformation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Next Actions</Label>
                  <Textarea
                    value={nextActions}
                    onChange={(e) => setNextActions(e.target.value)}
                    rows={3}
                    placeholder="One action per line. Each line becomes a task."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold border-b pb-2">Routing Signals</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Opportunity Signals</Label>
                  <Input
                    value={opportunitySignals}
                    onChange={(e) => setOpportunitySignals(e.target.value)}
                    placeholder="Describe any expansion / renewal / placement signal (leave blank for None)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Opportunity Signal Type</Label>
                  <Select value={signalType} onValueChange={(val: SignalType) => setSignalType(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIGNAL_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Escalation Flag</Label>
                  <Input
                    value={escalationFlags}
                    onChange={(e) => setEscalationFlags(e.target.value)}
                    placeholder="Describe a leadership-review trigger (leave blank for None)"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Escalation Reason</Label>
                    <Select
                      value={escalationReason}
                      onValueChange={(val: EscalationReason) => setEscalationReason(val)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ESCALATION_REASONS.map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Risk Level</Label>
                    <Select value={riskLevel} onValueChange={(val: RiskLevel) => setRiskLevel(val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-96 space-y-6">
          <div className="sticky top-8 space-y-6">
            <Card className="border-primary bg-primary/5">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-primary border-b border-primary/20 pb-2">
                  Status & Routing
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Owner</Label>
                    <Select value={nextOwner} onValueChange={setNextOwner}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Gregg">Gregg</SelectItem>
                        <SelectItem value="Landon">Landon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(val: Priority) => setPriority(val)}>
                      <SelectTrigger className="bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    className="bg-background"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Routing Status</Label>
                  <Select
                    value={routingStatus}
                    onValueChange={(val: CallNoteStatus) => setRoutingStatus(val)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="In review">In review</SelectItem>
                      <SelectItem value="Summary drafted">Summary drafted</SelectItem>
                      <SelectItem value="Gregg review">Gregg review</SelectItem>
                      <SelectItem value="CRM-ready">CRM-ready</SelectItem>
                      <SelectItem value="Copied to CRM">Copied to CRM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full mt-4" size="lg" onClick={handleSave}>
                  Save Processed Note
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-sm">CRM-Ready Note</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(generatedCrmNote, "CRM note")}
                  >
                    Copy
                  </Button>
                </div>
                <div className="text-xs bg-muted p-3 rounded-md border text-muted-foreground whitespace-pre-wrap">
                  {generatedCrmNote}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-sm">Client Follow-Up Draft</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(generatedFollowUp, "Follow-up draft")}
                  >
                    Copy
                  </Button>
                </div>
                <div className="text-xs bg-muted p-3 rounded-md border text-muted-foreground whitespace-pre-wrap">
                  {generatedFollowUp}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-sm">Internal Task List</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(generatedTaskList, "Task list")}
                  >
                    Copy
                  </Button>
                </div>
                <div className="text-xs bg-muted p-3 rounded-md border text-muted-foreground whitespace-pre-wrap font-mono">
                  {generatedTaskList}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-sm">JSON Export</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(generatedJson, "JSON export")}
                  >
                    Copy
                  </Button>
                </div>
                <div className="text-xs bg-muted p-3 rounded-md border text-muted-foreground whitespace-pre-wrap font-mono max-h-64 overflow-auto">
                  {generatedJson}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
