import AddRoundedIcon from "@mui/icons-material/AddRounded";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import {
  Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, FormControlLabel, IconButton, InputAdornment, Stack, SwipeableDrawer,
  Switch, TextField, Tooltip, Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import useAuth from "../../../hooks/useAuth";
import { USER_PERMISSIONS } from "../../../utils/constants";
import {
  createProductAttribute, createProductAttributeOption, getProductAttributes,
  updateProductAttribute, updateProductAttributeOption, updateProductAttributeOptionStatus,
  updateProductAttributeStatus, type ProductAttribute, type ProductAttributeOption,
} from "../../../redux/slices/productRedux/productRedux";

type AttributeForm = { description: string; displayName: string; isEffectOnDescription: boolean; isEffectOnImages: boolean; isEffectOnPricing: boolean; name: string; postUnit: string; preUnit: string; priority: number };
type OptionForm = { colorHex: string; description: string; iconUrl: string; label: string; priority: number; value: string };
const EMPTY_ATTRIBUTE: AttributeForm = { description: "", displayName: "", isEffectOnDescription: false, isEffectOnImages: false, isEffectOnPricing: false, name: "", postUnit: "", preUnit: "", priority: 0 };
const EMPTY_OPTION: OptionForm = { colorHex: "", description: "", iconUrl: "", label: "", priority: 0, value: "" };

function BooleanCell({ value }: { value: boolean }) {
  return value ? <CheckCircleRoundedIcon color="success" fontSize="small" /> : <Box component="span" sx={{ alignItems: "center", bgcolor: "error.main", borderRadius: "50%", color: "white", display: "inline-flex", fontSize: 14, height: 19, justifyContent: "center", width: 19 }}>×</Box>;
}

export default function Attributes() {
  const { can } = useAuth();
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProductAttribute | null>(null);
  const [form, setForm] = useState(EMPTY_ATTRIBUTE);
  const [optionOpen, setOptionOpen] = useState(false);
  const [optionAttribute, setOptionAttribute] = useState<ProductAttribute | null>(null);
  const [editingOption, setEditingOption] = useState<ProductAttributeOption | null>(null);
  const [optionForm, setOptionForm] = useState(EMPTY_OPTION);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setAttributes(await getProductAttributes({ includeInactive: "true" })); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load product attributes."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const openAttribute = (attribute?: ProductAttribute) => {
    setEditing(attribute ?? null);
    setForm(attribute ? { description: attribute.description ?? "", displayName: attribute.displayName, isEffectOnDescription: attribute.isEffectOnDescription, isEffectOnImages: attribute.isEffectOnImages, isEffectOnPricing: attribute.isEffectOnPricing, name: attribute.name, postUnit: attribute.postUnit ?? "", preUnit: attribute.preUnit ?? "", priority: attribute.priority } : EMPTY_ATTRIBUTE);
    setDrawerOpen(true);
  };
  const submitAttribute = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true);
    try {
      const input = { ...form, description: form.description.trim() || null, postUnit: form.postUnit.trim() || null, preUnit: form.preUnit.trim() || null };
      if (editing) await updateProductAttribute(editing.id, input); else await createProductAttribute({ ...input, isActive: true });
      toast.success(`Attribute ${editing ? "updated" : "created"} successfully.`); setDrawerOpen(false); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save attribute."); } finally { setSaving(false); }
  };
  const openOption = (attribute: ProductAttribute, option?: ProductAttributeOption) => {
    setOptionAttribute(attribute); setEditingOption(option ?? null);
    setOptionForm(option ? { colorHex: option.colorHex ?? "", description: option.description ?? "", iconUrl: option.iconUrl ?? "", label: option.label, priority: option.priority, value: option.value } : EMPTY_OPTION);
    setOptionOpen(true);
  };
  const submitOption = async (event: FormEvent) => {
    event.preventDefault(); if (!optionAttribute) return; setSaving(true);
    try {
      const input = { ...optionForm, colorHex: optionForm.colorHex || null, description: optionForm.description.trim() || null, iconUrl: optionForm.iconUrl.trim() || null };
      if (editingOption) await updateProductAttributeOption(editingOption.id, input); else await createProductAttributeOption(optionAttribute.id, { ...input, isActive: true });
      toast.success(`Option ${editingOption ? "updated" : "created"} successfully.`); setOptionOpen(false); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save option."); } finally { setSaving(false); }
  };
  const toggleAttribute = async (attribute: ProductAttribute) => { try { await updateProductAttributeStatus(attribute.id, !attribute.isActive); await load(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update attribute status."); } };
  const toggleOption = async (option: ProductAttributeOption) => { try { await updateProductAttributeOptionStatus(option.id, !option.isActive); await load(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update option status."); } };

  const visible = useMemo(() => { const term = search.trim().toLowerCase(); return term ? attributes.filter((item) => `${item.displayName} ${item.name} ${item.description ?? ""}`.toLowerCase().includes(term)) : attributes; }, [attributes, search]);
  const columns: GridColDef<ProductAttribute>[] = [
    { field: "id", headerName: "ID", minWidth: 65 },
    { field: "displayName", headerName: "Name", flex: 1, minWidth: 180 },
    { field: "description", headerName: "Description", flex: 1.25, minWidth: 210, valueFormatter: (value) => value || "—" },
    { field: "preUnit", headerName: "Pre Unit", minWidth: 105, valueFormatter: (value) => value || "—" },
    { field: "postUnit", headerName: "Post Unit", minWidth: 105, valueFormatter: (value) => value || "—" },
    { field: "isEffectOnImages", headerName: "Affects Images", minWidth: 135, align: "center", headerAlign: "center", renderCell: ({ value }) => <BooleanCell value={value} /> },
    { field: "isEffectOnPricing", headerName: "Affects Pricing", minWidth: 135, align: "center", headerAlign: "center", renderCell: ({ value }) => <BooleanCell value={value} /> },
    { field: "isEffectOnDescription", headerName: "Affects Description", minWidth: 165, align: "center", headerAlign: "center", renderCell: ({ value }) => <BooleanCell value={value} /> },
    { field: "options", headerName: "Options", minWidth: 90, align: "center", headerAlign: "center", valueGetter: (_value, row) => row.options.length },
    { field: "isActive", headerName: "Status", minWidth: 105, renderCell: ({ value }) => <Chip color={value ? "success" : "default"} label={value ? "Active" : "Inactive"} size="small" /> },
    { field: "actions", headerName: "Actions", minWidth: 110, align: "center", headerAlign: "center", sortable: false, renderCell: ({ row }) => can(USER_PERMISSIONS.PRODUCT_ATTRIBUTES_UPDATE) ? <Stack alignItems="center" direction="row" height="100%"><Tooltip title="Edit"><IconButton onClick={(event) => { event.stopPropagation(); openAttribute(row); }} size="small"><EditOutlinedIcon fontSize="small" /></IconButton></Tooltip><Tooltip title={row.isActive ? "Deactivate" : "Activate"}><IconButton color={row.isActive ? "error" : "success"} onClick={(event) => { event.stopPropagation(); void toggleAttribute(row); }} size="small">{row.isActive ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleRoundedIcon fontSize="small" />}</IconButton></Tooltip></Stack> : null },
  ];
  const optionsCount = attributes.reduce((sum, item) => sum + item.options.length, 0);

  return <>
    <PageMeta description="Manage product variation attributes and options." title="Product Attributes | Mobee Suite" />
    <Stack spacing={2.5}>
      <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}><Box><Stack alignItems="center" direction="row" spacing={1}><TuneRoundedIcon color="primary" /><Typography variant="h4">Product Attributes</Typography></Stack><Typography color="text.secondary" mt={0.5} variant="body2">Create reusable attributes and selectable options.</Typography></Box>{can(USER_PERMISSIONS.PRODUCT_ATTRIBUTES_CREATE) ? <Button onClick={() => openAttribute()} startIcon={<AddRoundedIcon />} variant="contained">New Attribute</Button> : null}</Stack>
      <Stack direction="row" gap={1}><Chip color="primary" label={`Attributes: ${attributes.length}`} variant="outlined" /><Chip color="info" label={`Options: ${optionsCount}`} variant="outlined" /></Stack>
      <Card variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}><Stack alignItems={{ sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5} p={2}><Typography fontWeight={700}>Product Attributes List <Chip label={visible.length} size="small" /></Typography><TextField onChange={(event) => setSearch(event.target.value)} placeholder="Search" size="small" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }} sx={{ width: { xs: "100%", sm: 300 } }} value={search} /></Stack><Box sx={{ borderTop: 1, borderColor: "divider", overflowX: "auto" }}><DataGrid autoHeight columns={columns} disableRowSelectionOnClick getRowHeight={() => 52} initialState={{ pagination: { paginationModel: { pageSize: 15 } } }} onRowClick={({ row }) => can(USER_PERMISSIONS.PRODUCT_ATTRIBUTES_UPDATE) && openAttribute(row)} pageSizeOptions={[15, 25, 50]} rows={visible} sx={{ border: 0, cursor: "pointer", minWidth: 1240, "& .MuiDataGrid-columnHeaders": { bgcolor: "action.hover" }, "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 700 }, "& .MuiDataGrid-row:hover": { bgcolor: "action.hover" }, "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" } }} /></Box></Card>
    </Stack>

    <SwipeableDrawer anchor="bottom" disableSwipeToOpen onClose={() => !saving && setDrawerOpen(false)} onOpen={() => undefined} open={drawerOpen} PaperProps={{ component: "form", onSubmit: submitAttribute, sx: { borderRadius: { xs: "18px 18px 0 0", md: "22px 22px 0 0" }, height: { xs: "100dvh", sm: "82dvh" }, left: { md: "2.5%" }, mx: "auto", overflow: "hidden", right: { md: "2.5%" }, width: { xs: "100%", md: "95%" } } }}>
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}><Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}><Box sx={{ bgcolor: "divider", borderRadius: 2, height: 4, width: 44 }} /></Box><Stack alignItems="center" direction="row" justifyContent="space-between" px={{ xs: 2, md: 3 }} py={1.5}><Box><Typography color="primary.main" fontWeight={800} variant="overline">Product Attribute</Typography><Typography variant="h5">{editing ? editing.displayName : "Add Product Attribute"}</Typography><Typography color="text.secondary" variant="body2">Keep attribute basics and options in one workflow.</Typography></Box><Stack direction="row" gap={1}><Button disabled={saving || !form.displayName.trim() || !form.name.trim()} type="submit" variant="contained">{editing ? "Save" : "Create"}</Button><IconButton onClick={() => setDrawerOpen(false)}><CloseRoundedIcon /></IconButton></Stack></Stack><Divider />
      <Box sx={{ flex: 1, overflowY: "auto", p: { xs: 2, md: 3 } }}><Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 300px" } }}><Card variant="outlined" sx={{ borderRadius: 3, p: { xs: 2, md: 2.5 } }}><Stack spacing={2.5}><Box><Typography fontWeight={700} variant="h6">Attribute Information</Typography><Typography color="text.secondary" variant="body2">Define the label, units, and product behaviour.</Typography></Box><Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField autoFocus fullWidth label="Display name" onChange={(event) => setForm((current) => ({ ...current, displayName: event.target.value }))} required value={form.displayName} /><TextField fullWidth label="System name" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value.toLowerCase().replace(/\s+/g, "_") }))} required value={form.name} /></Stack><TextField label="Description" minRows={4} multiline onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} value={form.description} /><Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField fullWidth label="Pre Unit" onChange={(event) => setForm((current) => ({ ...current, preUnit: event.target.value }))} value={form.preUnit} /><TextField fullWidth label="Post Unit" onChange={(event) => setForm((current) => ({ ...current, postUnit: event.target.value }))} value={form.postUnit} /><TextField fullWidth label="Priority" onChange={(event) => setForm((current) => ({ ...current, priority: Math.max(0, Number(event.target.value)) }))} type="number" value={form.priority} /></Stack><Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between"><FormControlLabel control={<Switch checked={form.isEffectOnImages} onChange={(event) => setForm((current) => ({ ...current, isEffectOnImages: event.target.checked }))} />} label="Effect on Images" /><FormControlLabel control={<Switch checked={form.isEffectOnPricing} onChange={(event) => setForm((current) => ({ ...current, isEffectOnPricing: event.target.checked }))} />} label="Effect on Pricing" /><FormControlLabel control={<Switch checked={form.isEffectOnDescription} onChange={(event) => setForm((current) => ({ ...current, isEffectOnDescription: event.target.checked }))} />} label="Effect on Description" /></Stack><Divider /><Stack alignItems="center" direction="row" justifyContent="space-between"><Box><Typography fontWeight={700}>Options</Typography><Typography color="text.secondary" variant="body2">Selectable values linked to this attribute.</Typography></Box>{editing ? <Button onClick={() => openOption(editing)} startIcon={<AddRoundedIcon />}>Add Option</Button> : <Typography color="text.secondary" variant="caption">Save first to add options.</Typography>}</Stack>{editing?.options.map((option) => <Stack alignItems="center" direction="row" justifyContent="space-between" key={option.id} sx={{ bgcolor: "action.hover", borderRadius: 2, p: 1.5 }}><Box><Typography fontWeight={600}>{option.label}</Typography><Typography color="text.secondary" variant="caption">{option.value}</Typography></Box><Stack direction="row"><IconButton onClick={() => openOption(editing, option)} size="small"><EditOutlinedIcon fontSize="small" /></IconButton><IconButton color={option.isActive ? "error" : "success"} onClick={() => void toggleOption(option)} size="small">{option.isActive ? <BlockOutlinedIcon fontSize="small" /> : <CheckCircleRoundedIcon fontSize="small" />}</IconButton></Stack></Stack>)}</Stack></Card><Card variant="outlined" sx={{ alignSelf: "start", borderRadius: 3, p: 2.5 }}><Typography fontWeight={700} variant="h6">Actions</Typography><Typography color="text.secondary" mb={2} variant="body2">Save changes or close the editor.</Typography><Stack spacing={1}><Button disabled={saving || !form.displayName.trim() || !form.name.trim()} fullWidth type="submit" variant="contained">{editing ? "Save Product Attribute" : "Create Product Attribute"}</Button><Button color="inherit" fullWidth onClick={() => setDrawerOpen(false)} variant="outlined">Close</Button></Stack></Card></Box></Box></Box>
    </SwipeableDrawer>

    <Dialog component="form" fullWidth maxWidth="sm" onClose={() => !saving && setOptionOpen(false)} onSubmit={submitOption} open={optionOpen}><DialogTitle>{editingOption ? "Edit Option" : `Add ${optionAttribute?.displayName ?? "Attribute"} Option`}</DialogTitle><DialogContent dividers><Stack spacing={2.5}><Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField autoFocus fullWidth label="Display label" onChange={(event) => setOptionForm((current) => ({ ...current, label: event.target.value }))} required value={optionForm.label} /><TextField fullWidth label="Value" onChange={(event) => setOptionForm((current) => ({ ...current, value: event.target.value }))} required value={optionForm.value} /></Stack><TextField label="Description" minRows={2} multiline onChange={(event) => setOptionForm((current) => ({ ...current, description: event.target.value }))} value={optionForm.description} /><TextField label="Icon URL" onChange={(event) => setOptionForm((current) => ({ ...current, iconUrl: event.target.value }))} value={optionForm.iconUrl} /><Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField fullWidth label="Color" onChange={(event) => setOptionForm((current) => ({ ...current, colorHex: event.target.value }))} placeholder="#FFAE00" value={optionForm.colorHex} /><TextField fullWidth label="Priority" onChange={(event) => setOptionForm((current) => ({ ...current, priority: Math.max(0, Number(event.target.value)) }))} type="number" value={optionForm.priority} /></Stack></Stack></DialogContent><DialogActions><Button color="inherit" onClick={() => setOptionOpen(false)}>Cancel</Button><Button disabled={saving || !optionForm.label.trim() || !optionForm.value.trim()} type="submit" variant="contained">Save Option</Button></DialogActions></Dialog>
  </>;
}
