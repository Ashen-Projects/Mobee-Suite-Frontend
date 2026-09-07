import { get } from "../../../inteceptor";

export type DashboardOverview = {
  drawers: null | {
    openCount: number;
    openDrawers: Array<{
      id: number;
      locationId: number;
      locationName: string;
      openedAt: number;
      openingCash: number;
      userId: number;
      userName: string;
    }>;
  };
  inventory: null | {
    availableUnits: number;
    costValue: number | null;
    lowStockCount: number;
    mrpValue: number | null;
    outOfStockCount: number;
    stockAlerts: Array<{
      availableUnits: number;
      locationId: number;
      locationName: string;
      minimumStockLevel: number;
      productId: number;
      productName: string;
      sku: string | null;
    }>;
  };
  meta: {
    fromDate: string;
    generatedAt: number;
    location: { id: number | "all"; name: string };
    toDate: string;
  };
  purchasing: null | {
    balanceAmount: number | null;
    costTotal: number | null;
    grnCount: number;
    paidAmount: number | null;
    statusTotals: Array<{ status: string; total: number }>;
  };
  repairs: null | {
    activeJobs: number;
    createdInRange: number;
    oldestActiveJobs: Array<{
      customerName: string;
      deviceName: string;
      jobNo: string;
      locationName: string;
      status: string;
      timestamp: number;
    }>;
    statusTotals: Array<{ status: string; total: number }>;
  };
  sales: null | {
    averageSale: number;
    costOfGoods: number | null;
    discountAmount: number;
    grossProfit: number | null;
    paidAmount: number;
    paymentTotals: Record<string, number>;
    previousPeriod: { fromDate: string; toDate: string; totalAmount: number };
    saleCount: number;
    topProducts: Array<{ productId: number; productName: string; quantity: number; totalAmount: number }>;
    totalAmount: number;
    totalChangePercentage: number | null;
    trend: Array<{ date: string; saleCount: number; totalAmount: number }>;
  };
  visibility: {
    financials: boolean;
    inventory: boolean;
    purchasing: boolean;
    repairs: boolean;
    sales: boolean;
  };
};

export const getDashboardOverview = async (query: Record<string, unknown>) =>
  (await get<DashboardOverview>("dashboard/overview", query, undefined, undefined, { trackLoading: false })).data;
