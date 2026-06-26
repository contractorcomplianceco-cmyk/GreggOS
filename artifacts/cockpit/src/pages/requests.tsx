import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import {
  useListRequests,
  useCreateRequest,
  useUpdateRequest,
  useDeleteRequest,
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

const TYPES: RequestType[] = [
  "purchase",
  "travel",
  "help",
  "equipment",
  "other",
];
const STATUSES: RequestStatus[] = [
  "submitted",
  "in_review",
  "approved",
  "denied",
  "fulfilled",
  "cancelled",
];
const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

export const TYPE_LABEL: Record<RequestType, string> = {
  purchase: "Purchase",
  travel: "Travel",
  help: "Help / Support",
  equipment: "Equipment",
  other: "Other",
};

export const STATUS_LABEL: Record<RequestStatus, string> = {
  submitted: "Submitted",
  in_review: "In review",
  approved: "Approved",
  denied: "Denied",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

export function statusVariant(
  status: RequestStatus,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "approved" || status === "fulfilled") return "default";
  if (status === "denied" || status === "cancelled") return "destructive";
  if (status === "in_review") return "outline";
  return "secondary";
}

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

export default function RequestsHub() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { clients } = useStore();

  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RequestItem | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const params: Record<string, string> = {};
  if (statusFilter !== "All") params["status"] = statusFilter;
  if (typeFilter !== "All") params["type"] = typeFilter;
  const { data, isLoading } = useListRequests(params, {
    query: { queryKey: getListRequestsQueryKey(params) },
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListRequestsQueryKey() });
  const mOpts = { mutation: { onSuccess: invalidate } };
  const createM = useCreateRequest(mOpts);
  const updateM = useUpdateRequest(mOpts);
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
    const review = requests.filter((r) => r.status === "in_review").length;
    return { total: requests.length, open, review };
  }, [requests]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(req: RequestItem) {
    setEditing(req);
    setForm({
      type: req.type,
      title: req.title,
      description: req.description,
      priority: req.priority || "Medium",
      amount: req.amount != null ? String(req.amount) : "",
      clientId: req.clientId ?? "none",
      neededBy: req.neededBy,
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const amountNum = form.amount.trim() === "" ? null : Number(form.amount);
    if (amountNum != null && (Number.isNaN(amountNum) || amountNum < 0)) {
      toast({ title: "Amount must be a positive number", variant: "destructive" });
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
      if (editing) {
        await updateM.mutateAsync({
          requestId: editing.id,
          data: payload as never,
        });
        toast({ title: "Request updated" });
      } else {
        await createM.mutateAsync({ data: payload as never });
        toast({ title: "Request submitted" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Could not save request", variant: "destructive" });
    }
  }

  async function updateStatus(req: RequestItem, status: RequestStatus) {
    try {
      await updateM.mutateAsync({
        requestId: req.id,
        data: { status } as never,
      });
      toast({ title: `Marked ${STATUS_LABEL[status]}` });
    } catch {
      toast({ title: "Could not update status", variant: "destructive" });
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
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader
          tag="On Deck"
          title="Requests Hub"
          subtitle="Every operational request across the team — purchases, travel, equipment, and help. This board routes and tracks requests for review; it does not approve spend or commitments."
          action={
            <Button onClick={openCreate} data-testid="button-add-request">
              <Plus className="h-4 w-4 mr-1" /> New request
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard label="Total" value={counts.total} accent="primary" />
          <StatCard label="Open" value={counts.open} accent="accent" />
          <StatCard label="In Review" value={counts.review} accent="border" />
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Status
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Type
          </Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-44" data-testid="select-type-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {TYPE_LABEL[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading requests…</p>
        ) : requests.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No requests yet. Submit one to start tracking.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <Card
                key={req.id}
                className="shadow-sm hover:shadow-md transition-shadow"
                data-testid={`card-request-${req.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Inbox className="h-4 w-4 text-accent shrink-0" />
                      <button
                        type="button"
                        className="text-left font-semibold text-foreground hover:underline truncate"
                        onClick={() => openEdit(req)}
                        data-testid={`button-edit-request-${req.id}`}
                      >
                        {req.title}
                      </button>
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
                    {req.clientId ? <span>· {clientName(req.clientId)}</span> : null}
                    {req.neededBy ? (
                      <span className="tabular-nums">· needed {req.neededBy}</span>
                    ) : null}
                    <span>· by {req.requestedByLabel}</span>
                  </div>

                  {req.description ? (
                    <p className="mt-3 text-sm text-foreground">
                      {req.description}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <Select
                      value={req.status}
                      onValueChange={(v) =>
                        updateStatus(req, v as RequestStatus)
                      }
                    >
                      <SelectTrigger
                        className="w-40 h-8 text-xs"
                        data-testid={`select-request-status-${req.id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(req)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(req)}
                      data-testid={`button-delete-request-${req.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit request" : "New request"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What do you need?"
                data-testid="input-request-title"
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
                  <SelectTrigger data-testid="select-request-type">
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
                  data-testid="input-request-amount"
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
                <SelectTrigger data-testid="select-request-client">
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
            <Button onClick={save} data-testid="button-save-request">
              {editing ? "Save changes" : "Submit request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
