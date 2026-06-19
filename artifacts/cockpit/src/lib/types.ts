export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type ClientStatus = 'Active' | 'At Risk' | 'Onboarding' | 'Renewal Pending' | 'Stalled';
export type CallType = 'Inbound' | 'Outbound' | 'Scheduled Check-in' | 'Escalation' | 'Qualifier Discussion' | 'Placement Discussion' | 'Renewal' | 'Monitoring' | 'Other';
export type CallNoteStatus = 'New' | 'In review' | 'Summary drafted' | 'Gregg review' | 'CRM-ready' | 'Copied to CRM' | 'Archived';
export type TaskStatus = 'Open' | 'In Progress' | 'Waiting' | 'Completed' | 'Canceled';
export type SignalType = 'Audit' | 'Monitoring' | 'Renewal' | 'Expansion' | 'Qualifier' | 'Placement' | 'Document collection' | 'Client-save' | 'Leadership review';
export type EscalationReason = 'Refund/payment issue' | 'Pricing exception' | 'Legal-sensitive issue' | 'Compliance-sensitive issue' | 'Placement approval needed' | 'Qualifier concern' | 'High-risk complaint' | 'Possible promise/commitment risk' | 'Rose review needed' | 'Other leadership review';

export interface CurrentClient {
  id: string;
  clientName: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  clientStatus: ClientStatus;
  greggPriority: Priority;
  riskLevel: RiskLevel;
  lastMeaningfulContact: string;
  nextAction: string;
  nextOwner: string;
  coOwner: string;
  coOwnerUserId?: string | null;
  involvementState: string;
  touchCadenceDays: number;
  dueDate: string;
  openTasks: number;
  missingInformation: string;
  opportunitySignals: number;
  escalations: number;
  callNotes: number;
}

export interface CallNote {
  id: string;
  clientId: string;
  callDate: string;
  caller: string;
  callType: CallType;
  rawRingCentralNote: string;
  cleanSummary: string;
  clientConcern: string;
  commitmentsMade: string;
  missingInformation: string;
  nextActions: string;
  opportunitySignals: string;
  escalationFlags: string;
  routingStatus: CallNoteStatus;
  crmReadyNote: string;
  clientFollowUpDraft: string;
  taskList: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  clientId: string;
  sourceCallNoteId: string | null;
  title: string;
  owner: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  escalationFlag: boolean;
  notes: string;
}

export interface OpportunitySignal {
  id: string;
  clientId: string;
  sourceCallNoteId: string | null;
  type: SignalType;
  description: string;
  status: 'Open' | 'Actioned' | 'Dismissed';
  routedTo: string;
  createdAt: string;
}

export interface Escalation {
  id: string;
  clientId: string;
  sourceCallNoteId: string | null;
  reason: EscalationReason;
  riskLevel: RiskLevel;
  routedTo: string;
  decisionNeeded: string;
  deadline: string;
  status: 'Open' | 'Under Review' | 'Resolved';
}

export type Trend = 'up' | 'down' | 'flat';

export type ProcessType =
  | 'Onboarding'
  | 'Audit'
  | 'Qualifier'
  | 'Placement'
  | 'Renewal'
  | 'Document Collection'
  | 'Monitoring'
  | 'Client-save'
  | 'Expansion';

export type ProcessStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Blocked'
  | 'Waiting on Client'
  | 'Completed';

export interface ClientProcess {
  id: string;
  clientId: string;
  name: string;
  type: ProcessType;
  status: ProcessStatus;
  progress: number; // 0-100
  owner: string;
  startedAt: string;
  dueDate: string;
  blockedReason: string;
}

export type AuditStatus =
  | 'Not Started'
  | 'Scheduled'
  | 'In Progress'
  | 'Under Review'
  | 'Passed'
  | 'Remediation'
  | 'Failed';

export interface AuditScoreItem {
  category: string;
  score: number; // 0-100, higher is better
  weight: number;
  notes: string;
}

export interface ClientAudit {
  clientId: string;
  status: AuditStatus;
  auditType: string;
  auditor: string;
  lastAuditDate: string;
  nextAuditDate: string;
  overallScore: number; // 0-100
  scoresheet: AuditScoreItem[];
}

export interface RiskFactor {
  label: string;
  score: number; // 0-100 contribution, higher = riskier
  weight: number;
  trend: Trend;
}

export interface ClientRiskProfile {
  clientId: string;
  overallScore: number; // 0-100, higher = riskier
  trend: Trend;
  updatedAt: string;
  factors: RiskFactor[];
}

export type RoadmapStage = 'Identified' | 'Qualifying' | 'Proposed' | 'Negotiation' | 'Closing';

export interface ExpansionMilestone {
  id: string;
  clientId: string;
  title: string;
  stage: RoadmapStage;
  status: string;
  potentialValue: number;
  targetDate: string;
  description: string;
  owner: string;
  ownerUserId?: string | null;
  pinned: boolean;
  priorityBoost: number;
  lastMovementAt: string;
  actualValue: number;
  closedAt?: string | null;
}

export interface CrmLink {
  id: string;
  entityType: string;
  entityId: string;
  clientId?: string | null;
  crmModule: string;
  crmRecordId?: string | null;
  syncStatus: string;
  syncDirection: string;
  lastSyncedAt?: string | null;
  errorMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface CrmExportPayload {
  entityType: string;
  entityId: string;
  clientId?: string | null;
  crmModule: string;
  recordTitle: string;
  syncStatus: string;
  crmRecordId?: string | null;
  fields: Record<string, unknown>;
}

export interface RelationshipReport {
  windowDays: number;
  totalClients: number;
  touchesDue: number;
  goingCold: number;
  visitsCompleted: number;
  mealsCompleted: number;
  cadenceAdherencePct: number;
  taraSharedAccounts: number;
  byWarmth: Array<{ warmth: string; count: number }>;
  byOwner: Array<{
    owner: string;
    clients: number;
    touchesDue: number;
    goingCold: number;
  }>;
}

export interface ExpansionReport {
  openCount: number;
  wonCount: number;
  lostCount: number;
  stalledCount: number;
  pipelineValue: number;
  convertedRevenue: number;
  winRatePct: number;
  taraSharedOpenCount: number;
  taraSharedPipelineValue: number;
  taraSharedConvertedRevenue: number;
  byStage: Array<{ stage: string; count: number; value: number }>;
  byOwner: Array<{
    owner: string;
    openCount: number;
    pipelineValue: number;
    wonCount: number;
    convertedRevenue: number;
  }>;
}

export interface ActivityReport {
  windowDays: number;
  openTasks: number;
  completedTasks: number;
  overdueTasks: number;
  followUpCompletionPct: number;
  touchesLogged: number;
  handoffs: number;
}

export type CommunicationIntent =
  | 'follow_up'
  | 'check_in'
  | 'escalation_ack'
  | 'expansion_outreach'
  | 'renewal'
  | 'other';
export type CommunicationChannel = 'email' | 'text' | 'call_script';
export type CommunicationDraftStatus =
  | 'draft'
  | 'edited'
  | 'used'
  | 'discarded';
export type CommunicationDraftSource = 'ai' | 'template';

export interface CommunicationDraft {
  id: string;
  clientId: string;
  intent: string;
  channel: string;
  tone: string;
  instructions: string;
  subject: string;
  body: string;
  source: string;
  status: string;
  createdByLabel: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Partial' | 'Overdue';

export interface Invoice {
  id: string;
  clientId: string;
  invoiceNumber: string;
  amount: number;
  amountPaid: number;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
}

export type SLAStatus = 'On Track' | 'At Risk' | 'Met' | 'Missed' | 'Upcoming';

export interface SLA {
  id: string;
  clientId: string;
  name: string;
  description: string;
  dueDate: string;
  status: SLAStatus;
  owner: string;
}

export type EventType =
  | 'Check-in'
  | 'Audit'
  | 'Review'
  | 'Renewal'
  | 'Escalation'
  | 'Onboarding'
  | 'Placement';

export interface ScheduledEvent {
  id: string;
  clientId: string;
  title: string;
  type: EventType;
  date: string;
  time: string;
  attendees: string;
  withClient: boolean;
  status: string;
  owner: string;
}

export type ContactChannel = 'Call' | 'Email' | 'Meeting' | 'Text';

export interface ContactLogEntry {
  id: string;
  clientId: string;
  date: string;
  channel: ContactChannel;
  internalPerson: string;
  direction: 'Inbound' | 'Outbound';
  summary: string;
}

export type TravelStatus = 'Proposed' | 'Planned' | 'Booked' | 'Completed' | 'Cancelled';

export interface TravelPlan {
  id: string;
  clientId: string | null;
  location: string;
  reason: string;
  roiReason: string;
  status: TravelStatus;
  startDate: string;
  endDate: string;
  notes: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 'Travel' | 'Client Visit' | 'Relationship' | 'Event' | 'Other';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  clientId: string | null;
  spentOn: string;
  notes: string;
  owner: string;
  createdAt: string;
  updatedAt: string;
}

export type FeedbackType = 'risk' | 'opportunity' | 'system';
export type FeedbackStatus = 'open' | 'reviewed' | 'actioned' | 'archived';

export interface Feedback {
  id: string;
  type: FeedbackType;
  title: string;
  body: string;
  status: FeedbackStatus;
  clientId: string | null;
  submittedByLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingModule {
  id: string;
  title: string;
  category: string;
  description: string;
  tier: string;
  xp: number;
  completed: boolean;
  completedAt: string | null;
  sortOrder: number;
}

export type BonusStatus = 'eligible' | 'pending_approval' | 'approved' | 'paid';

export interface BonusEntry {
  id: string;
  category: string;
  title: string;
  clientId: string | null;
  amount: number;
  status: BonusStatus;
  periodLabel: string;
  documentation: string;
  notes: string;
  occurredOn: string | null;
  createdByLabel: string;
  createdAt: string;
  updatedAt: string;
}

export type ProfitShareStatus = 'illustrative' | 'under_discussion' | 'documented';

export interface ProfitShareProjection {
  id: string;
  periodLabel: string;
  basis: string;
  projectedAmount: number;
  status: ProfitShareStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type QualifierAvailability = 'available' | 'engaged' | 'unavailable';
export type QualifierStatus =
  | 'prospect'
  | 'intake'
  | 'verified'
  | 'active'
  | 'inactive';

export interface Qualifier {
  id: string;
  name: string;
  licenseType: string;
  state: string;
  tradeClassification: string;
  availability: QualifierAvailability;
  status: QualifierStatus;
  contact: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type PlacementStage =
  | 'interest'
  | 'fit_review'
  | 'internal_review'
  | 'placed'
  | 'renewal'
  | 'replacement';
export type PlacementStatus = 'open' | 'on_hold' | 'placed' | 'closed';

export interface Placement {
  id: string;
  clientId: string | null;
  qualifierId: string | null;
  title: string;
  licenseType: string;
  state: string;
  tradeClassification: string;
  stage: PlacementStage;
  status: PlacementStatus;
  timeline: string;
  budget: string;
  expectations: string;
  riskFlags: string;
  nextStep: string;
  missingInfo: string;
  targetDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type SuccessPlanPhase = 'first_90' | 'first_180';

export interface SuccessPlanItem {
  id: string;
  phase: SuccessPlanPhase;
  title: string;
  description: string;
  completed: boolean;
  completedAt: string | null;
  notes: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export type RoseChatMode =
  | 'brainstorm'
  | 'help_with_client'
  | 'how_to'
  | 'general';

export interface RoseChatSession {
  id: string;
  title: string;
  mode: RoseChatMode;
  clientId: string | null;
  createdByLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoseChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  source: string;
  createdAt: string;
}

export interface RoseChatSessionDetail extends RoseChatSession {
  messages: RoseChatMessage[];
}

export type EmailDraftStatus = 'draft' | 'edited' | 'used' | 'discarded';

export interface EmailDraft {
  id: string;
  purpose: string;
  audience: string;
  tone: string;
  keyPoints: string;
  subject: string;
  body: string;
  source: string;
  status: EmailDraftStatus;
  createdByLabel: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffMember {
  name: string;
  title: string;
  focusArea: string;
  weeklyCapacityHours: number;
  active: boolean;
  clientsOwned: number;
  openTasks: number;
  overdueTasks: number;
  completedTasks: number;
  openEscalations: number;
  touchesDue: number;
  stalledExpansions: number;
  recentActivity: number;
  productivityScore: number;
  stuckScore: number;
  burnoutScore: number;
  status: string;
  signals: string[];
}

export interface StaffOverview {
  windowDays: number;
  generatedAt: string;
  staff: StaffMember[];
}

export interface StaffProfile {
  id: string;
  name: string;
  title: string;
  focusArea: string;
  weeklyCapacityHours: number;
  active: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type RequestType =
  | 'purchase'
  | 'travel'
  | 'help'
  | 'equipment'
  | 'other';
export type RequestStatus =
  | 'submitted'
  | 'in_review'
  | 'approved'
  | 'denied'
  | 'fulfilled'
  | 'cancelled';

export interface RequestItem {
  id: string;
  type: RequestType;
  title: string;
  description: string;
  status: RequestStatus;
  priority: string;
  amount: number | null;
  clientId: string | null;
  neededBy: string;
  requestedByLabel: string;
  assignedToLabel: string;
  resolutionNotes: string;
  createdAt: string;
  updatedAt: string;
}
