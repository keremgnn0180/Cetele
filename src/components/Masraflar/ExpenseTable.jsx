import React, { memo } from "react";
import { DollarSign, Pencil, Trash2 } from "lucide-react";

import { getKategoriColor } from "./helpers";

function ExpenseTable({ masraflar, onEdit, onDelete }) {
  if (masraflar.length === 0) {
    return (
      <div className="card empty-state">
        <DollarSign size={48} />
        <h3>Kayıtlı masraf bulunamadı.</h3>
        <p style={{ marginTop: "8px" }}>
          Girdiğiniz filtrelere uygun veya kayıtlı bir masraf bulunamadı.
          &quot;Yeni Masraf Ekle&quot; ile başlayabilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Tarla</th>
            <th>Kategori</th>
            <th>Masraf Detayı</th>
            <th>Miktar</th>
            <th>Birim Fiyat</th>
            <th>Toplam Tutar</th>
            <th>Tarih</th>
            <th>Açıklama</th>
            <th style={{ textAlign: "right" }}>İşlem</th>
          </tr>
        </thead>
        <tbody>
          {masraflar.map((masraf) => {
            const colorStyle = getKategoriColor(masraf.kategori);
            const isCustomBadge = typeof colorStyle === "object";
            return (
              <tr key={masraf.id}>
                <td style={{ fontWeight: "600", color: "var(--slate-900)" }}>
                  {masraf.tarla_isim || (
                    <span
                      style={{
                        color: "var(--slate-500)",
                        fontStyle: "italic",
                        fontWeight: "normal",
                      }}
                    >
                      Genel Masraf
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={isCustomBadge ? "badge" : `badge ${colorStyle}`}
                    style={isCustomBadge ? colorStyle : undefined}
                  >
                    {masraf.kategori}
                  </span>
                </td>
                <td style={{ fontWeight: "500" }}>{masraf.urun_adi || "-"}</td>
                <td>
                  {masraf.miktar} {masraf.birim}
                </td>
                <td>{masraf.birim_fiyat.toLocaleString("tr-TR")} TL</td>
                <td style={{ fontWeight: "700", color: "var(--danger)" }}>
                  {masraf.tutar.toLocaleString("tr-TR")} TL
                </td>
                <td>
                  {new Date(masraf.tarih).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </td>
                <td
                  style={{
                    color: "var(--slate-600)",
                    maxWidth: "200px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={masraf.aciklama}
                >
                  {masraf.aciklama || "-"}
                </td>
                <td style={{ textAlign: "right" }}>
                  <button
                    className="btn btn-secondary"
                    style={{
                      color: "var(--primary-700)",
                      borderColor: "transparent",
                      padding: "6px 12px",
                      boxShadow: "none",
                      marginRight: "6px",
                    }}
                    onClick={() => onEdit(masraf)}
                  >
                    <Pencil size={16} />
                    <span>Düzenle</span>
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{
                      color: "var(--danger)",
                      borderColor: "transparent",
                      padding: "6px 12px",
                      boxShadow: "none",
                    }}
                    onClick={() => onDelete(masraf.id)}
                  >
                    <Trash2 size={16} />
                    <span>Sil</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default memo(ExpenseTable);
