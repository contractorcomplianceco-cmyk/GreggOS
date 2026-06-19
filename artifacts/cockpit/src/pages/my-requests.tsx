import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import {
  useListRequests,
  useCreateRequest,
  useDeleteRequest,
  useGetCurrentUser,
  getListRequestsQueryKey,
} from "@workspace/api-client-react";
import type {
  RequestItem,
  RequestType,
  RequestStatus,
  CurrentClient,
} from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Inbox, Trash2, Plus } from "lucide-react";
import { TYPE_LABEL, STATUS_LABEL, statusVariant } from "./requests";

const TYPES: RequestType[] = [
  "purchase",
  "travel",
  "help",
  "equipment",
  "other",
];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

interface FormState {
  type: RequestType;
  title: string;
  description: string;
  priority: string;
  amount: string;
  clientId: string;
  neededBy: string;
}

const EMPTY_FORM: FormState = {
  type: "purchase",
  title: "",
  description: "",
  priority: "Medium",
  amount: "",
  clientId: "none",
  neededBy: "",
};

export default function MyRequests() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { clients } = useStore();
  const { data: me } = useGetCurrentUser();
  const myLabel = me?.displayName || me?.email || "";

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const params = myLabel ? { requestedBy: myLabel } : {};
  const { data, isLoading } = useListRequests(params, {
    query: { queryKey: getListRequestsQueryKey(params), enabled: !!myLabel },
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListRequestsQueryKey() });
  const mOpts = { mutation: { onSuccess: invalidate } };
  const createM = useCreateRequest(mOpts);
  const deleteM = useDeleteRequest(mOpts);

  const requests = (data ?? []) as unknown as RequestItem[];

  const clientName = (id: string | null): string => {
    if (!id) return "—";
    const c = (clients as CurrentClient[]).find((x) => x.id === id);
    return c ? c.companyName || c.clientName : "Unknown client";
  };

  const counts = useMemo(() => {
    const open = requests.filter(
      (r) =>
        r.status !== "fulfilled" &&
        r.status !== "denied" &&
        r.status !== "cancelled",
    ).length;
    const resolved = requests.filter(
      (r) => r.status === "fulfilled" || r.status === "approved",
    ).length;
    return { total: requests.length, open, resolved };
  }, [requests]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  async function save() {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const amountNum = form.amount.trim() === "" ? null : Number(form.amount);
    if (amountNum != null && (Number.isNaN(amountNum) || amountNum < 0)) {
      toast({
        title: "Amount must be a positive number",
        variant: "destructive",
      });
      return;
    }
    const payload = {
      type: form.type,
      title: form.title.trim(),
      description: form.description,
      priority: form.priority,
      amount: amountNum,
      clientId: form.clientId === "none" ? null : form.clientId,
      neededBy: form.neededBy,
    };
    try {
      await createM.mutateAsync({ data: payload as never });
      toast({ title: "Request submitted" });
      setDialogOpen(false);
    } catch {
      toast({ title: "Could not submit request", variant: "destructive" });
    }
  }

  async function remove(req: RequestItem) {
    try {
      await deleteM.mutateAsync({ requestId: req.id });
      toast({ title: "Request deleted" });
    } catch {
      toast({ title: "Could not delete request", variant: "destructive" });
    }
  }

  return (
    <SidebarLayout>
      <div className="p-8 max-w-5xl mx-auto">
        <PageHeader
          tag="My Executive Office"
          title="My Requests"
          subtitle="Your own submitted requests and their current status. Submitting a request routes it for review — it does not approve spend or commitments."
          action={
            <Button onClick={openCreate} data-testid="button-add-my-request">
              <Plus className="h-4 w-4 mr-1" /> New request
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard label="My Requests" value={counts.total} accent="primary" />
          <StatCard label="Open" value={counts.open} accent="accent" />
          <StatCard label="Approved / Fulfilled" value={counts.resolved} accent="border" />
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your requests…</p>
        ) : requests.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              You have not submitted any requests yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card
                key={req.id}
                className="shadow-sm"
                data-testid={`card-my-request-${req.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Inbox className="h-4 w-4 text-accent shrink-0" />
                      <span className="font-semibold text-foreground truncate">
                        {req.title}
                      </span>
                    </div>
                    <Badge variant={statusVariant(req.status)}>
                      {STATUS_LABEL[req.status]}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{TYPE_LABEL[req.type]}</span>
                    <span>· {req.priority}</span>
                    {req.amount != null ? (
                      <span className="tabular-nums">
                        · ${req.amount.toLocaleString()}
                      </span>
                    ) : null}
                    {req.clientId ? (
                      <span>· {clientName(req.clientId)}</span>
                    ) : null}
                    {req.neededBy ? (
                      <span className="tabular-nums">· needed {req.neededBy}</span>
                    ) : null}
                  </div>

                  {req.description ? (
                    <p className="mt-3 text-sm text-foreground">
                      {req.description}
                    </p>
                  ) : null}

                  {req.resolutionNotes ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        Resolution:{" "}
                      </span>
                      {req.resolutionNotes}
                    </p>
                  ) : null}

                  {req.status === "submitted" ? (
                    <div className="mt-4 flex items-center justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => remove(req)}
                        data-testid={`button-delete-my-request-${req.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What do you need?"
                data-testid="input-my-request-title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm({ ...form, type: v as RequestType })
                  }
                >
                  <SelectTrigger data-testid="select-my-request-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TYPE_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Amount (USD, optional)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  data-testid="input-my-request-amount"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Needed by</Label>
                <Input
                  type="date"
                  value={form.neededBy}
                  onChange={(e) =>
                    setForm({ ...form, neededBy: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Related client (optional)</Label>
              <Select
                value={form.clientId}
                onValueChange={(v) => setForm({ ...form, clientId: v })}
              >
                <SelectTrigger data-testid="select-my-request-client">
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
            <div className="space-y-1.5">
              <Label>Details</Label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Context, justification, links"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} data-testid="button-save-my-request">
              Submit request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
