import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import { Autocomplete, Box, Button, Card, Checkbox, Chip, FormControlLabel, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import useAuth from "../../../hooks/useAuth";
import { USER_PERMISSIONS } from "../../../utils/constants";
import { createProductCategory, getProductAttributes, getProductCategories, updateProductCategory, type ProductAttribute, type ProductCategory } from "../../../redux/slices/productRedux/productRedux";

type CategoryForm = { description: string; iconUrl: string; isActive: boolean; logoUrl: string; name: string; parentId: number | ""; priority: number; requiredAttributeIds: number[]; slug: string };
const EMPTY_FORM: CategoryForm = { description: "", iconUrl: "", isActive: true, logoUrl: "", name: "", parentId: "", priority: 0, requiredAttributeIds: [], slug: "" };

export default function Categories() {
  const { can } = useAuth();
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [editing, setEditing] = useState<ProductCategory | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [categoryRows, attributeRows] = await Promise.all([getProductCategories({ includeInactive: "true" }), getProductAttributes({ includeInactive: "true" })]);
      setCategories(categoryRows); setAttributes(attributeRows);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load category data."); }
  }, []);
  useEffect(() => { void loadData(); }, [loadData]);

  const selectCategory = (category: ProductCategory) => {
    setEditing(category);
    setForm({ description: category.description ?? "", iconUrl: category.iconUrl ?? "", isActive: category.isActive, logoUrl: category.logoUrl ?? "", name: category.name, parentId: category.parentId ?? "", priority: category.priority, requiredAttributeIds: category.requiredAttributeIds, slug: category.slug });
  };
  const createNew = () => { setEditing(null); setForm(EMPTY_FORM); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) { toast.error("Category name is required."); return; }
    setSaving(true);
    try {
      const input = { description: form.description.trim() || null, iconUrl: form.iconUrl.trim() || null, logoUrl: form.logoUrl.trim() || null, name: form.name.trim(), parentId: form.parentId || null, priority: form.priority, requiredAttributeIds: form.requiredAttributeIds, slug: form.slug.trim() || undefined };
      if (editing) await updateProductCategory(editing.id, input); else await createProductCategory({ ...input, isActive: form.isActive });
      toast.success(`Category ${editing ? "updated" : "created"} successfully.`); createNew(); await loadData();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save category."); }
    finally { setSaving(false); }
  };

  const rootCount = useMemo(() => categories.filter(({ parentId }) => !parentId).length, [categories]);
  const panelSx = { border: 1, borderColor: "divider", borderRadius: 2.5, boxShadow: "none" } as const;

  return <>
    <PageMeta description="Manage Mobee product categories and required attributes." title="Product Categories | Mobee Suite" />
    <Stack spacing={2.5}>
      <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}><Stack alignItems="center" direction="row" spacing={1}><CategoryOutlinedIcon color="primary" /><Typography variant="h4">Product Categories</Typography></Stack>{can(USER_PERMISSIONS.PRODUCT_CATEGORIES_CREATE) ? <Button onClick={createNew} startIcon={<AddRoundedIcon />} variant="contained">New Category</Button> : null}</Stack>
      <Box sx={{ mx: "auto", width: "100%", maxWidth: 1320 }}>
        <Stack direction="row" flexWrap="wrap" gap={1} mb={2}><Chip color="primary" label={`Categories: ${categories.length}`} variant="outlined" /><Chip color="success" label={`Root: ${rootCount}`} variant="outlined" /><Chip color="info" label={`Attributes: ${attributes.length}`} variant="outlined" /></Stack>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "320px minmax(0, 1fr)" } }}>
          <Card sx={{ ...panelSx, minHeight: 410, p: 2 }}><Typography fontWeight={700} mb={1.5} variant="h6">Categories</Typography><Stack spacing={0.5}>{categories.map((category) => <Button color="inherit" key={category.id} onClick={() => selectCategory(category)} sx={{ bgcolor: editing?.id === category.id ? "action.selected" : "transparent", justifyContent: "flex-start", px: 2, py: 1, textAlign: "left" }}>{category.name}</Button>)}{!categories.length ? <Typography color="text.secondary" variant="body2">No categories created yet.</Typography> : null}</Stack></Card>
          <Card component="form" onSubmit={submit} sx={{ ...panelSx, p: 2 }}><Stack spacing={1.5}>
            <Box><Typography fontWeight={700} variant="h6">Category Information</Typography><Typography color="text.secondary" variant="body2">Manage hierarchy, required attributes, and images in one flow.</Typography></Box>
            <TextField label="Priority" onChange={(event) => setForm((current) => ({ ...current, priority: Math.max(0, Number(event.target.value)) }))} slotProps={{ htmlInput: { min: 0 } }} type="text" value={form.priority} />
            <TextField label="Name" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required value={form.name} />
            <TextField label="Description" minRows={2} multiline onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} value={form.description} />
            <Autocomplete getOptionLabel={(option) => option.displayName} isOptionEqualToValue={(option, value) => option.id === value.id} multiple onChange={(_event, values) => setForm((current) => ({ ...current, requiredAttributeIds: values.map(({ id }) => id) }))} options={attributes.filter(({ isActive }) => isActive)} renderInput={(params) => <TextField {...params} label="Select Required Attribute" />} value={attributes.filter(({ id }) => form.requiredAttributeIds.includes(id))} />
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, maxWidth: 315, p: 1.5 }}><Typography fontWeight={700} mb={0.5}>Parent Category</Typography><TextField fullWidth onChange={(event) => setForm((current) => ({ ...current, parentId: Number(event.target.value) || "" }))} select value={form.parentId}><MenuItem value="">No parent selected</MenuItem>{categories.filter((category) => category.isActive && category.id !== editing?.id).map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}</TextField></Box>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}><TextField label="Icon URL" onChange={(event) => setForm((current) => ({ ...current, iconUrl: event.target.value }))} value={form.iconUrl} /><TextField label="Logo URL" onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))} value={form.logoUrl} /></Box>
            <FormControlLabel control={<Checkbox checked={form.isActive} disabled={Boolean(editing)} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />} label="Active" />
            <Button disabled={saving || !form.name.trim() || (editing ? !can(USER_PERMISSIONS.PRODUCT_CATEGORIES_UPDATE) : !can(USER_PERMISSIONS.PRODUCT_CATEGORIES_CREATE))} fullWidth type="submit" variant="contained">{saving ? "Saving…" : editing ? "Save Product Category" : "Create Product Category"}</Button>
          </Stack></Card>
        </Box>
      </Box>
    </Stack>
  </>;
}
