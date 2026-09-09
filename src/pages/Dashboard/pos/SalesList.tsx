import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, InputAdornment, Stack, TextField, Tooltip, Typography } from "@mui/material";
import { DataGrid, GridFooter, type GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import AdvancedDateRangeFilter from "../../../components/common/AdvancedDateRangeFilter";
import PageMeta from "../../../components/common/PageMeta";
import { getDailySalesSummary, getSale, getSales, type DailySalesSummaryResponse, type SaleDetail, type SaleListItem } from "../../../redux/slices/posRedux/saleRedux";
import { fCurrency } from "../../../utils/formatNumber";
import { printSaleReceipt } from "../../../utils/printSaleReceipt";
import { PATH_DASHBOARD } from "../../../routes/paths";

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];
const toDateInput = (date: Date) => {
  const value = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return value.toISOString().slice(0, 10);
};
const today = toDateInput(new Date());
const monthStart = toDateInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

export default function SalesList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPosMode = searchParams.get("mode") === "pos";
  const [rows, setRows] = useState<SaleListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fromDate, setFromDate] = useState(monthStart);
  const [summary, setSummary] = useState<DailySalesSummaryResponse | null>(null);
  const [status, setStatus] = useState("all");
  const [toDate, setToDate] = useState(today);
  const [detail, setDetail] = useState<SaleDetail | null>(null);

  useEffect(() => { const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(0); }, 300); return () => window.clearTimeout(timer); }, [search]);

  const load = useCallback(async () => {
    try {
      const response = await getSales({ fromDate, page: page + 1, pageSize, search: debouncedSearch, status, toDate });
      setRows(response.items);
      setTotal(response.pagination.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load sales.");
    }
  }, [debouncedSearch, fromDate, page, pageSize, status, toDate]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    void getDailySalesSummary({ fromDate, toDate })
      .then(setSummary)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load daily sale summary."));
  }, [fromDate, toDate]);

  const openSale = async (id: number) => {
    try { setDetail(await getSale(id)); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load sale."); }
  };

  const columns = useMemo<GridColDef<SaleListItem>[]>(() => [
    { field: "invoiceNo", headerName: "Invoice", minWidth: 190, renderCell: ({ row }) => <Stack justifyContent="center" sx={{ minWidth: 0 }}><Typography fontWeight={800} noWrap variant="body2">{row.invoiceNo}</Typography><Typography color="text.secondary" noWrap variant="caption">{new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(Number(row.timestamp)))}</Typography></Stack> },
    { field: "customerName", flex: 1, headerName: "Customer", minWidth: 220, renderCell: ({ row }) => <Stack justifyContent="center" sx={{ minWidth: 0 }}><Typography fontWeight={700} noWrap variant="body2">{row.customerName || "Walk-in Customer"}</Typography><Typography color="text.secondary" noWrap variant="caption">{row.locationName}</Typography></Stack> },
    { field: "totalAmount", headerName: "Total", minWidth: 150, renderCell: ({ row }) => <Typography fontWeight={800} variant="body2">{fCurrency(Number(row.totalAmount))}</Typography> },
    { field: "paidAmount", headerName: "Paid", minWidth: 140, renderCell: ({ row }) => <Typography color="text.secondary" variant="body2">{fCurrency(Number(row.paidAmount))}</Typography> },
    { field: "status", headerName: "Status", minWidth: 120, renderCell: ({ value }) => <Chip color={value === "completed" ? "success" : "default"} label={String(value)} size="small" /> },
    { field: "timestamp", headerName: "Date", minWidth: 150, valueFormatter: (value) => new Intl.DateTimeFormat("en-LK", { dateStyle: "medium" }).format(new Date(Number(value))) },
    { field: "actions", align: "center", headerName: "", minWidth: 80, sortable: false, renderCell: ({ row }) => <Tooltip title="Print receipt"><IconButton onClick={(event) => { event.stopPropagation(); void getSale(row.id).then(printSaleReceipt); }} size="small"><LocalPrintshopOutlinedIcon /></IconButton></Tooltip> },
  ], []);
  const SalesTableFooter = useCallback(() => (
    <Box>
      <Stack
        alignItems={{ xs: "stretch", sm: "center" }}
        direction={{ xs: "column", sm: "row" }}
        gap={1}
        justifyContent="space-between"
        sx={{
          borderTop: 1,
          borderColor: "divider",
          minHeight: { xs: 76, sm: 64 },
          px: { xs: 1.5, md: 3 },
          py: { xs: 1.25, sm: 0 },
        }}
      >
        <Stack direction="row" flexWrap="wrap" gap={{ xs: 1, sm: 2.5 }}>
          <Typography color="text.secondary" fontWeight={700} variant="body2">{summary?.totals.saleCount ?? 0} sales</Typography>
          <Typography color="text.secondary" fontWeight={700} variant="body2">Discount {fCurrency(summary?.totals.discountAmount ?? 0)}</Typography>
          <Typography color="text.secondary" fontWeight={700} variant="body2">Paid {fCurrency(summary?.totals.paidAmount ?? 0)}</Typography>
        </Stack>
        <Stack alignItems="center" direction="row" justifyContent={{ xs: "space-between", sm: "flex-end" }} spacing={1.5}>
          <Typography color="text.secondary" fontWeight={800} variant="body1">Total Sale</Typography>
          <Typography color="primary.main" fontWeight={900} variant="h5">{fCurrency(summary?.totals.totalAmount ?? 0)}</Typography>
        </Stack>
      </Stack>
      <GridFooter />
    </Box>
  ), [summary]);

  return <>
    <PageMeta description="Review completed customer sales and print invoice receipts." title="Sales List | Mobee Suite" />
    <Box sx={isPosMode ? { bgcolor: "background.default", inset: 0, overflow: "auto", p: { xs: 1.25, sm: 2, md: 3 }, position: "fixed", zIndex: (theme) => theme.zIndex.modal - 1 } : undefined}>
    <Stack spacing={2.25} sx={{ mx: "auto", width: "min(1500px, 100%)" }}>
      <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={1.5} justifyContent="space-between">
        <Stack alignItems="center" direction="row" spacing={1}><ReceiptLongRoundedIcon color="primary" /><Typography variant="h4">Sales List</Typography></Stack>
        <Stack alignItems="center" direction="row" gap={1} flexWrap="wrap">
          {isPosMode ? <Button color="inherit" onClick={() => navigate(PATH_DASHBOARD.pos.root)} startIcon={<ArrowBackRoundedIcon />} variant="outlined">Back to POS</Button> : null}
          <AdvancedDateRangeFilter fromDate={fromDate} onChange={(nextFrom, nextTo) => { setFromDate(nextFrom); setToDate(nextTo); setPage(0); }} toDate={toDate} />
        </Stack>
      </Stack>
      <Card sx={{ borderRadius: 3, minHeight: 700, overflow: "hidden" }}>
        <Stack direction={{ xs: "column", md: "row" }} gap={1.5} p={1.5}>
          <TextField onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice, customer or phone" size="small" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} sx={{ flex: 1 }} value={search} />
          <TextField onChange={(event) => { setStatus(event.target.value); setPage(0); }} select SelectProps={{ native: true }} size="small" value={status}>
            <option value="all">All statuses</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option><option value="returned">Returned</option>
          </TextField>
        </Stack>
        <Box sx={{ overflowX: "auto" }}>
          <DataGrid columns={columns} disableColumnMenu disableRowSelectionOnClick getRowHeight={() => 58} onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }} onRowClick={({ row }) => void openSale(row.id)} pageSizeOptions={PAGE_SIZE_OPTIONS} paginationMode="server" paginationModel={{ page, pageSize }} rowCount={total} rows={rows} slots={{ footer: SalesTableFooter }} sx={{ border: 0, cursor: "pointer", minHeight: 610, minWidth: { xs: 760, md: 0 }, "& .MuiDataGrid-cell": { alignItems: "center", display: "flex" }, "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" } }} />
        </Box>
      </Card>
    </Stack>
    </Box>
    <Dialog fullWidth maxWidth="md" onClose={() => setDetail(null)} open={Boolean(detail)}>
      <DialogTitle component="div"><Stack direction="row" justifyContent="space-between"><Box><Typography variant="h5">{detail?.invoiceNo}</Typography><Typography color="text.secondary" variant="body2">{detail?.customerName ?? "Walk-in Customer"} • {detail?.locationName}</Typography></Box><Button onClick={() => detail && printSaleReceipt(detail)} startIcon={<LocalPrintshopOutlinedIcon />} variant="contained">Print</Button></Stack></DialogTitle>
      <Divider />
      <DialogContent>
        <Stack spacing={1.5}>{detail?.items.map((item) => <Box key={item.id} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}><Stack direction="row" justifyContent="space-between"><Box><Typography fontWeight={800}>{item.productName}</Typography><Typography color="text.secondary" variant="caption">{item.quantity} × {fCurrency(Number(item.unitPrice))}</Typography></Box><Typography fontWeight={800}>{fCurrency(Number(item.totalAmount))}</Typography></Stack></Box>)}</Stack>
        <Divider sx={{ my: 2 }} />
        <Stack alignItems="flex-end"><Typography>Subtotal: {fCurrency(Number(detail?.subTotal ?? 0))}</Typography><Typography>Discount: {fCurrency(Number(detail?.discountAmount ?? 0))}</Typography><Typography variant="h5">Total: {fCurrency(Number(detail?.totalAmount ?? 0))}</Typography></Stack>
      </DialogContent>
      <DialogActions><Button color="inherit" onClick={() => setDetail(null)}>Close</Button></DialogActions>
    </Dialog>
  </>;
}
