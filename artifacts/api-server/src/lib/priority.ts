// Relationship + expansion scoring helpers.
//
// These power the Relationships radar (warmth / cadence) and the Expansion
// Pipeline ordering. Scoring is intentionally simple, deterministic, and
// documented so the cockpit can explain "why is this on top".

export type Warmth = "Warm" | "Cooling" | "Cold" | "Unknown";
export type CadenceState = "On track" | "Due soon" | "Overdue";

const DAY_MS = 86_400_000;

export function daysSince(dateIso: string | null | undefined): number | null {
  if (!dateIso) return null;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / DAY_MS);
}

export function daysUntil(dateIso: string | null | undefined): number | null {
  if (!dateIso) return null;
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.ceil((d.getTime() - Date.now()) / DAY_MS);
}

// Relationship temperature relative to the client's expected touch cadence.
export function warmthFor(
  daysSinceTouch: number | null,
  cadenceDays: number,
): Warmth {
  if (daysSinceTouch === null) return "Unknown";
  const cadence = cadenceDays > 0 ? cadenceDays : 30;
  if (daysSinceTouch <= cadence) return "Warm";
  if (daysSinceTouch <= cadence * 2) return "Cooling";
  return "Cold";
}

// Whether a proactive touch is due, independent of temperature wording.
export function cadenceStateFor(
  daysSinceTouch: number | null,
  cadenceDays: number,
): CadenceState {
  const cadence = cadenceDays > 0 ? cadenceDays : 30;
  if (daysSinceTouch === null) return "Overdue";
  if (daysSinceTouch >= cadence) return "Overdue";
  if (daysSinceTouch >= cadence * 0.8) return "Due soon";
  return "On track";
}

const STAGE_WEIGHTS: Record<string, number> = {
  identified: 4,
  qualifying: 8,
  proposed: 16,
  negotiation: 22,
  closing: 25,
  won: 5,
  lost: 0,
};

function stageWeight(stage: string): number {
  return STAGE_WEIGHTS[stage.trim().toLowerCase()] ?? 10;
}

const RISK_WEIGHTS: Record<string, number> = {
  low: 2,
  medium: 6,
  high: 10,
  critical: 12,
};

function riskWeight(riskLevel: string): number {
  return RISK_WEIGHTS[riskLevel.trim().toLowerCase()] ?? 4;
}

function urgencyWeight(targetDate: string | null | undefined): number {
  const until = daysUntil(targetDate);
  if (until === null) return 4; // no date: mild background urgency
  if (until <= 0) return 20; // overdue target
  if (until <= 14) return 16;
  if (until <= 30) return 12;
  if (until <= 60) return 8;
  if (until <= 90) return 4;
  return 2;
}

function warmthWeight(warmth: Warmth): number {
  switch (warmth) {
    case "Warm":
      return 10;
    case "Cooling":
      return 6;
    case "Cold":
      return 2;
    default:
      return 5;
  }
}

export interface PriorityInput {
  potentialValue: number;
  stage: string;
  targetDate: string | null | undefined;
  riskLevel: string;
  warmth: Warmth;
  priorityBoost: number;
}

// Composite 0..~120 priority. Higher = work it first. Manual boost is added
// directly so a coordinator can nudge ordering without overriding the model.
export function priorityScore(input: PriorityInput): number {
  const valueScore = Math.min(40, input.potentialValue / 500); // $20k -> 40
  const score =
    valueScore +
    stageWeight(input.stage) +
    urgencyWeight(input.targetDate) +
    riskWeight(input.riskLevel) +
    warmthWeight(input.warmth) +
    input.priorityBoost;
  return Math.round(score * 10) / 10;
}

const TERMINAL_STAGES = new Set(["won", "lost"]);
const STALLED_AFTER_DAYS = 21;

// An open opportunity that hasn't moved in a while needs a nudge.
export function isStalled(
  status: string,
  stage: string,
  daysSinceMovement: number | null,
): boolean {
  if (status.trim().toLowerCase() !== "open") return false;
  if (TERMINAL_STAGES.has(stage.trim().toLowerCase())) return false;
  if (daysSinceMovement === null) return false;
  return daysSinceMovement >= STALLED_AFTER_DAYS;
}
