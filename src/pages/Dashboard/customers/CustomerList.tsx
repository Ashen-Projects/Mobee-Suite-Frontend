import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LocalPhoneOutlinedIcon from "@mui/icons-material/LocalPhoneOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import BuildRoundedIcon from "@mui/icons-material/BuildRounded";
import { Avatar, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, IconButton, InputAdornment, InputLabel, MenuItem, Select, Stack, Switch, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import useAuth from "../../../hooks/useAuth";
import { createCustomer, getCustomer, getCustomers, updateCustomer, updateCustomerStatus, type Customer, type CustomerDetail, type CustomerInput } from "../../../redux/slices/customerRedux/customerRedux";
import { USER_PERMISSIONS } from "../../../utils";
import { fCurrency } from "../../../utils/formatNumber";

const emptyForm: CustomerInput = { address: "", email: "", name: "", nic: "", phone: "" };

const clean = (value?: string | null) => {
  const next = value?.trim();
  return next ? next : null;
};

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
const dateTime = (value: number) => new Date(value).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
type PaginationModel = { page: number; pageSize: number };

export default function CustomerList() {
  const { can } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">("all");
  const [pagination, setPagination] = useState<PaginationModel>({ page: 0, pageSize: 10 });
  const [total, setTotal] = useState(0);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CustomerInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CustomerDetail | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const canCreate = can(USER_PERMISSIONS.CUSTOMERS_CREATE);
  const canUpdate = can(USER_PERMISSIONS.CUSTOMERS_UPDATE);

  const load = async () => {
    setLoading(true);
    try {
      const result = await getCustomers({
        isActive: activeFilter,
        page: pagination.page + 1,
        pageSize: pagination.pageSize,
        search,
      });
      setRows(result.items);
      setTotal(result.pagination.total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 250);
    return () => window.clearTimeout(timer);
  }, [search, activeFilter, pagination.page, pagination.pageSize]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setForm({
      address: customer.address ?? "",
      email: customer.email ?? "",
      name: customer.name,
      nic: customer.nic ?? "",
      phone: customer.phone ?? "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    const input: CustomerInput = {
      address: clean(form.address),
      email: clean(form.email),
      name: form.name.trim(),
      nic: clean(form.nic),
      phone: form.phone.trim(),
    };
    if (!input.name || !input.phone) {
      toast.error("Customer name and phone number are required.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateCustomer(editing.id, input);
        toast.success("Customer updated.");
      } else {
        await createCustomer(input);
        toast.success("Customer created.");
      }
      setDialogOpen(false);
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save customer.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (customer: Customer) => {
    if (!canUpdate) return;
    try {
      await updateCustomerStatus(customer.id, !customer.isActive);
      toast.success(customer.isActive ? "Customer deactivated." : "Customer activated.");
      void load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update customer status.");
    }
  };

  const openProfile = async (customer: Customer) => {
    setProfileLoading(true);
    try {
      setProfile(await getCustomer(customer.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load customer profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  const columns = useMemo<GridColDef<Customer>[]>(() => [
    {
      field: "name",
      flex: 1,
      headerName: "Customer",
      minWidth: 200,
      renderCell: ({ row }) => <Typography fontWeight={800} noWrap variant="body2">{row.name}</Typography>,
    },
    {
      field: "contact",
      flex: 1,
      headerName: "Contact",
      minWidth: 220,
      renderCell: ({ row }) => <Stack justifyContent="center" sx={{ height: "100%", minWidth: 0, width: "100%" }}>
        <Typography lineHeight={1.25} noWrap variant="body2">{row.phone || "No phone"}</Typography>
        <Typography color="text.secondary" lineHeight={1.35} noWrap variant="caption">{row.email || "No email"}</Typography>
      </Stack>,
    },
    {
      field: "address",
      flex: 1,
      headerName: "Address",
      minWidth: 240,
      renderCell: ({ row }) => <Typography color={row.address ? "text.primary" : "text.secondary"} noWrap variant="body2">{row.address || "No address"}</Typography>,
    },
    {
      field: "activity",
      align: "center",
      headerAlign: "center",
      headerName: "Activity",
      minWidth: 180,
      renderCell: ({ row }) => <Stack alignItems="center" direction="row" gap={0.75} justifyContent="center" sx={{ height: "100%", width: "100%" }}>
        <Chip label={`${row.saleCount} sales`} size="small" variant="outlined" />
        <Chip label={`${row.repairCount} repairs`} size="small" variant="outlined" />
      </Stack>,
    },
    {
      field: "isActive",
      align: "center",
      headerAlign: "center",
      headerName: "Status",
      minWidth: 120,
      renderCell: ({ row }) => <Chip color={row.isActive ? "success" : "default"} label={row.isActive ? "Active" : "Inactive"} size="small" />,
    },
    {
      field: "actions",
      align: "center",
      filterable: false,
      headerAlign: "center",
      headerName: "Actions",
      minWidth: 150,
      sortable: false,
      renderCell: ({ row }) => <Stack alignItems="center" direction="row" justifyContent="center" spacing={0.5} sx={{ height: "100%", width: "100%" }}>
        {canUpdate ? <Tooltip title="Edit customer"><IconButton onClick={(event) => { event.stopPropagation(); openEdit(row); }} size="small"><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip> : null}
        {canUpdate ? <Tooltip title={row.isActive ? "Deactivate customer" : "Activate customer"}><Switch checked={row.isActive} onClick={(event) => event.stopPropagation()} onChange={() => void toggleStatus(row)} size="small" /></Tooltip> : null}
      </Stack>,
    },
  ], [canUpdate]);

  return <>
    <PageMeta description="Manage customer profiles and contact details." title="Customer List | Mobee Suite" />
    <Stack spacing={2.5}>
      <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5}>
        <Stack alignItems="center" direction="row" spacing={1}>
          <PersonOutlineRoundedIcon color="primary" />
          <Typography variant="h4">Customer List</Typography>
        </Stack>
        {canCreate ? <Button onClick={openCreate} startIcon={<AddRoundedIcon />} variant="contained">Create Customer</Button> : null}
      </Stack>
      <Card sx={{ border: 1, borderColor: "divider", overflow: "hidden" }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
          <Stack alignItems={{ sm: "center" }} direction={{ xs: "column", sm: "row" }} spacing={1.5}>
            <TextField fullWidth label="Search customers" onChange={(event) => { setSearch(event.target.value); setPagination((current) => ({ ...current, page: 0 })); }} placeholder="Name, phone, email or NIC" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon color="action" fontSize="small" /></InputAdornment> } }} value={search} />
            <FormControl fullWidth sx={{ maxWidth: { sm: 200 } }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" onChange={(event) => { setActiveFilter(event.target.value as typeof activeFilter); setPagination((current) => ({ ...current, page: 0 })); }} value={activeFilter}>
                <MenuItem value="all">All customers</MenuItem>
                <MenuItem value="true">Active only</MenuItem>
                <MenuItem value="false">Inactive only</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </CardContent>
        <Box sx={{ borderTop: 1, borderColor: "divider", overflowX: "auto", width: "100%" }}>
          <DataGrid
            autoHeight
            columnVisibilityModel={isMobile ? { address: false, contact: false } : undefined}
            columns={columns}
            disableRowSelectionOnClick
            loading={loading}
            onPaginationModelChange={(model) => setPagination({ page: model.page, pageSize: model.pageSize })}
            onRowClick={({ row }) => void openProfile(row)}
            pageSizeOptions={[10, 25, 50, 100]}
            paginationMode="server"
            paginationModel={{ page: pagination.page, pageSize: pagination.pageSize }}
            rowCount={total}
            rows={rows}
            rowHeight={56}
            sx={{
              border: 0,
              cursor: "pointer",
              minWidth: isMobile ? 680 : 980,
              "& .MuiDataGrid-cell": { alignItems: "center", display: "flex", lineHeight: "normal" },
              "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" },
            }}
          />
        </Box>
      </Card>
    </Stack>
    <Dialog fullWidth maxWidth="sm" onClose={() => !saving && setDialogOpen(false)} open={dialogOpen}>
      <DialogTitle>{editing ? "Edit Customer" : "Create Customer"}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
            <TextField autoFocus label="Customer name *" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} value={form.name} />
            <TextField inputProps={{ inputMode: "tel" }} label="Phone number *" onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} value={form.phone} />
            <TextField label="Email" onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} type="email" value={form.email ?? ""} />
            <TextField label="NIC" onChange={(event) => setForm((current) => ({ ...current, nic: event.target.value }))} value={form.nic ?? ""} />
          </Box>
          <TextField label="Address" minRows={3} multiline onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} value={form.address ?? ""} />
          {editing ? <FormControlLabel control={<Switch checked={editing.isActive} onChange={() => void toggleStatus(editing)} />} label={editing.isActive ? "Active customer" : "Inactive customer"} /> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" disabled={saving} onClick={() => setDialogOpen(false)}>Cancel</Button>
        <Button disabled={saving} onClick={() => void save()} variant="contained">{editing ? "Save Changes" : "Create Customer"}</Button>
      </DialogActions>
    </Dialog>
    <Dialog fullWidth maxWidth="md" onClose={() => setProfile(null)} open={Boolean(profile) || profileLoading}>
      <DialogTitle>
        <Stack alignItems="center" direction="row" justifyContent="space-between" gap={2}>
          <Stack alignItems="center" direction="row" gap={1.5} minWidth={0}>
            <Avatar sx={{ bgcolor: "primary.main", color: "primary.contrastText", fontWeight: 900 }}>{profile ? initials(profile.name) : "C"}</Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap variant="h5">{profile?.name ?? "Loading customer…"}</Typography>
              <Typography color="text.secondary" variant="body2">Customer profile and activity</Typography>
            </Box>
          </Stack>
          {profile && canUpdate ? <Button onClick={() => openEdit(profile)} startIcon={<EditOutlinedIcon />} variant="outlined">Edit</Button> : null}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {profile ? <Stack spacing={2.25}>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1.1fr .9fr .9fr" } }}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Stack spacing={1.25}>
                <Stack alignItems="center" direction="row" gap={1}><LocalPhoneOutlinedIcon color="primary" fontSize="small" /><Typography fontWeight={800}>{profile.phone || "No phone"}</Typography></Stack>
                <Stack alignItems="center" direction="row" gap={1}><EmailOutlinedIcon color="primary" fontSize="small" /><Typography>{profile.email || "No email"}</Typography></Stack>
                <Stack alignItems="flex-start" direction="row" gap={1}><LocationOnOutlinedIcon color="primary" fontSize="small" /><Typography>{profile.address || "No address"}</Typography></Stack>
                {profile.nic ? <Typography color="text.secondary" variant="body2">NIC: {profile.nic}</Typography> : null}
              </Stack>
            </Card>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Stack alignItems="center" spacing={0.5}>
                <ReceiptLongOutlinedIcon color="primary" />
                <Typography color="text.secondary" variant="body2">Total purchases</Typography>
                <Typography variant="h4">{profile.saleCount}</Typography>
              </Stack>
            </Card>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Stack alignItems="center" spacing={0.5}>
                <BuildRoundedIcon color="primary" />
                <Typography color="text.secondary" variant="body2">Repair jobs</Typography>
                <Typography variant="h4">{profile.repairCount}</Typography>
              </Stack>
            </Card>
          </Box>
          <Divider />
          <Box>
            <Typography fontWeight={900} mb={1}>Purchase history</Typography>
            <Stack spacing={1}>
              {profile.sales.map((sale) => <Card key={sale.id} variant="outlined" sx={{ p: 1.5 }}>
                <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                  <Box>
                    <Typography fontWeight={900}>{sale.invoiceNo}</Typography>
                    <Typography color="text.secondary" variant="body2">{dateTime(sale.timestamp)} • {sale.locationName}</Typography>
                    <Typography color="text.secondary" variant="caption">{sale.itemSummary || "No item summary"}</Typography>
                  </Box>
                  <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }}>
                    <Typography fontWeight={900}>{fCurrency(Number(sale.totalAmount))}</Typography>
                    <Chip color={sale.status === "completed" ? "success" : "default"} label={sale.status} size="small" />
                  </Stack>
                </Stack>
              </Card>)}
              {!profile.sales.length ? <Typography color="text.secondary" py={3} textAlign="center">No purchases recorded for this customer.</Typography> : null}
            </Stack>
          </Box>
          <Box>
            <Typography fontWeight={900} mb={1}>Repair history</Typography>
            <Stack spacing={1}>
              {profile.repairs.map((repair) => <Card key={repair.id} variant="outlined" sx={{ p: 1.5 }}>
                <Stack alignItems={{ xs: "flex-start", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                  <Box>
                    <Typography fontWeight={900}>{repair.jobNo} • {repair.deviceName}</Typography>
                    <Typography color="text.secondary" variant="body2">{dateTime(repair.timestamp)} • {repair.locationName}</Typography>
                    <Typography color="text.secondary" variant="caption">{repair.serialImei || "No IMEI / serial"}</Typography>
                  </Box>
                  <Stack alignItems={{ xs: "flex-start", sm: "flex-end" }}>
                    <Typography fontWeight={900}>{fCurrency(Number(repair.estimatedCost))}</Typography>
                    <Chip color={repair.status === "delivered" ? "success" : repair.status === "cancelled" ? "error" : "primary"} label={repair.status} size="small" />
                  </Stack>
                </Stack>
              </Card>)}
              {!profile.repairs.length ? <Typography color="text.secondary" py={3} textAlign="center">No repair jobs recorded for this customer.</Typography> : null}
            </Stack>
          </Box>
        </Stack> : <Typography py={4} textAlign="center">Loading customer profile…</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setProfile(null)}>Close</Button>
      </DialogActions>
    </Dialog>
  </>;
}
