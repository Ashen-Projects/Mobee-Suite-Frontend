import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DoNotDisturbOnOutlinedIcon from "@mui/icons-material/DoNotDisturbOnOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { Box, Button, Card, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, IconButton, MenuItem, Stack, SwipeableDrawer, Switch, Tab, Tabs, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import ImagePreviewDialog, { type PreviewableImage } from "../common/ImagePreviewDialog";
import ProductImageUploadDialog, { type ProductFormImage } from "./ProductImageUploadDialog";
import { createProduct, deleteProductImageUpload, updateProduct, updateProductStatus, type ProductAttribute, type ProductCategory, type ProductDetail, type ProductImageInput, type ProductInput, type ProductListItem, type ProductStockLevel, type ProductWarrantyType } from "../../redux/slices/productRedux/productRedux";
import { exportBarTenderCsv, printBarcodes } from "../../utils/printBarcodes";
import { flattenProductCategoryTree } from "../../utils/productCategoryTree";

type ProductKind = "simple" | "variable" | "variation";
type Props = {
  attributes: ProductAttribute[];
  categories: ProductCategory[];
  initialParentId?: number | null;
  onClose: () => void;
  onCreateVariation?: (parentId: number) => void;
  onSaved: () => Promise<void>;
  open: boolean;
  parents: ProductListItem[];
  product: ProductDetail | null;
  stockLevelLocations: ProductStockLevel[];
};
type PrintableBarcode = { barcode: string; productName: string | null; productSku: string | null };

const emptyImages = (): ProductFormImage[] => [];

type VariationDraft = { lowestSellingPrice: string; mrpPrice: string; optionIds: number[]; sku: string };
const WARRANTY_TYPES: Array<{ label: string; value: ProductWarrantyType }> = [
  { label: "Manufacturer warranty", value: "manufacturer" },
  { label: "Seller warranty", value: "seller" },
  { label: "Service warranty", value: "service" },
  { label: "Extended warranty", value: "extended" },
];

export default function ProductFormDialog({ attributes, categories, initialParentId = null, onClose, onCreateVariation, onSaved, open, parents, product, stockLevelLocations }: Props) {
  const [tab, setTab] = useState(0);
  const [kind, setKind] = useState<ProductKind>("simple");
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [parentId, setParentId] = useState<number | "">("");
  const [lowestSellingPrice, setLowestSellingPrice] = useState("");
  const [mrpPrice, setMrpPrice] = useState("");
  const [warrantyPeriodMonths, setWarrantyPeriodMonths] = useState("0");
  const [warrantyType, setWarrantyType] = useState<ProductWarrantyType | "">("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(0);
  const [isAvailableOnWeb, setIsAvailableOnWeb] = useState(false);
  const [iconUrl, setIconUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [images, setImages] = useState<ProductFormImage[]>(emptyImages);
  const [optionByAttribute, setOptionByAttribute] = useState<Record<number, number | "">>({});
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [variationDrafts, setVariationDrafts] = useState<Record<number, VariationDraft>>({});
  const [createdBarcode, setCreatedBarcode] = useState<PrintableBarcode | null>(null);
  const [minimumStockByLocation, setMinimumStockByLocation] = useState<Record<number, string>>({});
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<PreviewableImage | null>(null);
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    isClosingRef.current = false;
    setImageDialogOpen(false);
    setPreviewImage(null);
    setTab(product?.hasVariations ? 0 : 1);
    const nextKind: ProductKind = product?.parentId || (!product && initialParentId) ? "variation" : product?.hasVariations ? "variable" : "simple";
    setKind(nextKind);
    setName(product?.name ?? "");
    setSku(product?.sku ?? "");
    setCategoryId(product?.category?.id ?? "");
    setParentId(product?.parentId ?? initialParentId ?? "");
    setLowestSellingPrice(product?.lowestSellingPrice ?? "");
    setMrpPrice(product?.mrpPrice ?? "");
    setWarrantyPeriodMonths(String(product?.warrantyPeriodMonths ?? 0));
    setWarrantyType(product?.warrantyType ?? "");
    setShortDescription(product?.shortDescription ?? "");
    setDescription(product?.description ?? "");
    setPriority(product?.priority ?? 0);
    setIsAvailableOnWeb(product?.isAvailableOnWeb ?? false);
    setIsActive(product?.isActive ?? true);
    setIconUrl(product?.iconUrl ?? "");
    setLogoUrl(product?.logoUrl ?? "");
    setImages(product?.images.map(({ altText, cloudinaryPublicId, id, isPrimary, priority: imagePriority, url }) => ({ altText, clientId: String(id), cloudinaryPublicId: cloudinaryPublicId ?? null, isPersisted: true, isPrimary, priority: imagePriority, url })) ?? emptyImages());
    setOptionByAttribute(Object.fromEntries(product?.options.map(({ attributeId, optionId }) => [attributeId, optionId]) ?? []));
    setMetaTitle(product?.seo?.metaTitle ?? "");
    setMetaDescription(product?.seo?.metaDescription ?? "");
    setKeywords(product?.seo?.keywords ?? "");
    setCanonicalUrl(product?.seo?.canonicalUrl ?? "");
    setOgImageUrl(product?.seo?.ogImageUrl ?? "");
    setVariationDrafts(Object.fromEntries((product?.variations ?? []).map((variation) => [variation.id, {
      lowestSellingPrice: variation.lowestSellingPrice,
      mrpPrice: variation.mrpPrice,
      optionIds: variation.options.map(({ optionId }) => optionId),
      sku: variation.sku ?? "",
    }])));
    const savedLevels = new Map(product?.stockLevels.map((level) => [level.locationId, level.minimumStockLevel]) ?? []);
    setMinimumStockByLocation(Object.fromEntries(stockLevelLocations.map(({ locationId }) => [locationId, String(savedLevels.get(locationId) ?? 0)])));
  }, [initialParentId, open, product, stockLevelLocations]);

  const selectedParent = useMemo(() => parents.find(({ id }) => id === parentId) ?? null, [parentId, parents]);
  const activeAttributes = useMemo(() => attributes.filter(({ isActive }) => isActive), [attributes]);
  const categoryOptions = useMemo(() => flattenProductCategoryTree(categories.filter(({ isActive }) => isActive)), [categories]);
  const selectedCategory = useMemo(() => categories.find(({ id }) => id === (kind === "variation" ? selectedParent?.category?.id : categoryId)) ?? null, [categories, categoryId, kind, selectedParent]);
  const selectedCategoryPath = useMemo(() => categoryOptions.find(({ category }) => category.id === selectedCategory?.id)?.path ?? null, [categoryOptions, selectedCategory?.id]);
  const applicableAttributes = useMemo(() => activeAttributes.filter(({ id }) => selectedCategory?.inheritedRequiredAttributeIds.includes(id)), [activeAttributes, selectedCategory]);
  const variationAttributes = useMemo(() => {
    const attributeIds = new Set((product?.variations ?? []).flatMap(({ options }) => options.map(({ attributeId }) => attributeId)));
    return activeAttributes.filter(({ id }) => attributeIds.has(id));
  }, [activeAttributes, product?.variations]);
  const variationGridColumns = useMemo(() => `minmax(220px, 1.4fr) repeat(2, minmax(170px, 1fr)) minmax(180px, 1.05fr) ${variationAttributes.map(() => "minmax(170px, .95fr)").join(" ")} 72px`, [variationAttributes]);

  const setPrimaryImage = (index: number) => setImages((current) => current.map((image, imageIndex) => ({ ...image, isPrimary: imageIndex === index })));
  const updateImage = (index: number, values: Partial<ProductImageInput>) => setImages((current) => current.map((image, imageIndex) => imageIndex === index ? { ...image, ...values } : image));
  const removeImage = async (index: number) => {
    const image = images[index];
    if (!image || image.uploading) return;
    setImages((current) => {
      const remaining = current.filter((_, imageIndex) => imageIndex !== index);
      const hasPrimary = remaining.some(({ isPrimary }) => isPrimary);
      return remaining.map((item, imageIndex) => ({ ...item, isPrimary: hasPrimary ? item.isPrimary : imageIndex === 0, priority: imageIndex }));
    });
    if (!image.isPersisted && image.cloudinaryPublicId) {
      try { await deleteProductImageUpload(image.cloudinaryPublicId); }
      catch { toast.warning("The temporary image was removed from this product, but could not be cleaned up from Cloudinary."); }
    }
  };

  const closeEditor = () => {
    isClosingRef.current = true;
    setImageDialogOpen(false);
    const transientPublicIds = images.filter(({ cloudinaryPublicId, isPersisted }) => !isPersisted && cloudinaryPublicId).map(({ cloudinaryPublicId }) => cloudinaryPublicId as string);
    void Promise.all(transientPublicIds.map((publicId) => deleteProductImageUpload(publicId).catch(() => undefined)));
    onClose();
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const effectiveCategoryId = kind === "variation" ? selectedParent?.category?.id ?? null : categoryId || null;
    const optionIds = kind === "variable" ? [] : Object.values(optionByAttribute).filter((id): id is number => typeof id === "number");
    const warrantyMonths = Number(warrantyPeriodMonths || 0);
    if (!name.trim() || !effectiveCategoryId) {
      toast.error("Complete all required product fields.");
      return;
    }
    if (kind === "variation" && !parentId) {
      toast.error("Select a parent product.");
      return;
    }
    if (kind !== "variable" && applicableAttributes.some(({ id }) => typeof optionByAttribute[id] !== "number")) {
      toast.error("Select every attribute required by the product category.");
      return;
    }
    if (!Number.isInteger(warrantyMonths) || warrantyMonths < 0 || warrantyMonths > 120) {
      toast.error("Warranty period must be between 0 and 120 whole months.");
      return;
    }
    if ((warrantyMonths > 0 && !warrantyType) || (warrantyMonths === 0 && warrantyType)) {
      toast.error("Set both the warranty type and warranty period, or turn warranty off.");
      return;
    }
    const productImages = images.filter(({ url }) => url.trim());
    if (productImages.length > 0 && !productImages.some(({ isPrimary }) => isPrimary)) {
      toast.error("Select a Primary image when you add product images.");
      return;
    }
    const seoEnabled = [metaTitle, metaDescription, keywords, canonicalUrl, ogImageUrl].some((value) => value.trim());
    const input: ProductInput = {
      categoryId: effectiveCategoryId,
      description: description.trim() || null,
      hasVariations: kind === "variable",
      iconUrl: iconUrl.trim() || null,
      images: productImages.map((image) => ({ altText: image.altText?.trim() || null, cloudinaryPublicId: image.cloudinaryPublicId ?? null, isPrimary: image.isPrimary, priority: image.priority, url: image.url.trim() })),
      isActive,
      isAvailableOnWeb,
      logoUrl: logoUrl.trim() || null,
      lowestSellingPrice: kind === "variable" ? 0 : Number(lowestSellingPrice || 0),
      mrpPrice: kind === "variable" ? 0 : Number(mrpPrice || 0),
      name: name.trim(),
      optionIds,
      parentId: kind === "variation" ? Number(parentId) : null,
      priority,
      seo: seoEnabled ? {
        canonicalUrl: canonicalUrl.trim() || null,
        keywords: keywords.trim() || null,
        metaDescription: metaDescription.trim() || null,
        metaTitle: metaTitle.trim() || null,
        ogImageUrl: ogImageUrl.trim() || null,
      } : null,
      shortDescription: shortDescription.trim() || null,
      sku: sku.trim() || null,
      stockLevels: kind === "variable" ? [] : stockLevelLocations.map(({ locationId }) => ({
        locationId,
        minimumStockLevel: Math.max(0, Math.floor(Number(minimumStockByLocation[locationId] || 0))),
      })),
      warrantyPeriodMonths: warrantyMonths,
      warrantyType: warrantyType || null,
    };
    setSaving(true);
    try {
      if (product) {
        const updateInput = {
          categoryId: input.categoryId,
          description: input.description,
          iconUrl: input.iconUrl,
          images: input.images,
          isAvailableOnWeb: input.isAvailableOnWeb,
          logoUrl: input.logoUrl,
          lowestSellingPrice: input.lowestSellingPrice,
          mrpPrice: input.mrpPrice,
          name: input.name,
          optionIds: input.optionIds,
          priority: input.priority,
          seo: input.seo,
          shortDescription: input.shortDescription,
          sku: input.sku,
          stockLevels: input.stockLevels,
          warrantyPeriodMonths: input.warrantyPeriodMonths,
          warrantyType: input.warrantyType,
        };
        await updateProduct(product.id, updateInput);
        if (isActive !== product.isActive) await updateProductStatus(product.id, isActive);
        if (product.hasVariations) {
          await Promise.all(product.variations.map((variation) => {
            const draft = variationDrafts[variation.id];
            if (!draft) return Promise.resolve(variation);
            return updateProduct(variation.id, {
              lowestSellingPrice: Number(draft.lowestSellingPrice),
              mrpPrice: Number(draft.mrpPrice),
              optionIds: draft.optionIds,
              sku: draft.sku.trim() || null,
            });
          }));
        }
      } else {
        const created = await createProduct(input);
        setCreatedBarcode({ barcode: created.sku || `PRODUCT-${created.id}`, productName: created.name, productSku: created.sku });
      }
      toast.success(`Product ${product ? "updated" : "created"} successfully.`);
      await onSaved();
      if (product) onClose();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to save product."); }
    finally { setSaving(false); }
  };

  const panelSx = {
    border: 1,
    borderColor: "divider",
    borderRadius: 2.5,
    boxShadow: "none",
    p: { xs: 2, md: 2.5 },
  } as const;

  const testBarcodeItems = createdBarcode ? [createdBarcode] : [];
  const closeAfterTestBarcode = () => { setCreatedBarcode(null); onClose(); };
  const printTestBarcode = () => { try { printBarcodes(testBarcodeItems); closeAfterTestBarcode(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to print barcode."); } };
  const exportTestBarcode = () => { try { exportBarTenderCsv(testBarcodeItems); closeAfterTestBarcode(); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to export barcode."); } };

  return <>
  <SwipeableDrawer
    anchor="bottom"
    disableSwipeToOpen
    onClose={() => !saving && closeEditor()}
    onOpen={() => undefined}
    open={open}
    PaperProps={{
      component: "form",
      onSubmit: submit,
      sx: {
        borderRadius: { xs: "18px 18px 0 0", md: "20px 20px 0 0" },
        height: { xs: "100dvh", sm: "90dvh" },
        left: 0,
        maxHeight: { xs: "100dvh", sm: "90dvh" },
        maxWidth: 1440,
        mx: "auto",
        overflow: "hidden",
        right: 0,
        width: { xs: "100%", md: "94vw" },
      },
    }}
  >
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}><Box sx={{ bgcolor: "divider", borderRadius: 4, height: 4, width: 44 }} /></Box>
      <Stack alignItems="center" direction="row" justifyContent="space-between" gap={2} px={{ xs: 2, md: 3 }} py={{ xs: 1.25, md: 1.5 }}>
        <Box minWidth={0}><Typography noWrap variant="h6">{product?.name || (initialParentId ? "Create Variation" : "Create Product")}</Typography><Typography color="text.secondary" variant="caption">Keep product details, images, attributes, and variations in one place.</Typography></Box>
        <Stack alignItems="center" direction="row" gap={1}>
          <FormControlLabel control={<Switch checked={isActive} disabled={saving} onChange={(event) => setIsActive(event.target.checked)} />} label={isActive ? "Active" : "Inactive"} sx={{ display: { xs: "none", sm: "flex" }, mr: 0.5 }} />
          <Button disabled={saving} size="small" startIcon={<SaveRoundedIcon />} type="submit" variant="contained">{saving ? "Saving…" : product ? "Save changes" : "Create product"}</Button>
          <IconButton aria-label="Close product editor" disabled={saving} onClick={closeEditor}><CloseRoundedIcon /></IconButton>
        </Stack>
      </Stack>
      <Divider />
      <Box px={{ xs: 1.5, md: 2.5 }}>
        <Tabs onChange={(_event, value) => setTab(value)} value={tab} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: 1, borderColor: "divider", minHeight: 44, "& .MuiTab-root": { minHeight: 44, px: { xs: 1.25, sm: 1.75 }, textTransform: "none", fontSize: 13.5, fontWeight: 700 } }}>
          <Tab label="Variations" disabled={kind === "simple"} /><Tab label="Product Info" /><Tab label="Stock Alerts" disabled={kind === "variable"} />{product ? <Tab label="Price History" disabled /> : null}
        </Tabs>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", p: { xs: 1.5, sm: 2, md: 2.5 } }}>
      {tab === 1 ? <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2.5, overflow: "hidden" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 310px" } }}>
          <Stack spacing={2.25} sx={{ minWidth: 0, p: { xs: 1.75, sm: 2.25, md: 2.5 } }}>
            <Box>
              <Typography fontWeight={800} variant="body1">Core details</Typography>
              <Typography color="text.secondary" variant="caption">Choose how the product is sold, then add the information staff need.</Typography>
            </Box>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
              <TextField disabled={Boolean(product)} label="Product type" onChange={(event) => { setKind(event.target.value as ProductKind); setParentId(""); setOptionByAttribute({}); }} select size="small" value={kind}><MenuItem value="simple">Simple product</MenuItem><MenuItem value="variable">Parent product with variations</MenuItem><MenuItem value="variation">Product variation</MenuItem></TextField>
              {kind === "variation" ? <TextField disabled={Boolean(product)} label="Parent product" onChange={(event) => setParentId(Number(event.target.value))} required select size="small" value={parentId}><MenuItem value="">Select parent</MenuItem>{parents.filter(({ isActive }) => isActive).map((parent) => <MenuItem key={parent.id} value={parent.id}>{parent.name}</MenuItem>)}</TextField> : <TextField helperText="Optional catalog code" label="Product code / SKU" onChange={(event) => setSku(event.target.value.toUpperCase())} size="small" value={sku} />}
            </Box>
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
              <TextField autoFocus label="Product name" onChange={(event) => setName(event.target.value)} required size="small" value={name} />
              <TextField
                disabled={kind === "variation"}
                helperText={kind === "variation" ? `Inherited from ${selectedParent?.name ?? "parent product"}` : selectedCategoryPath ? `Selected path: ${selectedCategoryPath}` : "Choose the most specific category."}
                label="Product category"
                onChange={(event) => { setCategoryId(Number(event.target.value)); setOptionByAttribute({}); }}
                required
                select
                size="small"
                value={kind === "variation" ? selectedParent?.category?.id ?? "" : categoryId}
              >
                <MenuItem value="">Select category</MenuItem>
                {categoryOptions.map(({ category, depth, path }) => <MenuItem key={category.id} sx={{ pl: 2 + depth * 3 }} value={category.id}>
                  <Box minWidth={0}><Typography fontSize={13}>{depth ? "↳ " : ""}{category.name}</Typography><Typography color="text.secondary" variant="caption">{path}</Typography></Box>
                </MenuItem>)}
              </TextField>
            </Box>
            <TextField label="Short description" onChange={(event) => setShortDescription(event.target.value)} size="small" value={shortDescription} />

            <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
              {kind === "variable" ? <Box sx={{ borderLeft: 3, borderColor: "primary.main", pl: 1.5 }}><Typography fontWeight={800} variant="body2">Prices are managed by child products</Typography><Typography color="text.secondary" variant="caption">This parent groups its variations and does not have an independent selling price or MRP.</Typography></Box> : <Stack alignItems={{ sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={1} justifyContent="space-between"><Box><Typography fontWeight={800} variant="body2">Pricing is set in Add to Stock</Typography><Typography color="text.secondary" variant="caption">MRP and lowest selling price are controlled after approved stock is received.</Typography></Box>{mrpPrice ? <Chip label={`Current MRP: LKR ${mrpPrice}`} size="small" variant="outlined" /> : null}</Stack>}
            </Box>

            {kind !== "variable" && selectedCategory ? <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}><Typography fontWeight={800} mb={0.25} variant="body2">Required attributes</Typography><Typography color="text.secondary" display="block" mb={1.25} variant="caption">Inherited from the selected category path.</Typography>{applicableAttributes.length ? <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>{applicableAttributes.map((attribute) => <TextField key={attribute.id} label={attribute.displayName} onChange={(event) => setOptionByAttribute((current) => ({ ...current, [attribute.id]: Number(event.target.value) || "" }))} required select size="small" value={optionByAttribute[attribute.id] ?? ""}><MenuItem value="">Select {attribute.displayName}</MenuItem>{attribute.options.filter(({ isActive }) => isActive).map((option) => <MenuItem key={option.id} value={option.id}>{attribute.preUnit ?? ""}{option.label}{attribute.postUnit ?? ""}</MenuItem>)}</TextField>)}</Box> : <Typography color="text.secondary" variant="body2">This category has no required attributes.</Typography>}</Box> : null}

            <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
              <Stack alignItems={{ sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={1} justifyContent="space-between">
                <Box><Typography fontWeight={800} variant="body2">Warranty</Typography><Typography color="text.secondary" variant="caption">Used to verify future warranty claims.</Typography></Box>
                <FormControlLabel control={<Switch checked={Number(warrantyPeriodMonths) > 0} onChange={(event) => { const enabled = event.target.checked; setWarrantyPeriodMonths(enabled ? "12" : "0"); setWarrantyType(enabled ? warrantyType || "manufacturer" : ""); }} />} label={Number(warrantyPeriodMonths) > 0 ? "Included" : "Not included"} sx={{ mr: 0 }} />
              </Stack>
              {Number(warrantyPeriodMonths) > 0 ? <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "minmax(150px, .7fr) minmax(0, 1fr)" }, mt: 1.25 }}>
                <TextField helperText="6 months = 6 · 1 year = 12" inputProps={{ inputMode: "numeric", max: 120, min: 1, pattern: "[0-9]*" }} label="Period (months)" onChange={(event) => setWarrantyPeriodMonths(event.target.value.replace(/[^0-9]/g, ""))} size="small" type="text" value={warrantyPeriodMonths} />
                <TextField label="Warranty type" onChange={(event) => setWarrantyType(event.target.value as ProductWarrantyType)} required select size="small" value={warrantyType}>{WARRANTY_TYPES.map((type) => <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>)}</TextField>
              </Box> : null}
            </Box>

            <Box sx={{ borderTop: 1, borderColor: "divider", pt: 2 }}>
              <TextField label="Product description" maxRows={8} minRows={4} multiline onChange={(event) => setDescription(event.target.value)} placeholder="Add useful product details for staff and customers." size="small" value={description} />
              <Stack alignItems={{ sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={1.5} justifyContent="space-between" mt={1.5}><TextField label="Display priority" onChange={(event) => setPriority(Math.max(0, Number(event.target.value)))} size="small" slotProps={{ htmlInput: { min: 0 } }} sx={{ width: { xs: "100%", sm: 180 } }} type="text" value={priority} /><FormControlLabel control={<Switch checked={isAvailableOnWeb} onChange={(event) => setIsAvailableOnWeb(event.target.checked)} />} label="Available on website" sx={{ mr: 0 }} /></Stack>
            </Box>
          </Stack>

          <Box sx={{ alignSelf: "stretch", borderColor: "divider", borderLeft: { lg: 1 }, borderTop: { xs: 1, lg: 0 }, minWidth: 0, p: { xs: 1.75, sm: 2.25 }, position: { lg: "sticky" }, top: 0 }}>
            <Stack spacing={1.75}>
              <Box>
                <Typography fontWeight={800} variant="body1">Product images</Typography>
                <Typography color="text.secondary" variant="caption">Optional · Upload and preview securely in Cloudinary.</Typography>
              </Box>
              <Stack alignItems="center" direction="row" justifyContent="space-between">
                <Box>
                  <Typography fontWeight={800} variant="body2">{images.length ? `${images.length} image${images.length === 1 ? "" : "s"}` : "No images yet"}</Typography>
                  <Typography color="text.secondary" variant="caption">JPEG, PNG, WebP · Up to 5 MB</Typography>
                </Box>
                <Button onClick={() => setImageDialogOpen(true)} size="small" startIcon={<AddPhotoAlternateOutlinedIcon />} variant="contained">Manage</Button>
              </Stack>
              {images.length ? <Box sx={{ display: "grid", gap: 0.75, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
                {images.slice(0, 6).map((image, index) => image.url ? <Box
                  aria-label={`Preview ${image.altText?.trim() || `product image ${index + 1}`}`}
                  component="button"
                  key={image.clientId}
                  onClick={() => setPreviewImage({ altText: image.altText, fileName: image.altText?.trim() || `Product image ${index + 1}`, url: image.url! })}
                  sx={{ appearance: "none", bgcolor: "transparent", border: 0, cursor: "zoom-in", display: "block", p: 0, "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 }, "&:hover img": { transform: "scale(1.04)" } }}
                  title="Preview image"
                  type="button"
                >
                  <Box alt={image.altText ?? `Product image ${index + 1}`} component="img" src={image.url} sx={{ border: 1, borderColor: image.isPrimary ? "primary.main" : "divider", borderRadius: 1.25, display: "block", height: 72, objectFit: "cover", transition: "transform 160ms ease", width: "100%" }} />
                </Box> : <Box key={image.clientId} sx={{ alignItems: "center", border: 1, borderColor: "divider", borderRadius: 1.25, display: "flex", height: 72, justifyContent: "center" }}><CircularProgress size={18} /></Box>)}
              </Box> : <Box sx={{ alignItems: "center", border: 1, borderColor: "divider", borderRadius: 1.5, borderStyle: "dashed", display: "flex", justifyContent: "center", minHeight: 122, p: 1.5, textAlign: "center" }}><Stack alignItems="center" spacing={0.75}><AddPhotoAlternateOutlinedIcon color="primary" fontSize="small" /><Typography color="text.secondary" variant="caption">Add images now or later.</Typography><Button onClick={() => setImageDialogOpen(true)} size="small" variant="outlined">Choose images</Button></Stack></Box>}
              {images.length ? <Typography color="text.secondary" variant="caption">Select an image to preview it full size.</Typography> : null}
            </Stack>
          </Box>
        </Box>
      </Box> : null}

      {tab === 0 ? <Card sx={{ ...panelSx, p: { xs: 1.5, md: 2 } }}><Stack spacing={2}>
        <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5}><Box><Typography fontWeight={700} variant="h6">Variation Prices</Typography><Typography color="text.secondary" variant="body2">Manage child product prices and discontinued rows.</Typography></Box>{product ? <Button onClick={() => onCreateVariation?.(product.id)} startIcon={<AddRoundedIcon />} variant="outlined">Add Variation</Button> : null}</Stack>
        {product?.variations?.length ? <Box sx={{ overflowX: "auto" }}><Box sx={{ minWidth: Math.max(1180, 970 + variationAttributes.length * 190) }}>
          <Box sx={{ bgcolor: "action.hover", display: "grid", gap: 2, gridTemplateColumns: variationGridColumns, px: 2, py: 1.5 }}>{["Name", "MRP Price", "Lowest Selling Price", "Product Code", ...variationAttributes.map(({ displayName }) => displayName), "Status"].map((heading) => <Typography color="text.secondary" fontWeight={700} key={heading} variant="body2">{heading}</Typography>)}</Box>
          {product.variations.map((variation) => { const draft = variationDrafts[variation.id]; return <Box key={variation.id} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", display: "grid", gap: 2, gridTemplateColumns: variationGridColumns, minHeight: 80, px: 2, py: 1.25, "& .MuiInputBase-root": { height: 42 } }}>
            <Box minWidth={0}><Typography fontWeight={700} noWrap>{variation.name}</Typography><Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>{variation.options.map((option) => <Chip color="primary" key={option.optionId} label={option.label} size="small" variant="outlined" />)}</Stack></Box>
            <TextField disabled helperText="Set at Add to Stock" onChange={(event) => setVariationDrafts((current) => ({ ...current, [variation.id]: { ...current[variation.id], mrpPrice: event.target.value } }))} size="small" type="text" value={draft?.mrpPrice ?? variation.mrpPrice} />
            <TextField disabled helperText="Set at Add to Stock" onChange={(event) => setVariationDrafts((current) => ({ ...current, [variation.id]: { ...current[variation.id], lowestSellingPrice: event.target.value } }))} size="small" type="text" value={draft?.lowestSellingPrice ?? variation.lowestSellingPrice} />
            <TextField onChange={(event) => setVariationDrafts((current) => ({ ...current, [variation.id]: { ...current[variation.id], sku: event.target.value.toUpperCase() } }))} size="small" value={draft?.sku ?? variation.sku ?? ""} />
            {variationAttributes.map((attribute) => { const selectedOption = variation.options.find(({ attributeId }) => attributeId === attribute.id); const selectedId = draft?.optionIds.find((optionId) => attribute.options.some(({ id }) => id === optionId)) ?? selectedOption?.optionId ?? ""; return <TextField key={attribute.id} onChange={(event) => { const nextId = Number(event.target.value); setVariationDrafts((current) => { const currentDraft = current[variation.id]; const otherIds = currentDraft.optionIds.filter((optionId) => !attribute.options.some(({ id }) => id === optionId)); return { ...current, [variation.id]: { ...currentDraft, optionIds: [...otherIds, nextId] } }; }); }} select size="small" value={selectedId}><MenuItem value="">Select</MenuItem>{attribute.options.filter(({ isActive }) => isActive).map((option) => <MenuItem key={option.id} value={option.id}>{attribute.preUnit ?? ""}{option.label}{attribute.postUnit ?? ""}</MenuItem>)}</TextField>; })}
            <IconButton aria-label={variation.isActive ? "Deactivate variation" : "Activate variation"} color={variation.isActive ? "error" : "success"} onClick={async () => { try { await updateProductStatus(variation.id, !variation.isActive); await onSaved(); toast.success(`Variation ${variation.isActive ? "deactivated" : "activated"}.`); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update variation status."); } }}><DoNotDisturbOnOutlinedIcon /></IconButton>
          </Box>; })}
        </Box></Box> : <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, borderStyle: "dashed", p: 5, textAlign: "center" }}><Typography fontWeight={700}>No variations yet</Typography><Typography color="text.secondary" variant="body2">Create the parent product first, then add each sellable variation.</Typography></Box>}
      </Stack></Card> : null}

      {tab === 2 ? <Card sx={{ ...panelSx, maxWidth: 920, mx: "auto" }}><Stack spacing={2.25}>
        <Box><Typography fontWeight={700} variant="h6">Minimum stock alerts</Typography><Typography color="text.secondary" variant="body2">Set the available-unit threshold for each location. The dashboard warns when stock reaches or falls below this level. Use 0 to disable an alert.</Typography></Box>
        <Box sx={{ bgcolor: "action.hover", border: 1, borderColor: "divider", borderRadius: 2, display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 220px" }, p: { xs: 1.5, sm: 2 } }}>
          {stockLevelLocations.map((location) => <Box key={location.locationId} sx={{ alignItems: { sm: "center" }, display: "grid", gap: 1.25, gridColumn: "1 / -1", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 220px" } }}>
            <Box><Typography fontSize={13.5} fontWeight={800}>{location.locationName}</Typography><Typography color="text.secondary" fontSize={11.5}>Alert threshold for this location</Typography></Box>
            <TextField inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }} label="Minimum units" onChange={(event) => setMinimumStockByLocation((current) => ({ ...current, [location.locationId]: event.target.value.replace(/[^0-9]/g, "") }))} size="small" type="text" value={minimumStockByLocation[location.locationId] ?? "0"} />
          </Box>)}
          {!stockLevelLocations.length ? <Typography color="text.secondary" gridColumn="1 / -1" py={3} textAlign="center">No active locations are available.</Typography> : null}
        </Box>
      </Stack></Card> : null}

      </Box>
    </Box>
  </SwipeableDrawer>
  <ProductImageUploadDialog images={images} onChange={setImages} onClose={() => setImageDialogOpen(false)} onDelete={removeImage} onSetPrimary={setPrimaryImage} onUpdate={updateImage} open={imageDialogOpen} />
  <ImagePreviewDialog image={previewImage} onClose={() => setPreviewImage(null)} />
  <Dialog fullWidth maxWidth="sm" open={Boolean(createdBarcode)} onClose={closeAfterTestBarcode}>
    <DialogTitle>Print test barcode?</DialogTitle>
    <DialogContent>
      <Stack spacing={1.5} pt={1}>
        <Typography color="text.secondary" variant="body2">Temporary testing option. This prints a product-level barcode only; real stock barcodes are still created from Add to Stock.</Typography>
        <Typography fontWeight={700}>{createdBarcode?.barcode}</Typography>
      </Stack>
    </DialogContent>
    <DialogActions>
      <Button color="inherit" onClick={closeAfterTestBarcode}>Skip</Button>
      <Button onClick={exportTestBarcode} startIcon={<DownloadRoundedIcon />} variant="outlined">Export BarTender CSV</Button>
      <Button onClick={printTestBarcode} startIcon={<PrintRoundedIcon />} variant="contained">Browser Print</Button>
    </DialogActions>
  </Dialog>
  </>;
}
