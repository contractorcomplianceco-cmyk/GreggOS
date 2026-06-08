import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CurrentClient,
  CallNote,
  Task,
  OpportunitySignal,
  Escalation,
  CallNoteStatus,
  CallType,
  Priority,
  RiskLevel,
  SignalType,
  EscalationReason,
} from './types';
import { seedClients, seedNotes, seedTasks, seedSignals, seedEscalations } from './seed';

export interface ProcessedNotePayload {
  id?: string;
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
  nextOwner: string;
  dueDate: string;
  priority: Priority;
  signalType: SignalType;
  escalationReason: EscalationReason;
  riskLevel: RiskLevel;
}

interface AppState {
  clients: CurrentClient[];
  callNotes: CallNote[];
  tasks: Task[];
  signals: OpportunitySignal[];
  escalations: Escalation[];

  addClient: (client: CurrentClient) => void;
  updateClient: (id: string, updates: Partial<CurrentClient>) => void;
  
  addCallNote: (note: CallNote) => void;
  updateCallNote: (id: string, updates: Partial<CallNote>) => void;

  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;

  addSignal: (signal: OpportunitySignal) => void;
  updateSignal: (id: string, updates: Partial<OpportunitySignal>) => void;

  addEscalation: (escalation: Escalation) => void;
  updateEscalation: (id: string, updates: Partial<Escalation>) => void;

  saveProcessedNote: (payload: ProcessedNotePayload) => string;

  resetData: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      clients: seedClients,
      callNotes: seedNotes,
      tasks: seedTasks,
      signals: seedSignals,
      escalations: seedEscalations,

      addClient: (client) => set((state) => ({ clients: [...state.clients, client] })),
      updateClient: (id, updates) => set((state) => ({
        clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      })),

      addCallNote: (note) => set((state) => ({ callNotes: [...state.callNotes, note] })),
      updateCallNote: (id, updates) => set((state) => ({
        callNotes: state.callNotes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      })),

      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      })),

      addSignal: (signal) => set((state) => ({ signals: [...state.signals, signal] })),
      updateSignal: (id, updates) => set((state) => ({
        signals: state.signals.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      })),

      addEscalation: (escalation) => set((state) => ({ escalations: [...state.escalations, escalation] })),
      updateEscalation: (id, updates) => set((state) => ({
        escalations: state.escalations.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      })),

      saveProcessedNote: (payload) => {
        const now = new Date().toISOString();
        const stamp = Date.now();
        const existing = payload.id
          ? get().callNotes.find((n) => n.id === payload.id)
          : undefined;
        const noteId = existing ? existing.id : `n_${stamp}`;

        set((state) => {
          const note: CallNote = {
            id: noteId,
            clientId: payload.clientId,
            callDate: payload.callDate,
            caller: payload.caller,
            callType: payload.callType,
            rawRingCentralNote: payload.rawRingCentralNote,
            cleanSummary: payload.cleanSummary,
            clientConcern: payload.clientConcern,
            commitmentsMade: payload.commitmentsMade,
            missingInformation: payload.missingInformation,
            nextActions: payload.nextActions,
            opportunitySignals: payload.opportunitySignals,
            escalationFlags: payload.escalationFlags,
            routingStatus: payload.routingStatus,
            crmReadyNote: payload.crmReadyNote,
            clientFollowUpDraft: payload.clientFollowUpDraft,
            taskList: payload.taskList,
            createdAt: existing ? existing.createdAt : now,
            updatedAt: now,
          };

          const callNotes = existing
            ? state.callNotes.map((n) => (n.id === noteId ? note : n))
            : [...state.callNotes, note];

          // Regenerate downstream artifacts derived from this note.
          const tasks = state.tasks.filter((t) => t.sourceCallNoteId !== noteId);
          const signals = state.signals.filter((s) => s.sourceCallNoteId !== noteId);
          const escalations = state.escalations.filter((e) => e.sourceCallNoteId !== noteId);

          const owner = payload.nextOwner || 'Gregg';
          const hasOpportunity =
            !!payload.opportunitySignals.trim() && payload.opportunitySignals.trim() !== 'None';
          const hasEscalation =
            !!payload.escalationFlags.trim() && payload.escalationFlags.trim() !== 'None';

          const actionItems = payload.nextActions
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean);

          actionItems.forEach((title, i) => {
            tasks.push({
              id: `t_${stamp}_${i}`,
              clientId: payload.clientId,
              sourceCallNoteId: noteId,
              title,
              owner,
              dueDate: payload.dueDate,
              priority: payload.priority,
              status: 'Open',
              escalationFlag: hasEscalation,
              notes: '',
            });
          });

          if (hasOpportunity) {
            signals.push({
              id: `s_${stamp}`,
              clientId: payload.clientId,
              sourceCallNoteId: noteId,
              type: payload.signalType,
              description: payload.opportunitySignals,
              status: 'Open',
              routedTo: owner,
              createdAt: now,
            });
          }

          if (hasEscalation) {
            escalations.push({
              id: `e_${stamp}`,
              clientId: payload.clientId,
              sourceCallNoteId: noteId,
              reason: payload.escalationReason,
              riskLevel: payload.riskLevel,
              routedTo: 'Gregg',
              decisionNeeded: payload.escalationFlags,
              deadline: payload.dueDate,
              status: 'Open',
            });
          }

          const clients = state.clients.map((c) => {
            if (c.id !== payload.clientId) return c;
            return {
              ...c,
              nextAction: actionItems[0] || c.nextAction,
              nextOwner: owner,
              dueDate: payload.dueDate || c.dueDate,
              missingInformation: payload.missingInformation || 'None',
              lastMeaningfulContact: payload.callDate,
              openTasks: tasks.filter(
                (t) => t.clientId === c.id && t.status !== 'Completed' && t.status !== 'Canceled'
              ).length,
              opportunitySignals: signals.filter((s) => s.clientId === c.id && s.status === 'Open')
                .length,
              escalations: escalations.filter((e) => e.clientId === c.id && e.status !== 'Resolved')
                .length,
              callNotes: callNotes.filter((n) => n.clientId === c.id).length,
            };
          });

          return { callNotes, tasks, signals, escalations, clients };
        });

        return noteId;
      },

      resetData: () => set({
        clients: seedClients,
        callNotes: seedNotes,
        tasks: seedTasks,
        signals: seedSignals,
        escalations: seedEscalations,
      })
    }),
    {
      name: 'cockpit-storage',
      version: 2,
    }
  )
);
