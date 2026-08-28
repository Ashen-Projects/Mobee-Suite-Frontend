import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DoNotDisturbOnOutlinedIcon from "@mui/icons-material/DoNotDisturbOnOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import { Box, Button, Card, Checkbox, Chip, Divider, FormControlLabel, IconButton, MenuItem, Stack, SwipeableDrawer, Switch, Tab, Tabs, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "react-toastify";
import { createProduct, updateProduct, updateProductStatus, type ProductAttribute, type ProductCategory, type ProductDetail, type ProductImageInput, type ProductInput, type ProductListItem } from "../../redux/slices/productRedux/productRedux";

type ProductKind = "simple" | "variable" | "variation";
type FormImage = ProductImageInput & { clientId: string };
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
};

const emptyImages = (): FormImage[] => [];

type VariationDraft = { lowestSellingPrice: string; maxPurchasingPrice: string; mrpPrice: string; optionIds: number[]; sku: string };

export default function ProductFormDialog({ attributes, categories, initialParentId = null, onClose, onCreateVariation, onSaved, open, parents, product }: Props) {
  const [tab, setTab] = useState(0);
  const [kind, setKind] = useState<ProductKind>("simple");
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">("");
  const [parentId, setParentId] = useState<number | "">("");
  const [lowestSellingPrice, setLowestSellingPrice] = useState("");
  const [mrpPrice, setMrpPrice] = useState("");
  const [maxPurchasingPrice, setMaxPurchasingPrice] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(0);
  const [isAvailableOnWeb, setIsAvailableOnWeb] = useState(false);
  const [iconUrl, setIconUrl] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [images, setImages] = useState<FormImage[]>(emptyImages);
  const [optionByAttribute, setOptionByAttribute] = useState<Record<number, number | "">>({});
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [keywords, setKeywords] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [variationDrafts, setVariationDrafts] = useState<Record<number, VariationDraft>>({});

  useEffect(() => {
    if (!open) return;
    setTab(product?.hasVariations ? 0 : 1);
    const nextKind: ProductKind = product?.parentId || (!product && initialParentId) ? "variation" : product?.hasVariations ? "variable" : "simple";
    setKind(nextKind);
    setName(product?.name ?? "");
    setSku(product?.sku ?? "");
    setCategoryId(product?.category?.id ?? "");
    setParentId(product?.parentId ?? initialParentId ?? "");
    setLowestSellingPrice(product?.lowestSellingPrice ?? "");
    setMrpPrice(product?.mrpPrice ?? "");
    setMaxPurchasingPrice(product?.maxPurchasingPrice ?? "");
    setShortDescription(product?.shortDescription ?? "");
    setDescription(product?.description ?? "");
    setPriority(product?.priority ?? 0);
    setIsAvailableOnWeb(product?.isAvailableOnWeb ?? false);
    setIsActive(product?.isActive ?? true);
    setIconUrl(product?.iconUrl ?? "");
    setLogoUrl(product?.logoUrl ?? "");
    setImages(product?.images.map(({ altText, id, isPrimary, priority: imagePriority, url }) => ({ altText, clientId: String(id), isPrimary, priority: imagePriority, url })) ?? emptyImages());
    setOptionByAttribute(Object.fromEntries(product?.options.map(({ attributeId, optionId }) => [attributeId, optionId]) ?? []));
    setMetaTitle(product?.seo?.metaTitle ?? "");
    setMetaDescription(product?.seo?.metaDescription ?? "");
    setKeywords(product?.seo?.keywords ?? "");
    setCanonicalUrl(product?.seo?.canonicalUrl ?? "");
    setOgImageUrl(product?.seo?.ogImageUrl ?? "");
    setVariationDrafts(Object.fromEntries((product?.variations ?? []).map((variation) => [variation.id, {
      lowestSellingPrice: variation.lowestSellingPrice,
      maxPurchasingPrice: variation.maxPurchasingPrice,
      mrpPrice: variation.mrpPrice,
      optionIds: variation.options.map(({ optionId }) => optionId),
      sku: variation.sku ?? "",
    }])));
  }, [initialParentId, open, product]);

  const selectedParent = useMemo(() => parents.find(({ id }) => id === parentId) ?? null, [parentId, parents]);
  const activeAttributes = useMemo(() => attributes.filter(({ isActive }) => isActive), [attributes]);
  const categoryOptions = useMemo(() => categories.filter(({ isActive }) => isActive), [categories]);
  const selectedCategory = useMemo(() => categories.find(({ id }) => id === (kind === "variation" ? selectedParent?.category?.id : categoryId)) ?? null, [categories, categoryId, kind, selectedParent]);
  const applicableAttributes = useMemo(() => activeAttributes.filter(({ id }) => selectedCategory?.inheritedRequiredAttributeIds.includes(id)), [activeAttributes, selectedCategory]);
  const variationAttributes = useMemo(() => {
    const attributeIds = new Set((product?.variations ?? []).flatMap(({ options }) => options.map(({ attributeId }) => attributeId)));
    return activeAttributes.filter(({ id }) => attributeIds.has(id));
  }, [activeAttributes, product?.variations]);
  const variationGridColumns = useMemo(() => `minmax(220px, 1.4fr) repeat(3, minmax(170px, 1fr)) minmax(180px, 1.05fr) ${variationAttributes.map(() => "minmax(170px, .95fr)").join(" ")} 72px`, [variationAttributes]);

  const setPrimaryImage = (index: number) => setImages((current) => current.map((image, imageIndex) => ({ ...image, isPrimary: imageIndex === index })));
  const updateImage = (index: number, values: Partial<ProductImageInput>) => setImages((current) => current.map((image, imageIndex) => imageIndex === index ? { ...image, ...values } : image));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const effectiveCategoryId = kind === "variation" ? selectedParent?.category?.id ?? null : categoryId || null;
    const optionIds = kind === "variable" ? [] : Object.values(optionByAttribute).filter((id): id is number => typeof id === "number");
    const requiresOwnPrices = kind !== "variable";
    if (!name.trim() || !effectiveCategoryId || (requiresOwnPrices && (!lowestSellingPrice || !mrpPrice || !maxPurchasingPrice))) {
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
    if (!images.some(({ url, isPrimary }) => url.trim() && isPrimary)) {
      toast.error("Add at least one image and select its Primary checkbox.");
      return;
    }
    const seoEnabled = [metaTitle, metaDescription, keywords, canonicalUrl, ogImageUrl].some((value) => value.trim());
    const input: ProductInput = {
      categoryId: effectiveCategoryId,
      description: description.trim() || null,
      hasVariations: kind === "variable",
      iconUrl: iconUrl.trim() || null,
      images: images.filter(({ url }) => url.trim()).map((image) => ({ altText: image.altText?.trim() || null, isPrimary: image.isPrimary, priority: image.priority, url: image.url.trim() })),
      isActive,
      isAvailableOnWeb,
      logoUrl: logoUrl.trim() || null,
      lowestSellingPrice: kind === "variable" ? 0 : Number(lowestSellingPrice),
      maxPurchasingPrice: kind === "variable" ? 0 : Number(maxPurchasingPrice),
      mrpPrice: kind === "variable" ? 0 : Number(mrpPrice),
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
          maxPurchasingPrice: input.maxPurchasingPrice,
          mrpPrice: input.mrpPrice,
          name: input.name,
          optionIds: input.optionIds,
          priority: input.priority,
          seo: input.seo,
          shortDescription: input.shortDescription,
          sku: input.sku,
        };
        await updateProduct(product.id, updateInput);
        if (isActive !== product.isActive) await updateProductStatus(product.id, isActive);
        if (product.hasVariations) {
          await Promise.all(product.variations.map((variation) => {
            const draft = variationDrafts[variation.id];
            if (!draft) return Promise.resolve(variation);
            return updateProduct(variation.id, {
              lowestSellingPrice: Number(draft.lowestSellingPrice),
              maxPurchasingPrice: Number(draft.maxPurchasingPrice),
              mrpPrice: Number(draft.mrpPrice),
              optionIds: draft.optionIds,
              sku: draft.sku.trim() || null,
            });
          }));
        }
      } else await createProduct(input);
      toast.success(`Product ${product ? "updated" : "created"} successfully.`);
      await onSaved();
      onClose();
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

  return <SwipeableDrawer
    anchor="bottom"
    disableSwipeToOpen
    onClose={() => !saving && onClose()}
    onOpen={() => undefined}
    open={open}
    PaperProps={{
      component: "form",
      onSubmit: submit,
      sx: {
        borderRadius: { xs: "18px 18px 0 0", md: "22px 22px 0 0" },
        height: { xs: "100dvh", sm: "88dvh" },
        left: { md: "2.5%" },
        maxHeight: { xs: "100dvh", sm: "88dvh" },
        mx: "auto",
        overflow: "hidden",
        right: { md: "2.5%" },
        width: { xs: "100%", md: "95%" },
      },
    }}
  >
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <Box sx={{ display: "flex", justifyContent: "center", pt: 1 }}><Box sx={{ bgcolor: "divider", borderRadius: 4, height: 4, width: 44 }} /></Box>
      <Stack alignItems="center" direction="row" justifyContent="space-between" gap={2} px={{ xs: 2, md: 3 }} py={1.5}>
        <Box minWidth={0}><Typography noWrap variant="h5">{product?.name || (initialParentId ? "Create Variation" : "Create Product")}</Typography><Typography color="text.secondary" variant="body2">Product information, images, attributes, and variations save together.</Typography></Box>
        <Stack alignItems="center" direction="row" gap={1}>
          <FormControlLabel control={<Switch checked={isActive} disabled={saving} onChange={(event) => setIsActive(event.target.checked)} />} label={isActive ? "Active" : "Inactive"} sx={{ display: { xs: "none", sm: "flex" }, mr: 0.5 }} />
          <Button disabled={saving} startIcon={<SaveRoundedIcon />} type="submit" variant="contained">{saving ? "Saving…" : product ? "Save" : "Create"}</Button>
          <IconButton aria-label="Close product editor" disabled={saving} onClick={onClose}><CloseRoundedIcon /></IconButton>
        </Stack>
      </Stack>
      <Divider />
      <Box px={{ xs: 2, md: 3 }} pt={1.5}>
        <Tabs onChange={(_event, value) => setTab(value)} value={tab} variant="scrollable" scrollButtons="auto" sx={{ border: 1, borderColor: "divider", borderRadius: 2, minHeight: 46, px: 1, "& .MuiTab-root": { minHeight: 44, textTransform: "none", fontWeight: 700 } }}>
          <Tab label="Variations" disabled={kind === "simple"} /><Tab label="Product Info" />{product ? <Tab label="Price History" disabled /> : null}
        </Tabs>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", overscrollBehavior: "contain", p: { xs: 2, md: 3 } }}>
      {tab === 1 ? <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 360px" } }}>
      <Card sx={panelSx}><Stack spacing={2.5}>
        <Box><Typography fontWeight={700} variant="h6">Product Information</Typography><Typography color="text.secondary" variant="body2">Add the main details customers and staff use most.</Typography></Box>
        <Stack spacing={2}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
        <TextField disabled={Boolean(product)} label="Product type" onChange={(event) => { setKind(event.target.value as ProductKind); setParentId(""); setOptionByAttribute({}); }} select value={kind}><MenuItem value="simple">Simple product</MenuItem><MenuItem value="variable">Parent product with variations</MenuItem><MenuItem value="variation">Product variation</MenuItem></TextField>
        {kind === "variation" ? <TextField disabled={Boolean(product)} label="Parent product" onChange={(event) => setParentId(Number(event.target.value))} required select value={parentId}><MenuItem value="">Select parent</MenuItem>{parents.filter(({ isActive }) => isActive).map((parent) => <MenuItem key={parent.id} value={parent.id}>{parent.name}</MenuItem>)}</TextField> : null}
        </Box>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}><TextField autoFocus label="Name" onChange={(event) => setName(event.target.value)} required value={name} /><TextField disabled={kind === "variation"} helperText={kind === "variation" ? `Inherited from ${selectedParent?.name ?? "parent product"}` : undefined} label="Select Category" onChange={(event) => { setCategoryId(Number(event.target.value)); setOptionByAttribute({}); }} required select value={kind === "variation" ? selectedParent?.category?.id ?? "" : categoryId}><MenuItem value="">Select category</MenuItem>{categoryOptions.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}</TextField></Box>
        <TextField label="Short Description" onChange={(event) => setShortDescription(event.target.value)} value={shortDescription} />
        {kind !== "variable" ? <><Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}><TextField label="Lowest Selling Price" onChange={(event) => setLowestSellingPrice(event.target.value)} required slotProps={{ htmlInput: { min: 0, step: "0.01" } }} type="number" value={lowestSellingPrice} /><TextField label="Maximum Purchasing Price" onChange={(event) => setMaxPurchasingPrice(event.target.value)} required slotProps={{ htmlInput: { min: 0, step: "0.01" } }} type="number" value={maxPurchasingPrice} /></Box>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}><TextField label="MRP Price" onChange={(event) => setMrpPrice(event.target.value)} required slotProps={{ htmlInput: { min: 0, step: "0.01" } }} type="number" value={mrpPrice} /><TextField helperText="Optional catalog code" label="Product Code / SKU" onChange={(event) => setSku(event.target.value.toUpperCase())} value={sku} /></Box></> : <Box sx={{ bgcolor: "action.hover", border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}><Typography fontWeight={700} variant="body2">Prices are managed by child products</Typography><Typography color="text.secondary" mt={0.5} variant="caption">This parent groups its variations and does not have an independent selling, purchasing, or MRP price.</Typography></Box>}
        {kind !== "variable" && selectedCategory ? <Box><Typography fontWeight={700} mb={0.5} variant="body2">Required product attributes</Typography><Typography color="text.secondary" mb={1.5} variant="caption">These fields come from the selected category and its parent categories.</Typography>{applicableAttributes.length ? <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>{applicableAttributes.map((attribute) => <TextField key={attribute.id} label={attribute.displayName} onChange={(event) => setOptionByAttribute((current) => ({ ...current, [attribute.id]: Number(event.target.value) || "" }))} required select value={optionByAttribute[attribute.id] ?? ""}><MenuItem value="">Select {attribute.displayName}</MenuItem>{attribute.options.filter(({ isActive }) => isActive).map((option) => <MenuItem key={option.id} value={option.id}>{attribute.preUnit ?? ""}{option.label}{attribute.postUnit ?? ""}</MenuItem>)}</TextField>)}</Box> : <Typography color="text.secondary" variant="body2">This category has no required attributes.</Typography>}</Box> : null}
        <TextField label="Product Description" minRows={9} multiline onChange={(event) => setDescription(event.target.value)} placeholder="Type product description here." value={description} />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}><TextField fullWidth label="Display priority" onChange={(event) => setPriority(Math.max(0, Number(event.target.value)))} slotProps={{ htmlInput: { min: 0 } }} type="number" value={priority} /><FormControlLabel control={<Switch checked={isAvailableOnWeb} onChange={(event) => setIsAvailableOnWeb(event.target.checked)} />} label="Available on website" /></Stack>
        </Stack>
      </Stack></Card>
      <Card sx={{ ...panelSx, alignSelf: "start", position: { lg: "sticky" }, top: 0 }}><Stack spacing={2}><Box><Typography fontWeight={700} variant="h6">Image Gallery</Typography><Typography color="text.secondary" variant="body2">Upload and manage the product photos.</Typography></Box><Stack alignItems="center" direction="row" justifyContent="space-between"><Typography fontWeight={700} variant="h6">Product Images</Typography><Button onClick={() => setImages((current) => [...current, { altText: null, clientId: crypto.randomUUID(), isPrimary: current.length === 0, priority: current.length, url: "" }])} startIcon={<AddPhotoAlternateOutlinedIcon />} variant="contained">New</Button></Stack>{images.map((image, index) => <CardImageRow image={image} index={index} key={image.clientId} onDelete={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))} onPrimary={() => setPrimaryImage(index)} onUpdate={(values) => updateImage(index, values)} />)}{!images.length ? <Box sx={{ alignItems: "center", border: 1, borderColor: "divider", borderRadius: 2, borderStyle: "dashed", display: "flex", justifyContent: "center", minHeight: 210, p: 3, textAlign: "center" }}><Typography color="text.secondary" variant="body2">No images uploaded yet.<br />Add an image URL with the New button.</Typography></Box> : null}</Stack></Card>
      </Box> : null}

      {tab === 0 ? <Card sx={{ ...panelSx, p: { xs: 1.5, md: 2 } }}><Stack spacing={2}>
        <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5}><Box><Typography fontWeight={700} variant="h6">Variation Prices</Typography><Typography color="text.secondary" variant="body2">Manage child product prices and discontinued rows.</Typography></Box>{product ? <Button onClick={() => onCreateVariation?.(product.id)} startIcon={<AddRoundedIcon />} variant="outlined">Add Variation</Button> : null}</Stack>
        {product?.variations?.length ? <Box sx={{ overflowX: "auto" }}><Box sx={{ minWidth: Math.max(1180, 970 + variationAttributes.length * 190) }}>
          <Box sx={{ bgcolor: "action.hover", display: "grid", gap: 2, gridTemplateColumns: variationGridColumns, px: 2, py: 1.5 }}>{["Name", "Lowest Selling Price", "Maximum Purchase Price", "MRP Price", "Product Code", ...variationAttributes.map(({ displayName }) => displayName), "Status"].map((heading) => <Typography color="text.secondary" fontWeight={700} key={heading} variant="body2">{heading}</Typography>)}</Box>
          {product.variations.map((variation) => { const draft = variationDrafts[variation.id]; return <Box key={variation.id} sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", display: "grid", gap: 2, gridTemplateColumns: variationGridColumns, minHeight: 80, px: 2, py: 1.25, "& .MuiInputBase-root": { height: 42 } }}>
            <Box minWidth={0}><Typography fontWeight={700} noWrap>{variation.name}</Typography><Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>{variation.options.map((option) => <Chip color="primary" key={option.optionId} label={option.label} size="small" variant="outlined" />)}</Stack></Box>
            <TextField onChange={(event) => setVariationDrafts((current) => ({ ...current, [variation.id]: { ...current[variation.id], lowestSellingPrice: event.target.value } }))} size="small" type="number" value={draft?.lowestSellingPrice ?? variation.lowestSellingPrice} />
            <TextField onChange={(event) => setVariationDrafts((current) => ({ ...current, [variation.id]: { ...current[variation.id], maxPurchasingPrice: event.target.value } }))} size="small" type="number" value={draft?.maxPurchasingPrice ?? variation.maxPurchasingPrice} />
            <TextField onChange={(event) => setVariationDrafts((current) => ({ ...current, [variation.id]: { ...current[variation.id], mrpPrice: event.target.value } }))} size="small" type="number" value={draft?.mrpPrice ?? variation.mrpPrice} />
            <TextField onChange={(event) => setVariationDrafts((current) => ({ ...current, [variation.id]: { ...current[variation.id], sku: event.target.value.toUpperCase() } }))} size="small" value={draft?.sku ?? variation.sku ?? ""} />
            {variationAttributes.map((attribute) => { const selectedOption = variation.options.find(({ attributeId }) => attributeId === attribute.id); const selectedId = draft?.optionIds.find((optionId) => attribute.options.some(({ id }) => id === optionId)) ?? selectedOption?.optionId ?? ""; return <TextField key={attribute.id} onChange={(event) => { const nextId = Number(event.target.value); setVariationDrafts((current) => { const currentDraft = current[variation.id]; const otherIds = currentDraft.optionIds.filter((optionId) => !attribute.options.some(({ id }) => id === optionId)); return { ...current, [variation.id]: { ...currentDraft, optionIds: [...otherIds, nextId] } }; }); }} select size="small" value={selectedId}><MenuItem value="">Select</MenuItem>{attribute.options.filter(({ isActive }) => isActive).map((option) => <MenuItem key={option.id} value={option.id}>{attribute.preUnit ?? ""}{option.label}{attribute.postUnit ?? ""}</MenuItem>)}</TextField>; })}
            <IconButton aria-label={variation.isActive ? "Deactivate variation" : "Activate variation"} color={variation.isActive ? "error" : "success"} onClick={async () => { try { await updateProductStatus(variation.id, !variation.isActive); await onSaved(); toast.success(`Variation ${variation.isActive ? "deactivated" : "activated"}.`); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update variation status."); } }}><DoNotDisturbOnOutlinedIcon /></IconButton>
          </Box>; })}
        </Box></Box> : <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, borderStyle: "dashed", p: 5, textAlign: "center" }}><Typography fontWeight={700}>No variations yet</Typography><Typography color="text.secondary" variant="body2">Create the parent product first, then add each sellable variation.</Typography></Box>}
      </Stack></Card> : null}

      </Box>
    </Box>
  </SwipeableDrawer>;
}

function CardImageRow({ image, index, onDelete, onPrimary, onUpdate }: { image: ProductImageInput; index: number; onDelete: () => void; onPrimary: () => void; onUpdate: (values: Partial<ProductImageInput>) => void }) {
  return <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5 }}><Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} spacing={1.5}>{image.url ? <Box alt={image.altText ?? `Product image ${index + 1}`} component="img" src={image.url} sx={{ bgcolor: (theme) => alpha(theme.palette.background.default, .6), borderRadius: 1.5, height: 64, objectFit: "cover", width: 64 }} /> : null}<TextField fullWidth label={`Image ${index + 1} URL`} onChange={(event) => onUpdate({ url: event.target.value })} value={image.url} /><TextField fullWidth label="Alt text" onChange={(event) => onUpdate({ altText: event.target.value })} value={image.altText ?? ""} /><FormControlLabel control={<Checkbox checked={image.isPrimary} onChange={onPrimary} />} label="Primary" sx={{ flexShrink: 0 }} /><IconButton aria-label={`Remove image ${index + 1}`} color="error" onClick={onDelete}><DeleteOutlineRoundedIcon /></IconButton></Stack></Box>;
}
