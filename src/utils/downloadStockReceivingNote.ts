import type { StockReceivingNote } from "../redux/slices/purchaseRedux/grnRedux";

const A4_WIDTH = 210;
const A4_HEIGHT = 297;
const CONTENT_BOTTOM = 262;
const LETTERHEAD_URL = `${import.meta.env.BASE_URL}mobee-letterhead.png`;

const formatDateTime = (timestamp: number) => new Intl.DateTimeFormat("en-LK", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Colombo",
}).format(new Date(timestamp));

const formatMoney = (value: number | string) => `LKR ${Number(value || 0).toLocaleString("en-LK", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
})}`;

const safeFilename = (value: string) => value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "stock-receiving-note";

const loadLetterhead = async () => new Promise<HTMLImageElement>((resolve, reject) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error("The MoBee receiving-note letterhead could not be loaded."));
  image.src = LETTERHEAD_URL;
});

/**
 * Downloads an immutable, A4 supplier receiving note for one Add to Stock batch.
 * Product, price and barcode values are snapshots returned by the API, so a later
 * product rename or price change cannot alter a previously issued note.
 */
export const createStockReceivingNoteFile = async (note: StockReceivingNote, grnNumber: string, purchaseOrderNumber: string): Promise<File> => {
  const [{ jsPDF }, letterhead] = await Promise.all([import("jspdf"), loadLetterhead()]);
  const pdf = new jsPDF({ compress: true, format: "a4", orientation: "portrait", unit: "mm" });
  const totalUnits = note.items.reduce((total, item) => total + item.quantity, 0);
  const totalCost = note.items.reduce((total, item) => total + Number(item.unitCost) * item.quantity, 0);

  const drawPage = () => {
    pdf.addImage(letterhead, "PNG", 0, 0, A4_WIDTH, A4_HEIGHT, undefined, "FAST");
    pdf.setTextColor(31, 36, 40);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text("STOCK RECEIVING NOTE", 14, 66);
    pdf.setDrawColor(220, 151, 4);
    pdf.setLineWidth(0.7);
    pdf.line(14, 70, 196, 70);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    pdf.setTextColor(85, 91, 97);
    pdf.text("Supplier", 14, 79);
    pdf.text("GRN", 14, 85);
    pdf.text("Purchase order", 14, 91);
    pdf.text("Location", 106, 79);
    pdf.text("Issued", 106, 85);
    pdf.text("Prepared by", 106, 91);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(31, 36, 40);
    pdf.text(`${note.supplierCode} - ${note.supplierName}`, 37, 79, { maxWidth: 62 });
    pdf.text(grnNumber, 37, 85);
    pdf.text(purchaseOrderNumber, 37, 91);
    pdf.text(note.locationName, 132, 79, { maxWidth: 62 });
    pdf.text(formatDateTime(note.timestamp), 132, 85, { maxWidth: 62 });
    pdf.text(note.createdByName || "System user", 132, 91, { maxWidth: 62 });

    pdf.setFillColor(31, 36, 40);
    pdf.rect(14, 99, 182, 7, "F");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("PRODUCT", 16, 103.6);
    pdf.text("QTY", 118, 103.6, { align: "right" });
    pdf.text("UNIT COST", 158, 103.6, { align: "right" });
    pdf.text("MRP", 194, 103.6, { align: "right" });
    pdf.setTextColor(31, 36, 40);
  };

  const drawFooter = (y: number) => {
    pdf.setDrawColor(203, 207, 211);
    pdf.setLineWidth(0.3);
    pdf.line(14, y, 196, y);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("Total units received", 14, y + 6);
    pdf.text(String(totalUnits), 89, y + 6, { align: "right" });
    pdf.text("Total cost", 110, y + 6, { align: "right" });
    pdf.text(formatMoney(totalCost), 196, y + 6, { align: "right" });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(85, 91, 97);
    pdf.text(`Receiving note ${note.noteNumber} - Barcode values are recorded at the time stock was added.`, 14, y + 13);
  };

  drawPage();
  let y = 106;
  for (const item of note.items) {
    const productLines = pdf.splitTextToSize(item.productSku ? `${item.productName}\nSKU: ${item.productSku}` : item.productName, 66);
    const barcodeText = item.units.map((unit) => unit.barcode || "No barcode assigned").join(", ");
    const barcodeLines = pdf.splitTextToSize(barcodeText, 174);
    const productRowHeight = Math.max(9.5, productLines.length * 3.9 + 3.8);
    const barcodeRowHeight = Math.max(9, barcodeLines.length * 3.8 + 5.3);
    const groupHeight = productRowHeight + barcodeRowHeight + 2.3;
    if (y + groupHeight + 22 > CONTENT_BOTTOM) {
      drawFooter(CONTENT_BOTTOM - 18);
      pdf.addPage();
      drawPage();
      y = 106;
    }
    pdf.setDrawColor(220, 224, 227);
    pdf.setLineWidth(0.2);
    pdf.rect(14, y, 182, productRowHeight, "S");
    pdf.line(99, y, 99, y + productRowHeight);
    pdf.line(120, y, 120, y + productRowHeight);
    pdf.line(160, y, 160, y + productRowHeight);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.text(productLines, 16, y + 4.3);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.2);
    pdf.text(String(item.quantity), 118, y + 4.3, { align: "right" });
    pdf.text(formatMoney(item.unitCost), 158, y + 4.3, { align: "right" });
    pdf.setFont("helvetica", "bold");
    pdf.text(formatMoney(item.mrpPrice), 194, y + 4.3, { align: "right" });
    pdf.setFont("courier", "normal");
    pdf.setFontSize(7.6);
    pdf.setTextColor(85, 91, 97);
    pdf.text("BARCODES", 16, y + productRowHeight + 3.7);
    pdf.setTextColor(31, 36, 40);
    pdf.text(barcodeLines, 16, y + productRowHeight + 7.2, { maxWidth: 174 });
    y += productRowHeight + barcodeRowHeight;
    pdf.setDrawColor(151, 157, 163);
    pdf.setLineWidth(0.35);
    pdf.line(14, y + 2.3, 196, y + 2.3);
    y += 2.3;
  }
  drawFooter(Math.min(y + 5, CONTENT_BOTTOM - 18));
  const fileName = `${safeFilename(note.noteNumber)}.pdf`;
  return new File([pdf.output("arraybuffer")], fileName, { type: "application/pdf" });
};

export const downloadStockReceivingNote = async (note: StockReceivingNote, grnNumber: string, purchaseOrderNumber: string) => {
  const file = await createStockReceivingNoteFile(note, grnNumber, purchaseOrderNumber);
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.download = file.name;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
