import { get, post } from "../../../inteceptor";

export type PosDrawer = {
  canClose: boolean;
  cashExpenseAmount: string | null;
  closedAt: number | null;
  closeNote: string | null;
  countedBankTransferTotal: string | null;
  countedCardTotal: string | null;
  countedCash: string | null;
  countedMobileTotal: string | null;
  id: number;
  locationId: number;
  locationName: string;
  openedAt: number;
  openNote: string | null;
  openingCash: string;
  status: "open" | "closed";
  userId: number;
  userName: string;
};

export type CloseDrawerResult = {
  difference: number;
  drawerId: number;
  summary: {
    bankTransferSales: number;
    bankTransferRepairPayments: number;
    cardSales: number;
    cardRepairPayments: number;
    cashSales: number;
    cashRepairPayments: number;
    discountAmount: number;
    expectedBankTransferTotal: number;
    expectedCardTotal: number;
    expectedCash: number;
    expectedMobileTotal: number;
    mobileSales: number;
    mobileRepairPayments: number;
    repairPaymentCount: number;
    repairPaymentTotal: number;
    salesCount: number;
    totalAmount: number;
  };
};

export type DrawerCloseSummary = CloseDrawerResult["summary"];

export type SoldProductUnit = {
  barcode: string | null;
  invoiceNo: string;
  soldAt: number;
  stockId: number | null;
};

export type ProductSalesLine = {
  discountAmount: number;
  grossAmount: number;
  id: number;
  name: string;
  netAmount: number;
  quantity: number;
  salesCount: number;
  sku: string | null;
  units: SoldProductUnit[];
};

export type SalesActivity = {
  financials?: {
    costCoverage: { complete: boolean; totalUnits: number; trackedUnits: number };
    costOfGoods: number;
    grossProfit: number;
    marginPercent: number | null;
  };
  products: ProductSalesLine[];
  sales: {
    averageSaleValue: number;
    discountAmount: number;
    grossAmount: number;
    netAmount: number;
    paidAmount: number;
    salesCount: number;
  };
};

export type DrawerCloseReportBase = {
  drawer: {
    cashExpenseAmount: number | null;
    closedAt: number | null;
    closedById: number | null;
    closedByName: string | null;
    closeNote: string | null;
    countedBankTransferTotal: string | null;
    countedCardTotal: string | null;
    countedCash: string | null;
    countedMobileTotal: string | null;
    id: number;
    locationId: number;
    locationName: string;
    openedAt: number;
    openedById: number;
    openedByName: string;
    openNote: string | null;
    openingCash: number;
  };
  reconciliation: {
    counted: Record<"cash" | "card" | "bankTransfer" | "mobile", number | null>;
    difference: number | null;
    differences: Record<"cash" | "card" | "bankTransfer" | "mobile", number | null>;
    expected: Record<"cash" | "card" | "bankTransfer" | "mobile", number>;
    expectedTotal: number;
    isComplete: boolean;
    settlement: "balanced" | "incomplete" | "variance";
    totalCounted: number | null;
  };
  summary: DrawerCloseSummary;
};

export type DrawerCloseReport = DrawerCloseReportBase & {
  shift: SalesActivity;
};

export type DrawerLocationDayReport = SalesActivity & {
  date: string;
  drawerPerformance: Array<{
    drawerId: number | null;
    label: string;
    openedByName: string | null;
    salesCount: number;
    status: "open" | "closed" | "legacy";
    totalAmount: number;
  }>;
  location: { id: number; name: string };
};

export type DrawerCloseHistoryResponse = {
  items: DrawerCloseReportBase[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export const getCurrentDrawer = async () =>
  (await get<{ drawer: PosDrawer | null }>("pos-drawers/current", undefined, undefined, undefined, { trackLoading: false })).data.drawer;

export const openDrawer = async (input: { openingCash: number; note?: string }) =>
  (await post<PosDrawer, typeof input>("pos-drawers/open", input, undefined, false)).data;

export const closeDrawer = async (input: {
  cashExpenseAmount: number;
  countedBankTransferTotal: number;
  countedCardTotal: number;
  countedCash: number;
  countedMobileTotal: number;
  note?: string;
}) => (await post<CloseDrawerResult, typeof input>("pos-drawers/close", input, undefined, false)).data;

export const getDrawerCloseHistory = async (query: {
  fromDate?: string;
  locationId?: number | "all";
  page?: number;
  pageSize?: number;
  toDate?: string;
}) => (await get<DrawerCloseHistoryResponse>("pos-drawers/history", query, undefined, undefined, { trackLoading: false })).data;

export const getDrawerCloseReport = async (drawerId: number) =>
  (await get<DrawerCloseReport>(`pos-drawers/${drawerId}/report`, undefined, undefined, undefined, { trackLoading: false })).data;

export const getDrawerLocationDayReport = async (drawerId: number, date: string) =>
  (await get<DrawerLocationDayReport>(`pos-drawers/${drawerId}/location-day`, { date }, undefined, undefined, { trackLoading: false })).data;
