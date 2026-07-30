export const generateExpenseReport = async ({ expenses, summary }) => {
  const totalAmount = expenses.reduce((sum, item) => sum + Number(item.tutar || 0), 0);
  const totalQuantity = expenses.reduce((sum, item) => sum + Number(item.miktar || 0), 0);

  const html = buildReportHtml({
    reportTitle: "Masraf Raporu",
    filters: [
      { label: "Kapsam", value: "Tüm masraf kayıtları" },
      { label: "Kayıt Sayısı", value: expenses.length },
    ],
    summaryCards: [
      { label: "Toplam Masraf", value: formatCurrency(totalAmount) },
      { label: "Kategori Sayısı", value: summary.categoryExpenses.length },
      { label: "Toplam Miktar", value: formatNumber(totalQuantity) },
      { label: "Ortalama Masraf", value: formatCurrency(expenses.length ? totalAmount / expenses.length : 0) },
    ],
    columns: ["Tarih", "Kategori", "Ürün", "Marka", "Miktar", "Birim Fiyat", "Tutar"],
    rows: expenses.map((item) => [
      item.tarih || formatDate(item.tarihRaw),
      item.kategori,
      item.urunAdi,
      item.gubreMarka,
      `${formatNumber(item.miktar)} ${item.birim}`,
      formatCurrency(item.birimFiyat),
      formatCurrency(item.tutar),
    ]),
    totals: [
      { label: "Toplam Masraf", value: formatCurrency(totalAmount) },
      { label: "Toplam Kayıt", value: expenses.length },
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
