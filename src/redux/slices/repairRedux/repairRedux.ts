import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { deleteMethod, get, patch, post } from "../../../inteceptor";
import { dispatch } from "../../store";
import { deleteMediaImage, uploadMediaImage, type MediaImageAsset } from "../../../utils/mediaImageUpload";

export type RepairStatus = "received" | "inspection" | "waitingParts" | "inProgress" | "completed" | "delivered" | "cancelled";
export type RepairPaymentMethod = "cash" | "card" | "bankTransfer" | "mobile";
export type RepairPaymentStatus = "unpaid" | "partiallyPaid" | "paid";
export type RepairPartStatus = "reserved" | "consumed" | "released";

export type RepairPhotoAsset = MediaImageAsset;

export type RepairPhotoInput = { cloudinaryPublicId: string; fileName: string };

export type RepairDocument = {
  documentType: "intakePhoto" | "inspectionPhoto" | "estimate" | "approval" | "repairPhoto" | "deliveryProof" | "other";
  fileName: string;
  fileUrl: string;
  id: number;
  timestamp: number;
};

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
  balance: number;
  locationId: number;
  problemDescription: string;
  publicStatusPath: string;
  publicStatusToken: string;
  documents: RepairDocument[];
  history: Array<{ id: number; newStatus: string; note: string | null; oldStatus: string | null; timestamp: number; userName: string }>;
  parts: RepairPart[];
  paymentStatus: RepairPaymentStatus;
  payments: RepairPayment[];
  totalPaid: number;
};

export type RepairPayment = {
  amount: string;
  drawerId: number | null;
  id: number;
  method: RepairPaymentMethod;
  receivedBy: number;
  receivedByName: string;
  referenceNo: string | null;
  timestamp: number;
};

export type RepairPart = {
  barcode: string | null;
  consumedAt: number | null;
  description: string;
  id: number;
  productId: number | null;
  productName: string | null;
  releasedAt: number | null;
  status: RepairPartStatus;
  stockId: number | null;
  timestamp: number;
};

export type RepairPaymentResult = {
  detail: RepairJobDetail;
  payment: RepairPayment;
};

export type RepairJobInput = {
  assignedTo?: number | null;
  customer: { id?: number; name?: string; phone?: string };
  deviceName: string;
  estimatedCost: number;
  intakePhotos?: RepairPhotoInput[];
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
  inspectionPhotos: Array<{ fileUrl: string; timestamp: number }>;
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

export const updateRepairJobStatus = async (id: number, input: { inspectionPhotos?: RepairPhotoInput[]; note?: string; status: RepairStatus }) =>
  (await patch<RepairJobDetail, typeof input>(`repairs/${id}/status`, input, undefined, false)).data;

export const updateRepairCharge = async (id: number, input: { finalCost: number }) =>
  (await patch<RepairJobDetail, typeof input>(`repairs/${id}/charge`, input, undefined, false)).data;

export const addRepairPart = async (id: number, input: { barcode: string }) =>
  (await post<RepairJobDetail, typeof input>(`repairs/${id}/parts`, input, undefined, false)).data;

export const releaseRepairPart = async (id: number, partId: number) =>
  (await deleteMethod<RepairJobDetail, Record<string, never>>(`repairs/${id}/parts/${partId}`, {}, undefined, false)).data;

export const collectRepairPayment = async (id: number, input: { amount: number; method: RepairPaymentMethod; referenceNo?: string }) =>
  (await post<RepairPaymentResult, typeof input>(`repairs/${id}/payments`, input, undefined, false)).data;

export const uploadRepairImage = async (file: File): Promise<{ publicId: string; url: string }> => {
  return uploadMediaImage(file, "mobee/repairs");
};

export const deleteRepairImageUpload = async (publicId: string): Promise<void> => {
  await deleteMediaImage("mobee/repairs", publicId);
};

export const getPublicRepairStatus = async (query: { jobNo: string; token: string }) =>
  (await get<PublicRepairStatus>("repair-status", query, undefined, undefined, { trackLoading: false })).data;
