import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import ShoppingCartCheckoutRoundedIcon from "@mui/icons-material/ShoppingCartCheckoutRounded";
import { Box, Button, Card, CardContent, Chip, FormControl, InputLabel, MenuItem, Select, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "react-toastify";
import AdvancedDateRangeFilter from "../../../components/common/AdvancedDateRangeFilter";
import PageMeta from "../../../components/common/PageMeta";
import useAuth from "../../../hooks/useAuth";
import { getReport, type ReportKind, type ReportResponse } from "../../../redux/slices/reportRedux/reportRedux";
import { getLocations, type Location } from "../../../redux/slices/settingsRedux/businessSettingsRedux";
import { USER_ROLES } from "../../../utils";
import { fCurrency } from "../../../utils/formatNumber";

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

const formatDateTime = (value: unknown) => typeof value === "number" ? new Date(value).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" }) : String(value ?? "—");
const money = (value: unknown) => fCurrency(Number(value || 0));

const configs: Record<ReportKind, {
  columns: GridColDef[];
  description: string;
  icon: ReactNode;
  rowId: (row: Record<string, unknown>, index: number) => string | number;
  summary: Array<{ field: string; label: string; type?: "currency" | "number" }>;
  title: string;
}> = {
  inventory: {
    columns: [
      { field: "productName", flex: 1, headerName: "Product", minWidth: 260 },
      { field: "locationName", headerName: "Location", minWidth: 160 },
      { field: "status", headerName: "Status", minWidth: 140 },
      { align: "center", field: "units", headerAlign: "center", headerName: "Units", minWidth: 100 },
      { align: "right", field: "avgCost", headerAlign: "right", headerName: "Avg cost", minWidth: 150, valueFormatter: money },
      { align: "right", field: "valueAtCost", headerAlign: "right", headerName: "Cost value", minWidth: 160, valueFormatter: money },
      { align: "right", field: "mrpValue", headerAlign: "right", headerName: "MRP value", minWidth: 160, valueFormatter: money },
    ],
    description: "Stock position, cost value, MRP value, and units by product, location, and status.",
    icon: <Inventory2OutlinedIcon color="primary" />,
    rowId: (row, index) => `${row.productName}-${row.locationName}-${row.status}-${index}`,
    summary: [
      { field: "units", label: "Total units", type: "number" },
      { field: "costValue", label: "Stock cost value", type: "currency" },
      { field: "mrpValue", label: "Stock MRP value", type: "currency" },
    ],
    title: "Inventory Report",
  },
  purchasing: {
    columns: [
      { field: "grnNumber", flex: 1, headerName: "GRN", minWidth: 190 },
      { field: "supplierName", flex: 1, headerName: "Supplier", minWidth: 220 },
      { field: "locationName", headerName: "Location", minWidth: 160 },
      { field: "status", headerName: "Status", minWidth: 180 },
      { field: "paymentStatus", headerName: "Payment", minWidth: 150 },
      { align: "right", field: "costTotal", headerAlign: "right", headerName: "Cost total", minWidth: 160, valueFormatter: money },
      { align: "right", field: "paidAmount", headerAlign: "right", headerName: "Paid", minWidth: 150, valueFormatter: money },
      { field: "timestamp", headerName: "Date", minWidth: 180, valueFormatter: formatDateTime },
    ],
    description: "GRN purchasing totals, supplier cost, payment status, and approval status.",
    icon: <ShoppingCartCheckoutRoundedIcon color="primary" />,
    rowId: (row, index) => `${row.grnNumber}-${index}`,
    summary: [
      { field: "grnCount", label: "GRNs", type: "number" },
      { field: "costTotal", label: "Purchase cost", type: "currency" },
      { field: "paidAmount", label: "Paid", type: "currency" },
      { field: "balanceAmount", label: "Balance", type: "currency" },
    ],
    title: "Purchasing Report",
  },
  repairs: {
    columns: [
      { field: "jobNo", flex: 1, headerName: "Job", minWidth: 190 },
      { field: "deviceName", flex: 1, headerName: "Device", minWidth: 240 },
      { field: "serialImei", headerName: "IMEI / Serial", minWidth: 180, valueFormatter: (value) => value || "—" },
      { field: "locationName", headerName: "Location", minWidth: 160 },
      { field: "status", headerName: "Status", minWidth: 150 },
      { align: "right", field: "estimatedCost", headerAlign: "right", headerName: "Estimated", minWidth: 150, valueFormatter: money },
      { align: "right", field: "finalCost", headerAlign: "right", headerName: "Final", minWidth: 150, valueFormatter: money },
      { field: "timestamp", headerName: "Created", minWidth: 180, valueFormatter: formatDateTime },
    ],
    description: "Repair volume, status mix, estimated cost, and final repair revenue.",
    icon: <BuildRoundedIcon color="primary" />,
    rowId: (row, index) => `${row.jobNo}-${index}`,
    summary: [
      { field: "repairCount", label: "Repair jobs", type: "number" },
      { field: "estimatedCost", label: "Estimated", type: "currency" },
      { field: "finalCost", label: "Final", type: "currency" },
    ],
    title: "Repair Report",
  },
  sales: {
    columns: [
      { field: "date", flex: 1, headerName: "Date", minWidth: 180 },
      { align: "center", field: "saleCount", headerAlign: "center", headerName: "Sales", minWidth: 120 },
      { align: "right", field: "totalAmount", headerAlign: "right", headerName: "Total sale", minWidth: 170, valueFormatter: money },
      { align: "right", field: "paidAmount", headerAlign: "right", headerName: "Paid", minWidth: 170, valueFormatter: money },
      { align: "right", field: "discountAmount", headerAlign: "right", headerName: "Discount", minWidth: 160, valueFormatter: money },
    ],
    description: "Day-by-day sales, payments, discounts, and total revenue for the selected period.",
    icon: <PointOfSaleRoundedIcon color="primary" />,
    rowId: (row) => String(row.date),
    summary: [
      { field: "saleCount", label: "Sales", type: "number" },
      { field: "subTotal", label: "Subtotal", type: "currency" },
      { field: "discountAmount", label: "Discount", type: "currency" },
      { field: "totalAmount", label: "Total sale", type: "currency" },
      { field: "paidAmount", label: "Paid", type: "currency" },
    ],
    title: "Sales Report",
  },
};

const csvValue = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

const downloadCsv = (title: string, rows: Array<Record<string, unknown>>) => {
  if (!rows.length) {
    toast.info("No rows to export.");
    return;
  }
  const columns = Object.keys(rows[0]);
  const csv = [columns.join(","), ...rows.map((row) => columns.map((key) => csvValue(row[key])).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

const printReport = (config: typeof configs[ReportKind], report: ReportResponse, filters: { fromDate: string; toDate: string; location: string }) => {
  const columns = report.rows[0] ? Object.keys(report.rows[0]) : [];
  const html = `<!doctype html><html><head><title>${config.title}</title><style>
    body{font-family:Arial,sans-serif;color:#111;margin:28px}
    h1{font-size:24px;margin:0 0 4px} .muted{color:#666}
    .meta{margin:12px 0 18px;font-size:13px}
    .cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:16px 0}
    .card{border:1px solid #ddd;border-radius:10px;padding:12px}
    .label{font-size:12px;color:#666}.value{font-size:18px;font-weight:800;margin-top:4px}
    table{width:100%;border-collapse:collapse;margin-top:14px;font-size:12px}
    th,td{border-bottom:1px solid #ddd;padding:8px;text-align:left;vertical-align:top}
    th{background:#f4f4f4;font-weight:800}
    @media print{body{margin:16px}.no-print{display:none}}
  </style></head><body>
    <h1>${config.title}</h1><div class="muted">MoBee.lk (PVT) Ltd.</div>
    <div class="meta">Period: ${filters.fromDate} to ${filters.toDate} &nbsp; | &nbsp; Location: ${filters.location}</div>
    <div class="cards">${config.summary.map((item) => `<div class="card"><div class="label">${item.label}</div><div class="value">${item.type === "currency" ? money(report.summary[item.field]) : String(report.summary[item.field] ?? 0)}</div></div>`).join("")}</div>
    <table><thead><tr>${columns.map((column) => `<th>${column}</th>`).join("")}</tr></thead><tbody>${report.rows.map((row) => `<tr>${columns.map((column) => `<td>${row[column] ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table>
  </body></html>`;
  const win = window.open("", "_blank", "width=1100,height=800");
  if (!win) return toast.error("Popup blocked. Please allow popups to print reports.");
  win.document.write(html);
  win.document.close();
  win.focus();
  window.setTimeout(() => win.print(), 300);
};

export default function ReportPage({ kind }: { kind: ReportKind }) {
  const config = configs[kind];
  const { hasRole } = useAuth();
  const isAdministrator = hasRole(USER_ROLES.ADMIN);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [fromDate, setFromDate] = useState(daysAgo(kind === "inventory" ? 0 : 6));
  const [toDate, setToDate] = useState(today());
  const [locationId, setLocationId] = useState<number | "all">("all");
  const [locations, setLocations] = useState<Location[]>([]);
  const [report, setReport] = useState<ReportResponse>({ rows: [], summary: {} });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdministrator) return;
    void getLocations({ isActive: "true", page: 1, pageSize: 100, search: "", type: "all" }).then((result) => setLocations(result.items)).catch(() => undefined);
  }, [isAdministrator]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        setReport(await getReport(kind, { fromDate, locationId, toDate }));
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load report.");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [fromDate, kind, locationId, toDate]);

  const locationName = locationId === "all"
    ? isAdministrator ? "All locations" : "Assigned location"
    : locations.find((location) => location.id === locationId)?.name ?? "Selected location";

  return <Stack spacing={{ xs: 2, sm: 2.5 }}>
    <PageMeta description={config.description} title={`${config.title} | Mobee Suite`} />
    <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
      <Stack direction="row" alignItems="center" gap={1}>
        {config.icon}
        <Box>
          <Typography sx={{ fontSize: { xs: "1.5rem", sm: "1.75rem" }, fontWeight: 800, lineHeight: 1.2 }}>{config.title}</Typography>
          <Typography color="text.secondary" variant="body2">{config.description}</Typography>
        </Box>
      </Stack>
      <Stack direction="row" gap={1}>
        <Button onClick={() => downloadCsv(config.title, report.rows)} startIcon={<DownloadRoundedIcon />} variant="outlined">CSV</Button>
        <Button onClick={() => printReport(config, report, { fromDate, location: locationName, toDate })} startIcon={<PrintRoundedIcon />} variant="contained">PDF / Print</Button>
      </Stack>
    </Stack>
    <Card sx={{ border: 1, borderColor: "divider" }}>
      <CardContent>
        <Stack alignItems={{ md: "center" }} direction={{ xs: "column", md: "row" }} gap={1.5}>
          {kind !== "inventory" ? <AdvancedDateRangeFilter fromDate={fromDate} onChange={(nextFrom, nextTo) => { setFromDate(nextFrom); setToDate(nextTo); }} toDate={toDate} /> : null}
          {isAdministrator ? <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Location</InputLabel>
            <Select label="Location" onChange={(event) => setLocationId(event.target.value === "all" ? "all" : Number(event.target.value))} value={locationId}>
              <MenuItem value="all">All locations</MenuItem>
              {locations.map((location) => <MenuItem key={location.id} value={location.id}>{location.name}</MenuItem>)}
            </Select>
          </FormControl> : null}
          <Chip icon={<AssessmentOutlinedIcon />} label={`${report.rows.length} report rows`} sx={{ ml: { md: "auto" } }} />
        </Stack>
      </CardContent>
    </Card>
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: `repeat(${Math.min(config.summary.length, 5)}, 1fr)` } }}>
      {config.summary.map((item) => <Card key={item.field} sx={{ border: 1, borderColor: "divider" }}>
        <CardContent>
          <Typography color="text.secondary" variant="body2">{item.label}</Typography>
          <Typography fontWeight={900} mt={0.5} variant="h5">{item.type === "currency" ? money(report.summary[item.field]) : String(report.summary[item.field] ?? 0)}</Typography>
        </CardContent>
      </Card>)}
    </Box>
    <Card sx={{ border: 1, borderColor: "divider", overflow: "hidden" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", px: 2, py: 1.5 }}>
        <Typography fontWeight={900}>Report details</Typography>
      </Box>
      <Box sx={{ overflowX: "auto" }}>
        <DataGrid
          autoHeight
          columns={config.columns}
          disableColumnMenu
          disableRowSelectionOnClick
          getRowId={(row) => config.rowId(row, report.rows.indexOf(row))}
          loading={loading}
          pageSizeOptions={[10, 25, 50, 100]}
          rows={report.rows}
          sx={{
            border: 0,
            minWidth: isMobile ? 760 : 980,
            "& .MuiDataGrid-cell": { alignItems: "center", display: "flex" },
            "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" },
          }}
        />
      </Box>
    </Card>
  </Stack>;
}
