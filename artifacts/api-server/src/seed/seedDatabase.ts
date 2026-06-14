import {
  db,
  usersTable,
  clientsTable,
  callNotesTable,
  tasksTable,
  opportunitySignalsTable,
  escalationsTable,
  clientProcessesTable,
  clientRiskProfilesTable,
  clientAuditsTable,
  auditLinksTable,
  expansionMilestonesTable,
  invoicesTable,
  slasTable,
  scheduledEventsTable,
  contactLogTable,
  activityLogTable,
  crmLinksTable,
  communicationDraftsTable,
  travelPlansTable,
  expensesTable,
  feedbackTable,
  trainingModulesTable,
  bonusEntriesTable,
  profitShareProjectionsTable,
  qualifiersTable,
  placementsTable,
  successPlanItemsTable,
  type RiskFactor,
  type AuditScoreItem,
} from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const now = new Date();
function iso(offsetDays: number): string {
  const d = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + offsetDays,
  );
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
const dateOrNull = (v: string): string | null => (v && v.trim() ? v : null);

interface SeedClient {
  key: string;
  clientName: string;
  companyName: string;
  contactName: string;
  phone: string;
  email: string;
  clientStatus: string;
  greggPriority: string;
  riskLevel: string;
  lastMeaningfulContact: string;
  nextAction: string;
  nextOwner: string;
  coOwner?: string;
  involvementState?: string;
  touchCadenceDays?: number;
  dueDate: string;
  missingInformation: string;
}

const clients: SeedClient[] = [
  { key: "c1", clientName: "ABC Construction", companyName: "ABC Construction LLC", contactName: "John Doe", phone: "555-0101", email: "john@abcconstruction.com", clientStatus: "Active", greggPriority: "High", riskLevel: "Low", lastMeaningfulContact: iso(-2), nextAction: "Review compliance docs", nextOwner: "Gregg", coOwner: "Tara", involvementState: "Co-managed", touchCadenceDays: 14, dueDate: iso(5), missingInformation: "None" },
  { key: "c2", clientName: "BuildCorp", companyName: "BuildCorp Inc", contactName: "Jane Smith", phone: "555-0102", email: "jane@buildcorp.com", clientStatus: "At Risk", greggPriority: "Urgent", riskLevel: "High", lastMeaningfulContact: iso(-1), nextAction: "Address pricing exception", nextOwner: "Gregg", involvementState: "Gregg lead", touchCadenceDays: 7, dueDate: iso(2), missingInformation: "Pricing history" },
  { key: "c3", clientName: "CityBuilders", companyName: "CityBuilders Group", contactName: "Bob Johnson", phone: "555-0103", email: "bob@citybuilders.com", clientStatus: "Renewal Pending", greggPriority: "Medium", riskLevel: "Medium", lastMeaningfulContact: iso(-4), nextAction: "Send renewal agreement", nextOwner: "Landon", coOwner: "Tara", involvementState: "Co-managed", touchCadenceDays: 21, dueDate: iso(6), missingInformation: "None" },
  { key: "c4", clientName: "Delta Construction", companyName: "Delta Construction Ltd", contactName: "Alice Williams", phone: "555-0104", email: "alice@deltaconstruction.com", clientStatus: "Active", greggPriority: "Low", riskLevel: "Low", lastMeaningfulContact: iso(-11), nextAction: "Check in on qualifier status", nextOwner: "Landon", involvementState: "Landon lead", touchCadenceDays: 30, dueDate: iso(9), missingInformation: "Qualifier ID" },
  { key: "c5", clientName: "Echo Builders", companyName: "Echo Builders LLC", contactName: "Charlie Brown", phone: "555-0105", email: "charlie@echobuilders.com", clientStatus: "Active", greggPriority: "Medium", riskLevel: "Low", lastMeaningfulContact: iso(-16), nextAction: "Schedule monitoring call", nextOwner: "Landon", involvementState: "Landon lead", touchCadenceDays: 14, dueDate: iso(12), missingInformation: "None" },
  { key: "c6", clientName: "Foxtrot Developments", companyName: "Foxtrot Developments Inc", contactName: "David Lee", phone: "555-0106", email: "david@foxtrot.com", clientStatus: "Onboarding", greggPriority: "High", riskLevel: "Low", lastMeaningfulContact: iso(-1), nextAction: "Complete onboarding", nextOwner: "Gregg", coOwner: "Tara", involvementState: "Tara onboarding support", touchCadenceDays: 7, dueDate: iso(3), missingInformation: "Company docs" },
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

interface SeedNote {
  key: string;
  clientKey: string;
  callDate: string;
  caller: string;
  callType: string;
  rawRingCentralNote: string;
  cleanSummary: string;
  clientConcern: string;
  commitmentsMade: string;
  missingInformation: string;
  nextActions: string;
  opportunitySignals: string;
  escalationFlags: string;
  routingStatus: string;
  crmReadyNote: string;
  clientFollowUpDraft: string;
  taskList: string;
  createdAt: string;
  updatedAt: string;
}

const notes: SeedNote[] = [
  { key: "n1", clientKey: "c1", callDate: noteDates.n1.call, caller: "John Doe", callType: "Inbound", rawRingCentralNote: "John called to ask about the compliance docs. He said he will send them by tomorrow. Also mentioned he might need help with a new project next month.", cleanSummary: "Discussed compliance documentation status and potential new project expansion.", clientConcern: "None", commitmentsMade: "John to send compliance docs by tomorrow.", missingInformation: "Compliance docs", nextActions: "Review compliance docs once received.", opportunitySignals: "Expansion", escalationFlags: "None", routingStatus: "CRM-ready", crmReadyNote: `Call with John Doe on ${noteDates.n1.call}. Discussed compliance documentation status and potential new project expansion. Client concern/request: None. Missing information: Compliance docs. Next steps: Review compliance docs once received. Owner: Gregg. Due date: ${noteDates.n1.due}. Opportunity signals: Expansion. Escalation: None.`, clientFollowUpDraft: `Hi John Doe, thank you for speaking with Gregg today. Based on the conversation, our next step is Review compliance docs once received. We are currently waiting on Compliance docs. We will follow up by ${noteDates.n1.due}.`, taskList: `Task: Review compliance docs | Owner: Gregg | Due: ${noteDates.n1.due} | Priority: High`, createdAt: `${noteDates.n1.call}T10:00:00Z`, updatedAt: `${noteDates.n1.call}T10:30:00Z` },
  { key: "n2", clientKey: "c2", callDate: noteDates.n2.call, caller: "Jane Smith", callType: "Escalation", rawRingCentralNote: "Jane was very upset about the pricing exception we discussed last week. She says she will cancel if we don't honor the original quote.", cleanSummary: "Client escalated regarding pricing exception and threatened cancellation.", clientConcern: "Pricing exception not honored.", commitmentsMade: "Gregg will review and provide a final decision by end of week.", missingInformation: "Pricing history", nextActions: "Review pricing exception and contact client.", opportunitySignals: "Client-save", escalationFlags: "Pricing exception", routingStatus: "Gregg review", crmReadyNote: `Call with Jane Smith on ${noteDates.n2.call}. Discussed client escalated regarding pricing exception and threatened cancellation. Client concern/request: Pricing exception not honored. Missing information: Pricing history. Next steps: Review pricing exception and contact client. Owner: Gregg. Due date: ${noteDates.n2.due}. Opportunity signals: Client-save. Escalation: Pricing exception.`, clientFollowUpDraft: `Hi Jane Smith, thank you for speaking with Gregg today. Based on the conversation, our next step is Review pricing exception and contact client. We are currently waiting on Pricing history. We will follow up by ${noteDates.n2.due}.`, taskList: `Task: Address pricing exception | Owner: Gregg | Due: ${noteDates.n2.due} | Priority: Urgent`, createdAt: `${noteDates.n2.call}T14:00:00Z`, updatedAt: `${noteDates.n2.call}T14:45:00Z` },
  { key: "n3", clientKey: "c3", callDate: noteDates.n3.call, caller: "Bob Johnson", callType: "Renewal", rawRingCentralNote: "Bob wants to renew but asked if we can add monitoring to the package. Needs the renewal agreement sent over for signature.", cleanSummary: "Client confirmed renewal intent and asked about adding monitoring services.", clientConcern: "Wants monitoring added to renewal.", commitmentsMade: "Landon to send renewal agreement.", missingInformation: "None", nextActions: "Send renewal agreement\nPrepare monitoring add-on quote", opportunitySignals: "Expansion - monitoring add-on", escalationFlags: "None", routingStatus: "Summary drafted", crmReadyNote: `Call with Bob Johnson on ${noteDates.n3.call}. Discussed client confirmed renewal intent and asked about adding monitoring services. Client concern/request: Wants monitoring added to renewal. Missing information: None. Next steps: Send renewal agreement; Prepare monitoring add-on quote. Owner: Landon. Due date: ${noteDates.n3.due}. Opportunity signals: Expansion - monitoring add-on. Escalation: None.`, clientFollowUpDraft: `Hi Bob Johnson, thank you for speaking with Gregg today. Based on the conversation, our next step is Send renewal agreement. We are currently waiting on nothing at this time. We will follow up by ${noteDates.n3.due}.`, taskList: `Task: Send renewal agreement | Owner: Landon | Due: ${noteDates.n3.due} | Priority: Medium\nTask: Prepare monitoring add-on quote | Owner: Landon | Due: ${noteDates.n3.due} | Priority: Medium`, createdAt: `${noteDates.n3.call}T09:00:00Z`, updatedAt: `${noteDates.n3.call}T09:20:00Z` },
  { key: "n4", clientKey: "c4", callDate: noteDates.n4.call, caller: "Alice Williams", callType: "Qualifier Discussion", rawRingCentralNote: "Alice asked about qualifier requirements for a new state license. Could not confirm her current qualifier ID on file. Said she may want to add a second qualifier later.", cleanSummary: "Discussed qualifier requirements for a new state license expansion.", clientConcern: "Unsure of qualifier requirements for new state.", commitmentsMade: "Landon to confirm qualifier ID and requirements.", missingInformation: "Qualifier ID", nextActions: "Confirm qualifier ID on file\nResearch new state qualifier requirements", opportunitySignals: "Qualifier - potential second qualifier", escalationFlags: "None", routingStatus: "In review", crmReadyNote: `Call with Alice Williams on ${noteDates.n4.call}. Discussed qualifier requirements for a new state license expansion. Client concern/request: Unsure of qualifier requirements for new state. Missing information: Qualifier ID. Next steps: Confirm qualifier ID on file; Research new state qualifier requirements. Owner: Landon. Due date: ${noteDates.n4.due}. Opportunity signals: Qualifier - potential second qualifier. Escalation: None.`, clientFollowUpDraft: `Hi Alice Williams, thank you for speaking with Gregg today. Based on the conversation, our next step is Confirm qualifier ID on file. We are currently waiting on Qualifier ID. We will follow up by ${noteDates.n4.due}.`, taskList: `Task: Confirm qualifier ID on file | Owner: Landon | Due: ${noteDates.n4.due} | Priority: Medium\nTask: Research new state qualifier requirements | Owner: Landon | Due: ${noteDates.n4.due} | Priority: Medium`, createdAt: `${noteDates.n4.call}T11:00:00Z`, updatedAt: `${noteDates.n4.call}T11:25:00Z` },
  { key: "n5", clientKey: "c5", callDate: noteDates.n5.call, caller: "Charlie Brown", callType: "Monitoring", rawRingCentralNote: "Routine monitoring check-in. Everything looks fine. Charlie mentioned a colleague at another company might be interested in our services.", cleanSummary: "Routine monitoring check-in with a potential referral lead.", clientConcern: "None", commitmentsMade: "Landon to schedule next monitoring call.", missingInformation: "None", nextActions: "Schedule next monitoring call", opportunitySignals: "Placement - referral lead at another company", escalationFlags: "None", routingStatus: "CRM-ready", crmReadyNote: `Call with Charlie Brown on ${noteDates.n5.call}. Discussed routine monitoring check-in with a potential referral lead. Client concern/request: None. Missing information: None. Next steps: Schedule next monitoring call. Owner: Landon. Due date: ${noteDates.n5.due}. Opportunity signals: Placement - referral lead at another company. Escalation: None.`, clientFollowUpDraft: `Hi Charlie Brown, thank you for speaking with Gregg today. Based on the conversation, our next step is Schedule next monitoring call. We are currently waiting on nothing at this time. We will follow up by ${noteDates.n5.due}.`, taskList: `Task: Schedule next monitoring call | Owner: Landon | Due: ${noteDates.n5.due} | Priority: Low`, createdAt: `${noteDates.n5.call}T13:00:00Z`, updatedAt: `${noteDates.n5.call}T13:15:00Z` },
  { key: "n6", clientKey: "c6", callDate: noteDates.n6.call, caller: "David Lee", callType: "Scheduled Check-in", rawRingCentralNote: "Onboarding call. David still needs to send company formation docs and insurance certificate. Asked a question about legal liability that we should not answer directly.", cleanSummary: "Onboarding check-in; outstanding documents and a legal-sensitive question raised.", clientConcern: "Asked about legal liability exposure (decision boundary).", commitmentsMade: "Gregg to follow up after collecting onboarding docs.", missingInformation: "Company formation docs, insurance certificate", nextActions: "Collect company formation docs\nRoute legal-liability question to leadership", opportunitySignals: "None", escalationFlags: "Legal-sensitive question raised - route to leadership review", routingStatus: "Gregg review", crmReadyNote: `Call with David Lee on ${noteDates.n6.call}. Discussed onboarding check-in; outstanding documents and a legal-sensitive question raised. Client concern/request: Asked about legal liability exposure (decision boundary). Missing information: Company formation docs, insurance certificate. Next steps: Collect company formation docs; Route legal-liability question to leadership. Owner: Gregg. Due date: ${noteDates.n6.due}. Opportunity signals: None. Escalation: Legal-sensitive question raised - route to leadership review.`, clientFollowUpDraft: `Hi David Lee, thank you for speaking with Gregg today. Based on the conversation, our next step is Collect company formation docs. We are currently waiting on Company formation docs, insurance certificate. We will follow up by ${noteDates.n6.due}.`, taskList: `Task: Collect company formation docs | Owner: Gregg | Due: ${noteDates.n6.due} | Priority: High\nTask: Route legal-liability question to leadership | Owner: Gregg | Due: ${noteDates.n6.due} | Priority: High`, createdAt: `${noteDates.n6.call}T15:00:00Z`, updatedAt: `${noteDates.n6.call}T15:30:00Z` },
  { key: "n7", clientKey: "c2", callDate: noteDates.n7.call, caller: "Jane Smith", callType: "Inbound", rawRingCentralNote: "Jane called about a refund request for a duplicate charge. Wants money back this week. Did not have the invoice number handy.", cleanSummary: "Client requested a refund for a reported duplicate charge.", clientConcern: "Refund for duplicate charge.", commitmentsMade: "Gregg to review billing and respond.", missingInformation: "Invoice number", nextActions: "Review billing records for duplicate charge", opportunitySignals: "None", escalationFlags: "Refund request - requires leadership approval", routingStatus: "New", crmReadyNote: `Call with Jane Smith on ${noteDates.n7.call}. Discussed client requested a refund for a reported duplicate charge. Client concern/request: Refund for duplicate charge. Missing information: Invoice number. Next steps: Review billing records for duplicate charge. Owner: Gregg. Due date: ${noteDates.n7.due}. Opportunity signals: None. Escalation: Refund request - requires leadership approval.`, clientFollowUpDraft: `Hi Jane Smith, thank you for speaking with Gregg today. Based on the conversation, our next step is Review billing records for duplicate charge. We are currently waiting on Invoice number. We will follow up by ${noteDates.n7.due}.`, taskList: `Task: Review billing records for duplicate charge | Owner: Gregg | Due: ${noteDates.n7.due} | Priority: High`, createdAt: `${noteDates.n7.call}T10:00:00Z`, updatedAt: `${noteDates.n7.call}T10:20:00Z` },
  { key: "n8", clientKey: "c6", callDate: noteDates.n8.call, caller: "David Lee", callType: "Placement Discussion", rawRingCentralNote: "David wants to place a new qualifier for an upcoming bid. Needs approval on the placement and asked when it can be finalized.", cleanSummary: "Client requested a qualifier placement for an upcoming bid.", clientConcern: "Timeline for placement approval.", commitmentsMade: "Gregg to review placement and confirm timeline.", missingInformation: "Bid deadline", nextActions: "Review placement request\nConfirm placement timeline with client", opportunitySignals: "Placement - new qualifier placement", escalationFlags: "Placement approval needed", routingStatus: "New", crmReadyNote: `Call with David Lee on ${noteDates.n8.call}. Discussed client requested a qualifier placement for an upcoming bid. Client concern/request: Timeline for placement approval. Missing information: Bid deadline. Next steps: Review placement request; Confirm placement timeline with client. Owner: Gregg. Due date: ${noteDates.n8.due}. Opportunity signals: Placement - new qualifier placement. Escalation: Placement approval needed.`, clientFollowUpDraft: `Hi David Lee, thank you for speaking with Gregg today. Based on the conversation, our next step is Review placement request. We are currently waiting on Bid deadline. We will follow up by ${noteDates.n8.due}.`, taskList: `Task: Review placement request | Owner: Gregg | Due: ${noteDates.n8.due} | Priority: High\nTask: Confirm placement timeline with client | Owner: Gregg | Due: ${noteDates.n8.due} | Priority: High`, createdAt: `${noteDates.n8.call}T16:00:00Z`, updatedAt: `${noteDates.n8.call}T16:25:00Z` },
];

const tasks = [
  { clientKey: "c1", noteKey: "n1", title: "Review compliance docs", owner: "Gregg", dueDate: iso(5), priority: "High", status: "Open", escalationFlag: false, notes: "Review the docs John is sending." },
  { clientKey: "c2", noteKey: "n2", title: "Address pricing exception", owner: "Gregg", dueDate: iso(2), priority: "Urgent", status: "Open", escalationFlag: true, notes: "Client threatened cancellation." },
];

const signals = [
  { clientKey: "c1", noteKey: "n1", type: "Expansion", description: "Potential new project next month.", status: "Open", routedTo: "Gregg", createdAt: `${noteDates.n1.call}T10:30:00Z` },
  { clientKey: "c2", noteKey: "n2", type: "Client-save", description: "Client escalated pricing exception.", status: "Open", routedTo: "Gregg", createdAt: `${noteDates.n2.call}T14:45:00Z` },
];

const escalations = [
  { clientKey: "c2", noteKey: "n2", reason: "Pricing exception", riskLevel: "High", routedTo: "Gregg", decisionNeeded: "Approve or deny pricing exception.", deadline: iso(2), status: "Open" },
];

const processes = [
  { clientKey: "c1", name: "Annual compliance documentation refresh", type: "Document Collection", status: "In Progress", progress: 65, owner: "Gregg", startedAt: iso(-18), dueDate: iso(7), blockedReason: "" },
  { clientKey: "c1", name: "Q3 compliance audit", type: "Audit", status: "Completed", progress: 100, owner: "Landon", startedAt: iso(-60), dueDate: iso(-12), blockedReason: "" },
  { clientKey: "c1", name: "New-project expansion scoping", type: "Expansion", status: "In Progress", progress: 30, owner: "Gregg", startedAt: iso(-6), dueDate: iso(21), blockedReason: "" },
  { clientKey: "c2", name: "Pricing exception resolution", type: "Client-save", status: "Blocked", progress: 40, owner: "Gregg", startedAt: iso(-10), dueDate: iso(2), blockedReason: "Awaiting leadership decision on pricing." },
  { clientKey: "c2", name: "Duplicate-charge refund review", type: "Client-save", status: "Waiting on Client", progress: 20, owner: "Gregg", startedAt: iso(-26), dueDate: iso(-4), blockedReason: "Client has not provided invoice number." },
  { clientKey: "c2", name: "Compliance monitoring", type: "Monitoring", status: "In Progress", progress: 55, owner: "Landon", startedAt: iso(-40), dueDate: iso(14), blockedReason: "" },
  { clientKey: "c3", name: "Renewal agreement processing", type: "Renewal", status: "In Progress", progress: 70, owner: "Landon", startedAt: iso(-9), dueDate: iso(6), blockedReason: "" },
  { clientKey: "c3", name: "Monitoring add-on setup", type: "Expansion", status: "Not Started", progress: 0, owner: "Landon", startedAt: iso(0), dueDate: iso(18), blockedReason: "" },
  { clientKey: "c4", name: "Qualifier verification", type: "Qualifier", status: "Waiting on Client", progress: 35, owner: "Landon", startedAt: iso(-14), dueDate: iso(9), blockedReason: "Qualifier ID not yet provided." },
  { clientKey: "c5", name: "Routine monitoring cycle", type: "Monitoring", status: "In Progress", progress: 50, owner: "Landon", startedAt: iso(-30), dueDate: iso(25), blockedReason: "" },
  { clientKey: "c6", name: "New client onboarding", type: "Onboarding", status: "In Progress", progress: 45, owner: "Gregg", startedAt: iso(-7), dueDate: iso(7), blockedReason: "" },
  { clientKey: "c6", name: "Qualifier placement for upcoming bid", type: "Placement", status: "Blocked", progress: 25, owner: "Gregg", startedAt: iso(-20), dueDate: iso(-2), blockedReason: "Placement approval pending leadership review." },
];

const audits: {
  clientKey: string;
  status: string;
  auditType: string;
  auditor: string;
  lastAuditDate: string;
  nextAuditDate: string;
  overallScore: number;
  scoresheet: AuditScoreItem[];
}[] = [
  { clientKey: "c1", status: "Passed", auditType: "Annual Compliance Audit", auditor: "Landon", lastAuditDate: iso(-12), nextAuditDate: iso(180), overallScore: 92, scoresheet: [ { category: "Licensing & Registration", score: 96, weight: 25, notes: "All licenses current." }, { category: "Document Completeness", score: 88, weight: 20, notes: "Two minor items pending refresh." }, { category: "Qualifier Standing", score: 94, weight: 20, notes: "Qualifier in good standing." }, { category: "Insurance & Bonding", score: 90, weight: 20, notes: "Certificates on file." }, { category: "Reporting Timeliness", score: 90, weight: 15, notes: "Filed on time." } ] },
  { clientKey: "c2", status: "Remediation", auditType: "Compliance Review", auditor: "Landon", lastAuditDate: iso(-22), nextAuditDate: iso(15), overallScore: 58, scoresheet: [ { category: "Licensing & Registration", score: 70, weight: 25, notes: "One license expiring soon." }, { category: "Document Completeness", score: 45, weight: 20, notes: "Pricing history missing." }, { category: "Qualifier Standing", score: 65, weight: 20, notes: "Verification pending." }, { category: "Insurance & Bonding", score: 55, weight: 20, notes: "Certificate needs update." }, { category: "Reporting Timeliness", score: 50, weight: 15, notes: "Late filings noted." } ] },
  { clientKey: "c3", status: "Under Review", auditType: "Renewal Audit", auditor: "Landon", lastAuditDate: iso(-30), nextAuditDate: iso(6), overallScore: 79, scoresheet: [ { category: "Licensing & Registration", score: 85, weight: 25, notes: "Current." }, { category: "Document Completeness", score: 78, weight: 20, notes: "Renewal docs in progress." }, { category: "Qualifier Standing", score: 80, weight: 20, notes: "Good standing." }, { category: "Insurance & Bonding", score: 75, weight: 20, notes: "On file." }, { category: "Reporting Timeliness", score: 74, weight: 15, notes: "Acceptable." } ] },
  { clientKey: "c4", status: "Scheduled", auditType: "Qualifier Audit", auditor: "Landon", lastAuditDate: iso(-120), nextAuditDate: iso(20), overallScore: 84, scoresheet: [ { category: "Licensing & Registration", score: 88, weight: 30, notes: "Current." }, { category: "Qualifier Standing", score: 80, weight: 40, notes: "Awaiting qualifier ID confirmation." }, { category: "Insurance & Bonding", score: 85, weight: 30, notes: "On file." } ] },
  { clientKey: "c5", status: "Passed", auditType: "Monitoring Audit", auditor: "Landon", lastAuditDate: iso(-35), nextAuditDate: iso(150), overallScore: 89, scoresheet: [ { category: "Licensing & Registration", score: 92, weight: 30, notes: "Current." }, { category: "Document Completeness", score: 86, weight: 35, notes: "Complete." }, { category: "Reporting Timeliness", score: 89, weight: 35, notes: "On time." } ] },
  { clientKey: "c6", status: "Not Started", auditType: "Onboarding Baseline Audit", auditor: "Gregg", lastAuditDate: "", nextAuditDate: iso(12), overallScore: 0, scoresheet: [ { category: "Licensing & Registration", score: 0, weight: 34, notes: "Pending onboarding docs." }, { category: "Document Completeness", score: 0, weight: 33, notes: "Formation docs outstanding." }, { category: "Insurance & Bonding", score: 0, weight: 33, notes: "Certificate outstanding." } ] },
];

const riskProfiles: {
  clientKey: string;
  overallScore: number;
  trend: string;
  updatedAt: string;
  factors: RiskFactor[];
}[] = [
  { clientKey: "c1", overallScore: 22, trend: "down", updatedAt: iso(-1), factors: [ { label: "Payment / AR health", score: 12, weight: 25, trend: "flat" }, { label: "Compliance standing", score: 18, weight: 30, trend: "down" }, { label: "Engagement / responsiveness", score: 20, weight: 20, trend: "down" }, { label: "Escalation pressure", score: 10, weight: 15, trend: "flat" }, { label: "SLA performance", score: 25, weight: 10, trend: "flat" } ] },
  { clientKey: "c2", overallScore: 78, trend: "up", updatedAt: iso(0), factors: [ { label: "Payment / AR health", score: 85, weight: 25, trend: "up" }, { label: "Compliance standing", score: 72, weight: 30, trend: "up" }, { label: "Engagement / responsiveness", score: 80, weight: 20, trend: "up" }, { label: "Escalation pressure", score: 90, weight: 15, trend: "up" }, { label: "SLA performance", score: 65, weight: 10, trend: "up" } ] },
  { clientKey: "c3", overallScore: 48, trend: "flat", updatedAt: iso(-2), factors: [ { label: "Payment / AR health", score: 40, weight: 25, trend: "flat" }, { label: "Compliance standing", score: 50, weight: 30, trend: "down" }, { label: "Engagement / responsiveness", score: 45, weight: 20, trend: "flat" }, { label: "Escalation pressure", score: 30, weight: 15, trend: "flat" }, { label: "SLA performance", score: 60, weight: 10, trend: "up" } ] },
  { clientKey: "c4", overallScore: 34, trend: "down", updatedAt: iso(-3), factors: [ { label: "Payment / AR health", score: 20, weight: 25, trend: "flat" }, { label: "Compliance standing", score: 38, weight: 30, trend: "down" }, { label: "Engagement / responsiveness", score: 50, weight: 20, trend: "down" }, { label: "Escalation pressure", score: 25, weight: 15, trend: "flat" }, { label: "SLA performance", score: 40, weight: 10, trend: "flat" } ] },
  { clientKey: "c5", overallScore: 19, trend: "flat", updatedAt: iso(-4), factors: [ { label: "Payment / AR health", score: 10, weight: 25, trend: "flat" }, { label: "Compliance standing", score: 18, weight: 30, trend: "flat" }, { label: "Engagement / responsiveness", score: 22, weight: 20, trend: "flat" }, { label: "Escalation pressure", score: 15, weight: 15, trend: "flat" }, { label: "SLA performance", score: 30, weight: 10, trend: "down" } ] },
  { clientKey: "c6", overallScore: 41, trend: "up", updatedAt: iso(0), factors: [ { label: "Payment / AR health", score: 30, weight: 25, trend: "flat" }, { label: "Compliance standing", score: 55, weight: 30, trend: "up" }, { label: "Engagement / responsiveness", score: 35, weight: 20, trend: "flat" }, { label: "Escalation pressure", score: 50, weight: 15, trend: "up" }, { label: "SLA performance", score: 35, weight: 10, trend: "flat" } ] },
];

const expansion = [
  { clientKey: "c1", title: "New project compliance package", stage: "Proposed", status: "Open", potentialValue: 18000, targetDate: iso(45), description: "Compliance support for upcoming project John mentioned.", owner: "Gregg", pinned: true, priorityBoost: 0, movedDaysAgo: 3 },
  { clientKey: "c1", title: "Multi-state licensing add-on", stage: "Identified", status: "Open", potentialValue: 12000, targetDate: iso(90), description: "Potential expansion into a second state.", owner: "Tara", pinned: false, priorityBoost: 0, movedDaysAgo: 30 },
  { clientKey: "c3", title: "Monitoring add-on", stage: "Negotiation", status: "Open", potentialValue: 9000, targetDate: iso(20), description: "Ongoing monitoring bundled with renewal.", owner: "Landon", pinned: false, priorityBoost: 5, movedDaysAgo: 2 },
  { clientKey: "c3", title: "Renewal upsell to premium tier", stage: "Proposed", status: "Open", potentialValue: 15000, targetDate: iso(14), description: "Upgrade to premium compliance tier at renewal.", owner: "Tara", pinned: false, priorityBoost: 0, movedDaysAgo: 25 },
  { clientKey: "c4", title: "Second qualifier placement", stage: "Identified", status: "Open", potentialValue: 8000, targetDate: iso(60), description: "Client may add a second qualifier.", owner: "Landon", pinned: false, priorityBoost: 0, movedDaysAgo: 11 },
  { clientKey: "c5", title: "Referral lead — partner company", stage: "Qualifying", status: "Open", potentialValue: 11000, targetDate: iso(75), description: "Charlie referred a colleague at another company.", owner: "Landon", pinned: false, priorityBoost: 0, movedDaysAgo: 16 },
  { clientKey: "c6", title: "Qualifier placement for bid", stage: "Closing", status: "Open", potentialValue: 14000, targetDate: iso(10), description: "Placement tied to an upcoming bid.", owner: "Gregg", pinned: false, priorityBoost: 0, movedDaysAgo: 1 },
  { clientKey: "c1", title: "Additional state registration", stage: "Live", status: "Won", potentialValue: 10000, actualValue: 11500, targetDate: iso(-5), closedDaysAgo: 5, description: "Closed expansion into a second state.", owner: "Gregg", pinned: false, priorityBoost: 0, movedDaysAgo: 5 },
  { clientKey: "c3", title: "Premium monitoring bundle", stage: "Live", status: "Won", potentialValue: 7000, actualValue: 7000, targetDate: iso(-12), closedDaysAgo: 12, description: "Monitoring add-on closed with renewal.", owner: "Tara", pinned: false, priorityBoost: 0, movedDaysAgo: 12 },
  { clientKey: "c2", title: "Compliance retainer upsell", stage: "Negotiation", status: "Lost", potentialValue: 13000, actualValue: 0, targetDate: iso(-8), closedDaysAgo: 8, description: "Client declined the retainer upsell.", owner: "Gregg", pinned: false, priorityBoost: 0, movedDaysAgo: 8 },
];

const invoices = [
  { clientKey: "c1", invoiceNumber: "INV-1042", amount: 4500, amountPaid: 4500, issueDate: iso(-40), dueDate: iso(-10), status: "Paid" },
  { clientKey: "c1", invoiceNumber: "INV-1081", amount: 3200, amountPaid: 0, issueDate: iso(-8), dueDate: iso(22), status: "Sent" },
  { clientKey: "c2", invoiceNumber: "INV-1039", amount: 6800, amountPaid: 0, issueDate: iso(-50), dueDate: iso(-20), status: "Overdue" },
  { clientKey: "c2", invoiceNumber: "INV-1055", amount: 2400, amountPaid: 1200, issueDate: iso(-30), dueDate: iso(-2), status: "Partial" },
  { clientKey: "c2", invoiceNumber: "INV-1090", amount: 3600, amountPaid: 0, issueDate: iso(-5), dueDate: iso(25), status: "Sent" },
  { clientKey: "c3", invoiceNumber: "INV-1061", amount: 5200, amountPaid: 5200, issueDate: iso(-35), dueDate: iso(-5), status: "Paid" },
  { clientKey: "c3", invoiceNumber: "INV-1092", amount: 5200, amountPaid: 0, issueDate: iso(-3), dueDate: iso(27), status: "Sent" },
  { clientKey: "c4", invoiceNumber: "INV-1070", amount: 2800, amountPaid: 2800, issueDate: iso(-25), dueDate: iso(5), status: "Paid" },
  { clientKey: "c5", invoiceNumber: "INV-1075", amount: 3100, amountPaid: 3100, issueDate: iso(-28), dueDate: iso(2), status: "Paid" },
  { clientKey: "c6", invoiceNumber: "INV-1088", amount: 4200, amountPaid: 0, issueDate: iso(-6), dueDate: iso(24), status: "Sent" },
  { clientKey: "c6", invoiceNumber: "INV-1066", amount: 1500, amountPaid: 0, issueDate: iso(-45), dueDate: iso(-15), status: "Overdue" },
];

const slas = [
  { clientKey: "c1", name: "Compliance doc review", description: "Review submitted compliance docs within 5 business days.", dueDate: iso(4), status: "On Track", owner: "Gregg" },
  { clientKey: "c1", name: "Quarterly check-in", description: "Proactive quarterly account review.", dueDate: iso(18), status: "Upcoming", owner: "Gregg" },
  { clientKey: "c2", name: "Refund determination", description: "Resolve refund request within 7 days.", dueDate: iso(-6), status: "Missed", owner: "Gregg" },
  { clientKey: "c2", name: "Pricing exception decision", description: "Provide pricing decision by deadline.", dueDate: iso(2), status: "At Risk", owner: "Gregg" },
  { clientKey: "c2", name: "Escalation acknowledgement", description: "Acknowledge escalation within 24h.", dueDate: iso(-8), status: "Met", owner: "Gregg" },
  { clientKey: "c3", name: "Renewal agreement delivery", description: "Send renewal agreement within 3 days.", dueDate: iso(3), status: "On Track", owner: "Landon" },
  { clientKey: "c3", name: "Monitoring quote", description: "Deliver add-on quote.", dueDate: iso(6), status: "Upcoming", owner: "Landon" },
  { clientKey: "c4", name: "Qualifier confirmation", description: "Confirm qualifier ID within 10 days.", dueDate: iso(-1), status: "At Risk", owner: "Landon" },
  { clientKey: "c5", name: "Monitoring call scheduling", description: "Schedule next monitoring call.", dueDate: iso(12), status: "Upcoming", owner: "Landon" },
  { clientKey: "c6", name: "Onboarding doc collection", description: "Collect onboarding docs within 7 days.", dueDate: iso(-2), status: "Missed", owner: "Gregg" },
  { clientKey: "c6", name: "Placement timeline confirmation", description: "Confirm placement timeline with client.", dueDate: iso(1), status: "At Risk", owner: "Gregg" },
];

const events = [
  { clientKey: "c1", title: "Compliance docs review call", type: "Check-in", date: iso(3), time: "10:00", attendees: "Gregg, John Doe", withClient: true, status: "Planned", owner: "Gregg" },
  { clientKey: "c1", title: "Lunch with John (relationship)", type: "Meal", date: iso(6), time: "12:00", attendees: "Gregg, Tara, John Doe", withClient: true, status: "Planned", owner: "Tara" },
  { clientKey: "c1", title: "Expansion scoping discussion", type: "Review", date: iso(12), time: "14:00", attendees: "Gregg, John Doe", withClient: true, status: "Planned", owner: "Gregg" },
  { clientKey: "c2", title: "Pricing exception decision call", type: "Escalation", date: iso(1), time: "09:30", attendees: "Gregg, Jane Smith", withClient: true, status: "Planned", owner: "Gregg" },
  { clientKey: "c2", title: "Internal remediation sync", type: "Review", date: iso(2), time: "16:00", attendees: "Gregg, Landon", withClient: false, status: "Planned", owner: "Gregg" },
  { clientKey: "c3", title: "Renewal walkthrough", type: "Renewal", date: iso(5), time: "11:00", attendees: "Landon, Bob Johnson", withClient: true, status: "Planned", owner: "Landon" },
  { clientKey: "c3", title: "On-site visit", type: "Visit", date: iso(9), time: "13:30", attendees: "Tara, Bob Johnson", withClient: true, status: "Planned", owner: "Tara" },
  { clientKey: "c4", title: "Qualifier requirements review", type: "Review", date: iso(8), time: "13:00", attendees: "Landon, Alice Williams", withClient: true, status: "Planned", owner: "Landon" },
  { clientKey: "c5", title: "Monitoring check-in", type: "Check-in", date: iso(14), time: "15:30", attendees: "Landon, Charlie Brown", withClient: true, status: "Planned", owner: "Landon" },
  { clientKey: "c6", title: "Onboarding status call", type: "Onboarding", date: iso(2), time: "10:30", attendees: "Gregg, David Lee", withClient: true, status: "Planned", owner: "Gregg" },
  { clientKey: "c6", title: "Placement approval review", type: "Placement", date: iso(4), time: "09:00", attendees: "Gregg, Leadership", withClient: false, status: "Planned", owner: "Gregg" },
];

const contactLog = [
  { clientKey: "c1", date: iso(-2), channel: "Call", internalPerson: "Gregg", direction: "Inbound", summary: "John confirmed compliance docs are coming." },
  { clientKey: "c1", date: iso(-9), channel: "Email", internalPerson: "Landon", direction: "Outbound", summary: "Sent audit results summary." },
  { clientKey: "c2", date: iso(-1), channel: "Call", internalPerson: "Gregg", direction: "Inbound", summary: "Jane escalated pricing exception again." },
  { clientKey: "c2", date: iso(-7), channel: "Email", internalPerson: "Gregg", direction: "Outbound", summary: "Acknowledged refund request; requested invoice number." },
  { clientKey: "c3", date: iso(-4), channel: "Call", internalPerson: "Landon", direction: "Inbound", summary: "Bob confirmed renewal and asked about monitoring." },
  { clientKey: "c4", date: iso(-11), channel: "Call", internalPerson: "Landon", direction: "Inbound", summary: "Alice asked about qualifier requirements." },
  { clientKey: "c5", date: iso(-16), channel: "Call", internalPerson: "Landon", direction: "Inbound", summary: "Routine monitoring check-in; referral mentioned." },
  { clientKey: "c6", date: iso(-1), channel: "Meeting", internalPerson: "Gregg", direction: "Outbound", summary: "Onboarding call; legal-sensitive question routed to leadership." },
];

async function upsertSeedUser(
  tx: Tx,
  externalId: string,
  email: string,
  displayName: string,
  role: string,
): Promise<string> {
  const existing = await tx
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.externalId, externalId))
    .limit(1);
  if (existing[0]) return existing[0].id;
  const inserted = await tx
    .insert(usersTable)
    .values({ externalId, email, displayName, role })
    .returning({ id: usersTable.id });
  return inserted[0]!.id;
}

export async function seedDatabase(): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.delete(activityLogTable);
    await tx.delete(clientsTable);

    const greggId = await upsertSeedUser(
      tx,
      "seed:gregg",
      "gregg@contractorcompliance.example",
      "Gregg",
      "admin",
    );
    const landonId = await upsertSeedUser(
      tx,
      "seed:landon",
      "landon@contractorcompliance.example",
      "Landon",
      "coordinator",
    );
    const ownerId = (label: string): string | null =>
      label === "Gregg" ? greggId : label === "Landon" ? landonId : null;

    const clientIds = new Map<string, string>();
    for (const c of clients) {
      const id = randomUUID();
      clientIds.set(c.key, id);
      await tx.insert(clientsTable).values({
        id,
        clientName: c.clientName,
        companyName: c.companyName,
        contactName: c.contactName,
        phone: c.phone,
        email: c.email,
        clientStatus: c.clientStatus,
        greggPriority: c.greggPriority,
        riskLevel: c.riskLevel,
        lastMeaningfulContact: dateOrNull(c.lastMeaningfulContact),
        nextAction: c.nextAction,
        nextOwnerLabel: c.nextOwner,
        nextOwnerUserId: ownerId(c.nextOwner),
        coOwnerLabel: c.coOwner ?? "",
        coOwnerUserId: ownerId(c.coOwner ?? ""),
        involvementState: c.involvementState ?? "",
        touchCadenceDays: c.touchCadenceDays ?? 30,
        dueDate: dateOrNull(c.dueDate),
        missingInformation: c.missingInformation,
      });
    }

    const noteIds = new Map<string, string>();
    for (const n of notes) {
      const id = randomUUID();
      noteIds.set(n.key, id);
      await tx.insert(callNotesTable).values({
        id,
        clientId: clientIds.get(n.clientKey)!,
        callDate: n.callDate,
        caller: n.caller,
        callType: n.callType,
        rawRingCentralNote: n.rawRingCentralNote,
        cleanSummary: n.cleanSummary,
        clientConcern: n.clientConcern,
        commitmentsMade: n.commitmentsMade,
        missingInformation: n.missingInformation,
        nextActions: n.nextActions,
        opportunitySignals: n.opportunitySignals,
        escalationFlags: n.escalationFlags,
        routingStatus: n.routingStatus,
        crmReadyNote: n.crmReadyNote,
        clientFollowUpDraft: n.clientFollowUpDraft,
        taskList: n.taskList,
        createdByUserId: greggId,
        createdAt: new Date(n.createdAt),
        updatedAt: new Date(n.updatedAt),
      });
    }

    const taskIds = new Map<string, string>();
    for (const t of tasks) {
      const id = randomUUID();
      taskIds.set(t.title, id);
      await tx.insert(tasksTable).values({
        id,
        clientId: clientIds.get(t.clientKey)!,
        sourceCallNoteId: noteIds.get(t.noteKey) ?? null,
        title: t.title,
        ownerLabel: t.owner,
        ownerUserId: ownerId(t.owner),
        dueDate: dateOrNull(t.dueDate),
        priority: t.priority,
        status: t.status,
        escalationFlag: t.escalationFlag,
        notes: t.notes,
        createdByUserId: greggId,
      });
    }

    for (const sig of signals) {
      await tx.insert(opportunitySignalsTable).values({
        clientId: clientIds.get(sig.clientKey)!,
        sourceCallNoteId: noteIds.get(sig.noteKey) ?? null,
        type: sig.type,
        description: sig.description,
        status: sig.status,
        routedToLabel: sig.routedTo,
        routedToUserId: ownerId(sig.routedTo),
        createdByUserId: greggId,
        createdAt: new Date(sig.createdAt),
      });
    }

    for (const e of escalations) {
      await tx.insert(escalationsTable).values({
        clientId: clientIds.get(e.clientKey)!,
        sourceCallNoteId: noteIds.get(e.noteKey) ?? null,
        reason: e.reason,
        riskLevel: e.riskLevel,
        routedToLabel: e.routedTo,
        routedToUserId: ownerId(e.routedTo),
        decisionNeeded: e.decisionNeeded,
        deadline: dateOrNull(e.deadline),
        status: e.status,
        createdByUserId: greggId,
      });
    }

    for (const p of processes) {
      await tx.insert(clientProcessesTable).values({
        clientId: clientIds.get(p.clientKey)!,
        name: p.name,
        type: p.type,
        status: p.status,
        progress: p.progress,
        ownerLabel: p.owner,
        ownerUserId: ownerId(p.owner),
        startedAt: dateOrNull(p.startedAt),
        dueDate: dateOrNull(p.dueDate),
        blockedReason: p.blockedReason,
      });
    }

    for (const rp of riskProfiles) {
      await tx.insert(clientRiskProfilesTable).values({
        clientId: clientIds.get(rp.clientKey)!,
        overallScore: rp.overallScore,
        trend: rp.trend,
        factors: rp.factors,
        updatedAt: new Date(rp.updatedAt),
      });
    }

    for (const a of audits) {
      await tx.insert(clientAuditsTable).values({
        clientId: clientIds.get(a.clientKey)!,
        status: a.status,
        auditType: a.auditType,
        auditor: a.auditor,
        lastAuditDate: dateOrNull(a.lastAuditDate),
        nextAuditDate: dateOrNull(a.nextAuditDate),
        overallScore: a.overallScore,
        scoresheet: a.scoresheet,
      });
    }

    const expansionIds = new Map<string, string>();
    for (const x of expansion) {
      const id = randomUUID();
      expansionIds.set(x.title, id);
      await tx.insert(expansionMilestonesTable).values({
        id,
        clientId: clientIds.get(x.clientKey)!,
        title: x.title,
        stage: x.stage,
        status: x.status,
        potentialValue: x.potentialValue,
        targetDate: dateOrNull(x.targetDate),
        description: x.description,
        ownerLabel: x.owner,
        ownerUserId: ownerId(x.owner),
        pinned: x.pinned,
        priorityBoost: x.priorityBoost,
        actualValue: "actualValue" in x ? (x.actualValue ?? 0) : 0,
        closedAt:
          "closedDaysAgo" in x && x.closedDaysAgo != null
            ? new Date(Date.now() - x.closedDaysAgo * 86_400_000)
            : null,
        lastMovementAt: new Date(Date.now() - x.movedDaysAgo * 86_400_000),
      });
    }

    const wonStateId = expansionIds.get("Additional state registration");
    const wonMonitorId = expansionIds.get("Premium monitoring bundle");
    const openDealId = expansionIds.get("Monitoring add-on");
    const crmNoteId = noteIds.get("n1");
    const crmTaskId = taskIds.get("Review compliance docs");

    const crmSeed: Array<{
      entityType: string;
      entityId: string | undefined;
      clientKey: string;
      crmModule: string;
      crmRecordId: string | null;
      syncStatus: string;
      pushedDaysAgo: number | null;
      summary: string;
    }> = [
      { entityType: "expansion_milestone", entityId: wonStateId, clientKey: "c1", crmModule: "Deals", crmRecordId: "ZD-100245", syncStatus: "pushed", pushedDaysAgo: 4, summary: "Won deal exported to Zoho Deals." },
      { entityType: "expansion_milestone", entityId: wonMonitorId, clientKey: "c3", crmModule: "Deals", crmRecordId: null, syncStatus: "approved", pushedDaysAgo: null, summary: "Won deal approved for Zoho Deals export." },
      { entityType: "expansion_milestone", entityId: openDealId, clientKey: "c3", crmModule: "Deals", crmRecordId: null, syncStatus: "approved", pushedDaysAgo: null, summary: "Open deal approved for Zoho Deals export." },
      { entityType: "call_note", entityId: crmNoteId, clientKey: "c1", crmModule: "Notes", crmRecordId: "ZN-50871", syncStatus: "pushed", pushedDaysAgo: 2, summary: "Call note exported to Zoho Notes." },
      { entityType: "task", entityId: crmTaskId, clientKey: "c1", crmModule: "Tasks", crmRecordId: null, syncStatus: "approved", pushedDaysAgo: null, summary: "Task approved for Zoho Tasks export." },
    ];

    for (const link of crmSeed) {
      if (!link.entityId) continue;
      await tx.insert(crmLinksTable).values({
        entityType: link.entityType,
        entityId: link.entityId,
        clientId: clientIds.get(link.clientKey) ?? null,
        crmModule: link.crmModule,
        crmRecordId: link.crmRecordId,
        syncStatus: link.syncStatus,
        lastSyncedAt:
          link.pushedDaysAgo != null
            ? new Date(Date.now() - link.pushedDaysAgo * 86_400_000)
            : null,
        lastPushedByUserId: link.syncStatus === "pushed" ? greggId : null,
      });
      await tx.insert(activityLogTable).values({
        actorUserId: greggId,
        actorLabel: "Gregg",
        action: link.syncStatus === "pushed" ? "crm_push_status" : "crm_approved",
        entityType: link.entityType,
        entityId: link.entityId,
        clientId: clientIds.get(link.clientKey) ?? null,
        summary: link.summary,
        createdAt:
          link.pushedDaysAgo != null
            ? new Date(Date.now() - link.pushedDaysAgo * 86_400_000)
            : new Date(),
      });
    }

    const wonActivity: Array<{
      title: string;
      clientKey: string;
      value: number;
      closedDaysAgo: number;
      action: string;
      summary: string;
    }> = [
      { title: "Additional state registration", clientKey: "c1", value: 11500, closedDaysAgo: 5, action: "expansion_won", summary: "Expansion won: Additional state registration ($11,500)." },
      { title: "Premium monitoring bundle", clientKey: "c3", value: 7000, closedDaysAgo: 12, action: "expansion_won", summary: "Expansion won: Premium monitoring bundle ($7,000)." },
      { title: "Compliance retainer upsell", clientKey: "c2", value: 0, closedDaysAgo: 8, action: "expansion_lost", summary: "Expansion lost: Compliance retainer upsell." },
    ];

    for (const w of wonActivity) {
      const eid = expansionIds.get(w.title);
      if (!eid) continue;
      await tx.insert(activityLogTable).values({
        actorUserId: greggId,
        actorLabel: "Gregg",
        action: w.action,
        entityType: "expansion_milestone",
        entityId: eid,
        clientId: clientIds.get(w.clientKey) ?? null,
        summary: w.summary,
        changes: { actualValue: w.value },
        createdAt: new Date(Date.now() - w.closedDaysAgo * 86_400_000),
      });
    }

    for (const inv of invoices) {
      await tx.insert(invoicesTable).values({
        clientId: clientIds.get(inv.clientKey)!,
        invoiceNumber: inv.invoiceNumber,
        amount: inv.amount,
        amountPaid: inv.amountPaid,
        issueDate: dateOrNull(inv.issueDate),
        dueDate: dateOrNull(inv.dueDate),
        status: inv.status,
      });
    }

    for (const sla of slas) {
      await tx.insert(slasTable).values({
        clientId: clientIds.get(sla.clientKey)!,
        name: sla.name,
        description: sla.description,
        dueDate: dateOrNull(sla.dueDate),
        status: sla.status,
        ownerLabel: sla.owner,
        ownerUserId: ownerId(sla.owner),
      });
    }

    for (const ev of events) {
      await tx.insert(scheduledEventsTable).values({
        clientId: clientIds.get(ev.clientKey)!,
        title: ev.title,
        type: ev.type,
        date: dateOrNull(ev.date),
        time: ev.time,
        attendees: ev.attendees,
        withClient: ev.withClient,
        status: ev.status,
        ownerLabel: ev.owner,
      });
    }

    for (const cl of contactLog) {
      await tx.insert(contactLogTable).values({
        clientId: clientIds.get(cl.clientKey)!,
        date: dateOrNull(cl.date),
        channel: cl.channel,
        internalPerson: cl.internalPerson,
        direction: cl.direction,
        summary: cl.summary,
      });
    }

    const commDrafts: Array<{
      clientKey: string;
      intent: string;
      channel: string;
      tone: string;
      instructions: string;
      subject: string;
      body: string;
      source: string;
      status: string;
      createdDaysAgo: number;
    }> = [
      {
        clientKey: "c1",
        intent: "follow_up",
        channel: "email",
        tone: "Warm",
        instructions: "Reference the renewal conversation and the outstanding W-9.",
        source: "ai",
        status: "used",
        createdDaysAgo: 1,
        subject: "Follow-up — ABC Construction LLC",
        body: [
          "Hi Dana,",
          "",
          "Thank you for the time on our call this week. I wanted to follow up on the next steps we discussed so we keep everything moving smoothly ahead of your renewal.",
          "",
          "When you have a moment, could you send over the updated W-9 so we can finalize the file on our end?",
          "",
          "Please let me know if any questions come up — I'm glad to help.",
          "",
          "Best regards,",
          "Gregg",
        ].join("\n"),
      },
      {
        clientKey: "c2",
        intent: "check_in",
        channel: "email",
        tone: "Professional",
        instructions: "",
        source: "template",
        status: "draft",
        createdDaysAgo: 3,
        subject: "Relationship check-in — Summit Builders",
        body: [
          "Hello,",
          "",
          "I wanted to check in and see how things are going on your end.",
          "",
          "Our next step is to schedule your quarterly compliance review.",
          "",
          "Please let me know if you have any questions — I'm glad to help.",
          "",
          "Best regards,",
          "Gregg",
        ].join("\n"),
      },
    ];

    for (const d of commDrafts) {
      const cid = clientIds.get(d.clientKey);
      if (!cid) continue;
      await tx.insert(communicationDraftsTable).values({
        clientId: cid,
        intent: d.intent,
        channel: d.channel,
        tone: d.tone,
        instructions: d.instructions,
        subject: d.subject,
        body: d.body,
        source: d.source,
        status: d.status,
        createdByUserId: greggId,
        createdByLabel: "Gregg",
        createdAt: new Date(Date.now() - d.createdDaysAgo * 86_400_000),
      });
    }

    const travelPlans = [
      {
        clientKey: "c1",
        location: "Phoenix, AZ",
        reason: "High-value retention risk",
        roiReason:
          "Top-3 account showing cooling signals; in-person review protects ~$48k ARR and an active expansion.",
        status: "Planned",
        startDaysFromNow: 12,
        endDaysFromNow: 13,
        notes: "Pair with the quarterly compliance review.",
        owner: "Gregg",
      },
      {
        clientKey: null,
        location: "Denver, CO — Regional Contractor Summit",
        reason: "Strategic partnership growth",
        roiReason:
          "Three current clients attending; one face-to-face trip covers multiple relationships and prospecting.",
        status: "Proposed",
        startDaysFromNow: 30,
        endDaysFromNow: 32,
        notes: "Confirm which accounts are attending before booking.",
        owner: "Gregg",
      },
      {
        clientKey: "c2",
        location: "Dallas, TX",
        reason: "Expansion opportunity",
        roiReason:
          "Multi-entity expansion conversation is stalled; in-person meeting to unblock.",
        status: "Booked",
        startDaysFromNow: 5,
        endDaysFromNow: 5,
        notes: "Lunch meeting with the ownership group.",
        owner: "Gregg",
      },
    ];
    for (const t of travelPlans) {
      const cid = t.clientKey ? clientIds.get(t.clientKey) ?? null : null;
      await tx.insert(travelPlansTable).values({
        clientId: cid,
        location: t.location,
        reason: t.reason,
        roiReason: t.roiReason,
        status: t.status,
        startDate: iso(t.startDaysFromNow),
        endDate: iso(t.endDaysFromNow),
        notes: t.notes,
        ownerLabel: t.owner,
      });
    }

    const expenses = [
      {
        category: "Travel",
        description: "Flight — Dallas client visit",
        amountCents: 42800,
        clientKey: "c2",
        spentDaysAgo: 3,
        owner: "Gregg",
      },
      {
        category: "Client Visit",
        description: "Lunch with ABC Construction ownership",
        amountCents: 18650,
        clientKey: "c1",
        spentDaysAgo: 9,
        owner: "Gregg",
      },
      {
        category: "Relationship",
        description: "Holiday gift baskets — top accounts",
        amountCents: 32000,
        clientKey: null,
        spentDaysAgo: 20,
        owner: "Gregg",
      },
      {
        category: "Event",
        description: "Regional Contractor Summit registration",
        amountCents: 75000,
        clientKey: null,
        spentDaysAgo: 1,
        owner: "Gregg",
      },
    ];
    for (const e of expenses) {
      const cid = e.clientKey ? clientIds.get(e.clientKey) ?? null : null;
      await tx.insert(expensesTable).values({
        category: e.category,
        description: e.description,
        amountCents: e.amountCents,
        clientId: cid,
        spentOn: iso(-e.spentDaysAgo),
        notes: "",
        ownerLabel: e.owner,
      });
    }

    const feedbackItems = [
      {
        type: "risk",
        title: "Repeated billing questions from mid-tier accounts",
        body: "Three clients this month raised the same confusion about invoice line items. Possible systemic communication gap worth reviewing.",
        status: "open",
        clientKey: null,
      },
      {
        type: "opportunity",
        title: "Multi-entity expansion pattern",
        body: "Several clients with multiple LLCs are only enrolled for one entity. Could be a repeatable expansion play.",
        status: "reviewed",
        clientKey: "c2",
      },
      {
        type: "system",
        title: "Call note processor could pre-fill owner",
        body: "When a call note is clearly an escalation, defaulting the owner to Gregg would save a step.",
        status: "open",
        clientKey: null,
      },
    ];
    for (const f of feedbackItems) {
      const cid = f.clientKey ? clientIds.get(f.clientKey) ?? null : null;
      await tx.insert(feedbackTable).values({
        type: f.type,
        title: f.title,
        body: f.body,
        status: f.status,
        clientId: cid,
        submittedByUserId: greggId,
        submittedByLabel: "Gregg",
      });
    }

    const trainingModules = [
      {
        title: "Audit risk fundamentals",
        category: "Compliance",
        description:
          "Understand how the audit risk model scores accounts and what drives Layer A factors.",
        tier: "Awareness",
        xp: 100,
        completed: true,
        sortOrder: 1,
      },
      {
        title: "Reading compliance escalation signals",
        category: "Compliance",
        description:
          "Spot the call patterns that should route to leadership instead of staying at the coordinator level.",
        tier: "Operator",
        xp: 150,
        completed: true,
        sortOrder: 2,
      },
      {
        title: "Zoho Deals lifecycle",
        category: "Zoho CRM",
        description:
          "Approve, push, and reconcile expansion deals through the CRM export center.",
        tier: "Operator",
        xp: 150,
        completed: false,
        sortOrder: 3,
      },
      {
        title: "Prompt-driven call analysis",
        category: "AI & Automation",
        description:
          "Use the prompt library to turn raw RingCentral notes into CRM-ready structure.",
        tier: "Strategic",
        xp: 200,
        completed: false,
        sortOrder: 4,
      },
      {
        title: "Expansion pipeline strategy",
        category: "Client Strategy",
        description:
          "Prioritize the roadmap, manage stalled deals, and protect realized revenue.",
        tier: "Strategic",
        xp: 200,
        completed: false,
        sortOrder: 5,
      },
      {
        title: "Executive client communication",
        category: "Executive Communication",
        description:
          "Draft warm, professional, relationship-first messages that never overcommit.",
        tier: "Executive",
        xp: 250,
        completed: false,
        sortOrder: 6,
      },
    ];
    for (const m of trainingModules) {
      await tx.insert(trainingModulesTable).values({
        title: m.title,
        category: m.category,
        description: m.description,
        tier: m.tier,
        xp: m.xp,
        completed: m.completed,
        completedAt: m.completed
          ? new Date(Date.now() - 14 * 86_400_000)
          : null,
        sortOrder: m.sortOrder,
      });
    }

    const abcId = clientIds.get("c1");
    if (abcId) {
      await tx.insert(auditLinksTable).values({
        clientId: abcId,
        portalAuditId: 2,
        portalClientName: "ABC Construction LLC",
        matchMethod: "preconfirmed",
        confirmedByUserId: greggId,
        confirmedAt: new Date(),
      });
    }

    const bonusEntries: {
      category: string;
      title: string;
      clientKey: string | null;
      amount: number;
      status: string;
      periodLabel: string;
      documentation: string;
    }[] = [
      {
        category: "expansion_addon",
        title: "Add-on services secured (2.5% of retained revenue)",
        clientKey: "c1",
        amount: 1250,
        status: "pending_approval",
        periodLabel: "June 2026",
        documentation: "Signed add-on agreement + first collected payment on file.",
      },
      {
        category: "monitoring_conversion",
        title: "Converted client to ongoing monitoring",
        clientKey: "c2",
        amount: 400,
        status: "eligible",
        periodLabel: "June 2026",
        documentation: "Monitoring plan activated; awaiting first billing cycle confirmation.",
      },
      {
        category: "client_save",
        title: "Retained at-risk account (discretionary save)",
        clientKey: "c3",
        amount: 750,
        status: "approved",
        periodLabel: "May 2026",
        documentation: "Save documented in account timeline; leadership approved discretionary award.",
      },
      {
        category: "high_value_stability",
        title: "High-value account kept stable (monthly)",
        clientKey: "c1",
        amount: 500,
        status: "paid",
        periodLabel: "May 2026",
        documentation: "Account remained green for full month; stability criteria met.",
      },
      {
        category: "clean_placement",
        title: "Clean placement / client success team standard (monthly)",
        clientKey: null,
        amount: 350,
        status: "eligible",
        periodLabel: "June 2026",
        documentation: "No escalations or compliance gaps for the period.",
      },
    ];
    for (const b of bonusEntries) {
      const cid = b.clientKey ? clientIds.get(b.clientKey) ?? null : null;
      await tx.insert(bonusEntriesTable).values({
        category: b.category,
        title: b.title,
        clientId: cid,
        amountCents: Math.round(b.amount * 100),
        status: b.status,
        periodLabel: b.periodLabel,
        documentation: b.documentation,
        createdByUserId: greggId,
        createdByLabel: "Gregg",
      });
    }

    const profitShares: {
      periodLabel: string;
      basis: string;
      amount: number;
      status: string;
      notes: string;
    }[] = [
      {
        periodLabel: "2026 (illustrative)",
        basis: "Illustrative figure based on retained-client revenue contribution. Not a guarantee.",
        amount: 12000,
        status: "illustrative",
        notes:
          "Awareness only. Any profit participation must be documented separately through company governance — this row does not create an entitlement.",
      },
      {
        periodLabel: "Q2 2026 (illustrative)",
        basis: "Quarter-scoped projection tied to expansion and monitoring conversions.",
        amount: 3000,
        status: "under_discussion",
        notes: "Discussion-stage projection; subject to leadership review and formal documentation.",
      },
    ];
    for (const p of profitShares) {
      await tx.insert(profitShareProjectionsTable).values({
        periodLabel: p.periodLabel,
        basis: p.basis,
        projectedAmountCents: Math.round(p.amount * 100),
        status: p.status,
        notes: p.notes,
      });
    }

    const qualifierSpecs: {
      name: string;
      licenseType: string;
      state: string;
      tradeClassification: string;
      availability: string;
      status: string;
      contact: string;
      notes: string;
    }[] = [
      {
        name: "Daniel Reyes",
        licenseType: "General Contractor (GC)",
        state: "TX",
        tradeClassification: "Commercial",
        availability: "available",
        status: "verified",
        contact: "d.reyes@example.com",
        notes: "Verified license; open to one additional engagement.",
      },
      {
        name: "Sandra Whitfield",
        licenseType: "Electrical (Master)",
        state: "FL",
        tradeClassification: "Electrical",
        availability: "engaged",
        status: "active",
        contact: "s.whitfield@example.com",
        notes: "Currently engaged on an active placement.",
      },
      {
        name: "Marcus Boateng",
        licenseType: "Mechanical / HVAC",
        state: "GA",
        tradeClassification: "Mechanical",
        availability: "available",
        status: "intake",
        contact: "m.boateng@example.com",
        notes: "Intake in progress; awaiting license verification documents.",
      },
    ];
    const qualifierIds = new Map<string, string>();
    for (const q of qualifierSpecs) {
      const inserted = await tx
        .insert(qualifiersTable)
        .values({
          name: q.name,
          licenseType: q.licenseType,
          state: q.state,
          tradeClassification: q.tradeClassification,
          availability: q.availability,
          status: q.status,
          contact: q.contact,
          notes: q.notes,
        })
        .returning();
      qualifierIds.set(q.name, inserted[0]!.id);
    }

    const placementSpecs: {
      clientKey: string | null;
      qualifierName: string | null;
      title: string;
      licenseType: string;
      state: string;
      tradeClassification: string;
      stage: string;
      status: string;
      timeline: string;
      budget: string;
      expectations: string;
      riskFlags: string;
      nextStep: string;
      missingInfo: string;
      targetDate: string | null;
    }[] = [
      {
        clientKey: "c1",
        qualifierName: "Daniel Reyes",
        title: "GC qualifier placement — TX commercial",
        licenseType: "General Contractor (GC)",
        state: "TX",
        tradeClassification: "Commercial",
        stage: "internal_review",
        status: "open",
        timeline: "Target placement within 30 days",
        budget: "$4k–6k / mo",
        expectations: "On-site availability 2 days/week; commercial project experience required.",
        riskFlags: "Confirm scope does not require leadership/legal sign-off before commitment.",
        nextStep: "Route fit summary to leadership for review.",
        missingInfo: "Awaiting client confirmation on project start date.",
        targetDate: iso(30),
      },
      {
        clientKey: "c2",
        qualifierName: "Marcus Boateng",
        title: "HVAC qualifier intake — GA",
        licenseType: "Mechanical / HVAC",
        state: "GA",
        tradeClassification: "Mechanical",
        stage: "fit_review",
        status: "open",
        timeline: "Exploratory — no firm date",
        budget: "TBD",
        expectations: "Residential + light commercial coverage.",
        riskFlags: "Qualifier license not yet verified.",
        nextStep: "Complete qualifier intake and verification.",
        missingInfo: "License verification documents outstanding.",
        targetDate: null,
      },
      {
        clientKey: "c3",
        qualifierName: "Sandra Whitfield",
        title: "Electrical qualifier — FL (placed)",
        licenseType: "Electrical (Master)",
        state: "FL",
        tradeClassification: "Electrical",
        stage: "placed",
        status: "placed",
        timeline: "Placed — renewal review in 6 months",
        budget: "$3.5k / mo",
        expectations: "Ongoing oversight; monthly check-ins.",
        riskFlags: "",
        nextStep: "Monitor relationship; schedule renewal review.",
        missingInfo: "",
        targetDate: iso(150),
      },
    ];
    for (const pl of placementSpecs) {
      const cid = pl.clientKey ? clientIds.get(pl.clientKey) ?? null : null;
      const qid = pl.qualifierName
        ? qualifierIds.get(pl.qualifierName) ?? null
        : null;
      await tx.insert(placementsTable).values({
        clientId: cid,
        qualifierId: qid,
        title: pl.title,
        licenseType: pl.licenseType,
        state: pl.state,
        tradeClassification: pl.tradeClassification,
        stage: pl.stage,
        status: pl.status,
        timeline: pl.timeline,
        budget: pl.budget,
        expectations: pl.expectations,
        riskFlags: pl.riskFlags,
        nextStep: pl.nextStep,
        missingInfo: pl.missingInfo,
        targetDate: pl.targetDate,
      });
    }

    const successPlanItems: {
      phase: string;
      title: string;
      description: string;
      completed: boolean;
      sortOrder: number;
    }[] = [
      {
        phase: "first_90",
        title: "Map the current-client portfolio",
        description: "Review every active account, owners, risk level, and cadence.",
        completed: true,
        sortOrder: 1,
      },
      {
        phase: "first_90",
        title: "Stand up the relationship cadence",
        description: "Establish touch frequency per account and log meaningful contact.",
        completed: true,
        sortOrder: 2,
      },
      {
        phase: "first_90",
        title: "Triage and route open escalations",
        description: "Clear the escalation backlog and confirm correct ownership.",
        completed: false,
        sortOrder: 3,
      },
      {
        phase: "first_90",
        title: "Build the expansion pipeline baseline",
        description: "Identify and stage near-term add-on and expansion opportunities.",
        completed: false,
        sortOrder: 4,
      },
      {
        phase: "first_90",
        title: "Establish the qualifier network intake process",
        description: "Document the placement intake, verification, and routing flow.",
        completed: false,
        sortOrder: 5,
      },
      {
        phase: "first_180",
        title: "Demonstrate measurable retention improvement",
        description: "Show stabilization of at-risk accounts vs. the 90-day baseline.",
        completed: false,
        sortOrder: 6,
      },
      {
        phase: "first_180",
        title: "Convert qualified expansion opportunities",
        description: "Move pipeline opportunities to collected, retained revenue.",
        completed: false,
        sortOrder: 7,
      },
      {
        phase: "first_180",
        title: "Operationalize the placement coordination lane",
        description: "Run repeatable placements through the qualifier network end-to-end.",
        completed: false,
        sortOrder: 8,
      },
      {
        phase: "first_180",
        title: "Establish reporting rhythm with leadership",
        description: "Deliver consistent KPI reporting across relationships, expansion, and placements.",
        completed: false,
        sortOrder: 9,
      },
    ];
    for (const item of successPlanItems) {
      await tx.insert(successPlanItemsTable).values({
        phase: item.phase,
        title: item.title,
        description: item.description,
        completed: item.completed,
        completedAt: item.completed
          ? new Date(Date.now() - 7 * 86_400_000)
          : null,
        sortOrder: item.sortOrder,
      });
    }
  });
}
