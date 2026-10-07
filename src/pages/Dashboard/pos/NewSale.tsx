import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import KeyboardRoundedIcon from "@mui/icons-material/KeyboardRounded";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Autocomplete, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import useAuth from "../../../hooks/useAuth";
import { getCurrentDrawer, type PosDrawer } from "../../../redux/slices/posRedux/drawerRedux";
import { createSale, searchSaleCustomers, searchSaleProducts, type PaymentMethod, type SaleCustomer, type SaleDetail, type SaleProductSearchItem } from "../../../redux/slices/posRedux/saleRedux";
import { PATH_DASHBOARD } from "../../../routes/paths";
import { USER_ROLES } from "../../../utils/constants";
import { fCurrency } from "../../../utils/formatNumber";
import { printSaleReceipt } from "../../../utils/printSaleReceipt";

type CartItem = {
  availableStockIds: number[];
  id: string;
  productId: number;
  productName: string;
  productSku: string | null;
  quantity: number;
  quantityAvailable: number;
  stockIds: number[];
  costPrice: number;
  lowestSellingPrice: number;
  mrpPrice: number;
  unitPrice: number;
  discountAmount: number;
};

type NewCustomerDraft = {
  name: string;
  phone: string;
};

const methods: Array<{ label: string; value: PaymentMethod }> = [
  { label: "Cash", value: "cash" },
  { label: "Card", value: "card" },
  { label: "Bank Transfer", value: "bankTransfer" },
];

const toAmount = (value: string) => Number(value.replace(/[^\d.]/g, "")) || 0;
const looksLikePhone = (value: string) => /^[+\d\s-]{6,}$/.test(value.trim());
const maxLineDiscount = (item: Pick<CartItem, "lowestSellingPrice" | "quantity" | "unitPrice">) => Math.max(0, item.unitPrice * item.quantity - item.lowestSellingPrice * item.quantity);
const uniqueStockIds = (values: number[]) => Array.from(new Set(values));

export default function NewSale() {
  const navigate = useNavigate();
  const { hasRole, user } = useAuth();
  const isAdministrator = hasRole(USER_ROLES.ADMIN);
  const locationId = user?.defaultLocationId ?? null;
  const productInputRef = useRef<HTMLInputElement | null>(null);
  const productSearchRequestRef = useRef(0);
  const scannerLookupInFlightRef = useRef(false);
  const [drawer, setDrawer] = useState<PosDrawer | null>(null);
  const [drawerLoaded, setDrawerLoaded] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<SaleProductSearchItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState<SaleCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<SaleCustomer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerDraft, setNewCustomerDraft] = useState<NewCustomerDraft | null>(null);
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [saleDiscount, setSaleDiscount] = useState(0);
  const [priceOverrideReason, setPriceOverrideReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [lastSale, setLastSale] = useState<SaleDetail | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCurrentDrawer().then(setDrawer)
      .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to check POS drawer."))
      .finally(() => setDrawerLoaded(true));
  }, []);

  useEffect(() => {
    const search = productSearch.trim();
    const requestId = ++productSearchRequestRef.current;
    if (!search || !locationId) { setProductOptions([]); return; }
    const timer = window.setTimeout(() => {
      searchSaleProducts({ locationId, search }).then((results) => {
        if (productSearchRequestRef.current === requestId) setProductOptions(results);
      }).catch((error) => {
        if (productSearchRequestRef.current === requestId) toast.error(error instanceof Error ? error.message : "Unable to search products.");
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [locationId, productSearch]);

  useEffect(() => {
    const search = customerSearch.trim();
    if (!search) { setCustomerOptions([]); return; }
    const timer = window.setTimeout(() => {
      searchSaleCustomers(search).then(setCustomerOptions)
        .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to search customers."));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [customerSearch]);

  const subTotal = useMemo(() => items.reduce((total, item) => total + item.unitPrice * item.quantity, 0), [items]);
  const itemDiscount = useMemo(() => items.reduce((total, item) => total + item.discountAmount, 0), [items]);
  const minimumSaleTotal = useMemo(() => items.reduce((sum, item) => sum + item.lowestSellingPrice * item.quantity, 0), [items]);
  const maxSaleDiscount = isAdministrator
    ? Math.max(0, subTotal - itemDiscount)
    : Math.max(0, subTotal - itemDiscount - minimumSaleTotal);
  const total = Math.max(0, subTotal - itemDiscount - saleDiscount);
  const needsPriceOverride = useMemo(() => (
    items.some((item) => (
      item.unitPrice > item.mrpPrice
      || item.unitPrice * item.quantity - item.discountAmount < item.lowestSellingPrice * item.quantity
    ))
    || total < minimumSaleTotal
  ), [items, minimumSaleTotal, total]);

  const addProduct = (product: SaleProductSearchItem | null) => {
    if (!product) return;
    const availableStockIds = uniqueStockIds(product.stockIds.length ? product.stockIds : product.stockId ? [product.stockId] : []);
    if (!availableStockIds.length) { toast.error("This product has no available stock units."); return; }
    const mrpPrice = Number(product.mrpPrice);
    const lowestSellingPrice = Number(product.sellingPrice);
    const costPrice = Number(product.costPrice);
    const existing = items.find((item) => item.productId === product.productId && item.unitPrice === mrpPrice);
    if (existing) {
      const nextAvailableStockIds = uniqueStockIds([...existing.availableStockIds, ...availableStockIds]);
      const nextStockId = nextAvailableStockIds.find((stockId) => !existing.stockIds.includes(stockId));
      if (!nextStockId) { toast.error("This exact stock unit is already on the bill."); return; }
      setItems((current) => current.map((item) => item.id === existing.id ? {
        ...item,
        availableStockIds: nextAvailableStockIds,
        quantity: item.quantity + 1,
        quantityAvailable: Math.max(item.quantityAvailable, product.quantityAvailable, nextAvailableStockIds.length),
        stockIds: [...item.stockIds, nextStockId],
      } : item));
    } else {
      setItems((current) => [...current, {
        availableStockIds,
        discountAmount: 0,
        id: `${product.productId}-${Date.now()}`,
        costPrice,
        lowestSellingPrice,
        mrpPrice,
        productId: product.productId,
        productName: product.productName,
        productSku: product.productSku,
        quantity: 1,
        quantityAvailable: product.quantityAvailable,
        stockIds: [availableStockIds[0]],
        unitPrice: mrpPrice,
      }]);
    }
    setProductSearch("");
    setProductOptions([]);
    window.setTimeout(() => productInputRef.current?.focus(), 0);
  };

  const scanAndAddExactProduct = async () => {
    const search = productInputRef.current?.value.trim() || productSearch.trim();
    if (!search || !locationId || scannerLookupInFlightRef.current) return;
    scannerLookupInFlightRef.current = true;
    const requestId = ++productSearchRequestRef.current;
    try {
      const results = await searchSaleProducts({ locationId, search });
      if (productSearchRequestRef.current !== requestId) return;
      const exactUnitMatches = results.filter((product) => product.matchType === "barcode" || product.matchType === "imei" || product.matchType === "serial");
      if (exactUnitMatches.length === 1) {
        addProduct(exactUnitMatches[0]);
        return;
      }
      setProductOptions(results);
      if (!results.length) toast.error("No available stock unit was found for this barcode or identifier.");
    } catch (error) {
      if (productSearchRequestRef.current === requestId) toast.error(error instanceof Error ? error.message : "Unable to scan this product.");
    } finally {
      scannerLookupInFlightRef.current = false;
    }
  };

  const create = async () => {
    if (!locationId) { toast.error("Your account does not have an assigned sale location."); return; }
    if (!drawer) { toast.error("Open your POS drawer before creating a sale."); return; }
    if (!items.length) { toast.error("Add at least one product."); return; }
    if (!isAdministrator && items.some((item) => item.unitPrice * item.quantity - item.discountAmount < item.lowestSellingPrice * item.quantity)) {
      toast.error("Discount cannot reduce a product below its lowest selling price.");
      return;
    }
    if (!isAdministrator && total < items.reduce((sum, item) => sum + item.lowestSellingPrice * item.quantity, 0)) {
      toast.error("Sale discount cannot reduce invoice below lowest selling price.");
      return;
    }
    if (needsPriceOverride && !isAdministrator) {
      toast.error("Only an administrator can sell above MRP or below the lowest selling price.");
      return;
    }
    if (needsPriceOverride && !priceOverrideReason.trim()) {
      toast.error("Enter an override reason for this administrator price exception.");
      return;
    }
    setSaving(true);
    try {
      const draftCustomer = newCustomerDraft
        ? { name: newCustomerDraft.name.trim(), phone: newCustomerDraft.phone.trim() }
        : null;
      if (newCustomerDraft && (!draftCustomer?.name || !draftCustomer.phone)) {
        toast.error("Customer name and phone number are required.");
        setSaving(false);
        return;
      }
      const sale = await createSale({
        customer: selectedCustomer ? { id: selectedCustomer.id } : draftCustomer ?? undefined,
        discountAmount: saleDiscount,
        priceOverrideReason: needsPriceOverride ? priceOverrideReason.trim() : undefined,
        items: items.map((item) => ({
          discountAmount: item.discountAmount,
          productId: item.productId,
          quantity: item.quantity,
          stockIds: item.stockIds.slice(0, item.quantity),
          unitPrice: item.unitPrice,
        })),
        locationId,
        payment: { amount: total, method: paymentMethod, referenceNo: referenceNo.trim() || undefined },
      });
      setLastSale(sale);
      setItems([]);
      setSaleDiscount(0);
      setPriceOverrideReason("");
      setSelectedCustomer(null);
      setCustomerSearch("");
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerDraft(null);
      setQuickCustomerOpen(false);
      setCustomerDialogOpen(false);
      setReferenceNo("");
      toast.success(`Sale ${sale.invoiceNo} completed.`);
      printSaleReceipt(sale);
      window.setTimeout(() => productInputRef.current?.focus(), 250);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create sale.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handleKeys = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        event.preventDefault();
        productInputRef.current?.focus();
      }
      if (event.key === "F4") {
        event.preventDefault();
        if (!saving && items.length) void create();
      }
      if (event.altKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        navigate(PATH_DASHBOARD.pos.root);
      }
    };
    window.addEventListener("keydown", handleKeys);
    return () => window.removeEventListener("keydown", handleKeys);
  }, [items, navigate, saving, total, saleDiscount, paymentMethod, priceOverrideReason, referenceNo, selectedCustomer, newCustomerDraft, drawer, locationId, needsPriceOverride, isAdministrator]);

  const canAddCustomer = Boolean(customerSearch.trim()) && !selectedCustomer && !newCustomerDraft && customerOptions.length === 0;

  const startQuickCustomer = () => {
    const value = customerSearch.trim();
    setNewCustomerName((current) => current || (looksLikePhone(value) ? "" : value));
    setNewCustomerPhone((current) => current || (looksLikePhone(value) ? value : ""));
    setQuickCustomerOpen(true);
    setCustomerDialogOpen(true);
  };

  const confirmCustomerDraft = () => {
    const name = newCustomerName.trim();
    const phone = newCustomerPhone.trim();
    if (!name || !phone) {
      toast.error("Enter customer name and phone number.");
      return;
    }
    setNewCustomerDraft({ name, phone });
    setCustomerSearch(`${name} • ${phone}`);
    setQuickCustomerOpen(false);
    setCustomerDialogOpen(false);
  };

  if (!drawerLoaded) {
    return <>
      <PageMeta description="Create a new customer sale and print invoice receipt." title="New Sale | Mobee Suite" />
      <Card sx={{ p: 3 }}><Typography>Checking POS drawer…</Typography></Card>
    </>;
  }

  if (!drawer) {
    return <>
      <PageMeta description="Create a new customer sale and print invoice receipt." title="New Sale | Mobee Suite" />
      <Card sx={{ mx: "auto", p: 3, textAlign: "center", width: "min(520px, 100%)" }}>
        <Stack spacing={1.5}>
          <PointOfSaleRoundedIcon color="primary" sx={{ alignSelf: "center", fontSize: 44 }} />
          <Typography variant="h5">Open POS drawer first</Typography>
          <Typography color="text.secondary">Sales are blocked until a drawer is open for your assigned location.</Typography>
          <Button component={RouterLink} to={PATH_DASHBOARD.pos.root} variant="contained">Go to POS</Button>
        </Stack>
      </Card>
    </>;
  }

  return <>
    <PageMeta description="Create a new customer sale and print invoice receipt." title="New Sale | Mobee Suite" />
    <Box sx={{ bgcolor: "background.default", inset: 0, overflow: "auto", p: { xs: 2, md: 3 }, position: "fixed", zIndex: (theme) => theme.zIndex.modal - 1 }}>
    <Stack spacing={2.25} sx={{ mx: "auto", width: "min(1500px, 100%)" }}>
      <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
        <Stack alignItems="center" direction="row" spacing={1}><PointOfSaleRoundedIcon color="primary" /><Typography variant="h4">Create Sale</Typography><Chip color="success" label={`${drawer.locationName} • Drawer #${drawer.id}`} size="small" /></Stack>
        <Stack direction="row" gap={1} flexWrap="wrap">
          <Button color="inherit" onClick={() => navigate(PATH_DASHBOARD.pos.root)} startIcon={<ArrowBackRoundedIcon />} variant="outlined">Back to POS</Button>
          {lastSale ? <Button onClick={() => printSaleReceipt(lastSale)} startIcon={<LocalPrintshopOutlinedIcon />} variant="outlined">Print last bill</Button> : null}
        </Stack>
      </Stack>
      {!locationId ? <Card sx={{ borderColor: "warning.main", borderStyle: "solid", borderWidth: 1, p: 2 }}>
        <Typography fontWeight={800}>No sale location assigned</Typography>
        <Typography color="text.secondary" variant="body2">Ask an administrator to assign your user account to a location before creating sales.</Typography>
      </Card> : null}
      <Card sx={{ p: 1.5 }}>
        <Stack direction="row" gap={1} flexWrap="wrap" alignItems="center">
          <Chip icon={<KeyboardRoundedIcon />} label="F2 scan/search item" size="small" />
          <Chip icon={<KeyboardRoundedIcon />} label="F4 complete sale" size="small" />
          <Chip icon={<KeyboardRoundedIcon />} label="Alt+P back to POS" size="small" />
        </Stack>
      </Card>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 380px" } }}>
        <Stack spacing={2}>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <Stack spacing={1.5}>
              <Stack alignItems="center" direction="row" justifyContent="space-between">
                <Box>
                  <Typography fontWeight={800}>Sale location</Typography>
                  <Typography color="text.secondary" variant="body2">Using your assigned location automatically.</Typography>
                </Box>
                <Chip color="success" label={`${drawer.locationName} • Drawer #${drawer.id}`} size="small" />
              </Stack>
              <Autocomplete
                disabled={!locationId}
                filterOptions={(options) => options}
                getOptionLabel={(option) => `${option.productName} (${option.quantityAvailable} available)`}
                inputValue={productSearch}
                onChange={(_event, value) => addProduct(value)}
                onInputChange={(_event, value, reason) => {
                  setProductSearch(value);
                  if (reason === "input") setProductOptions([]);
                }}
                options={productOptions}
                renderInput={(params) => <TextField {...params} autoComplete="off" autoFocus inputRef={productInputRef} label="Scan barcode / IMEI / serial or search product" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void scanAndAddExactProduct(); } }} slotProps={{ input: { ...params.InputProps, startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} />}
                renderOption={(props, option) => <Box component="li" {...props}><Stack width="100%"><Stack direction="row" justifyContent="space-between"><Typography fontWeight={700}>{option.productName}</Typography><Chip label={option.matchType} size="small" /></Stack><Typography color="text.secondary" variant="caption">{option.productSku ?? `Product #${option.productId}`} • {option.locationName} • {option.quantityAvailable} available • MRP {fCurrency(Number(option.mrpPrice))} • Floor {fCurrency(Number(option.sellingPrice))} • Cost {fCurrency(Number(option.costPrice))}</Typography></Stack></Box>}
              />
            </Stack>
          </Card>
          <Card sx={{ borderRadius: 3, minHeight: 440, overflow: "hidden" }}>
            <Box sx={{
              bgcolor: "action.hover",
              display: { xs: "none", md: "grid" },
              gap: 1.5,
              gridTemplateColumns: "minmax(280px, 1fr) 96px 120px 132px 150px 140px 48px",
              px: 2,
              py: 1.4,
            }}>
              {["Product", "Qty", "Cost", "Unit price", "Discount", "Line Total", ""].map((heading) => <Typography color="text.secondary" fontWeight={800} key={heading} variant="caption">{heading}</Typography>)}
            </Box>
            {!items.length ? <Stack alignItems="center" justifyContent="center" sx={{ minHeight: 340 }}>
              <SearchRoundedIcon color="disabled" sx={{ fontSize: 48, mb: 1 }} />
              <Typography fontWeight={800}>No products added</Typography>
              <Typography color="text.secondary" variant="body2">Scan a barcode or search product name to start the bill.</Typography>
            </Stack> : <Stack divider={<Divider flexItem />}>
              {items.map((item) => {
                const nextQty = (value: string) => Math.min(item.availableStockIds.length, Math.max(1, Math.trunc(toAmount(value))));
                const nextPrice = (value: string) => {
                  const entered = toAmount(value);
                  return isAdministrator
                    ? entered
                    : Math.min(item.mrpPrice, Math.max(item.lowestSellingPrice, entered));
                };
                return <Box key={item.id} sx={{
                  alignItems: "center",
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: { xs: "1fr", md: "minmax(280px, 1fr) 96px 120px 132px 150px 140px 48px" },
                  px: 2,
                  py: 1.35,
                  transition: "background-color 140ms ease",
                  "&:hover": { bgcolor: "action.hover" },
                }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={900} noWrap title={item.productName}>{item.productName}</Typography>
                    <Stack direction="row" gap={0.75} flexWrap="wrap" mt={0.5}>
                       <Chip label={`Floor ${fCurrency(item.lowestSellingPrice)}`} size="small" variant="outlined" />
                    </Stack>
                  </Box>
                  <TextField
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*", style: { textAlign: "center" } }}
                    onChange={(event) => setItems((current) => current.map((row) => {
                      if (row.id !== item.id) return row;
                      const quantity = nextQty(event.target.value);
                      const selectedStockIds = quantity <= row.stockIds.length
                        ? row.stockIds.slice(0, quantity)
                        : [...row.stockIds, ...row.availableStockIds.filter((stockId) => !row.stockIds.includes(stockId)).slice(0, quantity - row.stockIds.length)];
                      return {
                        ...row,
                        discountAmount: isAdministrator ? row.discountAmount : Math.min(row.discountAmount, maxLineDiscount({ ...row, quantity })),
                        quantity,
                        stockIds: selectedStockIds,
                      };
                    }))}
                    size="small"
                    value={String(item.quantity)}
                  />
                  <Typography color="text.secondary" fontWeight={700}>{fCurrency(item.costPrice)}</Typography>
                  <TextField
                    inputProps={{ inputMode: "decimal", style: { textAlign: "right" } }}
                    onChange={(event) => setItems((current) => current.map((row) => row.id === item.id ? {
                      ...row,
                      discountAmount: isAdministrator ? row.discountAmount : Math.min(row.discountAmount, maxLineDiscount({ ...row, unitPrice: nextPrice(event.target.value) })),
                      unitPrice: nextPrice(event.target.value),
                    } : row))}
                    size="small"
                    value={String(item.unitPrice)}
                  />
                  <TextField
                    inputProps={{ inputMode: "decimal", style: { textAlign: "right" } }}
                    onChange={(event) => setItems((current) => current.map((row) => row.id === item.id ? {
                      ...row,
                      discountAmount: isAdministrator ? toAmount(event.target.value) : Math.min(maxLineDiscount(row), toAmount(event.target.value)),
                    } : row))}
                    size="small"
                    value={String(item.discountAmount)}
                  />
                  <Typography fontWeight={900}>{fCurrency(item.unitPrice * item.quantity - item.discountAmount)}</Typography>
                  <IconButton aria-label={`Remove ${item.productName}`} color="error" onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))} size="small"><DeleteOutlineRoundedIcon /></IconButton>
                </Box>;
              })}
            </Stack>}
          </Card>
        </Stack>
        <Stack spacing={2}>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <Typography fontWeight={800} mb={1}>Customer</Typography>
            <Autocomplete
              filterOptions={(options) => options}
              getOptionLabel={(option) => `${option.name}${option.phone ? ` • ${option.phone}` : ""}`}
              inputValue={customerSearch}
              noOptionsText={customerSearch.trim()
                ? <Box sx={{ p: 0.75 }}>
                  <Typography color="text.secondary" mb={1} variant="body2">No customer found</Typography>
                  <Button
                    fullWidth
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={startQuickCustomer}
                    startIcon={<PersonAddAlt1RoundedIcon />}
                    variant="contained"
                  >
                    Create new customer
                  </Button>
                </Box>
                : "Type phone or name"}
              onChange={(_event, value) => { setSelectedCustomer(value); setNewCustomerDraft(null); if (value) setNewCustomerName(value.name); }}
              onInputChange={(_event, value, reason) => {
                setCustomerSearch(value);
                if (reason === "input") {
                  setSelectedCustomer(null);
                  setNewCustomerDraft(null);
                  setQuickCustomerOpen(false);
                  setCustomerDialogOpen(false);
                }
              }}
              options={customerOptions}
              renderInput={(params) => <TextField {...params} label="Search phone or name" />}
            />
            {selectedCustomer ? <Box sx={{ bgcolor: "success.main", borderRadius: 2, color: "success.contrastText", mt: 1.25, px: 1.5, py: 1 }}>
              <Typography fontWeight={800}>{selectedCustomer.name}</Typography>
              <Typography sx={{ opacity: 0.86 }} variant="caption">{selectedCustomer.phone || "Saved customer"}</Typography>
            </Box> : null}
            {canAddCustomer && !quickCustomerOpen ? <Button
              fullWidth
              onMouseDown={(event) => event.preventDefault()}
              onClick={startQuickCustomer}
              startIcon={<PersonAddAlt1RoundedIcon />}
              sx={{ justifyContent: "flex-start", mt: 1.25, py: 1.25 }}
              variant="outlined"
            >
              Add new customer on this bill
            </Button> : null}
            {canAddCustomer && quickCustomerOpen && !customerDialogOpen ? <Box sx={{ bgcolor: "action.hover", border: 1, borderColor: "primary.main", borderRadius: 2.5, mt: 1.25, p: 1.5 }}>
              <Stack direction="row" spacing={1.25} alignItems="center" mb={1.25}>
                <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: 1.5, color: "primary.contrastText", display: "flex", height: 34, justifyContent: "center", width: 34 }}>
                  <PersonAddAlt1RoundedIcon fontSize="small" />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={900}>Quick add customer</Typography>
                  <Typography color="text.secondary" variant="caption">Only name and phone are needed. No redirect.</Typography>
                </Box>
              </Stack>
              <Stack spacing={1.1}>
                <TextField
                  autoFocus={!newCustomerName}
                  fullWidth
                  label="Customer name"
                  onChange={(event) => setNewCustomerName(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); confirmCustomerDraft(); } }}
                  placeholder="Customer name"
                  size="small"
                  value={newCustomerName}
                />
                <TextField
                  autoFocus={Boolean(newCustomerName) && !newCustomerPhone}
                  fullWidth
                  inputProps={{ inputMode: "tel" }}
                  label="Phone number"
                  onChange={(event) => setNewCustomerPhone(event.target.value)}
                  onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); confirmCustomerDraft(); } }}
                  placeholder="07XXXXXXXX"
                  size="small"
                  value={newCustomerPhone}
                />
                <Stack direction="row" spacing={1}>
                  <Button fullWidth color="inherit" onClick={() => { setQuickCustomerOpen(false); setNewCustomerName(""); setNewCustomerPhone(""); }} variant="outlined">Cancel</Button>
                  <Button fullWidth onClick={confirmCustomerDraft} startIcon={<AddRoundedIcon />} variant="contained">Use customer</Button>
                </Stack>
              </Stack>
            </Box> : null}
            {newCustomerDraft ? <Box sx={{ bgcolor: "primary.main", borderRadius: 2, color: "primary.contrastText", mt: 1.25, p: 1.4 }}>
              <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={900} noWrap>{newCustomerDraft.name}</Typography>
                  <Typography sx={{ opacity: 0.86 }} variant="caption">{newCustomerDraft.phone} • will be saved with this sale</Typography>
                </Box>
                <Button color="inherit" onClick={() => { setNewCustomerDraft(null); setQuickCustomerOpen(true); }} size="small" variant="outlined">Edit</Button>
              </Stack>
            </Box> : null}
          </Card>
          <Card sx={{ borderRadius: 3, p: 2 }}>
            <Typography fontWeight={800} mb={1}>Payment</Typography>
            <Stack spacing={1.5}>
              <TextField label="Payment method" onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} select SelectProps={{ native: true }} value={paymentMethod}>{methods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</TextField>
              <TextField label="Reference No" onChange={(event) => setReferenceNo(event.target.value)} value={referenceNo} />
              <TextField helperText={!isAdministrator ? `Max allowed ${fCurrency(maxSaleDiscount)}` : undefined} inputProps={{ inputMode: "decimal" }} label="Sale discount" onChange={(event) => setSaleDiscount(Math.min(maxSaleDiscount, toAmount(event.target.value)))} value={String(saleDiscount)} />
              {isAdministrator && needsPriceOverride ? <Box sx={{ bgcolor: "error.lighter", border: 1, borderColor: "error.main", borderRadius: 2, p: 1.25 }}>
                <Typography color="error.main" fontWeight={800} variant="body2">Administrator approval required</Typography>
                <Typography color="text.secondary" display="block" mb={1} variant="caption">This sale is below the floor price or above MRP. Add a reason to continue; it will be saved in the audit trail.</Typography>
                <TextField
                  fullWidth
                  helperText="Required for this exception. It will be retained with the sale record."
                  inputProps={{ maxLength: 500 }}
                  label="Override reason"
                  onChange={(event) => setPriceOverrideReason(event.target.value)}
                  required
                  size="small"
                  value={priceOverrideReason}
                />
              </Box> : null}
              <Button disabled variant="outlined">Claim voucher — coming soon</Button>
              <Divider />
              <Stack spacing={0.75}><Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Subtotal</Typography><Typography>{fCurrency(subTotal)}</Typography></Stack><Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Discount</Typography><Typography>{fCurrency(itemDiscount + saleDiscount)}</Typography></Stack><Stack direction="row" justifyContent="space-between"><Typography variant="h5">Total</Typography><Typography variant="h5">{fCurrency(total)}</Typography></Stack></Stack>
              <Button disabled={saving || !items.length} onClick={() => void create()} size="large" startIcon={<AddRoundedIcon />} variant="contained">Complete sale & print bill</Button>
            </Stack>
          </Card>
        </Stack>
      </Box>
    </Stack>
    </Box>
    <Dialog fullWidth maxWidth="xs" onClose={() => setCustomerDialogOpen(false)} open={customerDialogOpen}>
      <DialogTitle>Quick add customer</DialogTitle>
      <DialogContent>
        <Stack spacing={1.4} pt={1}>
          <Typography color="text.secondary" variant="body2">Add only the required details and continue this sale. You can update full customer details later.</Typography>
          <TextField
            autoFocus={!newCustomerName}
            fullWidth
            label="Customer name"
            onChange={(event) => setNewCustomerName(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); confirmCustomerDraft(); } }}
            placeholder="Customer name"
            value={newCustomerName}
          />
          <TextField
            autoFocus={Boolean(newCustomerName) && !newCustomerPhone}
            fullWidth
            inputProps={{ inputMode: "tel" }}
            label="Phone number"
            onChange={(event) => setNewCustomerPhone(event.target.value)}
            onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); confirmCustomerDraft(); } }}
            placeholder="07XXXXXXXX"
            value={newCustomerPhone}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={() => setCustomerDialogOpen(false)}>Cancel</Button>
        <Button onClick={confirmCustomerDraft} startIcon={<AddRoundedIcon />} variant="contained">Use customer</Button>
      </DialogActions>
    </Dialog>
  </>;
}
