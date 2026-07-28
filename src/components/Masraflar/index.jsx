import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import DeleteConfirmModal from "../DeleteConfirmModal";
import {
  DEFAULT_BIRIMLER,
  DEFAULT_FILTER_VALUE,
  DEFAULT_FERTILIZERS,
  ISCILIK_BIRIMLER,
  NEW_BRAND_OPTION,
  NEW_TYPE_OPTION,
  NEW_VARIETY_OPTION,
  STORAGE_KEY,
} from "./constants";
import ExpenseFilters from "./ExpenseFilters";
import ExpenseForm from "./ExpenseForm";
import ExpenseTable from "./ExpenseTable";
import {
  buildInitialForm,
  buildEditForm,
  calculateFilteredTotal,
  calculateFormTotal,
  filterMasraflar,
  getBrandOptions,
  getManualBrandValue,
  getTypeOptions,
  getVarietyOptions,
  isTarlaIsciligi,
  mergeFertilizers,
  submitExpense,
} from "./helpers";

function Masraflar() {
  const [masraflar, setMasraflar] = useState([]);
  const [tarlalar, setTarlalar] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [masrafToDelete, setMasrafToDelete] = useState(null);

  const [fertilizers, setFertilizers] = useState(DEFAULT_FERTILIZERS);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [form, setForm] = useState(() => buildInitialForm(DEFAULT_FERTILIZERS));

  const [newBrand, setNewBrand] = useState("");
  const [newType, setNewType] = useState("");
  const [newVariety, setNewVariety] = useState("");

  const [filterTarla, setFilterTarla] = useState(DEFAULT_FILTER_VALUE);
  const [filterKategori, setFilterKategori] = useState(DEFAULT_FILTER_VALUE);
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [filterMinTutar, setFilterMinTutar] = useState("");
  const [filterMaxTutar, setFilterMaxTutar] = useState("");
  const [filterSearch, setFilterSearch] = useState("");

  const isIscilik = form.kategori === "İşçilik";
  const isManualBrand = form.gubre_marka === NEW_BRAND_OPTION;
  const isManualType = form.gubre_turu === NEW_TYPE_OPTION;
  const isManualVariety = form.gubre_cesit === NEW_VARIETY_OPTION;
  const isFormTarlaIsciligi = isTarlaIsciligi(form.urun_adi);

  const filters = useMemo(
    () => ({
      filterTarla,
      filterKategori,
      filterDateStart,
      filterDateEnd,
      filterMinTutar,
      filterMaxTutar,
      filterSearch,
    }),
    [
      filterTarla,
      filterKategori,
      filterDateStart,
      filterDateEnd,
      filterMinTutar,
      filterMaxTutar,
      filterSearch,
    ],
  );

  const filterSetters = useMemo(
    () => ({
      setFilterTarla,
      setFilterKategori,
      setFilterDateStart,
      setFilterDateEnd,
      setFilterMinTutar,
      setFilterMaxTutar,
      setFilterSearch,
    }),
    [],
  );

  const birimlerForForm = useMemo(
    () => (isIscilik ? ISCILIK_BIRIMLER : DEFAULT_BIRIMLER),
    [isIscilik],
  );

  const brandOptions = useMemo(
    () => getBrandOptions(form.kategori, fertilizers),
    [fertilizers, form.kategori],
  );

  const typeOptions = useMemo(
    () => getTypeOptions(fertilizers, form.gubre_marka, isManualBrand),
    [fertilizers, form.gubre_marka, isManualBrand],
  );

  const varietyOptions = useMemo(
    () =>
      getVarietyOptions(
        fertilizers,
        form.gubre_marka,
        form.gubre_turu,
        isManualBrand,
        isManualType,
      ),
    [
      fertilizers,
      form.gubre_marka,
      form.gubre_turu,
      isManualBrand,
      isManualType,
    ],
  );

  const filteredMasraflar = useMemo(
    () => filterMasraflar(masraflar, filters),
    [masraflar, filters],
  );

  const filteredTotal = useMemo(
    () => calculateFilteredTotal(filteredMasraflar),
    [filteredMasraflar],
  );

  const calculatedTotal = useMemo(() => calculateFormTotal(form), [form]);

  const fetchData = useCallback(async () => {
    try {
      const activeTarlalar = await window.api.tarlalar.getAll();
      const sortedTarlalar = [...activeTarlalar].sort((a, b) =>
        a.isim.localeCompare(b.isim, "tr"),
      );
      setTarlalar(sortedTarlalar);

      const activeMasraflar = await window.api.masraflar.getAll();
      setMasraflar(activeMasraflar);
    } catch (err) {
      console.error("Veriler çekilirken hata oluştu:", err);
    }
  }, []);

  const persistFertilizers = useCallback((nextFertilizers) => {
    setFertilizers(nextFertilizers);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFertilizers));
  }, []);

  const resetManualEntries = useCallback(() => {
    setNewBrand("");
    setNewType("");
    setNewVariety("");
  }, []);

  const closeModalAndReset = useCallback(() => {
    setShowModal(false);
    setEditingId(null);
    setError("");
    resetManualEntries();
    setForm(buildInitialForm(fertilizers));
  }, [fertilizers, resetManualEntries]);

  const openCreateModal = useCallback(() => {
    setEditingId(null);
    setForm(buildInitialForm(fertilizers));
    setShowModal(true);
  }, [fertilizers]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setFertilizers(mergeFertilizers(DEFAULT_FERTILIZERS, parsed));
      } catch {
        setFertilizers(DEFAULT_FERTILIZERS);
      }
    }
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (form.kategori === "Gübre" && !form.gubre_marka) {
      const firstBrand = Object.keys(fertilizers)[0] || "";
      setForm((prev) => ({ ...prev, gubre_marka: firstBrand }));
    }
  }, [fertilizers, form.kategori, form.gubre_marka]);

  useEffect(() => {
    if (isIscilik && isFormTarlaIsciligi && form.birim !== "Dönüm") {
      setForm((prev) => ({ ...prev, birim: "Dönüm" }));
    }
  }, [isIscilik, isFormTarlaIsciligi, form.birim]);

  const applyManualEntries = useCallback(() => {
    if (form.kategori !== "Gübre") return { marka: "", tur: "", cesit: "" };

    const marka = getManualBrandValue(form, newBrand);
    const tur = isManualType ? newType.trim() : form.gubre_turu.trim();
    const cesit = isManualVariety ? newVariety.trim() : form.gubre_cesit.trim();

    if (!marka || !tur || !cesit) {
      throw new Error("Gübre için Marka, Tür ve Çeşit zorunludur.");
    }

    const updated = mergeFertilizers(fertilizers, {
      [marka]: { [tur]: [cesit] },
    });
    persistFertilizers(updated);

    return { marka, tur, cesit };
  }, [
    fertilizers,
    form,
    isManualType,
    isManualVariety,
    newBrand,
    newType,
    newVariety,
    persistFertilizers,
  ]);

  const handleSubmit = useCallback(
    async (e) => {
      await submitExpense({
        event: e,
        form,
        editingId,
        newBrand,
        applyManualEntries,
        closeModalAndReset,
        fetchData,
        setError,
      });
    },
    [
      applyManualEntries,
      closeModalAndReset,
      editingId,
      fetchData,
      form,
      newBrand,
    ],
  );

  const handleEdit = useCallback(
    (masraf) => {
      setEditingId(masraf.id);
      setError("");
      resetManualEntries();
      setForm(buildEditForm(masraf));
      setShowModal(true);
    },
    [resetManualEntries],
  );

  const handleDeleteTrigger = useCallback((id) => {
    setMasrafToDelete(id);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!masrafToDelete) return;
    try {
      await window.api.masraflar.remove(masrafToDelete);
      if (window.dashboardCache) window.dashboardCache.isDirty = true;
      setMasrafToDelete(null);
      fetchData();
    } catch (err) {
      alert("Kayıt silinirken hata oluştu: " + err.message);
    }
  }, [fetchData, masrafToDelete]);

  const handleClearFilters = useCallback(() => {
    setFilterTarla(DEFAULT_FILTER_VALUE);
    setFilterKategori(DEFAULT_FILTER_VALUE);
    setFilterDateStart("");
    setFilterDateEnd("");
    setFilterMinTutar("");
    setFilterMaxTutar("");
    setFilterSearch("");
  }, []);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.25rem", color: "var(--slate-700)" }}>
            Listelenen Toplam Masraf:{" "}
            <span style={{ color: "var(--danger)", fontWeight: "800" }}>
              {filteredTotal.toLocaleString("tr-TR")} TL
            </span>
          </h2>
        </div>
        <button className="btn btn-primary btn-large" onClick={openCreateModal}>
          <Plus size={20} />
          <span>Yeni Masraf Ekle</span>
        </button>
      </div>

      <ExpenseFilters
        filters={filters}
        setters={filterSetters}
        tarlalar={tarlalar}
        onClearFilters={handleClearFilters}
      />

      <ExpenseTable
        masraflar={filteredMasraflar}
        onEdit={handleEdit}
        onDelete={handleDeleteTrigger}
      />

      <ExpenseForm
        showModal={showModal}
        editingId={editingId}
        error={error}
        form={form}
        setForm={setForm}
        tarlalar={tarlalar}
        onSubmit={handleSubmit}
        onClose={closeModalAndReset}
        isManualBrand={isManualBrand}
        isManualType={isManualType}
        isManualVariety={isManualVariety}
        newBrand={newBrand}
        setNewBrand={setNewBrand}
        newType={newType}
        setNewType={setNewType}
        newVariety={newVariety}
        setNewVariety={setNewVariety}
        brandOptions={brandOptions}
        typeOptions={typeOptions}
        varietyOptions={varietyOptions}
        birimlerForForm={birimlerForForm}
        calculatedTotal={calculatedTotal}
        brandDropdownOpen={brandDropdownOpen}
        setBrandDropdownOpen={setBrandDropdownOpen}
      />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Masraf Kaydını Sil"
      />
    </div>
  );
}

export default Masraflar;
