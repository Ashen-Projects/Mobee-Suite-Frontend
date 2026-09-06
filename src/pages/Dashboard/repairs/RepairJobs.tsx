import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import LocalPrintshopRoundedIcon from "@mui/icons-material/LocalPrintshopRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Autocomplete, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, InputAdornment, MenuItem, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import { searchSaleCustomers, type SaleCustomer } from "../../../redux/slices/posRedux/saleRedux";
import { createRepairJob, getRepairJob, getRepairJobs, updateRepairJobStatus, type RepairJobDetail, type RepairJobInput, type RepairJobListItem, type RepairStatus } from "../../../redux/slices/repairRedux/repairRedux";
import { PATH_DASHBOARD } from "../../../routes/paths";
import { fCurrency } from "../../../utils/formatNumber";
import { printRepairJobReceipt } from "../../../utils/printRepairJobReceipt";

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
  const [params] = useSearchParams();
  const isPosMode = params.get("mode") === "pos";
  const [jobs, setJobs] = useState<RepairJobListItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<RepairStatus | "all">("all");
  const [open, setOpen] = useState(params.get("create") === "1");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState<SaleCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<SaleCustomer | null>(null);
  const [detail, setDetail] = useState<RepairJobDetail | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const [newStatus, setNewStatus] = useState<RepairStatus>("received");
  const pageTitle = isPosMode ? "Create Repair Job" : "Repair Jobs";

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
    const customer = selectedCustomer
      ? { id: selectedCustomer.id }
      : { name: form.customerName.trim(), phone: form.customerPhone.trim() };
    if (!selectedCustomer && (!customer.name || !customer.phone)) {
      toast.error("Customer name and phone number are required.");
      return;
    }
    setSaving(true);
    try {
      const input: RepairJobInput = {
        customer,
        deviceName: form.deviceName.trim(),
        estimatedCost: amount(form.estimatedCost),
        problemDescription: form.problemDescription.trim(),
        serialImei: form.serialImei.trim() || null,
      };
      const job = await createRepairJob(input);
      setOpen(false);
      setForm(emptyForm);
      setCustomerSearch("");
      setSelectedCustomer(null);
      setDetail(job);
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
      setDetail(job);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open repair job.");
    }
  };

  const saveStatus = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const updated = await updateRepairJobStatus(detail.id, { note: statusNote.trim() || undefined, status: newStatus });
      setDetail(updated);
      setStatusNote("");
      toast.success("Repair status updated.");
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update repair status.");
    } finally {
      setSaving(false);
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
            <Button onClick={() => setOpen(true)} startIcon={<AddRoundedIcon />} variant="contained">Create Repair Job</Button>
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

    <Dialog fullWidth maxWidth="md" onClose={() => !saving && setOpen(false)} open={open}>
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
            <TextField disabled={Boolean(selectedCustomer)} label="Customer name *" onChange={(event) => setForm((current) => ({ ...current, customerName: event.target.value }))} value={form.customerName} />
            <TextField disabled={Boolean(selectedCustomer)} inputProps={{ inputMode: "tel" }} label="Customer phone *" onChange={(event) => setForm((current) => ({ ...current, customerPhone: event.target.value }))} value={form.customerPhone} />
            <TextField label="Device name *" onChange={(event) => setForm((current) => ({ ...current, deviceName: event.target.value }))} value={form.deviceName} />
            <TextField label="IMEI / Serial / SN" onChange={(event) => setForm((current) => ({ ...current, serialImei: event.target.value }))} value={form.serialImei} />
            <TextField inputProps={{ inputMode: "decimal" }} label="Estimated cost" onChange={(event) => setForm((current) => ({ ...current, estimatedCost: event.target.value }))} value={form.estimatedCost} />
          </Box>
          <TextField label="Problem description *" minRows={4} multiline onChange={(event) => setForm((current) => ({ ...current, problemDescription: event.target.value }))} value={form.problemDescription} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={saving} onClick={() => setOpen(false)}>Cancel</Button>
        <Button disabled={saving} onClick={() => void submit()} startIcon={<LocalPrintshopRoundedIcon />} variant="contained">Create & print receipt</Button>
      </DialogActions>
    </Dialog>

    <Dialog fullWidth maxWidth="md" onClose={() => setDetail(null)} open={Boolean(detail)}>
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
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField label="Next status" onChange={(event) => setNewStatus(event.target.value as RepairStatus)} select value={newStatus}>
              {nextStatuses.map((option) => <MenuItem key={option} value={option}>{statusLabel(option)}</MenuItem>)}
            </TextField>
            <Button disabled={saving} onClick={() => printRepairJobReceipt(detail)} startIcon={<LocalPrintshopRoundedIcon />} variant="outlined">Reprint receipt</Button>
          </Box>
          <TextField label="Status note" minRows={2} multiline onChange={(event) => setStatusNote(event.target.value)} value={statusNote} />
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
        <Button color="inherit" onClick={() => setDetail(null)}>Close</Button>
        <Button disabled={saving || !detail || newStatus === detail.status} onClick={() => void saveStatus()} variant="contained">Update Status</Button>
      </DialogActions>
    </Dialog>
  </>;
}
