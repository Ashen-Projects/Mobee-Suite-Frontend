import BrokenImageOutlinedIcon from "@mui/icons-material/BrokenImageOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import QrCodeScannerRoundedIcon from "@mui/icons-material/QrCodeScannerRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Box, Button, Card, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, InputAdornment, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import AdvancedDateRangeFilter from "../../../components/common/AdvancedDateRangeFilter";
import PageMeta from "../../../components/common/PageMeta";
import useAuth from "../../../hooks/useAuth";
import { approveStockDamage, createStockDamage, declineStockDamage, getStockDamage, scanStockForDamage, type StockDamageReason, type StockDamageRecord, type StockDamageScanItem } from "../../../redux/slices/inventoryRedux/stockRedux";
import { USER_PERMISSIONS, USER_ROLES } from "../../../utils";
import { fCurrency } from "../../../utils/formatNumber";

const pageSizes = [10, 15, 25, 50];
const reasonOptions: Array<{ label: string; value: StockDamageReason }> = [
  { label: "Physical damage", value: "physical_damage" },
  { label: "Water damage", value: "water_damage" },
  { label: "Manufacturing defect", value: "manufacturing_defect" },
  { label: "Packaging damage", value: "packaging_damage" },
  { label: "Expired or obsolete", value: "expired_or_obsolete" },
  { label: "Other", value: "other" },
];

const colomboDate = (date = new Date()) => {
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", timeZone: "Asia/Colombo", year: "numeric" }).formatToParts(date).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return colomboDate(date);
};

const formatDateTime = (value: number) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
};

export default function DamagedStock() {
  const { can, hasRole } = useAuth();
  const canSubmit = can(USER_PERMISSIONS.STOCK_DAMAGE_CREATE);
  const isAdministrator = hasRole(USER_ROLES.ADMIN);
  const [fromDate, setFromDate] = useState(() => daysAgo(29));
  const [toDate, setToDate] = useState(() => colomboDate());
  const [rows, setRows] = useState<StockDamageRecord[]>([]);
  const [summary, setSummary] = useState({ costLoss: 0, potentialGrossMargin: 0, potentialSalesValue: 0, units: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [queuedUnits, setQueuedUnits] = useState<StockDamageScanItem[]>([]);
  const [reason, setReason] = useState<StockDamageReason>("physical_damage");
  const [note, setNote] = useState("");
  const [scanning, setScanning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [decision, setDecision] = useState<{ action: "approve" | "decline"; target: StockDamageRecord } | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getStockDamage({ fromDate, page: page + 1, pageSize, search, toDate });
      setRows(result.items);
      setSummary(result.summary);
      setTotal(result.pagination.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load damaged-stock requests.");
    } finally {
      setLoading(false);
    }
  }, [fromDate, page, pageSize, search, toDate]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 220);
    return () => window.clearTimeout(timer);
  }, [load]);

  const scanUnit = async (event: FormEvent) => {
    event.preventDefault();
    const scannedCode = code.trim();
    if (!scannedCode) return toast.error("Scan or enter a barcode, IMEI, or serial number.");
    setScanning(true);
    try {
      const result = await scanStockForDamage(scannedCode);
      if (!result.found || !result.item || !result.eligible) return toast.error(result.message);
      if (queuedUnits.some((unit) => unit.stockId === result.item?.stockId)) return toast.info("This unit is already in the request.");
      setQueuedUnits((current) => [...current, result.item!]);
      toast.success("Unit added.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to check this stock unit.");
    } finally {
      setCode("");
      setScanning(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const submitRequest = async () => {
    if (!queuedUnits.length || submitting) return;
    setSubmitting(true);
    try {
      const result = await createStockDamage({ note: note.trim() || undefined, reason, stockIds: queuedUnits.map((unit) => unit.stockId) });
      toast.success(result.status === "approved" ? `${result.adjustmentNo} recorded. Stock is now Damaged.` : `${result.adjustmentNo} sent for administrator approval.`);
      setQueuedUnits([]);
      setNote("");
      setConfirmSubmit(false);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit the damage request.");
    } finally {
      setSubmitting(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const decideRequest = async () => {
    if (!decision || submitting) return;
    setSubmitting(true);
    try {
      if (decision.action === "approve") {
        const result = await approveStockDamage(decision.target.adjustmentId);
        toast.success(`${result.adjustmentNo} approved. ${result.units} unit${result.units === 1 ? "" : "s"} moved to Damaged.`);
      } else {
        const result = await declineStockDamage(decision.target.adjustmentId, decisionNote.trim() || undefined);
        toast.success(`${result.adjustmentNo} declined. Stock remains available.`);
      }
      setDecision(null);
      setDecisionNote("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to approve this damage request.");
    } finally {
      setSubmitting(false);
    }
  };

  const queuedCost = queuedUnits.reduce((sum, unit) => sum + unit.costPrice, 0);
  const columns = useMemo<GridColDef<StockDamageRecord>[]>(() => [
    { field: "adjustmentNo", headerName: "Request", minWidth: 195, renderCell: ({ row }) => <Stack justifyContent="center" minWidth={0}><Typography fontWeight={800} noWrap variant="body2">{row.adjustmentNo}</Typography><Typography color="text.secondary" noWrap variant="caption">{formatDateTime(row.timestamp)}</Typography></Stack> },
    { field: "productName", headerName: "Product / unit", flex: 1, minWidth: 245, renderCell: ({ row }) => <Stack justifyContent="center" minWidth={0}><Typography fontWeight={700} noWrap variant="body2">{row.productName ?? "Unknown product"}</Typography><Typography color="text.secondary" noWrap variant="caption">{row.status === "declined" && row.decisionNote ? `${row.barcode || row.productSku || `Stock #${row.stockId}`} · Declined: ${row.decisionNote}` : row.barcode || row.productSku || `Stock #${row.stockId}`}</Typography></Stack> },
    { field: "reasonLabel", headerName: "Reason", minWidth: 170, renderCell: ({ row }) => <Typography noWrap variant="body2">{row.reasonLabel}</Typography> },
    { field: "status", headerName: "Status", minWidth: 150, renderCell: ({ row }) => <Chip color={row.status === "approved" ? "success" : row.status === "declined" ? "error" : "warning"} label={row.statusLabel} size="small" /> },
    { field: "costLoss", headerName: "Cost loss", minWidth: 135, renderCell: ({ row }) => row.status === "approved" ? <Typography color="error.main" fontWeight={800} variant="body2">{fCurrency(row.costLoss)}</Typography> : <Typography color="text.secondary" variant="body2">Pending</Typography> },
    { field: "actions", headerName: "", align: "right", headerAlign: "right", minWidth: 185, sortable: false, filterable: false, renderCell: ({ row }) => isAdministrator && row.status === "draft" ? <Stack direction="row" gap={0.5}><Button onClick={(event) => { event.stopPropagation(); setDecision({ action: "approve", target: row }); }} size="small" startIcon={<CheckCircleOutlineRoundedIcon />} variant="contained">Approve</Button><Button color="error" onClick={(event) => { event.stopPropagation(); setDecision({ action: "decline", target: row }); }} size="small">Decline</Button></Stack> : null },
  ], [isAdministrator]);

  return <>
    <PageMeta description="Submit and approve damaged stock without deleting physical inventory history." title="Damaged Stock | Mobee Suite" />
    <Stack spacing={2.25}>
      <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={1} justifyContent="space-between">
        <Stack alignItems="center" direction="row" spacing={1}><BrokenImageOutlinedIcon color="primary" sx={{ fontSize: 24 }} /><Box><Typography variant="h4">Damaged Stock</Typography><Typography color="text.secondary" variant="body2">{isAdministrator ? "Review requests and record approved write-offs." : "Submit a request; stock changes only after administrator approval."}</Typography></Box></Stack>
        <Chip color={isAdministrator ? "success" : "warning"} label={isAdministrator ? "Administrator approval" : "Approval required"} size="small" variant="outlined" />
      </Stack>

      {canSubmit ? <Card component="form" onSubmit={(event) => void scanUnit(event)} sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Stack spacing={1.5}>
          <Stack alignItems={{ xs: "flex-start", md: "center" }} direction={{ xs: "column", md: "row" }} gap={1.25} justifyContent="space-between"><Stack alignItems="center" direction="row" spacing={1}><QrCodeScannerRoundedIcon color="primary" /><Box><Typography fontWeight={800}>Scan damaged unit</Typography><Typography color="text.secondary" variant="caption">Scan barcode, IMEI, or serial number and press Enter.</Typography></Box></Stack><Stack direction={{ xs: "column", sm: "row" }} gap={1} sx={{ width: { xs: "100%", md: 520 } }}><TextField autoComplete="off" autoFocus fullWidth inputRef={inputRef} onChange={(event) => setCode(event.target.value)} placeholder="Scan or type code" size="small" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} value={code} /><Button disabled={scanning} sx={{ minWidth: 105 }} type="submit" variant="contained">{scanning ? <CircularProgress color="inherit" size={19} /> : "Add"}</Button></Stack></Stack>
          {queuedUnits.length ? <><Divider /><Stack direction="row" flexWrap="wrap" gap={0.75}>{queuedUnits.map((unit) => <Chip key={unit.stockId} label={`${unit.productName ?? "Stock unit"} · ${unit.identifierValue || unit.barcode || unit.stockId}`} onDelete={() => setQueuedUnits((current) => current.filter((item) => item.stockId !== unit.stockId))} size="small" variant="outlined" />)}</Stack><Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "minmax(190px, .65fr) minmax(220px, 1.35fr) auto" } }}><TextField label="Reason" onChange={(event) => setReason(event.target.value as StockDamageReason)} select size="small" value={reason}>{reasonOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}</TextField><TextField label="Note (optional)" onChange={(event) => setNote(event.target.value)} placeholder="Short condition note" size="small" value={note} /><Button color={isAdministrator ? "error" : "primary"} onClick={() => setConfirmSubmit(true)} sx={{ whiteSpace: "nowrap" }} variant="contained">{isAdministrator ? "Record damage" : "Submit request"}</Button></Box></> : null}
        </Stack>
      </Card> : null}

      <Card sx={{ overflow: "hidden" }}>
        <Stack alignItems={{ xs: "flex-start", lg: "center" }} direction={{ xs: "column", lg: "row" }} gap={1.25} justifyContent="space-between" p={1.5}>
          <Box><Typography fontWeight={850}>Damage requests</Typography><Typography color="text.secondary" variant="caption">Approved cost loss: {fCurrency(summary.costLoss)} · {summary.units} unit{summary.units === 1 ? "" : "s"} in the selected period.</Typography></Box><AdvancedDateRangeFilter fromDate={fromDate} onChange={(nextFrom, nextTo) => { setFromDate(nextFrom); setToDate(nextTo); setPage(0); }} toDate={toDate} />
        </Stack>
        <Stack direction={{ xs: "column", sm: "row" }} gap={1} px={1.5} pb={1.5}><TextField fullWidth onChange={(event) => { setSearch(event.target.value); setPage(0); }} placeholder="Search request number, product, SKU, or barcode" size="small" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} value={search} /><Chip label={isAdministrator ? "Assigned location" : "My requests"} size="small" sx={{ alignSelf: "center", whiteSpace: "nowrap" }} variant="outlined" /></Stack>
        <DataGrid<StockDamageRecord> columns={columns} disableColumnMenu disableRowSelectionOnClick getRowHeight={() => 58} getRowId={(row) => `${row.adjustmentId}:${row.stockId}`} loading={loading} onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }} pageSizeOptions={pageSizes} paginationMode="server" paginationModel={{ page, pageSize }} rowCount={total} rows={rows} sx={{ border: 0, minHeight: 420 }} />
      </Card>
    </Stack>

    <Dialog fullWidth maxWidth="sm" onClose={() => !submitting && setConfirmSubmit(false)} open={confirmSubmit}>
      <DialogTitle component="div"><Stack alignItems="center" direction="row" spacing={1}><WarningAmberRoundedIcon color={isAdministrator ? "error" : "warning"} /><Box><Typography variant="h6">{isAdministrator ? "Record damaged stock?" : "Submit damage request?"}</Typography><Typography color="text.secondary" variant="body2">{isAdministrator ? "These units will immediately move from Available to Damaged." : "Stock stays available until an administrator approves this request."}</Typography></Box></Stack></DialogTitle>
      <DialogContent dividers><Typography fontWeight={800}>{queuedUnits.length} unit{queuedUnits.length === 1 ? "" : "s"} · {fCurrency(queuedCost)} cost {isAdministrator ? "loss" : "estimate"}</Typography><Typography color="text.secondary" mt={0.75} variant="body2">Reason: {reasonOptions.find((option) => option.value === reason)?.label}. The barcode, cost, requesting user, time, and note will remain in the audit history.</Typography></DialogContent>
      <DialogActions><Button disabled={submitting} onClick={() => setConfirmSubmit(false)}>Cancel</Button><Button color={isAdministrator ? "error" : "primary"} disabled={submitting} onClick={() => void submitRequest()} variant="contained">{submitting ? <CircularProgress color="inherit" size={18} /> : isAdministrator ? "Record damage" : "Submit request"}</Button></DialogActions>
    </Dialog>

    <Dialog fullWidth maxWidth="sm" onClose={() => !submitting && setDecision(null)} open={Boolean(decision)}>
      <DialogTitle component="div"><Stack alignItems="center" direction="row" spacing={1}><CheckCircleOutlineRoundedIcon color={decision?.action === "approve" ? "success" : "error"} /><Box><Typography variant="h6">{decision?.action === "approve" ? "Approve damage request?" : "Decline damage request?"}</Typography><Typography color="text.secondary" variant="body2">{decision?.action === "approve" ? "Approval changes the requested unit from Available to Damaged." : "Declining keeps the requested stock unit Available."}</Typography></Box></Stack></DialogTitle>
      <DialogContent dividers><Stack spacing={1.25}><Typography fontWeight={800}>{decision?.target.adjustmentNo}</Typography><Typography color="text.secondary" variant="body2">{decision?.action === "approve" ? "Before approval, the system checks again that every unit is still available. If a unit was sold or changed, approval is blocked to protect stock accuracy." : "Add an optional reason. It is shown with the declined request to the staff member who submitted it."}</Typography>{decision?.action === "decline" ? <TextField label="Decline note (optional)" multiline minRows={2} onChange={(event) => setDecisionNote(event.target.value)} placeholder="For example: unit passed inspection" value={decisionNote} /> : null}</Stack></DialogContent>
      <DialogActions><Button disabled={submitting} onClick={() => setDecision(null)}>Cancel</Button><Button color={decision?.action === "approve" ? "success" : "error"} disabled={submitting} onClick={() => void decideRequest()} startIcon={submitting ? <CircularProgress color="inherit" size={16} /> : <CheckCircleOutlineRoundedIcon />} variant="contained">{decision?.action === "approve" ? "Approve" : "Decline"}</Button></DialogActions>
    </Dialog>
  </>;
}
