import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { get, patch, post } from "../../../inteceptor";
import { dispatch } from "../../store";

export type PurchaseOrderStatus = { id: number; isFinal: boolean; label: string; name: string; priority: number };
export type PurchaseOrderItemInput = { productId: number; quantity: number; unitPrice: number };
export type PurchaseOrder = { id: number; itemCount: number; locationId: number; locationName: string; poNumber: string; status: string; statusLabel: string; supplierCode: string; supplierId: number; supplierName: string; timestamp: number; totalAmount: string; totalQuantity: number; userId: number; userName: string };
export type PurchaseOrderDetail = Omit<PurchaseOrder, "itemCount" | "totalQuantity"> & { statusId: number; items: Array<{ id: number; productId: number; productName: string; productSku: string | null; quantity: number; receivedQuantity: number; supplierProductCode: string | null; supplierProductId: number; totalAmount: string; unitPrice: string }>; logs: Array<{ action: string; id: number; newStatus: number; note: string | null; previousStatus: number | null; timestamp: number; userId: number; userName: string }> };
export type PurchaseOrderInput = { items: PurchaseOrderItemInput[]; locationId: number; note?: string; supplierId: number };
export type PurchaseOrderList = { items: PurchaseOrder[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } };
type State = { current: PurchaseOrderDetail | null; error: string | null; items: PurchaseOrder[]; pagination: PurchaseOrderList["pagination"]; statuses: PurchaseOrderStatus[] };
const initialState: State = { current: null, error: null, items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 }, statuses: [] };
const slice = createSlice({ name: "purchaseOrder", initialState, reducers: {
  currentReceived(state, action: PayloadAction<PurchaseOrderDetail>) { state.current = action.payload; state.error = null; },
  failed(state, action: PayloadAction<string>) { state.error = action.payload; },
  ordersReceived(state, action: PayloadAction<PurchaseOrderList>) { state.items = action.payload.items; state.pagination = action.payload.pagination; state.error = null; },
  statusesReceived(state, action: PayloadAction<PurchaseOrderStatus[]>) { state.statuses = action.payload; state.error = null; },
} });
export default slice.reducer;
const report = (error: unknown): never => { dispatch(slice.actions.failed(error instanceof Error ? error.message : "Purchase order request failed.")); throw error; };
export const getPurchaseOrders = async (query: Record<string, unknown>): Promise<PurchaseOrderList> => { try { const value = (await get<PurchaseOrderList>("purchase-orders", query)).data; dispatch(slice.actions.ordersReceived(value)); return value; } catch (error) { return report(error); } };
export const getPurchaseOrderStatuses = async () => { try { const value = (await get<PurchaseOrderStatus[]>("purchase-orders/statuses")).data; dispatch(slice.actions.statusesReceived(value)); return value; } catch (error) { return report(error); } };
export const getPurchaseOrder = async (id: number) => { try { const value = (await get<PurchaseOrderDetail>(`purchase-orders/${id}`)).data; dispatch(slice.actions.currentReceived(value)); return value; } catch (error) { return report(error); } };
export const createPurchaseOrder = async (input: PurchaseOrderInput) => (await post<PurchaseOrderDetail, PurchaseOrderInput>("purchase-orders", input, undefined, false)).data;
export const updatePurchaseOrder = async (id: number, input: Partial<PurchaseOrderInput>) => (await patch<PurchaseOrderDetail>(`purchase-orders/${id}`, input, undefined, false)).data;
export const transitionPurchaseOrder = async (id: number, action: "submit" | "approve" | "reject" | "order" | "cancel", note?: string) => (await post<PurchaseOrderDetail, { note?: string }>(`purchase-orders/${id}/${action}`, note ? { note } : {}, undefined, false)).data;
