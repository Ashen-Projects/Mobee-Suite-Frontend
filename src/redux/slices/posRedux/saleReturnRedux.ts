import { get, post } from "../../../inteceptor";
import type { PaymentMethod, SalePaymentInput } from "./saleRedux";

export type ReturnLookup = {
  sale: { customerId: number | null; customerName: string | null; customerPhone: string | null; daysRemaining: number; id: number; invoiceNo: string; timestamp: number };
  items: Array<{ barcode: string | null; eligible: boolean; productId: number; productName: string; productSku: string | null; returnAmount: number; saleItemId: number; stockId: number }>;
};

export type SaleExchange = {
  balanceAmount: string;
  createdByName: string;
  customerName: string | null;
  customerPhone: string | null;
  exchangeTotal: string;
  id: number;
  locationName: string;
  originalInvoiceNo: string;
  originalSaleId: number;
  payments: Array<{ amount: string; method: PaymentMethod; referenceNo: string | null }>;
  reason: string;
  replacements: Array<{ barcode: string | null; productName: string; productSku: string | null; stockId: number; totalAmount: string; unitPrice: string }>;
  returnNo: string;
  returnedItems: Array<{ barcode: string | null; condition: string; disposition: "restock" | "damage"; productName: string; productSku: string | null; refundAmount: string; stockId: number | null }>;
  status: string;
  timestamp: number;
  totalAmount: string;
};

export type SaleExchangeInput = {
  originalSaleId: number;
  payments: SalePaymentInput[];
  reason: string;
  replacementStockIds: number[];
  returnedItems: Array<{ disposition: "restock" | "damage"; stockId: number }>;
};

export type SaleExchangeListResponse = { items: Array<Pick<SaleExchange, "balanceAmount" | "customerName" | "exchangeTotal" | "id" | "originalInvoiceNo" | "returnNo" | "status" | "timestamp" | "totalAmount">>; pagination: { page: number; pageSize: number; total: number; totalPages: number } };

export const lookupSaleReturn = async (search: string) =>
  (await get<ReturnLookup>("sale-returns/lookup", { search }, undefined, undefined, { trackLoading: false })).data;

export const createSaleExchange = async (input: SaleExchangeInput) =>
  (await post<SaleExchange, SaleExchangeInput>("sale-returns/exchange", input, undefined, false)).data;

export const getSaleReturns = async (query: Record<string, unknown>) =>
  (await get<SaleExchangeListResponse>("sale-returns", query, undefined, undefined, { trackLoading: false })).data;

export const getSaleReturn = async (id: number) => (await get<SaleExchange>(`sale-returns/${id}`)).data;
