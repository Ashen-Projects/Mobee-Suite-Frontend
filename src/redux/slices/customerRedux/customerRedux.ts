import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { get, patch, post } from "../../../inteceptor";
import { dispatch } from "../../store";

export type Customer = {
  address: string | null;
  email: string | null;
  id: number;
  isActive: boolean;
  name: string;
  nic: string | null;
  phone: string | null;
  repairCount: number;
  saleCount: number;
  timestamp: number;
};

export type CustomerDetail = Customer & {
  repairs: Array<{
    deviceName: string;
    estimatedCost: string;
    finalCost: string;
    id: number;
    jobNo: string;
    locationName: string;
    serialImei: string | null;
    status: string;
    timestamp: number;
  }>;
  sales: Array<{
    discountAmount: string;
    id: number;
    invoiceNo: string;
    itemSummary: string;
    locationName: string;
    paidAmount: string;
    status: string;
    timestamp: number;
    totalAmount: string;
  }>;
};

export type CustomerInput = {
  address?: string | null;
  email?: string | null;
  name: string;
  nic?: string | null;
  phone: string;
};

export type CustomerListResponse = {
  items: Customer[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

type State = { error: string | null; items: Customer[]; pagination: CustomerListResponse["pagination"] };
const initialState: State = { error: null, items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } };

const slice = createSlice({
  initialState,
  name: "customers",
  reducers: {
    failed(state, action: PayloadAction<string>) { state.error = action.payload; },
    received(state, action: PayloadAction<CustomerListResponse>) {
      state.items = action.payload.items;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
  },
});

export default slice.reducer;

const fail = (error: unknown) => {
  dispatch(slice.actions.failed(error instanceof Error ? error.message : "Customer request failed."));
  throw error;
};

export const getCustomers = async (query: Record<string, unknown>): Promise<CustomerListResponse> => {
  try {
    const value = (await get<CustomerListResponse>("customers", query)).data;
    dispatch(slice.actions.received(value));
    return value;
  } catch (error) {
    return fail(error);
  }
};

export const getCustomer = async (id: number) => (await get<CustomerDetail>(`customers/${id}`)).data;

export const createCustomer = async (input: CustomerInput) =>
  (await post<Customer, CustomerInput>("customers", input, undefined, false)).data;

export const updateCustomer = async (id: number, input: Partial<CustomerInput>) =>
  (await patch<Customer, Partial<CustomerInput>>(`customers/${id}`, input, undefined, false)).data;

export const updateCustomerStatus = async (id: number, isActive: boolean) =>
  (await patch<Customer, { isActive: boolean }>(`customers/${id}/status`, { isActive }, undefined, false)).data;
