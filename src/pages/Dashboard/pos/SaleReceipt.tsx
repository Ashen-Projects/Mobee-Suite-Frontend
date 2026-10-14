import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import KeyboardRoundedIcon from "@mui/icons-material/KeyboardRounded";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import { Box, Button, Card, Chip, CircularProgress, Divider, Stack, Typography } from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import { getSale, type SaleDetail } from "../../../redux/slices/posRedux/saleRedux";
import { PATH_DASHBOARD } from "../../../routes/paths";
import { fCurrency } from "../../../utils/formatNumber";
import { printSaleReceipt } from "../../../utils/printSaleReceipt";

const BUSINESS_NAME = "MoBee.lk (PVT) Ltd.";
const BUSINESS_ADDRESS = "35/B Ingiriya Rd, Padukka";
const BUSINESS_PHONE = "0728920900";

const paymentLabel = (method: SaleDetail["payments"][number]["method"]) => ({
  bankTransfer: "Bank transfer",
  card: "Card",
  cash: "Cash",
  mobile: "Mobile payment",
}[method]);

const warrantyLabel = (periodMonths: number, warrantyType: string | null) => {
  if (!periodMonths || !warrantyType) return null;
  const duration = periodMonths === 12 ? "1 year" : `${periodMonths} months`;
  const type = warrantyType.replace(/(^|_)([a-z])/g, (_match, prefix: string, letter: string) => `${prefix} ${letter.toUpperCase()}`).trim();
  return `${duration} ${type} warranty`;
};

export default function SaleReceipt() {
  const navigate = useNavigate();
  const { saleId: saleIdParam } = useParams();
  const [sale, setSale] = useState<SaleDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saleId = Number(saleIdParam);
    if (!Number.isInteger(saleId) || saleId <= 0) {
      setError("This receipt reference is invalid.");
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    void getSale(saleId)
      .then((value) => { if (active) setSale(value); })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Unable to load this receipt."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [saleIdParam]);

  const startNewSale = useCallback(() => {
    navigate(`${PATH_DASHBOARD.pos.newSale}?mode=pos`, { replace: true });
  }, [navigate]);
  const issuedAt = sale ? new Intl.DateTimeFormat("en-LK", { dateStyle: "medium", timeStyle: "short" }).format(new Date(sale.timestamp)) : "";

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if (event.key === "F2") {
        event.preventDefault();
        startNewSale();
      }
      if (sale && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        printSaleReceipt(sale);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [sale, startNewSale]);

  return <>
    <PageMeta description="Review a completed sale and print the customer receipt." title="Sale Receipt | Mobee Suite" />
    <Box sx={{ bgcolor: "background.default", inset: 0, overflow: "auto", p: { xs: 1.5, md: 3 }, position: "fixed", zIndex: (theme) => theme.zIndex.modal - 1 }}>
      <Stack spacing={2.25} sx={{ mx: "auto", width: "min(1120px, 100%)" }}>
        <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={1.25} justifyContent="space-between">
          <Stack alignItems="center" direction="row" spacing={1}>
            <CheckCircleRoundedIcon color="success" />
            <Box><Typography variant="h4">Sale saved</Typography><Typography color="text.secondary" variant="body2">Review the invoice or continue straight to the next customer.</Typography></Box>
          </Stack>
          <Button color="inherit" onClick={() => navigate(PATH_DASHBOARD.pos.root)} startIcon={<ArrowBackRoundedIcon />} variant="outlined">Back to POS</Button>
        </Stack>

        {loading ? <Card sx={{ display: "grid", minHeight: 360, placeItems: "center" }}><CircularProgress /></Card> : null}
        {error ? <Card sx={{ p: 3, textAlign: "center" }}><Stack alignItems="center" spacing={1.5}><Typography variant="h6">Receipt unavailable</Typography><Typography color="text.secondary">{error}</Typography><Button onClick={startNewSale} startIcon={<AddRoundedIcon />} variant="contained">Start new sale</Button></Stack></Card> : null}

        {sale ? <Card sx={{ border: 1, borderColor: "success.main", p: { xs: 1.5, md: 2 } }}>
          <Stack alignItems={{ xs: "stretch", lg: "center" }} direction={{ xs: "column", lg: "row" }} gap={2} justifyContent="space-between">
            <Stack alignItems="center" direction="row" gap={1.25}>
              <Box sx={{ alignItems: "center", bgcolor: "success.main", borderRadius: "50%", color: "success.contrastText", display: "flex", height: 48, justifyContent: "center", width: 48 }}><CheckCircleRoundedIcon /></Box>
              <Box><Typography fontWeight={900} variant="h6">Payment received</Typography><Typography color="text.secondary" variant="body2">{sale.invoiceNo} · {sale.customerName}</Typography></Box>
            </Stack>
            <Stack alignItems={{ xs: "stretch", sm: "center" }} direction={{ xs: "column", sm: "row" }} gap={1.25}>
              <Box sx={{ textAlign: { xs: "left", sm: "right" } }}><Typography color="text.secondary" variant="caption">SALE TOTAL</Typography><Typography color="primary.main" fontWeight={900} variant="h5">{fCurrency(Number(sale.totalAmount))}</Typography></Box>
              <Button onClick={() => printSaleReceipt(sale)} startIcon={<LocalPrintshopOutlinedIcon />} variant="outlined">Print receipt</Button>
              <Button onClick={startNewSale} size="large" startIcon={<AddRoundedIcon />} variant="contained">Start next sale</Button>
            </Stack>
          </Stack>
          <Stack direction="row" spacing={.75} sx={{ mt: 1.5 }}><KeyboardRoundedIcon color="action" fontSize="small" /><Typography color="text.secondary" variant="caption">Press F2 to start the next sale. Press Ctrl/Cmd + P to print this receipt.</Typography></Stack>
        </Card> : null}

        {sale ? <Card sx={{ overflow: "hidden" }}>
          <Stack alignItems={{ xs: "stretch", md: "center" }} direction={{ xs: "column", md: "row" }} gap={1.5} justifyContent="space-between" sx={{ bgcolor: "action.hover", borderBottom: 1, borderColor: "divider", p: { xs: 1.5, md: 2 } }}>
            <Stack alignItems="center" direction="row" spacing={1.25}>
              <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: 2, color: "primary.contrastText", display: "flex", height: 42, justifyContent: "center", width: 42 }}><ReceiptLongRoundedIcon /></Box>
              <Box><Typography fontWeight={900}>{sale.invoiceNo}</Typography><Typography color="text.secondary" variant="body2">Issued {issuedAt}</Typography></Box>
              <Chip color="success" label="Paid" size="small" />
            </Stack>
            <Typography color="text.secondary" variant="body2">A completed customer invoice</Typography>
          </Stack>

          <Box sx={{ p: { xs: 2, md: 4 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} gap={3} justifyContent="space-between">
              <Box>
                <Typography fontWeight={900} variant="h5">{BUSINESS_NAME}</Typography>
                <Typography color="text.secondary" sx={{ mt: .5 }} variant="body2">{BUSINESS_ADDRESS}<br />{BUSINESS_PHONE}</Typography>
              </Box>
              <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                <Typography color="text.secondary" fontWeight={800} variant="overline">Bill to</Typography>
                <Typography fontWeight={800}>{sale.customerName}</Typography>
                <Typography color="text.secondary" variant="body2">{sale.customerPhone}</Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />
            <Box sx={{ display: { xs: "none", md: "grid" }, gap: 1.5, gridTemplateColumns: "minmax(0, 1fr) 92px 122px 126px", pb: 1 }}>
              <Typography color="text.secondary" fontWeight={800} variant="caption">ITEM</Typography>
              <Typography color="text.secondary" fontWeight={800} textAlign="right" variant="caption">QTY</Typography>
              <Typography color="text.secondary" fontWeight={800} textAlign="right" variant="caption">UNIT PRICE</Typography>
              <Typography color="text.secondary" fontWeight={800} textAlign="right" variant="caption">TOTAL</Typography>
            </Box>
            <Stack divider={<Divider flexItem />}>
              {sale.items.map((item) => {
                const warranty = warrantyLabel(item.warrantyPeriodMonths, item.warrantyType);
                return <Box key={item.id} sx={{ py: 1.6 }}>
                  <Box sx={{ display: "grid", gap: { xs: .75, md: 1.5 }, gridTemplateColumns: { xs: "1fr auto", md: "minmax(0, 1fr) 92px 122px 126px" } }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={800}>{item.productName}</Typography>
                      <Typography color="text.secondary" variant="caption">{item.productSku ?? `Product #${item.productId}`}</Typography>
                      {warranty ? <Typography color="success.main" display="block" fontWeight={700} sx={{ mt: .35 }} variant="caption">Warranty: {warranty}</Typography> : null}
                    </Box>
                    <Typography textAlign={{ xs: "right", md: "right" }}><Box component="span" sx={{ color: "text.secondary", display: { xs: "inline", md: "none" }, mr: .5 }}>Qty</Box>{item.quantity}</Typography>
                    <Typography sx={{ display: { xs: "none", md: "block" }, textAlign: "right" }}>{fCurrency(Number(item.unitPrice))}</Typography>
                    <Typography fontWeight={800} textAlign="right">{fCurrency(Number(item.totalAmount))}</Typography>
                  </Box>
                  <Typography color="text.secondary" sx={{ display: { xs: "block", md: "none" }, mt: .35 }} variant="caption">Unit price {fCurrency(Number(item.unitPrice))}</Typography>
                </Box>;
              })}
            </Stack>

            <Stack alignItems="flex-end" spacing={.75} sx={{ mt: 3 }}>
              <Stack direction="row" justifyContent="space-between" sx={{ width: { xs: "100%", sm: 350 } }}><Typography color="text.secondary">Subtotal</Typography><Typography>{fCurrency(Number(sale.subTotal))}</Typography></Stack>
              <Stack direction="row" justifyContent="space-between" sx={{ width: { xs: "100%", sm: 350 } }}><Typography color="text.secondary">Discount</Typography><Typography>{fCurrency(Number(sale.discountAmount))}</Typography></Stack>
              <Divider flexItem sx={{ maxWidth: 350, my: .25 }} />
              <Stack direction="row" justifyContent="space-between" sx={{ width: { xs: "100%", sm: 350 } }}><Typography fontWeight={900} variant="h6">Total</Typography><Typography color="primary.main" fontWeight={900} variant="h6">{fCurrency(Number(sale.totalAmount))}</Typography></Stack>
            </Stack>

            <Divider sx={{ my: 3 }} />
            <Stack direction={{ xs: "column", md: "row" }} gap={2} justifyContent="space-between">
              <Box><Typography fontWeight={800}>Payment</Typography><Stack spacing={.4} sx={{ mt: .8 }}>{sale.payments.map((payment) => <Typography color="text.secondary" key={payment.id} variant="body2">{paymentLabel(payment.method)}{payment.referenceNo ? ` · ${payment.referenceNo}` : ""}</Typography>)}</Stack></Box>
              <Box sx={{ textAlign: { xs: "left", md: "right" } }}><Typography color="text.secondary" variant="body2">Cashier: {sale.userName}</Typography><Typography color="text.secondary" variant="body2">Location: {sale.locationName}</Typography></Box>
            </Stack>
          </Box>
          <Box sx={{ bgcolor: "action.hover", borderTop: 1, borderColor: "divider", p: 2, textAlign: "center" }}><Typography fontWeight={800}>Thank you for your purchase.</Typography><Typography color="text.secondary" variant="caption">Keep this receipt for warranty claims.</Typography></Box>
        </Card> : null}
        {sale ? <Stack alignItems="center" direction={{ xs: "column", sm: "row" }} gap={1.25} justifyContent="flex-end"><Button onClick={() => printSaleReceipt(sale)} startIcon={<LocalPrintshopOutlinedIcon />} variant="outlined">Print receipt</Button><Button onClick={startNewSale} size="large" startIcon={<AddRoundedIcon />} variant="contained">Start next sale</Button></Stack> : null}
      </Stack>
    </Box>
  </>;
}
