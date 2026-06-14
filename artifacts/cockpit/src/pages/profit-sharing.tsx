import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListProfitShares,
  useCreateProfitShare,
  useUpdateProfitShare,
  getListProfitSharesQueryKey,
} from "@workspace/api-client-react";
import type {
  ProfitShareProjection,
  ProfitShareStatus,
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
import { Plus, AlertTriangle } from "lucide-react";

const STATUSES: ProfitShareStatus[] = [
  "illustrative",
  "under_discussion",
  "documented",
];

const usd = (n: number): string =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "documented") return "default";
  if (status === "under_discussion") return "secondary";
  return "outline";
}

interface FormState {
  periodLabel: string;
  basis: string;
  projectedAmount: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  periodLabel: "",
  basis: "",
  projectedAmount: "",
  notes: "",
};

export default function ProfitSharing() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data, isLoading } = useListProfitShares({
    query: { queryKey: getListProfitSharesQueryKey() },
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListProfitSharesQueryKey() });
  const mOpts = { mutation: { onSuccess: invalidate } };
  const createM = useCreateProfitShare(mOpts);
  const updateM = useUpdateProfitShare(mOpts);

  const items = (data ?? []) as unknown as ProfitShareProjection[];

  const totals = useMemo(() => {
    const sum = items.reduce((s, i) => s + i.projectedAmount, 0);
    return { sum, count: items.length };
  }, [items]);

  async function submit() {
    const amount = Number(form.projectedAmount);
    if (!form.periodLabel.trim() || !form.basis.trim()) {
      toast({
        title: "Period and basis are required",
        variant: "destructive",
      });
      return;
    }
    if (!Number.isFinite(amount) || amount < 0) {
      toast({ title: "Enter a valid amount", variant: "destructive" });
      return;
    }
    try {
      await createM.mutateAsync({
        data: {
          periodLabel: form.periodLabel,
          basis: form.basis,
          projectedAmount: amount,
          notes: form.notes,
        },
      });
      toast({ title: "Projection added" });
      setForm(EMPTY_FORM);
      setDialogOpen(false);
    } catch {
      toast({ title: "Could not add projection", variant: "destructive" });
    }
  }

  async function setStatus(
    item: ProfitShareProjection,
    status: ProfitShareStatus,
  ) {
    try {
      await updateM.mutateAsync({ projectionId: item.id, data: { status } });
    } catch {
      toast({ title: "Could not update status", variant: "destructive" });
    }
  }

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader
          tag="My Executive Office"
          title="Profit Sharing"
          subtitle="Awareness and projection view of potential profit participation tied to retained-client contribution."
        />

        <div className="mb-8 rounded-lg border border-destructive/40 bg-destructive/5 p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="text-sm text-foreground">
            <p className="font-semibold">
              Projection only — this is not an entitlement.
            </p>
            <p className="mt-1 text-muted-foreground">
              The figures below are illustrative estimates for planning and
              awareness. They do not constitute a promise, agreement, or
              guarantee of any payment. Any actual profit participation must be
              defined and documented separately through company ownership and
              governance. Nothing in this screen creates a right to compensation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <StatCard
            label="Total illustrative projection"
            value={usd(totals.sum)}
            accent="primary"
          />
          <StatCard
            label="Projection entries"
            value={totals.count}
            accent="accent"
          />
        </div>

        <div className="flex justify-end mb-6">
          <Button
            onClick={() => setDialogOpen(true)}
            data-testid="button-add-projection"
          >
            <Plus className="h-4 w-4 mr-1" /> Add projection
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading projections…</p>
        ) : items.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No projections yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <Card
                key={item.id}
                className="shadow-sm"
                data-testid={`card-projection-${item.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <span className="font-medium text-foreground">
                      {item.periodLabel}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-semibold tabular-nums">
                        {usd(item.projectedAmount)}
                      </span>
                      <Badge variant={statusVariant(item.status)}>
                        {item.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.basis}
                  </p>
                  {item.notes ? (
                    <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">
                      {item.notes}
                    </p>
                  ) : null}
                  <div className="mt-3 flex justify-end">
                    <Select
                      value={item.status}
                      onValueChange={(v) =>
                        setStatus(item, v as ProfitShareStatus)
                      }
                    >
                      <SelectTrigger
                        className="w-44 h-8"
                        data-testid={`select-projection-status-${item.id}`}
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
            <DialogTitle>Add projection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Period</Label>
                <Input
                  value={form.periodLabel}
                  onChange={(e) =>
                    setForm({ ...form, periodLabel: e.target.value })
                  }
                  placeholder="e.g. 2026 (illustrative)"
                  data-testid="input-projection-period"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Projected amount (USD)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.projectedAmount}
                  onChange={(e) =>
                    setForm({ ...form, projectedAmount: e.target.value })
                  }
                  placeholder="0"
                  data-testid="input-projection-amount"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Basis</Label>
              <Input
                value={form.basis}
                onChange={(e) => setForm({ ...form, basis: e.target.value })}
                placeholder="How was this estimated?"
                data-testid="input-projection-basis"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
                placeholder="Caveats / assumptions"
                data-testid="input-projection-notes"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Reminder: projections are illustrative and do not create an
              entitlement to payment.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit} data-testid="button-submit-projection">
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
