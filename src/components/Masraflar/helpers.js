import { Combine, ShieldCheck, Sprout } from "lucide-react";

import {
  BRAND_OPTIONS_MAP,
  DEFAULT_FILTER_VALUE,
  GENERAL_FILTER_VALUE,
  NEW_BRAND_OPTION,
  PRODUCT_CATEGORIES,
} from "./constants";

export function mergeFertilizers(base, custom) {
  const merged = JSON.parse(JSON.stringify(base));
  Object.entries(custom || {}).forEach(([brand, typeMap]) => {
    if (!merged[brand]) merged[brand] = {};
    Object.entries(typeMap || {}).forEach(([type, varieties]) => {
      if (!merged[brand][type]) merged[brand][type] = [];
      const set = new Set([
        ...(merged[brand][type] || []),
        ...(varieties || []),
      ]);
      merged[brand][type] = Array.from(set);
    });
  });
  return merged;
}

export function buildInitialForm(fertilizers) {
  return {
    tarla_id: "",
    kategori: "Gübre",
    gubre_marka: Object.keys(fertilizers)[0] || "",
    gubre_turu: "",
    gubre_cesit: "",
    urun_adi: "",
    miktar: "",
    birim: "Adet",
    birim_fiyat: "",
    tarih: new Date().toISOString().split("T")[0],
    aciklama: "",
  };
}

export function isProductCategory(kategori) {
  return PRODUCT_CATEGORIES.includes(kategori);
}

export function isTarlaIsciligi(value) {
  return value.trim().toLocaleLowerCase("tr-TR") === "tarla işçiliği";
}

export function getBrandOptions(kategori, fertilizers) {
  if (kategori === "Gübre") {
    return Object.keys(fertilizers);
  }
  return (BRAND_OPTIONS_MAP[kategori] || []).map((b) => b.name);
}

export function getBrandIcon(kategori, brandName) {
  const list = BRAND_OPTIONS_MAP[kategori] || [];
  const matched = list.find((b) => b.name === brandName);
  if (matched) return matched.icon;
  if (kategori === "Tohum") return Sprout;
  if (kategori === "İlaç") return ShieldCheck;
  return Combine;
}

export function getTypeOptions(fertilizers, brand, isManualBrand) {
  if (!brand || isManualBrand) return [];
  return Object.keys(fertilizers[brand] || {});
}

export function getVarietyOptions(
  fertilizers,
  brand,
  type,
  isManualBrand,
  isManualType,
) {
  if (!brand || !type || isManualBrand || isManualType) return [];
  return fertilizers[brand]?.[type] || [];
}

export function filterMasraflar(masraflar, filters) {
  const {
    filterTarla,
    filterKategori,
    filterDateStart,
    filterDateEnd,
    filterMinTutar,
    filterMaxTutar,
    filterSearch,
  } = filters;

  return masraflar.filter((m) => {
    if (filterTarla !== DEFAULT_FILTER_VALUE) {
      if (filterTarla === GENERAL_FILTER_VALUE && m.tarla_id !== null)
        return false;
      if (
        filterTarla !== GENERAL_FILTER_VALUE &&
        m.tarla_id?.toString() !== filterTarla
      )
        return false;
    }
    if (
      filterKategori !== DEFAULT_FILTER_VALUE &&
      m.kategori !== filterKategori
    )
      return false;
    if (filterDateStart && m.tarih < filterDateStart) return false;
    if (filterDateEnd && m.tarih > filterDateEnd) return false;
    if (filterMinTutar && m.tutar < parseFloat(filterMinTutar)) return false;
    if (filterMaxTutar && m.tutar > parseFloat(filterMaxTutar)) return false;

    if (filterSearch.trim() !== "") {
      const s = filterSearch.toLowerCase();
      const urunMatch = m.urun_adi?.toLowerCase().includes(s) || false;
      const aciklamaMatch = m.aciklama?.toLowerCase().includes(s) || false;
      const kategoriMatch = m.kategori.toLowerCase().includes(s);
      const tarlaMatch = m.tarla_isim?.toLowerCase().includes(s) || false;
      if (!urunMatch && !aciklamaMatch && !kategoriMatch && !tarlaMatch)
        return false;
    }
    return true;
  });
}

export function calculateFilteredTotal(masraflar) {
  return masraflar.reduce((sum, m) => sum + m.tutar, 0);
}

export function calculateFormTotal(form) {
  return parseFloat(form.miktar) * parseFloat(form.birim_fiyat);
}

export function getKategoriColor(kategori) {
  switch (kategori) {
    case "Gübre":
      return "badge-success";
    case "İlaç":
      return "badge-danger";
    case "Tohum":
      return "badge-warning";
    case "Yakıt":
      return "badge-primary";
    case "İşçilik":
      return { backgroundColor: "hsl(195, 80%, 93%)", color: "var(--info)" };
    default:
      return "badge-primary";
  }
}

export function hasActiveFilters(filters) {
  return (
    filters.filterTarla !== DEFAULT_FILTER_VALUE ||
    filters.filterKategori !== DEFAULT_FILTER_VALUE ||
    filters.filterDateStart ||
    filters.filterDateEnd ||
    filters.filterMinTutar ||
    filters.filterMaxTutar ||
    filters.filterSearch
  );
}

export function getManualBrandValue(form, newBrand) {
  return form.gubre_marka === NEW_BRAND_OPTION
    ? newBrand.trim()
    : form.gubre_marka.trim();
}

export function validateExpenseForm(form) {
  if (!form.kategori || !form.miktar || !form.birim_fiyat || !form.tarih) {
    return { error: "Lütfen zorunlu alanları doldurun." };
  }

  const miktarNum = parseFloat(form.miktar);
  const birimFiyatNum = parseFloat(form.birim_fiyat);

  if (isNaN(miktarNum) || miktarNum <= 0) {
    return { error: "Miktar pozitif bir sayı olmalıdır." };
  }
  if (isNaN(birimFiyatNum) || birimFiyatNum <= 0) {
    return { error: "Birim fiyat pozitif bir sayı olmalıdır." };
  }

  return { miktarNum, birimFiyatNum };
}

export function buildExpensePayload(
  form,
  fertilizerFields,
  miktarNum,
  birimFiyatNum,
) {
  const fertilizerName = isProductCategory(form.kategori)
    ? form.kategori === "Gübre"
      ? [fertilizerFields.marka, fertilizerFields.tur, fertilizerFields.cesit]
          .filter(Boolean)
          .join(" - ")
          .trim()
      : [fertilizerFields.marka, form.urun_adi.trim()]
          .filter(Boolean)
          .join(" - ")
          .trim()
    : form.urun_adi.trim();

  return {
    tarla_id: form.tarla_id ? parseInt(form.tarla_id) : null,
    kategori: form.kategori,
    urun_adi: fertilizerName || null,
    gubre_marka: PRODUCT_CATEGORIES.includes(form.kategori)
      ? fertilizerFields.marka
      : null,
    gubre_turu: form.kategori === "Gübre" ? fertilizerFields.tur : null,
    gubre_cesit: form.kategori === "Gübre" ? fertilizerFields.cesit : null,
    miktar: miktarNum,
    birim: form.birim,
    birim_fiyat: birimFiyatNum,
    tarih: form.tarih,
    aciklama: form.aciklama.trim() || null,
  };
}

export function buildEditForm(masraf) {
  return {
    tarla_id: masraf.tarla_id ? String(masraf.tarla_id) : "",
    kategori: masraf.kategori || "Gübre",
    gubre_marka: masraf.gubre_marka || "",
    gubre_turu: masraf.gubre_turu || "",
    gubre_cesit: masraf.gubre_cesit || "",
    urun_adi:
      PRODUCT_CATEGORIES.includes(masraf.kategori) && masraf.gubre_marka
        ? (masraf.urun_adi || "").replace(masraf.gubre_marka + " - ", "")
        : masraf.urun_adi || "",
    miktar: masraf.miktar?.toString() || "",
    birim: masraf.birim || "Adet",
    birim_fiyat: masraf.birim_fiyat?.toString() || "",
    tarih: String(masraf.tarih || "").slice(0, 10),
    aciklama: masraf.aciklama || "",
  };
}

export async function submitExpense({
  event,
  form,
  editingId,
  newBrand,
  applyManualEntries,
  closeModalAndReset,
  fetchData,
  setError,
}) {
  event.preventDefault();
  setError("");

  const validation = validateExpenseForm(form);
  if (validation.error) {
    setError(validation.error);
    return;
  }

  try {
    let fertilizerFields = { marka: null, tur: null, cesit: null };
    if (form.kategori === "Gübre") {
      fertilizerFields = applyManualEntries();
    } else if (["İlaç", "Tohum"].includes(form.kategori)) {
      fertilizerFields.marka = getManualBrandValue(form, newBrand);
    }

    const payload = buildExpensePayload(
      form,
      fertilizerFields,
      validation.miktarNum,
      validation.birimFiyatNum,
    );

    if (editingId) {
      await window.api.masraflar.update(editingId, payload);
    } else {
      await window.api.masraflar.add(payload);
    }

    if (window.dashboardCache) {
      window.dashboardCache.isDirty = true;
    }

    closeModalAndReset();
    fetchData();
  } catch (err) {
    setError(
      `Masraf ${editingId ? "güncellenirken" : "eklenirken"} hata oluştu: ` +
        err.message,
    );
  }
}
