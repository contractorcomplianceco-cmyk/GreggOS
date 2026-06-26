import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import {
  useListBonusEntries,
  useCreateBonusEntry,
  useUpdateBonusEntry,
  getListBonusEntriesQueryKey,
} from "@workspace/api-client-react";
import type { BonusEntry, BonusStatus, CurrentClient } from "@/lib/types";
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
import { Plus } from "lucide-react";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "placement_coordination", label: "Placement coordination" },
  { value: "expansion_addon", label: "Expansion / add-on" },
  { value: "monitoring_conversion", label: "Monitoring conversion" },
  { value: "client_save", label: "Client save" },
  { value: "high_value_stability", label: "High-value stability" },
  { value: "clean_placement", label: "Clean placement" },
];

const STATUSES: BonusStatus[] = [
  "eligible",
  "pending_approval",
  "approved",
  "paid",
];

const usd = (n: number): string =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

function categoryLabel(value: string): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "paid") return "default";
  if (status === "approved") return "secondary";
  if (status === "pending_approval") return "outline";
  return "outline";
}

interface FormState {
  category: string;
  title: string;
  amount: string;
  clientId: string;
  periodLabel: string;
  documentation: string;
}

const EMPTY_FORM: FormState = {
  category: "expansion_addon",
  title: "",
  amount: "",
  clientId: "none",
  periodLabel: "",
  documentation: "",
};

export default function BonusTracker() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { clients } = useStore();

  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const params = {
    ...(categoryFilter !== "All" ? { category: categoryFilter } : {}),
    ...(statusFilter !== "All" ? { status: statusFilter } : {}),
  };
  const { data, isLoading } = useListBonusEntries(params, {
    query: { queryKey: getListBonusEntriesQueryKey(params) },
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListBonusEntriesQueryKey() });
  const mOpts = { mutation: { onSuccess: invalidate } };
  const createM = useCreateBonusEntry(mOpts);
  const updateM = useUpdateBonusEntry(mOpts);

  const items = (data ?? []) as unknown as BonusEntry[];

  const clientName = (id: string | null): string => {
    if (!id) return "";
    const c = (clients as CurrentClient[]).find((x) => x.id === id);
    return c ? c.companyName || c.clientName : "Unknown";
  };

  const totals = useMemo(() => {
    const pipeline = items
      .filter((i) => i.status !== "paid")
      .reduce((s, i) => s + i.amount, 0);
    const paid = items
      .filter((i) => i.status === "paid")
      .reduce((s, i) => s + i.amount, 0);
    const pending = items.filter(
      (i) => i.status === "eligible" || i.status === "pending_approval",
    ).length;
    return { pipeline, paid, pending };
  }, [items]);

  async function submit() {
    const amount = Number(form.amount);
    if (!form.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    try {
      await createM.mutateAsync({
        data: {
          category: form.category,
          title: form.title,
          amount,
          clientId: form.clientId === "none" ? null : form.clientId,
          periodLabel: form.periodLabel,
          documentation: form.documentation,
        },
      });
      toast({ title: "Bonus entry recorded" });
      setForm(EMPTY_FORM);
      setDialogOpen(false);
    } catch {
      toast({ title: "Could not record entry", variant: "destructive" });
    }
  }

  async function setStatus(item: BonusEntry, status: BonusStatus) {
    try {
      await updateM.mutateAsync({ bonusEntryId: item.id, data: { status } });
    } catch {
      toast({ title: "Could not update status", variant: "destructive" });
    }
  }

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader
          tag="Captain's Quarters"
          title="Trophy Wall — Bonus Tracker"
          subtitle="Track performance-based bonus events across placement, expansion, monitoring conversions, saves, and stability. This is an internal record for documentation and review — it does not authorize payment. Awards follow company approval and governance."
          action={
            <Button
              onClick={() => setDialogOpen(true)}
              data-testid="button-add-bonus"
            >
              <Plus className="h-4 w-4 mr-1" /> Record bonus event
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            label="In-pipeline (not paid)"
            value={usd(totals.pipeline)}
            accent="primary"
          />
          <StatCard label="Paid to date" value={usd(totals.paid)} accent="accent" />
          <StatCard
            label="Awaiting review"
            value={totals.pending}
            accent={totals.pending > 0 ? "destructive" : "border"}
          />
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">
            Category
          </Label>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-52" data-testid="select-category-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Label className="text-xs uppercase tracking-wide text-muted-foreground ml-2">
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
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading bonus entries…</p>
        ) : items.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No bonus entries yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card
                key={item.id}
                className="shadow-sm"
                data-testid={`card-bonus-${item.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">
                        {categoryLabel(item.category)}
                      </Badge>
                      <span className="font-medium text-foreground">
                        {item.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold tabular-nums">
                        {usd(item.amount)}
                      </span>
                      <Badge variant={statusVariant(item.status)}>
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                  {item.documentation ? (
                    <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                      {item.documentation}
                    </p>
                  ) : null}
                  <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-xs text-muted-foreground">
                      {item.periodLabel || "No period"}
                      {clientName(item.clientId)
                        ? ` · ${clientName(item.clientId)}`
                        : ""}
                      {item.createdByLabel ? ` · ${item.createdByLabel}` : ""}
                    </p>
                    <Select
                      value={item.status}
                      onValueChange={(v) => setStatus(item, v as BonusStatus)}
                    >
                      <SelectTrigger
                        className="w-44 h-8"
                        data-testid={`select-bonus-status-${item.id}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
            <DialogTitle>Record bonus event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger data-testid="select-bonus-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (USD)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                  data-testid="input-bonus-amount"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="What happened?"
                data-testid="input-bonus-title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="space-y-1.5">
                <Label>Period (optional)</Label>
                <Input
                  value={form.periodLabel}
                  onChange={(e) =>
                    setForm({ ...form, periodLabel: e.target.value })
                  }
                  placeholder="e.g. June 2026"
                  data-testid="input-bonus-period"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Documentation (optional)</Label>
              <Textarea
                value={form.documentation}
                onChange={(e) =>
                  setForm({ ...form, documentation: e.target.value })
                }
                rows={3}
                placeholder="Supporting evidence / context for review"
                data-testid="input-bonus-documentation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} data-testid="button-submit-bonus">
              Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
