import { get } from "../../../inteceptor";

export type StockIdentifier = { id: number; isPrimary: boolean; type: "imei" | "serial"; value: string };
export type StockUnit = { id: number; barcode: string | null; costPrice: string; grnId: number | null; grnNumber: string | null; locationId: number | null; locationName: string | null; productId: number | null; productName: string | null; productSku: string | null; statusId: number | null; statusName: string | null; statusLabel: string | null; timestamp: number; identifiers: StockIdentifier[] };
export type StockProductSummary = { averageCost: string; lastAddedAt: number; locationId: number | null; locationName: string | null; productId: number | null; productMrpPrice: string | null; productName: string | null; productSku: string | null; quantity: number; statusId: number | null; statusName: string | null; statusLabel: string | null };
export type StockList = { items: StockProductSummary[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } };
export type StockUnitList = { items: StockUnit[]; pagination: StockList["pagination"] };
export type StockStatus = { id: number; name: string; label: string; isSellable: boolean };
export type PendingStockReceipt = { grnId: number; grnNumber: string; locationId: number; locationName: string; supplierId: number; supplierCode: string; supplierName: string; timestamp: number; totalQuantity: number; remainingQuantity: number };
export type PendingStockReceiptList = { items: PendingStockReceipt[]; pagination: StockList["pagination"] };
export type StockOverview = { totalUnits: number; sellableUnits: number; unavailableUnits: number; pendingStockUnits: number; pendingReceiptCount: number; statuses: Array<{ statusId: number | null; statusName: string | null; statusLabel: string | null; isSellable: boolean | null; count: number }>; locations: Array<{ locationId: number | null; locationName: string | null; count: number }> };
export type StockAvailabilityCheck = {
  found: boolean;
  item?: StockUnit & {
    averageCost: string;
    identifierType: "barcode" | "imei" | "serial" | null;
    identifierValue: string | null;
    isSellable: boolean | null;
    productMrpPrice: string | null;
    stockId: number;
  };
  message: string;
  query: string;
};

export const getStockOverview = async () => (await get<StockOverview>("stock/overview")).data;
export const getStock = async (query: Record<string, unknown>) => (await get<StockList>("stock", query)).data;
export const getStockUnits = async (productId: number, query: Record<string, unknown>) => (await get<StockUnitList>(`stock/products/${productId}/units`, query)).data;
export const getStockStatuses = async () => (await get<StockStatus[]>("stock/statuses")).data;
export const getPendingStockReceipts = async (query: Record<string, unknown>) => (await get<PendingStockReceiptList>("stock/pending-receipts", query)).data;
export const checkStockAvailability = async (code: string) => (await get<StockAvailabilityCheck>("stock/availability-check", { code })).data;
