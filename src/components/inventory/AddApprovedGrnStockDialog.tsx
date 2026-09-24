import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import { Box, Button, Card, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControlLabel, Stack, Switch, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { addGrnStock, getGrn, type GrnDetail, type GrnUnit, type StockReceivingNote } from "../../redux/slices/purchaseRedux/grnRedux";
import { downloadStockReceivingNote } from "../../utils/downloadStockReceivingNote";
import { fCurrency } from "../../utils/formatNumber";
import { exportBarTenderCsv, printBarcodes, printPriceTags } from "../../utils/printBarcodes";

type Unit = GrnUnit & { identifierType?: "imei" | "serial"; identifierValue?: string };
type Item = { grnItemId: number; lowestSellingPrice: string; mrpPrice: string; productId: number; productName: string; productSku: string | null; remaining: number; quantity: number; unitCost: string; units: Unit[] };
type Props = { grnId: number | null; onClose: () => void; onCompleted: () => void };
type PrintableBarcode = { barcode: string; mrpPrice: string; productName: string | null; productSku: string | null };

const blankUnit = (): Unit => ({ generateBarcode: true, identifiers: [] });
const integer = (value: string) => (/^\d*$/.test(value) ? Number(value || 0) : 0);
const money = (value: string) => {
  const normalized = value.replace(/[^\d.]/g, "");
  const [whole = "", ...decimalParts] = normalized.split(".");
  return decimalParts.length ? `${whole}.${decimalParts.join("").slice(0, 2)}` : whole;
};
const priceMissing = (item: Pick<Item, "lowestSellingPrice" | "mrpPrice">) => Number(item.lowestSellingPrice) <= 0 || Number(item.mrpPrice) <= 0;
const toItems = (detail: GrnDetail): Item[] => detail.items.filter((item) => item.stockedQuantity < item.quantity).map((item) => {
  const remaining = item.quantity - item.stockedQuantity;
  return { grnItemId: item.id, lowestSellingPrice: item.lowestSellingPrice, mrpPrice: item.mrpPrice, productId: item.productId, productName: item.productName, productSku: item.productSku, remaining, quantity: remaining, unitCost: item.unitCost, units: Array.from({ length: remaining }, blankUnit) };
});

export default function AddApprovedGrnStockDialog({ grnId, onClose, onCompleted }: Props) {
  const [detail, setDetail] = useState<GrnDetail | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [saving, setSaving] = useState(false);
  const [printItems, setPrintItems] = useState<PrintableBarcode[]>([]);
  const [stockReceivingNote, setStockReceivingNote] = useState<StockReceivingNote | null>(null);
  const [downloadingNote, setDownloadingNote] = useState(false);

  useEffect(() => {
    if (!grnId) return;
    setDetail(null);
    setItems([]);
    getGrn(grnId).then((value) => {
      if (value.status !== "approved") throw new Error("Only final-approved GRNs can be added to stock.");
      setDetail(value);
      setItems(toItems(value));
    }).catch((error) => {
      toast.error(error instanceof Error ? error.message : "Unable to load the approved receipt.");
      onClose();
    });
  }, [grnId, onClose]);

  const updateItem = (grnItemId: number, patch: Partial<Item>) => setItems((current) => current.map((item) => item.grnItemId === grnItemId ? { ...item, ...patch } : item));
  const updateUnit = (grnItemId: number, index: number, patch: Partial<Unit>) => setItems((current) => current.map((item) => item.grnItemId !== grnItemId ? item : { ...item, units: item.units.map((unit, unitIndex) => unitIndex === index ? { ...unit, ...patch } : unit) }));

  const submit = async () => {
    if (!detail) return;
    const selectedItems = items.filter((item) => item.quantity > 0);
    const payload = selectedItems.map((item) => ({
      grnItemId: item.grnItemId,
      units: item.units.slice(0, item.quantity).map(({ barcode, generateBarcode, identifiers }) => ({ barcode: barcode?.trim() || undefined, generateBarcode, identifiers: identifiers?.filter((identifier) => identifier.value.trim()).map((identifier) => ({ ...identifier, value: identifier.value.trim() })) ?? [] })),
    }));
    if (!payload.length) { toast.error("Choose at least one unit to add to stock."); return; }
    if (selectedItems.some((item) => priceMissing(item))) { toast.error("Enter MRP and lowest selling price before adding stock."); return; }
    if (selectedItems.some((item) => Number(item.lowestSellingPrice) > Number(item.mrpPrice))) { toast.error("Lowest selling price cannot exceed MRP."); return; }
    const priceUpdates = Array.from(new Map(selectedItems.map((item) => [item.productId, { lowestSellingPrice: Number(item.lowestSellingPrice), mrpPrice: Number(item.mrpPrice), productId: item.productId }])).values());
    setSaving(true);
    try {
      const updated = await addGrnStock(detail.id, { items: payload, priceUpdates });
      const printable = selectedItems.flatMap((selected) => {
        const updatedItem = updated.items.find((item) => item.id === selected.grnItemId);
        return (updatedItem?.units ?? []).slice(-selected.quantity).map((unit) => ({ barcode: unit.barcode ?? "", mrpPrice: selected.mrpPrice, productName: updatedItem?.productName ?? selected.productName, productSku: updatedItem?.productSku ?? selected.productSku }));
      });
      setPrintItems(printable);
      setStockReceivingNote(updated.stockReceivingNotes[0] ?? null);
      toast.success("Stock units added successfully.");
      onCompleted();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to add stock.");
    } finally {
      setSaving(false);
    }
  };

  const finishStockAddition = () => { setPrintItems([]); setStockReceivingNote(null); onClose(); };
  const printBarcodesNow = () => { try { printBarcodes(printItems); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to print barcodes."); } };
  const printPriceTagsNow = () => { try { printPriceTags(printItems); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to print price tags."); } };
  const exportCsv = () => { try { exportBarTenderCsv(printItems); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to export barcodes."); } };
  const downloadReceivingNote = async () => {
    if (!detail || !stockReceivingNote) return;
    setDownloadingNote(true);
    try {
      await downloadStockReceivingNote(stockReceivingNote, detail.grnNumber, detail.poNumber);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to download the stock receiving note.");
    } finally {
      setDownloadingNote(false);
    }
  };

  return <>
    <Dialog fullScreen fullWidth onClose={onClose} open={Boolean(grnId)} PaperProps={{ sx: { borderRadius: { md: 3 }, height: { xs: "100%", md: "calc(100% - 48px)" }, m: { md: 3 }, maxWidth: { md: 1500 } } }}>
      <DialogTitle component="div"><Typography variant="h5">Add Approved GRN to Stock</Typography><Typography color="text.secondary" variant="body2">{detail ? `${detail.grnNumber} • ${detail.supplierName} • ${detail.locationName}` : "Loading receipt…"}</Typography></DialogTitle>
      <Divider />
      <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          {items.map((item) => <Card key={item.grnItemId} variant="outlined" sx={{ p: 2 }}>
            <Stack direction={{ xs: "column", md: "row" }} gap={2} justifyContent="space-between">
              <Box><Typography fontWeight={700}>{item.productName}</Typography><Typography color="text.secondary" variant="caption">{item.productSku || "No product code"} • {item.remaining} unit{item.remaining === 1 ? "" : "s"} ready • Final cost {fCurrency(Number(item.unitCost))}</Typography></Box>
              <TextField inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }} label="Add quantity" onChange={(event) => { const quantity = Math.min(item.remaining, integer(event.target.value)); updateItem(item.grnItemId, { quantity, units: Array.from({ length: quantity }, (_, index) => item.units[index] ?? blankUnit()) }); }} size="small" type="text" value={item.quantity} sx={{ width: { xs: "100%", md: 170 } }} />
            </Stack>
            {item.quantity ? <>
              <Box sx={{ bgcolor: priceMissing(item) ? "warning.lighter" : "action.hover", border: 1, borderColor: priceMissing(item) ? "warning.main" : "divider", borderRadius: 2, display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 160px 180px 180px" }, mt: 2, p: 1.5 }}>
                <Box><Typography fontWeight={700} variant="body2">Pricing checkpoint</Typography><Typography color="text.secondary" variant="caption">Review final cost before setting selling prices.</Typography></Box>
                <TextField disabled label="Final cost" size="small" value={fCurrency(Number(item.unitCost))} />
                <TextField inputProps={{ inputMode: "decimal", pattern: "[0-9]*[.]?[0-9]{0,2}" }} label="MRP" onChange={(event) => updateItem(item.grnItemId, { mrpPrice: money(event.target.value) })} size="small" type="text" value={item.mrpPrice} />
                <TextField inputProps={{ inputMode: "decimal", pattern: "[0-9]*[.]?[0-9]{0,2}" }} label="Lowest selling" onChange={(event) => updateItem(item.grnItemId, { lowestSellingPrice: money(event.target.value) })} size="small" type="text" value={item.lowestSellingPrice} />
              </Box>
              <Stack divider={<Divider flexItem />} mt={2} spacing={0}>
                {item.units.slice(0, item.quantity).map((unit, index) => <Stack direction={{ xs: "column", lg: "row" }} gap={1.5} key={index} py={1.5}>
                  <Typography fontWeight={700} sx={{ minWidth: 68 }} variant="body2">Unit {index + 1}</Typography>
                  <FormControlLabel control={<Switch checked={Boolean(unit.generateBarcode)} onChange={(event) => updateUnit(item.grnItemId, index, { barcode: event.target.checked ? undefined : unit.barcode, generateBarcode: event.target.checked })} size="small" />} label="Generate barcode" />
                  <TextField disabled={unit.generateBarcode} label="Barcode" onChange={(event) => updateUnit(item.grnItemId, index, { barcode: event.target.value })} size="small" value={unit.barcode ?? ""} sx={{ minWidth: 190 }} />
                  <TextField label="IMEI / serial (optional)" onChange={(event) => updateUnit(item.grnItemId, index, { identifiers: event.target.value.trim() ? [{ isPrimary: true, type: "serial", value: event.target.value }] : [] })} size="small" value={unit.identifiers?.[0]?.value ?? ""} sx={{ minWidth: 220 }} />
                </Stack>)}
              </Stack>
            </> : null}
          </Card>)}
          {detail && !items.length ? <Typography color="text.secondary" py={5} textAlign="center">All units from this GRN have already been added to stock.</Typography> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ borderTop: 1, borderColor: "divider", p: 2 }}><Button color="inherit" onClick={onClose}>Cancel</Button><Button disabled={saving || !items.some((item) => item.quantity > 0)} onClick={() => void submit()} startIcon={<Inventory2OutlinedIcon />} variant="contained">Add to Stock</Button></DialogActions>
    </Dialog>
    <Dialog fullWidth maxWidth="sm" onClose={finishStockAddition} open={Boolean(stockReceivingNote)}>
      <DialogTitle>Stock added successfully</DialogTitle>
      <DialogContent><Stack spacing={1.5} pt={1}><Typography color="text.secondary" variant="body2">{printItems.length} stock unit{printItems.length === 1 ? "" : "s"} added. One supplier receiving note was created for this stock-add batch, including each product, cost, MRP, quantity, and barcode number.</Typography><Typography fontWeight={700}>{stockReceivingNote?.noteNumber}</Typography><Typography color="text.secondary" variant="caption">Barcode labels and price tags both use the same 30 mm × 20 mm label size. Price tags contain only the MoBee.lk logo, selected product or variation name, and MRP.</Typography></Stack></DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}><Button color="inherit" onClick={finishStockAddition}>Done</Button><Button disabled={downloadingNote} onClick={() => void downloadReceivingNote()} startIcon={<PictureAsPdfRoundedIcon />} variant="contained">{downloadingNote ? "Preparing PDF..." : "Download receiving note"}</Button><Button disabled={!printItems.some((item) => item.barcode)} onClick={exportCsv} startIcon={<DownloadRoundedIcon />} variant="outlined">Export BarTender CSV</Button><Button disabled={!printItems.some((item) => item.barcode)} onClick={printBarcodesNow} startIcon={<PrintRoundedIcon />} variant="outlined">Print Barcodes</Button><Button onClick={printPriceTagsNow} startIcon={<PrintRoundedIcon />} variant="outlined">Print Price Tags</Button></DialogActions>
    </Dialog>
  </>;
}
