import { get, post, put } from "../../../inteceptor";

export type DashboardInsight = {
  action: string;
  confidence: "low" | "medium" | "high" | "rule";
  domain: "sales" | "inventory" | "purchasing" | "repairs";
  id: string;
  message: string;
  metric: {
    format: "currency" | "number" | "percent";
    label: string;
    value: number;
  };
  period: string;
  severity: "critical" | "warning" | "opportunity" | "positive";
  title: string;
  actionState?: "resolved" | "dismissed";
  actionNote?: string | null;
  actionedAt?: number;
};

export type DashboardTarget = {
  createdBy: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  id: number;
  isActive: boolean;
  locationId: number;
  locationName: string;
  period: "weekly" | "monthly";
  targetAmount: number;
  updatedAt: number;
};

export type DashboardInsightSettings = {
  deadStockDays: number;
  excessStockCoverDays: number;
  overdueSupplierDays: number;
  repairInProgressDays: number;
  repairIntakeDays: number;
  repairWaitingPartsDays: number;
  salesDeclinePercent: number;
  slowStockDays: number;
  stockoutCoverDays: number;
  suggestedTargetGrowthPercent: number;
  updatedAt: number;
};

export type DashboardInsightActionHistory = {
  actedBy: string;
  actedByUserId: number;
  id: number;
  insightId: string;
  locationId: number | null;
  locationName: string | null;
  note: string | null;
  scopeKey: string;
  state: "resolved" | "dismissed";
  timestamp: number;
};

export type DashboardControls = {
  defaults: Omit<DashboardInsightSettings, "updatedAt">;
  insightActions: DashboardInsightActionHistory[];
  settings: DashboardInsightSettings;
  targets: DashboardTarget[];
};

export type DashboardForecastPoint = {
  date: string;
  forecastAmount: number;
  forecastSaleCount: number;
};

export type DashboardForecastWindow = {
  averageDailyAmount: number;
  changeFromLastPeriod: number | null;
  days: number;
  forecastAmount: number;
  forecastSaleCount: number;
  points: DashboardForecastPoint[];
  reason?: string;
  unavailable: boolean;
};

export type DashboardForecastAccuracy = {
  accuracy: number | null;
  actualAmount: number;
  evaluationWindows: number;
  forecastAmount: number;
  horizonDays: number;
  reason?: string;
  unavailable: boolean;
  weightedAbsolutePercentageError: number | null;
};

export type DashboardSeasonalDay = {
  averageAmount: number;
  averageSaleCount: number;
  dayIndex: number;
  dayName: string;
  factor: number;
};

export type DashboardForecastSeasonality = {
  annualPatternAvailable: boolean;
  coverageDays: number;
  quietestMonth: null | {
    averageAmount: number;
    factor: number;
    monthIndex: number;
    monthName: string;
  };
  quietestDay: DashboardSeasonalDay | null;
  reason?: string;
  strongestMonth: null | {
    averageAmount: number;
    factor: number;
    monthIndex: number;
    monthName: string;
  };
  strongestDay: DashboardSeasonalDay | null;
  weekdays: DashboardSeasonalDay[];
};

export type DashboardForecast = {
  confidence: "high" | "limited" | "medium";
  dataThrough: string;
  details: null | {
    accuracy: {
      sevenDay: DashboardForecastAccuracy;
      thirtyDay: DashboardForecastAccuracy;
    };
    recommendations: Array<{
      action: string;
      id: string;
      message: string;
      severity: "info" | "opportunity" | "positive" | "warning";
      title: string;
    }>;
    seasonality: DashboardForecastSeasonality;
    thirtyDay: DashboardForecastWindow;
  };
  historyDays: number;
  sevenDay: DashboardForecastWindow;
};

export type DashboardOverview = {
  drawers: null | {
    openCount: number;
  };
  forecast: DashboardForecast | null;
  insights: DashboardInsight[];
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
    availableLocations: Array<{ id: number; name: string }>;
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
    allLocations: boolean;
    forecastDetails: boolean;
    inventory: boolean;
    inventoryCost: boolean;
    purchasing: boolean;
    purchasingCost: boolean;
    repairs: boolean;
    sales: boolean;
    salesProfit: boolean;
  };
};

export const getDashboardOverview = async (query: Record<string, unknown>) =>
  (await get<DashboardOverview>("dashboard/overview", query, undefined, undefined, { trackLoading: false })).data;

export const getDashboardControls = async () =>
  (await get<DashboardControls>("dashboard/controls", {}, undefined, undefined, { trackLoading: false })).data;

export const saveDashboardTarget = async (input: { effectiveFrom: string; locationId: number; period: "weekly" | "monthly"; targetAmount: number }) =>
  (await put<{ id: number }, typeof input>("dashboard/controls/targets", input, undefined, false, { trackLoading: false })).data;

export const saveDashboardInsightSettings = async (input: Omit<DashboardInsightSettings, "updatedAt">) =>
  (await put<DashboardInsightSettings, typeof input>("dashboard/controls/insight-settings", input, undefined, false, { trackLoading: false })).data;

export const saveDashboardInsightAction = async (insightId: string, input: { locationId: number | "all"; note?: string; state: "resolved" | "dismissed" }) =>
  (await post<{ success: boolean }, typeof input>(`dashboard/insights/${insightId}/action`, input, undefined, false, { trackLoading: false })).data;
