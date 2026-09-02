import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { get, post } from "../../../inteceptor";
import { dispatch } from "../../store";

export type PaymentMethod = "cash" | "card" | "bankTransfer";

export type SaleProductSearchItem = {
  barcode?: string | null;
  locationId: number | null;
  locationName: string | null;
  matchType: "barcode" | "imei" | "serial" | "product";
  mrpPrice: string;
  productId: number;
  productName: string;
  productSku: string | null;
  quantityAvailable: number;
  sellingPrice: string;
  stockId?: number;
  stockIds: number[];
};

export type SaleCustomer = {
  email: string | null;
  id: number;
  name: string;
  phone: string | null;
};

export type SaleInput = {
  customer?: { id?: number; name?: string; phone?: string };
  discountAmount: number;
  items: Array<{
    discountAmount: number;
    productId: number;
    quantity: number;
    stockIds: number[];
    unitPrice: number;
  }>;
  locationId: number;
  payment: { amount: number; method: PaymentMethod; referenceNo?: string };
};

export type SaleDetail = {
  customerId: number | null;
  customerName: string | null;
  customerPhone: string | null;
  discountAmount: string;
  id: number;
  invoiceNo: string;
  items: Array<{
    discountAmount: string;
    id: number;
    productId: number;
    productName: string;
    productSku: string | null;
    quantity: number;
    stockUnits: Array<{ barcode: string | null; stockId: number | null }>;
    totalAmount: string;
    unitPrice: string;
  }>;
  locationId: number;
  locationName: string;
  paidAmount: string;
  payments: Array<{ amount: string; id: number; method: PaymentMethod; referenceNo: string | null; timestamp: number }>;
  status: "draft" | "completed" | "cancelled" | "returned";
  subTotal: string;
  timestamp: number;
  totalAmount: string;
  userId: number;
  userName: string;
};

export type SaleListItem = Omit<SaleDetail, "items" | "payments" | "customerPhone" | "locationId" | "subTotal" | "userId">;
export type SaleListResponse = {
  items: SaleListItem[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

type State = { error: string | null; items: SaleListItem[]; pagination: SaleListResponse["pagination"] };
const initialState: State = { error: null, items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } };

const slice = createSlice({
  initialState,
  name: "sales",
  reducers: {
    failed(state, action: PayloadAction<string>) { state.error = action.payload; },
    salesReceived(state, action: PayloadAction<SaleListResponse>) {
      state.items = action.payload.items;
      state.pagination = action.payload.pagination;
      state.error = null;
    },
  },
});

export default slice.reducer;

const fail = (error: unknown) => {
  dispatch(slice.actions.failed(error instanceof Error ? error.message : "Sale request failed."));
  throw error;
};

export const searchSaleProducts = async (query: Record<string, unknown>) =>
  (await get<SaleProductSearchItem[]>("sales/products/search", query, undefined, undefined, { trackLoading: false })).data;

export const searchSaleCustomers = async (search: string) =>
  (await get<SaleCustomer[]>("sales/customers/search", { search }, undefined, undefined, { trackLoading: false })).data;

export const createSale = async (input: SaleInput) =>
  (await post<SaleDetail, SaleInput>("sales", input, undefined, false)).data;

export const getSales = async (query: Record<string, unknown>): Promise<SaleListResponse> => {
  try {
    const value = (await get<SaleListResponse>("sales", query)).data;
    dispatch(slice.actions.salesReceived(value));
    return value;
  } catch (error) {
    return fail(error);
  }
};

export const getSale = async (id: number) => (await get<SaleDetail>(`sales/${id}`)).data;
