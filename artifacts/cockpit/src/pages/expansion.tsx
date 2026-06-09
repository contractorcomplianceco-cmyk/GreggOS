import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  useListExpansionPipeline,
  useUpdateExpansionMilestone,
  useCreateExpansionMilestone,
  useListClients,
  getListExpansionPipelineQueryKey,
} from "@workspace/api-client-react";
import type { ExpansionOpportunity } from "@workspace/api-client-react";
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
import {
  Pin,
  PinOff,
  ChevronUp,
  ChevronDown,
  AlertTriangle,
  TrendingUp,
  Plus,
} from "lucide-react";

const STAGES = ["Identified", "Qualifying", "Proposed", "Negotiation", "Closing"];
const OWNERS = ["Gregg", "Landon", "Tara"];

function money(n: number): string {
  if (!n) return "$0";
  return `$${n.toLocaleString("en-US")}`;
}

function riskBadgeVariant(level: string): "default" | "secondary" | "destructive" | "outline" {
  if (level === "High" || level === "Critical") return "destructive";
  if (level === "Medium") return "default";
  return "secondary";
}

export default function Expansion() {
  const qc = useQueryClient();
  const [ownerFilter, setOwnerFilter] = useState<string>("All");
  const [stageFilter, setStageFilter] = useState<string>("All");
  const [sharedOnly, setSharedOnly] = useState(false);

  const params = {
    ...(ownerFilter !== "All" ? { owner: ownerFilter } : {}),
    ...(stageFilter !== "All" ? { stage: stageFilter } : {}),
    ...(sharedOnly ? { sharedWithTara: true } : {}),
  };

  const { data: pipeline, isLoading } = useListExpansionPipeline(params, {
    query: { queryKey: getListExpansionPipelineQueryKey(params) },
  });

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["/api/expansion-pipeline"] });

  const updateM = useUpdateExpansionMilestone({
    mutation: { onSuccess: invalidate },
  });

  const opportunities = pipeline ?? [];

  const totalValue = opportunities.reduce(
    (sum, o) => sum + o.milestone.potentialValue,
    0
  );
  const stalledCount = opportunities.filter((o) => o.stalled).length;

  const byStage = STAGES.map((stage) => ({
    stage,
    items: opportunities
      .filter((o) => o.milestone.stage === stage)
      .sort((a, b) => b.priorityScore - a.priorityScore),
  }));

  const togglePin = (o: ExpansionOpportunity) => {
    updateM.mutate({
      milestoneId: o.milestone.id,
      data: { pinned: !o.milestone.pinned },
    });
  };

  const adjustBoost = (o: ExpansionOpportunity, delta: number) => {
    const next = Math.max(0, Math.min(20, o.milestone.priorityBoost + delta));
    updateM.mutate({ milestoneId: o.milestone.id, data: { priorityBoost: next } });
  };

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <header className="border-b border-border pb-6 mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            Portfolio Growth
          </p>
          <div className="flex flex-wrap items-end justify-between gap-3 mt-2">
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">
              Expansion Pipeline
            </h1>
            <CreateMilestoneDialog onCreated={invalidate} />
          </div>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
            Every open expansion opportunity across the portfolio, auto-prioritized
            by value, stage, target date, relationship warmth, and risk. Pin or
            boost items to override the ranking.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="relative overflow-hidden shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
            <CardContent className="p-6">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Open Opportunities
              </p>
              <div className="mt-4 text-4xl font-semibold tabular-nums">
                {opportunities.length}
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 bg-accent" />
            <CardContent className="p-6">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Pipeline Value
              </p>
              <div className="mt-4 text-4xl font-semibold tabular-nums">
                {money(totalValue)}
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden shadow-sm">
            <div
              className={`absolute inset-x-0 top-0 h-1 ${stalledCount > 0 ? "bg-destructive" : "bg-border"}`}
            />
            <CardContent className="p-6">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Stalled
              </p>
              <div className="mt-4 text-4xl font-semibold tabular-nums">
                {stalledCount}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-8">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground mr-1">
            Owner
          </span>
          {["All", ...OWNERS].map((o) => (
            <Button
              key={o}
              variant={ownerFilter === o ? "default" : "outline"}
              size="sm"
              onClick={() => setOwnerFilter(o)}
              data-testid={`filter-owner-${o}`}
            >
              {o}
            </Button>
          ))}
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground mx-1 ml-4">
            Stage
          </span>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[160px] h-9" data-testid="filter-stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All stages</SelectItem>
              {STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant={sharedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setSharedOnly((v) => !v)}
            className="ml-2"
            data-testid="filter-shared-tara"
          >
            Shared with Tara
          </Button>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading pipeline…</p>
        ) : opportunities.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No open expansion opportunities match these filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {byStage.map((col) => (
              <div key={col.stage} className="min-w-0">
                <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
                  <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-foreground/80">
                    {col.stage}
                  </h2>
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {col.items.length}
                  </span>
                </div>
                <div className="space-y-3">
                  {col.items.map((o) => (
                    <Card
                      key={o.milestone.id}
                      className={`p-3 transition-all hover:shadow-md ${o.milestone.pinned ? "border-l-4 border-l-accent" : ""} ${o.stalled ? "bg-destructive/5" : ""}`}
                      data-testid={`milestone-${o.milestone.id}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`/clients/${o.milestone.clientId}`}>
                          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground cursor-pointer">
                            {o.clientName}
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => togglePin(o)}
                          className="text-muted-foreground hover:text-accent shrink-0"
                          title={o.milestone.pinned ? "Unpin" : "Pin"}
                          data-testid={`pin-${o.milestone.id}`}
                        >
                          {o.milestone.pinned ? (
                            <Pin className="h-3.5 w-3.5 fill-current" />
                          ) : (
                            <PinOff className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="mt-1 text-sm font-medium leading-snug">
                        {o.milestone.title}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge variant="outline" className="tabular-nums">
                          {money(o.milestone.potentialValue)}
                        </Badge>
                        <Badge variant={riskBadgeVariant(o.riskLevel)}>
                          {o.riskLevel}
                        </Badge>
                        {o.sharedWithTara ? (
                          <Badge variant="secondary">Tara</Badge>
                        ) : null}
                        {o.stalled ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Stalled
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          <span className="tabular-nums font-medium text-foreground">
                            {o.priorityScore}
                          </span>
                          {o.milestone.priorityBoost > 0 ? (
                            <span className="text-accent">
                              (+{o.milestone.priorityBoost})
                            </span>
                          ) : null}
                        </span>
                        <span className="tabular-nums">
                          {o.daysSinceMovement}d idle
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-border/60 pt-2">
                        <span className="text-[11px] text-muted-foreground">
                          {o.milestone.owner || "Unassigned"}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => adjustBoost(o, -5)}
                            disabled={o.milestone.priorityBoost <= 0}
                            className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            title="Lower boost"
                            data-testid={`boost-down-${o.milestone.id}`}
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustBoost(o, 5)}
                            className="text-muted-foreground hover:text-accent"
                            title="Raise boost"
                            data-testid={`boost-up-${o.milestone.id}`}
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {col.items.length === 0 ? (
                    <p className="text-[11px] text-muted-foreground/60 py-2">
                      —
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

function CreateMilestoneDialog({ onCreated }: { onCreated: () => void }) {
  const { toast } = useToast();
  const { data: clients } = useListClients();
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [title, setTitle] = useState("");
  const [stage, setStage] = useState("Identified");
  const [owner, setOwner] = useState("Gregg");
  const [potentialValue, setPotentialValue] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [description, setDescription] = useState("");

  const createM = useCreateExpansionMilestone({
    mutation: {
      onSuccess: () => {
        onCreated();
        setOpen(false);
        setClientId("");
        setTitle("");
        setStage("Identified");
        setOwner("Gregg");
        setPotentialValue("");
        setTargetDate("");
        setDescription("");
        toast({ title: "Opportunity added", description: "New milestone created." });
      },
      onError: () =>
        toast({
          title: "Could not create",
          description: "Check the fields and try again.",
          variant: "destructive",
        }),
    },
  });

  const submit = () => {
    if (!clientId || !title.trim()) {
      toast({
        title: "Missing fields",
        description: "Client and title are required.",
        variant: "destructive",
      });
      return;
    }
    createM.mutate({
      data: {
        clientId,
        title: title.trim(),
        stage,
        owner,
        potentialValue: potentialValue ? Number(potentialValue) : 0,
        targetDate: targetDate || undefined,
        description: description.trim() || undefined,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" data-testid="button-add-milestone">
          <Plus className="h-4 w-4 mr-1" /> Add opportunity
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New expansion opportunity</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger data-testid="select-client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {(clients ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.clientName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Multi-state licensing add-on"
              data-testid="input-title"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger data-testid="select-stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Owner</Label>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger data-testid="select-owner">
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
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Potential value ($)</Label>
              <Input
                type="number"
                value={potentialValue}
                onChange={(e) => setPotentialValue(e.target.value)}
                placeholder="0"
                data-testid="input-value"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Target date</Label>
              <Input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                data-testid="input-target-date"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              data-testid="input-description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={createM.isPending}
            data-testid="button-save-milestone"
          >
            {createM.isPending ? "Saving…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
