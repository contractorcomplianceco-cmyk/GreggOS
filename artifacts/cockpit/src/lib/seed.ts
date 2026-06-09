import {
  CurrentClient,
  CallNote,
  Task,
  OpportunitySignal,
  Escalation,
  ClientProcess,
  ClientAudit,
  ClientRiskProfile,
  ExpansionMilestone,
  Invoice,
  SLA,
  ScheduledEvent,
  ContactLogEntry,
} from './types';

const _now = new Date();
function iso(offsetDays: number): string {
  const d = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() + offsetDays);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export const seedClients: CurrentClient[] = [
  {
    id: 'c1',
    clientName: 'Acme Contracting',
    companyName: 'Acme Contracting LLC',
    contactName: 'John Doe',
    phone: '555-0101',
    email: 'john@acme.com',
    clientStatus: 'Active',
    greggPriority: 'High',
    riskLevel: 'Low',
    lastMeaningfulContact: iso(-2),
    nextAction: 'Review compliance docs',
    nextOwner: 'Gregg',
    dueDate: iso(5),
    openTasks: 2,
    missingInformation: 'None',
    opportunitySignals: 0,
    escalations: 0,
    callNotes: 1
  },
  {
    id: 'c2',
    clientName: 'BuildCorp',
    companyName: 'BuildCorp Inc',
    contactName: 'Jane Smith',
    phone: '555-0102',
    email: 'jane@buildcorp.com',
    clientStatus: 'At Risk',
    greggPriority: 'Urgent',
    riskLevel: 'High',
    lastMeaningfulContact: iso(-1),
    nextAction: 'Address pricing exception',
    nextOwner: 'Gregg',
    dueDate: iso(2),
    openTasks: 1,
    missingInformation: 'Pricing history',
    opportunitySignals: 1,
    escalations: 1,
    callNotes: 2
  },
  {
    id: 'c3',
    clientName: 'CityBuilders',
    companyName: 'CityBuilders Group',
    contactName: 'Bob Johnson',
    phone: '555-0103',
    email: 'bob@citybuilders.com',
    clientStatus: 'Renewal Pending',
    greggPriority: 'Medium',
    riskLevel: 'Medium',
    lastMeaningfulContact: iso(-4),
    nextAction: 'Send renewal agreement',
    nextOwner: 'Landon',
    dueDate: iso(6),
    openTasks: 3,
    missingInformation: 'None',
    opportunitySignals: 0,
    escalations: 0,
    callNotes: 1
  },
  {
    id: 'c4',
    clientName: 'Delta Construction',
    companyName: 'Delta Construction Ltd',
    contactName: 'Alice Williams',
    phone: '555-0104',
    email: 'alice@deltaconstruction.com',
    clientStatus: 'Active',
    greggPriority: 'Low',
    riskLevel: 'Low',
    lastMeaningfulContact: iso(-11),
    nextAction: 'Check in on qualifier status',
    nextOwner: 'Landon',
    dueDate: iso(9),
    openTasks: 0,
    missingInformation: 'Qualifier ID',
    opportunitySignals: 1,
    escalations: 0,
    callNotes: 1
  },
  {
    id: 'c5',
    clientName: 'Echo Builders',
    companyName: 'Echo Builders LLC',
    contactName: 'Charlie Brown',
    phone: '555-0105',
    email: 'charlie@echobuilders.com',
    clientStatus: 'Active',
    greggPriority: 'Medium',
    riskLevel: 'Low',
    lastMeaningfulContact: iso(-16),
    nextAction: 'Schedule monitoring call',
    nextOwner: 'Landon',
    dueDate: iso(12),
    openTasks: 1,
    missingInformation: 'None',
    opportunitySignals: 1,
    escalations: 0,
    callNotes: 1
  },
  {
    id: 'c6',
    clientName: 'Foxtrot Developments',
    companyName: 'Foxtrot Developments Inc',
    contactName: 'David Lee',
    phone: '555-0106',
    email: 'david@foxtrot.com',
    clientStatus: 'Onboarding',
    greggPriority: 'High',
    riskLevel: 'Low',
    lastMeaningfulContact: iso(-1),
    nextAction: 'Complete onboarding',
    nextOwner: 'Gregg',
    dueDate: iso(3),
    openTasks: 2,
    missingInformation: 'Company docs',
    opportunitySignals: 0,
    escalations: 0,
    callNotes: 2
  }
];

const noteDates = {
  n1: { call: iso(-2), due: iso(5) },
  n2: { call: iso(-1), due: iso(2) },
  n3: { call: iso(-4), due: iso(6) },
  n4: { call: iso(-11), due: iso(9) },
  n5: { call: iso(-16), due: iso(12) },
  n6: { call: iso(-1), due: iso(3) },
  n7: { call: iso(-7), due: iso(-3) },
  n8: { call: iso(-12), due: iso(-6) },
};

export const seedNotes: CallNote[] = [
  {
    id: 'n1',
    clientId: 'c1',
    callDate: noteDates.n1.call,
    caller: 'John Doe',
    callType: 'Inbound',
    rawRingCentralNote: 'John called to ask about the compliance docs. He said he will send them by tomorrow. Also mentioned he might need help with a new project next month.',
    cleanSummary: 'Discussed compliance documentation status and potential new project expansion.',
    clientConcern: 'None',
    commitmentsMade: 'John to send compliance docs by tomorrow.',
    missingInformation: 'Compliance docs',
    nextActions: 'Review compliance docs once received.',
    opportunitySignals: 'Expansion',
    escalationFlags: 'None',
    routingStatus: 'CRM-ready',
    crmReadyNote: `Call with John Doe on ${noteDates.n1.call}. Discussed compliance documentation status and potential new project expansion. Client concern/request: None. Missing information: Compliance docs. Next steps: Review compliance docs once received. Owner: Gregg. Due date: ${noteDates.n1.due}. Opportunity signals: Expansion. Escalation: None.`,
    clientFollowUpDraft: `Hi John Doe, thank you for speaking with Gregg today. Based on the conversation, our next step is Review compliance docs once received. We are currently waiting on Compliance docs. We will follow up by ${noteDates.n1.due}.`,
    taskList: `Task: Review compliance docs | Owner: Gregg | Due: ${noteDates.n1.due} | Priority: High`,
    createdAt: `${noteDates.n1.call}T10:00:00Z`,
    updatedAt: `${noteDates.n1.call}T10:30:00Z`
  },
  {
    id: 'n2',
    clientId: 'c2',
    callDate: noteDates.n2.call,
    caller: 'Jane Smith',
    callType: 'Escalation',
    rawRingCentralNote: 'Jane was very upset about the pricing exception we discussed last week. She says she will cancel if we don\'t honor the original quote.',
    cleanSummary: 'Client escalated regarding pricing exception and threatened cancellation.',
    clientConcern: 'Pricing exception not honored.',
    commitmentsMade: 'Gregg will review and provide a final decision by end of week.',
    missingInformation: 'Pricing history',
    nextActions: 'Review pricing exception and contact client.',
    opportunitySignals: 'Client-save',
    escalationFlags: 'Pricing exception',
    routingStatus: 'Gregg review',
    crmReadyNote: `Call with Jane Smith on ${noteDates.n2.call}. Discussed client escalated regarding pricing exception and threatened cancellation. Client concern/request: Pricing exception not honored. Missing information: Pricing history. Next steps: Review pricing exception and contact client. Owner: Gregg. Due date: ${noteDates.n2.due}. Opportunity signals: Client-save. Escalation: Pricing exception.`,
    clientFollowUpDraft: `Hi Jane Smith, thank you for speaking with Gregg today. Based on the conversation, our next step is Review pricing exception and contact client. We are currently waiting on Pricing history. We will follow up by ${noteDates.n2.due}.`,
    taskList: `Task: Address pricing exception | Owner: Gregg | Due: ${noteDates.n2.due} | Priority: Urgent`,
    createdAt: `${noteDates.n2.call}T14:00:00Z`,
    updatedAt: `${noteDates.n2.call}T14:45:00Z`
  },
  {
    id: 'n3',
    clientId: 'c3',
    callDate: noteDates.n3.call,
    caller: 'Bob Johnson',
    callType: 'Renewal',
    rawRingCentralNote: 'Bob wants to renew but asked if we can add monitoring to the package. Needs the renewal agreement sent over for signature.',
    cleanSummary: 'Client confirmed renewal intent and asked about adding monitoring services.',
    clientConcern: 'Wants monitoring added to renewal.',
    commitmentsMade: 'Landon to send renewal agreement.',
    missingInformation: 'None',
    nextActions: 'Send renewal agreement\nPrepare monitoring add-on quote',
    opportunitySignals: 'Expansion - monitoring add-on',
    escalationFlags: 'None',
    routingStatus: 'Summary drafted',
    crmReadyNote: `Call with Bob Johnson on ${noteDates.n3.call}. Discussed client confirmed renewal intent and asked about adding monitoring services. Client concern/request: Wants monitoring added to renewal. Missing information: None. Next steps: Send renewal agreement; Prepare monitoring add-on quote. Owner: Landon. Due date: ${noteDates.n3.due}. Opportunity signals: Expansion - monitoring add-on. Escalation: None.`,
    clientFollowUpDraft: `Hi Bob Johnson, thank you for speaking with Gregg today. Based on the conversation, our next step is Send renewal agreement. We are currently waiting on nothing at this time. We will follow up by ${noteDates.n3.due}.`,
    taskList: `Task: Send renewal agreement | Owner: Landon | Due: ${noteDates.n3.due} | Priority: Medium\nTask: Prepare monitoring add-on quote | Owner: Landon | Due: ${noteDates.n3.due} | Priority: Medium`,
    createdAt: `${noteDates.n3.call}T09:00:00Z`,
    updatedAt: `${noteDates.n3.call}T09:20:00Z`
  },
  {
    id: 'n4',
    clientId: 'c4',
    callDate: noteDates.n4.call,
    caller: 'Alice Williams',
    callType: 'Qualifier Discussion',
    rawRingCentralNote: 'Alice asked about qualifier requirements for a new state license. Could not confirm her current qualifier ID on file. Said she may want to add a second qualifier later.',
    cleanSummary: 'Discussed qualifier requirements for a new state license expansion.',
    clientConcern: 'Unsure of qualifier requirements for new state.',
    commitmentsMade: 'Landon to confirm qualifier ID and requirements.',
    missingInformation: 'Qualifier ID',
    nextActions: 'Confirm qualifier ID on file\nResearch new state qualifier requirements',
    opportunitySignals: 'Qualifier - potential second qualifier',
    escalationFlags: 'None',
    routingStatus: 'In review',
    crmReadyNote: `Call with Alice Williams on ${noteDates.n4.call}. Discussed qualifier requirements for a new state license expansion. Client concern/request: Unsure of qualifier requirements for new state. Missing information: Qualifier ID. Next steps: Confirm qualifier ID on file; Research new state qualifier requirements. Owner: Landon. Due date: ${noteDates.n4.due}. Opportunity signals: Qualifier - potential second qualifier. Escalation: None.`,
    clientFollowUpDraft: `Hi Alice Williams, thank you for speaking with Gregg today. Based on the conversation, our next step is Confirm qualifier ID on file. We are currently waiting on Qualifier ID. We will follow up by ${noteDates.n4.due}.`,
    taskList: `Task: Confirm qualifier ID on file | Owner: Landon | Due: ${noteDates.n4.due} | Priority: Medium\nTask: Research new state qualifier requirements | Owner: Landon | Due: ${noteDates.n4.due} | Priority: Medium`,
    createdAt: `${noteDates.n4.call}T11:00:00Z`,
    updatedAt: `${noteDates.n4.call}T11:25:00Z`
  },
  {
    id: 'n5',
    clientId: 'c5',
    callDate: noteDates.n5.call,
    caller: 'Charlie Brown',
    callType: 'Monitoring',
    rawRingCentralNote: 'Routine monitoring check-in. Everything looks fine. Charlie mentioned a colleague at another company might be interested in our services.',
    cleanSummary: 'Routine monitoring check-in with a potential referral lead.',
    clientConcern: 'None',
    commitmentsMade: 'Landon to schedule next monitoring call.',
    missingInformation: 'None',
    nextActions: 'Schedule next monitoring call',
    opportunitySignals: 'Placement - referral lead at another company',
    escalationFlags: 'None',
    routingStatus: 'CRM-ready',
    crmReadyNote: `Call with Charlie Brown on ${noteDates.n5.call}. Discussed routine monitoring check-in with a potential referral lead. Client concern/request: None. Missing information: None. Next steps: Schedule next monitoring call. Owner: Landon. Due date: ${noteDates.n5.due}. Opportunity signals: Placement - referral lead at another company. Escalation: None.`,
    clientFollowUpDraft: `Hi Charlie Brown, thank you for speaking with Gregg today. Based on the conversation, our next step is Schedule next monitoring call. We are currently waiting on nothing at this time. We will follow up by ${noteDates.n5.due}.`,
    taskList: `Task: Schedule next monitoring call | Owner: Landon | Due: ${noteDates.n5.due} | Priority: Low`,
    createdAt: `${noteDates.n5.call}T13:00:00Z`,
    updatedAt: `${noteDates.n5.call}T13:15:00Z`
  },
  {
    id: 'n6',
    clientId: 'c6',
    callDate: noteDates.n6.call,
    caller: 'David Lee',
    callType: 'Scheduled Check-in',
    rawRingCentralNote: 'Onboarding call. David still needs to send company formation docs and insurance certificate. Asked a question about legal liability that we should not answer directly.',
    cleanSummary: 'Onboarding check-in; outstanding documents and a legal-sensitive question raised.',
    clientConcern: 'Asked about legal liability exposure (decision boundary).',
    commitmentsMade: 'Gregg to follow up after collecting onboarding docs.',
    missingInformation: 'Company formation docs, insurance certificate',
    nextActions: 'Collect company formation docs\nRoute legal-liability question to leadership',
    opportunitySignals: 'None',
    escalationFlags: 'Legal-sensitive question raised - route to leadership review',
    routingStatus: 'Gregg review',
    crmReadyNote: `Call with David Lee on ${noteDates.n6.call}. Discussed onboarding check-in; outstanding documents and a legal-sensitive question raised. Client concern/request: Asked about legal liability exposure (decision boundary). Missing information: Company formation docs, insurance certificate. Next steps: Collect company formation docs; Route legal-liability question to leadership. Owner: Gregg. Due date: ${noteDates.n6.due}. Opportunity signals: None. Escalation: Legal-sensitive question raised - route to leadership review.`,
    clientFollowUpDraft: `Hi David Lee, thank you for speaking with Gregg today. Based on the conversation, our next step is Collect company formation docs. We are currently waiting on Company formation docs, insurance certificate. We will follow up by ${noteDates.n6.due}.`,
    taskList: `Task: Collect company formation docs | Owner: Gregg | Due: ${noteDates.n6.due} | Priority: High\nTask: Route legal-liability question to leadership | Owner: Gregg | Due: ${noteDates.n6.due} | Priority: High`,
    createdAt: `${noteDates.n6.call}T15:00:00Z`,
    updatedAt: `${noteDates.n6.call}T15:30:00Z`
  },
  {
    id: 'n7',
    clientId: 'c2',
    callDate: noteDates.n7.call,
    caller: 'Jane Smith',
    callType: 'Inbound',
    rawRingCentralNote: 'Jane called about a refund request for a duplicate charge. Wants money back this week. Did not have the invoice number handy.',
    cleanSummary: 'Client requested a refund for a reported duplicate charge.',
    clientConcern: 'Refund for duplicate charge.',
    commitmentsMade: 'Gregg to review billing and respond.',
    missingInformation: 'Invoice number',
    nextActions: 'Review billing records for duplicate charge',
    opportunitySignals: 'None',
    escalationFlags: 'Refund request - requires leadership approval',
    routingStatus: 'New',
    crmReadyNote: `Call with Jane Smith on ${noteDates.n7.call}. Discussed client requested a refund for a reported duplicate charge. Client concern/request: Refund for duplicate charge. Missing information: Invoice number. Next steps: Review billing records for duplicate charge. Owner: Gregg. Due date: ${noteDates.n7.due}. Opportunity signals: None. Escalation: Refund request - requires leadership approval.`,
    clientFollowUpDraft: `Hi Jane Smith, thank you for speaking with Gregg today. Based on the conversation, our next step is Review billing records for duplicate charge. We are currently waiting on Invoice number. We will follow up by ${noteDates.n7.due}.`,
    taskList: `Task: Review billing records for duplicate charge | Owner: Gregg | Due: ${noteDates.n7.due} | Priority: High`,
    createdAt: `${noteDates.n7.call}T10:00:00Z`,
    updatedAt: `${noteDates.n7.call}T10:20:00Z`
  },
  {
    id: 'n8',
    clientId: 'c6',
    callDate: noteDates.n8.call,
    caller: 'David Lee',
    callType: 'Placement Discussion',
    rawRingCentralNote: 'David wants to place a new qualifier for an upcoming bid. Needs approval on the placement and asked when it can be finalized.',
    cleanSummary: 'Client requested a qualifier placement for an upcoming bid.',
    clientConcern: 'Timeline for placement approval.',
    commitmentsMade: 'Gregg to review placement and confirm timeline.',
    missingInformation: 'Bid deadline',
    nextActions: 'Review placement request\nConfirm placement timeline with client',
    opportunitySignals: 'Placement - new qualifier placement',
    escalationFlags: 'Placement approval needed',
    routingStatus: 'New',
    crmReadyNote: `Call with David Lee on ${noteDates.n8.call}. Discussed client requested a qualifier placement for an upcoming bid. Client concern/request: Timeline for placement approval. Missing information: Bid deadline. Next steps: Review placement request; Confirm placement timeline with client. Owner: Gregg. Due date: ${noteDates.n8.due}. Opportunity signals: Placement - new qualifier placement. Escalation: Placement approval needed.`,
    clientFollowUpDraft: `Hi David Lee, thank you for speaking with Gregg today. Based on the conversation, our next step is Review placement request. We are currently waiting on Bid deadline. We will follow up by ${noteDates.n8.due}.`,
    taskList: `Task: Review placement request | Owner: Gregg | Due: ${noteDates.n8.due} | Priority: High\nTask: Confirm placement timeline with client | Owner: Gregg | Due: ${noteDates.n8.due} | Priority: High`,
    createdAt: `${noteDates.n8.call}T16:00:00Z`,
    updatedAt: `${noteDates.n8.call}T16:25:00Z`
  }
];

export const seedTasks: Task[] = [
  {
    id: 't1',
    clientId: 'c1',
    sourceCallNoteId: 'n1',
    title: 'Review compliance docs',
    owner: 'Gregg',
    dueDate: iso(5),
    priority: 'High',
    status: 'Open',
    escalationFlag: false,
    notes: 'Review the docs John is sending.'
  },
  {
    id: 't2',
    clientId: 'c2',
    sourceCallNoteId: 'n2',
    title: 'Address pricing exception',
    owner: 'Gregg',
    dueDate: iso(2),
    priority: 'Urgent',
    status: 'Open',
    escalationFlag: true,
    notes: 'Client threatened cancellation.'
  }
];

export const seedSignals: OpportunitySignal[] = [
  {
    id: 's1',
    clientId: 'c1',
    sourceCallNoteId: 'n1',
    type: 'Expansion',
    description: 'Potential new project next month.',
    status: 'Open',
    routedTo: 'Gregg',
    createdAt: `${noteDates.n1.call}T10:30:00Z`
  },
  {
    id: 's2',
    clientId: 'c2',
    sourceCallNoteId: 'n2',
    type: 'Client-save',
    description: 'Client escalated pricing exception.',
    status: 'Open',
    routedTo: 'Gregg',
    createdAt: `${noteDates.n2.call}T14:45:00Z`
  }
];

export const seedEscalations: Escalation[] = [
  {
    id: 'e1',
    clientId: 'c2',
    sourceCallNoteId: 'n2',
    reason: 'Pricing exception',
    riskLevel: 'High',
    routedTo: 'Gregg',
    decisionNeeded: 'Approve or deny pricing exception.',
    deadline: iso(2),
    status: 'Open'
  }
];

export const seedProcesses: ClientProcess[] = [
  { id: 'p1', clientId: 'c1', name: 'Annual compliance documentation refresh', type: 'Document Collection', status: 'In Progress', progress: 65, owner: 'Gregg', startedAt: iso(-18), dueDate: iso(7), blockedReason: '' },
  { id: 'p2', clientId: 'c1', name: 'Q3 compliance audit', type: 'Audit', status: 'Completed', progress: 100, owner: 'Landon', startedAt: iso(-60), dueDate: iso(-12), blockedReason: '' },
  { id: 'p3', clientId: 'c1', name: 'New-project expansion scoping', type: 'Expansion', status: 'In Progress', progress: 30, owner: 'Gregg', startedAt: iso(-6), dueDate: iso(21), blockedReason: '' },

  { id: 'p4', clientId: 'c2', name: 'Pricing exception resolution', type: 'Client-save', status: 'Blocked', progress: 40, owner: 'Gregg', startedAt: iso(-10), dueDate: iso(2), blockedReason: 'Awaiting leadership decision on pricing.' },
  { id: 'p5', clientId: 'c2', name: 'Duplicate-charge refund review', type: 'Client-save', status: 'Waiting on Client', progress: 20, owner: 'Gregg', startedAt: iso(-26), dueDate: iso(-4), blockedReason: 'Client has not provided invoice number.' },
  { id: 'p6', clientId: 'c2', name: 'Compliance monitoring', type: 'Monitoring', status: 'In Progress', progress: 55, owner: 'Landon', startedAt: iso(-40), dueDate: iso(14), blockedReason: '' },

  { id: 'p7', clientId: 'c3', name: 'Renewal agreement processing', type: 'Renewal', status: 'In Progress', progress: 70, owner: 'Landon', startedAt: iso(-9), dueDate: iso(6), blockedReason: '' },
  { id: 'p8', clientId: 'c3', name: 'Monitoring add-on setup', type: 'Expansion', status: 'Not Started', progress: 0, owner: 'Landon', startedAt: iso(0), dueDate: iso(18), blockedReason: '' },

  { id: 'p9', clientId: 'c4', name: 'Qualifier verification', type: 'Qualifier', status: 'Waiting on Client', progress: 35, owner: 'Landon', startedAt: iso(-14), dueDate: iso(9), blockedReason: 'Qualifier ID not yet provided.' },

  { id: 'p10', clientId: 'c5', name: 'Routine monitoring cycle', type: 'Monitoring', status: 'In Progress', progress: 50, owner: 'Landon', startedAt: iso(-30), dueDate: iso(25), blockedReason: '' },

  { id: 'p11', clientId: 'c6', name: 'New client onboarding', type: 'Onboarding', status: 'In Progress', progress: 45, owner: 'Gregg', startedAt: iso(-7), dueDate: iso(7), blockedReason: '' },
  { id: 'p12', clientId: 'c6', name: 'Qualifier placement for upcoming bid', type: 'Placement', status: 'Blocked', progress: 25, owner: 'Gregg', startedAt: iso(-20), dueDate: iso(-2), blockedReason: 'Placement approval pending leadership review.' },
];

export const seedAudits: ClientAudit[] = [
  {
    clientId: 'c1', status: 'Passed', auditType: 'Annual Compliance Audit', auditor: 'Landon', lastAuditDate: iso(-12), nextAuditDate: iso(180), overallScore: 92,
    scoresheet: [
      { category: 'Licensing & Registration', score: 96, weight: 25, notes: 'All licenses current.' },
      { category: 'Document Completeness', score: 88, weight: 20, notes: 'Two minor items pending refresh.' },
      { category: 'Qualifier Standing', score: 94, weight: 20, notes: 'Qualifier in good standing.' },
      { category: 'Insurance & Bonding', score: 90, weight: 20, notes: 'Certificates on file.' },
      { category: 'Reporting Timeliness', score: 90, weight: 15, notes: 'Filed on time.' },
    ],
  },
  {
    clientId: 'c2', status: 'Remediation', auditType: 'Compliance Review', auditor: 'Landon', lastAuditDate: iso(-22), nextAuditDate: iso(15), overallScore: 58,
    scoresheet: [
      { category: 'Licensing & Registration', score: 70, weight: 25, notes: 'One license expiring soon.' },
      { category: 'Document Completeness', score: 45, weight: 20, notes: 'Pricing history missing.' },
      { category: 'Qualifier Standing', score: 65, weight: 20, notes: 'Verification pending.' },
      { category: 'Insurance & Bonding', score: 55, weight: 20, notes: 'Certificate needs update.' },
      { category: 'Reporting Timeliness', score: 50, weight: 15, notes: 'Late filings noted.' },
    ],
  },
  {
    clientId: 'c3', status: 'Under Review', auditType: 'Renewal Audit', auditor: 'Landon', lastAuditDate: iso(-30), nextAuditDate: iso(6), overallScore: 79,
    scoresheet: [
      { category: 'Licensing & Registration', score: 85, weight: 25, notes: 'Current.' },
      { category: 'Document Completeness', score: 78, weight: 20, notes: 'Renewal docs in progress.' },
      { category: 'Qualifier Standing', score: 80, weight: 20, notes: 'Good standing.' },
      { category: 'Insurance & Bonding', score: 75, weight: 20, notes: 'On file.' },
      { category: 'Reporting Timeliness', score: 74, weight: 15, notes: 'Acceptable.' },
    ],
  },
  {
    clientId: 'c4', status: 'Scheduled', auditType: 'Qualifier Audit', auditor: 'Landon', lastAuditDate: iso(-120), nextAuditDate: iso(20), overallScore: 84,
    scoresheet: [
      { category: 'Licensing & Registration', score: 88, weight: 30, notes: 'Current.' },
      { category: 'Qualifier Standing', score: 80, weight: 40, notes: 'Awaiting qualifier ID confirmation.' },
      { category: 'Insurance & Bonding', score: 85, weight: 30, notes: 'On file.' },
    ],
  },
  {
    clientId: 'c5', status: 'Passed', auditType: 'Monitoring Audit', auditor: 'Landon', lastAuditDate: iso(-35), nextAuditDate: iso(150), overallScore: 89,
    scoresheet: [
      { category: 'Licensing & Registration', score: 92, weight: 30, notes: 'Current.' },
      { category: 'Document Completeness', score: 86, weight: 35, notes: 'Complete.' },
      { category: 'Reporting Timeliness', score: 89, weight: 35, notes: 'On time.' },
    ],
  },
  {
    clientId: 'c6', status: 'Not Started', auditType: 'Onboarding Baseline Audit', auditor: 'Gregg', lastAuditDate: '', nextAuditDate: iso(12), overallScore: 0,
    scoresheet: [
      { category: 'Licensing & Registration', score: 0, weight: 34, notes: 'Pending onboarding docs.' },
      { category: 'Document Completeness', score: 0, weight: 33, notes: 'Formation docs outstanding.' },
      { category: 'Insurance & Bonding', score: 0, weight: 33, notes: 'Certificate outstanding.' },
    ],
  },
];

export const seedRiskProfiles: ClientRiskProfile[] = [
  {
    clientId: 'c1', overallScore: 22, trend: 'down', updatedAt: iso(-1),
    factors: [
      { label: 'Payment / AR health', score: 12, weight: 25, trend: 'flat' },
      { label: 'Compliance standing', score: 18, weight: 30, trend: 'down' },
      { label: 'Engagement / responsiveness', score: 20, weight: 20, trend: 'down' },
      { label: 'Escalation pressure', score: 10, weight: 15, trend: 'flat' },
      { label: 'SLA performance', score: 25, weight: 10, trend: 'flat' },
    ],
  },
  {
    clientId: 'c2', overallScore: 78, trend: 'up', updatedAt: iso(0),
    factors: [
      { label: 'Payment / AR health', score: 85, weight: 25, trend: 'up' },
      { label: 'Compliance standing', score: 72, weight: 30, trend: 'up' },
      { label: 'Engagement / responsiveness', score: 80, weight: 20, trend: 'up' },
      { label: 'Escalation pressure', score: 90, weight: 15, trend: 'up' },
      { label: 'SLA performance', score: 65, weight: 10, trend: 'up' },
    ],
  },
  {
    clientId: 'c3', overallScore: 48, trend: 'flat', updatedAt: iso(-2),
    factors: [
      { label: 'Payment / AR health', score: 40, weight: 25, trend: 'flat' },
      { label: 'Compliance standing', score: 50, weight: 30, trend: 'down' },
      { label: 'Engagement / responsiveness', score: 45, weight: 20, trend: 'flat' },
      { label: 'Escalation pressure', score: 30, weight: 15, trend: 'flat' },
      { label: 'SLA performance', score: 60, weight: 10, trend: 'up' },
    ],
  },
  {
    clientId: 'c4', overallScore: 34, trend: 'down', updatedAt: iso(-3),
    factors: [
      { label: 'Payment / AR health', score: 20, weight: 25, trend: 'flat' },
      { label: 'Compliance standing', score: 38, weight: 30, trend: 'down' },
      { label: 'Engagement / responsiveness', score: 50, weight: 20, trend: 'down' },
      { label: 'Escalation pressure', score: 25, weight: 15, trend: 'flat' },
      { label: 'SLA performance', score: 40, weight: 10, trend: 'flat' },
    ],
  },
  {
    clientId: 'c5', overallScore: 19, trend: 'flat', updatedAt: iso(-4),
    factors: [
      { label: 'Payment / AR health', score: 10, weight: 25, trend: 'flat' },
      { label: 'Compliance standing', score: 18, weight: 30, trend: 'flat' },
      { label: 'Engagement / responsiveness', score: 22, weight: 20, trend: 'flat' },
      { label: 'Escalation pressure', score: 15, weight: 15, trend: 'flat' },
      { label: 'SLA performance', score: 30, weight: 10, trend: 'down' },
    ],
  },
  {
    clientId: 'c6', overallScore: 41, trend: 'up', updatedAt: iso(0),
    factors: [
      { label: 'Payment / AR health', score: 30, weight: 25, trend: 'flat' },
      { label: 'Compliance standing', score: 55, weight: 30, trend: 'up' },
      { label: 'Engagement / responsiveness', score: 35, weight: 20, trend: 'flat' },
      { label: 'Escalation pressure', score: 50, weight: 15, trend: 'up' },
      { label: 'SLA performance', score: 35, weight: 10, trend: 'flat' },
    ],
  },
];

export const seedExpansion: ExpansionMilestone[] = [
  { id: 'x1', clientId: 'c1', title: 'New project compliance package', stage: 'In Discussion', potentialValue: 18000, targetDate: iso(45), description: 'Compliance support for upcoming project John mentioned.' },
  { id: 'x2', clientId: 'c1', title: 'Multi-state licensing add-on', stage: 'Identified', potentialValue: 12000, targetDate: iso(90), description: 'Potential expansion into a second state.' },

  { id: 'x3', clientId: 'c3', title: 'Monitoring add-on', stage: 'Proposed', potentialValue: 9000, targetDate: iso(20), description: 'Ongoing monitoring bundled with renewal.' },
  { id: 'x4', clientId: 'c3', title: 'Renewal upsell to premium tier', stage: 'In Discussion', potentialValue: 15000, targetDate: iso(14), description: 'Upgrade to premium compliance tier at renewal.' },

  { id: 'x5', clientId: 'c4', title: 'Second qualifier placement', stage: 'Identified', potentialValue: 8000, targetDate: iso(60), description: 'Client may add a second qualifier.' },

  { id: 'x6', clientId: 'c5', title: 'Referral lead — partner company', stage: 'Identified', potentialValue: 11000, targetDate: iso(75), description: 'Charlie referred a colleague at another company.' },

  { id: 'x7', clientId: 'c6', title: 'Qualifier placement for bid', stage: 'Committed', potentialValue: 14000, targetDate: iso(10), description: 'Placement tied to an upcoming bid.' },
];

export const seedInvoices: Invoice[] = [
  { id: 'inv1', clientId: 'c1', invoiceNumber: 'INV-1042', amount: 4500, amountPaid: 4500, issueDate: iso(-40), dueDate: iso(-10), status: 'Paid' },
  { id: 'inv2', clientId: 'c1', invoiceNumber: 'INV-1081', amount: 3200, amountPaid: 0, issueDate: iso(-8), dueDate: iso(22), status: 'Sent' },

  { id: 'inv3', clientId: 'c2', invoiceNumber: 'INV-1039', amount: 6800, amountPaid: 0, issueDate: iso(-50), dueDate: iso(-20), status: 'Overdue' },
  { id: 'inv4', clientId: 'c2', invoiceNumber: 'INV-1055', amount: 2400, amountPaid: 1200, issueDate: iso(-30), dueDate: iso(-2), status: 'Partial' },
  { id: 'inv5', clientId: 'c2', invoiceNumber: 'INV-1090', amount: 3600, amountPaid: 0, issueDate: iso(-5), dueDate: iso(25), status: 'Sent' },

  { id: 'inv6', clientId: 'c3', invoiceNumber: 'INV-1061', amount: 5200, amountPaid: 5200, issueDate: iso(-35), dueDate: iso(-5), status: 'Paid' },
  { id: 'inv7', clientId: 'c3', invoiceNumber: 'INV-1092', amount: 5200, amountPaid: 0, issueDate: iso(-3), dueDate: iso(27), status: 'Sent' },

  { id: 'inv8', clientId: 'c4', invoiceNumber: 'INV-1070', amount: 2800, amountPaid: 2800, issueDate: iso(-25), dueDate: iso(5), status: 'Paid' },

  { id: 'inv9', clientId: 'c5', invoiceNumber: 'INV-1075', amount: 3100, amountPaid: 3100, issueDate: iso(-28), dueDate: iso(2), status: 'Paid' },

  { id: 'inv10', clientId: 'c6', invoiceNumber: 'INV-1088', amount: 4200, amountPaid: 0, issueDate: iso(-6), dueDate: iso(24), status: 'Sent' },
  { id: 'inv11', clientId: 'c6', invoiceNumber: 'INV-1066', amount: 1500, amountPaid: 0, issueDate: iso(-45), dueDate: iso(-15), status: 'Overdue' },
];

export const seedSLAs: SLA[] = [
  { id: 'sla1', clientId: 'c1', name: 'Compliance doc review', description: 'Review submitted compliance docs within 5 business days.', dueDate: iso(4), status: 'On Track', owner: 'Gregg' },
  { id: 'sla2', clientId: 'c1', name: 'Quarterly check-in', description: 'Proactive quarterly account review.', dueDate: iso(18), status: 'Upcoming', owner: 'Gregg' },

  { id: 'sla3', clientId: 'c2', name: 'Refund determination', description: 'Resolve refund request within 7 days.', dueDate: iso(-6), status: 'Missed', owner: 'Gregg' },
  { id: 'sla4', clientId: 'c2', name: 'Pricing exception decision', description: 'Provide pricing decision by deadline.', dueDate: iso(2), status: 'At Risk', owner: 'Gregg' },
  { id: 'sla5', clientId: 'c2', name: 'Escalation acknowledgement', description: 'Acknowledge escalation within 24h.', dueDate: iso(-8), status: 'Met', owner: 'Gregg' },

  { id: 'sla6', clientId: 'c3', name: 'Renewal agreement delivery', description: 'Send renewal agreement within 3 days.', dueDate: iso(3), status: 'On Track', owner: 'Landon' },
  { id: 'sla7', clientId: 'c3', name: 'Monitoring quote', description: 'Deliver add-on quote.', dueDate: iso(6), status: 'Upcoming', owner: 'Landon' },

  { id: 'sla8', clientId: 'c4', name: 'Qualifier confirmation', description: 'Confirm qualifier ID within 10 days.', dueDate: iso(-1), status: 'At Risk', owner: 'Landon' },

  { id: 'sla9', clientId: 'c5', name: 'Monitoring call scheduling', description: 'Schedule next monitoring call.', dueDate: iso(12), status: 'Upcoming', owner: 'Landon' },

  { id: 'sla10', clientId: 'c6', name: 'Onboarding doc collection', description: 'Collect onboarding docs within 7 days.', dueDate: iso(-2), status: 'Missed', owner: 'Gregg' },
  { id: 'sla11', clientId: 'c6', name: 'Placement timeline confirmation', description: 'Confirm placement timeline with client.', dueDate: iso(1), status: 'At Risk', owner: 'Gregg' },
];

export const seedEvents: ScheduledEvent[] = [
  { id: 'ev1', clientId: 'c1', title: 'Compliance docs review call', type: 'Check-in', date: iso(3), time: '10:00 AM', attendees: 'Gregg, John Doe', withClient: true },
  { id: 'ev2', clientId: 'c1', title: 'Expansion scoping discussion', type: 'Review', date: iso(12), time: '2:00 PM', attendees: 'Gregg, John Doe', withClient: true },

  { id: 'ev3', clientId: 'c2', title: 'Pricing exception decision call', type: 'Escalation', date: iso(1), time: '9:30 AM', attendees: 'Gregg, Jane Smith', withClient: true },
  { id: 'ev4', clientId: 'c2', title: 'Internal remediation sync', type: 'Review', date: iso(2), time: '4:00 PM', attendees: 'Gregg, Landon', withClient: false },

  { id: 'ev5', clientId: 'c3', title: 'Renewal walkthrough', type: 'Renewal', date: iso(5), time: '11:00 AM', attendees: 'Landon, Bob Johnson', withClient: true },

  { id: 'ev6', clientId: 'c4', title: 'Qualifier requirements review', type: 'Review', date: iso(8), time: '1:00 PM', attendees: 'Landon, Alice Williams', withClient: true },

  { id: 'ev7', clientId: 'c5', title: 'Monitoring check-in', type: 'Check-in', date: iso(14), time: '3:30 PM', attendees: 'Landon, Charlie Brown', withClient: true },

  { id: 'ev8', clientId: 'c6', title: 'Onboarding status call', type: 'Onboarding', date: iso(2), time: '10:30 AM', attendees: 'Gregg, David Lee', withClient: true },
  { id: 'ev9', clientId: 'c6', title: 'Placement approval review', type: 'Placement', date: iso(4), time: '9:00 AM', attendees: 'Gregg, Leadership', withClient: false },
];

export const seedContactLog: ContactLogEntry[] = [
  { id: 'cl1', clientId: 'c1', date: iso(-2), channel: 'Call', internalPerson: 'Gregg', direction: 'Inbound', summary: 'John confirmed compliance docs are coming.' },
  { id: 'cl2', clientId: 'c1', date: iso(-9), channel: 'Email', internalPerson: 'Landon', direction: 'Outbound', summary: 'Sent audit results summary.' },

  { id: 'cl3', clientId: 'c2', date: iso(-1), channel: 'Call', internalPerson: 'Gregg', direction: 'Inbound', summary: 'Jane escalated pricing exception again.' },
  { id: 'cl4', clientId: 'c2', date: iso(-7), channel: 'Email', internalPerson: 'Gregg', direction: 'Outbound', summary: 'Acknowledged refund request; requested invoice number.' },

  { id: 'cl5', clientId: 'c3', date: iso(-4), channel: 'Call', internalPerson: 'Landon', direction: 'Inbound', summary: 'Bob confirmed renewal and asked about monitoring.' },

  { id: 'cl6', clientId: 'c4', date: iso(-11), channel: 'Call', internalPerson: 'Landon', direction: 'Inbound', summary: 'Alice asked about qualifier requirements.' },

  { id: 'cl7', clientId: 'c5', date: iso(-16), channel: 'Call', internalPerson: 'Landon', direction: 'Inbound', summary: 'Routine monitoring check-in; referral mentioned.' },

  { id: 'cl8', clientId: 'c6', date: iso(-1), channel: 'Meeting', internalPerson: 'Gregg', direction: 'Outbound', summary: 'Onboarding call; legal-sensitive question routed to leadership.' },
];