import JsBarcode from "jsbarcode";

type BarcodePrintItem = {
  barcode: string;
  productName?: string | null;
  productSku?: string | null;
};

const normalizeFileValue = (value: string) => value.replace(/[^\w.-]+/g, "-").replace(/^-+|-+$/g, "");
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[char] ?? char));
const csvValue = (value: string | null | undefined) => `"${String(value ?? "").replace(/"/g, "\"\"")}"`;
const mobeeLogoUrl = "https://res.cloudinary.com/gxsancbf/image/upload/v1787844231/Mobee-suite.png";
const labelWidth = "30mm";
const labelHeight = "20mm";
const labelOffsetX = "0mm";
const labelOffsetY = "0mm";

const code128Svg = (value: string) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, value, {
    displayValue: false,
    format: "CODE128",
    height: 38,
    margin: 0,
    width: 1.15,
  });
  svg.setAttribute("aria-label", value);
  svg.setAttribute("preserveAspectRatio", "none");
  return new XMLSerializer().serializeToString(svg);
};

export const printBarcodes = (items: BarcodePrintItem[]) => {
  const printable = items.filter((item) => item.barcode.trim());
  if (!printable.length) throw new Error("No barcode numbers are available to print.");
  const labels = printable.map((item) => `
    <section class="label">
      <div class="content">
        <img alt="Mobee.lk" class="logo" src="${mobeeLogoUrl}" />
        <div class="barcode">${code128Svg(item.barcode)}</div>
        <div class="number">${escapeHtml(item.barcode)}</div>
      </div>
    </section>
  `).join("");
  const page = window.open("", "_blank", "width=420,height=520");
  if (!page) throw new Error("Popup blocked. Allow popups to print barcodes.");
  page.document.write(`<!doctype html><html><head><title>Print Barcodes</title><style>
    @page { margin: 0; size: ${labelWidth} ${labelHeight}; }
    * { box-sizing: border-box; }
    html, body {
      color: #000;
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      min-height: ${labelHeight};
      padding: 0;
      width: ${labelWidth};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      display: block;
      margin: 0;
      padding: 0;
      width: ${labelWidth};
    }
    .label {
      break-after: page;
      height: ${labelHeight};
      margin: 0;
      overflow: hidden;
      padding: 0;
      page-break-after: always;
      page-break-inside: avoid;
      position: relative;
      width: ${labelWidth};
    }
    .content {
      align-items: center;
      display: flex;
      flex-direction: column;
      left: calc(50% + ${labelOffsetX});
      position: absolute;
      text-align: center;
      top: calc(50% + ${labelOffsetY});
      transform: translate(-50%, -50%);
      width: 27mm;
    }
    .label:last-child { break-after: auto; page-break-after: auto; }
    .logo { display: block; height: 3.8mm; margin: 0 auto 0.45mm; max-width: 20mm; object-fit: contain; }
    .barcode { height: 9.8mm; width: 26.5mm; }
    .barcode svg { display: block; height: 100%; width: 100%; }
    .number { font-size: 8px; font-weight: 800; letter-spacing: 0.35px; line-height: 1; margin-top: 0.45mm; }
    @media screen {
      body { background: #f5f5f5; padding: 8px; }
      .label { background: #fff; border: 1px dashed #d6d6d6; margin: 0 0 8px; }
    }
    @media print {
      html, body {
        background: #fff;
        height: auto;
        min-height: 0;
        overflow: visible;
      }
      .sheet { height: auto; overflow: visible; }
      .label { border: 0; margin: 0; }
    }
  </style></head><body><main class="sheet">${labels}</main><script>window.onload=()=>{window.focus();window.print();};</script></body></html>`);
  page.document.close();
};

export const exportBarTenderCsv = (items: BarcodePrintItem[]) => {
  const printable = items.filter((item) => item.barcode.trim());
  if (!printable.length) throw new Error("No barcode numbers are available to export.");
  const rows = [
    ["Barcode"].map(csvValue).join(","),
    ...printable.map((item) => [item.barcode].map(csvValue).join(",")),
  ];
  const blob = new Blob([`\uFEFF${rows.join("\n")}`], { type: "text/csv;charset=utf-8" });
  const link = document.createElement("a");
  const first = normalizeFileValue(printable[0]?.barcode ?? "barcodes");
  const last = normalizeFileValue(printable[printable.length - 1]?.barcode ?? first);
  link.href = URL.createObjectURL(blob);
  link.download = first === last ? `mobee-barcodes-${first}.csv` : `mobee-barcodes-${first}-to-${last}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
};
