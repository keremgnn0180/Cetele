export const generateHarvestReport = async ({ harvests }) => {
  const totalRevenue = harvests.reduce((sum, item) => sum + Number(item.gelir || 0), 0);
  const totalQuantity = harvests.reduce((sum, item) => sum + Number(item.miktar || 0), 0);
  const fields = new Set(harvests.map((item) => item.tarla_isim).filter(Boolean));
  const products = new Set(harvests.map((item) => item.urun_isim).filter(Boolean));

  const html = buildReportHtml({
    reportTitle: "Hasat Raporu",
    filters: [
      { label: "Kapsam", value: "Tüm hasat ve satış kayıtları" },
      { label: "Kayıt Sayısı", value: harvests.length },
    ],
    summaryCards: [
      { label: "Toplam Gelir", value: formatCurrency(totalRevenue) },
      { label: "Toplam Miktar", value: formatNumber(totalQuantity) },
      { label: "Tarla Sayısı", value: fields.size },
      { label: "Ürün Sayısı", value: products.size },
    ],
    columns: ["Tarih", "Tarla", "Ürün", "Miktar", "Satış Fiyatı", "Gelir", "Açıklama"],
    rows: harvests.map((item) => [
      formatDate(item.tarih),
      item.tarla_isim || "-",
      item.urun_isim || "-",
      `${formatNumber(item.miktar)} ${item.birim || ""}`,
      formatCurrency(item.birim_satis_fiyati),
      formatCurrency(item.gelir),
      item.aciklama || "-",
    ]),
    totals: [
      { label: "Toplam Gelir", value: formatCurrency(totalRevenue) },
      { label: "Toplam Kayıt", value: harvests.length },
    ],
  });

  await window.api.pdf.export(html);
};

const buildReportHtml = ({ reportTitle, filters, summaryCards, columns, rows, totals }) => `
  <!doctype html>
  <html lang="tr">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(reportTitle)}</title>
      ${reportStyles()}
    </head>
    <body>
      <header>
        <div>
          <p class="eyebrow">Çetele</p>
          <h1>${escapeHtml(reportTitle)}</h1>
        </div>
        <p class="date">${formatDate(new Date())}</p>
      </header>

      <section class="filters">
        ${filters
          .map(
            (item) => `
              <div>
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.value)}</strong>
              </div>
            `,
          )
          .join("")}
      </section>

      <section class="summary">
        ${summaryCards
          .map(
            (item) => `
              <article>
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.value)}</strong>
              </article>
            `,
          )
          .join("")}
      </section>

      <table>
        <thead>
          <tr>${columns.map((column) => `<th>${escapeHtml(column)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${
            rows.length
              ? rows
                  .map(
                    (row) => `
                      <tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>
                    `,
                  )
                  .join("")
              : `<tr><td colspan="${columns.length}" class="empty">Kayıt bulunmuyor.</td></tr>`
          }
        </tbody>
      </table>

      <section class="totals">
        ${totals
          .map(
            (item) => `
              <div>
                <span>${escapeHtml(item.label)}</span>
                <strong>${escapeHtml(item.value)}</strong>
              </div>
            `,
          )
          .join("")}
      </section>
    </body>
  </html>
`;

const reportStyles = () => `
  <style>
    @page { size: A4; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #111827;
      font-family: "Segoe UI", Arial, sans-serif;
      font-size: 10px;
      line-height: 1.35;
    }
    header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 2px solid #1f2937;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    h1 { margin: 0; font-size: 22px; letter-spacing: 0; }
    .eyebrow {
      margin: 0 0 3px;
      color: #4b5563;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .date { margin: 3px 0 0; color: #4b5563; white-space: nowrap; }
    .filters, .summary, .totals {
      display: grid;
      gap: 8px;
      margin-bottom: 12px;
    }
    .filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .summary { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .totals {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      margin-top: 12px;
      margin-bottom: 0;
    }
    article, .filters div, .totals div {
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 8px;
      break-inside: avoid;
    }
    span { display: block; color: #6b7280; font-size: 9px; }
    strong { display: block; margin-top: 2px; color: #111827; font-size: 12px; }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th, td {
      border: 1px solid #d1d5db;
      padding: 6px;
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
    }
    th {
      background: #f3f4f6;
      color: #374151;
      font-size: 9px;
      text-transform: uppercase;
    }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .empty { text-align: center; color: #6b7280; }
  </style>
`;

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} TL`;

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("tr-TR", {
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("tr-TR");
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
