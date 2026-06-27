import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import {
  useListRoseChatSessions,
  useGetRoseChatSession,
  useCreateRoseChatSession,
  useSendRoseChatMessage,
  useDeleteRoseChatSession,
  getListRoseChatSessionsQueryKey,
  getGetRoseChatSessionQueryKey,
} from "@workspace/api-client-react";
import type {
  RoseChatSession,
  RoseChatSessionDetail,
  RoseChatMode,
  CurrentClient,
} from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Sparkles, Plus, Trash2, Send, Bot, User } from "lucide-react";
import { LoadingState, FishingSpinner } from "@/components/layout/FishingSpinner";

const MODES: { value: RoseChatMode; label: string; hint: string }[] = [
  {
    value: "brainstorm",
    label: "Brainstorm",
    hint: "Generate ideas and angles",
  },
  {
    value: "help_with_client",
    label: "Help with a client",
    hint: "Work through a specific account",
  },
  { value: "how_to", label: "How-to", hint: "Walk through a process" },
  { value: "general", label: "General", hint: "Open-ended questions" },
];

function modeLabel(mode: string): string {
  return MODES.find((m) => m.value === mode)?.label ?? mode;
}

export default function RoseOS() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { clients } = useStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [mode, setMode] = useState<RoseChatMode>("brainstorm");
  const [clientId, setClientId] = useState<string>("none");
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: sessionsData } = useListRoseChatSessions(undefined, {
    query: { queryKey: getListRoseChatSessionsQueryKey() },
  });
  const sessions = (sessionsData ?? []) as unknown as RoseChatSession[];

  const { data: detailData, isLoading: detailLoading } = useGetRoseChatSession(
    activeId ?? "",
    {
      query: {
        queryKey: getGetRoseChatSessionQueryKey(activeId ?? ""),
        enabled: !!activeId,
      },
    },
  );
  const detail = detailData as unknown as RoseChatSessionDetail | undefined;

  const invalidateList = () =>
    qc.invalidateQueries({ queryKey: getListRoseChatSessionsQueryKey() });
  const invalidateActive = () => {
    if (activeId)
      qc.invalidateQueries({
        queryKey: getGetRoseChatSessionQueryKey(activeId),
      });
  };

  const createM = useCreateRoseChatSession({
    mutation: { onSuccess: invalidateList },
  });
  const sendM = useSendRoseChatMessage({
    mutation: {
      onSuccess: () => {
        invalidateActive();
        invalidateList();
      },
    },
  });
  const deleteM = useDeleteRoseChatSession({
    mutation: { onSuccess: invalidateList },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [detail?.messages?.length, detailLoading]);

  const clientName = (id: string | null): string => {
    if (!id) return "";
    const c = (clients as CurrentClient[]).find((x) => x.id === id);
    return c ? c.companyName || c.clientName : "";
  };

  async function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    try {
      if (!activeId) {
        const created = (await createM.mutateAsync({
          data: {
            mode,
            clientId: clientId === "none" ? null : clientId,
            message: text,
          } as never,
        })) as unknown as RoseChatSessionDetail;
        setActiveId(created.id);
      } else {
        await sendM.mutateAsync({
          sessionId: activeId,
          data: { content: text } as never,
        });
      }
    } catch {
      setInput(text);
      toast({ title: "Could not send message", variant: "destructive" });
    }
  }

  function startNew() {
    setActiveId(null);
    setInput("");
  }

  async function removeSession(id: string) {
    try {
      await deleteM.mutateAsync({ sessionId: id });
      if (activeId === id) startNew();
      toast({ title: "Session deleted" });
    } catch {
      toast({ title: "Could not delete session", variant: "destructive" });
    }
  }

  const busy = createM.isPending || sendM.isPending;

  return (
    <SidebarLayout>
      <div className="flex h-full">
        <aside className="w-64 border-r border-border hidden lg:flex lg:flex-col shrink-0 bg-slate-50/50">
          <div className="p-4 border-b border-border">
            <Button
              onClick={startNew}
              className="w-full"
              data-testid="button-new-session"
            >
              <Plus className="h-4 w-4 mr-1" /> New chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sessions.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">
                No saved chats yet.
              </p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className={`group flex items-center justify-between gap-1 rounded-md px-2 py-2 text-sm cursor-pointer ${
                    activeId === s.id ? "bg-white shadow-sm" : "hover:bg-white/70"
                  }`}
                  onClick={() => setActiveId(s.id)}
                  data-testid={`session-item-${s.id}`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-foreground">{s.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {modeLabel(s.mode)}
                      {s.clientId ? ` · ${clientName(s.clientId)}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSession(s.id);
                    }}
                    className="text-muted-foreground hover:text-rose-600 opacity-0 group-hover:opacity-100 shrink-0"
                    data-testid={`button-delete-session-${s.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-8 pt-8">
            <PageHeader
              tag="First Mate"
              title="RoseOS"
              subtitle="Your executive thinking partner for brainstorming, working through a client, and how-to guidance grounded in your account context. RoseOS drafts and organizes ideas — it does not approve pricing, refunds, legal, compliance, or qualifier-placement decisions."
            />
          </div>

          <div className="flex-1 flex flex-col px-8 pb-8 min-h-0">
            {!activeId ? (
              <Card className="shadow-sm mb-4">
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Mode</Label>
                      <Select
                        value={mode}
                        onValueChange={(v) => setMode(v as RoseChatMode)}
                      >
                        <SelectTrigger data-testid="select-rose-mode">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MODES.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label} — {m.hint}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Client context (optional)</Label>
                      <Select value={clientId} onValueChange={setClientId}>
                        <SelectTrigger data-testid="select-rose-client">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {(clients as CurrentClient[]).map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.companyName || c.clientName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">{modeLabel(detail?.mode ?? "")}</Badge>
                {detail?.clientId ? (
                  <Badge variant="secondary">
                    {clientName(detail.clientId)}
                  </Badge>
                ) : null}
                <span className="text-sm font-medium text-foreground truncate">
                  {detail?.title}
                </span>
              </div>
            )}

            <Card className="shadow-sm flex-1 min-h-0 flex flex-col">
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4"
                data-testid="rose-messages"
              >
                {!activeId ? (
                  <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center text-sm text-muted-foreground">
                    <Sparkles className="h-8 w-8 mb-3 text-slate-300" />
                    Pick a mode and start typing to begin a new chat.
                  </div>
                ) : detailLoading ? (
                  <LoadingState message="Waking the first mate…" />
                ) : (
                  (detail?.messages ?? []).map((m) => (
                    <div
                      key={m.id}
                      className={`flex gap-3 ${
                        m.role === "user" ? "flex-row-reverse" : ""
                      }`}
                      data-testid={`message-${m.role}`}
                    >
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent text-accent-foreground"
                        }`}
                      >
                        {m.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap ${
                          m.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-slate-100 text-foreground"
                        }`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
                {busy ? (
                  <div className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm bg-slate-100 text-muted-foreground">
                      <FishingSpinner size="sm" label="Thinking" />
                      Casting a line for an answer…
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-border p-4">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    placeholder="Ask RoseOS anything…"
                    rows={2}
                    className="resize-none"
                    data-testid="input-rose-message"
                  />
                  <Button
                    onClick={send}
                    disabled={busy || !input.trim()}
                    data-testid="button-send-rose"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
