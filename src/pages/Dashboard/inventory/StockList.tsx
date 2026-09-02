import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Box, Button, Card, Chip, InputAdornment, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import AddApprovedGrnStockDialog from "../../../components/inventory/AddApprovedGrnStockDialog";
import useAuth from "../../../hooks/useAuth";
import { getPendingStockReceipts, getStock, getStockStatuses, type PendingStockReceipt, type StockStatus, type StockUnit } from "../../../redux/slices/inventoryRedux/stockRedux";
import { getLocations, type Location } from "../../../redux/slices/settingsRedux/businessSettingsRedux";
import { USER_PERMISSIONS } from "../../../utils";
import { fCurrency } from "../../../utils/formatNumber";

const pageSizes = [10, 15, 25, 50];

export default function StockList() {
  const { can } = useAuth();
  const [tab, setTab] = useState(0);
  const [stockRows, setStockRows] = useState<StockUnit[]>([]);
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
      .then(([locationData, statusData]) => { setLocations(locationData.items); setStatuses(statusData); })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load stock filters."));
  }, []);

  const stockColumns = useMemo<GridColDef<StockUnit>[]>(() => [
    { field: "barcode", headerName: "Barcode", minWidth: 165, renderCell: ({ row }) => row.barcode ? <Chip label={row.barcode} size="small" variant="outlined" /> : <Typography color="text.secondary" variant="body2">—</Typography> },
    { field: "productName", headerName: "Product", flex: 1, minWidth: 220, renderCell: ({ row }) => <Box><Typography fontWeight={700} variant="body2">{row.productName ?? "Unknown product"}</Typography><Typography color="text.secondary" variant="caption">{row.productSku || `Product #${row.productId ?? "—"}`}</Typography></Box> },
    { field: "locationName", headerName: "Location", minWidth: 150 },
    { field: "identifiers", headerName: "IMEI / Serial", minWidth: 220, renderCell: ({ row }) => row.identifiers.length ? <Stack direction="row" flexWrap="wrap" gap={0.5}>{row.identifiers.map((identifier) => <Chip key={identifier.id} label={identifier.value} size="small" variant="outlined" />)}</Stack> : <Typography color="text.secondary" variant="body2">—</Typography> },
    { field: "costPrice", headerName: "Cost", minWidth: 130, valueFormatter: (value) => fCurrency(Number(value)) },
    { field: "statusLabel", headerName: "Status", minWidth: 135, renderCell: ({ row }) => <Chip color={row.statusName === "available" ? "success" : "default"} label={row.statusLabel ?? "Unassigned"} size="small" /> },
    { field: "grnNumber", headerName: "GRN", minWidth: 165 },
    { field: "timestamp", headerName: "Added", minWidth: 170, valueFormatter: (value) => new Date(Number(value)).toLocaleString("en-LK") },
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
  const inventoryGrid = tab === 0
    ? <DataGrid<StockUnit> columns={stockColumns} disableRowSelectionOnClick getRowId={(row) => row.id} onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }} pageSizeOptions={pageSizes} paginationMode="server" paginationModel={{ page, pageSize }} rowCount={stockTotal} rows={stockRows} sx={{ border: 0, minHeight: 480 }} />
    : <DataGrid<PendingStockReceipt> columns={pendingColumns} disableRowSelectionOnClick getRowId={(row) => row.grnId} onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }} pageSizeOptions={pageSizes} paginationMode="server" paginationModel={{ page, pageSize }} rowCount={pendingTotal} rows={pendingRows} sx={{ border: 0, minHeight: 480 }} />;

  return <><PageMeta description="View Mobee stock units and add final-approved receipts to inventory." title="Stock List | Mobee Suite" /><Stack spacing={2.5}>
    <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={1.5} justifyContent="space-between"><Stack alignItems="center" direction="row" spacing={1}><Inventory2OutlinedIcon color="primary" sx={{ fontSize: 24 }} /><Box><Typography variant="h4">Stock List</Typography><Typography color="text.secondary" variant="body2">Track each physical inventory unit, its identifier, status, and source receipt.</Typography></Box></Stack>{canAdd && <Button onClick={() => { setTab(1); resetPage(); }} startIcon={<AddRoundedIcon />} variant="contained">Add to Stock</Button>}</Stack>
    <Card sx={{ minHeight: 600, overflow: "hidden" }}><Tabs onChange={(_event, value) => { setTab(value); resetPage(); }} value={tab}><Tab label="Stock units" />{canAdd && <Tab label={`Ready to add${pendingTotal ? ` (${pendingTotal})` : ""}`} />}</Tabs><Stack direction={{ xs: "column", md: "row" }} gap={1} p={1.5}><TextField onChange={(event) => { setSearch(event.target.value); resetPage(); }} placeholder={tab === 0 ? "Search product, barcode, IMEI or serial" : "Search GRN or supplier"} size="small" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} sx={{ flex: 1, minWidth: 240 }} value={search} /><TextField onChange={(event) => { setLocationId(event.target.value === "all" ? "all" : Number(event.target.value)); resetPage(); }} select size="small" slotProps={{ select: { native: true } }} value={locationId}><option value="all">All locations</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</TextField>{tab === 0 && <TextField onChange={(event) => { setStatusId(event.target.value === "all" ? "all" : Number(event.target.value)); resetPage(); }} select size="small" slotProps={{ select: { native: true } }} value={statusId}><option value="all">All statuses</option>{statuses.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}</TextField>}</Stack>{inventoryGrid}</Card>
  </Stack><AddApprovedGrnStockDialog grnId={activeGrnId} onClose={() => setActiveGrnId(null)} onCompleted={() => { void loadStock(); void loadPending(); }} /></>;
}
