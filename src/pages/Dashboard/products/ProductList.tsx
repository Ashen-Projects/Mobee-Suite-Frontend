import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Badge, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, InputAdornment, Popover, Stack, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import ProductFormDialog from "../../../components/products/ProductFormDialog";
import useAuth from "../../../hooks/useAuth";
import { USER_PERMISSIONS } from "../../../utils";
import { fCurrency } from "../../../utils/formatNumber";
import { getProduct, getProductAttributes, getProductCategories, getProducts, getProductStockLevelLocations, updateProductStatus, type ProductAttribute, type ProductCategory, type ProductDetail, type ProductListItem, type ProductStockLevel } from "../../../redux/slices/productRedux/productRedux";

type StatusFilter = "all" | "true" | "false";
const PAGE_SIZE = 10;
const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

export default function ProductList() {
  const { can } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [parents, setParents] = useState<ProductListItem[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [stockLevelLocations, setStockLevelLocations] = useState<ProductStockLevel[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status] = useState<StatusFilter>("all");
  const [formOpen, setFormOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<number | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductDetail | null>(null);
  const [statusTarget, setStatusTarget] = useState<ProductListItem | null>(null);
  const [variationAnchor, setVariationAnchor] = useState<HTMLElement | null>(null);
  const [variationPreview, setVariationPreview] = useState<ProductDetail | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => { setDebouncedSearch(search.trim()); setPage(0); }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadReferenceData = useCallback(async () => {
    try {
      const [categoryRows, attributeRows, parentResponse, stockLocations] = await Promise.all([
        getProductCategories({ includeInactive: "true" }),
        getProductAttributes({ includeInactive: "true" }),
        getProducts({ isActive: "all", page: 1, pageSize: 100, rootOnly: "true" }),
        getProductStockLevelLocations(),
      ]);
      setCategories(categoryRows);
      setAttributes(attributeRows);
      setParents(parentResponse.items.filter(({ hasVariations }) => hasVariations));
      setStockLevelLocations(stockLocations);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load product setup data."); }
  }, []);

  const loadProducts = useCallback(async () => {
    const currentRequest = ++requestId.current;
    try {
      const response = await getProducts({
        isActive: status,
        page: page + 1,
        pageSize,
        rootOnly: "true",
        search: debouncedSearch,
      });
      if (currentRequest !== requestId.current) return;
      setProducts(response.items);
      setTotal(response.pagination.total);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setProducts([]);
      setTotal(0);
      toast.error(error instanceof Error ? error.message : "Unable to load products.");
    }
  }, [debouncedSearch, page, pageSize, status]);

  useEffect(() => { void loadReferenceData(); }, [loadReferenceData]);
  useEffect(() => { void loadProducts(); }, [loadProducts]);

  const openEdit = async (row: ProductListItem) => {
    try { setEditingProduct(await getProduct(row.id)); setFormOpen(true); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to load product details."); }
  };
  const openVariations = async (event: React.MouseEvent<HTMLElement>, row: ProductListItem) => {
    event.stopPropagation();
    setVariationAnchor(event.currentTarget);
    try { setVariationPreview(await getProduct(row.id)); }
    catch (error) { setVariationAnchor(null); toast.error(error instanceof Error ? error.message : "Unable to load variations."); }
  };
  const confirmStatus = async () => {
    if (!statusTarget) return;
    try {
      await updateProductStatus(statusTarget.id, !statusTarget.isActive);
      toast.success(`Product ${statusTarget.isActive ? "deactivated" : "activated"} successfully.`);
      setStatusTarget(null);
      await Promise.all([loadProducts(), loadReferenceData()]);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update product status."); }
  };

  const columns = useMemo<GridColDef<ProductListItem>[]>(() => [
    { field: "actions", headerName: "Actions", minWidth: 104, sortable: false, filterable: false, renderCell: ({ row }) => <Stack alignItems="center" direction="row" spacing={0.25} sx={{ height: "100%" }}>{can(USER_PERMISSIONS.PRODUCTS_UPDATE) ? <Tooltip title="Edit product"><IconButton onClick={(event) => { event.stopPropagation(); void openEdit(row); }} size="small"><EditOutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Tooltip> : null}{row.hasVariations ? <Tooltip title={`${row.variationCount} ${row.variationCount === 1 ? "variation" : "variations"}`}><Badge badgeContent={row.variationCount} color="primary" max={99} overlap="circular" showZero><IconButton color="primary" onClick={(event) => void openVariations(event, row)} size="small" sx={{ border: 1, borderColor: "primary.main", borderRadius: 1.25, p: 0.625 }}><Inventory2OutlinedIcon sx={{ fontSize: 18 }} /></IconButton></Badge></Tooltip> : null}</Stack> },
    { field: "name", headerName: "Name", flex: 1, minWidth: 240 },
    { field: "category", headerName: "Category", minWidth: 165, valueGetter: (_value, row) => row.category?.name ?? "—" },
    { field: "variation", headerName: "Variation Lock", minWidth: 155, valueGetter: (_value, row) => row.hasVariations ? "Has variations" : row.parentId ? "Variation" : "Editable", renderCell: ({ value }) => <Chip color="success" label={value} size="small" variant="outlined" /> },
    { field: "sku", headerName: "Product Code", minWidth: 145, valueFormatter: (value) => value || "—" },
    { field: "shortDescription", headerName: "Short Description", flex: 1, minWidth: 230, valueFormatter: (value) => value || "—" },
    { field: "isActive", headerName: "Status", minWidth: 105, renderCell: ({ value }) => <Chip color={value ? "success" : "default"} label={value ? "Active" : "Inactive"} size="small" /> },
    { field: "id", headerName: "#", minWidth: 70, align: "center", headerAlign: "center" },
  ], [can]);

  return <>
    <PageMeta description="View and manage the Mobee product catalogue." title="Product Catalog | Mobee Suite" />
    <Stack spacing={{ xs: 2, sm: 2.5 }}>
      <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
        <Box><Stack alignItems="center" direction="row" spacing={1}><Inventory2OutlinedIcon color="primary" sx={{ fontSize: 22 }} /><Typography variant="h4">Product Catalog</Typography></Stack></Box>
        {can(USER_PERMISSIONS.PRODUCTS_CREATE) ? <Button onClick={() => { setCreateParentId(null); setEditingProduct(null); setFormOpen(true); }} startIcon={<AddRoundedIcon />} variant="contained">New Product</Button> : null}
      </Stack>
      <Stack alignItems="center" direction="row" flexWrap="wrap" gap={1}>
        <Chip color="info" label={`Visible ${products.length}`} size="small" variant="outlined" />
        <Chip color="success" label={`Active ${products.filter(({ isActive }) => isActive).length}`} size="small" variant="outlined" />
        <Chip color="error" label={`Deleted 0`} size="small" variant="outlined" />
        <Typography color="text.secondary" ml={{ sm: "auto" }} variant="caption">{total} total {total === 1 ? "product" : "products"}</Typography>
      </Stack>
      <Card variant="outlined" sx={{ borderRadius: 3, minHeight: { md: 620 }, overflow: "hidden" }}>
        <Stack alignItems={{ sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5} p={1.5}>
          <Typography fontWeight={700}>Active Product Catalog <Chip label={total} size="small" sx={{ ml: 0.5 }} /></Typography>
          <TextField onChange={(event) => setSearch(event.target.value)} placeholder="Search" size="small" slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon color="action" fontSize="small" /></InputAdornment> } }} sx={{ width: { xs: "100%", sm: 300 } }} value={search} />
        </Stack>
        <Box sx={{ borderTop: 1, borderColor: "divider", overflowX: "auto" }}><DataGrid autoHeight columns={columns} columnVisibilityModel={isMobile ? { category: false, id: false, shortDescription: false, sku: false, variation: false } : undefined} disableColumnMenu disableRowSelectionOnClick getRowHeight={() => 52} onPaginationModelChange={(model) => { setPage(model.page); setPageSize(model.pageSize); }} onRowClick={({ row }) => void openEdit(row)} pageSizeOptions={PAGE_SIZE_OPTIONS} paginationMode="server" paginationModel={{ page, pageSize }} rowCount={total} rows={products} sx={{ border: 0, cursor: "pointer", minWidth: isMobile ? 620 : 1120, "& .MuiDataGrid-columnHeaders": { bgcolor: "action.hover", minHeight: "48px !important", maxHeight: "48px !important" }, "& .MuiDataGrid-columnHeaderTitle": { fontSize: 12.5, fontWeight: 700 }, "& .MuiDataGrid-cell": { fontSize: 13 }, "& .MuiDataGrid-row:hover": { bgcolor: "action.hover" }, "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" } }} /></Box>
      </Card>
    </Stack>

    <ProductFormDialog attributes={attributes} categories={categories} initialParentId={createParentId} onClose={() => { setFormOpen(false); setCreateParentId(null); }} onCreateVariation={(parentProductId) => { setFormOpen(false); setEditingProduct(null); setCreateParentId(parentProductId); window.setTimeout(() => setFormOpen(true), 0); }} onSaved={async () => { await Promise.all([loadProducts(), loadReferenceData()]); }} open={formOpen} parents={parents} product={editingProduct} stockLevelLocations={stockLevelLocations} />

    <Popover anchorEl={variationAnchor} anchorOrigin={{ horizontal: "left", vertical: "bottom" }} onClose={() => { setVariationAnchor(null); setVariationPreview(null); }} open={Boolean(variationAnchor)} transformOrigin={{ horizontal: "left", vertical: "top" }} slotProps={{ paper: { sx: { borderRadius: 1.5, mt: 0.75, overflow: "hidden", width: { xs: 350, sm: 620 } } } }}>
      <Stack><Stack alignItems="center" direction="row" justifyContent="space-between" px={1.75} py={1.5}><Box><Typography fontSize={14} fontWeight={700}>Variations &amp; Pricing</Typography><Typography color="text.secondary" fontSize={11.5}>{variationPreview?.variations.filter(({ isActive }) => isActive).length ?? 0} active {variationPreview?.variations.filter(({ isActive }) => isActive).length === 1 ? "variation" : "variations"}</Typography></Box><Stack direction="row" gap={0.5}><Chip color="primary" label={`${variationPreview?.variations.length ?? 0} Total`} size="small" variant="outlined" /><Chip label="Per-item stock" size="small" variant="outlined" /></Stack></Stack>
        <Box sx={{ borderTop: 1, borderColor: "divider", overflowX: "auto", p: 1.25 }}><Box sx={{ minWidth: 500 }}><Box sx={{ bgcolor: "action.hover", display: "grid", gridTemplateColumns: "1.7fr repeat(2, .9fr) .65fr", px: 1.25, py: 1.1 }}>{["Variation", "MRP", "Lowest", "Status"].map((label) => <Typography color="text.secondary" fontSize={11.5} fontWeight={700} key={label}>{label}</Typography>)}</Box>{variationPreview?.variations.map((variation) => <Box key={variation.id} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", display: "grid", gridTemplateColumns: "1.7fr repeat(2, .9fr) .65fr", minHeight: 50, px: 1.25, py: 0.75 }}><Stack direction="row" flexWrap="wrap" gap={0.4}>{variation.options.length ? variation.options.map((option) => <Chip key={option.optionId} label={option.label} size="small" variant="outlined" />) : <Typography fontSize={12.5}>{variation.name}</Typography>}</Stack><Typography fontSize={12.5}>{fCurrency(Number(variation.mrpPrice))}</Typography><Typography fontSize={12.5}>{fCurrency(Number(variation.lowestSellingPrice))}</Typography><Chip color={variation.isActive ? "success" : "default"} label={variation.isActive ? "Active" : "Inactive"} size="small" /></Box>)}</Box></Box>
      </Stack>
    </Popover>

    <Dialog fullWidth maxWidth="xs" onClose={() => setStatusTarget(null)} open={statusTarget !== null}><DialogTitle>{statusTarget?.isActive ? "Deactivate product?" : "Activate product?"}</DialogTitle><DialogContent><Typography color="text.secondary">{statusTarget?.isActive && statusTarget.hasVariations ? "All variations will also be deactivated. Historical purchasing and sales records remain unchanged." : statusTarget?.isActive ? "This product will no longer be available for new operations. Historical records remain unchanged." : "This product will become available for authorized operations."}</Typography></DialogContent><DialogActions><Button color="inherit" onClick={() => setStatusTarget(null)}>Cancel</Button><Button color={statusTarget?.isActive ? "error" : "primary"} onClick={() => void confirmStatus()} variant="contained">Confirm</Button></DialogActions></Dialog>
  </>;
}
