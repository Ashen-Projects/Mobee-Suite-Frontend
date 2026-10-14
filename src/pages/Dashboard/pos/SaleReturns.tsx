import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { Autocomplete, Box, Button, Card, Chip, Divider, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import PageMeta from "../../../components/common/PageMeta";
import useAuth from "../../../hooks/useAuth";
import { getCurrentDrawer, type PosDrawer } from "../../../redux/slices/posRedux/drawerRedux";
import { searchSaleProducts, type PaymentMethod, type SaleProductSearchItem } from "../../../redux/slices/posRedux/saleRedux";
import { createSaleExchange, getSaleReturns, getSaleReturn, lookupSaleReturn, type ReturnLookup, type SaleExchange, type SaleExchangeListResponse } from "../../../redux/slices/posRedux/saleReturnRedux";
import { PATH_DASHBOARD } from "../../../routes/paths";
import { fCurrency } from "../../../utils/formatNumber";
import { printSaleExchangeReceipt } from "../../../utils/printSaleExchangeReceipt";

type SelectedReturn = { disposition: "restock" | "damage"; stockId: number };
type PaymentLine = { amount: number; method: PaymentMethod; referenceNo: string };
type Replacement = { barcode: string | null; productName: string; stockId: number; unitPrice: number };

const methods: Array<{ label: string; value: PaymentMethod }> = [
  { label: "Cash", value: "cash" }, { label: "Card", value: "card" }, { label: "Bank Transfer", value: "bankTransfer" }, { label: "Mobile Payment", value: "mobile" },
];
const amount = (value: string) => Number(value.replace(/[^\d.]/g, "")) || 0;

export default function SaleReturns() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const locationId = user?.defaultLocationId ?? null;
  const lookupInput = useRef<HTMLInputElement | null>(null);
  const replacementInput = useRef<HTMLInputElement | null>(null);
  const [drawer, setDrawer] = useState<PosDrawer | null>(null);
  const [lookupValue, setLookupValue] = useState("");
  const [lookup, setLookup] = useState<ReturnLookup | null>(null);
  const [selectedReturns, setSelectedReturns] = useState<SelectedReturn[]>([]);
  const [replacements, setReplacements] = useState<Replacement[]>([]);
  const [replacementSearch, setReplacementSearch] = useState("");
  const [replacementOptions, setReplacementOptions] = useState<SaleProductSearchItem[]>([]);
  // A reason is useful for audit, but it must never block a straightforward exchange.
  const [reason, setReason] = useState("Customer item exchange");
  const [payments, setPayments] = useState<PaymentLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [lastExchange, setLastExchange] = useState<SaleExchange | null>(null);
  const [history, setHistory] = useState<SaleExchangeListResponse["items"]>([]);

  const returnCredit = useMemo(() => selectedReturns.reduce((sum, item) => sum + (lookup?.items.find((row) => row.stockId === item.stockId)?.returnAmount ?? 0), 0), [lookup, selectedReturns]);
  const replacementTotal = useMemo(() => replacements.reduce((sum, item) => sum + item.unitPrice, 0), [replacements]);
  const balance = Number(Math.max(0, replacementTotal - returnCredit).toFixed(2));
  const collected = useMemo(() => payments.reduce((sum, payment) => sum + payment.amount, 0), [payments]);
  const collectionDifference = Number((balance - collected).toFixed(2));

  const refreshHistory = async () => {
    try { setHistory((await getSaleReturns({ page: 1, pageSize: 10, search: "" })).items); }
    catch { /* historical data must not stop a new exchange */ }
  };

  useEffect(() => { void getCurrentDrawer().then(setDrawer).catch(() => setDrawer(null)); void refreshHistory(); }, []);
  useEffect(() => {
    if (balance === 0) { setPayments([]); return; }
    setPayments((current) => current.length === 1 && current[0].method === "cash" ? [{ ...current[0], amount: balance }] : current);
  }, [balance]);
  useEffect(() => {
    const search = replacementSearch.trim();
    if (!search || !locationId) { setReplacementOptions([]); return; }
    const timer = window.setTimeout(() => searchSaleProducts({ locationId, search }).then(setReplacementOptions).catch(() => setReplacementOptions([])), 250);
    return () => window.clearTimeout(timer);
  }, [locationId, replacementSearch]);

  const reset = () => {
    setLookup(null); setLookupValue(""); setSelectedReturns([]); setReplacements([]); setReplacementSearch(""); setReplacementOptions([]); setReason("Customer item exchange"); setPayments([]);
    window.setTimeout(() => lookupInput.current?.focus(), 0);
  };
  const loadOriginal = async () => {
    if (!lookupValue.trim()) return;
    try {
      const value = await lookupSaleReturn(lookupValue.trim());
      setLookup(value);
      setSelectedReturns(value.items.filter((item) => item.eligible).map((item) => ({ disposition: "restock", stockId: item.stockId })));
      setReplacements([]); setPayments([]); setReason("Customer item exchange"); setLastExchange(null);
      toast.success(`Original invoice ${value.sale.invoiceNo} loaded.`);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to find the original sale."); }
  };
  const setReturnDisposition = (stockId: number, disposition: "restock" | "damage") => setSelectedReturns((current) => current.map((item) => item.stockId === stockId ? { ...item, disposition } : item));
  const toggleReturn = (stockId: number) => setSelectedReturns((current) => current.some((item) => item.stockId === stockId) ? current.filter((item) => item.stockId !== stockId) : [...current, { disposition: "restock", stockId }]);
  const addReplacement = (item: SaleProductSearchItem | null) => {
    if (!item) return;
    const candidates = item.stockIds.length ? item.stockIds : item.stockId ? [item.stockId] : [];
    const stockId = candidates.find((id) => !replacements.some((replacement) => replacement.stockId === id));
    if (!stockId) { toast.info("This stock unit is already in the exchange."); return; }
    setReplacements((current) => [...current, { barcode: item.barcode ?? null, productName: item.productName, stockId, unitPrice: Number(item.mrpPrice) }]);
    setReplacementSearch(""); setReplacementOptions([]); window.setTimeout(() => replacementInput.current?.focus(), 0);
  };
  const addExactReplacement = async () => {
    if (!replacementSearch.trim() || !locationId) return;
    try {
      const found = await searchSaleProducts({ locationId, search: replacementSearch.trim() });
      const exact = found.find((item) => item.matchType !== "product");
      if (exact) addReplacement(exact); else { setReplacementOptions(found); if (!found.length) toast.error("No available replacement unit was found."); }
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to find replacement stock."); }
  };
  const addPayment = () => {
    const available = methods.find(({ value }) => !payments.some((payment) => payment.method === value));
    if (!available) return;
    setPayments((current) => [...current, { amount: 0, method: available.value, referenceNo: "" }]);
  };
  const updatePayment = (index: number, change: Partial<PaymentLine>) => setPayments((current) => current.map((payment, paymentIndex) => paymentIndex === index ? { ...payment, ...change } : payment));
  const complete = async () => {
    if (!drawer) { toast.error("Open the POS drawer before creating an exchange."); return; }
    if (!lookup || !selectedReturns.length) { toast.error("Select at least one original item to return."); return; }
    if (!replacements.length) { toast.error("Add the replacement item or items."); return; }
    if (replacementTotal < returnCredit) { toast.error("A replacement must be equal to or higher than the return credit. No cash refund is available."); return; }
    if (Math.abs(collectionDifference) > 0.009) { toast.error(collectionDifference > 0 ? `Collect the remaining ${fCurrency(collectionDifference)}.` : "Payment cannot exceed the exchange balance."); return; }
    if (payments.some((payment) => payment.method !== "cash" && !payment.referenceNo.trim())) { toast.error("Enter a reference for every non-cash payment."); return; }
    setSaving(true);
    try {
      const exchange = await createSaleExchange({ originalSaleId: lookup.sale.id, payments: payments.map((payment) => ({ ...payment, referenceNo: payment.referenceNo.trim() || undefined })), reason: reason.trim() || "Customer item exchange", replacementStockIds: replacements.map((item) => item.stockId), returnedItems: selectedReturns });
      setLastExchange(exchange); printSaleExchangeReceipt(exchange); toast.success(`Exchange ${exchange.returnNo} completed.`); await refreshHistory(); reset();
    } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to complete exchange."); }
    finally { setSaving(false); }
  };

  return <>
    <PageMeta description="Process secure item-only exchanges within the return window." title="Sale Returns | Mobee Suite" />
    <Box sx={{ bgcolor: "background.default", inset: 0, overflow: "auto", p: { xs: 1.5, md: 3 }, position: "fixed", zIndex: (theme) => theme.zIndex.modal - 1 }}>
      <Stack spacing={2.25} sx={{ mx: "auto", width: "min(1400px, 100%)" }}>
        <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5}>
          <Stack direction="row" alignItems="center" spacing={1}><ReplayRoundedIcon color="primary" /><Typography variant="h4">Return / Exchange</Typography></Stack>
          <Stack direction="row" gap={1}><Button color="inherit" onClick={() => navigate(PATH_DASHBOARD.pos.root)} startIcon={<ArrowBackRoundedIcon />} variant="outlined">Back to POS</Button>{lastExchange ? <Button onClick={() => printSaleExchangeReceipt(lastExchange)} startIcon={<LocalPrintshopOutlinedIcon />} variant="outlined">Print last exchange</Button> : null}</Stack>
        </Stack>
        {!drawer ? <Card sx={{ border: 1, borderColor: "warning.main", p: 2 }}><Stack direction="row" gap={1}><WarningAmberRoundedIcon color="warning" /><Box><Typography fontWeight={800}>POS drawer is not open</Typography><Typography color="text.secondary" variant="body2">Open the location drawer before recording an exchange.</Typography></Box></Stack></Card> : null}
        <Card sx={{ p: 2 }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} gap={1} sx={{ mb: 1.25 }}>
            <Chip color="primary" label="1" size="small" />
            <Typography fontWeight={800}>Find the original sale</Typography>
            <Typography color="text.secondary" variant="body2">Scan its barcode or enter the invoice number.</Typography>
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} gap={1}><TextField fullWidth inputRef={lookupInput} label="Original barcode or invoice number" onChange={(event) => setLookupValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void loadOriginal(); } }} slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon /></InputAdornment> } }} value={lookupValue} /><Button disabled={!lookupValue.trim()} onClick={() => void loadOriginal()} variant="contained">Continue</Button></Stack>
          <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">Exchange only, within 7 days. Cash refunds are not available.</Typography>
        </Card>
        {lookup ? <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.05fr) minmax(360px, .95fr)" } }}>
          <Stack spacing={2}>
            <Card sx={{ p: 2 }}>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                <Box>
                  <Stack alignItems="center" direction="row" spacing={1}><Chip color="primary" label="2" size="small" /><Typography fontWeight={900}>Check the returned item</Typography></Stack>
                  <Typography color="text.secondary" sx={{ mt: .5 }} variant="body2">{lookup.sale.invoiceNo} · {lookup.sale.customerName ?? "Walk-in customer"} · {lookup.sale.daysRemaining} day(s) left</Typography>
                </Box>
                <Chip color="success" label="Eligible" />
              </Stack>
              <Divider sx={{ my: 1.5 }} />
              <Stack spacing={1}>
                {lookup.items.map((item) => {
                  const selected = selectedReturns.find((returnItem) => returnItem.stockId === item.stockId);
                  return <Box key={item.stockId} sx={{ border: 1, borderColor: selected ? "primary.main" : "divider", borderRadius: 2, opacity: item.eligible ? 1 : .55, p: 1.25 }}>
                    <Stack alignItems={{ sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={1} justifyContent="space-between">
                      <Box>
                        <Typography fontWeight={800}>{item.productName}</Typography>
                        <Typography color="text.secondary" variant="caption">{item.barcode ?? "No barcode"} · Exchange value {fCurrency(item.returnAmount)}</Typography>
                      </Box>
                      {item.eligible ? <Stack alignItems="center" direction="row" gap={1}>
                        {selected ? <>
                          <TextField label="Item condition" onChange={(event) => setReturnDisposition(item.stockId, event.target.value as "restock" | "damage")} select SelectProps={{ native: true }} size="small" value={selected.disposition}>
                            <option value="restock">Good — return to stock</option>
                            <option value="damage">Damaged — hold for approval</option>
                          </TextField>
                          <Button color="inherit" onClick={() => toggleReturn(item.stockId)} size="small">Remove</Button>
                        </> : <Button onClick={() => toggleReturn(item.stockId)} size="small" variant="outlined">Return this item</Button>}
                      </Stack> : <Chip label="Already returned / unavailable" size="small" />}
                    </Stack>
                  </Box>;
                })}
              </Stack>
            </Card>
            <Card sx={{ p: 2 }}>
              <Stack alignItems="center" direction="row" spacing={1} sx={{ mb: 1 }}><Chip color="primary" label="3" size="small" /><Typography fontWeight={800}>Add the replacement item</Typography></Stack>
              <Typography color="text.secondary" sx={{ mb: 1.25 }} variant="body2">Scan the new item barcode. Its price is compared automatically.</Typography>
              <Autocomplete filterOptions={(options) => options} getOptionLabel={(item) => `${item.productName} · ${fCurrency(Number(item.mrpPrice))}`} inputValue={replacementSearch} onChange={(_event, item) => addReplacement(item)} onInputChange={(_event, value) => setReplacementSearch(value)} options={replacementOptions} renderInput={(params) => <TextField {...params} inputRef={replacementInput} label="Scan or search replacement item" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void addExactReplacement(); } }} />} />
              <Stack spacing={1} sx={{ mt: 1.5 }}>{replacements.length ? replacements.map((item) => <Stack key={item.stockId} alignItems="center" direction="row" justifyContent="space-between" sx={{ borderBottom: 1, borderColor: "divider", pb: 1 }}><Box><Typography fontWeight={700}>{item.productName}</Typography><Typography color="text.secondary" variant="caption">{item.barcode ?? `Stock #${item.stockId}`}</Typography></Box><Stack alignItems="center" direction="row"><Typography fontWeight={800}>{fCurrency(item.unitPrice)}</Typography><IconButton color="error" onClick={() => setReplacements((current) => current.filter((replacement) => replacement.stockId !== item.stockId))}><DeleteOutlineRoundedIcon /></IconButton></Stack></Stack>) : <Typography color="text.secondary" textAlign="center" variant="body2">No replacement item yet — scan one above.</Typography>}</Stack>
            </Card>
          </Stack>
          <Stack spacing={2}>
            <Card sx={{ p: 2 }}>
              <Stack alignItems="center" direction="row" spacing={1} sx={{ mb: 1 }}><Chip color="primary" label="4" size="small" /><Typography fontWeight={800}>Confirm exchange</Typography></Stack>
              <Stack spacing={.7}>
                <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">Returned item value</Typography><Typography>{fCurrency(returnCredit)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography color="text.secondary">New item total</Typography><Typography>{fCurrency(replacementTotal)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography fontWeight={900} variant="h6">Customer pays</Typography><Typography color="primary.main" fontWeight={900} variant="h6">{fCurrency(balance)}</Typography></Stack>
              </Stack>
              {balance > 0 ? <><Divider sx={{ my: 1.5 }} /><Typography fontWeight={800} mb={.5}>Collect extra payment</Typography><Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">The replacement costs more. Record the extra {fCurrency(balance)} below.</Typography><Stack spacing={1}>{payments.map((payment, index) => <Box key={`${payment.method}-${index}`} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1 }}><Stack direction="row" gap={1}><TextField fullWidth label="Payment method" onChange={(event) => updatePayment(index, { method: event.target.value as PaymentMethod, referenceNo: "" })} select SelectProps={{ native: true }} size="small" value={payment.method}>{methods.filter(({ value }) => value === payment.method || !payments.some((line, lineIndex) => lineIndex !== index && line.method === value)).map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}</TextField>{payments.length > 1 ? <IconButton color="error" onClick={() => setPayments((current) => current.filter((_payment, paymentIndex) => paymentIndex !== index))}><DeleteOutlineRoundedIcon /></IconButton> : null}</Stack><TextField fullWidth inputProps={{ inputMode: "decimal" }} label="Amount" onChange={(event) => updatePayment(index, { amount: amount(event.target.value) })} size="small" sx={{ mt: 1 }} value={String(payment.amount)} />{payment.method !== "cash" ? <TextField fullWidth label="Reference number" onChange={(event) => updatePayment(index, { referenceNo: event.target.value })} required size="small" sx={{ mt: 1 }} value={payment.referenceNo} /> : null}</Box>)}</Stack><Button disabled={payments.length >= methods.length} onClick={addPayment} size="small" sx={{ mt: 1 }} variant="outlined">Split payment</Button><Typography color={collectionDifference === 0 ? "success.main" : "warning.main"} fontWeight={800} sx={{ mt: 1 }} variant="body2">{collectionDifference === 0 ? "Payment is ready" : collectionDifference > 0 ? `Still to collect: ${fCurrency(collectionDifference)}` : `Too much entered: ${fCurrency(Math.abs(collectionDifference))}`}</Typography></> : <Typography color="success.main" fontWeight={800} sx={{ mt: 1.5 }} variant="body2">No extra payment needed.</Typography>}
              <TextField fullWidth helperText="Optional. This is saved for staff reference only." label="Exchange note" onChange={(event) => setReason(event.target.value)} size="small" sx={{ mt: 1.5 }} value={reason} />
              <Button disabled={saving || !drawer || !selectedReturns.length || !replacements.length || replacementTotal < returnCredit || Math.abs(collectionDifference) > .009} fullWidth onClick={() => void complete()} size="large" startIcon={<ReplayRoundedIcon />} sx={{ mt: 2 }} variant="contained">Complete & print exchange bill</Button>
            </Card>
          </Stack>
        </Box> : null}
        <Card sx={{ p: 2 }}><Typography fontWeight={800} mb={1}>Recent exchange bills</Typography>{history.length ? <Stack divider={<Divider flexItem />}>{history.map((item) => <Stack key={item.id} direction={{ xs: "column", sm: "row" }} alignItems={{ sm: "center" }} justifyContent="space-between" gap={1} py={1}><Box><Typography fontWeight={800}>{item.returnNo}</Typography><Typography color="text.secondary" variant="caption">Original {item.originalInvoiceNo} · {item.customerName ?? "Walk-in customer"}</Typography></Box><Stack direction="row" alignItems="center" gap={1}><Typography fontWeight={800}>{fCurrency(Number(item.exchangeTotal))}</Typography><Button onClick={() => void getSaleReturn(item.id).then(printSaleExchangeReceipt).catch((error) => toast.error(error instanceof Error ? error.message : "Unable to load exchange bill."))} size="small" startIcon={<LocalPrintshopOutlinedIcon />}>Print</Button></Stack></Stack>)}</Stack> : <Typography color="text.secondary" variant="body2">No exchange bills recorded at this location.</Typography>}</Card>
      </Stack>
    </Box>
  </>;
}
