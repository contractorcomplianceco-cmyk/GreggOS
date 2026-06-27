import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import {
  useListFeedback,
  useCreateFeedback,
  useUpdateFeedback,
  getListFeedbackQueryKey,
} from "@workspace/api-client-react";
import type {
  Feedback,
  FeedbackType,
  FeedbackStatus,
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
import { Plus, AlertTriangle, Lightbulb, Settings2 } from "lucide-react";
import { LoadingState } from "@/components/layout/FishingSpinner";

const TYPES: { value: FeedbackType; label: string }[] = [
  { value: "risk", label: "Risk / client issue" },
  { value: "opportunity", label: "Opportunity" },
  { value: "system", label: "System improvement" },
];

const STATUSES: FeedbackStatus[] = ["open", "reviewed", "actioned", "archived"];

function typeMeta(type: string): {
  label: string;
  icon: React.ReactNode;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  if (type === "risk")
    return {
      label: "Risk",
      icon: <AlertTriangle className="h-3 w-3" />,
      variant: "destructive",
    };
  if (type === "opportunity")
    return {
      label: "Opportunity",
      icon: <Lightbulb className="h-3 w-3" />,
      variant: "default",
    };
  return {
    label: "System",
    icon: <Settings2 className="h-3 w-3" />,
    variant: "secondary",
  };
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "actioned") return "default";
  if (status === "archived") return "outline";
  if (status === "reviewed") return "secondary";
  return "destructive";
}

interface FormState {
  type: FeedbackType;
  title: string;
  body: string;
  clientId: string;
}

const EMPTY_FORM: FormState = {
  type: "system",
  title: "",
  body: "",
  clientId: "none",
};

export default function FeedbackCenter() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { clients } = useStore();

  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const params = {
    ...(typeFilter !== "All" ? { type: typeFilter } : {}),
    ...(statusFilter !== "All" ? { status: statusFilter } : {}),
  };
  const { data, isLoading } = useListFeedback(params, {
    query: { queryKey: getListFeedbackQueryKey(params) },
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListFeedbackQueryKey() });
  const mOpts = { mutation: { onSuccess: invalidate } };
  const createM = useCreateFeedback(mOpts);
  const updateM = useUpdateFeedback(mOpts);

  const items = (data ?? []) as unknown as Feedback[];

  const clientName = (id: string | null): string => {
    if (!id) return "";
    const c = (clients as CurrentClient[]).find((x) => x.id === id);
    return c ? c.companyName || c.clientName : "Unknown";
  };

  const counts = useMemo(() => {
    const open = items.filter((i) => i.status === "open").length;
    const risk = items.filter((i) => i.type === "risk").length;
    return { total: items.length, open, risk };
  }, [items]);

  async function submit() {
    if (!form.body.trim()) {
      toast({ title: "Feedback detail is required", variant: "destructive" });
      return;
    }
    try {
      await createM.mutateAsync({
        data: {
          type: form.type,
          title: form.title,
          body: form.body,
          clientId: form.clientId === "none" ? null : form.clientId,
        },
      });
      toast({ title: "Feedback submitted" });
      setForm(EMPTY_FORM);
      setDialogOpen(false);
    } catch {
      toast({ title: "Could not submit feedback", variant: "destructive" });
    }
  }

  async function setStatus(item: Feedback, status: FeedbackStatus) {
    try {
      await updateM.mutateAsync({
        feedbackId: item.id,
        data: { status },
      });
    } catch {
      toast({ title: "Could not update status", variant: "destructive" });
    }
  }

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader
          tag="Sonar"
          title="Feedback Center"
          subtitle="Capture client issues, risk-pattern observations, opportunities, and system-improvement ideas. This is an internal log for review — it does not commit the team to any action."
          action={
            <Button onClick={() => setDialogOpen(true)} data-testid="button-add-feedback">
              <Plus className="h-4 w-4 mr-1" /> Submit feedback
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard label="Total Items" value={counts.total} accent="primary" />
          <StatCard label="Open" value={counts.open} accent="accent" />
          <StatCard label="Risk Items" value={counts.risk} accent={counts.risk > 0 ? "destructive" : "border"} />
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
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
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground ml-2">
            Status
          </Label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40" data-testid="select-status-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState message="Listening on the sonar…" />
        ) : items.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No feedback items yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const meta = typeMeta(item.type);
              return (
                <Card
                  key={item.id}
                  className="shadow-sm"
                  data-testid={`card-feedback-${item.id}`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={meta.variant}
                          className="flex items-center gap-1"
                        >
                          {meta.icon}
                          {meta.label}
                        </Badge>
                        {item.title ? (
                          <span className="font-medium text-foreground">
                            {item.title}
                          </span>
                        ) : null}
                      </div>
                      <Badge variant={statusVariant(item.status)}>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm text-foreground whitespace-pre-wrap">
                      {item.body}
                    </p>
                    <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                      <p className="text-xs text-muted-foreground">
                        {item.submittedByLabel || "Internal"}
                        {clientName(item.clientId)
                          ? ` · ${clientName(item.clientId)}`
                          : ""}
                      </p>
                      <Select
                        value={item.status}
                        onValueChange={(v) =>
                          setStatus(item, v as FeedbackStatus)
                        }
                      >
                        <SelectTrigger
                          className="w-36 h-8"
                          data-testid={`select-feedback-status-${item.id}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) =>
                    setForm({ ...form, type: v as FeedbackType })
                  }
                >
                  <SelectTrigger data-testid="select-feedback-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Client (optional)</Label>
                <Select
                  value={form.clientId}
                  onValueChange={(v) => setForm({ ...form, clientId: v })}
                >
                  <SelectTrigger>
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
            <div className="space-y-1.5">
              <Label>Title (optional)</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Short summary"
                data-testid="input-feedback-title"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Detail</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={4}
                placeholder="What did you notice?"
                data-testid="input-feedback-body"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} data-testid="button-submit-feedback">
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
