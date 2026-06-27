import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import {
  useListTravelPlans,
  useCreateTravelPlan,
  useUpdateTravelPlan,
  useDeleteTravelPlan,
  getListTravelPlansQueryKey,
} from "@workspace/api-client-react";
import type { TravelPlan, TravelStatus, CurrentClient } from "@/lib/types";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plane, MapPin, Trash2, Plus } from "lucide-react";
import { LoadingState } from "@/components/layout/FishingSpinner";

const STATUSES: TravelStatus[] = [
  "Proposed",
  "Planned",
  "Booked",
  "Completed",
  "Cancelled",
];

const REASONS = [
  "High-value retention risk",
  "Expansion opportunity",
  "Strategic partnership growth",
  "Relationship building",
  "Other",
];

const OWNERS = ["Gregg", "Landon", "Tara"];

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "Booked" || status === "Completed") return "default";
  if (status === "Cancelled") return "destructive";
  if (status === "Planned") return "outline";
  return "secondary";
}

interface FormState {
  clientId: string;
  location: string;
  reason: string;
  roiReason: string;
  status: TravelStatus;
  startDate: string;
  endDate: string;
  notes: string;
  owner: string;
}

const EMPTY_FORM: FormState = {
  clientId: "none",
  location: "",
  reason: REASONS[0]!,
  roiReason: "",
  status: "Proposed",
  startDate: "",
  endDate: "",
  notes: "",
  owner: "Gregg",
};

export default function TravelPlanner() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { clients } = useStore();

  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TravelPlan | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const params = statusFilter !== "All" ? { status: statusFilter } : {};
  const { data, isLoading } = useListTravelPlans(params, {
    query: { queryKey: getListTravelPlansQueryKey(params) },
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: getListTravelPlansQueryKey() });
  const mOpts = { mutation: { onSuccess: invalidate } };
  const createM = useCreateTravelPlan(mOpts);
  const updateM = useUpdateTravelPlan(mOpts);
  const deleteM = useDeleteTravelPlan(mOpts);

  const plans = (data ?? []) as unknown as TravelPlan[];

  const clientName = (id: string | null): string => {
    if (!id) return "Portfolio / region";
    const c = (clients as CurrentClient[]).find((x) => x.id === id);
    return c ? c.companyName || c.clientName : "Unknown client";
  };

  const counts = useMemo(() => {
    const active = plans.filter(
      (p) => p.status !== "Completed" && p.status !== "Cancelled",
    ).length;
    const booked = plans.filter((p) => p.status === "Booked").length;
    return { total: plans.length, active, booked };
  }, [plans]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  function openEdit(plan: TravelPlan) {
    setEditing(plan);
    setForm({
      clientId: plan.clientId ?? "none",
      location: plan.location,
      reason: plan.reason || REASONS[0]!,
      roiReason: plan.roiReason,
      status: plan.status,
      startDate: plan.startDate,
      endDate: plan.endDate,
      notes: plan.notes,
      owner: plan.owner || "Gregg",
    });
    setDialogOpen(true);
  }

  async function save() {
    if (!form.location.trim()) {
      toast({ title: "Location is required", variant: "destructive" });
      return;
    }
    const payload = {
      clientId: form.clientId === "none" ? null : form.clientId,
      location: form.location.trim(),
      reason: form.reason,
      roiReason: form.roiReason,
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate,
      notes: form.notes,
      owner: form.owner,
    };
    try {
      if (editing) {
        await updateM.mutateAsync({
          planId: editing.id,
          data: payload as never,
        });
        toast({ title: "Travel plan updated" });
      } else {
        await createM.mutateAsync({ data: payload as never });
        toast({ title: "Travel plan created" });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Could not save travel plan", variant: "destructive" });
    }
  }

  async function remove(plan: TravelPlan) {
    try {
      await deleteM.mutateAsync({ planId: plan.id });
      toast({ title: "Travel plan deleted" });
    } catch {
      toast({ title: "Could not delete plan", variant: "destructive" });
    }
  }

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader
          tag="Charting a Course"
          title="Travel Planner"
          subtitle="Plan strategic in-person client visits with an explicit ROI justification. This board organizes proposed travel for review — it does not approve travel spend or budgets."
          action={
            <Button onClick={openCreate} data-testid="button-add-travel">
              <Plus className="h-4 w-4 mr-1" /> New plan
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard label="Total Plans" value={counts.total} accent="primary" />
          <StatCard label="Active" value={counts.active} accent="accent" />
          <StatCard label="Booked" value={counts.booked} accent="border" />
        </div>

        <div className="flex items-center gap-3 mb-6">
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
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <LoadingState message="Charting a course…" />
        ) : plans.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="p-10 text-center text-sm text-muted-foreground">
              No travel plans yet. Create one to start planning a strategic
              client visit.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="shadow-sm hover:shadow-md transition-shadow"
                data-testid={`card-travel-${plan.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 text-accent" />
                      <button
                        type="button"
                        className="text-left font-semibold text-foreground hover:underline"
                        onClick={() => openEdit(plan)}
                        data-testid={`button-edit-travel-${plan.id}`}
                      >
                        {plan.location}
                      </button>
                    </div>
                    <Badge variant={statusVariant(plan.status)}>
                      {plan.status}
                    </Badge>
                  </div>

                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {clientName(plan.clientId)}
                    {plan.owner ? ` · ${plan.owner}` : ""}
                  </div>

                  {plan.reason ? (
                    <p className="mt-3 text-sm text-foreground">{plan.reason}</p>
                  ) : null}
                  {plan.roiReason ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">ROI: </span>
                      {plan.roiReason}
                    </p>
                  ) : null}

                  {(plan.startDate || plan.endDate) && (
                    <p className="mt-3 text-xs text-muted-foreground tabular-nums">
                      {plan.startDate || "—"} → {plan.endDate || "—"}
                    </p>
                  )}

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(plan)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => remove(plan)}
                      data-testid={`button-delete-travel-${plan.id}`}
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
              {editing ? "Edit travel plan" : "New travel plan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                placeholder="City, state or venue"
                data-testid="input-location"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Select
                  value={form.clientId}
                  onValueChange={(v) => setForm({ ...form, clientId: v })}
                >
                  <SelectTrigger data-testid="select-client">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Portfolio / region</SelectItem>
                    {(clients as CurrentClient[]).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.companyName || c.clientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Owner</Label>
                <Select
                  value={form.owner}
                  onValueChange={(v) => setForm({ ...form, owner: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OWNERS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Reason</Label>
                <Select
                  value={form.reason}
                  onValueChange={(v) => setForm({ ...form, reason: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REASONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({ ...form, status: v as TravelStatus })
                  }
                >
                  <SelectTrigger>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start date</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>End date</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>ROI justification</Label>
              <Textarea
                value={form.roiReason}
                onChange={(e) =>
                  setForm({ ...form, roiReason: e.target.value })
                }
                placeholder="Why this trip is worth the spend"
                rows={2}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} data-testid="button-save-travel">
              {editing ? "Save changes" : "Create plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
