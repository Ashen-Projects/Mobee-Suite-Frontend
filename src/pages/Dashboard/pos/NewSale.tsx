import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import PointOfSaleRoundedIcon from "@mui/icons-material/PointOfSaleRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { Autocomplete, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import useAuth from "../../../hooks/useAuth";
import { createSale, searchSaleCustomers, searchSaleProducts, type PaymentMethod, type SaleCustomer, type SaleDetail, type SaleProductSearchItem } from "../../../redux/slices/posRedux/saleRedux";
import { fCurrency } from "../../../utils/formatNumber";
import { printSaleReceipt } from "../../../utils/printSaleReceipt";

type CartItem = {
  id: string;
  productId: number;
  productName: string;
  productSku: string | null;
  quantity: number;
  quantityAvailable: number;
  stockIds: number[];
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

export default function NewSale() {
  const { user } = useAuth();
  const locationId = user?.defaultLocationId ?? null;
  const [productSearch, setProductSearch] = useState("");
  const [productOptions, setProductOptions] = useState<SaleProductSearchItem[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerOptions, setCustomerOptions] = useState<SaleCustomer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<SaleCustomer | null>(null);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerDraft, setNewCustomerDraft] = useState<NewCustomerDraft | null>(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);
  const [saleDiscount, setSaleDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [referenceNo, setReferenceNo] = useState("");
  const [lastSale, setLastSale] = useState<SaleDetail | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const search = productSearch.trim();
    if (!search || !locationId) { setProductOptions([]); return; }
    const timer = window.setTimeout(() => {
      searchSaleProducts({ locationId, search }).then(setProductOptions)
        .catch((error) => toast.error(error instanceof Error ? error.message : "Unable to search products."));
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
  const total = Math.max(0, subTotal - itemDiscount - saleDiscount);

  const addProduct = (product: SaleProductSearchItem | null) => {
    if (!product) return;
    const stockIds = product.stockIds.length ? product.stockIds : product.stockId ? [product.stockId] : [];
    if (!stockIds.length) { toast.error("This product has no available stock units."); return; }
    const existing = items.find((item) => item.productId === product.productId && item.unitPrice === Number(product.sellingPrice));
    if (existing) {
      if (existing.quantity >= existing.quantityAvailable) { toast.error("No more available units for this product."); return; }
      setItems((current) => current.map((item) => item.id === existing.id ? { ...item, quantity: item.quantity + 1, stockIds: stockIds.slice(0, item.quantity + 1) } : item));
    } else {
      setItems((current) => [...current, {
        discountAmount: 0,
        id: `${product.productId}-${Date.now()}`,
        productId: product.productId,
        productName: product.productName,
        productSku: product.productSku,
        quantity: 1,
        quantityAvailable: product.quantityAvailable,
        stockIds,
        unitPrice: Number(product.sellingPrice),
      }]);
    }
    setProductSearch("");
    setProductOptions([]);
  };

  const create = async () => {
    if (!locationId) { toast.error("Your account does not have an assigned sale location."); return; }
    if (!items.length) { toast.error("Add at least one product."); return; }
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
      setSelectedCustomer(null);
      setCustomerSearch("");
      setNewCustomerName("");
      setNewCustomerPhone("");
      setNewCustomerDraft(null);
      setReferenceNo("");
      toast.success(`Sale ${sale.invoiceNo} completed.`);
      printSaleReceipt(sale);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create sale.");
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo<GridColDef<CartItem>[]>(() => [
    { field: "productName", flex: 1, headerName: "Product", minWidth: 260, renderCell: ({ row }) => <Box><Typography fontWeight={700}>{row.productName}</Typography><Typography color="text.secondary" variant="caption">{row.productSku ?? `Product #${row.productId}`}</Typography></Box> },
    { field: "quantity", headerName: "Qty", minWidth: 130, renderCell: ({ row }) => <TextField inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }} onChange={(event) => setItems((current) => current.map((item) => item.id === row.id ? { ...item, quantity: Math.min(row.quantityAvailable, Math.max(1, Math.trunc(toAmount(event.target.value)))) } : item))} size="small" value={String(row.quantity)} /> },
    { field: "unitPrice", headerName: "Price", minWidth: 145, renderCell: ({ row }) => <TextField inputProps={{ inputMode: "decimal" }} onChange={(event) => setItems((current) => current.map((item) => item.id === row.id ? { ...item, unitPrice: toAmount(event.target.value) } : item))} size="small" value={String(row.unitPrice)} /> },
    { field: "discountAmount", headerName: "Discount", minWidth: 145, renderCell: ({ row }) => <TextField inputProps={{ inputMode: "decimal" }} onChange={(event) => setItems((current) => current.map((item) => item.id === row.id ? { ...item, discountAmount: toAmount(event.target.value) } : item))} size="small" value={String(row.discountAmount)} /> },
    { field: "total", headerName: "Line Total", minWidth: 140, valueGetter: (_value, row) => row.unitPrice * row.quantity - row.discountAmount, valueFormatter: (value) => fCurrency(Number(value)) },
    { field: "actions", align: "center", headerName: "", minWidth: 72, sortable: false, renderCell: ({ row }) => <IconButton color="error" onClick={() => setItems((current) => current.filter((item) => item.id !== row.id))} size="small"><DeleteOutlineRoundedIcon /></IconButton> },
  ], []);

  const canAddCustomer = Boolean(customerSearch.trim()) && !selectedCustomer && !newCustomerDraft && customerOptions.length === 0;

  const openCustomerDialog = () => {
    const value = customerSearch.trim();
    setNewCustomerName(looksLikePhone(value) ? "" : value);
    setNewCustomerPhone(looksLikePhone(value) ? value : "");
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
    setCustomerDialogOpen(false);
  };

  return <>
    <PageMeta description="Create a new customer sale and print invoice receipt." title="New Sale | Mobee Suite" />
    <Stack spacing={2.5}>
      <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={2}>
        <Stack alignItems="center" direction="row" spacing={1}><PointOfSaleRoundedIcon color="primary" /><Typography variant="h4">Create New Sale</Typography></Stack>
        {lastSale ? <Button onClick={() => printSaleReceipt(lastSale)} startIcon={<LocalPrintshopOutlinedIcon />} variant="outlined">Print last bill</Button> : null}
      </Stack>
      {!locationId ? <Card sx={{ borderColor: "warning.main", borderStyle: "solid", borderWidth: 1, p: 2 }}>
        <Typography fontWeight={800}>No sale location assigned</Typography>
        <Typography color="text.secondary" variant="body2">Ask an administrator to assign your user account to a location before creating sales.</Typography>
      </Card> : null}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "1fr 360px" } }}>
        <Stack spacing={2}>
          <Card sx={{ p: 2 }}>
            <Stack spacing={1.5}>
              <Stack alignItems="center" direction="row" justifyContent="space-between">
                <Box>
                  <Typography fontWeight={800}>Sale location</Typography>
                  <Typography color="text.secondary" variant="body2">Using your assigned location automatically.</Typography>
                </Box>
                <Chip color={locationId ? "primary" : "warning"} label={locationId ? `Location #${locationId}` : "Not assigned"} size="small" />
              </Stack>
              <Autocomplete
                disabled={!locationId}
                filterOptions={(options) => options}
                getOptionLabel={(option) => `${option.productName} (${option.quantityAvailable} available)`}
                inputValue={productSearch}
                onChange={(_event, value) => addProduct(value)}
                onInputChange={(_event, value) => setProductSearch(value)}
                options={productOptions}
                renderInput={(params) => <TextField {...params} autoFocus label="Search product or scan barcode / IMEI / serial" slotProps={{ input: { ...params.InputProps, startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} />}
                renderOption={(props, option) => <Box component="li" {...props}><Stack width="100%"><Stack direction="row" justifyContent="space-between"><Typography fontWeight={700}>{option.productName}</Typography><Chip label={option.matchType} size="small" /></Stack><Typography color="text.secondary" variant="caption">{option.productSku ?? `Product #${option.productId}`} • {option.locationName} • {option.quantityAvailable} available • {fCurrency(Number(option.sellingPrice))}</Typography></Stack></Box>}
              />
            </Stack>
          </Card>
          <Card sx={{ overflow: "hidden" }}>
            <DataGrid autoHeight columns={columns} disableColumnMenu disableRowSelectionOnClick getRowHeight={() => 62} hideFooter rows={items} sx={{ border: 0, minHeight: 320, "& .MuiDataGrid-cell": { alignItems: "center", display: "flex" }, "& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within": { outline: "none" } }} />
          </Card>
        </Stack>
        <Stack spacing={2}>
          <Card sx={{ p: 2 }}>
            <Typography fontWeight={800} mb={1}>Customer</Typography>
            <Autocomplete
              filterOptions={(options) => options}
              getOptionLabel={(option) => `${option.name}${option.phone ? ` • ${option.phone}` : ""}`}
              inputValue={customerSearch}
              noOptionsText={customerSearch.trim() ? "No customer found" : "Type phone or name"}
              onChange={(_event, value) => { setSelectedCustomer(value); setNewCustomerDraft(null); if (value) setNewCustomerName(value.name); }}
              onInputChange={(_event, value, reason) => {
                setCustomerSearch(value);
                if (reason === "input") {
                  setSelectedCustomer(null);
                  setNewCustomerDraft(null);
                }
              }}
              options={customerOptions}
              renderInput={(params) => <TextField {...params} label="Search phone or name" />}
            />
            {selectedCustomer ? <Chip color="success" label={`Selected: ${selectedCustomer.name}`} sx={{ mt: 1.5 }} /> : null}
            {canAddCustomer ? <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, mt: 1.5, p: 1.5 }}>
              <Typography fontWeight={700}>Customer not found</Typography>
              <Typography color="text.secondary" mb={1.25} variant="body2">Add this customer here and continue the sale. No redirect needed.</Typography>
              <Button fullWidth onMouseDown={(event) => event.preventDefault()} onClick={openCustomerDialog} startIcon={<AddRoundedIcon />} variant="outlined">Add customer</Button>
            </Box> : null}
            {newCustomerDraft ? <Box sx={{ border: 1, borderColor: "primary.main", borderRadius: 2, mt: 1.5, p: 1.5 }}>
              <Stack direction="row" justifyContent="space-between" gap={1} mb={1}>
                <Box><Typography fontWeight={800}>{newCustomerDraft.name}</Typography><Typography color="text.secondary" variant="caption">{newCustomerDraft.phone}</Typography></Box>
                <Chip color="primary" label="Will create" size="small" />
              </Stack>
              <Stack spacing={1.25}>
                <TextField fullWidth label="Customer name" onChange={(event) => {
                  setNewCustomerName(event.target.value);
                  setNewCustomerDraft((current) => current ? { ...current, name: event.target.value } : current);
                }} value={newCustomerName} />
                <TextField fullWidth inputProps={{ inputMode: "tel" }} label="Phone number" onChange={(event) => {
                  setNewCustomerPhone(event.target.value);
                  setNewCustomerDraft((current) => current ? { ...current, phone: event.target.value } : current);
                }} value={newCustomerPhone} />
              </Stack>
            </Box> : null}
          </Card>
          <Card sx={{ p: 2 }}>
            <Typography fontWeight={800} mb={1}>Payment</Typography>
            <Stack spacing={1.5}>
              <TextField label="Payment method" onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)} select SelectProps={{ native: true }} value={paymentMethod}>{methods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</TextField>
              <TextField label="Reference No" onChange={(event) => setReferenceNo(event.target.value)} value={referenceNo} />
              <TextField inputProps={{ inputMode: "decimal" }} label="Sale discount" onChange={(event) => setSaleDiscount(toAmount(event.target.value))} value={String(saleDiscount)} />
              <Button disabled variant="outlined">Claim voucher — coming soon</Button>
              <Divider />
              <Stack spacing={0.75}><Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Subtotal</Typography><Typography>{fCurrency(subTotal)}</Typography></Stack><Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Discount</Typography><Typography>{fCurrency(itemDiscount + saleDiscount)}</Typography></Stack><Stack direction="row" justifyContent="space-between"><Typography variant="h5">Total</Typography><Typography variant="h5">{fCurrency(total)}</Typography></Stack></Stack>
              <Button disabled={saving || !items.length} onClick={() => void create()} size="large" startIcon={<AddRoundedIcon />} variant="contained">Complete sale & print bill</Button>
            </Stack>
          </Card>
        </Stack>
      </Box>
    </Stack>
    <Dialog fullWidth maxWidth="xs" onClose={() => setCustomerDialogOpen(false)} open={customerDialogOpen}>
      <DialogTitle>Add customer</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} pt={1}>
          <TextField autoFocus label="Customer name" onChange={(event) => setNewCustomerName(event.target.value)} value={newCustomerName} />
          <TextField helperText="Only name and phone are needed now. Full details can be updated later." inputProps={{ inputMode: "tel" }} label="Phone number" onChange={(event) => setNewCustomerPhone(event.target.value)} value={newCustomerPhone} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={() => setCustomerDialogOpen(false)}>Cancel</Button>
        <Button onClick={confirmCustomerDraft} variant="contained">Use customer</Button>
      </DialogActions>
    </Dialog>
  </>;
}
