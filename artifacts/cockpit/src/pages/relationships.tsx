import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  useListRelationships,
  useCreateContactLogEntry,
  useCreateScheduledEvent,
  getListRelationshipsQueryKey,
} from "@workspace/api-client-react";
import type { RelationshipSummary } from "@workspace/api-client-react";
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
import { PhoneCall, CalendarPlus, Snowflake, Flame, Thermometer } from "lucide-react";

const OWNERS = ["Gregg", "Landon", "Tara"];
const CHANNELS = ["Call", "Email", "Meeting", "Text", "Visit"];

function warmthMeta(warmth: string): {
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: React.ReactNode;
} {
  if (warmth === "Cold")
    return { variant: "destructive", icon: <Snowflake className="h-3 w-3" /> };
  if (warmth === "Warm")
    return { variant: "default", icon: <Flame className="h-3 w-3" /> };
  return { variant: "secondary", icon: <Thermometer className="h-3 w-3" /> };
}

function cadenceMeta(state: string): "default" | "secondary" | "destructive" | "outline" {
  if (state === "Overdue") return "destructive";
  if (state === "Due soon") return "default";
  return "outline";
}

export default function Relationships() {
  const [ownerFilter, setOwnerFilter] = useState<string>("All");
  const [warmthFilter, setWarmthFilter] = useState<string>("All");
  const [sharedOnly, setSharedOnly] = useState(false);

  const params = {
    ...(ownerFilter !== "All" ? { owner: ownerFilter } : {}),
    ...(warmthFilter !== "All" ? { warmth: warmthFilter } : {}),
    ...(sharedOnly ? { sharedWithTara: true } : {}),
  };

  const { data, isLoading } = useListRelationships(params, {
    query: { queryKey: getListRelationshipsQueryKey(params) },
  });

  const rows = (data ?? [])
    .slice()
    .sort((a, b) => {
      const aw = a.cadenceState === "Overdue" ? 0 : a.cadenceState === "Due soon" ? 1 : 2;
      const bw = b.cadenceState === "Overdue" ? 0 : b.cadenceState === "Due soon" ? 1 : 2;
      if (aw !== bw) return aw - bw;
      return (b.daysSinceTouch ?? 0) - (a.daysSinceTouch ?? 0);
    });

  const coldCount = rows.filter((r) => r.warmth === "Cold").length;
  const overdueCount = rows.filter((r) => r.cadenceState === "Overdue").length;

  return (
    <SidebarLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <header className="border-b border-border pb-6 mb-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">
            Relationship Radar
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mt-2">
            Relationships
          </h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl">
            Track relationship warmth and contact cadence across the portfolio. Log
            touches as they happen and plan the next visit or call before an account
            goes cold.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="relative overflow-hidden shadow-sm">
            <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
            <CardContent className="p-6">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Relationships
              </p>
              <div className="mt-4 text-4xl font-semibold tabular-nums">
                {rows.length}
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden shadow-sm">
            <div
              className={`absolute inset-x-0 top-0 h-1 ${overdueCount > 0 ? "bg-destructive" : "bg-border"}`}
            />
            <CardContent className="p-6">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Touch Overdue
              </p>
              <div className="mt-4 text-4xl font-semibold tabular-nums">
                {overdueCount}
              </div>
            </CardContent>
          </Card>
          <Card className="relative overflow-hidden shadow-sm">
            <div
              className={`absolute inset-x-0 top-0 h-1 ${coldCount > 0 ? "bg-destructive" : "bg-border"}`}
            />
            <CardContent className="p-6">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Going Cold
              </p>
              <div className="mt-4 text-4xl font-semibold tabular-nums">
                {coldCount}
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
            Warmth
          </span>
          {["All", "Warm", "Cooling", "Cold"].map((w) => (
            <Button
              key={w}
              variant={warmthFilter === w ? "default" : "outline"}
              size="sm"
              onClick={() => setWarmthFilter(w)}
              data-testid={`filter-warmth-${w}`}
            >
              {w}
            </Button>
          ))}
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
          <p className="text-sm text-muted-foreground">Loading relationships…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No relationships match these filters.
          </p>
        ) : (
          <div className="border rounded-lg divide-y">
            {rows.map((r) => (
              <RelationshipRow key={r.clientId} r={r} />
            ))}
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}

function RelationshipRow({ r }: { r: RelationshipSummary }) {
  const wm = warmthMeta(r.warmth);
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 p-4"
      data-testid={`relationship-${r.clientId}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link href={`/clients/${r.clientId}`}>
            <span className="font-semibold text-sm hover:underline cursor-pointer">
              {r.clientName}
            </span>
          </Link>
          <Badge variant={wm.variant} className="gap-1">
            {wm.icon}
            {r.warmth}
          </Badge>
          <Badge variant={cadenceMeta(r.cadenceState)}>{r.cadenceState}</Badge>
          {r.coOwner ? <Badge variant="secondary">{r.coOwner}</Badge> : null}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{r.companyName}</p>
      </div>

      <div className="flex items-center gap-6 text-xs">
        <div className="text-center">
          <div className="text-muted-foreground uppercase tracking-[0.1em] text-[10px]">
            Last touch
          </div>
          <div className="tabular-nums font-medium">
            {r.daysSinceTouch == null ? "—" : `${r.daysSinceTouch}d ago`}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground uppercase tracking-[0.1em] text-[10px]">
            Cadence
          </div>
          <div className="tabular-nums font-medium">{r.touchCadenceDays}d</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground uppercase tracking-[0.1em] text-[10px]">
            Next
          </div>
          <div className="tabular-nums font-medium">
            {r.nextEventDate || "—"}
          </div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground uppercase tracking-[0.1em] text-[10px]">
            Owner
          </div>
          <div className="font-medium">{r.owner || "—"}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <LogTouchDialog r={r} />
        <PlanTouchDialog r={r} />
      </div>
    </div>
  );
}

function LogTouchDialog({ r }: { r: RelationshipSummary }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [channel, setChannel] = useState("Call");
  const [internalPerson, setInternalPerson] = useState(r.owner || "Gregg");
  const [direction, setDirection] = useState("Outbound");
  const [summary, setSummary] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const createM = useCreateContactLogEntry({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/relationships"] });
        qc.invalidateQueries();
        setOpen(false);
        setSummary("");
        toast({ title: "Touch logged", description: `${channel} recorded for ${r.clientName}.` });
      },
      onError: () =>
        toast({
          title: "Could not log touch",
          description: "Please try again.",
          variant: "destructive",
        }),
    },
  });

  const submit = () => {
    createM.mutate({
      data: {
        clientId: r.clientId,
        channel,
        internalPerson,
        direction,
        summary: summary.trim() || undefined,
        date,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid={`button-log-touch-${r.clientId}`}>
          <PhoneCall className="h-3.5 w-3.5 mr-1" /> Log touch
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log touch — {r.clientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger data-testid="select-channel">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-testid="input-date"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Internal person</Label>
              <Select value={internalPerson} onValueChange={setInternalPerson}>
                <SelectTrigger data-testid="select-internal-person">
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
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <Select value={direction} onValueChange={setDirection}>
                <SelectTrigger data-testid="select-direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Outbound">Outbound</SelectItem>
                  <SelectItem value="Inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Summary</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              placeholder="What was discussed?"
              data-testid="input-summary"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={createM.isPending}
            data-testid="button-save-touch"
          >
            {createM.isPending ? "Saving…" : "Log touch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanTouchDialog({ r }: { r: RelationshipSummary }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Check-in");
  const [owner, setOwner] = useState(r.owner || "Gregg");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const createM = useCreateScheduledEvent({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["/api/relationships"] });
        qc.invalidateQueries();
        setOpen(false);
        setTitle("");
        toast({ title: "Touch planned", description: `Scheduled for ${r.clientName}.` });
      },
      onError: () =>
        toast({
          title: "Could not plan touch",
          description: "Please try again.",
          variant: "destructive",
        }),
    },
  });

  const submit = () => {
    if (!title.trim() || !date) {
      toast({
        title: "Missing fields",
        description: "Title and date are required.",
        variant: "destructive",
      });
      return;
    }
    createM.mutate({
      data: {
        clientId: r.clientId,
        title: title.trim(),
        type,
        owner,
        date,
        time: time || undefined,
        withClient: true,
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid={`button-plan-touch-${r.clientId}`}>
          <CalendarPlus className="h-3.5 w-3.5 mr-1" /> Plan
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Plan touch — {r.clientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Quarterly check-in call"
              data-testid="input-title"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Check-in", "Visit", "Meal", "Review", "Renewal"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
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
              <Label>Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-testid="input-date"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                data-testid="input-time"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={createM.isPending}
            data-testid="button-save-plan"
          >
            {createM.isPending ? "Saving…" : "Plan touch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
