import { get } from "../../../inteceptor";

export type StockIdentifier = { id: number; isPrimary: boolean; type: "imei" | "serial"; value: string };
export type StockUnit = { id: number; barcode: string | null; costPrice: string; grnId: number | null; grnNumber: string | null; locationId: number | null; locationName: string | null; productId: number | null; productName: string | null; productSku: string | null; statusId: number | null; statusName: string | null; statusLabel: string | null; timestamp: number; identifiers: StockIdentifier[] };
export type StockList = { items: StockUnit[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } };
export type StockStatus = { id: number; name: string; label: string; isSellable: boolean };
export type PendingStockReceipt = { grnId: number; grnNumber: string; locationId: number; locationName: string; supplierId: number; supplierCode: string; supplierName: string; timestamp: number; totalQuantity: number; remainingQuantity: number };
export type PendingStockReceiptList = { items: PendingStockReceipt[]; pagination: StockList["pagination"] };
export type StockOverview = { totalUnits: number; sellableUnits: number; unavailableUnits: number; pendingStockUnits: number; pendingReceiptCount: number; statuses: Array<{ statusId: number | null; statusName: string | null; statusLabel: string | null; isSellable: boolean | null; count: number }>; locations: Array<{ locationId: number | null; locationName: string | null; count: number }> };

export const getStockOverview = async () => (await get<StockOverview>("stock/overview")).data;
export const getStock = async (query: Record<string, unknown>) => (await get<StockList>("stock", query)).data;
export const getStockStatuses = async () => (await get<StockStatus[]>("stock/statuses")).data;
export const getPendingStockReceipts = async (query: Record<string, unknown>) => (await get<PendingStockReceiptList>("stock/pending-receipts", query)).data;
