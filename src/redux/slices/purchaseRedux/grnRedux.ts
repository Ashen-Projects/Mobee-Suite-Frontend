import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { get, post } from "../../../inteceptor";
import { dispatch } from "../../store";

export type GrnStatus = "pendingCountApproval" | "pendingFinanceApproval" | "approved" | "declined";
export type GrnUnit = { barcode?: string; generateBarcode?: boolean; identifiers?: Array<{ isPrimary?: boolean; type: "imei" | "serial"; value: string }> };
export type GrnInput = { purchaseOrderId: number; supplierDeliveryNote?: string; note?: string; documents?: Array<{ documentType: string; fileName: string; fileUrl: string }>; items: Array<{ purchaseOrderItemId: number; quantity: number; unitCost: number }> };
export type GrnStockInput = {
  items: Array<{ grnItemId: number; units: GrnUnit[] }>;
  priceUpdates?: Array<{ lowestSellingPrice: number; mrpPrice: number; productId: number }>;
};
export type Grn = { id: number; grnNumber: string; purchaseOrderId: number; poNumber: string; supplierId: number; supplierCode: string; supplierName: string; locationId: number; locationName: string; supplierDeliveryNote: string | null; status: GrnStatus; paymentStatus: string; costTotal: string; timestamp: number; addedBy: number; addedByName: string; itemCount: number; totalQuantity: number };
export type GrnDetail = Omit<Grn, "itemCount" | "totalQuantity"> & { note: string | null; paidAmount: string; countedBy: number | null; countedByName: string | null; counted2By: number | null; counted2ByName: string | null; financeApprovedBy: number | null; financeApprovedByName: string | null; counts: Array<{ id: number; countNumber: "first" | "second"; countedBy: number; isMatched: boolean; timestamp: number }>; documents: Array<{ id: number; documentType: string; fileName: string; fileUrl: string; timestamp: number; uploadedBy: number }>; history: Array<{ id: number; action: string; note: string | null; newStatus: string | null; previousStatus: string | null; timestamp: number; userId: number }>; items: Array<{ id: number; purchaseOrderItemId: number; productId: number; productName: string; productSku: string | null; lowestSellingPrice: string; mrpPrice: string; quantity: number; stockedQuantity: number; unitCost: string; totalAmount: string; units: Array<{ id: number; barcode: string | null; costPrice: string; status: string; statusLabel: string; identifiers: Array<{ id: number; type: "imei" | "serial"; value: string; isPrimary: boolean }> }> }> };
export type GrnList = { items: Grn[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } };
type State = { current: GrnDetail | null; error: string | null; items: Grn[]; pagination: GrnList["pagination"] };
const initialState: State = { current: null, error: null, items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } };
const slice = createSlice({ name: "grn", initialState, reducers: {
  currentReceived(state, action: PayloadAction<GrnDetail>) { state.current = action.payload; state.error = null; },
  failed(state, action: PayloadAction<string>) { state.error = action.payload; },
  listReceived(state, action: PayloadAction<GrnList>) { state.items = action.payload.items; state.pagination = action.payload.pagination; state.error = null; },
} });
export default slice.reducer;
const report = (error: unknown): never => { dispatch(slice.actions.failed(error instanceof Error ? error.message : "GRN request failed.")); throw error; };
export const getGrns = async (query: Record<string, unknown>): Promise<GrnList> => { try { const value = (await get<GrnList>("grns", query)).data; dispatch(slice.actions.listReceived(value)); return value; } catch (error) { return report(error); } };
export const getGrn = async (id: number): Promise<GrnDetail> => { try { const value = (await get<GrnDetail>(`grns/${id}`)).data; dispatch(slice.actions.currentReceived(value)); return value; } catch (error) { return report(error); } };
export const createGrn = async (input: GrnInput) => (await post<GrnDetail, GrnInput>("grns", input, undefined, false)).data;
export const verifyGrnCount = async (id: number, countNumber: "first" | "second", items: Array<{ grnItemId: number; countedQuantity: number }>) => (await post<GrnDetail, { countNumber: "first" | "second"; items: Array<{ grnItemId: number; countedQuantity: number }> }>(`grns/${id}/counts`, { countNumber, items }, undefined, false)).data;
export const decideGrnFinance = async (id: number, status: "approved" | "declined", note?: string) => (await post<GrnDetail, { status: "approved" | "declined"; note?: string }>(`grns/${id}/finance-decision`, { status, note }, undefined, false)).data;
export const addGrnStock = async (id: number, input: GrnStockInput) => (await post<GrnDetail, GrnStockInput>(`grns/${id}/add-to-stock`, input, undefined, false)).data;
export const addGrnDocuments = async (id: number, documents: Array<{ documentType: string; fileName: string; fileUrl: string }>) => (await post<GrnDetail, { documents: Array<{ documentType: string; fileName: string; fileUrl: string }> }>(`grns/${id}/documents`, { documents }, undefined, false)).data;
export const addGrnNote = async (id: number, note: string) => (await post<GrnDetail, { note: string }>(`grns/${id}/notes`, { note }, undefined, false)).data;
