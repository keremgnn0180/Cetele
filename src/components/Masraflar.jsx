import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, DollarSign, Filter, X, Search, Pencil } from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';

const DEFAULT_FERTILIZERS = {
  Yara: {
    'Üre': ['Yara Üre'],
    DAP: ['Yara DAP'],
    CAN: ['YaraBela CAN 26'],
    NPK: ['YaraMila Complex', 'YaraMila Cropcare'],
    Organik: ['Yara Organik'],
    'Amonyum Sülfat': ['Yara Amonyum Sülfat'],
    'Potasyum Nitrat': ['Yara Potasyum Nitrat'],
    Çinko: ['Yara Çinko'],
    'Mikro Element': ['Yara Mikro Element'],
    'Sıvı Gübre': ['YaraTera']
  },
  Toros: {
    'Üre': ['Üre 46'],
    DAP: ['DAP 18-46', 'Toros DAP Plus'],
    CAN: ['Toros CAN'],
    NPK: ['Toros NPK'],
    Organik: ['Toros Organik'],
    'Amonyum Sülfat': ['Toros Amonyum Sülfat'],
    'Potasyum Nitrat': ['Toros Potasyum Nitrat'],
    Çinko: ['Toros Çinko'],
    'Mikro Element': ['Toros Mikro Element'],
    'Sıvı Gübre': ['Toros Sıvı Gübre']
  },
  'Gübretaş': {
    'Üre': ['Gübretaş Üre'],
    DAP: ['Gübretaş DAP'],
    CAN: ['Gübretaş CAN'],
    NPK: ['20-20-0', '15-15-15', '25-5-10'],
    Organik: ['Gübretaş Organik'],
    'Amonyum Sülfat': ['Gübretaş Amonyum Sülfat'],
    'Potasyum Nitrat': ['Gübretaş Potasyum Nitrat'],
    Çinko: ['Gübretaş Çinko'],
    'Mikro Element': ['Gübretaş Mikro Element'],
    'Sıvı Gübre': ['Gübretaş Sıvı Gübre']
  },
  'İGSAŞ': {
    'Üre': ['İGSAŞ Üre'],
    DAP: ['İGSAŞ DAP'],
    CAN: ['CAN 26'],
    NPK: ['İGSAŞ NPK'],
    Organik: ['İGSAŞ Organik'],
    'Amonyum Sülfat': ['Amonyum Sülfat'],
    'Potasyum Nitrat': ['İGSAŞ Potasyum Nitrat'],
    Çinko: ['İGSAŞ Çinko'],
    'Mikro Element': ['İGSAŞ Mikro Element'],
    'Sıvı Gübre': ['İGSAŞ Sıvı Gübre']
  },
  Bagfaş: {
    'Üre': ['Bagfaş Üre'],
    DAP: ['Bagfaş DAP'],
    CAN: ['Bagfaş CAN'],
    NPK: ['Bagfaş NPK'],
    Organik: ['Bagfaş Organik'],
    'Amonyum Sülfat': ['Bagfaş Amonyum Sülfat'],
    'Potasyum Nitrat': ['Bagfaş Potasyum Nitrat'],
    Çinko: ['Bagfaş Çinko'],
    'Mikro Element': ['Bagfaş Mikro Element'],
    'Sıvı Gübre': ['Bagfaş Sıvı Gübre']
  },
  Hektaş: {
    'Sıvı Gübre': ['Hektaş Sıvı Gübre'],
    'Mikro Element': ['Hektaş Mikro Element']
  },
  'Eti Gübre': {
    NPK: ['Eti Gübre NPK'],
    DAP: ['Eti Gübre DAP']
  },
  EuroChem: {
    NPK: ['EuroChem NPK'],
    DAP: ['EuroChem DAP']
  },
  Basf: {
    'Mikro Element': ['Basf Mikro Element'],
    Çinko: ['Basf Çinko']
  },
  Bayer: {
    'Mikro Element': ['Bayer Mikro Element'],
    'Sıvı Gübre': ['Bayer Sıvı Gübre']
  }
};

const STORAGE_KEY = 'cetele_fertilizers';
const NEW_BRAND_OPTION = '+ Yeni Marka Ekle';
const NEW_TYPE_OPTION = '+ Yeni Tür Ekle';
const NEW_VARIETY_OPTION = '+ Yeni Çeşit Ekle';

function mergeFertilizers(base, custom) {
  const merged = JSON.parse(JSON.stringify(base));
  Object.entries(custom || {}).forEach(([brand, typeMap]) => {
    if (!merged[brand]) merged[brand] = {};
    Object.entries(typeMap || {}).forEach(([type, varieties]) => {
      if (!merged[brand][type]) merged[brand][type] = [];
      const set = new Set([...(merged[brand][type] || []), ...(varieties || [])]);
      merged[brand][type] = Array.from(set);
    });
  });
  return merged;
}

function Masraflar() {
  const [masraflar, setMasraflar] = useState([]);
  const [tarlalar, setTarlalar] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [masrafToDelete, setMasrafToDelete] = useState(null);

  const [fertilizers, setFertilizers] = useState(DEFAULT_FERTILIZERS);

  const [form, setForm] = useState({
    tarla_id: '',
    kategori: 'Gübre',
    gubre_marka: '',
    gubre_turu: '',
    gubre_cesit: '',
    urun_adi: '',
    miktar: '',
    birim: 'Adet',
    birim_fiyat: '',
    tarih: new Date().toISOString().split('T')[0],
    aciklama: ''
  });

  const [newBrand, setNewBrand] = useState('');
  const [newType, setNewType] = useState('');
  const [newVariety, setNewVariety] = useState('');

  const [filterTarla, setFilterTarla] = useState('HEPSİ');
  const [filterKategori, setFilterKategori] = useState('HEPSİ');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterMinTutar, setFilterMinTutar] = useState('');
  const [filterMaxTutar, setFilterMaxTutar] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const kategoriler = ['Gübre', 'İlaç', 'Tohum', 'Yakıt', 'İşçilik', 'Diğer'];
  const defaultBirimler = ['Adet', 'Kilo', 'Litre', 'Ton', 'Çuval', 'Paket', 'Dekar'];
  const isIscilik = form.kategori === 'İşçilik';
  const isTarlaIsciligi = form.urun_adi.trim().toLocaleLowerCase('tr-TR') === 'tarla işçiliği';
  const isManualBrand = form.gubre_marka === NEW_BRAND_OPTION;
  const isManualType = form.gubre_turu === NEW_TYPE_OPTION;
  const isManualVariety = form.gubre_cesit === NEW_VARIETY_OPTION;

  const birimlerForForm = isIscilik
    ? ['Adet', 'Saat', 'Gün', 'Dönüm', 'Dekar', 'Hektar', 'Çuval', 'Paket']
    : defaultBirimler;

  const brandOptions = useMemo(() => Object.keys(fertilizers), [fertilizers]);
  const typeOptions = useMemo(() => {
    if (!form.gubre_marka || isManualBrand) return [];
    return Object.keys(fertilizers[form.gubre_marka] || {});
  }, [fertilizers, form.gubre_marka, isManualBrand]);

  const varietyOptions = useMemo(() => {
    if (!form.gubre_marka || !form.gubre_turu || isManualBrand || isManualType) return [];
    return fertilizers[form.gubre_marka]?.[form.gubre_turu] || [];
  }, [fertilizers, form.gubre_marka, form.gubre_turu, isManualBrand, isManualType]);

  const persistFertilizers = (nextFertilizers) => {
    setFertilizers(nextFertilizers);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextFertilizers));
  };

  const buildInitialForm = () => ({
    tarla_id: '',
    kategori: 'Gübre',
    gubre_marka: Object.keys(fertilizers)[0] || '',
    gubre_turu: '',
    gubre_cesit: '',
    urun_adi: '',
    miktar: '',
    birim: 'Adet',
    birim_fiyat: '',
    tarih: new Date().toISOString().split('T')[0],
    aciklama: ''
  });

  const closeModalAndReset = () => {
    setShowModal(false);
    setEditingId(null);
    setError('');
    setNewBrand('');
    setNewType('');
    setNewVariety('');
    setForm(buildInitialForm());
  };

  const fetchData = async () => {
    try {
      const activeTarlalar = await window.api.tarlalar.getAll();
      const sortedTarlalar = [...activeTarlalar].sort((a, b) => a.isim.localeCompare(b.isim, 'tr'));
      setTarlalar(sortedTarlalar);

      const activeMasraflar = await window.api.masraflar.getAll();
      setMasraflar(activeMasraflar);
    } catch (err) {
      console.error('Veriler çekilirken hata oluştu:', err);
    }
  };

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
  }, []);

  useEffect(() => {
    if (form.kategori === 'Gübre' && !form.gubre_marka) {
      const firstBrand = Object.keys(fertilizers)[0] || '';
      setForm((prev) => ({ ...prev, gubre_marka: firstBrand }));
    }
  }, [fertilizers, form.kategori, form.gubre_marka]);

  useEffect(() => {
    if (isIscilik && isTarlaIsciligi && form.birim !== 'Dönüm') {
      setForm((prev) => ({ ...prev, birim: 'Dönüm' }));
    }
  }, [isIscilik, isTarlaIsciligi, form.birim]);

  const applyManualEntries = () => {
    if (form.kategori !== 'Gübre') return { marka: '', tur: '', cesit: '' };

    const marka = isManualBrand ? newBrand.trim() : form.gubre_marka.trim();
    const tur = isManualType ? newType.trim() : form.gubre_turu.trim();
    const cesit = isManualVariety ? newVariety.trim() : form.gubre_cesit.trim();

    if (!marka || !tur || !cesit) {
      throw new Error('Gübre için Marka, Tür ve Çeşit zorunludur.');
    }

    const updated = mergeFertilizers(fertilizers, {
      [marka]: { [tur]: [cesit] }
    });
    persistFertilizers(updated);

    return { marka, tur, cesit };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.kategori || !form.miktar || !form.birim_fiyat || !form.tarih) {
      setError('Lütfen zorunlu alanları doldurun.');
      return;
    }

    const miktarNum = parseFloat(form.miktar);
    const birimFiyatNum = parseFloat(form.birim_fiyat);

    if (isNaN(miktarNum) || miktarNum <= 0) {
      setError('Miktar pozitif bir sayı olmalıdır.');
      return;
    }
    if (isNaN(birimFiyatNum) || birimFiyatNum <= 0) {
      setError('Birim fiyat pozitif bir sayı olmalıdır.');
      return;
    }

    try {
      let fertilizerFields = { marka: null, tur: null, cesit: null };
      if (form.kategori === 'Gübre') {
        fertilizerFields = applyManualEntries();
      }

      const fertilizerName = form.kategori === 'Gübre'
        ? [fertilizerFields.marka, fertilizerFields.tur, fertilizerFields.cesit].filter(Boolean).join(' - ').trim()
        : form.urun_adi.trim();

      const payload = {
        tarla_id: form.tarla_id ? parseInt(form.tarla_id) : null,
        kategori: form.kategori,
        urun_adi: fertilizerName || null,
        gubre_marka: form.kategori === 'Gübre' ? fertilizerFields.marka : null,
        gubre_turu: form.kategori === 'Gübre' ? fertilizerFields.tur : null,
        gubre_cesit: form.kategori === 'Gübre' ? fertilizerFields.cesit : null,
        miktar: miktarNum,
        birim: form.birim,
        birim_fiyat: birimFiyatNum,
        tarih: form.tarih,
        aciklama: form.aciklama.trim() || null
      };

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
      setError(`Masraf ${editingId ? 'güncellenirken' : 'eklenirken'} hata oluştu: ` + err.message);
    }
  };

  const handleEdit = (masraf) => {
    setEditingId(masraf.id);
    setError('');
    setNewBrand('');
    setNewType('');
    setNewVariety('');

    setForm({
      tarla_id: masraf.tarla_id ? String(masraf.tarla_id) : '',
      kategori: masraf.kategori || 'Gübre',
      gubre_marka: masraf.gubre_marka || '',
      gubre_turu: masraf.gubre_turu || '',
      gubre_cesit: masraf.gubre_cesit || '',
      urun_adi: masraf.kategori === 'Gübre' ? '' : (masraf.urun_adi || ''),
      miktar: masraf.miktar?.toString() || '',
      birim: masraf.birim || 'Adet',
      birim_fiyat: masraf.birim_fiyat?.toString() || '',
      tarih: String(masraf.tarih || '').slice(0, 10),
      aciklama: masraf.aciklama || ''
    });

    setShowModal(true);
  };

  const handleDeleteTrigger = (id) => {
    setMasrafToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!masrafToDelete) return;
    try {
      await window.api.masraflar.remove(masrafToDelete);
      if (window.dashboardCache) window.dashboardCache.isDirty = true;
      setMasrafToDelete(null);
      fetchData();
    } catch (err) {
      alert('Kayıt silinirken hata oluştu: ' + err.message);
    }
  };

  const handleClearFilters = () => {
    setFilterTarla('HEPSİ');
    setFilterKategori('HEPSİ');
    setFilterDateStart('');
    setFilterDateEnd('');
    setFilterMinTutar('');
    setFilterMaxTutar('');
    setFilterSearch('');
  };

  const filteredMasraflar = masraflar.filter((m) => {
    if (filterTarla !== 'HEPSİ') {
      if (filterTarla === 'GENEL' && m.tarla_id !== null) return false;
      if (filterTarla !== 'GENEL' && m.tarla_id?.toString() !== filterTarla) return false;
    }
    if (filterKategori !== 'HEPSİ' && m.kategori !== filterKategori) return false;
    if (filterDateStart && m.tarih < filterDateStart) return false;
    if (filterDateEnd && m.tarih > filterDateEnd) return false;
    if (filterMinTutar && m.tutar < parseFloat(filterMinTutar)) return false;
    if (filterMaxTutar && m.tutar > parseFloat(filterMaxTutar)) return false;

    if (filterSearch.trim() !== '') {
      const s = filterSearch.toLowerCase();
      const urunMatch = m.urun_adi?.toLowerCase().includes(s) || false;
      const aciklamaMatch = m.aciklama?.toLowerCase().includes(s) || false;
      const kategoriMatch = m.kategori.toLowerCase().includes(s);
      const tarlaMatch = m.tarla_isim?.toLowerCase().includes(s) || false;
      if (!urunMatch && !aciklamaMatch && !kategoriMatch && !tarlaMatch) return false;
    }
    return true;
  });

  const filteredTotal = filteredMasraflar.reduce((sum, m) => sum + m.tutar, 0);

  const getKategoriColor = (kategori) => {
    switch (kategori) {
      case 'Gübre': return 'badge-success';
      case 'İlaç': return 'badge-danger';
      case 'Tohum': return 'badge-warning';
      case 'Yakıt': return 'badge-primary';
      case 'İşçilik': return { backgroundColor: 'hsl(195, 80%, 93%)', color: 'var(--info)' };
      default: return 'badge-primary';
    }
  };

  const calculatedTotal = parseFloat(form.miktar) * parseFloat(form.birim_fiyat);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--slate-700)' }}>
            Listelenen Toplam Masraf: <span style={{ color: 'var(--danger)', fontWeight: '800' }}>{filteredTotal.toLocaleString('tr-TR')} TL</span>
          </h2>
        </div>
        <button className="btn btn-primary btn-large" onClick={() => { setEditingId(null); setForm(buildInitialForm()); setShowModal(true); }}>
          <Plus size={20} />
          <span>Yeni Masraf Ekle</span>
        </button>
      </div>

      <div className="filter-panel">
        <div className="filter-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <Filter size={18} style={{ color: 'var(--primary-600)' }} />
            <span>Gelişmiş Filtreler</span>
          </div>
          {(filterTarla !== 'HEPSİ' || filterKategori !== 'HEPSİ' || filterDateStart || filterDateEnd || filterMinTutar || filterMaxTutar || filterSearch) && (
            <button
              onClick={handleClearFilters}
              style={{ background: 'none', border: 'none', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
            >
              <X size={14} />
              <span>Filtreleri Temizle</span>
            </button>
          )}
        </div>

        <div className="filter-grid">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Tarla</label>
            <select
              className="form-control"
              style={{ padding: '8px 12px' }}
              value={filterTarla}
              onChange={(e) => setFilterTarla(e.target.value)}
            >
              <option value="HEPSİ">Tüm Tarlalar</option>
              <option value="GENEL">Sadece Genel Masraflar</option>
              {tarlalar.map(t => (
                <option key={t.id} value={t.id.toString()}>{t.isim}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Kategori</label>
            <select
              className="form-control"
              style={{ padding: '8px 12px' }}
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
            >
              <option value="HEPSİ">Tüm Kategoriler</option>
              {kategoriler.map(kat => (
                <option key={kat} value={kat}>{kat}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Tarih (Başlangıç)</label>
            <input
              type="date"
              className="form-control"
              style={{ padding: '8px 12px' }}
              value={filterDateStart}
              onChange={(e) => setFilterDateStart(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Tarih (Bitiş)</label>
            <input
              type="date"
              className="form-control"
              style={{ padding: '8px 12px' }}
              value={filterDateEnd}
              onChange={(e) => setFilterDateEnd(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Min Tutar (TL)</label>
            <input
              type="number"
              placeholder="Min"
              className="form-control"
              style={{ padding: '8px 12px' }}
              value={filterMinTutar}
              onChange={(e) => setFilterMinTutar(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Max Tutar (TL)</label>
            <input
              type="number"
              placeholder="Max"
              className="form-control"
              style={{ padding: '8px 12px' }}
              value={filterMaxTutar}
              onChange={(e) => setFilterMaxTutar(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Detaylı Arama</label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Ürün adı, açıklama, kategori veya tarla adı ara..."
              className="form-control"
              style={{ padding: '10px 16px 10px 40px' }}
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--slate-500)' }} />
          </div>
        </div>
      </div>

      {filteredMasraflar.length === 0 ? (
        <div className="card empty-state">
          <DollarSign size={48} />
          <h3>Kayıtlı masraf bulunamadı.</h3>
          <p style={{ marginTop: '8px' }}>Girdiğiniz filtrelere uygun veya kayıtlı bir masraf bulunamadı. "Yeni Masraf Ekle" ile başlayabilirsiniz.</p>
        </div>
      ) : (
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
                <th style={{ textAlign: 'right' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredMasraflar.map((masraf) => {
                const colorStyle = getKategoriColor(masraf.kategori);
                const isCustomBadge = typeof colorStyle === 'object';
                return (
                  <tr key={masraf.id}>
                    <td style={{ fontWeight: '600', color: 'var(--slate-900)' }}>
                      {masraf.tarla_isim || <span style={{ color: 'var(--slate-500)', fontStyle: 'italic', fontWeight: 'normal' }}>Genel Masraf</span>}
                    </td>
                    <td>
                      <span
                        className={isCustomBadge ? 'badge' : `badge ${colorStyle}`}
                        style={isCustomBadge ? colorStyle : undefined}
                      >
                        {masraf.kategori}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500' }}>{masraf.urun_adi || '-'}</td>
                    <td>{masraf.miktar} {masraf.birim}</td>
                    <td>{masraf.birim_fiyat.toLocaleString('tr-TR')} TL</td>
                    <td style={{ fontWeight: '700', color: 'var(--danger)' }}>
                      {masraf.tutar.toLocaleString('tr-TR')} TL
                    </td>
                    <td>{new Date(masraf.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                    <td style={{ color: 'var(--slate-600)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={masraf.aciklama}>
                      {masraf.aciklama || '-'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ color: 'var(--primary-700)', borderColor: 'transparent', padding: '6px 12px', boxShadow: 'none', marginRight: '6px' }}
                        onClick={() => handleEdit(masraf)}
                      >
                        <Pencil size={16} />
                        <span>Düzenle</span>
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ color: 'var(--danger)', borderColor: 'transparent', padding: '6px 12px', boxShadow: 'none' }}
                        onClick={() => handleDeleteTrigger(masraf.id)}
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
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModalAndReset}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <DollarSign style={{ color: 'var(--primary-600)' }} />
              <span>{editingId ? 'Masrafı Düzenle' : 'Yeni Masraf Ekle'}</span>
            </h3>

            {error && (
              <div className="badge badge-danger" style={{ width: '100%', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '16px', display: 'block', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
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
                      <option key={t.id} value={t.id}>{t.isim}</option>
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
                        urun_adi: '',
                        gubre_marka: Object.keys(fertilizers)[0] || '',
                        gubre_turu: '',
                        gubre_cesit: '',
                        birim: nextKategori === 'İşçilik' ? 'Dönüm' : 'Adet'
                      });
                    }}
                  >
                    {kategoriler.map((kat) => (
                      <option key={kat} value={kat}>{kat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {form.kategori === 'Gübre' ? (
                <>
                  <div className="form-row" style={{ marginTop: '10px' }}>
                    <div className="form-group">
                      <label className="form-label">Marka</label>
                      <select
                        className="form-control"
                        value={form.gubre_marka}
                        onChange={(e) => setForm({ ...form, gubre_marka: e.target.value, gubre_turu: '', gubre_cesit: '' })}
                      >
                        <option value="">Marka seç</option>
                        {brandOptions.map((brand) => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                        <option value={NEW_BRAND_OPTION}>{NEW_BRAND_OPTION}</option>
                      </select>
                      {isManualBrand && (
                        <input
                          type="text"
                          className="form-control"
                          style={{ marginTop: '8px' }}
                          placeholder="Marka"
                          value={newBrand}
                          onChange={(e) => setNewBrand(e.target.value)}
                          required
                        />
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Tür</label>
                      <select
                        className="form-control"
                        value={form.gubre_turu}
                        onChange={(e) => setForm({ ...form, gubre_turu: e.target.value, gubre_cesit: '' })}
                        disabled={!form.gubre_marka}
                      >
                        <option value="">Tür seç</option>
                        {typeOptions.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                        <option value={NEW_TYPE_OPTION}>{NEW_TYPE_OPTION}</option>
                      </select>
                      {isManualType && (
                        <input
                          type="text"
                          className="form-control"
                          style={{ marginTop: '8px' }}
                          placeholder="Tür"
                          value={newType}
                          onChange={(e) => setNewType(e.target.value)}
                          required
                        />
                      )}
                    </div>
                  </div>

                  <div className="form-group" style={{ marginTop: '10px' }}>
                    <label className="form-label">Çeşit</label>
                    <select
                      className="form-control"
                      value={form.gubre_cesit}
                      onChange={(e) => setForm({ ...form, gubre_cesit: e.target.value })}
                      disabled={!form.gubre_turu}
                    >
                      <option value="">Çeşit seç</option>
                      {varietyOptions.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                      <option value={NEW_VARIETY_OPTION}>{NEW_VARIETY_OPTION}</option>
                    </select>
                    {isManualVariety && (
                      <input
                        type="text"
                        className="form-control"
                        style={{ marginTop: '8px' }}
                        placeholder="Çeşit"
                        value={newVariety}
                        onChange={(e) => setNewVariety(e.target.value)}
                        required
                      />
                    )}
                  </div>
                </>
              ) : (
                <div className="form-group" style={{ marginTop: '10px' }}>
                  <label className="form-label">Masraf Detayı (Marka, Ürün Adı vb.)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Örn: Tarla İşçiliği"
                    value={form.urun_adi}
                    onChange={(e) => {
                      const nextUrun = e.target.value;
                      const shouldUseDonum = form.kategori === 'İşçilik' && nextUrun.trim().toLocaleLowerCase('tr-TR') === 'tarla işçiliği';
                      setForm({ ...form, urun_adi: nextUrun, birim: shouldUseDonum ? 'Dönüm' : form.birim });
                    }}
                    maxLength={50}
                  />
                </div>
              )}

              <div className="form-row" style={{ marginTop: '10px' }}>
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
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Birim Fiyatı (TL) *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="Örn: 24.50"
                    value={form.birim_fiyat}
                    onChange={(e) => setForm({ ...form, birim_fiyat: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--slate-500)' }}>Hesaplanan Toplam Tutar</label>
                  <div
                    className="form-control"
                    style={{
                      backgroundColor: 'var(--slate-100)',
                      fontWeight: '700',
                      color: 'var(--danger)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                      height: '46px'
                    }}
                  >
                    {!isNaN(calculatedTotal) && calculatedTotal > 0 ? calculatedTotal.toLocaleString('tr-TR') : '0.00'} TL
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
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

              <div style={{ display: 'flex', justifyItems: 'center', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={closeModalAndReset}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingId ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
