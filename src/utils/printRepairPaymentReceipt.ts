import type { RepairPayment, RepairJobDetail } from "../redux/slices/repairRedux/repairRedux";
import { fCurrency } from "./formatNumber";

const BUSINESS_NAME = "MoBee.lk (PVT) Ltd.";
const BUSINESS_PHONE = "0728920900";
const BUSINESS_ADDRESS = "35/B Ingiriya Rd, Padukka";

const escapeHtml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const paymentMethodLabel: Record<RepairPayment["method"], string> = {
  bankTransfer: "Bank transfer",
  card: "Card",
  cash: "Cash",
  mobile: "Mobile payment",
};

export const printRepairPaymentReceipt = (job: RepairJobDetail, payment: RepairPayment) => {
  const printedAt = new Date().toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
  const receivedAt = new Date(payment.timestamp).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
  const paymentNo = `RCP-${job.jobNo}-${String(payment.id).padStart(5, "0")}`;
  const win = window.open("", "_blank", "width=420,height=720");
  if (!win) throw new Error("Popup blocked. Allow popups to print the repair payment receipt.");

  win.document.write(`<!doctype html>
<html>
<head>
  <title>${escapeHtml(paymentNo)}</title>
  <style>
    @page { margin: 0; size: 80mm auto; }
    * { box-sizing: border-box; }
    html, body { margin: 0; min-height: 0; padding: 0; width: 80mm; }
    body { color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; line-height: 1.16; }
    .receipt { margin: 0 auto; padding: 2mm 3mm 1.5mm; width: 80mm; }
    .center { text-align: center; }
    .business { font-size: 9.5px; line-height: 1.18; }
    .business strong { font-size: 12px; }
    h1 { font-size: 13px; letter-spacing: 1.8px; margin: 1.4mm 0 .8mm; text-transform: uppercase; }
    .line { border-top: 1px dashed #222; margin: 1mm 0; }
    .row { display: flex; gap: 2mm; justify-content: space-between; margin: .55mm 0; }
    .row span:first-child { color: #555; }
    .row strong { max-width: 46mm; overflow-wrap: anywhere; text-align: right; }
    .total { border-top: 1px solid #111; font-size: 13px; margin-top: .8mm; padding-top: .65mm; }
    .balance { font-weight: 900; }
    .paid { color: #087f23; }
    .due { color: #b42318; }
    .device { font-size: 12px; font-weight: 800; overflow-wrap: anywhere; }
    .muted { color: #666; }
    p { margin: 0; }
    @media print {
      html, body { margin: 0 !important; padding: 0 !important; width: 80mm !important; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <main class="receipt">
    <p class="business center"><strong>${BUSINESS_NAME}</strong><br/>${BUSINESS_ADDRESS}<br/>${BUSINESS_PHONE}</p>
    <div class="line"></div>
    <h1 class="center">Repair Payment</h1>
    <div class="row"><span>Receipt #</span><strong>${escapeHtml(paymentNo)}</strong></div>
    <div class="row"><span>Received</span><strong>${escapeHtml(receivedAt)}</strong></div>
    <div class="row"><span>Cashier</span><strong>${escapeHtml(payment.receivedByName)}</strong></div>
    <div class="row"><span>Location</span><strong>${escapeHtml(job.locationName)}</strong></div>
    <div class="line"></div>
    <div class="row"><span>Repair job</span><strong>${escapeHtml(job.jobNo)}</strong></div>
    <div class="row"><span>Customer</span><strong>${escapeHtml(job.customerName)}</strong></div>
    <div class="row"><span>Phone</span><strong>${escapeHtml(job.customerPhone ?? "—")}</strong></div>
    <p class="device">${escapeHtml(job.deviceName)}</p>
    <div class="line"></div>
    <div class="row"><span>Repair total</span><strong>${escapeHtml(fCurrency(Number(job.finalCost)))}</strong></div>
    <div class="row"><span>Payment method</span><strong>${escapeHtml(paymentMethodLabel[payment.method])}</strong></div>
    ${payment.referenceNo ? `<div class="row"><span>Reference</span><strong>${escapeHtml(payment.referenceNo)}</strong></div>` : ""}
    <div class="row total"><span>Received now</span><strong>${escapeHtml(fCurrency(Number(payment.amount)))}</strong></div>
    <div class="row"><span>Total paid</span><strong>${escapeHtml(fCurrency(job.totalPaid))}</strong></div>
    <div class="row balance ${job.balance === 0 ? "paid" : "due"}"><span>Balance</span><strong>${escapeHtml(fCurrency(job.balance))}</strong></div>
    <div class="line"></div>
    <p class="center muted">${job.balance === 0 ? "Payment complete. Thank you." : "Partial payment received. Balance remains due."}</p>
    <p class="center muted" style="margin-top: .9mm">Printed ${escapeHtml(printedAt)}</p>
  </main>
  <script>window.addEventListener("load", () => setTimeout(() => { window.focus(); window.print(); }, 150));</script>
</body>
</html>`);
  win.document.close();
};
