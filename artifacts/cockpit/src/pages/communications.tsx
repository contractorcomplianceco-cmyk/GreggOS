import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import {
  useListCommunicationDrafts,
  getListCommunicationDraftsQueryKey,
  useGenerateCommunicationDraft,
  useUpdateCommunicationDraft,
  useDeleteCommunicationDraft,
} from "@workspace/api-client-react";
import type {
  CommunicationDraft,
  CommunicationDraftStatus,
  CurrentClient,
} from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Save,
  Trash2,
  Copy,
  FileText,
  CheckCheck,
  Ban,
  RotateCcw,
} from "lucide-react";

const INTENTS: { value: string; label: string }[] = [
  { value: "follow_up", label: "Follow-up" },
  { value: "check_in", label: "Relationship check-in" },
  { value: "escalation_ack", label: "Escalation acknowledgment" },
  { value: "expansion_outreach", label: "Expansion outreach" },
  { value: "renewal", label: "Renewal outreach" },
  { value: "other", label: "Other" },
];

const CHANNELS: { value: string; label: string }[] = [
  { value: "email", label: "Email" },
  { value: "text", label: "Text / SMS" },
  { value: "call_script", label: "Call script" },
];

const TONES = ["Warm", "Professional", "Direct", "Reassuring", "Concise"];

const STATUS_LABELS: Record<CommunicationDraftStatus, string> = {
  draft: "Draft",
  edited: "Edited",
  used: "Used",
  discarded: "Discarded",
};

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "used") return "default";
  if (status === "discarded") return "destructive";
  if (status === "edited") return "outline";
  return "secondary";
}

function statusLabel(status: string): string {
  return STATUS_LABELS[status as CommunicationDraftStatus] ?? status;
}

function intentLabel(value: string): string {
  return INTENTS.find((i) => i.value === value)?.label ?? value;
}

function channelLabel(value: string): string {
  return CHANNELS.find((c) => c.value === value)?.label ?? value;
}

function clientIdFromUrl(): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("clientId") ?? "";
}

export default function Communications() {
  const { clients } = useStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const invalidate = () => {
    void qc.invalidateQueries();
  };

  const [clientId, setClientId] = useState<string>(() => clientIdFromUrl());
  const [intent, setIntent] = useState<string>("follow_up");
  const [channel, setChannel] = useState<string>("email");
  const [tone, setTone] = useState<string>("Warm");
  const [instructions, setInstructions] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState<string>("");
  const [editBody, setEditBody] = useState<string>("");

  const draftsQ = useListCommunicationDrafts(
    clientId ? { clientId } : undefined,
    {
      query: {
        enabled: Boolean(clientId),
        queryKey: getListCommunicationDraftsQueryKey(
          clientId ? { clientId } : undefined,
        ),
      },
    },
  );
  const drafts = (draftsQ.data ?? []) as unknown as CommunicationDraft[];

  const generateM = useGenerateCommunicationDraft({
    mutation: { onSuccess: invalidate },
  });
  const updateM = useUpdateCommunicationDraft({
    mutation: { onSuccess: invalidate },
  });
  const deleteM = useDeleteCommunicationDraft({
    mutation: { onSuccess: invalidate },
  });

  const sortedClients = useMemo(
    () =>
      [...clients].sort((a, b) =>
        a.clientName.localeCompare(b.clientName),
      ) as CurrentClient[],
    [clients],
  );

  const selected = drafts.find((d) => d.id === selectedId) ?? null;

  function selectDraft(d: CommunicationDraft) {
    setSelectedId(d.id);
    setEditSubject(d.subject);
    setEditBody(d.body);
  }

  async function handleGenerate() {
    if (!clientId) {
      toast({ title: "Select a client first", variant: "destructive" });
      return;
    }
    try {
      const created = (await generateM.mutateAsync({
        data: { clientId, intent, channel, tone, instructions },
      })) as unknown as CommunicationDraft;
      selectDraft(created);
      toast({
        title:
          created.source === "ai"
            ? "Draft generated (AI)"
            : "Draft generated (template fallback)",
      });
    } catch {
      toast({ title: "Could not generate draft", variant: "destructive" });
    }
  }

  async function handleSave() {
    if (!selected) return;
    try {
      await updateM.mutateAsync({
        draftId: selected.id,
        data: { subject: editSubject, body: editBody },
      });
      toast({ title: "Draft saved" });
    } catch {
      toast({ title: "Could not save draft", variant: "destructive" });
    }
  }

  async function handleSetStatus(status: CommunicationDraftStatus) {
    if (!selected) return;
    try {
      await updateM.mutateAsync({ draftId: selected.id, data: { status } });
      toast({ title: `Marked ${STATUS_LABELS[status].toLowerCase()}` });
    } catch {
      toast({ title: "Could not update status", variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteM.mutateAsync({ draftId: id });
      if (selectedId === id) setSelectedId(null);
      toast({ title: "Draft deleted" });
    } catch {
      toast({ title: "Could not delete draft", variant: "destructive" });
    }
  }

  async function handleCopy() {
    if (!selected) return;
    const text =
      selected.channel === "text"
        ? editBody
        : `Subject: ${editSubject}\n\n${editBody}`;
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard" });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  }

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <header className="border-b border-border pb-6 mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            Gregg&apos;s Toolkit
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mt-2">
            Communication Draft Builder
          </h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
            Generate client-facing message drafts from live account context
            (recent calls, open tasks, escalations, cadence, expansion). Drafts
            are for Gregg to review, edit, and send himself — nothing is sent
            from here.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-8">
          {/* Generator form */}
          <div className="space-y-5">
            <Card className="shadow-sm">
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Client
                  </Label>
                  <Select value={clientId} onValueChange={(v) => {
                    setClientId(v);
                    setSelectedId(null);
                  }}>
                    <SelectTrigger data-testid="select-client">
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      {sortedClients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.clientName}
                          {c.companyName ? ` — ${c.companyName}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Intent
                    </Label>
                    <Select value={intent} onValueChange={setIntent}>
                      <SelectTrigger data-testid="select-intent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INTENTS.map((i) => (
                          <SelectItem key={i.value} value={i.value}>
                            {i.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Channel
                    </Label>
                    <Select value={channel} onValueChange={setChannel}>
                      <SelectTrigger data-testid="select-channel">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CHANNELS.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Tone
                  </Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger data-testid="select-tone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Extra instructions (optional)
                  </Label>
                  <Textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. mention the renewal call next week; keep it under 5 sentences"
                    rows={3}
                    data-testid="input-instructions"
                  />
                </div>

                <Button
                  className="w-full"
                  onClick={handleGenerate}
                  disabled={generateM.isPending || !clientId}
                  data-testid="button-generate"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {generateM.isPending ? "Generating…" : "Generate draft"}
                </Button>
              </CardContent>
            </Card>

            <div className="rounded-md border border-border/70 bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground">
              <strong className="text-foreground/80">Boundary:</strong> Drafts
              never approve pricing, refunds, legal advice, compliance opinions,
              or qualifier placements. Review every draft before sending.
            </div>

            {/* Draft history */}
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70 mb-2">
                Drafts {clientId ? "for this client" : ""}
              </h2>
              {!clientId ? (
                <p className="text-sm text-muted-foreground">
                  Select a client to view saved drafts.
                </p>
              ) : drafts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No drafts yet for this client.
                </p>
              ) : (
                <div className="space-y-2">
                  {drafts.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => selectDraft(d)}
                      className={`w-full text-left rounded-md border p-3 transition-colors ${
                        selectedId === d.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/40"
                      }`}
                      data-testid={`draft-item-${d.id}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">
                          {d.subject || intentLabel(d.intent)}
                        </span>
                        <Badge
                          variant={d.source === "ai" ? "default" : "secondary"}
                          className="shrink-0 text-[10px]"
                        >
                          {d.source === "ai" ? "AI" : "Template"}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <Badge
                          variant={statusVariant(d.status)}
                          className="shrink-0 text-[10px]"
                        >
                          {statusLabel(d.status)}
                        </Badge>
                        <span>{intentLabel(d.intent)}</span>
                        <span>·</span>
                        <span>{channelLabel(d.channel)}</span>
                        <span>·</span>
                        <span>{new Date(d.createdAt).toLocaleDateString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Editor */}
          <div>
            {!selected ? (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                <FileText className="w-10 h-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground max-w-xs">
                  Generate a new draft or select one from the list to review and
                  edit it here.
                </p>
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          selected.source === "ai" ? "default" : "secondary"
                        }
                      >
                        {selected.source === "ai"
                          ? "AI draft"
                          : "Template draft"}
                      </Badge>
                      <Badge
                        variant={statusVariant(selected.status)}
                        data-testid="badge-status"
                      >
                        {statusLabel(selected.status)}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        {intentLabel(selected.intent)} ·{" "}
                        {channelLabel(selected.channel)}
                        {selected.createdByLabel
                          ? ` · ${selected.createdByLabel}`
                          : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        data-testid="button-copy"
                      >
                        <Copy className="w-4 h-4 mr-1.5" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(selected.id)}
                        disabled={deleteM.isPending}
                        data-testid="button-delete"
                      >
                        <Trash2 className="w-4 h-4 mr-1.5" />
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={updateM.isPending}
                        data-testid="button-save"
                      >
                        <Save className="w-4 h-4 mr-1.5" />
                        Save
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-border/60 pt-3">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground mr-1">
                      Lifecycle
                    </span>
                    {selected.status !== "used" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetStatus("used")}
                        disabled={updateM.isPending}
                        data-testid="button-mark-used"
                      >
                        <CheckCheck className="w-4 h-4 mr-1.5" />
                        Mark used
                      </Button>
                    )}
                    {selected.status !== "discarded" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetStatus("discarded")}
                        disabled={updateM.isPending}
                        data-testid="button-discard"
                      >
                        <Ban className="w-4 h-4 mr-1.5" />
                        Discard
                      </Button>
                    )}
                    {selected.status !== "draft" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetStatus("draft")}
                        disabled={updateM.isPending}
                        data-testid="button-reopen"
                      >
                        <RotateCcw className="w-4 h-4 mr-1.5" />
                        Reopen
                      </Button>
                    )}
                  </div>

                  {selected.channel !== "text" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Subject
                      </Label>
                      <Input
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        data-testid="input-subject"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      {selected.channel === "call_script"
                        ? "Call script"
                        : "Message body"}
                    </Label>
                    <Textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={18}
                      className="font-sans leading-relaxed"
                      data-testid="input-body"
                    />
                  </div>

                  {selected.instructions && (
                    <p className="text-[11px] text-muted-foreground">
                      <strong>Instructions used:</strong>{" "}
                      {selected.instructions}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
