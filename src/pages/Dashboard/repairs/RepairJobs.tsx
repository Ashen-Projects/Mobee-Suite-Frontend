import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import LocalPrintshopRoundedIcon from "@mui/icons-material/LocalPrintshopRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PriceCheckRoundedIcon from "@mui/icons-material/PriceCheckRounded";
import QrCodeScannerRoundedIcon from "@mui/icons-material/QrCodeScannerRounded";
import RemoveCircleOutlineRoundedIcon from "@mui/icons-material/RemoveCircleOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Autocomplete, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, InputAdornment, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import RepairPhotoUploader from "../../../components/repairs/RepairPhotoUploader";
import useAuth from "../../../hooks/useAuth";
import { searchSaleCustomers, type SaleCustomer } from "../../../redux/slices/posRedux/saleRedux";
import { addRepairPart, collectRepairPayment, createRepairJob, deleteRepairImageUpload, getRepairJob, getRepairJobs, releaseRepairPart, updateRepairCharge, updateRepairJobStatus, type RepairJobDetail, type RepairJobInput, type RepairJobListItem, type RepairPartStatus, type RepairPaymentMethod, type RepairPhotoAsset, type RepairStatus } from "../../../redux/slices/repairRedux/repairRedux";
import { PATH_DASHBOARD } from "../../../routes/paths";
import { USER_PERMISSIONS } from "../../../utils";
import { fCurrency } from "../../../utils/formatNumber";
import { printRepairJobReceipt } from "../../../utils/printRepairJobReceipt";
import { printRepairPaymentReceipt } from "../../../utils/printRepairPaymentReceipt";

const statusOptions: Array<{ label: string; value: RepairStatus | "all" }> = [
  { label: "All statuses", value: "all" },
  { label: "Received", value: "received" },
  { label: "Inspection", value: "inspection" },
  { label: "Waiting parts", value: "waitingParts" },
  { label: "In progress", value: "inProgress" },
  { label: "Completed", value: "completed" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

const nextStatuses: RepairStatus[] = ["received", "inspection", "waitingParts", "inProgress", "completed", "delivered", "cancelled"];
const statusLabel = (status: RepairStatus) => statusOptions.find((item) => item.value === status)?.label ?? status;
const amount = (value: string) => Number(value.replace(/[^\d.]/g, "")) || 0;
const dateTime = (value: number) => new Date(value).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
const paymentMethods: Array<{ label: string; value: RepairPaymentMethod }> = [
  { label: "Cash", value: "cash" },
  { label: "Card", value: "card" },
  { label: "Bank transfer", value: "bankTransfer" },
  { label: "Mobile payment", value: "mobile" },
];
const paymentMethodLabel = (method: RepairPaymentMethod) => paymentMethods.find((item) => item.value === method)?.label ?? method;
const paymentStatusLabel = (status: RepairJobDetail["paymentStatus"]) => status === "paid" ? "Settled" : status === "partiallyPaid" ? "Partially paid" : "Payment due";
const paymentStatusColor = (status: RepairJobDetail["paymentStatus"]) => status === "paid" ? "success" : status === "partiallyPaid" ? "warning" : "default";
const repairPartStatusLabel: Record<RepairPartStatus, string> = { consumed: "Consumed", released: "Released", reserved: "Reserved" };
const repairPartStatusColor = (status: RepairPartStatus) => status === "consumed" ? "success" : status === "released" ? "default" : "warning";

const emptyForm = {
  customerName: "",
  customerPhone: "",
  deviceName: "",
  estimatedCost: "",
  problemDescription: "",
  serialImei: "",
};

export default function RepairJobs() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const [params] = useSearchParams();
  const isPosMode = params.get("mode") === "pos";
  const [jobs, setJobs] = useState<RepairJobListItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RepairStatus | "all">(() => params.get("status") === "completed" ? "completed" : "all");
  const [open, setOpen] = useState(params.get("create") === "1");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState<SaleCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<SaleCustomer | null>(null);
  const [detail, setDetail] = useState<RepairJobDetail | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [newStatus, setNewStatus] = useState<RepairStatus>("received");
  const [intakePhotos, setIntakePhotos] = useState<RepairPhotoAsset[]>([]);
  const [inspectionPhotos, setInspectionPhotos] = useState<RepairPhotoAsset[]>([]);
  const [isIntakeUploading, setIsIntakeUploading] = useState(false);
  const [isInspectionUploading, setIsInspectionUploading] = useState(false);
  const [chargeInput, setChargeInput] = useState("");
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState<{ amount: string; method: RepairPaymentMethod; referenceNo: string }>({ amount: "", method: "cash", referenceNo: "" });
  const [partBarcode, setPartBarcode] = useState("");
  const pageTitle = isPosMode && params.get("create") === "1" ? "Create Repair Job" : "Repair Jobs";
  const hasCustomer = Boolean(
    selectedCustomer?.id ||
    (form.customerName.trim() && form.customerPhone.trim()),
  );
  const canCreateRepair = Boolean(
    hasCustomer &&
    form.deviceName.trim() &&
    form.problemDescription.trim() &&
    !isIntakeUploading,
  );
  const canUpdateRepair = can(USER_PERMISSIONS.REPAIRS_UPDATE);
  const canManageRepairParts = can(USER_PERMISSIONS.REPAIRS_MANAGE_PARTS);
  const canCollectPayment = can(USER_PERMISSIONS.REPAIRS_COLLECT_PAYMENT);
  const canCreateRepairPermission = can(USER_PERMISSIONS.REPAIRS_CREATE);
  const selectableStatuses = useMemo<RepairStatus[]>(() => {
    if (!detail) return nextStatuses;
    if (detail.status === "completed") return ["completed", "delivered"];
    if (detail.status === "delivered" || detail.status === "cancelled") return [detail.status];
    return nextStatuses.filter((option) => option !== "delivered");
  }, [detail]);

  const discardUploadedPhotos = (photos: RepairPhotoAsset[]) => {
    if (!photos.length) return;
    void Promise.all(photos.map(async ({ publicId }) => {
      try {
        await deleteRepairImageUpload(publicId);
      } catch {
        // The asset expires from the draft when the user cancels. Failed cleanup
        // never interrupts the cashier's workflow and can be retried by support.
      }
    }));
  };

  const closeCreateDialog = () => {
    if (saving || isIntakeUploading) return;
    discardUploadedPhotos(intakePhotos);
    setIntakePhotos([]);
    setOpen(false);
  };

  const closeDetailDialog = () => {
    if (saving || isInspectionUploading) return;
    discardUploadedPhotos(inspectionPhotos);
    setInspectionPhotos([]);
    setPaymentDialog(false);
    setPaymentForm({ amount: "", method: "cash", referenceNo: "" });
    setPartBarcode("");
    setChargeInput("");
    setDetail(null);
  };

  const load = async () => {
    try {
      setJobs((await getRepairJobs({ page: 1, pageSize: 50, search, status })).items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load repair jobs.");
    }
  };

  useEffect(() => { void load(); }, [search, status]);

  useEffect(() => {
    const value = customerSearch.trim();
    if (!value) { setCustomerOptions([]); return; }
    const timer = window.setTimeout(() => {
      searchSaleCustomers(value).then(setCustomerOptions).catch(() => setCustomerOptions([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [customerSearch]);

  const selectedCustomerDisplay = useMemo(() => selectedCustomer ? `${selectedCustomer.name} • ${selectedCustomer.phone ?? ""}` : "", [selectedCustomer]);

  const submit = async () => {
    const deviceName = form.deviceName.trim();
    const problemDescription = form.problemDescription.trim();
    const customer = selectedCustomer
      ? { id: selectedCustomer.id }
      : { name: form.customerName.trim(), phone: form.customerPhone.trim() };
    if (!selectedCustomer && (!customer.name || !customer.phone)) {
      toast.error("Customer name and phone number are required.");
      return;
    }
    if (!deviceName) {
      toast.error("Device name is required.");
      return;
    }
    if (!problemDescription) {
      toast.error("Problem description is required.");
      return;
    }
    setSaving(true);
    try {
      const input: RepairJobInput = {
        customer,
        deviceName,
        estimatedCost: amount(form.estimatedCost),
        intakePhotos: intakePhotos.map(({ fileName, publicId }) => ({ cloudinaryPublicId: publicId, fileName })),
        problemDescription,
        serialImei: form.serialImei.trim() || null,
      };
      const job = await createRepairJob(input);
      setOpen(false);
      setForm(emptyForm);
      setCustomerSearch("");
      setSelectedCustomer(null);
      setIntakePhotos([]);
      setIsIntakeUploading(false);
      setDetail(job);
      setChargeInput(job.finalCost);
      setPartBarcode("");
      toast.success(`Repair job ${job.jobNo} created.`);
      printRepairJobReceipt(job);
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create repair job.");
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (id: number) => {
    try {
      const job = await getRepairJob(id);
      setNewStatus(job.status);
      setStatusNote("");
      setInspectionPhotos([]);
      setIsInspectionUploading(false);
      setDetail(job);
      setChargeInput(job.finalCost);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open repair job.");
    }
  };

  const saveStatus = async () => {
    if (!detail) return;
    if (newStatus === "inspection" && !inspectionPhotos.length) {
      toast.error("Add at least one inspection photo before moving this repair to Inspection.");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateRepairJobStatus(detail.id, {
        inspectionPhotos: newStatus === "inspection" ? inspectionPhotos.map(({ fileName, publicId }) => ({ cloudinaryPublicId: publicId, fileName })) : [],
        note: statusNote.trim() || undefined,
        status: newStatus,
      });
      setDetail(updated);
      setStatusNote("");
      setInspectionPhotos([]);
      setIsInspectionUploading(false);
      toast.success("Repair status updated.");
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update repair status.");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = (nextStatus: RepairStatus) => {
    if (isInspectionUploading) return;
    if (nextStatus !== "inspection" && inspectionPhotos.length) {
      discardUploadedPhotos(inspectionPhotos);
      setInspectionPhotos([]);
    }
    setNewStatus(nextStatus);
  };

  const saveFinalCharge = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const updated = await updateRepairCharge(detail.id, { finalCost: amount(chargeInput) });
      setDetail(updated);
      setChargeInput(updated.finalCost);
      toast.success("Final repair charge saved.");
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save the final repair charge.");
    } finally {
      setSaving(false);
    }
  };

  const reserveScannedPart = async () => {
    if (!detail) return;
    const barcode = partBarcode.trim();
    if (!barcode) {
      toast.error("Scan or enter a spare-part barcode.");
      return;
    }
    setSaving(true);
    try {
      const updated = await addRepairPart(detail.id, { barcode });
      setDetail(updated);
      setPartBarcode("");
      toast.success("Spare part reserved for this repair.");
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reserve this spare part.");
    } finally {
      setSaving(false);
    }
  };

  const releasePart = async (partId: number) => {
    if (!detail) return;
    setSaving(true);
    try {
      const updated = await releaseRepairPart(detail.id, partId);
      setDetail(updated);
      toast.success("Spare part returned to available stock.");
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to release this spare part.");
    } finally {
      setSaving(false);
    }
  };

  const openPaymentCollection = () => {
    if (!detail) return;
    if (Number(detail.finalCost) <= 0) {
      toast.error("Set the final repair charge before collecting payment.");
      return;
    }
    setPaymentForm({ amount: detail.balance.toFixed(2), method: "cash", referenceNo: "" });
    setPaymentDialog(true);
  };

  const submitRepairPayment = async () => {
    if (!detail) return;
    const received = amount(paymentForm.amount);
    if (received <= 0) {
      toast.error("Enter a payment amount greater than zero.");
      return;
    }
    if (received > detail.balance) {
      toast.error(`Payment cannot exceed the remaining balance of ${fCurrency(detail.balance)}.`);
      return;
    }
    if (paymentForm.method !== "cash" && !paymentForm.referenceNo.trim()) {
      toast.error("Enter the payment reference for this non-cash payment.");
      return;
    }
    setSaving(true);
    try {
      const result = await collectRepairPayment(detail.id, {
        amount: received,
        method: paymentForm.method,
        referenceNo: paymentForm.referenceNo.trim() || undefined,
      });
      setDetail(result.detail);
      setChargeInput(result.detail.finalCost);
      setPaymentDialog(false);
      setPaymentForm({ amount: "", method: "cash", referenceNo: "" });
      toast.success(result.detail.balance === 0 ? "Repair payment completed." : "Partial repair payment recorded.");
      try {
        printRepairPaymentReceipt(result.detail, result.payment);
      } catch (error) {
        toast.info(error instanceof Error ? error.message : "Payment recorded. Reprint the receipt from the repair job when ready.");
      }
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to collect the repair payment.");
    } finally {
      setSaving(false);
    }
  };

  const reprintRepairPaymentReceipt = (payment: RepairJobDetail["payments"][number]) => {
    if (!detail) return;
    const paymentIndex = detail.payments.findIndex((item) => item.id === payment.id);
    const totalPaidAtReceipt = detail.payments.slice(0, paymentIndex + 1).reduce((total, item) => total + Number(item.amount), 0);
    try {
      printRepairPaymentReceipt({ ...detail, balance: Math.max(0, Number(detail.finalCost) - totalPaidAtReceipt), totalPaid: totalPaidAtReceipt }, payment);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to print this repair payment receipt.");
    }
  };

  return <>
    <PageMeta description="Create and manage customer repair jobs." title={`${pageTitle} | Mobee Suite`} />
    <Box sx={isPosMode ? { bgcolor: "background.default", inset: 0, overflow: "auto", p: { xs: 2, md: 3 }, position: "fixed", zIndex: (theme) => theme.zIndex.modal - 1 } : undefined}>
      <Stack spacing={2.5} sx={{ mx: "auto", width: "min(1440px, 100%)" }}>
        <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
          <Stack alignItems="center" direction="row" spacing={1}>
            <BuildRoundedIcon color="primary" />
            <Typography variant="h4">{pageTitle}</Typography>
          </Stack>
          <Stack direction="row" gap={1} flexWrap="wrap">
            {isPosMode ? <Button color="inherit" onClick={() => navigate(PATH_DASHBOARD.pos.root)} startIcon={<ArrowBackRoundedIcon />} variant="outlined">Back to POS</Button> : null}
            {canCreateRepairPermission ? <Button onClick={() => setOpen(true)} startIcon={<AddRoundedIcon />} variant="contained">Create Repair Job</Button> : null}
          </Stack>
        </Stack>
        <Card sx={{ overflow: "hidden" }}>
          <Stack direction={{ xs: "column", md: "row" }} gap={1.5} sx={{ p: 1.5 }}>
            <TextField
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> }}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search job ID, customer, phone, device, IMEI or serial"
              value={search}
            />
            <TextField onChange={(event) => setStatus(event.target.value as RepairStatus | "all")} select sx={{ minWidth: { xs: "100%", md: 220 } }} value={status}>
              {statusOptions.map((option) => <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>)}
            </TextField>
          </Stack>
          <Box sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 920 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Job</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Device</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Estimated</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {jobs.map((job) => <TableRow hover key={job.id} sx={{ cursor: "pointer" }} onClick={() => void openDetail(job.id)}>
                  <TableCell><Typography fontWeight={900}>{job.jobNo}</Typography><Typography color="text.secondary" variant="body2">{job.locationName}</Typography></TableCell>
                  <TableCell><Typography fontWeight={800}>{job.customerName}</Typography><Typography color="text.secondary" variant="body2">{job.customerPhone || "—"}</Typography></TableCell>
                  <TableCell><Typography fontWeight={800}>{job.deviceName}</Typography><Typography color="text.secondary" variant="body2">{job.serialImei || "No IMEI / serial"}</Typography></TableCell>
                  <TableCell><Chip color={job.status === "cancelled" ? "error" : job.status === "delivered" ? "success" : "primary"} label={statusLabel(job.status)} size="small" /></TableCell>
                  <TableCell align="right">{fCurrency(Number(job.estimatedCost))}</TableCell>
                  <TableCell>{dateTime(job.timestamp)}</TableCell>
                  <TableCell align="right"><Button size="small">Open</Button></TableCell>
                </TableRow>)}
                {!jobs.length ? <TableRow><TableCell colSpan={7} sx={{ py: 8, textAlign: "center" }}>No repair jobs found</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </Box>
        </Card>
      </Stack>
    </Box>

    <Dialog fullWidth maxWidth="md" onClose={closeCreateDialog} open={open}>
      <DialogTitle>Create Repair Job</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Autocomplete
            filterOptions={(options) => options}
            getOptionLabel={(option) => `${option.name}${option.phone ? ` • ${option.phone}` : ""}`}
            inputValue={customerSearch || selectedCustomerDisplay}
            onChange={(_, value) => {
              setSelectedCustomer(value);
              if (value) {
                setForm((current) => ({ ...current, customerName: value.name, customerPhone: value.phone ?? "" }));
                setCustomerSearch(`${value.name} • ${value.phone ?? ""}`);
              }
            }}
            onInputChange={(_, value) => setCustomerSearch(value)}
            options={customerOptions}
            renderInput={(inputProps) => <TextField {...inputProps} label="Search existing customer by phone or name" />}
            value={selectedCustomer}
          />
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField disabled={Boolean(selectedCustomer)} inputProps={{ maxLength: 255 }} label="Customer name *" onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))} required value={form.customerName} />
            <TextField disabled={Boolean(selectedCustomer)} inputProps={{ inputMode: "tel", maxLength: 30 }} label="Customer phone *" onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))} required value={form.customerPhone} />
            <TextField inputProps={{ maxLength: 255 }} label="Device name *" onChange={(event) => setForm((current) => ({ ...current, deviceName: event.target.value }))} required value={form.deviceName} />
            <TextField inputProps={{ maxLength: 255 }} label="IMEI / Serial / SN" onChange={(event) => setForm((current) => ({ ...current, serialImei: event.target.value }))} value={form.serialImei} />
            <TextField inputProps={{ inputMode: "decimal" }} label="Estimated cost" onChange={(event) => setForm((current) => ({ ...current, estimatedCost: event.target.value }))} value={form.estimatedCost} />
          </Box>
          <TextField inputProps={{ maxLength: 3000 }} label="Problem description *" minRows={4} multiline onChange={(event) => setForm((current) => ({ ...current, problemDescription: event.target.value }))} required value={form.problemDescription} />
          <RepairPhotoUploader description="Optional intake evidence. These photos remain visible only to authorized staff." disabled={saving} label="Device intake photos" onChange={setIntakePhotos} onUploadStateChange={setIsIntakeUploading} photos={intakePhotos} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={saving || isIntakeUploading} onClick={closeCreateDialog}>Cancel</Button>
        <Button disabled={saving || isIntakeUploading || !canCreateRepair || !canCreateRepairPermission} onClick={() => void submit()} startIcon={<LocalPrintshopRoundedIcon />} variant="contained">Create & print receipt</Button>
      </DialogActions>
    </Dialog>

    <Dialog fullWidth maxWidth="md" onClose={closeDetailDialog} open={Boolean(detail)}>
      <DialogTitle>{detail?.jobNo}</DialogTitle>
      <DialogContent dividers>
        {detail ? <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
            <Box>
              <Typography variant="h5">{detail.deviceName}</Typography>
              <Typography color="text.secondary">{detail.customerName} • {detail.customerPhone || "No phone"}</Typography>
            </Box>
            <Chip color={detail.status === "cancelled" ? "error" : detail.status === "delivered" ? "success" : "primary"} label={statusLabel(detail.status)} />
          </Stack>
          <Card sx={{ bgcolor: "action.hover", p: 2 }}>
            <Typography fontWeight={900}>Problem</Typography>
            <Typography whiteSpace="pre-wrap">{detail.problemDescription}</Typography>
          </Card>
          <Card sx={{ border: 1, borderColor: "divider", p: 2 }}>
            <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={1} justifyContent="space-between" mb={1.5}>
              <Box>
                <Stack alignItems="center" direction="row" gap={1}>
                  <QrCodeScannerRoundedIcon color="primary" fontSize="small" />
                  <Typography fontWeight={900}>Parts used from stock</Typography>
                </Stack>
                <Typography color="text.secondary" variant="body2">Scan each spare-part barcode to reserve it. It is consumed when the repair is completed; released parts immediately return to available stock.</Typography>
              </Box>
              <Chip label={`${detail.parts.filter((part) => part.status === "reserved").length} reserved`} size="small" variant="outlined" />
            </Stack>
            {canManageRepairParts && !["completed", "delivered", "cancelled"].includes(detail.status) ? <Stack direction={{ xs: "column", sm: "row" }} gap={1.25} mb={detail.parts.length ? 2 : 0}>
              <TextField
                autoComplete="off"
                disabled={saving}
                fullWidth
                inputProps={{ maxLength: 64 }}
                label="Scan spare-part barcode"
                onChange={(event) => setPartBarcode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void reserveScannedPart();
                  }
                }}
                placeholder="Scan barcode, then press Enter"
                value={partBarcode}
              />
              <Button disabled={saving || !partBarcode.trim()} onClick={() => void reserveScannedPart()} startIcon={<QrCodeScannerRoundedIcon />} sx={{ minWidth: { sm: 164 } }} variant="outlined">Reserve part</Button>
            </Stack> : <Typography color="text.secondary" variant="body2">{canManageRepairParts ? "Parts are locked because this repair is complete, delivered, or cancelled." : "You do not have permission to reserve or release repair parts."}</Typography>}
            {detail.parts.length ? <Box sx={{ mt: 2, overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 580 }}>
                <TableHead><TableRow><TableCell>Part</TableCell><TableCell>Barcode</TableCell><TableCell>Status</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
                <TableBody>{detail.parts.map((part) => <TableRow key={part.id}>
                  <TableCell><Typography fontWeight={800}>{part.productName || part.description}</Typography></TableCell>
                  <TableCell>{part.barcode || "—"}</TableCell>
                  <TableCell><Chip color={repairPartStatusColor(part.status)} label={repairPartStatusLabel[part.status]} size="small" /></TableCell>
                  <TableCell align="right">{part.status === "reserved" && canManageRepairParts && !["completed", "delivered", "cancelled"].includes(detail.status) ? <Button color="inherit" disabled={saving} onClick={() => void releasePart(part.id)} size="small" startIcon={<RemoveCircleOutlineRoundedIcon />}>Release</Button> : "—"}</TableCell>
                </TableRow>)}</TableBody>
              </Table>
            </Box> : null}
            <Typography color="text.secondary" display="block" mt={detail.parts.length ? 1.5 : 1} variant="caption">Parts are internal inventory records only. Customer receipts show one repair total and never itemize parts or service charges.</Typography>
          </Card>
          <Card sx={{ border: 1, borderColor: detail.paymentStatus === "paid" ? "success.main" : "divider", p: 2 }}>
            <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5} mb={2}>
              <Box>
                <Stack alignItems="center" direction="row" gap={1}>
                  <PaymentsRoundedIcon color="primary" fontSize="small" />
                  <Typography fontWeight={900}>Customer repair total</Typography>
                  <Chip color={paymentStatusColor(detail.paymentStatus)} label={paymentStatusLabel(detail.paymentStatus)} size="small" />
                </Stack>
                <Typography color="text.secondary" variant="body2">Set one final amount for the customer, collect it through the active POS drawer, then deliver the device after settlement.</Typography>
              </Box>
              {detail.status === "completed" && detail.balance > 0 && canCollectPayment ? <Button disabled={saving || Number(detail.finalCost) <= 0} onClick={openPaymentCollection} startIcon={<PaymentsRoundedIcon />} variant="contained">Collect payment</Button> : null}
            </Stack>
            <Box sx={{ alignItems: "start", display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "minmax(220px, 1.2fr) repeat(2, minmax(140px, .7fr))" } }}>
              <Stack direction="row" gap={1}>
                <TextField disabled={saving || !canUpdateRepair || detail.status === "cancelled" || detail.status === "delivered"} fullWidth helperText="One total only; parts and labour are not itemized for customers." inputProps={{ inputMode: "decimal" }} label="Customer repair total" onChange={(event) => setChargeInput(event.target.value)} value={chargeInput} />
                {canUpdateRepair && detail.status !== "cancelled" && detail.status !== "delivered" ? <Button disabled={saving} onClick={() => void saveFinalCharge()} startIcon={<PriceCheckRoundedIcon />} sx={{ alignSelf: "flex-start", minWidth: 92 }} variant="outlined">Save</Button> : null}
              </Stack>
              <Card sx={{ bgcolor: "action.hover", p: 1.5 }} variant="outlined"><Typography color="text.secondary" variant="caption">Total paid</Typography><Typography fontWeight={900} variant="h6">{fCurrency(detail.totalPaid)}</Typography></Card>
              <Card sx={{ bgcolor: detail.balance === 0 ? "success.lighter" : "action.hover", p: 1.5 }} variant="outlined"><Typography color="text.secondary" variant="caption">Balance due</Typography><Typography color={detail.balance === 0 ? "success.main" : "text.primary"} fontWeight={900} variant="h6">{fCurrency(detail.balance)}</Typography></Card>
            </Box>
            {detail.status !== "completed" && detail.status !== "delivered" ? <Typography color="text.secondary" display="block" mt={1.5} variant="caption">Payments can be collected only after the repair is marked completed.</Typography> : null}
            {detail.status === "completed" && detail.balance === 0 ? <Typography color="success.main" display="block" mt={1.5} variant="body2">Payment is settled. You can now mark the device as delivered.</Typography> : null}
            {detail.payments.length ? <><Divider sx={{ my: 2 }} /><Typography fontWeight={800} mb={1}>Payment history</Typography><Box sx={{ overflowX: "auto" }}><Table size="small" sx={{ minWidth: 690 }}><TableHead><TableRow><TableCell>Received</TableCell><TableCell>Method</TableCell><TableCell>Reference</TableCell><TableCell>Cashier</TableCell><TableCell align="right">Amount</TableCell><TableCell align="right">Receipt</TableCell></TableRow></TableHead><TableBody>{detail.payments.map((payment) => <TableRow key={payment.id}><TableCell>{dateTime(payment.timestamp)}</TableCell><TableCell>{paymentMethodLabel(payment.method)}</TableCell><TableCell>{payment.referenceNo || "—"}</TableCell><TableCell>{payment.receivedByName}</TableCell><TableCell align="right">{fCurrency(Number(payment.amount))}</TableCell><TableCell align="right"><Button onClick={() => reprintRepairPaymentReceipt(payment)} size="small" startIcon={<LocalPrintshopRoundedIcon />}>Print</Button></TableCell></TableRow>)}</TableBody></Table></Box></> : null}
          </Card>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField disabled={saving || isInspectionUploading || !canUpdateRepair || detail.status === "cancelled" || detail.status === "delivered"} label="Next status" onChange={(event) => changeStatus(event.target.value as RepairStatus)} select value={newStatus}>
              {selectableStatuses.map((option) => <MenuItem disabled={option === "delivered" && detail.balance > 0} key={option} value={option}>{statusLabel(option)}</MenuItem>)}
            </TextField>
            <Button disabled={saving} onClick={() => printRepairJobReceipt(detail)} startIcon={<LocalPrintshopRoundedIcon />} variant="outlined">Reprint receipt</Button>
          </Box>
          <TextField disabled={saving || !canUpdateRepair || detail.status === "cancelled" || detail.status === "delivered"} label="Status note" minRows={2} multiline onChange={(event) => setStatusNote(event.target.value)} value={statusNote} />
          {newStatus === "inspection" && newStatus !== detail.status ? <RepairPhotoUploader description="Required before customers can see the inspection stage. These images are shown only through this repair's secure receipt link." disabled={saving} label="Inspection photos" onChange={setInspectionPhotos} onUploadStateChange={setIsInspectionUploading} photos={inspectionPhotos} required /> : null}
          {detail.documents.length ? <RepairPhotoGallery documents={detail.documents} /> : null}
          <Card sx={{ p: 2 }}>
            <Typography fontWeight={900} mb={1}>History</Typography>
            <Stack spacing={1}>
              {detail.history.map((item) => <Box key={item.id} sx={{ borderLeft: 3, borderColor: "primary.main", pl: 1.5 }}>
                <Typography fontWeight={800}>{statusLabel(item.newStatus as RepairStatus)}</Typography>
                <Typography color="text.secondary" variant="body2">{dateTime(item.timestamp)} • {item.userName}</Typography>
                {item.note ? <Typography variant="body2">{item.note}</Typography> : null}
              </Box>)}
            </Stack>
          </Card>
        </Stack> : null}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={saving || isInspectionUploading} onClick={closeDetailDialog}>Close</Button>
        <Button disabled={saving || isInspectionUploading || !canUpdateRepair || !detail || detail.status === "cancelled" || detail.status === "delivered" || newStatus === detail.status} onClick={() => void saveStatus()} variant="contained">Update Status</Button>
      </DialogActions>
    </Dialog>

    <Dialog fullWidth maxWidth="xs" onClose={() => !saving && setPaymentDialog(false)} open={paymentDialog}>
      <DialogTitle component="div">
        <Stack alignItems="center" direction="row" gap={1}>
          <PaymentsRoundedIcon color="primary" />
          <Typography variant="h6">Collect Repair Payment</Typography>
        </Stack>
        <Typography color="text.secondary" variant="body2">{detail?.jobNo} • {detail?.deviceName}</Typography>
      </DialogTitle>
      <DialogContent dividers>
        {detail ? <Stack spacing={2}>
          <Box sx={{ bgcolor: "action.hover", borderRadius: 2, display: "grid", gap: 1, gridTemplateColumns: "1fr 1fr", p: 1.5 }}>
            <Box><Typography color="text.secondary" variant="caption">Repair total</Typography><Typography fontWeight={900}>{fCurrency(Number(detail.finalCost))}</Typography></Box>
            <Box><Typography color="text.secondary" variant="caption">Already paid</Typography><Typography fontWeight={900}>{fCurrency(detail.totalPaid)}</Typography></Box>
            <Box sx={{ gridColumn: "1 / -1" }}><Typography color="text.secondary" variant="caption">Balance due</Typography><Typography color="primary.main" fontWeight={900} variant="h6">{fCurrency(detail.balance)}</Typography></Box>
          </Box>
          <TextField autoFocus helperText={`Maximum ${fCurrency(detail.balance)}`} inputProps={{ inputMode: "decimal" }} label="Amount received" onChange={(event) => setPaymentForm((current) => ({ ...current, amount: event.target.value }))} value={paymentForm.amount} />
          <TextField label="Payment method" onChange={(event) => setPaymentForm((current) => ({ ...current, method: event.target.value as RepairPaymentMethod }))} select value={paymentForm.method}>
            {paymentMethods.map((method) => <MenuItem key={method.value} value={method.value}>{method.label}</MenuItem>)}
          </TextField>
          {paymentForm.method !== "cash" ? <TextField inputProps={{ maxLength: 255 }} label="Reference number *" onChange={(event) => setPaymentForm((current) => ({ ...current, referenceNo: event.target.value }))} placeholder="Transaction / approval reference" required value={paymentForm.referenceNo} /> : null}
          <Typography color="text.secondary" variant="caption">This payment is linked to your current POS drawer. A payment receipt will print after it is saved.</Typography>
        </Stack> : null}
      </DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={saving} onClick={() => setPaymentDialog(false)}>Cancel</Button>
        <Button disabled={saving || !paymentForm.amount.trim() || (paymentForm.method !== "cash" && !paymentForm.referenceNo.trim())} onClick={() => void submitRepairPayment()} startIcon={<PaymentsRoundedIcon />} variant="contained">Collect & print</Button>
      </DialogActions>
    </Dialog>
  </>;
}

function RepairPhotoGallery({ documents }: { documents: RepairJobDetail["documents"] }) {
  const photoDocuments = documents.filter((document) => document.documentType === "intakePhoto" || document.documentType === "inspectionPhoto");
  if (!photoDocuments.length) return null;

  return <Card sx={{ p: 2 }}>
    <Typography fontWeight={900} mb={1}>Repair photos</Typography>
    <Box sx={{ display: "grid", gap: 1.25, gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))" }}>
      {photoDocuments.map((document) => <Box key={document.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
        <Box alt={document.fileName} component="img" src={document.fileUrl} sx={{ display: "block", height: 112, objectFit: "cover", width: "100%" }} />
        <Box p={1}>
          <Chip color={document.documentType === "inspectionPhoto" ? "primary" : "default"} label={document.documentType === "inspectionPhoto" ? "Inspection" : "Intake"} size="small" />
          <Typography display="block" mt={0.5} noWrap variant="caption">{document.fileName}</Typography>
        </Box>
      </Box>)}
    </Box>
  </Card>;
}
