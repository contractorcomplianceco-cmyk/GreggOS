import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/layout/StatCard";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import {
  useListPlacements,
  useCreatePlacement,
  useUpdatePlacement,
  getListPlacementsQueryKey,
  useListQualifiers,
  useCreateQualifier,
  useUpdateQualifier,
  getListQualifiersQueryKey,
} from "@workspace/api-client-react";
import type {
  Placement,
  PlacementStage,
  PlacementStatus,
  Qualifier,
  QualifierAvailability,
  QualifierStatus,
  CurrentClient,
} from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const PLACEMENT_STAGES: PlacementStage[] = [
  "interest",
  "fit_review",
  "internal_review",
  "placed",
  "renewal",
  "replacement",
];
const PLACEMENT_STATUSES: PlacementStatus[] = [
  "open",
  "on_hold",
  "placed",
  "closed",
];
const QUALIFIER_AVAILABILITY: QualifierAvailability[] = [
  "available",
  "engaged",
  "unavailable",
];
const QUALIFIER_STATUSES: QualifierStatus[] = [
  "prospect",
  "intake",
  "verified",
  "active",
  "inactive",
];

function pretty(v: string): string {
  return v.replace(/_/g, " ");
}

function stageVariant(
  stage: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (stage === "placed") return "default";
  if (stage === "internal_review") return "secondary";
  return "outline";
}

interface PlacementForm {
  title: string;
  clientId: string;
  qualifierId: string;
  licenseType: string;
  state: string;
  tradeClassification: string;
  timeline: string;
  budget: string;
  expectations: string;
  riskFlags: string;
  nextStep: string;
  missingInfo: string;
}

const EMPTY_PLACEMENT: PlacementForm = {
  title: "",
  clientId: "none",
  qualifierId: "none",
  licenseType: "",
  state: "",
  tradeClassification: "",
  timeline: "",
  budget: "",
  expectations: "",
  riskFlags: "",
  nextStep: "",
  missingInfo: "",
};

interface QualifierForm {
  name: string;
  licenseType: string;
  state: string;
  tradeClassification: string;
  contact: string;
  notes: string;
}

const EMPTY_QUALIFIER: QualifierForm = {
  name: "",
  licenseType: "",
  state: "",
  tradeClassification: "",
  contact: "",
  notes: "",
};

export default function PlacementNetwork() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { clients } = useStore();

  const [tab, setTab] = useState("placements");
  const [pStageFilter, setPStageFilter] = useState("All");
  const [pStatusFilter, setPStatusFilter] = useState("All");
  const [placementDialog, setPlacementDialog] = useState(false);
  const [qualifierDialog, setQualifierDialog] = useState(false);
  const [placementForm, setPlacementForm] =
    useState<PlacementForm>(EMPTY_PLACEMENT);
  const [qualifierForm, setQualifierForm] =
    useState<QualifierForm>(EMPTY_QUALIFIER);

  const pParams = {
    ...(pStageFilter !== "All" ? { stage: pStageFilter } : {}),
    ...(pStatusFilter !== "All" ? { status: pStatusFilter } : {}),
  };
  const { data: placementData, isLoading: placementsLoading } =
    useListPlacements(pParams, {
      query: { queryKey: getListPlacementsQueryKey(pParams) },
    });
  const { data: qualifierData, isLoading: qualifiersLoading } =
    useListQualifiers(undefined, {
      query: { queryKey: getListQualifiersQueryKey() },
    });

  const invalidatePlacements = () =>
    qc.invalidateQueries({ queryKey: getListPlacementsQueryKey() });
  const invalidateQualifiers = () =>
    qc.invalidateQueries({ queryKey: getListQualifiersQueryKey() });

  const createPlacement = useCreatePlacement({
    mutation: { onSuccess: invalidatePlacements },
  });
  const updatePlacement = useUpdatePlacement({
    mutation: { onSuccess: invalidatePlacements },
  });
  const createQualifier = useCreateQualifier({
    mutation: { onSuccess: invalidateQualifiers },
  });
  const updateQualifier = useUpdateQualifier({
    mutation: { onSuccess: invalidateQualifiers },
  });

  const placements = (placementData ?? []) as unknown as Placement[];
  const qualifiers = (qualifierData ?? []) as unknown as Qualifier[];

  const clientName = (id: string | null): string => {
    if (!id) return "";
    const c = (clients as CurrentClient[]).find((x) => x.id === id);
    return c ? c.companyName || c.clientName : "Unknown";
  };
  const qualifierName = (id: string | null): string => {
    if (!id) return "";
    return qualifiers.find((q) => q.id === id)?.name ?? "Unknown";
  };

  const stats = useMemo(() => {
    const open = placements.filter((p) => p.status === "open").length;
    const placed = placements.filter((p) => p.stage === "placed").length;
    const available = qualifiers.filter(
      (q) => q.availability === "available",
    ).length;
    return { open, placed, available };
  }, [placements, qualifiers]);

  async function submitPlacement() {
    if (!placementForm.title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    try {
      await createPlacement.mutateAsync({
        data: {
          title: placementForm.title,
          clientId:
            placementForm.clientId === "none" ? null : placementForm.clientId,
          qualifierId:
            placementForm.qualifierId === "none"
              ? null
              : placementForm.qualifierId,
          licenseType: placementForm.licenseType,
          state: placementForm.state,
          tradeClassification: placementForm.tradeClassification,
          timeline: placementForm.timeline,
          budget: placementForm.budget,
          expectations: placementForm.expectations,
          riskFlags: placementForm.riskFlags,
          nextStep: placementForm.nextStep,
          missingInfo: placementForm.missingInfo,
        },
      });
      toast({ title: "Placement created" });
      setPlacementForm(EMPTY_PLACEMENT);
      setPlacementDialog(false);
    } catch {
      toast({ title: "Could not create placement", variant: "destructive" });
    }
  }

  async function submitQualifier() {
    if (!qualifierForm.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    try {
      await createQualifier.mutateAsync({
        data: {
          name: qualifierForm.name,
          licenseType: qualifierForm.licenseType,
          state: qualifierForm.state,
          tradeClassification: qualifierForm.tradeClassification,
          contact: qualifierForm.contact,
          notes: qualifierForm.notes,
        },
      });
      toast({ title: "Qualifier added" });
      setQualifierForm(EMPTY_QUALIFIER);
      setQualifierDialog(false);
    } catch {
      toast({ title: "Could not add qualifier", variant: "destructive" });
    }
  }

  async function setPlacementStage(item: Placement, stage: PlacementStage) {
    try {
      await updatePlacement.mutateAsync({
        placementId: item.id,
        data: { stage },
      });
    } catch {
      toast({ title: "Could not update stage", variant: "destructive" });
    }
  }
  async function setPlacementStatus(item: Placement, status: PlacementStatus) {
    try {
      await updatePlacement.mutateAsync({
        placementId: item.id,
        data: { status },
      });
    } catch {
      toast({ title: "Could not update status", variant: "destructive" });
    }
  }
  async function setQualifierAvailability(
    item: Qualifier,
    availability: QualifierAvailability,
  ) {
    try {
      await updateQualifier.mutateAsync({
        qualifierId: item.id,
        data: { availability },
      });
    } catch {
      toast({ title: "Could not update availability", variant: "destructive" });
    }
  }

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <PageHeader
          tag="Casting & Nets"
          title="Placement / Qualifier Network"
          subtitle="Coordinate licensed-qualifier placements: track candidate qualifiers and route client placement opportunities through fit and review. This tool organizes and prepares placements; it does not approve or finalize any qualifier placement, which requires leadership and compliance sign-off."
        />

        <div className="mb-8 rounded-lg border border-border bg-muted/40 p-3 flex gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Decision boundary: placements are coordinated here but never
            committed here. Final qualifier placement decisions sit with
            leadership and compliance.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard label="Open placements" value={stats.open} accent="primary" />
          <StatCard label="Placed" value={stats.placed} accent="accent" />
          <StatCard
            label="Available qualifiers"
            value={stats.available}
            accent={stats.available > 0 ? "accent" : "border"}
          />
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="placements" data-testid="tab-placements">
              Placements
            </TabsTrigger>
            <TabsTrigger value="qualifiers" data-testid="tab-qualifiers">
              Qualifiers
            </TabsTrigger>
          </TabsList>

          <TabsContent value="placements" className="mt-6">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Stage
              </Label>
              <Select value={pStageFilter} onValueChange={setPStageFilter}>
                <SelectTrigger
                  className="w-44"
                  data-testid="select-stage-filter"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {PLACEMENT_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {pretty(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground ml-2">
                Status
              </Label>
              <Select value={pStatusFilter} onValueChange={setPStatusFilter}>
                <SelectTrigger
                  className="w-40"
                  data-testid="select-placement-status-filter"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  {PLACEMENT_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {pretty(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="ml-auto"
                onClick={() => setPlacementDialog(true)}
                data-testid="button-add-placement"
              >
                <Plus className="h-4 w-4 mr-1" /> New placement
              </Button>
            </div>

            {placementsLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading placements…
              </p>
            ) : placements.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  No placements yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {placements.map((item) => (
                  <Card
                    key={item.id}
                    className="shadow-sm"
                    data-testid={`card-placement-${item.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground">
                              {item.title}
                            </span>
                            <Badge variant={stageVariant(item.stage)}>
                              {pretty(item.stage)}
                            </Badge>
                            <Badge variant="outline">{pretty(item.status)}</Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[
                              item.licenseType,
                              item.state,
                              item.tradeClassification,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                        {clientName(item.clientId) ? (
                          <p>
                            <span className="text-muted-foreground">
                              Client:{" "}
                            </span>
                            {clientName(item.clientId)}
                          </p>
                        ) : null}
                        {qualifierName(item.qualifierId) ? (
                          <p>
                            <span className="text-muted-foreground">
                              Qualifier:{" "}
                            </span>
                            {qualifierName(item.qualifierId)}
                          </p>
                        ) : null}
                        {item.timeline ? (
                          <p>
                            <span className="text-muted-foreground">
                              Timeline:{" "}
                            </span>
                            {item.timeline}
                          </p>
                        ) : null}
                        {item.budget ? (
                          <p>
                            <span className="text-muted-foreground">
                              Budget:{" "}
                            </span>
                            {item.budget}
                          </p>
                        ) : null}
                      </div>
                      {item.nextStep ? (
                        <p className="mt-2 text-sm">
                          <span className="text-muted-foreground">
                            Next step:{" "}
                          </span>
                          {item.nextStep}
                        </p>
                      ) : null}
                      {item.riskFlags ? (
                        <p className="mt-1 text-sm text-destructive">
                          {item.riskFlags}
                        </p>
                      ) : null}
                      {item.missingInfo ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Missing: {item.missingInfo}
                        </p>
                      ) : null}
                      <div className="mt-3 flex items-center gap-3 flex-wrap">
                        <Select
                          value={item.stage}
                          onValueChange={(v) =>
                            setPlacementStage(item, v as PlacementStage)
                          }
                        >
                          <SelectTrigger
                            className="w-44 h-8"
                            data-testid={`select-placement-stage-${item.id}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PLACEMENT_STAGES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {pretty(s)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={item.status}
                          onValueChange={(v) =>
                            setPlacementStatus(item, v as PlacementStatus)
                          }
                        >
                          <SelectTrigger
                            className="w-40 h-8"
                            data-testid={`select-placement-status-${item.id}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PLACEMENT_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {pretty(s)}
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
          </TabsContent>

          <TabsContent value="qualifiers" className="mt-6">
            <div className="flex justify-end mb-6">
              <Button
                onClick={() => setQualifierDialog(true)}
                data-testid="button-add-qualifier"
              >
                <Plus className="h-4 w-4 mr-1" /> Add qualifier
              </Button>
            </div>
            {qualifiersLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading qualifiers…
              </p>
            ) : qualifiers.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  No qualifiers yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {qualifiers.map((q) => (
                  <Card
                    key={q.id}
                    className="shadow-sm"
                    data-testid={`card-qualifier-${q.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-foreground">
                              {q.name}
                            </span>
                            <Badge variant="secondary">{pretty(q.status)}</Badge>
                            <Badge variant="outline">
                              {pretty(q.availability)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {[q.licenseType, q.state, q.tradeClassification]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          {q.contact ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {q.contact}
                            </p>
                          ) : null}
                          {q.notes ? (
                            <p className="mt-2 text-sm">{q.notes}</p>
                          ) : null}
                        </div>
                        <Select
                          value={q.availability}
                          onValueChange={(v) =>
                            setQualifierAvailability(
                              q,
                              v as QualifierAvailability,
                            )
                          }
                        >
                          <SelectTrigger
                            className="w-40 h-8"
                            data-testid={`select-qualifier-availability-${q.id}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {QUALIFIER_AVAILABILITY.map((a) => (
                              <SelectItem key={a} value={a}>
                                {pretty(a)}
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
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={placementDialog} onOpenChange={setPlacementDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New placement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={placementForm.title}
                onChange={(e) =>
                  setPlacementForm({ ...placementForm, title: e.target.value })
                }
                placeholder="e.g. GC qualifier placement — TX commercial"
                data-testid="input-placement-title"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Client (optional)</Label>
                <Select
                  value={placementForm.clientId}
                  onValueChange={(v) =>
                    setPlacementForm({ ...placementForm, clientId: v })
                  }
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
                <Label>Qualifier (optional)</Label>
                <Select
                  value={placementForm.qualifierId}
                  onValueChange={(v) =>
                    setPlacementForm({ ...placementForm, qualifierId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {qualifiers.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {q.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>License type</Label>
                <Input
                  value={placementForm.licenseType}
                  onChange={(e) =>
                    setPlacementForm({
                      ...placementForm,
                      licenseType: e.target.value,
                    })
                  }
                  data-testid="input-placement-license"
                />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input
                  value={placementForm.state}
                  onChange={(e) =>
                    setPlacementForm({
                      ...placementForm,
                      state: e.target.value,
                    })
                  }
                  data-testid="input-placement-state"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Trade</Label>
                <Input
                  value={placementForm.tradeClassification}
                  onChange={(e) =>
                    setPlacementForm({
                      ...placementForm,
                      tradeClassification: e.target.value,
                    })
                  }
                  data-testid="input-placement-trade"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Timeline</Label>
                <Input
                  value={placementForm.timeline}
                  onChange={(e) =>
                    setPlacementForm({
                      ...placementForm,
                      timeline: e.target.value,
                    })
                  }
                  data-testid="input-placement-timeline"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Budget</Label>
                <Input
                  value={placementForm.budget}
                  onChange={(e) =>
                    setPlacementForm({
                      ...placementForm,
                      budget: e.target.value,
                    })
                  }
                  data-testid="input-placement-budget"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Expectations</Label>
              <Textarea
                value={placementForm.expectations}
                onChange={(e) =>
                  setPlacementForm({
                    ...placementForm,
                    expectations: e.target.value,
                  })
                }
                rows={2}
                data-testid="input-placement-expectations"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Next step</Label>
                <Input
                  value={placementForm.nextStep}
                  onChange={(e) =>
                    setPlacementForm({
                      ...placementForm,
                      nextStep: e.target.value,
                    })
                  }
                  data-testid="input-placement-nextstep"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Missing info</Label>
                <Input
                  value={placementForm.missingInfo}
                  onChange={(e) =>
                    setPlacementForm({
                      ...placementForm,
                      missingInfo: e.target.value,
                    })
                  }
                  data-testid="input-placement-missing"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Risk flags</Label>
              <Textarea
                value={placementForm.riskFlags}
                onChange={(e) =>
                  setPlacementForm({
                    ...placementForm,
                    riskFlags: e.target.value,
                  })
                }
                rows={2}
                data-testid="input-placement-risk"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPlacementDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitPlacement}
              data-testid="button-submit-placement"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={qualifierDialog} onOpenChange={setQualifierDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add qualifier</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={qualifierForm.name}
                onChange={(e) =>
                  setQualifierForm({ ...qualifierForm, name: e.target.value })
                }
                data-testid="input-qualifier-name"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>License type</Label>
                <Input
                  value={qualifierForm.licenseType}
                  onChange={(e) =>
                    setQualifierForm({
                      ...qualifierForm,
                      licenseType: e.target.value,
                    })
                  }
                  data-testid="input-qualifier-license"
                />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input
                  value={qualifierForm.state}
                  onChange={(e) =>
                    setQualifierForm({
                      ...qualifierForm,
                      state: e.target.value,
                    })
                  }
                  data-testid="input-qualifier-state"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Trade</Label>
                <Input
                  value={qualifierForm.tradeClassification}
                  onChange={(e) =>
                    setQualifierForm({
                      ...qualifierForm,
                      tradeClassification: e.target.value,
                    })
                  }
                  data-testid="input-qualifier-trade"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Contact (optional)</Label>
              <Input
                value={qualifierForm.contact}
                onChange={(e) =>
                  setQualifierForm({
                    ...qualifierForm,
                    contact: e.target.value,
                  })
                }
                data-testid="input-qualifier-contact"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea
                value={qualifierForm.notes}
                onChange={(e) =>
                  setQualifierForm({ ...qualifierForm, notes: e.target.value })
                }
                rows={3}
                data-testid="input-qualifier-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setQualifierDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={submitQualifier}
              data-testid="button-submit-qualifier"
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
