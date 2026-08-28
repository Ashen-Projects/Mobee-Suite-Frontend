import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { get, patch, post, put } from "../../../inteceptor";
import { dispatch } from "../../store";

export type SupplierProduct = {
  id: number;
  isActive: boolean;
  isPreferred: boolean;
  lastPurchasingPrice: string | null;
  leadTimeDays: number | null;
  minimumOrderQty: number;
  productId: number;
  productName: string;
  productSku: string | null;
  quotedPrice: string | null;
  supplierProductCode: string | null;
  supplierProductName: string | null;
  timestamp: number;
};

export type Supplier = {
  address: string | null;
  code: string;
  contactPerson: string | null;
  creditLimit: string;
  email: string | null;
  id: number;
  isActive: boolean;
  name: string;
  paymentTermDays: number;
  phone: string | null;
  productCount: number;
  timestamp: number;
};

export type SupplierDetail = Supplier & { products: SupplierProduct[] };
export type SupplierInput = {
  address: string | null;
  code: string;
  contactPerson: string | null;
  creditLimit: number;
  email: string | null;
  isActive: boolean;
  name: string;
  paymentTermDays: number;
  phone: string | null;
};
export type SupplierProductInput = {
  isActive: boolean;
  isPreferred: boolean;
  lastPurchasingPrice: number | null;
  leadTimeDays: number | null;
  minimumOrderQty: number;
  quotedPrice: number | null;
  supplierProductCode: string | null;
  supplierProductName: string | null;
};
export type SupplierListResponse = {
  items: Supplier[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

type SupplierState = {
  current: SupplierDetail | null;
  error: string | null;
  items: Supplier[];
  pagination: SupplierListResponse["pagination"];
};

const initialState: SupplierState = {
  current: null,
  error: null,
  items: [],
  pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
};

const slice = createSlice({
  name: "supplier",
  initialState,
  reducers: {
    currentReceived(state, action: PayloadAction<SupplierDetail>) { state.current = action.payload; state.error = null; },
    failed(state, action: PayloadAction<string>) { state.error = action.payload; },
    suppliersReceived(state, action: PayloadAction<SupplierListResponse>) {
      state.items = action.payload.items;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
  },
});

export default slice.reducer;

const report = (error: unknown) => dispatch(slice.actions.failed(error instanceof Error ? error.message : "Supplier request failed."));
const detailRequest = async (request: Promise<{ data: SupplierDetail }>) => {
  try { const response = await request; dispatch(slice.actions.currentReceived(response.data)); return response.data; }
  catch (error) { report(error); throw error; }
};

export const getSuppliers = async (query: Record<string, unknown>): Promise<SupplierListResponse> => {
  try {
    const response = await get<SupplierListResponse>("suppliers", query);
    dispatch(slice.actions.suppliersReceived(response.data));
    return response.data;
  } catch (error) { report(error); throw error; }
};

export const getSupplier = (id: number) => detailRequest(get<SupplierDetail>(`suppliers/${id}`));
export const reserveSupplierCode = async (): Promise<{ code: string }> => {
  try {
    const response = await post<{ code: string }, Record<string, never>>("suppliers/reserve-code", {}, undefined, false);
    return response.data;
  } catch (error) { report(error); throw error; }
};
export const createSupplier = (input: SupplierInput) => detailRequest(post<SupplierDetail, SupplierInput>("suppliers", input, undefined, false));
export const updateSupplier = (id: number, input: Omit<SupplierInput, "isActive">) => detailRequest(patch<SupplierDetail>(`suppliers/${id}`, input, undefined, false));
export const updateSupplierStatus = (id: number, isActive: boolean) => detailRequest(patch<SupplierDetail>(`suppliers/${id}/status`, { isActive }, undefined, false));
export const upsertSupplierProduct = (supplierId: number, productId: number, input: SupplierProductInput) => detailRequest(put<SupplierDetail>(`suppliers/${supplierId}/products/${productId}`, input, undefined, false));
export const updateSupplierProductStatus = (supplierId: number, productId: number, isActive: boolean) => detailRequest(patch<SupplierDetail>(`suppliers/${supplierId}/products/${productId}/status`, { isActive }, undefined, false));
