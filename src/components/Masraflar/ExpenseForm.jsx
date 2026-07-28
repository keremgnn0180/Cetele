import React, { memo } from "react";
import { DollarSign } from "lucide-react";

import BrandSelector from "./BrandSelector";
import {
  KATEGORILER,
  NEW_TYPE_OPTION,
  NEW_VARIETY_OPTION,
  PRODUCT_CATEGORIES,
} from "./constants";

function ExpenseForm({
  showModal,
  editingId,
  error,
  form,
  setForm,
  tarlalar,
  onSubmit,
  onClose,
  isManualBrand,
  isManualType,
  isManualVariety,
  newBrand,
  setNewBrand,
  newType,
  setNewType,
  newVariety,
  setNewVariety,
  brandOptions,
  typeOptions,
  varietyOptions,
  birimlerForForm,
  calculatedTotal,
  brandDropdownOpen,
  setBrandDropdownOpen,
}) {
  if (!showModal) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "600px" }}
      >
        <h3
          style={{
            fontSize: "1.5rem",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <DollarSign style={{ color: "var(--primary-600)" }} />
          <span>{editingId ? "Masrafı Düzenle" : "Yeni Masraf Ekle"}</span>
        </h3>

        {error && (
          <div
            className="badge badge-danger"
            style={{
              width: "100%",
              borderRadius: "var(--radius-sm)",
              padding: "12px",
              marginBottom: "16px",
              display: "block",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">İlişkili Tarla</label>
              <select
                className="form-control"
                value={form.tarla_id}
                onChange={(e) => setForm({ ...form, tarla_id: e.target.value })}
              >
                <option value="">Genel (Tarla Dışı Gider)</option>
                {tarlalar.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.isim}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Masraf Kategorisi *</label>
              <select
                className="form-control"
                value={form.kategori}
                onChange={(e) => {
                  const nextKategori = e.target.value;
                  setForm({
                    ...form,
                    kategori: nextKategori,
                    urun_adi: "",
                    gubre_marka: "",
                    gubre_turu: "",
                    gubre_cesit: "",
                    birim: nextKategori === "İşçilik" ? "Dönüm" : "Adet",
                  });
                }}
              >
                {KATEGORILER.map((kat) => (
                  <option key={kat} value={kat}>
                    {kat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {PRODUCT_CATEGORIES.includes(form.kategori) ? (
            <>
              <div className="form-row" style={{ marginTop: "10px" }}>
                <div className="form-group">
                  <label className="form-label">Marka</label>
                  <BrandSelector
                    kategori={form.kategori}
                    form={form}
                    setForm={setForm}
                    isManualBrand={isManualBrand}
                    newBrand={newBrand}
                    setNewBrand={setNewBrand}
                    brandOptions={brandOptions}
                    brandDropdownOpen={brandDropdownOpen}
                    setBrandDropdownOpen={setBrandDropdownOpen}
                  />
                </div>

                {form.kategori === "Gübre" && (
                  <div className="form-group">
                    <label className="form-label">Tür</label>
                    <select
                      className="form-control"
                      value={form.gubre_turu}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          gubre_turu: e.target.value,
                          gubre_cesit: "",
                        })
                      }
                      disabled={!form.gubre_marka}
                    >
                      <option value="">Tür seç</option>
                      {typeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                      <option value={NEW_TYPE_OPTION}>{NEW_TYPE_OPTION}</option>
                    </select>
                    {isManualType && (
                      <input
                        type="text"
                        className="form-control"
                        style={{ marginTop: "8px" }}
                        placeholder="Tür"
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        required
                      />
                    )}
                  </div>
                )}
              </div>

              {form.kategori === "Gübre" && (
                <div className="form-group" style={{ marginTop: "10px" }}>
                  <label className="form-label">Çeşit</label>
                  <select
                    className="form-control"
                    value={form.gubre_cesit}
                    onChange={(e) =>
                      setForm({ ...form, gubre_cesit: e.target.value })
                    }
                    disabled={!form.gubre_turu}
                  >
                    <option value="">Çeşit seç</option>
                    {varietyOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                    <option value={NEW_VARIETY_OPTION}>
                      {NEW_VARIETY_OPTION}
                    </option>
                  </select>
                  {isManualVariety && (
                    <input
                      type="text"
                      className="form-control"
                      style={{ marginTop: "8px" }}
                      placeholder="Çeşit"
                      value={newVariety}
                      onChange={(e) => setNewVariety(e.target.value)}
                      required
                    />
                  )}
                </div>
              )}

              {form.kategori !== "Gübre" && (
                <div className="form-group" style={{ marginTop: "10px" }}>
                  <label className="form-label">
                    Detay (Çeşit, Model, Not vb.)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Örn: LG 59.50 veya Sıvı İlaç"
                    value={form.urun_adi}
                    onChange={(e) =>
                      setForm({ ...form, urun_adi: e.target.value })
                    }
                    maxLength={50}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="form-group" style={{ marginTop: "10px" }}>
              <label className="form-label">
                Masraf Detayı (Marka, Ürün Adı vb.)
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="Örn: Tarla İşçiliği"
                value={form.urun_adi}
                onChange={(e) => {
                  const nextUrun = e.target.value;
                  const shouldUseDonum =
                    form.kategori === "İşçilik" &&
                    nextUrun.trim().toLocaleLowerCase("tr-TR") ===
                      "tarla işçiliği";
                  setForm({
                    ...form,
                    urun_adi: nextUrun,
                    birim: shouldUseDonum ? "Dönüm" : form.birim,
                  });
                }}
                maxLength={50}
              />
            </div>
          )}

          <div className="form-row" style={{ marginTop: "10px" }}>
            <div className="form-group">
              <label className="form-label">Miktar *</label>
              <input
                type="number"
                step="any"
                className="form-control"
                placeholder="Örn: 50"
                value={form.miktar}
                onChange={(e) => setForm({ ...form, miktar: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Miktar Birimi</label>
              <select
                className="form-control"
                value={form.birim}
                onChange={(e) => setForm({ ...form, birim: e.target.value })}
              >
                {birimlerForForm.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row" style={{ marginTop: "10px" }}>
            <div className="form-group">
              <label className="form-label">Birim Fiyatı (TL) *</label>
              <input
                type="number"
                step="any"
                className="form-control"
                placeholder="Örn: 24.50"
                value={form.birim_fiyat}
                onChange={(e) =>
                  setForm({ ...form, birim_fiyat: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label
                className="form-label"
                style={{ color: "var(--slate-500)" }}
              >
                Hesaplanan Toplam Tutar
              </label>
              <div
                className="form-control"
                style={{
                  backgroundColor: "var(--slate-100)",
                  fontWeight: "700",
                  color: "var(--danger)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  height: "46px",
                }}
              >
                {!isNaN(calculatedTotal) && calculatedTotal > 0
                  ? calculatedTotal.toLocaleString("tr-TR")
                  : "0.00"}{" "}
                TL
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: "10px" }}>
            <label className="form-label">Harcanma Tarihi *</label>
            <input
              type="date"
              className="form-control"
              value={form.tarih}
              onChange={(e) => setForm({ ...form, tarih: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Açıklama</label>
            <textarea
              className="form-control"
              placeholder="Ek açıklama girmek için buraya yazın..."
              value={form.aciklama}
              onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
              rows={3}
              maxLength={200}
            />
          </div>

          <div
            style={{
              display: "flex",
              justifyItems: "center",
              gap: "12px",
              marginTop: "24px",
            }}
          >
            <button
              type="button"
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={onClose}
            >
              İptal
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 1 }}
            >
              {editingId ? "Güncelle" : "Kaydet"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default memo(ExpenseForm);
