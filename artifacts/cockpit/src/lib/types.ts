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
