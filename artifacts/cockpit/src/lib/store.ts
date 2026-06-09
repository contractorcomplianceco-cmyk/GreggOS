import { useQueryClient } from "@tanstack/react-query";
import {
  useListClients,
  useListCallNotes,
  useListTasks,
  useListSignals,
  useListEscalations,
  useCreateClient,
  useUpdateClient,
  useCreateCallNote,
  useUpdateCallNote,
  useCreateTask,
  useUpdateTask,
  useUpdateSignal,
  useUpdateEscalation,
  useProcessCallNote,
  useResetToSeed,
  useUpsertCrmLink,
  useUpdateCrmLink,
} from "@workspace/api-client-react";
import type {
  ClientInput,
  ClientUpdate,
  NoteInput,
  NoteUpdate,
  TaskInput,
  TaskUpdate,
  SignalUpdate,
  EscalationUpdate,
  ProcessNoteInput,
  CrmLinkInput,
  CrmLinkUpdate,
} from "@workspace/api-client-react";
import {
  CurrentClient,
  CallNote,
  Task,
  OpportunitySignal,
  Escalation,
  CallType,
  CallNoteStatus,
  Priority,
  RiskLevel,
  SignalType,
  EscalationReason,
} from "./types";

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

/**
 * Drop-in replacement for the former Zustand store. Data now lives server-side
 * (Postgres via the api-server); reads use generated React Query list hooks and
 * writes use generated mutation hooks. Every mutation invalidates the cache so
 * derived data (client counters, etc.) refreshes from the server.
 */
export function useStore() {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries();
  };
  const mOpts = { mutation: { onSuccess: invalidate } };

  const clientsQ = useListClients();
  const notesQ = useListCallNotes();
  const tasksQ = useListTasks();
  const signalsQ = useListSignals();
  const escalationsQ = useListEscalations();

  const createClientM = useCreateClient(mOpts);
  const updateClientM = useUpdateClient(mOpts);
  const createNoteM = useCreateCallNote(mOpts);
  const updateNoteM = useUpdateCallNote(mOpts);
  const createTaskM = useCreateTask(mOpts);
  const updateTaskM = useUpdateTask(mOpts);
  const updateSignalM = useUpdateSignal(mOpts);
  const updateEscalationM = useUpdateEscalation(mOpts);
  const processNoteM = useProcessCallNote(mOpts);
  const resetM = useResetToSeed(mOpts);
  const upsertCrmLinkM = useUpsertCrmLink(mOpts);
  const updateCrmLinkM = useUpdateCrmLink(mOpts);

  return {
    clients: (clientsQ.data ?? []) as unknown as CurrentClient[],
    callNotes: (notesQ.data ?? []) as unknown as CallNote[],
    tasks: (tasksQ.data ?? []) as unknown as Task[],
    signals: (signalsQ.data ?? []) as unknown as OpportunitySignal[],
    escalations: (escalationsQ.data ?? []) as unknown as Escalation[],

    isLoading:
      clientsQ.isLoading ||
      notesQ.isLoading ||
      tasksQ.isLoading ||
      signalsQ.isLoading ||
      escalationsQ.isLoading,

    addClient: (client: Partial<CurrentClient> & { clientName: string }) =>
      createClientM.mutateAsync({ data: client as unknown as ClientInput }),
    updateClient: (id: string, updates: Partial<CurrentClient>) =>
      updateClientM.mutateAsync({
        clientId: id,
        data: updates as unknown as ClientUpdate,
      }),

    addCallNote: (note: Partial<CallNote> & { clientId: string }) =>
      createNoteM.mutateAsync({ data: note as unknown as NoteInput }),
    updateCallNote: (id: string, updates: Partial<CallNote>) =>
      updateNoteM.mutateAsync({
        noteId: id,
        data: updates as unknown as NoteUpdate,
      }),

    addTask: (task: Partial<Task> & { clientId: string; title: string }) =>
      createTaskM.mutateAsync({ data: task as unknown as TaskInput }),
    updateTask: (id: string, updates: Partial<Task>) =>
      updateTaskM.mutateAsync({
        taskId: id,
        data: updates as unknown as TaskUpdate,
      }),

    updateSignal: (id: string, updates: Partial<OpportunitySignal>) =>
      updateSignalM.mutateAsync({
        signalId: id,
        data: updates as unknown as SignalUpdate,
      }),

    updateEscalation: (id: string, updates: Partial<Escalation>) =>
      updateEscalationM.mutateAsync({
        escalationId: id,
        data: updates as unknown as EscalationUpdate,
      }),

    saveProcessedNote: (payload: ProcessedNotePayload) => {
      const data: ProcessNoteInput = {
        id: payload.id ?? null,
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
        owner: payload.nextOwner,
        dueDate: payload.dueDate,
        priority: payload.priority,
        signalType: payload.signalType,
        escalationReason: payload.escalationReason,
        riskLevel: payload.riskLevel,
      };
      return processNoteM.mutateAsync({ data });
    },

    approveForCrm: (input: CrmLinkInput) =>
      upsertCrmLinkM.mutateAsync({ data: input }),
    updateCrmLink: (linkId: string, updates: CrmLinkUpdate) =>
      updateCrmLinkM.mutateAsync({ linkId, data: updates }),

    resetData: () => resetM.mutateAsync(),
  };
}
