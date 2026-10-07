import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Inventory2RoundedIcon from "@mui/icons-material/Inventory2Rounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Tab, Tabs, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import AdvancedDateRangeFilter from "../../../components/common/AdvancedDateRangeFilter";
import PageMeta from "../../../components/common/PageMeta";
import useAuth from "../../../hooks/useAuth";
import { getDrawerCloseHistory, getDrawerCloseReport, getDrawerLocationDayReport, type DrawerCloseHistoryResponse, type DrawerCloseReport, type DrawerCloseReportBase, type DrawerLocationDayReport, type ProductSalesLine, type SalesActivity } from "../../../redux/slices/posRedux/drawerRedux";
import { getLocations, type Location } from "../../../redux/slices/settingsRedux/businessSettingsRedux";
import { PATH_DASHBOARD } from "../../../routes/paths";
import { USER_PERMISSIONS, USER_ROLES } from "../../../utils";
import { fCurrency } from "../../../utils/formatNumber";

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];
const toDateInput = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
const colomboDateInput = (timestamp: number) => {
  const parts = new Intl.DateTimeFormat("en-CA", { day: "2-digit", month: "2-digit", timeZone: "Asia/Colombo", year: "numeric" }).formatToParts(new Date(timestamp));
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
};
const today = toDateInput(new Date());
const monthStart = toDateInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const dateTime = (value: number | null) => value
  ? new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "Not recorded";
const moneyOrDash = (value: number | null) => value === null ? "—" : fCurrency(value);
const csvValue = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const exportHistoryCsv = (items: DrawerCloseReportBase[]) => {
  if (!items.length) return toast.info("There are no drawer reports to export.");
  const rows = items.map(({ drawer, reconciliation, summary }) => ({
    "Drawer ID": drawer.id,
    Location: drawer.locationName,
    "Opened at": dateTime(drawer.openedAt),
    "Closed at": dateTime(drawer.closedAt),
    "Opened by": drawer.openedByName,
    "Closed by": drawer.closedByName ?? "Not recorded",
    "Sales count": summary.salesCount,
    "Sales total": summary.totalAmount.toFixed(2),
    "Repair collections": summary.repairPaymentTotal.toFixed(2),
    Discounts: summary.discountAmount.toFixed(2),
    "Expected cash": reconciliation.expected.cash.toFixed(2),
    "Counted cash": reconciliation.counted.cash ?? "",
    "Cash variance": reconciliation.differences.cash ?? "",
    Settlement: reconciliation.settlement,
  }));
  const fields = Object.keys(rows[0]);
  const blob = new Blob([`\uFEFF${[fields.join(","), ...rows.map((row) => fields.map((field) => csvValue(row[field as keyof typeof row])).join(","))].join("\n")}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "mobee-drawer-close-reports.csv";
  link.click();
  URL.revokeObjectURL(url);
};

function Metric({ label, tone, value }: { label: string; tone?: "error" | "success" | "warning"; value: string }) {
  const color = tone === "error" ? "error.main" : tone === "success" ? "success.main" : tone === "warning" ? "warning.main" : "text.primary";
  return <Card variant="outlined"><CardContent sx={{ p: "16px !important" }}><Typography color="text.secondary" variant="body2">{label}</Typography><Typography color={color} fontWeight={900} mt={0.5} variant="h6">{value}</Typography></CardContent></Card>;
}

const settlementChip = (report: DrawerCloseReportBase) => {
  if (report.reconciliation.settlement === "balanced") return <Chip color="success" icon={<TaskAltRoundedIcon />} label="Balanced" size="small" />;
  if (report.reconciliation.settlement === "variance") return <Chip color="warning" icon={<WarningAmberRoundedIcon />} label="Variance recorded" size="small" />;
  return <Chip label="Legacy / incomplete count" size="small" variant="outlined" />;
};

function ActivityMetrics({ activity, canViewProfit }: { activity: SalesActivity; canViewProfit: boolean }) {
  const coverage = activity.financials?.costCoverage;
  return <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr 1fr", md: canViewProfit ? "repeat(5, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))" } }}>
    <Metric label="Net sales" value={fCurrency(activity.sales.netAmount)} />
    <Metric label="Completed sales" value={String(activity.sales.salesCount)} />
    <Metric label="Average sale" value={fCurrency(activity.sales.averageSaleValue)} />
    <Metric label="Discounts" value={fCurrency(activity.sales.discountAmount)} />
    {canViewProfit ? <Metric label="Gross profit" tone={activity.financials && activity.financials.grossProfit < 0 ? "error" : "success"} value={activity.financials ? fCurrency(activity.financials.grossProfit) : "Not available"} /> : null}
    {canViewProfit && coverage && !coverage.complete ? <Typography color="warning.main" gridColumn={{ xs: "1 / -1", md: "1 / -1" }} variant="caption">Profit uses {coverage.trackedUnits} of {coverage.totalUnits} tracked sold units.</Typography> : null}
  </Box>;
}

function ProductBreakdown({ activity }: { activity: SalesActivity }) {
  if (!activity.products.length) return <Card variant="outlined"><CardContent><Typography color="text.secondary" textAlign="center">No completed product sales were recorded in this period.</Typography></CardContent></Card>;
  return <Card variant="outlined"><Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, py: 1.5 }}><Stack alignItems="center" direction="row" gap={1}><Inventory2RoundedIcon color="primary" fontSize="small" /><Box><Typography fontWeight={900}>Sold products</Typography><Typography color="text.secondary" variant="caption">Expand a product to view its sold barcode units and invoice trace.</Typography></Box><Chip label={`${activity.products.length} products`} size="small" sx={{ ml: "auto" }} /></Stack></Box><Box>
    {activity.products.map((product: ProductSalesLine) => <Accordion disableGutters key={product.id} square sx={{ "&:before": { display: "none" }, borderBottom: 1, borderColor: "divider" }}>
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />} sx={{ px: 2, "& .MuiAccordionSummary-content": { my: 1.25, minWidth: 0 } }}>
        <Box sx={{ alignItems: "center", display: "grid", gap: { xs: 0.5, sm: 1.5 }, gridTemplateColumns: { xs: "minmax(0, 1fr) auto", sm: "minmax(190px, 1.5fr) 80px 120px 130px" }, width: "100%" }}>
          <Box minWidth={0}><Typography fontWeight={800} noWrap>{product.name}</Typography><Typography color="text.secondary" noWrap variant="caption">{product.sku || "No SKU"} · {product.salesCount} sale{product.salesCount === 1 ? "" : "s"}</Typography></Box>
          <Box textAlign={{ xs: "right", sm: "center" }}><Typography fontWeight={800}>{product.quantity}</Typography><Typography color="text.secondary" variant="caption">units</Typography></Box>
          <Box display={{ xs: "none", sm: "block" }} textAlign="right"><Typography fontWeight={800}>{fCurrency(product.discountAmount)}</Typography><Typography color="text.secondary" variant="caption">discount</Typography></Box>
          <Box display={{ xs: "none", sm: "block" }} textAlign="right"><Typography fontWeight={900}>{fCurrency(product.netAmount)}</Typography><Typography color="text.secondary" variant="caption">net sales</Typography></Box>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ bgcolor: "action.hover", px: 2, py: 1.5 }}>
        <Stack gap={1.25}><Typography color="text.secondary" variant="caption">Barcode units ({product.units.length}/{product.quantity})</Typography>{product.units.length ? <Stack direction="row" flexWrap="wrap" gap={0.75}>{product.units.map((unit) => <Chip key={unit.stockId ?? `${unit.invoiceNo}-${unit.barcode}`} label={`${unit.barcode || "No barcode"} · ${unit.invoiceNo}`} size="small" variant="outlined" />)}</Stack> : <Typography color="text.secondary" variant="body2">No barcode trace is available for this legacy sale.</Typography>}</Stack>
      </AccordionDetails>
    </Accordion>)}
  </Box></Card>;
}

function LockedProfitCard() {
  return <Card sx={{ bgcolor: "action.hover", border: 1, borderColor: "divider" }} variant="outlined"><CardContent><Stack alignItems="center" direction="row" gap={1}><LockRoundedIcon color="action" fontSize="small" /><Box><Typography fontWeight={800}>Profit details are restricted</Typography><Typography color="text.secondary" variant="caption">Sales activity is visible; cost and profit require dashboard profit access.</Typography></Box></Stack></CardContent></Card>;
}

export default function DrawerCloseReports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can, hasRole } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isAdministrator = hasRole(USER_ROLES.ADMIN);
  const canViewProfit = can(USER_PERMISSIONS.DASHBOARD_PROFIT_VIEW);
  const [fromDate, setFromDate] = useState(monthStart);
  const [toDate, setToDate] = useState(today);
  const [locationId, setLocationId] = useState<number | "all">("all");
  const [locations, setLocations] = useState<Location[]>([]);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [history, setHistory] = useState<DrawerCloseHistoryResponse>({ items: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 0 } });
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<DrawerCloseReport | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reportTab, setReportTab] = useState<"shift" | "location-day">("shift");
  const [locationDayDate, setLocationDayDate] = useState(today);
  const [locationDay, setLocationDay] = useState<DrawerLocationDayReport | null>(null);
  const [locationDayLoading, setLocationDayLoading] = useState(false);
  // Closing a dialog and replacing search params are separate React Router
  // updates. Remembering a manual dismissal avoids reopening the report during
  // the short render where the previous `drawerId` is still in the URL.
  const dismissedDrawerId = useRef<number | null>(null);

  useEffect(() => {
    if (!isAdministrator) return;
    void getLocations({ isActive: "true", page: 1, pageSize: 100, search: "", type: "all" })
      .then((response) => setLocations(response.items))
      .catch(() => undefined);
  }, [isAdministrator]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setHistory(await getDrawerCloseHistory({ fromDate, locationId, page: page + 1, pageSize, toDate }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load drawer close reports.");
    } finally {
      setLoading(false);
    }
  }, [fromDate, locationId, page, pageSize, toDate]);

  useEffect(() => { void load(); }, [load]);

  const viewReport = useCallback(async (drawerId: number) => {
    dismissedDrawerId.current = null;
    setDetailLoading(true);
    try {
      const report = await getDrawerCloseReport(drawerId);
      setDetail(report);
      setLocationDayDate(colomboDateInput(report.drawer.closedAt ?? Date.now()));
      setLocationDay(null);
      setReportTab("shift");
      setSearchParams({ drawerId: String(drawerId) }, { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load this drawer report.");
      setSearchParams({}, { replace: true });
    } finally {
      setDetailLoading(false);
    }
  }, [setSearchParams]);

  useEffect(() => {
    if (!detail || reportTab !== "location-day") return;
    let active = true;
    setLocationDayLoading(true);
    void getDrawerLocationDayReport(detail.drawer.id, locationDayDate)
      .then((report) => { if (active) setLocationDay(report); })
      .catch((error) => { if (active) toast.error(error instanceof Error ? error.message : "Unable to load the location day report."); })
      .finally(() => { if (active) setLocationDayLoading(false); });
    return () => { active = false; };
  }, [detail, locationDayDate, reportTab]);

  useEffect(() => {
    const requestedId = Number(searchParams.get("drawerId"));
    if (!requestedId) dismissedDrawerId.current = null;
    if (requestedId > 0 && requestedId !== dismissedDrawerId.current && !detail && !detailLoading) void viewReport(requestedId);
  }, [detail, detailLoading, searchParams, viewReport]);

  const closeDetail = () => {
    const activeDrawerId = detail?.drawer.id ?? Number(searchParams.get("drawerId"));
    dismissedDrawerId.current = activeDrawerId > 0 ? activeDrawerId : null;
    setDetail(null);
    setLocationDay(null);
    setReportTab("shift");
    setSearchParams({}, { replace: true });
  };

  const columns = useMemo<GridColDef<DrawerCloseReportBase>[]>(() => [
    { field: "id", headerName: "Drawer", minWidth: isMobile ? 100 : 125, renderCell: ({ row }) => <Stack justifyContent="center"><Typography fontWeight={900}>#{row.drawer.id}</Typography><Typography color="text.secondary" variant="caption">{dateTime(row.drawer.closedAt)}</Typography></Stack> },
    { field: "location", flex: 1, headerName: "Location & cashier", minWidth: isMobile ? 170 : 240, renderCell: ({ row }) => <Stack justifyContent="center" sx={{ minWidth: 0 }}><Typography fontWeight={700} noWrap>{row.drawer.locationName}</Typography><Typography color="text.secondary" noWrap variant="caption">{row.drawer.openedByName} → {row.drawer.closedByName ?? "Not recorded"}</Typography></Stack> },
    { field: "activity", headerName: "Activity", minWidth: 175, renderCell: ({ row }) => <Stack justifyContent="center"><Typography fontWeight={800}>{row.summary.salesCount} sales · {row.summary.repairPaymentCount} repairs</Typography><Typography color="text.secondary" variant="caption">{fCurrency(row.summary.totalAmount + row.summary.repairPaymentTotal)} collected</Typography></Stack> },
    { field: "cash", headerName: "Cash reconciliation", minWidth: 185, renderCell: ({ row }) => <Stack justifyContent="center"><Typography fontWeight={800}>{moneyOrDash(row.reconciliation.counted.cash)}</Typography><Typography color={row.reconciliation.differences.cash === 0 ? "success.main" : row.reconciliation.differences.cash === null ? "text.secondary" : "warning.main"} variant="caption">Variance {moneyOrDash(row.reconciliation.differences.cash)}</Typography></Stack> },
    { field: "status", headerName: "Status", minWidth: 148, renderCell: ({ row }) => settlementChip(row) },
    { align: "center", field: "actions", headerAlign: "center", headerName: "", minWidth: 76, sortable: false, renderCell: ({ row }) => <Tooltip title="Open close report"><IconButton onClick={(event) => { event.stopPropagation(); void viewReport(row.drawer.id); }}><OpenInNewRoundedIcon fontSize="small" /></IconButton></Tooltip> },
  ], [isMobile, viewReport]);

  const reconciliationRows = detail ? [
    { id: "cash", method: "Cash", repair: detail.summary.cashRepairPayments, sales: detail.summary.cashSales, expected: detail.reconciliation.expected.cash, counted: detail.reconciliation.counted.cash, difference: detail.reconciliation.differences.cash },
    { id: "card", method: "Card", repair: detail.summary.cardRepairPayments, sales: detail.summary.cardSales, expected: detail.reconciliation.expected.card, counted: detail.reconciliation.counted.card, difference: detail.reconciliation.differences.card },
    { id: "bank", method: "Bank transfer", repair: detail.summary.bankTransferRepairPayments, sales: detail.summary.bankTransferSales, expected: detail.reconciliation.expected.bankTransfer, counted: detail.reconciliation.counted.bankTransfer, difference: detail.reconciliation.differences.bankTransfer },
    { id: "mobile", method: "Mobile payment", repair: detail.summary.mobileRepairPayments, sales: detail.summary.mobileSales, expected: detail.reconciliation.expected.mobile, counted: detail.reconciliation.counted.mobile, difference: detail.reconciliation.differences.mobile },
  ] : [];

  const reconciliationColumns = useMemo<GridColDef<(typeof reconciliationRows)[number]>[]>(() => [
    { field: "method", flex: 1, headerName: "Payment method", minWidth: 170 },
    { align: "right", field: "sales", headerAlign: "right", headerName: "Sales", minWidth: 130, valueFormatter: (value) => fCurrency(Number(value)) },
    { align: "right", field: "repair", headerAlign: "right", headerName: "Repair payments", minWidth: 155, valueFormatter: (value) => fCurrency(Number(value)) },
    { align: "right", field: "expected", headerAlign: "right", headerName: "Expected", minWidth: 130, valueFormatter: (value) => fCurrency(Number(value)) },
    { align: "right", field: "counted", headerAlign: "right", headerName: "Counted", minWidth: 130, valueFormatter: (value) => moneyOrDash(value as number | null) },
    { align: "right", field: "difference", headerAlign: "right", headerName: "Variance", minWidth: 130, renderCell: ({ value }) => <Typography color={value === 0 ? "success.main" : value === null ? "text.secondary" : "warning.main"} fontWeight={800}>{moneyOrDash(value as number | null)}</Typography> },
  ], []);

  return <>
    <PageMeta description="Review saved POS drawer closing summaries and reconciliation results." title="Drawer Close Reports | Mobee Suite" />
    <Stack spacing={{ xs: 2, sm: 2.5 }}>
      <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={1.5} justifyContent="space-between">
        <Stack alignItems="center" direction="row" gap={1.25}><AccountBalanceWalletOutlinedIcon color="primary" /><Box><Typography fontWeight={900} variant="h4">Drawer Close Reports</Typography><Typography color="text.secondary" variant="body2">Review a saved shift summary and reconciliation record — not a customer receipt.</Typography></Box></Stack>
        <Stack direction="row" gap={1} flexWrap="wrap"><Button color="inherit" onClick={() => navigate(PATH_DASHBOARD.pos.root)} startIcon={<ArrowBackRoundedIcon />} variant="outlined">Back to POS</Button><Button disabled={!history.items.length} onClick={() => exportHistoryCsv(history.items)} startIcon={<DownloadRoundedIcon />} variant="contained">CSV</Button></Stack>
      </Stack>

      <Card variant="outlined"><CardContent><Stack alignItems={{ md: "center" }} direction={{ xs: "column", md: "row" }} gap={1.5}><AdvancedDateRangeFilter fromDate={fromDate} onChange={(nextFrom, nextTo) => { setFromDate(nextFrom); setToDate(nextTo); setPage(0); }} toDate={toDate} />{isAdministrator ? <FormControl size="small" sx={{ minWidth: 210 }}><InputLabel>Location</InputLabel><Select label="Location" onChange={(event) => { setLocationId(event.target.value === "all" ? "all" : Number(event.target.value)); setPage(0); }} value={locationId}><MenuItem value="all">All locations</MenuItem>{locations.map((location) => <MenuItem key={location.id} value={location.id}>{location.name}</MenuItem>)}</Select></FormControl> : null}<Chip label={`${history.pagination.total} closed drawers`} sx={{ ml: { md: "auto" } }} /></Stack></CardContent></Card>

      <Card sx={{ border: 1, borderColor: "divider", overflow: "hidden" }}><Box sx={{ overflowX: "auto" }}><DataGrid columns={columns} disableColumnMenu disableRowSelectionOnClick getRowHeight={() => isMobile ? 70 : 62} getRowId={(row) => row.drawer.id} loading={loading} onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }} onRowClick={({ row }) => void viewReport(row.drawer.id)} pageSizeOptions={PAGE_SIZE_OPTIONS} paginationMode="server" paginationModel={{ page, pageSize }} rowCount={history.pagination.total} rows={history.items} sx={{ border: 0, cursor: "pointer", minHeight: { xs: 500, sm: 590 }, minWidth: isMobile ? 840 : 960, "& .MuiDataGrid-cell": { alignItems: "center", display: "flex" }, "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" } }} /></Box></Card>
    </Stack>

    <Dialog fullWidth maxWidth="lg" onClose={() => !detailLoading && closeDetail()} open={Boolean(detail) || detailLoading}>
      <DialogTitle component="div"><Stack alignItems="flex-start" direction="row" justifyContent="space-between" gap={2}><Box><Stack alignItems="center" direction="row" gap={1}><Typography fontWeight={900} variant="h5">Drawer Close Report {detail ? `#${detail.drawer.id}` : ""}</Typography>{detail ? settlementChip(detail) : null}</Stack><Typography color="text.secondary" mt={0.5} variant="body2">{detail ? `${detail.drawer.locationName} · closed ${dateTime(detail.drawer.closedAt)}` : "Loading the saved reconciliation…"}</Typography></Box><IconButton onClick={closeDetail}><CloseRoundedIcon /></IconButton></Stack></DialogTitle>
      <Divider />
      <DialogContent dividers>{detail ? <Stack spacing={2.25}>
        <Tabs aria-label="Drawer report views" onChange={(_, value: "shift" | "location-day") => setReportTab(value)} value={reportTab} variant={isMobile ? "fullWidth" : "standard"}><Tab icon={<ReceiptLongRoundedIcon fontSize="small" />} iconPosition="start" label="This shift" value="shift" /><Tab icon={<CalendarMonthRoundedIcon fontSize="small" />} iconPosition="start" label="Location day" value="location-day" /></Tabs>

        {reportTab === "shift" ? <Stack spacing={2.25}>
          <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(5, minmax(0, 1fr))" } }}><Metric label="Net sales" value={fCurrency(detail.summary.totalAmount)} /><Metric label="Repair collections" value={fCurrency(detail.summary.repairPaymentTotal)} /><Metric label="Discounts" value={fCurrency(detail.summary.discountAmount)} /><Metric label="Expected cash" value={fCurrency(detail.reconciliation.expected.cash)} /><Metric label="Cash variance" tone={detail.reconciliation.differences.cash === 0 ? "success" : detail.reconciliation.differences.cash === null ? undefined : "warning"} value={moneyOrDash(detail.reconciliation.differences.cash)} /></Box>
          <Card variant="outlined"><CardContent><Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={1.5} justifyContent="space-between"><Box><Typography fontWeight={900}>Shift record</Typography><Typography color="text.secondary" variant="body2">Opened by {detail.drawer.openedByName} at {dateTime(detail.drawer.openedAt)}</Typography></Box><Box textAlign={{ xs: "left", sm: "right" }}><Typography fontWeight={800}>Closed by {detail.drawer.closedByName ?? "Not recorded"}</Typography><Typography color="text.secondary" variant="body2">Opening cash {fCurrency(detail.drawer.openingCash)} · Petty cash {moneyOrDash(detail.drawer.cashExpenseAmount)}</Typography></Box></Stack></CardContent></Card>
          <Card variant="outlined"><Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, py: 1.5 }}><Stack alignItems="center" direction="row" gap={1}><PointOfSaleRoundedIcon color="primary" fontSize="small" /><Box><Typography fontWeight={900}>Payment reconciliation</Typography><Typography color="text.secondary" variant="caption">Expected system payments compared with the physical closing count.</Typography></Box></Stack></Box><Box sx={{ overflowX: "auto" }}><DataGrid autoHeight columns={reconciliationColumns} disableColumnMenu disableRowSelectionOnClick hideFooter rows={reconciliationRows} sx={{ border: 0, minWidth: 840, "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" } }} /></Box></Card>
          <Stack spacing={1.25}><Stack alignItems="center" direction="row" gap={1}><ReceiptLongRoundedIcon color="primary" fontSize="small" /><Box><Typography fontWeight={900}>Shift sales</Typography><Typography color="text.secondary" variant="body2">Product performance and barcode-level traceability for this drawer.</Typography></Box></Stack><ActivityMetrics activity={detail.shift} canViewProfit={canViewProfit} />{canViewProfit ? null : <LockedProfitCard />}<ProductBreakdown activity={detail.shift} /></Stack>
          <Card variant="outlined"><CardContent><Typography fontWeight={900}>Close note</Typography><Typography color={detail.drawer.closeNote ? "text.primary" : "text.secondary"} mt={0.75} sx={{ whiteSpace: "pre-wrap" }} variant="body2">{detail.drawer.closeNote || "No closing note was recorded."}</Typography></CardContent></Card>
        </Stack> : <Stack spacing={2.25}>
          <Card variant="outlined"><CardContent><Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={1.5} justifyContent="space-between"><Box><Typography fontWeight={900}>Location day</Typography><Typography color="text.secondary" variant="body2">All completed sales at {detail.drawer.locationName}, based on Sri Lanka business time.</Typography></Box><TextField InputLabelProps={{ shrink: true }} label="Business date" onChange={(event) => setLocationDayDate(event.target.value)} size="small" type="date" value={locationDayDate} /></Stack></CardContent></Card>
          {locationDayLoading ? <Card variant="outlined"><CardContent><Typography color="text.secondary" textAlign="center">Loading the location-day activity…</Typography></CardContent></Card> : null}
          {locationDay && !locationDayLoading ? <Stack spacing={2.25}>
            <ActivityMetrics activity={locationDay} canViewProfit={canViewProfit} />
            {!canViewProfit ? <LockedProfitCard /> : null}
            <Card variant="outlined"><Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, py: 1.5 }}><Stack alignItems="center" direction="row" gap={1}><AccountBalanceWalletOutlinedIcon color="primary" fontSize="small" /><Box><Typography fontWeight={900}>Drawer activity</Typography><Typography color="text.secondary" variant="caption">Completed sales grouped by drawer for this location day.</Typography></Box></Stack></Box><Stack direction="row" flexWrap="wrap" gap={1.25} p={1.5}>{locationDay.drawerPerformance.length ? locationDay.drawerPerformance.map((drawer) => <Card key={drawer.drawerId ?? "legacy"} sx={{ flex: "1 1 185px", minWidth: 170 }} variant="outlined"><CardContent sx={{ p: "14px !important" }}><Stack direction="row" justifyContent="space-between" gap={1}><Typography fontWeight={800} noWrap>{drawer.label}</Typography><Chip color={drawer.status === "open" ? "warning" : "default"} label={drawer.status} size="small" /></Stack><Typography color="text.secondary" mt={0.5} noWrap variant="caption">{drawer.openedByName || "No drawer owner"}</Typography><Typography fontWeight={900} mt={1}>{fCurrency(drawer.totalAmount)}</Typography><Typography color="text.secondary" variant="caption">{drawer.salesCount} completed sale{drawer.salesCount === 1 ? "" : "s"}</Typography></CardContent></Card>) : <Typography color="text.secondary" variant="body2">No completed sales were recorded on this date.</Typography>}</Stack></Card>
            <ProductBreakdown activity={locationDay} />
          </Stack> : null}
        </Stack>}
      </Stack> : null}</DialogContent>
      <DialogActions><Button color="inherit" onClick={closeDetail}>Close report</Button></DialogActions>
    </Dialog>
  </>;
}
