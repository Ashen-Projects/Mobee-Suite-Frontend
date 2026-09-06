import type { SaleDetail } from "../redux/slices/posRedux/saleRedux";
import { DEFAULT_LOCALE } from "./constants";
import { fCurrency } from "./formatNumber";
import JsBarcode from "jsbarcode";

const LOGO_URL = "https://res.cloudinary.com/gxsancbf/image/upload/v1788373843/Mo_2.png";
const BUSINESS_PHONE = "0728920900";
const BUSINESS_ADDRESS = "35/B Ingiriya Rd, Padukka";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const barcodeSvg = (value: string) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, value, {
    displayValue: true,
    font: "Arial",
    fontOptions: "bold",
    fontSize: 9,
    height: 24,
    margin: 0,
    textMargin: 2,
    width: 0.95,
  });
  return new XMLSerializer().serializeToString(svg);
};

export const printSaleReceipt = (sale: SaleDetail) => {
  const printedAt = new Intl.DateTimeFormat(DEFAULT_LOCALE, { dateStyle: "medium", timeStyle: "short" }).format(new Date());
  const saleDate = new Intl.DateTimeFormat(DEFAULT_LOCALE, { dateStyle: "medium" }).format(new Date(sale.timestamp));
  const saleTime = new Intl.DateTimeFormat(DEFAULT_LOCALE, { timeStyle: "short" }).format(new Date(sale.timestamp));
  const payment = sale.payments[0];
  const change = Math.max(0, Number(sale.paidAmount) - Number(sale.totalAmount));
  const invoiceBarcode = barcodeSvg(sale.invoiceNo);
  const itemRows = sale.items.map((item) => `
    <div class="item">
      <div class="item-name">${escapeHtml(item.productName)}</div>
      <div class="item-line">
        <span>${item.quantity} × ${fCurrency(Number(item.unitPrice))}</span>
        <strong>${fCurrency(Number(item.totalAmount))}</strong>
      </div>
      <div class="item-code">${escapeHtml(item.productSku ?? `Product #${item.productId}`)}</div>
    </div>
  `).join("");
  const win = window.open("", "_blank", "width=420,height=720");
  if (!win) return;
  win.document.write(`<!doctype html>
<html>
  <head>
    <title>${escapeHtml(sale.invoiceNo)}</title>
    <style>
      @page { margin: 0; size: 72mm 82mm; }
      * { box-sizing: border-box; }
      html,
      body {
        margin: 0;
        min-height: 0;
        padding: 0;
        width: 72mm;
      }
      body {
        color: #111;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 9px;
        line-height: 1.12;
      }
      .receipt {
        margin: 0 auto;
        overflow: hidden;
        padding: 0 1.4mm 0;
        width: 72mm;
      }
      .logo { display: block; height: auto; margin: 0 auto .15mm; max-width: 24mm; }
      h1 { font-size: 11px; letter-spacing: 1.3px; margin: .25mm 0 .25mm; text-align: center; text-transform: uppercase; }
      .business { font-size: 8px; line-height: 1.08; margin: 0; text-align: center; }
      .muted { color: #555; }
      .center { text-align: center; }
      .line { border-top: 1px dashed #222; margin: .65mm 0 .5mm; }
      .meta { display: grid; grid-template-columns: 18mm minmax(0, 1fr); gap: .35mm 1.2mm; }
      .meta div:nth-child(even) { text-align: right; }
      .meta span,
      .meta strong { min-width: 0; overflow-wrap: anywhere; }
      .meta strong { font-size: 9px; }
      .table-head { display: grid; grid-template-columns: minmax(0, 1fr) 23mm; font-size: 8.5px; font-weight: 800; letter-spacing: .35px; padding: 0 0 .35mm; text-transform: uppercase; }
      .table-head span:last-child { text-align: right; }
      .item { border-top: 1px dashed #bbb; padding: .55mm 0; }
      .item:first-of-type { border-top: 0; }
      .item-name { font-size: 9.5px; font-weight: 800; overflow-wrap: anywhere; }
      .item-line { display: flex; justify-content: space-between; gap: 2mm; margin-top: .25mm; }
      .item-line span { color: #444; }
      .item-line strong { white-space: nowrap; }
      .item-code { color: #666; font-size: 8px; margin-top: .2mm; }
      .summary { margin-left: auto; width: 39mm; }
      .row { display: flex; justify-content: space-between; gap: 2mm; margin: .35mm 0; }
      .row span:last-child { text-align: right; white-space: nowrap; }
      .total { border-top: 1px solid #111; font-size: 12px; font-weight: 900; margin-top: .5mm; padding-top: .45mm; text-transform: uppercase; }
      .thanks { font-size: 10px; font-weight: 900; letter-spacing: .7px; margin: .55mm 0 .2mm; text-align: center; text-transform: uppercase; }
      .barcode { display: flex; justify-content: center; margin-top: .45mm; page-break-inside: avoid; break-inside: avoid; }
      .barcode svg { height: 10mm; max-width: 48mm; width: 48mm; }
      p { margin: 0; }
      @media print {
        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 72mm !important;
        }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .receipt {
          padding: 0 1.4mm 0 !important;
          width: 72mm !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <img class="logo" src="${LOGO_URL}" />
      <p class="business"><strong>MoBee.lk Suite</strong><br/>${BUSINESS_ADDRESS}<br/>${BUSINESS_PHONE}</p>
      <div class="line"></div>
      <h1>Receipt</h1>
      <div class="meta">
        <span>Receipt #</span><strong>${escapeHtml(sale.invoiceNo)}</strong>
        <span>Date</span><span>${saleDate}</span>
        <span>Time</span><span>${saleTime}</span>
        <span>Cashier</span><span>${escapeHtml(sale.userName)}</span>
        <span>Location</span><span>${escapeHtml(sale.locationName)}</span>
        <span>Customer</span><span>${escapeHtml(sale.customerName ?? "Walk-in Customer")}</span>
        ${sale.customerPhone ? `<span>Phone</span><span>${escapeHtml(sale.customerPhone)}</span>` : ""}
      </div>
      <div class="line"></div>
      <div class="table-head"><span>Item</span><span>Amount</span></div>
      ${itemRows}
      <div class="line"></div>
      <div class="summary">
        <div class="row"><span>Subtotal</span><span>${fCurrency(Number(sale.subTotal))}</span></div>
        <div class="row"><span>Discount</span><span>${fCurrency(Number(sale.discountAmount))}</span></div>
        <div class="row total"><span>Total</span><span>${fCurrency(Number(sale.totalAmount))}</span></div>
        <div class="row"><span>Payment</span><span>${payment ? payment.method.toUpperCase() : "—"}</span></div>
        <div class="row"><span>Paid</span><span>${fCurrency(Number(sale.paidAmount))}</span></div>
        <div class="row"><span>Balance</span><span>${fCurrency(change)}</span></div>
      </div>
      <div class="line"></div>
      <div class="thanks">Thank you!</div>
      <p class="center muted">We appreciate your purchase.<br/>Visit us again!</p>
      <div class="barcode">${invoiceBarcode}</div>
      <p class="center muted">Printed ${printedAt}</p>
    </div>
    <script>
      window.onload = () => { window.focus(); window.print(); };
    </script>
  </body>
</html>`);
  win.document.close();
};
