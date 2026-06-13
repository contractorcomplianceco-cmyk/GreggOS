import type {
  Client as DbClient,
  CallNote as DbCallNote,
  Task as DbTask,
  OpportunitySignal as DbSignal,
  Escalation as DbEscalation,
  ClientProcess as DbProcess,
  ClientRiskProfile as DbRiskProfile,
  ClientAudit as DbAudit,
  AuditLink as DbAuditLink,
  ExpansionMilestone as DbExpansion,
  Invoice as DbInvoice,
  SLA as DbSla,
  ScheduledEvent as DbEvent,
  ContactLogEntry as DbContactLog,
  ActivityLogEntry as DbActivity,
  CrmLink as DbCrmLink,
  CommunicationDraft as DbCommunicationDraft,
  TravelPlan as DbTravelPlan,
  Expense as DbExpense,
  Feedback as DbFeedback,
  TrainingModule as DbTrainingModule,
} from "@workspace/db";
import type {
  Client,
  CallNote,
  Task,
  OpportunitySignal,
  Escalation,
  ClientProcess,
  ClientRiskProfile,
  ClientAudit,
  AuditLink,
  ExpansionMilestone,
  Invoice,
  Sla,
  ScheduledEvent,
  ContactLogEntry,
  ActivityLogEntry,
  CrmLink,
  CommunicationDraft,
  TravelPlan,
  Expense,
  Feedback,
  TrainingModule,
} from "@workspace/api-zod";

const s = (v: string | null | undefined): string => v ?? "";
const iso = (v: Date | null | undefined): string =>
  v ? v.toISOString() : "";

export interface ClientCounters {
  openTasks: number;
  opportunitySignals: number;
  escalations: number;
  callNotes: number;
}

export const emptyCounters: ClientCounters = {
  openTasks: 0,
  opportunitySignals: 0,
  escalations: 0,
  callNotes: 0,
};

export function toClient(row: DbClient, counters: ClientCounters): Client {
  return {
    id: row.id,
    clientName: row.clientName,
    companyName: row.companyName,
    contactName: row.contactName,
    phone: row.phone,
    email: row.email,
    clientStatus: row.clientStatus,
    greggPriority: row.greggPriority,
    riskLevel: row.riskLevel,
    lastMeaningfulContact: s(row.lastMeaningfulContact),
    nextAction: row.nextAction,
    nextOwner: row.nextOwnerLabel,
    nextOwnerUserId: row.nextOwnerUserId ?? null,
    coOwner: row.coOwnerLabel,
    coOwnerUserId: row.coOwnerUserId ?? null,
    involvementState: row.involvementState,
    touchCadenceDays: row.touchCadenceDays,
    dueDate: s(row.dueDate),
    missingInformation: row.missingInformation,
    openTasks: counters.openTasks,
    opportunitySignals: counters.opportunitySignals,
    escalations: counters.escalations,
    callNotes: counters.callNotes,
  };
}

export function toCallNote(row: DbCallNote): CallNote {
  return {
    id: row.id,
    clientId: row.clientId,
    callDate: row.callDate,
    caller: row.caller,
    callType: row.callType,
    rawRingCentralNote: row.rawRingCentralNote,
    cleanSummary: row.cleanSummary,
    clientConcern: row.clientConcern,
    commitmentsMade: row.commitmentsMade,
    missingInformation: row.missingInformation,
    nextActions: row.nextActions,
    opportunitySignals: row.opportunitySignals,
    escalationFlags: row.escalationFlags,
    routingStatus: row.routingStatus,
    crmReadyNote: row.crmReadyNote,
    clientFollowUpDraft: row.clientFollowUpDraft,
    taskList: row.taskList,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toTask(row: DbTask): Task {
  return {
    id: row.id,
    clientId: row.clientId,
    sourceCallNoteId: row.sourceCallNoteId ?? null,
    title: row.title,
    owner: row.ownerLabel,
    dueDate: s(row.dueDate),
    priority: row.priority,
    status: row.status,
    escalationFlag: row.escalationFlag,
    notes: row.notes,
  };
}

export function toSignal(row: DbSignal): OpportunitySignal {
  return {
    id: row.id,
    clientId: row.clientId,
    sourceCallNoteId: row.sourceCallNoteId ?? null,
    type: row.type,
    description: row.description,
    status: row.status,
    routedTo: row.routedToLabel,
    createdAt: iso(row.createdAt),
  };
}

export function toEscalation(row: DbEscalation): Escalation {
  return {
    id: row.id,
    clientId: row.clientId,
    sourceCallNoteId: row.sourceCallNoteId ?? null,
    reason: row.reason,
    riskLevel: row.riskLevel,
    routedTo: row.routedToLabel,
    decisionNeeded: row.decisionNeeded,
    deadline: s(row.deadline),
    status: row.status,
  };
}

export function toProcess(row: DbProcess): ClientProcess {
  return {
    id: row.id,
    clientId: row.clientId,
    name: row.name,
    type: row.type,
    status: row.status,
    progress: row.progress,
    owner: row.ownerLabel,
    startedAt: s(row.startedAt),
    dueDate: s(row.dueDate),
    blockedReason: row.blockedReason,
  };
}

export function toRiskProfile(row: DbRiskProfile): ClientRiskProfile {
  return {
    clientId: row.clientId,
    overallScore: row.overallScore,
    trend: row.trend,
    updatedAt: iso(row.updatedAt),
    factors: row.factors,
  };
}

export function toAudit(row: DbAudit): ClientAudit {
  return {
    clientId: row.clientId,
    status: row.status,
    auditType: row.auditType,
    auditor: row.auditor,
    lastAuditDate: s(row.lastAuditDate),
    nextAuditDate: s(row.nextAuditDate),
    overallScore: row.overallScore,
    scoresheet: row.scoresheet,
  };
}

export function toAuditLink(row: DbAuditLink): AuditLink {
  return {
    clientId: row.clientId,
    portalAuditId: row.portalAuditId ?? null,
    portalClientName: row.portalClientName,
    matchMethod: row.matchMethod,
    confirmedAt: iso(row.confirmedAt),
  };
}

export function toExpansion(row: DbExpansion): ExpansionMilestone {
  return {
    id: row.id,
    clientId: row.clientId,
    title: row.title,
    stage: row.stage,
    status: row.status,
    potentialValue: row.potentialValue,
    targetDate: s(row.targetDate),
    description: row.description,
    owner: row.ownerLabel,
    ownerUserId: row.ownerUserId ?? null,
    pinned: row.pinned,
    priorityBoost: row.priorityBoost,
    lastMovementAt: iso(row.lastMovementAt),
    actualValue: row.actualValue,
    closedAt: row.closedAt ? row.closedAt.toISOString() : null,
  };
}

export function toCrmLink(row: DbCrmLink): CrmLink {
  return {
    id: row.id,
    entityType: row.entityType,
    entityId: row.entityId,
    clientId: row.clientId ?? null,
    crmModule: row.crmModule,
    crmRecordId: row.crmRecordId ?? null,
    syncStatus: row.syncStatus,
    syncDirection: row.syncDirection,
    lastSyncedAt: row.lastSyncedAt ? row.lastSyncedAt.toISOString() : null,
    errorMessage: row.errorMessage,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toInvoice(row: DbInvoice): Invoice {
  return {
    id: row.id,
    clientId: row.clientId,
    invoiceNumber: row.invoiceNumber,
    amount: row.amount,
    amountPaid: row.amountPaid,
    issueDate: s(row.issueDate),
    dueDate: s(row.dueDate),
    status: row.status,
  };
}

export function toSla(row: DbSla): Sla {
  return {
    id: row.id,
    clientId: row.clientId,
    name: row.name,
    description: row.description,
    dueDate: s(row.dueDate),
    status: row.status,
    owner: row.ownerLabel,
  };
}

export function toEvent(row: DbEvent): ScheduledEvent {
  return {
    id: row.id,
    clientId: row.clientId,
    title: row.title,
    type: row.type,
    date: s(row.date),
    time: s(row.time),
    attendees: row.attendees,
    withClient: row.withClient,
    status: row.status,
    owner: row.ownerLabel,
  };
}

export function toContactLog(row: DbContactLog): ContactLogEntry {
  return {
    id: row.id,
    clientId: row.clientId,
    date: s(row.date),
    channel: row.channel,
    internalPerson: row.internalPerson,
    direction: row.direction,
    summary: row.summary,
  };
}

export function toCommunicationDraft(
  row: DbCommunicationDraft,
): CommunicationDraft {
  return {
    id: row.id,
    clientId: row.clientId,
    intent: row.intent,
    channel: row.channel,
    tone: row.tone,
    instructions: row.instructions,
    subject: row.subject,
    body: row.body,
    source: row.source,
    status: row.status,
    createdByLabel: row.createdByLabel,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toTravelPlan(row: DbTravelPlan): TravelPlan {
  return {
    id: row.id,
    clientId: row.clientId ?? null,
    location: row.location,
    reason: row.reason,
    roiReason: row.roiReason,
    status: row.status,
    startDate: s(row.startDate),
    endDate: s(row.endDate),
    notes: row.notes,
    owner: row.ownerLabel,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toExpense(row: DbExpense): Expense {
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    amount: row.amountCents / 100,
    clientId: row.clientId ?? null,
    spentOn: s(row.spentOn),
    notes: row.notes,
    owner: row.ownerLabel,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toFeedback(row: DbFeedback): Feedback {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    status: row.status,
    clientId: row.clientId ?? null,
    submittedByLabel: row.submittedByLabel,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export function toTrainingModule(row: DbTrainingModule): TrainingModule {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    tier: row.tier,
    xp: row.xp,
    completed: row.completed,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    sortOrder: row.sortOrder,
  };
}

export function toActivity(row: DbActivity): ActivityLogEntry {
  return {
    id: row.id,
    actorLabel: row.actorLabel,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId ?? null,
    clientId: row.clientId ?? null,
    summary: row.summary,
    createdAt: iso(row.createdAt),
  };
}
