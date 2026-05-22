import React, { useEffect, useState } from 'react';
import { Printer } from 'lucide-react';

function Raporlar() {
  const formatDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('tr-TR');
  };

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    categoryExpenses: []
  });
  const [expenseDetails, setExpenseDetails] = useState([]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [summaryRes, masraflarRes] = await Promise.all([
        window.api.raporlar.getSummary(),
        window.api.masraflar.getAll()
      ]);

      setSummary({
        totalIncome: summaryRes?.totalRevenue || 0,
        totalExpense: summaryRes?.totalExpenses || 0,
        netProfit: summaryRes?.netProfit || 0,
        categoryExpenses: (summaryRes?.catExpenses || []).map((x) => ({
          kategori: x.kategori,
          tutar: x.total || 0
        }))
      });

      const normalized = (masraflarRes || []).map((x) => ({
        id: x.id,
        tarihRaw: x.tarih || '',
        tarih: formatDate(x.tarih),
        kategori: x.kategori || '-',
        urunAdi: x.urun_adi || '-',
        gubreMarka: x.gubre_marka || '-',
        gubreTuru: x.gubre_turu || '-',
        gubreCesit: x.gubre_cesit || '-',
        miktar: Number(x.miktar || 0),
        birim: x.birim || '-',
        birimFiyat: Number(x.birim_fiyat || 0),
        tutar: Number(x.tutar || 0)
      }));

      normalized.sort((a, b) => String(b.tarihRaw).localeCompare(String(a.tarihRaw)));
      setExpenseDetails(normalized);
    } catch (err) {
      console.error('Rapor verileri çekilirken hata oluştu:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const renderListHtml = () => {
    const reportDate = new Date().toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const categoryItems = summary.categoryExpenses.length === 0
      ? '<li>Masraf kaydı bulunmuyor.</li>'
      : summary.categoryExpenses
          .map((item) => `<li><strong>${item.kategori}:</strong> ${item.tutar.toLocaleString('tr-TR')} TL</li>`)
          .join('');

    const expenseItems = expenseDetails.length === 0
      ? '<li>Detay masraf kaydı bulunmuyor.</li>'
      : expenseDetails
          .map(
            (item) => `
              <li style="margin-bottom:4px; padding:5px 7px; border:1px solid #e5e7eb; border-radius:6px;">
                <div style="display:flex; justify-content:space-between; gap:10px; font-weight:700;">
                  <span>${item.tarih} • ${item.kategori}</span>
                  <span>${item.tutar.toLocaleString('tr-TR')} TL</span>
                </div>
                <div style="margin-top:2px;"><strong>Ürün:</strong> ${item.urunAdi}</div>
                <div style="margin-top:1px; color:#374151;">
                  <strong>Marka:</strong> ${item.gubreMarka} | <strong>Tür:</strong> ${item.gubreTuru} | <strong>Çeşit:</strong> ${item.gubreCesit}
                </div>
                <div style="margin-top:1px; color:#374151;">
                  <strong>Miktar:</strong> ${item.miktar.toLocaleString('tr-TR')} ${item.birim} | <strong>Birim Fiyat:</strong> ${item.birimFiyat.toLocaleString('tr-TR')} TL
                </div>
              </li>
            `
          )
          .join('');

    return `
      <!doctype html>
      <html lang="tr">
      <head>
        <meta charset="utf-8" />
        <title>Çetele Raporu</title>
        <style>
          @page { size: A4; margin: 8mm; }
          html, body { width: 100%; height: 100%; }
          body { font-family: Segoe UI, Arial, sans-serif; margin: 0; color: #111827; font-size: 9.8px; line-height: 1.22; }
          h1 { font-size: 15px; margin: 0 0 4px; }
          h2 { font-size: 12px; margin: 8px 0 4px; }
          h3 { font-size: 11px; margin: 7px 0 4px; }
          p { margin: 0 0 3px; }
          ul { margin: 0 0 4px; padding-left: 16px; line-height: 1.3; }
          li { margin-bottom: 2px; }
          hr { border: 0; border-top: 1px solid #d1d5db; margin: 6px 0; }
          .note { margin-top: 4px; color: #374151; font-style: italic; }
        </style>
      </head>
      <body>
        <h1>ÇETELE RAPORU</h1>
        <p>Rapor Tarihi: ${reportDate}</p>
        <hr />
        <h2>Finansal Özet</h2>
        <ul>
          <li><strong>Toplam Satış Geliri:</strong> ${summary.totalIncome.toLocaleString('tr-TR')} TL</li>
          <li><strong>Toplam Gider / Masraf:</strong> ${summary.totalExpense.toLocaleString('tr-TR')} TL</li>
          <li><strong>Net Kar / Zarar:</strong> ${summary.netProfit.toLocaleString('tr-TR')} TL</li>
          <li><strong>Durum:</strong> ${summary.netProfit >= 0 ? 'Karda' : 'Zararda'}</li>
        </ul>
        <h3>Kategori Bazlı Masraflar</h3>
        <ul>${categoryItems}</ul>
        <h3>Gider Detayları</h3>
        <ul>${expenseItems}</ul>
      </body>
      </html>
    `;
  };

  const handlePrint = () => {
    const html = renderListHtml();
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [summary, expenseDetails]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>Raporlar yükleniyor...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button className="btn btn-primary btn-large" onClick={handlePrint}>
          <Printer size={20} />
          <span>Raporu Yazdır / PDF Kaydet</span>
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '10px' }}>Finansal Özet (Liste)</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li><strong>Toplam Satış Geliri:</strong> {summary.totalIncome.toLocaleString('tr-TR')} TL</li>
          <li><strong>Toplam Gider / Masraf:</strong> {summary.totalExpense.toLocaleString('tr-TR')} TL</li>
          <li><strong>Net Kar / Zarar:</strong> {summary.netProfit.toLocaleString('tr-TR')} TL</li>
          <li><strong>Durum:</strong> {summary.netProfit >= 0 ? 'Karda' : 'Zararda'}</li>
        </ul>

        <h3 style={{ marginTop: '10px' }}>Kategori Bazlı Masraflar</h3>
        <ul style={{ lineHeight: 1.7 }}>
          {summary.categoryExpenses.length === 0 ? (
            <li>Masraf kaydı bulunmuyor.</li>
          ) : (
            summary.categoryExpenses.map((item) => (
              <li key={item.kategori}><strong>{item.kategori}:</strong> {item.tutar.toLocaleString('tr-TR')} TL</li>
            ))
          )}
        </ul>

        <h3 style={{ marginTop: '10px' }}>Gider Detayları</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {expenseDetails.length === 0 ? (
            <div>Detay masraf kaydı bulunmuyor.</div>
          ) : (
            expenseDetails.map((item) => (
              <div key={item.id} style={{ border: '1px solid var(--slate-300)', borderRadius: '10px', padding: '12px 14px', background: 'var(--white)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontWeight: 700 }}>
                  <span>{item.tarih} • {item.kategori}</span>
                  <span>{item.tutar.toLocaleString('tr-TR')} TL</span>
                </div>
                <div style={{ marginTop: '6px' }}><strong>Ürün:</strong> {item.urunAdi}</div>
                <div style={{ marginTop: '4px', color: 'var(--slate-700)' }}>
                  <strong>Marka:</strong> {item.gubreMarka} | <strong>Tür:</strong> {item.gubreTuru} | <strong>Çeşit:</strong> {item.gubreCesit}
                </div>
                <div style={{ marginTop: '4px', color: 'var(--slate-700)' }}>
                  <strong>Miktar:</strong> {item.miktar.toLocaleString('tr-TR')} {item.birim} | <strong>Birim Fiyat:</strong> {item.birimFiyat.toLocaleString('tr-TR')} TL
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Raporlar;
