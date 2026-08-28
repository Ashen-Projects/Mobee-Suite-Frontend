import AddRoundedIcon from "@mui/icons-material/AddRounded";
import BusinessOutlinedIcon from "@mui/icons-material/BusinessOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Autocomplete, Badge, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, InputAdornment, Stack, Switch, Tab, Tabs, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import useAuth from "../../../hooks/useAuth";
import { getProducts, type ProductListItem } from "../../../redux/slices/productRedux/productRedux";
import { createSupplier, getSupplier, getSuppliers, reserveSupplierCode, updateSupplier, updateSupplierProductStatus, updateSupplierStatus, upsertSupplierProduct, type Supplier, type SupplierDetail, type SupplierInput, type SupplierProduct } from "../../../redux/slices/purchaseRedux/supplierRedux";
import { USER_PERMISSIONS } from "../../../utils/constants";
import { fCurrency } from "../../../utils/formatNumber";

const PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];
const emptySupplier: SupplierInput = { address: null, code: "", contactPerson: null, creditLimit: 0, email: null, isActive: true, name: "", paymentTermDays: 0, phone: null };

const nullable = (value: string) => value.trim() || null;
const numberOrNull = (value: string) => value === "" ? null : Number(value);
const supplierProductCode = (supplierId: number, productId: number) => `SP-S${String(supplierId).padStart(6, "0")}-P${String(productId).padStart(6, "0")}`;

export default function Suppliers() {
  const { can } = useAuth();
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const requestId = useRef(0);
  const [rows, setRows] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<"all" | "true" | "false">("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierDetail | null>(null);
  const [form, setForm] = useState<SupplierInput>(emptySupplier);
  const [tab, setTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [statusTarget, setStatusTarget] = useState<Supplier | null>(null);
  const [productDialog, setProductDialog] = useState(false);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | null>(null);
  const [editingLink, setEditingLink] = useState<SupplierProduct | null>(null);
  const [linkForm, setLinkForm] = useState({ supplierProductName: "", supplierProductCode: "", quotedPrice: "", lastPurchasingPrice: "", minimumOrderQty: "1", leadTimeDays: "", isPreferred: false, isActive: true });

  useEffect(() => { const timer = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(0); }, 350); return () => window.clearTimeout(timer); }, [search]);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    try {
      const response = await getSuppliers({ isActive: status, page: page + 1, pageSize, search: debouncedSearch });
      if (current !== requestId.current) return;
      setRows(response.items); setTotal(response.pagination.total);
    } catch (error) {
      if (current !== requestId.current) return;
      setRows([]); setTotal(0); toast.error(error instanceof Error ? error.message : "Unable to load suppliers.");
    }
  }, [debouncedSearch, page, pageSize, status]);

  useEffect(() => { void load(); }, [load]);

  const openCreate = async () => {
    try {
      const reservation = await reserveSupplierCode();
      setEditing(null); setForm({ ...emptySupplier, code: reservation.code }); setTab(0); setEditorOpen(true);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to reserve a supplier code."); }
  };
  const openEdit = async (row: Supplier, initialTab = 0) => {
    try {
      const detail = await getSupplier(row.id);
      setEditing(detail);
      setForm({ address: detail.address, code: detail.code, contactPerson: detail.contactPerson, creditLimit: Number(detail.creditLimit), email: detail.email, isActive: detail.isActive, name: detail.name, paymentTermDays: detail.paymentTermDays, phone: detail.phone });
      setTab(initialTab); setEditorOpen(true);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load supplier."); }
  };

  const saveSupplier = async () => {
    if (!form.name.trim()) { toast.error("Supplier name is required."); return; }
    if (!form.code.trim()) { toast.error("A reserved supplier code is required."); return; }
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) { toast.error("Enter a valid email address."); return; }
    setSaving(true);
    try {
      const payload = { ...form, code: form.code.trim().toUpperCase(), name: form.name.trim(), address: form.address ? nullable(form.address) : null, contactPerson: form.contactPerson ? nullable(form.contactPerson) : null, email: form.email ? nullable(form.email) : null, phone: form.phone ? nullable(form.phone) : null };
      const result = editing ? await updateSupplier(editing.id, { address: payload.address, code: payload.code, contactPerson: payload.contactPerson, creditLimit: payload.creditLimit, email: payload.email, name: payload.name, paymentTermDays: payload.paymentTermDays, phone: payload.phone }) : await createSupplier(payload);
      setEditing(result); toast.success(`Supplier ${editing ? "updated" : "created"} successfully.`); await load();
      if (!editing) setEditorOpen(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save supplier."); }
    finally { setSaving(false); }
  };

  const confirmStatus = async () => {
    if (!statusTarget) return;
    try { await updateSupplierStatus(statusTarget.id, !statusTarget.isActive); toast.success(`Supplier ${statusTarget.isActive ? "deactivated" : "activated"}.`); setStatusTarget(null); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update supplier status."); }
  };

  const openProductLink = async (link?: SupplierProduct) => {
    if (!editing) return;
    try {
      const response = await getProducts({ isActive: "true", page: 1, pageSize: 100 });
      setProducts(response.items.filter((product) => !product.hasVariations));
      setEditingLink(link ?? null);
      const product = link ? response.items.find(({ id }) => id === link.productId) ?? null : null;
      setSelectedProduct(product);
      setLinkForm(link ? { supplierProductName: link.supplierProductName ?? "", supplierProductCode: supplierProductCode(editing.id, link.productId), quotedPrice: link.quotedPrice ?? "", lastPurchasingPrice: link.lastPurchasingPrice ?? "", minimumOrderQty: String(link.minimumOrderQty), leadTimeDays: link.leadTimeDays === null ? "" : String(link.leadTimeDays), isPreferred: link.isPreferred, isActive: link.isActive } : { supplierProductName: "", supplierProductCode: "", quotedPrice: "", lastPurchasingPrice: "", minimumOrderQty: "1", leadTimeDays: "", isPreferred: false, isActive: true });
      setProductDialog(true);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load products."); }
  };

  const saveProductLink = async () => {
    if (!editing || !selectedProduct) { toast.error("Select a product."); return; }
    setSaving(true);
    try {
      const updated = await upsertSupplierProduct(editing.id, selectedProduct.id, { isActive: linkForm.isActive, isPreferred: linkForm.isPreferred, lastPurchasingPrice: numberOrNull(linkForm.lastPurchasingPrice), leadTimeDays: numberOrNull(linkForm.leadTimeDays), minimumOrderQty: Math.max(1, Number(linkForm.minimumOrderQty) || 1), quotedPrice: numberOrNull(linkForm.quotedPrice), supplierProductCode: nullable(linkForm.supplierProductCode), supplierProductName: nullable(linkForm.supplierProductName) });
      setEditing(updated); setProductDialog(false); toast.success("Supplier product saved successfully."); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save supplier product."); }
    finally { setSaving(false); }
  };

  const toggleLink = async (link: SupplierProduct) => {
    if (!editing) return;
    try { setEditing(await updateSupplierProductStatus(editing.id, link.productId, !link.isActive)); toast.success(`Product link ${link.isActive ? "deactivated" : "activated"}.`); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update product link."); }
  };

  const columns = useMemo<GridColDef<Supplier>[]>(() => [
    { field: "actions", headerName: "Actions", align: "center", headerAlign: "center", minWidth: 112, sortable: false, filterable: false, renderCell: ({ row }) => <Stack alignItems="center" direction="row" height="100%" justifyContent="center" spacing={0.75} width="100%">{can(USER_PERMISSIONS.SUPPLIERS_UPDATE) ? <Tooltip title="Edit supplier"><IconButton onClick={(event) => { event.stopPropagation(); void openEdit(row); }} size="small"><EditOutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip> : null}<Tooltip title={`${row.productCount} linked product${row.productCount === 1 ? "" : "s"}`}><Badge badgeContent={row.productCount} color="primary" max={99} overlap="circular" showZero><IconButton aria-label={`View ${row.productCount} linked products`} onClick={(event) => { event.stopPropagation(); void openEdit(row, 1); }} size="small" sx={{ border: 1, borderColor: "primary.main", borderRadius: 1.25, color: "primary.main", p: 0.625 }}><Inventory2OutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Badge></Tooltip></Stack> },
    { field: "code", headerName: "Code", minWidth: 115 },
    { field: "name", headerName: "Supplier", flex: 1, minWidth: 200 },
    { field: "contactPerson", headerName: "Contact Person", minWidth: 180, valueFormatter: (value) => value || "—" },
    { field: "phone", headerName: "Phone", minWidth: 145, valueFormatter: (value) => value || "—" },
    { field: "email", headerName: "Email", flex: 1, minWidth: 220, valueFormatter: (value) => value || "—" },
    { field: "paymentTermDays", headerName: "Payment Terms", minWidth: 140, valueFormatter: (value) => `${value} days` },
    { field: "isActive", headerName: "Status", minWidth: 105, renderCell: ({ value }) => <Chip color={value ? "success" : "default"} label={value ? "Active" : "Inactive"} size="small" /> },
  ], [can]);

  return <>
    <PageMeta description="Manage Mobee suppliers and supplier product agreements." title="Suppliers | Mobee Suite" />
    <Stack spacing={{ xs: 2, sm: 2.5 }}>
      <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
        <Stack alignItems="center" direction="row" spacing={1}><BusinessOutlinedIcon color="primary" sx={{ fontSize: 22 }} /><Box><Typography variant="h4">Suppliers</Typography><Typography color="text.secondary" variant="body2">Manage supplier contacts, credit terms, and linked products.</Typography></Box></Stack>
        {can(USER_PERMISSIONS.SUPPLIERS_CREATE) ? <Button onClick={() => void openCreate()} startIcon={<AddRoundedIcon />} variant="contained">New Supplier</Button> : null}
      </Stack>
      <Stack alignItems="center" direction="row" flexWrap="wrap" gap={1}><Chip color="info" label={`Visible ${rows.length}`} size="small" variant="outlined" /><Chip color="success" label={`Active ${rows.filter(({ isActive }) => isActive).length}`} size="small" variant="outlined" /><Typography color="text.secondary" ml={{ sm: "auto" }} variant="caption">{total} total suppliers</Typography></Stack>
      <Card variant="outlined" sx={{ borderRadius: 3, minHeight: { md: 620 }, overflow: "hidden" }}>
        <Stack alignItems={{ sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5} p={1.5}>
          <Typography fontWeight={700}>Supplier Directory <Chip label={total} size="small" sx={{ ml: 0.5 }} /></Typography>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1} width={{ xs: "100%", sm: "auto" }}><TextField onChange={(event) => setSearch(event.target.value)} placeholder="Search suppliers" size="small" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} sx={{ width: { xs: "100%", sm: 280 } }} value={search} /><TextField onChange={(event) => { setStatus(event.target.value as typeof status); setPage(0); }} select size="small" slotProps={{ select: { native: true } }} value={status}><option value="all">All statuses</option><option value="true">Active</option><option value="false">Inactive</option></TextField></Stack>
        </Stack>
        <Box sx={{ borderTop: 1, borderColor: "divider", overflowX: "auto" }}><DataGrid autoHeight columns={columns} columnVisibilityModel={mobile ? { contactPerson: false, email: false, paymentTermDays: false, phone: false } : undefined} disableColumnMenu disableRowSelectionOnClick getRowHeight={() => 52} onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }} onRowClick={({ row }) => void openEdit(row)} pageSizeOptions={PAGE_SIZE_OPTIONS} paginationMode="server" paginationModel={{ page, pageSize }} rowCount={total} rows={rows} sx={{ border: 0, cursor: "pointer", minWidth: mobile ? 650 : 1120, "& .MuiDataGrid-columnHeaders": { bgcolor: "action.hover", minHeight: "48px !important", maxHeight: "48px !important" }, "& .MuiDataGrid-columnHeaderTitle": { fontSize: 12.5, fontWeight: 700 }, "& .MuiDataGrid-cell": { fontSize: 13 }, "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" } }} /></Box>
      </Card>
    </Stack>

    <Dialog fullScreen={mobile} fullWidth maxWidth="lg" onClose={() => setEditorOpen(false)} open={editorOpen} slotProps={{ paper: { sx: { borderRadius: { sm: 3 }, height: { sm: "88dvh" } } } }}>
      <DialogTitle><Stack alignItems="center" direction="row" justifyContent="space-between"><Box><Typography variant="h5">{editing ? editing.name : "Create Supplier"}</Typography><Typography color="text.secondary" variant="body2">Supplier information and product agreements.</Typography></Box><Stack alignItems="center" direction="row" gap={1}>{editing && can(USER_PERMISSIONS.SUPPLIERS_UPDATE) ? <FormControlLabel control={<Switch checked={form.isActive} onChange={() => setStatusTarget(editing)} />} label="Active" /> : null}<Button disabled={saving} onClick={() => void saveSupplier()} variant="contained">{editing ? "Save" : "Create"}</Button></Stack></Stack></DialogTitle>
      <Divider /><Tabs onChange={(_event, value) => setTab(value)} sx={{ px: 2 }} value={tab}><Tab label="Supplier Info" /><Tab disabled={!editing} label={`Products ${editing ? `(${editing.products.length})` : ""}`} /></Tabs><Divider />
      <DialogContent sx={{ overflowY: "auto" }}>{tab === 0 ? <Stack spacing={2}><Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}><TextField label="Supplier Name *" onChange={(event) => setForm((value) => ({ ...value, name: event.target.value }))} value={form.name} /><TextField disabled helperText={editing ? "Permanent Mobee supplier code." : ""} label="Supplier Code" value={form.code} /><TextField label="Contact Person" onChange={(event) => setForm((value) => ({ ...value, contactPerson: event.target.value }))} value={form.contactPerson ?? ""} /><TextField label="Phone" onChange={(event) => setForm((value) => ({ ...value, phone: event.target.value }))} value={form.phone ?? ""} /><TextField label="Email" onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} type="email" value={form.email ?? ""} /><TextField inputProps={{ min: 0 }} label="Payment Term Days" onChange={(event) => setForm((value) => ({ ...value, paymentTermDays: Math.max(0, Number(event.target.value)) }))} type="number" value={form.paymentTermDays} /><TextField inputProps={{ min: 0 }} label="Credit Limit (LKR)" onChange={(event) => setForm((value) => ({ ...value, creditLimit: Math.max(0, Number(event.target.value)) }))} type="number" value={form.creditLimit} /><TextField label="Address" minRows={3} multiline onChange={(event) => setForm((value) => ({ ...value, address: event.target.value }))} sx={{ gridColumn: { md: "1 / -1" } }} value={form.address ?? ""} /></Box></Stack> : <Stack spacing={2}><Stack alignItems="center" direction="row" justifyContent="space-between"><Box><Typography fontWeight={700}>Linked Products</Typography><Typography color="text.secondary" variant="body2">Supplier-specific pricing, codes, MOQ, and lead times.</Typography></Box>{can(USER_PERMISSIONS.SUPPLIERS_UPDATE) ? <Button disabled={!editing?.isActive} onClick={() => void openProductLink()} startIcon={<LinkRoundedIcon />} variant="outlined">Link Product</Button> : null}</Stack><Box sx={{ overflowX: "auto" }}><Box sx={{ minWidth: 900 }}><Box sx={{ bgcolor: "action.hover", display: "grid", gridTemplateColumns: "1.5fr 1fr .8fr .8fr .7fr .7fr", p: 1.5 }}>{["Product", "Supplier Code", "Quoted", "Last Purchase", "MOQ", "Actions"].map((label) => <Typography fontSize={12.5} fontWeight={700} key={label}>{label}</Typography>)}</Box>{editing?.products.map((link) => <Box key={link.id} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", display: "grid", gridTemplateColumns: "1.5fr 1fr .8fr .8fr .7fr .7fr", minHeight: 58, p: 1.5 }}><Box><Typography fontSize={13} fontWeight={600}>{link.supplierProductName || link.productName}</Typography><Stack direction="row" gap={0.5}><Chip color={link.isPreferred ? "primary" : "default"} label={link.isPreferred ? "Preferred" : "Standard"} size="small" variant="outlined" /><Chip color={link.isActive ? "success" : "default"} label={link.isActive ? "Active" : "Inactive"} size="small" /></Stack></Box><Typography fontSize={13}>{link.supplierProductCode || link.productSku || "—"}</Typography><Typography fontSize={13}>{link.quotedPrice ? fCurrency(Number(link.quotedPrice)) : "—"}</Typography><Typography fontSize={13}>{link.lastPurchasingPrice ? fCurrency(Number(link.lastPurchasingPrice)) : "—"}</Typography><Typography fontSize={13}>{link.minimumOrderQty}</Typography><Stack direction="row"><IconButton onClick={() => void openProductLink(link)} size="small"><EditOutlinedIcon sx={{ fontSize: 18 }} /></IconButton><Switch checked={link.isActive} onChange={() => void toggleLink(link)} size="small" /></Stack></Box>)}{!editing?.products.length ? <Typography color="text.secondary" py={6} textAlign="center">No products linked to this supplier.</Typography> : null}</Box></Box></Stack>}</DialogContent>
      <Divider /><DialogActions><Button color="inherit" onClick={() => setEditorOpen(false)}>Close</Button></DialogActions>
    </Dialog>

    <Dialog fullWidth maxWidth="sm" onClose={() => setProductDialog(false)} open={productDialog}><DialogTitle>{editingLink ? "Edit Supplier Product" : "Link Product"}</DialogTitle><DialogContent><Stack spacing={2} pt={1}><Autocomplete disabled={Boolean(editingLink)} getOptionLabel={(option) => option.name} isOptionEqualToValue={(option, value) => option.id === value.id} onChange={(_event, value) => { setSelectedProduct(value); setLinkForm((current) => ({ ...current, supplierProductCode: editing && value ? supplierProductCode(editing.id, value.id) : "" })); }} options={products} renderInput={(params) => <TextField {...params} label="Product *" />} value={selectedProduct} /><Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}><TextField label="Supplier Product Name" onChange={(event) => setLinkForm((value) => ({ ...value, supplierProductName: event.target.value }))} value={linkForm.supplierProductName} /><TextField disabled label="Supplier Product Code" value={linkForm.supplierProductCode} /><TextField inputProps={{ min: 0 }} label="Quoted Price" onChange={(event) => setLinkForm((value) => ({ ...value, quotedPrice: event.target.value }))} type="number" value={linkForm.quotedPrice} /><TextField inputProps={{ min: 0 }} label="Last Purchasing Price" onChange={(event) => setLinkForm((value) => ({ ...value, lastPurchasingPrice: event.target.value }))} type="number" value={linkForm.lastPurchasingPrice} /><TextField inputProps={{ min: 1 }} label="Minimum Order Quantity" onChange={(event) => setLinkForm((value) => ({ ...value, minimumOrderQty: event.target.value }))} type="number" value={linkForm.minimumOrderQty} /><TextField inputProps={{ min: 0 }} label="Lead Time (days)" onChange={(event) => setLinkForm((value) => ({ ...value, leadTimeDays: event.target.value }))} type="number" value={linkForm.leadTimeDays} /></Box><Stack direction="row" gap={2}><FormControlLabel control={<Switch checked={linkForm.isPreferred} onChange={(event) => setLinkForm((value) => ({ ...value, isPreferred: event.target.checked }))} />} label="Preferred supplier" /><FormControlLabel control={<Switch checked={linkForm.isActive} onChange={(event) => setLinkForm((value) => ({ ...value, isActive: event.target.checked }))} />} label="Active" /></Stack></Stack></DialogContent><DialogActions><Button color="inherit" onClick={() => setProductDialog(false)}>Cancel</Button><Button disabled={saving || !selectedProduct} onClick={() => void saveProductLink()} variant="contained">Save Product</Button></DialogActions></Dialog>

    <Dialog fullWidth maxWidth="xs" onClose={() => setStatusTarget(null)} open={statusTarget !== null}><DialogTitle>{statusTarget?.isActive ? "Deactivate supplier?" : "Activate supplier?"}</DialogTitle><DialogContent><Typography color="text.secondary">{statusTarget?.isActive ? "New purchasing activity and new product links will be blocked. Historical records remain unchanged." : "This supplier will become available for authorized purchasing operations."}</Typography></DialogContent><DialogActions><Button color="inherit" onClick={() => setStatusTarget(null)}>Cancel</Button><Button color={statusTarget?.isActive ? "error" : "primary"} onClick={() => void confirmStatus()} variant="contained">Confirm</Button></DialogActions></Dialog>
  </>;
}
