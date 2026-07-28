import React, { memo } from "react";
import { Filter, Search, X } from "lucide-react";

import {
  DEFAULT_FILTER_VALUE,
  GENERAL_FILTER_VALUE,
  KATEGORILER,
} from "./constants";
import { hasActiveFilters } from "./helpers";

function ExpenseFilters({ filters, setters, tarlalar, onClearFilters }) {
  return (
    <div className="filter-panel">
      <div className="filter-header">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
          }}
        >
          <Filter size={18} style={{ color: "var(--primary-600)" }} />
          <span>Gelişmiş Filtreler</span>
        </div>
        {hasActiveFilters(filters) && (
          <button
            onClick={onClearFilters}
            style={{
              background: "none",
              border: "none",
              color: "var(--danger)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: "600",
            }}
          >
            <X size={14} />
            <span>Filtreleri Temizle</span>
          </button>
        )}
      </div>

      <div className="filter-grid">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: "0.8rem" }}>
            Tarla
          </label>
          <select
            className="form-control"
            style={{ padding: "8px 12px" }}
            value={filters.filterTarla}
            onChange={(e) => setters.setFilterTarla(e.target.value)}
          >
            <option value={DEFAULT_FILTER_VALUE}>Tüm Tarlalar</option>
            <option value={GENERAL_FILTER_VALUE}>Sadece Genel Masraflar</option>
            {tarlalar.map((t) => (
              <option key={t.id} value={t.id.toString()}>
                {t.isim}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: "0.8rem" }}>
            Kategori
          </label>
          <select
            className="form-control"
            style={{ padding: "8px 12px" }}
            value={filters.filterKategori}
            onChange={(e) => setters.setFilterKategori(e.target.value)}
          >
            <option value={DEFAULT_FILTER_VALUE}>Tüm Kategoriler</option>
            {KATEGORILER.map((kat) => (
              <option key={kat} value={kat}>
                {kat}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: "0.8rem" }}>
            Tarih (Başlangıç)
          </label>
          <input
            type="date"
            className="form-control"
            style={{ padding: "8px 12px" }}
            value={filters.filterDateStart}
            onChange={(e) => setters.setFilterDateStart(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: "0.8rem" }}>
            Tarih (Bitiş)
          </label>
          <input
            type="date"
            className="form-control"
            style={{ padding: "8px 12px" }}
            value={filters.filterDateEnd}
            onChange={(e) => setters.setFilterDateEnd(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: "0.8rem" }}>
            Min Tutar (TL)
          </label>
          <input
            type="number"
            placeholder="Min"
            className="form-control"
            style={{ padding: "8px 12px" }}
            value={filters.filterMinTutar}
            onChange={(e) => setters.setFilterMinTutar(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: "0.8rem" }}>
            Max Tutar (TL)
          </label>
          <input
            type="number"
            placeholder="Max"
            className="form-control"
            style={{ padding: "8px 12px" }}
            value={filters.filterMaxTutar}
            onChange={(e) => setters.setFilterMaxTutar(e.target.value)}
          />
        </div>
      </div>

      <div
        className="form-group"
        style={{ marginBottom: 0, position: "relative" }}
      >
        <label className="form-label" style={{ fontSize: "0.8rem" }}>
          Detaylı Arama
        </label>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="Ürün adı, açıklama, kategori veya tarla adı ara..."
            className="form-control"
            style={{ padding: "10px 16px 10px 40px" }}
            value={filters.filterSearch}
            onChange={(e) => setters.setFilterSearch(e.target.value)}
          />
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "14px",
              top: "12px",
              color: "var(--slate-500)",
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default memo(ExpenseFilters);
