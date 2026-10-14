import type { SaleExchange } from "../redux/slices/posRedux/saleReturnRedux";
import { fCurrency } from "./formatNumber";

const LOGO_URL = "https://res.cloudinary.com/gxsancbf/image/upload/v1788373843/Mo_2.png";
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char] ?? char));
const methodLabel = (method: string) => method === "bankTransfer" ? "Bank transfer" : method === "mobile" ? "Mobile payment" : `${method.charAt(0).toUpperCase()}${method.slice(1)}`;

/** A distinct customer document; it never resembles or replaces the original invoice. */
export const printSaleExchangeReceipt = (exchange: SaleExchange) => {
  const returnedRows = exchange.returnedItems.map((item) => `<tr><td>${escapeHtml(item.productName)}<small>${escapeHtml(item.barcode ?? "No barcode")} · ${item.disposition === "damage" ? "Damage hold" : "Returned to stock"}</small></td><td>${fCurrency(Number(item.refundAmount))}</td></tr>`).join("");
  const replacementRows = exchange.replacements.map((item) => `<tr><td>${escapeHtml(item.productName)}<small>${escapeHtml(item.barcode ?? "No barcode")}</small></td><td>${fCurrency(Number(item.totalAmount))}</td></tr>`).join("");
  const paymentRows = exchange.payments.map((item) => `<div class="line"><span>${escapeHtml(methodLabel(item.method))}${item.referenceNo ? ` · ${escapeHtml(item.referenceNo)}` : ""}</span><b>${fCurrency(Number(item.amount))}</b></div>`).join("");
  const popup = window.open("", "_blank", "width=420,height=720");
  if (!popup) return;
  popup.document.write(`<!doctype html><html><head><title>${escapeHtml(exchange.returnNo)}</title><style>
    @page { margin: 0; size: 80mm auto; } * { box-sizing: border-box; } html,body { margin:0; padding:0; width:80mm; } body { color:#111; font:10.5px Arial,Helvetica,sans-serif; } .r { padding:2mm 2.5mm; width:80mm; } .logo { display:block; margin:auto; max-width:28mm; } h1{text-align:center;font-size:13px;letter-spacing:1.4px;margin:1mm 0}.center{text-align:center}.muted,small{color:#555} .sep{border-top:1px dashed #222;margin:1.4mm 0}.meta,.line{display:flex;justify-content:space-between;gap:3mm;margin:.6mm 0}.meta span:last-child,.line b{text-align:right} h2{font-size:10px;letter-spacing:.5px;margin:1mm 0 .4mm;text-transform:uppercase} table{border-collapse:collapse;width:100%}td{border-top:1px dashed #bbb;padding:.9mm 0;vertical-align:top}td:last-child{text-align:right;white-space:nowrap;font-weight:700}small{display:block;margin-top:.4mm}.total{font-size:13px;font-weight:900;border-top:1px solid #111;padding-top:1mm;margin-top:1mm}.note{font-size:9px;line-height:1.35}.thanks{font-weight:900;text-align:center;margin-top:2mm}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><main class="r">
    <img class="logo" src="${LOGO_URL}"/><p class="center"><b>MoBee.lk (PVT) Ltd.</b><br/>35/B Ingiriya Rd, Padukka<br/>0728920900</p><div class="sep"></div><h1>Return / Exchange Bill</h1>
    <div class="meta"><span>Exchange #</span><b>${escapeHtml(exchange.returnNo)}</b></div><div class="meta"><span>Original invoice</span><b>${escapeHtml(exchange.originalInvoiceNo)}</b></div><div class="meta"><span>Date</span><span>${new Intl.DateTimeFormat("en-LK", { dateStyle:"medium", timeStyle:"short" }).format(new Date(exchange.timestamp))}</span></div><div class="meta"><span>Customer</span><span>${escapeHtml(exchange.customerName ?? "Walk-in Customer")}</span></div>
    <div class="sep"></div><h2>Returned items</h2><table>${returnedRows}</table><div class="line"><span>Return credit</span><b>${fCurrency(Number(exchange.totalAmount))}</b></div>
    <h2>Replacement items</h2><table>${replacementRows}</table><div class="line"><span>Replacement total</span><b>${fCurrency(Number(exchange.exchangeTotal))}</b></div>
    <div class="line total"><span>Balance collected</span><b>${fCurrency(Number(exchange.balanceAmount))}</b></div>${paymentRows ? `<div class="sep"></div>${paymentRows}` : ""}
    <div class="sep"></div><p class="note"><b>Reason:</b> ${escapeHtml(exchange.reason)}</p><p class="note">This is an item-only exchange. No cash refund or unused return balance is payable.</p><p class="thanks">Thank you!</p>
  </main><script>window.onload=()=>{window.focus();window.print();}</script></body></html>`);
  popup.document.close();
};
