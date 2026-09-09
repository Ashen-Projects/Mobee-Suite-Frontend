import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SellOutlinedIcon from "@mui/icons-material/SellOutlined";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Alert, Box, Button, Card, CardContent, Chip, FormControl, IconButton, InputLabel, MenuItem, Select, Skeleton, Stack, Tooltip, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import AdvancedDateRangeFilter from "../../../components/common/AdvancedDateRangeFilter";
import PageMeta from "../../../components/common/PageMeta";
import { PaymentMixChart, SalesTrendChart } from "../../../components/dashboard/DashboardCharts";
import DashboardForecastPanel from "../../../components/dashboard/DashboardForecast";
import DashboardInsights from "../../../components/dashboard/DashboardInsights";
import DashboardMetricCard from "../../../components/dashboard/DashboardMetricCard";
import { RepairQueuePanel, StatusBreakdownPanel, StockAlertsPanel, TopProductsPanel } from "../../../components/dashboard/DashboardPanels";
import useAuth from "../../../hooks/useAuth";
import { getDashboardOverview, saveDashboardInsightAction, type DashboardInsight, type DashboardOverview } from "../../../redux/slices/dashboardRedux/dashboardApi";
import { USER_PERMISSIONS } from "../../../utils";
import { formatDateTime } from "../../../utils/formatDateTime";
import { fCurrency } from "../../../utils/formatNumber";

const todayInColombo = () => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "2-digit", timeZone: "Asia/Colombo", year: "numeric",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(({ type, value: part }) => [type, part]));
  return `${value.year}-${value.month}-${value.day}`;
};

type LocationFilter = number | "all";

function LoadingDashboard() {
  return <Stack spacing={2}>
    <Skeleton height={52} variant="rounded" />
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" } }}>{Array.from({ length: 4 }, (_, index) => <Skeleton height={132} key={index} variant="rounded" />)}</Box>
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" } }}><Skeleton height={350} variant="rounded" /><Skeleton height={350} variant="rounded" /></Box>
  </Stack>;
}

function OperationalCard({ caption, icon, label, tone = "primary", value }: { caption: string; icon: ReactNode; label: string; tone?: "primary" | "success" | "warning" | "error" | "info"; value: string }) {
  return <Stack alignItems="center" direction="row" minWidth={0} spacing={1.15}>
    <Box sx={(theme) => ({ alignItems: "center", bgcolor: alpha(theme.palette[tone].main, 0.12), borderRadius: 1.75, color: `${tone}.main`, display: "flex", flexShrink: 0, height: 38, justifyContent: "center", width: 38 })}>{icon}</Box>
    <Box minWidth={0}><Typography color="text.secondary" fontSize={10.75} fontWeight={700} noWrap>{label}</Typography><Typography fontSize={16} fontWeight={900} noWrap>{value}</Typography><Typography color="text.secondary" fontSize={9.75} noWrap>{caption}</Typography></Box>
  </Stack>;
}

export default function HomeDashboard() {
  const { can, user } = useAuth();
  const canViewAllLocations = can(USER_PERMISSIONS.DASHBOARD_ALL_LOCATIONS_VIEW);
  const canActionInsights = can(USER_PERMISSIONS.DASHBOARD_INSIGHTS_ACTION);
  const [fromDate, setFromDate] = useState(todayInColombo);
  const [toDate, setToDate] = useState(todayInColombo);
  const [locationId, setLocationId] = useState<LocationFilter>("all");
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async (background = false) => {
    const activeRequest = ++requestId.current;
    if (background) setRefreshing(true); else setLoading(true);
    try {
      const value = await getDashboardOverview({ fromDate, locationId: canViewAllLocations ? locationId : "all", toDate });
      if (activeRequest !== requestId.current) return;
      setOverview(value);
      setError(null);
    } catch (caught) {
      if (activeRequest !== requestId.current) return;
      const message = caught instanceof Error ? caught.message : "Unable to load the dashboard.";
      setError(message);
      if (background) toast.error(message);
    } finally {
      if (activeRequest === requestId.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [canViewAllLocations, fromDate, locationId, toDate]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, 60_000);
    return () => window.clearInterval(interval);
  }, [load]);

  const periodCaption = fromDate === toDate ? "Selected day" : "Selected period";
  const noModuleAccess = overview && !overview.visibility.sales && !overview.visibility.inventory && !overview.visibility.repairs && !overview.visibility.purchasing;
  const handleInsightAction = useCallback(async (insight: DashboardInsight, state: "resolved" | "dismissed", note: string) => {
    if (!overview) return;
    await saveDashboardInsightAction(insight.id, { locationId: overview.meta.location.id, note: note.trim() || undefined, state });
    toast.success(`Insight ${state}.`);
    await load(true);
  }, [load, overview]);

  return <>
    <PageMeta description="Live business performance, stock health, purchasing, repairs, and POS activity." title="Dashboard | Mobee Suite" />
    <Stack spacing={{ xs: 1.75, sm: 2.25 }}>
      <Stack alignItems={{ xs: "stretch", md: "center" }} direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={1.5}>
        <Box>
          <Stack alignItems="center" direction="row" spacing={1}><AssessmentOutlinedIcon color="primary" sx={{ fontSize: 23 }} /><Typography variant="h4">Business Dashboard</Typography></Stack>
          <Typography color="text.secondary" fontSize={12.5} mt={0.35}>Welcome back, {user?.displayName}. Here is the latest operational picture.</Typography>
        </Box>
        <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} spacing={1}>
          <AdvancedDateRangeFilter fromDate={fromDate} onChange={(nextFrom, nextTo) => { setFromDate(nextFrom); setToDate(nextTo); }} toDate={toDate} />
          {canViewAllLocations ? <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
            <InputLabel>Location</InputLabel>
            <Select label="Location" onChange={(event) => setLocationId(event.target.value === "all" ? "all" : Number(event.target.value))} value={locationId}>
              <MenuItem value="all">All locations</MenuItem>
              {overview?.meta.availableLocations.map((location) => <MenuItem key={location.id} value={location.id}>{location.name}</MenuItem>)}
            </Select>
          </FormControl> : null}
          <Tooltip title="Refresh dashboard"><span><IconButton aria-label="Refresh dashboard" disabled={refreshing} onClick={() => void load(true)} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}><RefreshRoundedIcon sx={{ animation: refreshing ? "dashboard-spin 800ms linear infinite" : "none", "@keyframes dashboard-spin": { to: { transform: "rotate(360deg)" } } }} /></IconButton></span></Tooltip>
        </Stack>
      </Stack>

      {loading && !overview ? <LoadingDashboard /> : null}
      {error && !overview ? <Alert action={<Button color="inherit" onClick={() => void load()} size="small">Retry</Button>} severity="error">{error}</Alert> : null}
      {noModuleAccess ? <Alert severity="info">Your dashboard is ready, but this role has no dashboard sections yet. Ask an administrator to assign the required dashboard permissions.</Alert> : null}

      {overview ? <>
        <Card sx={{ border: 1, borderColor: "divider" }}><CardContent sx={{ px: { xs: 1.5, sm: 2 }, py: 1.25, "&:last-child": { pb: 1.25 } }}>
          <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={0.75}>
            <Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.75}>
              <Chip color="primary" label={overview.meta.location.name} size="small" variant="outlined" />
              <Chip label="Permission-based view" size="small" />
              <Typography color="text.secondary" fontSize={11.5}>{periodCaption}: {overview.meta.fromDate} to {overview.meta.toDate}</Typography>
            </Stack>
            <Typography color="text.secondary" fontSize={10.75}>Updated {formatDateTime(overview.meta.generatedAt)}</Typography>
          </Stack>
        </CardContent></Card>

        <DashboardInsights insights={overview.insights} onAction={canActionInsights ? handleInsightAction : undefined} />

        {overview.sales ? <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: overview.visibility.salesProfit ? "repeat(5, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))" } }}>
          <DashboardMetricCard caption="vs previous period" icon={<PointOfSaleRoundedIcon fontSize="small" />} label="Net sales" trend={overview.sales.totalChangePercentage} value={fCurrency(overview.sales.totalAmount)} />
          {overview.visibility.salesProfit ? <DashboardMetricCard caption={`COGS ${fCurrency(overview.sales.costOfGoods ?? 0)}`} icon={<TrendingUpRoundedIcon fontSize="small" />} label="Gross profit" tone="success" value={fCurrency(overview.sales.grossProfit ?? 0)} /> : null}
          <DashboardMetricCard caption={periodCaption} icon={<ReceiptLongOutlinedIcon fontSize="small" />} label="Completed sales" tone="info" value={String(overview.sales.saleCount)} />
          <DashboardMetricCard caption="Per completed sale" icon={<SellOutlinedIcon fontSize="small" />} label="Average sale" tone="success" value={fCurrency(overview.sales.averageSale)} />
          <DashboardMetricCard caption={periodCaption} icon={<WarningAmberRoundedIcon fontSize="small" />} label="Discounts" tone="warning" value={fCurrency(overview.sales.discountAmount)} />
        </Box> : null}

        <Card sx={{ border: 1, borderColor: "divider" }}><CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
          <Box sx={{ display: "grid", gap: { xs: 1.75, md: 2.5 }, gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" } }}>
            {overview.inventory ? <OperationalCard caption="sellable units" icon={<Inventory2OutlinedIcon fontSize="small" />} label="Available stock" tone="info" value={String(overview.inventory.availableUnits)} /> : null}
            {overview.inventory ? <OperationalCard caption={`${overview.inventory.outOfStockCount} out of stock`} icon={<WarningAmberRoundedIcon fontSize="small" />} label="Stock alerts" tone={overview.inventory.lowStockCount + overview.inventory.outOfStockCount ? "warning" : "success"} value={String(overview.inventory.lowStockCount + overview.inventory.outOfStockCount)} /> : null}
            {overview.repairs ? <OperationalCard caption={`${overview.repairs.createdInRange} created in range`} icon={<BuildRoundedIcon fontSize="small" />} label="Active repairs" tone="primary" value={String(overview.repairs.activeJobs)} /> : null}
            {overview.purchasing ? <OperationalCard caption="GRNs in selected period" icon={<LocalShippingOutlinedIcon fontSize="small" />} label="Goods received" tone="info" value={String(overview.purchasing.grnCount)} /> : null}
            {overview.drawers ? <OperationalCard caption="currently open" icon={<AccountBalanceWalletOutlinedIcon fontSize="small" />} label="POS drawers" tone={overview.drawers.openCount ? "success" : "warning"} value={String(overview.drawers.openCount)} /> : null}
          </Box>
        </CardContent></Card>

        {overview.sales ? <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 2fr) minmax(300px, .9fr)" } }}><SalesTrendChart sales={overview.sales} /><PaymentMixChart payments={overview.sales.paymentTotals} /></Box> : null}

        {overview.forecast ? <DashboardForecastPanel canViewDetails={overview.visibility.forecastDetails} forecast={overview.forecast} /> : null}

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "repeat(3, minmax(0, 1fr))" } }}>
          {overview.sales ? <TopProductsPanel products={overview.sales.topProducts} /> : null}
          {overview.inventory ? <StockAlertsPanel inventory={overview.inventory} /> : null}
          {overview.repairs ? <RepairQueuePanel repairs={overview.repairs} /> : null}
        </Box>

        {(overview.visibility.inventoryCost && overview.inventory) || (overview.visibility.purchasingCost && overview.purchasing) ? <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" } }}>
          {overview.visibility.inventoryCost && overview.inventory ? <DashboardMetricCard caption="Available stock only" icon={<Inventory2OutlinedIcon fontSize="small" />} label="Stock cost value" tone="info" value={fCurrency(overview.inventory.costValue ?? 0)} /> : null}
          {overview.visibility.inventoryCost && overview.inventory ? <DashboardMetricCard caption="Potential retail value" icon={<SellOutlinedIcon fontSize="small" />} label="Stock MRP value" tone="success" value={fCurrency(overview.inventory.mrpValue ?? 0)} /> : null}
          {overview.visibility.purchasingCost && overview.purchasing ? <DashboardMetricCard caption="Selected period" icon={<LocalShippingOutlinedIcon fontSize="small" />} label="Purchase cost" tone="warning" value={fCurrency(overview.purchasing.costTotal ?? 0)} /> : null}
          {overview.visibility.purchasingCost && overview.purchasing ? <DashboardMetricCard caption="Selected period" icon={<AccountBalanceWalletOutlinedIcon fontSize="small" />} label="Supplier balance" tone="error" value={fCurrency(overview.purchasing.balanceAmount ?? 0)} /> : null}
        </Box> : null}

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" } }}>
          {overview.repairs ? <StatusBreakdownPanel rows={overview.repairs.statusTotals} title="Active repair stages" /> : null}
          {overview.purchasing ? <StatusBreakdownPanel rows={overview.purchasing.statusTotals} title="GRN workflow" /> : null}
        </Box>
      </> : null}
    </Stack>
  </>;
}
