import type { CloseDrawerResult, PosDrawer } from "../redux/slices/posRedux/drawerRedux";
import { DEFAULT_LOCALE } from "./constants";
import { fCurrency } from "./formatNumber";

const BUSINESS_NAME = "MoBee.lk (PVT) Ltd.";
const BUSINESS_PHONE = "0728920900";
const BUSINESS_ADDRESS = "35/B Ingiriya Rd, Padukka";

type CloseInputs = {
  countedBankTransferTotal: number;
  countedCardTotal: number;
  countedCash: number;
  cashExpenseAmount: number;
  note?: string;
};

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const formatDateTime = (value: number) =>
  new Intl.DateTimeFormat(DEFAULT_LOCALE, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

const row = (label: string, value: string, strong = false) => `
  <div class="${strong ? "row strong" : "row"}">
    <span>${escapeHtml(label)}</span>
    <span>${escapeHtml(value)}</span>
  </div>
`;

export const printDrawerSummaryReceipt = (drawer: PosDrawer, result: CloseDrawerResult, inputs: CloseInputs) => {
  const printedAt = formatDateTime(Date.now());
  const closedAt = Date.now();
  const cardDifference = inputs.countedCardTotal - result.summary.cardSales;
  const bankDifference = inputs.countedBankTransferTotal - result.summary.bankTransferSales;
  const cashDifference = result.difference;
  const win = window.open("", "_blank", "width=420,height=720");
  if (!win) return;

  win.document.write(`<!doctype html>
<html>
  <head>
    <title>Drawer ${drawer.id} Summary</title>
    <style>
      @page { margin: 0; size: 80mm auto; }
      * { box-sizing: border-box; }
      html, body { margin: 0; min-height: 0; padding: 0; width: 80mm; }
      body { color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 10.5px; line-height: 1.18; }
      .receipt { margin: 0 auto; overflow: hidden; padding: 1.5mm 2.5mm 0; width: 80mm; }
      .business { font-size: 9.5px; line-height: 1.12; margin: 0; text-align: center; }
      .business strong { font-size: 12px; }
      h1 { font-size: 13px; letter-spacing: 1.8px; margin: 1mm 0 .8mm; text-align: center; text-transform: uppercase; }
      .line { border-top: 1px dashed #222; margin: 1mm 0 .8mm; }
      .section-title { font-size: 10px; font-weight: 800; letter-spacing: .5px; margin: .8mm 0 .45mm; text-transform: uppercase; }
      .row { display: flex; justify-content: space-between; gap: 2mm; margin: .48mm 0; }
      .row span:first-child { color: #444; }
      .row span:last-child { font-weight: 700; max-width: 43mm; overflow-wrap: anywhere; text-align: right; }
      .strong { border-top: 1px solid #111; font-size: 12px; font-weight: 900; margin-top: .7mm; padding-top: .65mm; text-transform: uppercase; }
      .strong span:first-child, .strong span:last-child { color: #111; font-weight: 900; }
      .difference { font-size: 13px; }
      .ok span:last-child { color: #087f23; }
      .bad span:last-child { color: #b42318; }
      .note { border: 1px dashed #555; margin-top: .9mm; min-height: 8mm; overflow-wrap: anywhere; padding: 1mm; }
      .center { text-align: center; }
      .muted { color: #555; }
      p { margin: 0; }
      @media print {
        html, body { margin: 0 !important; padding: 0 !important; width: 80mm !important; }
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .receipt { page-break-after: avoid; page-break-before: avoid; padding: 1.5mm 2.5mm 0 !important; width: 80mm !important; }
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <p class="business"><strong>${BUSINESS_NAME}</strong><br/>${BUSINESS_ADDRESS}<br/>${BUSINESS_PHONE}</p>
      <div class="line"></div>
      <h1>Drawer Summary</h1>
      ${row("Drawer #", String(drawer.id))}
      ${row("Location", drawer.locationName)}
      ${row("Cashier", drawer.userName)}
      ${row("Opened", formatDateTime(drawer.openedAt))}
      ${row("Closed", formatDateTime(closedAt))}
      <div class="line"></div>
      <div class="section-title">System totals</div>
      ${row("Opening cash", fCurrency(Number(drawer.openingCash)))}
      ${row("Sales count", String(result.summary.salesCount))}
      ${row("Cash sales", fCurrency(result.summary.cashSales))}
      ${row("Card sales", fCurrency(result.summary.cardSales))}
      ${row("Bank transfer", fCurrency(result.summary.bankTransferSales))}
      ${row("Discounts", fCurrency(result.summary.discountAmount))}
      ${row("Total sales", fCurrency(result.summary.totalAmount), true)}
      <div class="line"></div>
      <div class="section-title">Cashier counted</div>
      ${row("Counted cash", fCurrency(inputs.countedCash))}
      ${row("Counted card", fCurrency(inputs.countedCardTotal))}
      ${row("Counted bank", fCurrency(inputs.countedBankTransferTotal))}
      ${row("Cash expenses", fCurrency(inputs.cashExpenseAmount))}
      ${row("Expected cash", fCurrency(result.summary.expectedCash), true)}
      <div class="${cashDifference === 0 ? "row strong difference ok" : "row strong difference bad"}">
        <span>Cash difference</span>
        <span>${escapeHtml(fCurrency(cashDifference))}</span>
      </div>
      ${row("Card difference", fCurrency(cardDifference))}
      ${row("Bank difference", fCurrency(bankDifference))}
      ${inputs.note ? `<div class="section-title">Note</div><div class="note">${escapeHtml(inputs.note)}</div>` : ""}
      <div class="line"></div>
      <p class="center muted">Printed ${printedAt}</p>
    </div>
    <script>
      window.onload = () => { window.focus(); window.print(); };
    </script>
  </body>
</html>`);
  win.document.close();
};
