import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { get, patch, post } from "../../../inteceptor";
import { dispatch } from "../../store";

export type RepairStatus = "received" | "inspection" | "waitingParts" | "inProgress" | "completed" | "delivered" | "cancelled";

export type RepairJobListItem = {
  customerName: string;
  customerPhone: string | null;
  deviceName: string;
  estimatedCost: string;
  id: number;
  jobNo: string;
  locationName: string;
  serialImei: string | null;
  status: RepairStatus;
  timestamp: number;
};

export type RepairJobDetail = RepairJobListItem & {
  addedBy: number;
  assignedTo: number | null;
  assignedToName: string | null;
  customerId: number;
  finalCost: string;
  locationId: number;
  problemDescription: string;
  publicStatusPath: string;
  publicStatusToken: string;
  history: Array<{ id: number; newStatus: string; note: string | null; oldStatus: string | null; timestamp: number; userName: string }>;
};

export type RepairJobInput = {
  assignedTo?: number | null;
  customer: { id?: number; name?: string; phone?: string };
  deviceName: string;
  estimatedCost: number;
  problemDescription: string;
  serialImei?: string | null;
};

export type RepairListResponse = {
  items: RepairJobListItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export type PublicRepairStatus = {
  deviceName: string;
  estimatedCost: string;
  jobNo: string;
  locationName: string;
  serialImei: string | null;
  status: RepairStatus;
  statusLabel: string;
  timestamp: number;
  timeline: Array<{ active: boolean; completed: boolean; label: string; status: RepairStatus; timestamp: number | null }>;
};

type State = { error: string | null; items: RepairJobListItem[]; pagination: RepairListResponse["pagination"] };
const initialState: State = { error: null, items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } };

const slice = createSlice({
  initialState,
  name: "repairs",
  reducers: {
    failed(state, action: PayloadAction<string>) { state.error = action.payload; },
    received(state, action: PayloadAction<RepairListResponse>) {
      state.items = action.payload.items;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
  },
});

export default slice.reducer;

const fail = (error: unknown) => {
  dispatch(slice.actions.failed(error instanceof Error ? error.message : "Repair request failed."));
  throw error;
};

export const getRepairJobs = async (query: Record<string, unknown>): Promise<RepairListResponse> => {
  try {
    const value = (await get<RepairListResponse>("repairs", query)).data;
    dispatch(slice.actions.received(value));
    return value;
  } catch (error) {
    return fail(error);
  }
};

export const getRepairJob = async (id: number) => (await get<RepairJobDetail>(`repairs/${id}`)).data;

export const createRepairJob = async (input: RepairJobInput) =>
  (await post<RepairJobDetail, RepairJobInput>("repairs", input, undefined, false)).data;

export const updateRepairJobStatus = async (id: number, input: { note?: string; status: RepairStatus }) =>
  (await patch<RepairJobDetail, typeof input>(`repairs/${id}/status`, input, undefined, false)).data;

export const getPublicRepairStatus = async (query: { jobNo: string; token: string }) =>
  (await get<PublicRepairStatus>("repair-status", query, undefined, undefined, { trackLoading: false })).data;
