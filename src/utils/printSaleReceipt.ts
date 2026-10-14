import type { SaleDetail } from "../redux/slices/posRedux/saleRedux";
import { DEFAULT_LOCALE } from "./constants";
import { fCurrency } from "./formatNumber";
import JsBarcode from "jsbarcode";

const LOGO_URL = "https://res.cloudinary.com/gxsancbf/image/upload/v1788373843/Mo_2.png";
const BUSINESS_NAME = "MoBee.lk (PVT) Ltd.";
const BUSINESS_PHONE = "0728920900";
const BUSINESS_ADDRESS = "35/B Ingiriya Rd, Padukka";
const SOFTWARE_DEVELOPER = "Software Developed By<br/>Thushan Damjith<br/>+94762167969";

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const warrantyLabel = (periodMonths: number, warrantyType: string | null) => {
  if (!periodMonths || !warrantyType) return null;
  const duration = periodMonths === 12 ? "1 year" : `${periodMonths} months`;
  const type = warrantyType.replace(/(^|_)([a-z])/g, (_match, prefix: string, letter: string) => `${prefix} ${letter.toUpperCase()}`).trim();
  return `${duration} • ${type} warranty`;
};

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
  const paymentRows = sale.payments.map((payment) => `
    <div class="row"><span>${escapeHtml(payment.method === "bankTransfer" ? "Bank transfer" : payment.method === "mobile" ? "Mobile payment" : payment.method.charAt(0).toUpperCase() + payment.method.slice(1))}${payment.referenceNo ? ` · ${escapeHtml(payment.referenceNo)}` : ""}</span><span>${fCurrency(Number(payment.amount))}</span></div>
  `).join("");
  const invoiceBarcode = barcodeSvg(sale.invoiceNo);
  const itemRows = sale.items.map((item) => {
    const warranty = warrantyLabel(item.warrantyPeriodMonths, item.warrantyType);
    return `
    <div class="item">
      <div class="item-details">
        <div class="item-name">${escapeHtml(item.productName)}</div>
        <div class="item-code">${escapeHtml(item.productSku ?? `Product #${item.productId}`)}</div>
        ${warranty ? `<div class="item-warranty">Warranty: ${escapeHtml(warranty)}</div>` : ""}
      </div>
      <div class="item-quantity">${item.quantity}</div>
      <strong class="item-price">${fCurrency(Number(item.totalAmount))}</strong>
    </div>
  `;
  }).join("");
  const hasWarranty = sale.items.some((item) => Boolean(warrantyLabel(item.warrantyPeriodMonths, item.warrantyType)));
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "border:0;height:0;left:-10000px;position:fixed;top:-10000px;width:0;";
  document.body.appendChild(frame);
  const documentToPrint = frame.contentDocument;
  const windowToPrint = frame.contentWindow;
  if (!documentToPrint || !windowToPrint) {
    frame.remove();
    return;
  }

  let cleanedUp = false;
  const cleanup = () => {
    if (cleanedUp) return;
    cleanedUp = true;
    window.setTimeout(() => frame.remove(), 0);
  };
  const print = () => {
    windowToPrint.focus();
    windowToPrint.print();
  };
  windowToPrint.addEventListener("afterprint", cleanup, { once: true });
  // Some browser/driver combinations do not emit afterprint after a cancelled dialog.
  window.setTimeout(cleanup, 60_000);
  frame.addEventListener("load", () => {
    const images = Array.from(documentToPrint.images);
    Promise.all(images.map((image) => image.complete
      ? Promise.resolve()
      : new Promise<void>((resolve) => {
        image.addEventListener("error", () => resolve(), { once: true });
        image.addEventListener("load", () => resolve(), { once: true });
      })))
      .finally(() => window.setTimeout(print, 80));
  }, { once: true });

  documentToPrint.open();
  documentToPrint.write(`<!doctype html>
<html>
  <head>
    <title>${escapeHtml(sale.invoiceNo)}</title>
    <style>
      @page { margin: 0; size: 80mm auto; }
      * { box-sizing: border-box; }
      html,
      body {
        margin: 0;
        min-height: 0;
        padding: 0;
        width: 80mm;
      }
      body {
        color: #111;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 10.5px;
        line-height: 1.16;
      }
      .receipt {
        margin: 0 auto;
        overflow: hidden;
        padding: 1mm 2.5mm 0;
        width: 80mm;
      }
      .logo { display: block; height: auto; margin: 0 auto .35mm; max-width: 28mm; }
      h1 { font-size: 13px; letter-spacing: 2px; margin: .6mm 0 .7mm; text-align: center; text-transform: uppercase; }
      .business { font-size: 9.5px; line-height: 1.12; margin: 0; text-align: center; }
      .business strong { font-size: 11px; }
      .muted { color: #555; }
      .center { text-align: center; }
      .line { border-top: 1px dashed #222; margin: 1mm 0 .8mm; }
      .meta { display: grid; grid-template-columns: 20mm minmax(0, 1fr); gap: .45mm 1.4mm; }
      .meta div:nth-child(even) { text-align: right; }
      .meta span,
      .meta strong { min-width: 0; overflow-wrap: anywhere; }
      .meta strong { font-size: 10.5px; }
      .table-head { display: grid; grid-template-columns: minmax(0, 1fr) 11mm 25mm; font-size: 9.5px; font-weight: 800; letter-spacing: .35px; padding: 0 0 .45mm; text-transform: uppercase; }
      .table-head span:not(:first-child) { text-align: right; }
      .item { align-items: start; border-top: 1px dashed #bbb; display: grid; grid-template-columns: minmax(0, 1fr) 11mm 25mm; gap: 1mm; padding: .75mm 0; }
      .item:first-of-type { border-top: 0; }
      .item-name { font-size: 10.5px; font-weight: 800; overflow-wrap: anywhere; }
      .item-code { color: #666; font-size: 9px; margin-top: .25mm; }
      .item-warranty { color: #164b2c; font-size: 8.7px; font-weight: 700; margin-top: .35mm; overflow-wrap: anywhere; }
      .item-quantity, .item-price { padding-top: .15mm; text-align: right; white-space: nowrap; }
      .item-quantity { color: #444; }
      .summary { margin-left: auto; width: 45mm; }
      .row { display: flex; justify-content: space-between; gap: 2mm; margin: .45mm 0; }
      .row span:last-child { text-align: right; white-space: nowrap; }
      .total { border-top: 1px solid #111; font-size: 14px; font-weight: 900; margin-top: .65mm; padding-top: .55mm; text-transform: uppercase; }
      .thanks { font-size: 12px; font-weight: 900; letter-spacing: .8px; margin: .9mm 0 .35mm; text-align: center; text-transform: uppercase; }
      .developer { color: #666; font-size: 8px; line-height: 1.25; margin: .8mm 0 0; text-align: center; }
      .barcode { display: flex; justify-content: center; margin-top: .9mm; page-break-inside: avoid; break-inside: avoid; }
      .barcode svg { height: 12mm; max-width: 58mm; width: 58mm; }
      .printed { margin-top: .6mm; }
      p { margin: 0; }
      @media print {
        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          width: 80mm !important;
        }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .receipt {
          page-break-after: avoid;
          page-break-before: avoid;
          padding: 1mm 2.5mm 0 !important;
          width: 80mm !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <img class="logo" src="${LOGO_URL}" />
      <p class="business"><strong>${BUSINESS_NAME}</strong><br/>${BUSINESS_ADDRESS}<br/>${BUSINESS_PHONE}</p>
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
      <div class="table-head"><span>Item</span><span>Qty</span><span>Price</span></div>
      ${itemRows}
      <div class="line"></div>
      <div class="summary">
        <div class="row"><span>Subtotal</span><span>${fCurrency(Number(sale.subTotal))}</span></div>
        <div class="row"><span>Discount</span><span>${fCurrency(Number(sale.discountAmount))}</span></div>
        <div class="row total"><span>Total</span><span>${fCurrency(Number(sale.totalAmount))}</span></div>
        ${paymentRows || '<div class="row"><span>Payment</span><span>—</span></div>'}
        <div class="row"><span>Paid</span><span>${fCurrency(Number(sale.paidAmount))}</span></div>
        <div class="row"><span>Balance</span><span>${fCurrency(Math.max(0, Number(sale.totalAmount) - Number(sale.paidAmount)))}</span></div>
      </div>
      <div class="line"></div>
      ${hasWarranty ? '<p class="center muted">Warranty starts from the invoice date. Keep this receipt for warranty claims.</p><div class="line"></div>' : ""}
      <div class="thanks">Thank you!</div>
      <p class="center muted">We appreciate your purchase.<br/>Visit us again!</p>
      <div class="barcode">${invoiceBarcode}</div>
      <p class="center muted printed">Printed ${printedAt}</p>
      <p class="developer">${SOFTWARE_DEVELOPER}</p>
    </div>
  </body>
</html>`);
  documentToPrint.close();
};
