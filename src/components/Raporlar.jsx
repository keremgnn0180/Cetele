import React, { useEffect, useState } from "react";
import { FileText, Printer } from "lucide-react";

import { generateExpenseReport } from "../reports/expenseReport";
import { generateHarvestReport } from "../reports/harvestReport";
import { generateProfitReport } from "../reports/profitReport";
import { generateSeasonReport } from "../reports/seasonReport";

function Raporlar() {
  const [loading, setLoading] = useState(true);

  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpense: 0,
    netProfit: 0,
    categoryExpenses: [],
    fieldPerformances: [],
  });

  const [expenseDetails, setExpenseDetails] = useState([]);
  const [harvestDetails, setHarvestDetails] = useState([]);
  const [fields, setFields] = useState([]);
  const [plantings, setPlantings] = useState([]);

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString("tr-TR");
  };

  const fetchReportData = async () => {
    setLoading(true);

    try {
      const [
        summaryRes,
        masraflarRes,
        hasatlarRes,
        tarlalarRes,
        ekimlerRes,
      ] = await Promise.all([
        window.api.raporlar.getSummary(),
        window.api.masraflar.getAll(),
        window.api.hasatlar.getAll(),
        window.api.tarlalar.getAll(),
        window.api.ekimler.getAll(),
      ]);

      setSummary({
        totalIncome: summaryRes?.totalRevenue || 0,
        totalExpense: summaryRes?.totalExpenses || 0,
        netProfit: summaryRes?.netProfit || 0,
        categoryExpenses: (summaryRes?.catExpenses || []).map((x) => ({
          kategori: x.kategori,
          tutar: x.total || 0,
        })),
        fieldPerformances: summaryRes?.fieldPerformances || [],
      });

      const normalized = (masraflarRes || []).map((x) => ({
        id: x.id,
        tarihRaw: x.tarih || "",
        tarih: formatDate(x.tarih),
        kategori: x.kategori || "-",
        urunAdi: x.urunAdi || x.urun_adi || "-",
        gubreMarka: x.gubreMarka || x.gubre_marka || "-",
        gubreTuru: x.gubreTuru || x.gubre_turu || "-",
        gubreCesit: x.gubreCesit || x.gubre_cesit || "-",
        miktar: Number(x.miktar || 0),
        birim: x.birim || "-",
        birimFiyat: Number(x.birimFiyat || x.birim_fiyat || 0),
        tutar: Number(x.tutar || 0),
      }));

      normalized.sort((a, b) =>
        String(b.tarihRaw).localeCompare(String(a.tarihRaw))
      );

      setExpenseDetails(normalized);
      setHarvestDetails(hasatlarRes || []);
      setFields(tarlalarRes || []);
      setPlantings(ekimlerRes || []);
    } catch (err) {
      console.error("Rapor verileri alınamadı:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);
    const reportPayload = {
    expenses: expenseDetails,
    harvests: harvestDetails,
    fields,
    plantings,
    summary,
  };

  const handlePrint = () => {
    generateExpenseReport(reportPayload);
  };

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p") {
        event.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [reportPayload]);

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px",
          color: "var(--slate-500)",
        }}
      >
        Raporlar yükleniyor...
      </div>
    );
  }

  return (
    <div>
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <button
          className="btn btn-primary btn-large"
          onClick={() => generateExpenseReport(reportPayload)}
        >
          <FileText size={20} />
          <span>Masraf PDF</span>
        </button>

        <button
          className="btn btn-primary btn-large"
          onClick={() => generateHarvestReport(reportPayload)}
        >
          <FileText size={20} />
          <span>Hasat PDF</span>
        </button>

        <button
          className="btn btn-primary btn-large"
          onClick={() => generateProfitReport(reportPayload)}
        >
          <FileText size={20} />
          <span>Kâr / Zarar PDF</span>
        </button>

        <button
          className="btn btn-primary btn-large"
          onClick={() => generateSeasonReport(reportPayload)}
        >
          <FileText size={20} />
          <span>Sezon Özeti PDF</span>
        </button>

        <button
          className="btn btn-primary btn-large"
          onClick={handlePrint}
        >
          <Printer size={20} />
          <span>Raporu Yazdır / PDF Kaydet</span>
        </button>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: "10px" }}>
          Finansal Özet
        </h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li>
            <strong>Toplam Satış Geliri:</strong>{" "}
            {summary.totalIncome.toLocaleString("tr-TR")} TL
          </li>

          <li>
            <strong>Toplam Gider:</strong>{" "}
            {summary.totalExpense.toLocaleString("tr-TR")} TL
          </li>

          <li>
            <strong>Net Kâr / Zarar:</strong>{" "}
            {summary.netProfit.toLocaleString("tr-TR")} TL
          </li>

          <li>
            <strong>Durum:</strong>{" "}
            {summary.netProfit >= 0 ? "Kârda" : "Zararda"}
          </li>
        </ul>

        <h3 style={{ marginTop: "20px" }}>
          Kategori Bazlı Masraflar
        </h3>

        <ul style={{ lineHeight: 1.7 }}>
          {summary.categoryExpenses.length === 0 ? (
            <li>Masraf kaydı bulunmuyor.</li>
          ) : (
            summary.categoryExpenses.map((item) => (
              <li key={item.kategori}>
                <strong>{item.kategori}</strong> :{" "}
                {item.tutar.toLocaleString("tr-TR")} TL
              </li>
            ))
          )}
        </ul>

        <h3 style={{ marginTop: "20px" }}>
          Gider Detayları
        </h3>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {expenseDetails.length === 0 ? (
            <div>Masraf kaydı bulunmuyor.</div>
          ) : (
            expenseDetails.map((item) => (
              <div
                key={item.id}
                style={{
                  border: "1px solid var(--slate-300)",
                  borderRadius: "10px",
                  padding: "12px",
                  background: "var(--white)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                  }}
                >
                  <span>
                    {item.tarih} • {item.kategori}
                  </span>

                  <span>
                    {item.tutar.toLocaleString("tr-TR")} TL
                  </span>
                </div>

                <div style={{ marginTop: "6px" }}>
                  <strong>Ürün:</strong> {item.urunAdi}
                </div>

                <div style={{ marginTop: "4px" }}>
                  <strong>Marka:</strong> {item.gubreMarka}
                </div>

                <div style={{ marginTop: "4px" }}>
                  <strong>Tür:</strong> {item.gubreTuru}
                </div>

                <div style={{ marginTop: "4px" }}>
                  <strong>Çeşit:</strong> {item.gubreCesit}
                </div>

                <div style={{ marginTop: "4px" }}>
                  <strong>Miktar:</strong>{" "}
                  {item.miktar.toLocaleString("tr-TR")} {item.birim}
                </div>

                <div style={{ marginTop: "4px" }}>
                  <strong>Birim Fiyat:</strong>{" "}
                  {item.birimFiyat.toLocaleString("tr-TR")} TL
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