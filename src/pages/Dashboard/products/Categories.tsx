import AccountTreeRoundedIcon from "@mui/icons-material/AccountTreeRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import SubdirectoryArrowRightRoundedIcon from "@mui/icons-material/SubdirectoryArrowRightRounded";
import { Autocomplete, Box, Button, Card, Checkbox, Chip, FormControlLabel, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import useAuth from "../../../hooks/useAuth";
import { createProductCategory, getProductAttributes, getProductCategories, updateProductCategory, type ProductAttribute, type ProductCategory } from "../../../redux/slices/productRedux/productRedux";
import { USER_PERMISSIONS } from "../../../utils/constants";
import { flattenProductCategoryTree, productCategoryDescendantIds } from "../../../utils/productCategoryTree";

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
      setCategories(categoryRows);
      setAttributes(attributeRows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load category data.");
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const treeCategories = useMemo(() => flattenProductCategoryTree(categories), [categories]);
  const categoryPathById = useMemo(() => new Map(treeCategories.map(({ category, path }) => [category.id, path])), [treeCategories]);
  const excludedParentIds = useMemo(() => editing ? productCategoryDescendantIds(categories, editing.id) : new Set<number>(), [categories, editing]);
  const parentOptions = useMemo(() => treeCategories.filter(({ category }) => category.isActive && category.id !== editing?.id && !excludedParentIds.has(category.id)), [editing?.id, excludedParentIds, treeCategories]);
  const rootCount = useMemo(() => categories.filter(({ parentId }) => !parentId).length, [categories]);
  const childCount = categories.length - rootCount;

  const selectCategory = (category: ProductCategory) => {
    setEditing(category);
    setForm({ description: category.description ?? "", iconUrl: category.iconUrl ?? "", isActive: category.isActive, logoUrl: category.logoUrl ?? "", name: category.name, parentId: category.parentId ?? "", priority: category.priority, requiredAttributeIds: category.requiredAttributeIds, slug: category.slug });
  };

  const createNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      toast.error("Category name is required.");
      return;
    }
    setSaving(true);
    try {
      const input = {
        description: form.description.trim() || null,
        iconUrl: form.iconUrl.trim() || null,
        logoUrl: form.logoUrl.trim() || null,
        name: form.name.trim(),
        parentId: form.parentId || null,
        priority: form.priority,
        requiredAttributeIds: form.requiredAttributeIds,
        slug: form.slug.trim() || undefined,
      };
      if (editing) await updateProductCategory(editing.id, input);
      else await createProductCategory({ ...input, isActive: form.isActive });
      toast.success(`Category ${editing ? "updated" : "created"} successfully.`);
      createNew();
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save category.");
    } finally {
      setSaving(false);
    }
  };

  const panelSx = { border: 1, borderColor: "divider", borderRadius: 2.5, boxShadow: "none" } as const;

  return <>
    <PageMeta description="Manage Mobee product categories and required attributes." title="Product Categories | Mobee Suite" />
    <Stack spacing={2.5}>
      <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={2} justifyContent="space-between">
        <Stack alignItems="center" direction="row" spacing={1}><CategoryOutlinedIcon color="primary" /><Typography variant="h4">Product Categories</Typography></Stack>
        {can(USER_PERMISSIONS.PRODUCT_CATEGORIES_CREATE) ? <Button onClick={createNew} startIcon={<AddRoundedIcon />} variant="contained">New Category</Button> : null}
      </Stack>
      <Box sx={{ maxWidth: 1320, mx: "auto", width: "100%" }}>
        <Stack direction="row" flexWrap="wrap" gap={1} mb={2}>
          <Chip color="primary" label={`Categories: ${categories.length}`} variant="outlined" />
          <Chip color="success" label={`Top level: ${rootCount}`} variant="outlined" />
          <Chip color="info" label={`Subcategories: ${childCount}`} variant="outlined" />
          <Chip label={`Attributes: ${attributes.length}`} variant="outlined" />
        </Stack>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "360px minmax(0, 1fr)" } }}>
          <Card sx={{ ...panelSx, minHeight: 410, overflow: "hidden", p: 1.25 }}>
            <Stack spacing={1.25}>
              <Box px={0.75}><Typography fontWeight={700} variant="h6">Category hierarchy</Typography><Typography color="text.secondary" variant="caption">Parent categories and their subcategories.</Typography></Box>
              <Stack spacing={0.5} sx={{ maxHeight: { md: 610 }, overflowY: "auto", pr: 0.5 }}>
                {treeCategories.map(({ category, depth, hasChildren, path }) => <Button
                  color="inherit"
                  key={category.id}
                  onClick={() => selectCategory(category)}
                  startIcon={depth ? <SubdirectoryArrowRightRoundedIcon fontSize="small" /> : <AccountTreeRoundedIcon fontSize="small" />}
                  sx={{ alignItems: "flex-start", bgcolor: editing?.id === category.id ? "action.selected" : "transparent", justifyContent: "flex-start", minHeight: 48, pl: 1.25 + depth * 2, pr: 1, py: 0.75, textAlign: "left" }}
                >
                  <Box minWidth={0} width="100%">
                    <Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.5}>
                      <Typography fontSize={13.5} fontWeight={depth === 0 ? 800 : 650} noWrap>{category.name}</Typography>
                      {depth === 0 ? <Chip label="Parent" size="small" sx={{ height: 20 }} variant="outlined" /> : <Chip color="info" label="Child" size="small" sx={{ height: 20 }} variant="outlined" />}
                      {!category.isActive ? <Chip color="default" label="Inactive" size="small" sx={{ height: 20 }} /> : null}
                    </Stack>
                    <Typography color="text.secondary" display="block" noWrap variant="caption">{hasChildren ? `${path} · contains subcategories` : path}</Typography>
                  </Box>
                </Button>)}
                {!categories.length ? <Typography color="text.secondary" p={2} variant="body2">No categories created yet.</Typography> : null}
              </Stack>
            </Stack>
          </Card>
          <Card component="form" onSubmit={submit} sx={{ ...panelSx, p: { xs: 1.5, sm: 2.5 } }}>
            <Stack spacing={2}>
              <Box>
                <Typography fontWeight={700} variant="h6">{editing ? "Edit category" : "New category"}</Typography>
                <Typography color="text.secondary" variant="body2">{editing ? categoryPathById.get(editing.id) : "Create a parent category or place it under an existing category."}</Typography>
              </Box>
              <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "160px minmax(0, 1fr)" } }}>
                <TextField label="Priority" onChange={(event) => setForm((current) => ({ ...current, priority: Math.max(0, Number(event.target.value)) }))} slotProps={{ htmlInput: { min: 0 } }} type="text" value={form.priority} />
                <TextField label="Category name" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required value={form.name} />
              </Box>
              <TextField label="Description" minRows={2} multiline onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} value={form.description} />
              <TextField
                fullWidth
                helperText="Choose where this category belongs. Indented categories are already children of another category."
                label="Parent category"
                onChange={(event) => setForm((current) => ({ ...current, parentId: Number(event.target.value) || "" }))}
                select
                value={form.parentId}
              >
                <MenuItem value=""><em>Top-level category (no parent)</em></MenuItem>
                {parentOptions.map(({ category, depth, path }) => <MenuItem key={category.id} sx={{ pl: 2 + depth * 3 }} value={category.id}>{depth ? "↳ " : ""}{category.name}<Typography color="text.secondary" component="span" ml={0.75} variant="caption">{depth ? path : "Top level"}</Typography></MenuItem>)}
              </TextField>
              <Autocomplete
                getOptionLabel={(option) => option.displayName}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                multiple
                onChange={(_event, values) => setForm((current) => ({ ...current, requiredAttributeIds: values.map(({ id }) => id) }))}
                options={attributes.filter(({ isActive }) => isActive)}
                renderInput={(params) => <TextField {...params} label="Required product attributes" />}
                value={attributes.filter(({ id }) => form.requiredAttributeIds.includes(id))}
              />
              <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
                <TextField label="Icon URL" onChange={(event) => setForm((current) => ({ ...current, iconUrl: event.target.value }))} value={form.iconUrl} />
                <TextField label="Logo URL" onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))} value={form.logoUrl} />
              </Box>
              <FormControlLabel control={<Checkbox checked={form.isActive} disabled={Boolean(editing)} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />} label="Active" />
              <Button disabled={saving || !form.name.trim() || (editing ? !can(USER_PERMISSIONS.PRODUCT_CATEGORIES_UPDATE) : !can(USER_PERMISSIONS.PRODUCT_CATEGORIES_CREATE))} fullWidth type="submit" variant="contained">{saving ? "Saving…" : editing ? "Save category" : "Create category"}</Button>
            </Stack>
          </Card>
        </Box>
      </Box>
    </Stack>
  </>;
}
