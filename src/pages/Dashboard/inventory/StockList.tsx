import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import QrCodeScannerRoundedIcon from "@mui/icons-material/QrCodeScannerRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { alpha } from "@mui/material/styles";
import { Box, Button, Card, Chip, CircularProgress, InputAdornment, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import type { FormEvent } from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import AddApprovedGrnStockDialog from "../../../components/inventory/AddApprovedGrnStockDialog";
import StockProductUnitsDialog from "../../../components/inventory/StockProductUnitsDialog";
import useAuth from "../../../hooks/useAuth";
import { checkStockAvailability, getPendingStockReceipts, getStock, getStockStatuses, type PendingStockReceipt, type StockAvailabilityCheck, type StockProductSummary, type StockStatus } from "../../../redux/slices/inventoryRedux/stockRedux";
import { getLocations, type Location } from "../../../redux/slices/settingsRedux/businessSettingsRedux";
import { USER_PERMISSIONS } from "../../../utils";
import { fCurrency } from "../../../utils/formatNumber";

const pageSizes = [10, 15, 25, 50];
const playScanSound = (success: boolean) => {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const playTone = (frequency: number, start: number, duration: number) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, context.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + start + duration);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(context.currentTime + start);
    oscillator.stop(context.currentTime + start + duration + 0.02);
  };
  if (success) {
    playTone(880, 0, 0.09);
    playTone(1175, 0.1, 0.11);
  } else {
    playTone(220, 0, 0.18);
  }
  window.setTimeout(() => void context.close(), success ? 450 : 300);
};

export default function StockList() {
  const { can } = useAuth();
  const [tab, setTab] = useState(0);
  const [stockRows, setStockRows] = useState<StockProductSummary[]>([]);
  const [pendingRows, setPendingRows] = useState<PendingStockReceipt[]>([]);
  const [stockTotal, setStockTotal] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [locationId, setLocationId] = useState<number | "all">("all");
  const [statusId, setStatusId] = useState<number | "all">("all");
  const [locations, setLocations] = useState<Location[]>([]);
  const [statuses, setStatuses] = useState<StockStatus[]>([]);
  const [activeGrnId, setActiveGrnId] = useState<number | null>(null);
  const [activeStockProduct, setActiveStockProduct] = useState<StockProductSummary | null>(null);
  const [availabilityCode, setAvailabilityCode] = useState("");
  const [availabilityResult, setAvailabilityResult] = useState<StockAvailabilityCheck | null>(null);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const canAdd = can(USER_PERMISSIONS.GRNS_STOCK_ADD);

  const loadStock = useCallback(async () => {
    try {
      const response = await getStock({ locationId, page: page + 1, pageSize, search, statusId });
      setStockRows(response.items); setStockTotal(response.pagination.total);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load stock."); }
  }, [locationId, page, pageSize, search, statusId]);
  const loadPending = useCallback(async () => {
    if (!canAdd) return;
    try {
      const response = await getPendingStockReceipts({ locationId, page: page + 1, pageSize, search });
      setPendingRows(response.items); setPendingTotal(response.pagination.total);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load approved receipts."); }
  }, [canAdd, locationId, page, pageSize, search]);
  useEffect(() => {
    const timer = window.setTimeout(() => { if (tab === 0) void loadStock(); else void loadPending(); }, 220);
    return () => window.clearTimeout(timer);
  }, [loadPending, loadStock, tab]);
  useEffect(() => {
    Promise.all([getLocations({ isActive: "true", page: 1, pageSize: 100, search: "", type: "all" }), getStockStatuses()])
      .then(([locationData, statusData]) => {
        setLocations(locationData.items);
        setStatuses(statusData);
        const availableStatus = statusData.find((status) => status.name === "available" || status.isSellable);
        if (availableStatus) setStatusId((current) => current === "all" ? availableStatus.id : current);
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load stock filters."));
  }, []);

  const stockColumns = useMemo<GridColDef<StockProductSummary>[]>(() => [
    { field: "productName", headerName: "Product", flex: 1, minWidth: 300, renderCell: ({ row }) => <Stack justifyContent="center" sx={{ minWidth: 0 }}><Typography fontWeight={700} noWrap variant="body2">{row.productName ?? "Unknown product"}</Typography><Typography color="text.secondary" noWrap variant="caption">{row.productSku || `Product #${row.productId ?? "-"}`}</Typography></Stack> },
    { field: "locationName", headerName: "Location", minWidth: 150, renderCell: ({ row }) => <Typography variant="body2">{row.locationName ?? "Unassigned"}</Typography> },
    { field: "quantity", headerName: "Units", minWidth: 105, align: "center", headerAlign: "center", renderCell: ({ row }) => <Chip color="primary" label={`${row.quantity} unit${row.quantity === 1 ? "" : "s"}`} size="small" variant="outlined" /> },
    { field: "productMrpPrice", headerName: "MRP", minWidth: 145, renderCell: ({ row }) => <Typography fontWeight={600} variant="body2">{fCurrency(Number(row.productMrpPrice ?? 0))}</Typography> },
    { field: "averageCost", headerName: "Avg cost", minWidth: 145, renderCell: ({ row }) => <Typography color="text.secondary" variant="body2">{fCurrency(Number(row.averageCost))}</Typography> },
    { field: "statusLabel", headerName: "Status", minWidth: 130, renderCell: ({ row }) => <Chip color={row.statusName === "available" ? "success" : "default"} label={row.statusLabel ?? "Unassigned"} size="small" /> },
    { field: "lastAddedAt", headerName: "Last added", minWidth: 185, renderCell: ({ row }) => <Typography noWrap variant="body2">{new Date(Number(row.lastAddedAt)).toLocaleString("en-LK")}</Typography> },
  ], []);
  const pendingColumns = useMemo<GridColDef<PendingStockReceipt>[]>(() => [
    { field: "grnNumber", headerName: "GRN Number", minWidth: 200 },
    { field: "supplierName", headerName: "Supplier", flex: 1, minWidth: 200, renderCell: ({ row }) => <Box><Typography fontWeight={700} variant="body2">{row.supplierName}</Typography><Typography color="text.secondary" variant="caption">{row.supplierCode}</Typography></Box> },
    { field: "locationName", headerName: "Location", minWidth: 170 },
    { field: "remainingQuantity", headerName: "Ready units", minWidth: 120, align: "center", headerAlign: "center" },
    { field: "timestamp", headerName: "Final approved", minWidth: 180, valueFormatter: (value) => new Date(Number(value)).toLocaleString("en-LK") },
    { field: "actions", headerName: "", minWidth: 160, sortable: false, filterable: false, renderCell: ({ row }) => <Button onClick={(event) => { event.stopPropagation(); setActiveGrnId(row.grnId); }} size="small" startIcon={<AddRoundedIcon />} variant="contained">Add to Stock</Button> },
  ], []);

  const resetPage = () => setPage(0);
  const availableStatus = statuses.find((status) => status.name === "available" || status.isSellable);
  const soldStatus = statuses.find((status) => status.name === "sold");
  const selectedStockMode = soldStatus && statusId === soldStatus.id
    ? "sold"
    : availableStatus && statusId === availableStatus.id
      ? "available"
      : statusId === "all"
        ? "all"
        : "custom";
  const changeStockStatus = (nextStatusId: number | "all") => {
    setStatusId(nextStatusId);
    resetPage();
  };
  const stockViewNote = selectedStockMode === "sold"
    ? "Showing sold units only. Available stock stays hidden in this view."
    : selectedStockMode === "available"
      ? "Default view: only stock available for selling."
      : selectedStockMode === "all"
        ? "Showing every stock status together for review."
        : "Showing a filtered stock status.";
  const submitAvailabilityCheck = async (event?: FormEvent) => {
    event?.preventDefault();
    const code = availabilityCode.trim();
    if (!code) {
      toast.error("Scan or enter a barcode, IMEI, or serial number.");
      return;
    }
    setCheckingAvailability(true);
    try {
      const result = await checkStockAvailability(code);
      setAvailabilityResult(result);
      playScanSound(Boolean(result.found && result.item?.isSellable));
    } catch (error) {
      playScanSound(false);
      toast.error(error instanceof Error ? error.message : "Unable to check stock availability.");
    } finally {
      setCheckingAvailability(false);
      setAvailabilityCode("");
    }
  };
  const inventoryGrid = tab === 0
    ? <DataGrid<StockProductSummary> columns={stockColumns} disableColumnMenu disableRowSelectionOnClick getRowHeight={() => 54} getRowId={(row) => `${row.productId}:${row.locationId}:${row.statusId}`} onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }} onRowClick={({ row }) => { if (row.productId) setActiveStockProduct(row); }} pageSizeOptions={pageSizes} paginationMode="server" paginationModel={{ page, pageSize }} rowCount={stockTotal} rows={stockRows} sx={{ border: 0, minHeight: 480, "& .MuiDataGrid-row": { cursor: "pointer" } }} />
    : <DataGrid<PendingStockReceipt> columns={pendingColumns} disableColumnMenu disableRowSelectionOnClick getRowId={(row) => row.grnId} onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }} pageSizeOptions={pageSizes} paginationMode="server" paginationModel={{ page, pageSize }} rowCount={pendingTotal} rows={pendingRows} sx={{ border: 0, minHeight: 480 }} />;

  return <><PageMeta description="View Mobee stock products and their physical inventory units." title="Stock List | Mobee Suite" /><Stack spacing={2.5}>
    <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={1.5} justifyContent="space-between"><Stack alignItems="center" direction="row" spacing={1}><Inventory2OutlinedIcon color="primary" sx={{ fontSize: 24 }} /><Typography variant="h4">Stock List</Typography></Stack>{canAdd && <Button onClick={() => { setTab(1); resetPage(); }} startIcon={<AddRoundedIcon />} variant="contained">Add to Stock</Button>}</Stack>
    <Card component="form" onSubmit={(event) => void submitAvailabilityCheck(event)} sx={{ p: 2, overflow: "hidden" }}>
      <Stack alignItems={{ xs: "stretch", md: "center" }} direction={{ xs: "column", md: "row" }} gap={1.5}>
        <Stack alignItems="center" direction="row" spacing={1.25} sx={{ minWidth: { md: 260 } }}>
          <QrCodeScannerRoundedIcon color="primary" sx={{ fontSize: 25 }} />
          <Box>
            <Typography fontWeight={700}>Availability check</Typography>
            <Typography color="text.secondary" variant="caption">Scan barcode, IMEI, or serial number.</Typography>
          </Box>
        </Stack>
        <TextField autoComplete="off" autoFocus onChange={(event) => setAvailabilityCode(event.target.value)} placeholder="Scan or type code, then press Enter" size="small" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} sx={{ flex: 1 }} value={availabilityCode} />
        <Button disabled={checkingAvailability} type="submit" variant="contained" sx={{ minWidth: 120 }}>{checkingAvailability ? <CircularProgress color="inherit" size={20} /> : "Check"}</Button>
      </Stack>
      {availabilityResult ? <Box sx={(theme) => ({ bgcolor: availabilityResult.found && availabilityResult.item?.isSellable ? alpha(theme.palette.success.main, 0.12) : alpha(theme.palette.error.main, 0.12), border: 1, borderColor: availabilityResult.found && availabilityResult.item?.isSellable ? "success.main" : "error.main", borderRadius: 2, mt: 1.5, p: 1.5 })}>
        <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={1.25} justifyContent="space-between">
          <Stack alignItems="center" direction="row" spacing={1}>
            {availabilityResult.found && availabilityResult.item?.isSellable ? <CheckCircleOutlineRoundedIcon color="success" /> : <ErrorOutlineRoundedIcon color="error" />}
            <Box>
              <Typography fontWeight={800}>{availabilityResult.found ? availabilityResult.item?.productName ?? "Unknown product" : "Not found"}</Typography>
              <Typography color="text.secondary" variant="body2">{availabilityResult.message}</Typography>
            </Box>
          </Stack>
          {availabilityResult.found ? <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction="row" flexWrap="wrap" gap={1}>
            <Chip label={availabilityResult.item?.identifierValue ?? availabilityResult.query} size="small" variant="outlined" />
            <Chip color={availabilityResult.item?.isSellable ? "success" : "default"} label={availabilityResult.item?.statusLabel ?? "Unassigned"} size="small" />
            <Typography color="text.secondary" variant="caption">{availabilityResult.item?.locationName ?? "No location"}</Typography>
          </Stack> : null}
        </Stack>
      </Box> : null}
    </Card>
    <Card sx={{ minHeight: 600, overflow: "hidden" }}>
      <Tabs onChange={(_event, value) => { setTab(value); resetPage(); }} value={tab}>
        <Tab label="Stock units" />
        {canAdd && <Tab label={`Ready to add${pendingTotal ? ` (${pendingTotal})` : ""}`} />}
      </Tabs>
      {tab === 0 ? <Stack alignItems={{ xs: "flex-start", md: "center" }} direction={{ xs: "column", md: "row" }} gap={1} px={1.5} pt={1.5}>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {availableStatus ? <Chip clickable color={selectedStockMode === "available" ? "primary" : "default"} label="Available stock" onClick={() => changeStockStatus(availableStatus.id)} size="small" variant={selectedStockMode === "available" ? "filled" : "outlined"} /> : null}
          {soldStatus ? <Chip clickable color={selectedStockMode === "sold" ? "primary" : "default"} label="Sold stock" onClick={() => changeStockStatus(soldStatus.id)} size="small" variant={selectedStockMode === "sold" ? "filled" : "outlined"} /> : null}
          <Chip clickable color={selectedStockMode === "all" ? "primary" : "default"} label="All statuses" onClick={() => changeStockStatus("all")} size="small" variant={selectedStockMode === "all" ? "filled" : "outlined"} />
        </Stack>
        <Typography color="text.secondary" variant="caption">{stockViewNote}</Typography>
      </Stack> : null}
      <Stack direction={{ xs: "column", md: "row" }} gap={1} p={1.5}>
        <TextField onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder={tab === 0 ? "Search product, identifier or code" : "Search GRN or supplier"} size="small" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} sx={{ flex: 1, minWidth: 240 }} value={search} />
        <TextField onChange={(event) => { setLocationId(event.target.value === "all" ? "all" : Number(event.target.value)); resetPage(); }} select size="small" slotProps={{ select: { native: true } }} value={locationId}>
          <option value="all">All locations</option>
          {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
        </TextField>
        {tab === 0 && <TextField onChange={(event) => { setStatusId(event.target.value === "all" ? "all" : Number(event.target.value)); resetPage(); }} select size="small" slotProps={{ select: { native: true } }} value={statusId}>
          <option value="all">All stock statuses</option>
          {statuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
        </TextField>}
      </Stack>
      {inventoryGrid}
    </Card>
  </Stack><AddApprovedGrnStockDialog grnId={activeGrnId} onClose={() => setActiveGrnId(null)} onCompleted={() => { void loadStock(); void loadPending(); }} /><StockProductUnitsDialog onClose={() => setActiveStockProduct(null)} stockProduct={activeStockProduct} /></>;
}
