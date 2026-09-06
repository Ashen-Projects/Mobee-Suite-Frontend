import type { RepairJobDetail } from "../redux/slices/repairRedux/repairRedux";
import { fCurrency } from "./formatNumber";

const escapeHtml = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const qrSrc = (value: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&data=${encodeURIComponent(value)}`;

export const printRepairJobReceipt = (job: RepairJobDetail) => {
  const origin = window.location.origin;
  const publicUrl = `${origin}${job.publicStatusPath}`;
  console.info("[Mobee Repair QR]", { jobNo: job.jobNo, publicUrl });
  const printedAt = new Date().toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
  const createdAt = new Date(job.timestamp).toLocaleString("en-LK", { dateStyle: "medium", timeStyle: "short" });
  const win = window.open("", "_blank", "width=420,height=720");
  if (!win) return;
  win.document.write(`<!doctype html>
<html>
<head>
  <title>Repair Job ${escapeHtml(job.jobNo)}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #000; font-family: Arial, Helvetica, sans-serif; }
    .receipt { width: 80mm; padding: 3mm 4mm 2mm; }
    .center { text-align: center; }
    .brand { font-size: 18px; font-weight: 900; line-height: 1; }
    .small { font-size: 10px; }
    .muted { color: #222; }
    .title { font-size: 17px; font-weight: 900; letter-spacing: 3px; margin: 6px 0 5px; }
    .line { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; margin: 3px 0; }
    .row span:first-child { color: #222; }
    .row strong { text-align: right; }
    .box { border: 1px solid #000; border-radius: 4px; padding: 5px; margin: 6px 0; }
    .device { font-size: 14px; font-weight: 900; }
    .problem { font-size: 12px; line-height: 1.25; white-space: pre-wrap; }
    img.qr { display: block; height: 32mm; margin: 5px auto 2px; width: 32mm; }
    .access { font-size: 11px; overflow-wrap: anywhere; }
    @media print { html, body { width: 80mm; height: auto; } .receipt { page-break-after: avoid; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <div class="brand">MoBee.lk (PVT) Ltd.</div>
      <div class="small">35/B Ingiriya Rd, Padukka</div>
      <div class="small">0728920900</div>
      <div class="title">REPAIR JOB</div>
    </div>
    <div class="line"></div>
    <div class="row"><span>Job ID</span><strong>${escapeHtml(job.jobNo)}</strong></div>
    <div class="row"><span>Date</span><strong>${escapeHtml(createdAt)}</strong></div>
    <div class="row"><span>Location</span><strong>${escapeHtml(job.locationName)}</strong></div>
    <div class="row"><span>Customer</span><strong>${escapeHtml(job.customerName)}</strong></div>
    <div class="row"><span>Phone</span><strong>${escapeHtml(job.customerPhone ?? "-")}</strong></div>
    <div class="line"></div>
    <div class="box">
      <div class="device">${escapeHtml(job.deviceName)}</div>
      <div class="small">IMEI / Serial: ${escapeHtml(job.serialImei || "-")}</div>
      <div class="small">Estimated: ${escapeHtml(fCurrency(Number(job.estimatedCost)))}</div>
    </div>
    <div class="problem"><strong>Problem:</strong><br />${escapeHtml(job.problemDescription)}</div>
    <div class="line"></div>
    <div class="center">
      <div class="small"><strong>Scan to check repair status</strong></div>
      <img class="qr" src="${qrSrc(publicUrl)}" />
      <div class="small">Job ID: <strong>${escapeHtml(job.jobNo)}</strong></div>
      <div class="access">Access code: ${escapeHtml(job.publicStatusToken)}</div>
      <div class="small muted">Only repair progress is shown online.</div>
    </div>
    <div class="line"></div>
    <div class="center small">Printed ${escapeHtml(printedAt)}</div>
  </div>
  <script>window.addEventListener("load", () => setTimeout(() => window.print(), 350));</script>
</body>
</html>`);
  win.document.close();
};
