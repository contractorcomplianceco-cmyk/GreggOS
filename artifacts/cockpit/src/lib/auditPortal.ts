import { useQuery } from "@tanstack/react-query";

const DEFAULT_PORTAL_URL = "https://audit-risk-model.replit.app";
const PORTAL_URL_KEY = "cockpit-audit-portal-url";

export function getPortalBaseUrl(): string {
  try {
    return (localStorage.getItem(PORTAL_URL_KEY) || DEFAULT_PORTAL_URL).replace(/\/$/, "");
  } catch {
    return DEFAULT_PORTAL_URL;
  }
}

export function setPortalBaseUrl(url: string): void {
  try {
    if (url && url.trim()) {
      localStorage.setItem(PORTAL_URL_KEY, url.trim().replace(/\/$/, ""));
    } else {
      localStorage.removeItem(PORTAL_URL_KEY);
    }
  } catch {
    /* ignore */
  }
}

export type AuditLevel = "critical" | "elevated" | "low" | string;

export interface AuditSummary {
  id: number;
  auditCode: string;
  clientName: string;
  homeState: string;
  entityType: string;
  status: string;
  reviewer: string;
  auditDate: string;
  layerANormalized: number;
  layerABand: string;
  overallScore: number;
  layerBBand: string;
  finalStatus: string;
  finalLevel: AuditLevel;
  activeTriggerCount: number;
  findingsCount: number;
  documentsCount: number;
  updatedAt: string;
}

export interface LayerAScores {
  caseHistory: number;
  insuranceWc: number;
  documentation: number;
  classification: number;
  licenseStanding: number;
  financialBonding: number;
  expansionExposure: number;
}

export interface AuditFinding {
  id: number;
  auditId: number;
  domain: string;
  riskFactor: string;
  title: string;
  summary: string;
  jurisdiction: string | null;
  applicabilityStatus: string | null;
  evidenceRequired: string | null;
  evidenceStatus: string | null;
  severity: number;
  likelihood: number;
  rawRisk: number;
  isCriticalTrigger: boolean;
  triggerKey: string | null;
  reviewerClearance: string | null;
  businessImpact: string | null;
  recommendedAction: string | null;
  actionPriority: string | null;
  actionOwner: string | null;
  dueDate: string | null;
  reviewer: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AuditDocument {
  id: number;
  auditId: number;
  domain: string;
  documentType: string;
  required: boolean;
  requiredReason: string | null;
  requestDate: string | null;
  receivedDate: string | null;
  expirationDate: string | null;
  evidenceStatus: string | null;
  deficiencyNote: string | null;
  owner: string | null;
  notes: string | null;
  createdAt: string;
}

export interface AuditDetail {
  id: number;
  auditCode: string;
  clientName: string;
  legalEntityName: string | null;
  dba: string | null;
  ein: string | null;
  entityType: string;
  homeState: string;
  activeStates: string | null;
  targetStates: string | null;
  primaryTrades: string | null;
  projectTypes: string | null;
  w2Count: number | null;
  contractor1099Count: number | null;
  subCount: number | null;
  annualRevenue: number | null;
  largestContract: number | null;
  expansionGoal: string | null;
  keyOwners: string | null;
  qualifierName: string | null;
  engagementOwner: string | null;
  reviewer: string;
  auditDate: string;
  scope: string | null;
  status: string;
  qaStatus: string | null;
  notes: string | null;
  layerAScores: LayerAScores;
  monitoringStatus: string | null;
  reviewFrequency: string | null;
  nextReviewDate: string | null;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  findings: AuditFinding[];
  documents: AuditDocument[];
}

export interface PortalClient {
  key: string;
  name: string;
  stage: string;
  stageLevel: number;
  screeningCount: number;
  quoteCount: number;
  auditCount: number;
  riskLabel: string | null;
  riskColor: string | null;
  riskScore: number | null;
  zohoLinked: boolean;
  latestActivity: string;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${getPortalBaseUrl()}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Audit portal request failed (${res.status}) for ${path}`);
  }
  return res.json() as Promise<T>;
}

export function useAuditPortalHealth() {
  return useQuery({
    queryKey: ["audit-portal", "health", getPortalBaseUrl()],
    queryFn: () => getJson<{ status: string }>("/api/healthz"),
    refetchInterval: 60_000,
    retry: 1,
  });
}

export function useAudits() {
  return useQuery({
    queryKey: ["audit-portal", "audits", getPortalBaseUrl()],
    queryFn: () => getJson<AuditSummary[]>("/api/audits"),
    refetchInterval: 120_000,
  });
}

export function useAuditDetail(id: number | null) {
  return useQuery({
    queryKey: ["audit-portal", "audit", id, getPortalBaseUrl()],
    queryFn: () => getJson<AuditDetail>(`/api/audits/${id}`),
    enabled: id != null,
  });
}

export function levelColor(level: AuditLevel): string {
  switch ((level || "").toLowerCase()) {
    case "critical":
      return "#b91c1c";
    case "elevated":
      return "#d97706";
    case "low":
      return "#16a34a";
    default:
      return "#64748b";
  }
}

const LAYER_A_FACTORS: { key: keyof LayerAScores; label: string }[] = [
  { key: "caseHistory", label: "Case History" },
  { key: "insuranceWc", label: "Insurance / WC" },
  { key: "documentation", label: "Documentation" },
  { key: "classification", label: "Classification" },
  { key: "licenseStanding", label: "License Standing" },
  { key: "financialBonding", label: "Financial / Bonding" },
  { key: "expansionExposure", label: "Expansion Exposure" },
];

export function layerAFactors(scores: LayerAScores) {
  return LAYER_A_FACTORS.map((f) => ({ ...f, value: scores[f.key] ?? 0 }));
}
