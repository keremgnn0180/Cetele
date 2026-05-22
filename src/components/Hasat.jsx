import React, { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, Filter, X, Search } from 'lucide-react';

function Hasat() {
  const [hasatlar, setHasatlar] = useState([]);
  const [tarlalar, setTarlalar] = useState([]);
  const [urunler, setUrunler] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  // Form durumu
  const [form, setForm] = useState({
    tarla_id: '',
    urun_id: '',
    miktar: '',
    birim: 'kilogram',
    birim_satis_fiyati: '',
    tarih: new Date().toISOString().split('T')[0],
    aciklama: ''
  });

  // Filtreler
  const [filterTarla, setFilterTarla] = useState('HEPSİ');
  const [filterUrun, setFilterUrun] = useState('HEPSİ');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterMinGelir, setFilterMinGelir] = useState('');
  const [filterMaxGelir, setFilterMaxGelir] = useState('');
  const [filterSearch, setFilterSearch] = useState('');

  const birimler = ['kilogram', 'ton', 'litre', 'gram', 'adet'];

  // Verileri çek
  const fetchData = async () => {
    try {
      const activeTarlalar = await window.api.tarlalar.getAll();
      const activeUrunler = await window.api.urunler.getAll();
      const sortedTarlalar = [...activeTarlalar].sort((a, b) => a.isim.localeCompare(b.isim, 'tr'));
      const sortedUrunler = [...activeUrunler].sort((a, b) => a.isim.localeCompare(b.isim, 'tr'));
      setTarlalar(sortedTarlalar);
      setUrunler(sortedUrunler);

      const activeHasatlar = await window.api.hasatlar.getAll();
      setHasatlar(activeHasatlar);

      if (sortedTarlalar.length > 0 && sortedUrunler.length > 0) {
        setForm(prev => ({
          ...prev,
          tarla_id: sortedTarlalar[0].id.toString(),
          urun_id: sortedUrunler[0].id.toString()
        }));
      }
    } catch (err) {
      console.error('Veriler çekilirken hata oluştu:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Form kaydetme
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.tarla_id || !form.urun_id || !form.miktar || !form.birim_satis_fiyati || !form.tarih) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    const miktarNum = parseFloat(form.miktar);
    const birimSatisFiyatiNum = parseFloat(form.birim_satis_fiyati);

    if (isNaN(miktarNum) || miktarNum <= 0) {
      setError('Miktar pozitif bir sayı olmalıdır.');
      return;
    }
    if (isNaN(birimSatisFiyatiNum) || birimSatisFiyatiNum <= 0) {
      setError('Satış fiyatı pozitif bir sayı olmalıdır.');
      return;
    }

    const gelir = miktarNum * birimSatisFiyatiNum;

    try {
      await window.api.hasatlar.add({
        tarla_id: parseInt(form.tarla_id),
        urun_id: parseInt(form.urun_id),
        miktar: miktarNum,
        birim: form.birim,
        birim_satis_fiyati: birimSatisFiyatiNum,
        tarih: form.tarih,
        aciklama: form.aciklama.trim() || null
      });

      // Formu sıfırla
      setForm(prev => ({
        ...prev,
        miktar: '',
        birim_satis_fiyati: '',
        aciklama: '',
        tarih: new Date().toISOString().split('T')[0]
      }));
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError('Kayıt eklenirken hata oluştu: ' + err.message);
    }
  };

  // Hasat silme
  const handleDelete = async (id) => {
    if (confirm('Bu hasat ve satış kaydını silmek istediğinize emin misiniz?')) {
      try {
        await window.api.hasatlar.remove(id);
        fetchData();
      } catch (err) {
        alert('Kayıt silinirken hata oluştu: ' + err.message);
      }
    }
  };

  // Filtreleri temizle
  const handleClearFilters = () => {
    setFilterTarla('HEPSİ');
    setFilterUrun('HEPSİ');
    setFilterDateStart('');
    setFilterDateEnd('');
    setFilterMinGelir('');
    setFilterMaxGelir('');
    setFilterSearch('');
  };

  // Gelişmiş filtreleme mantığı
  const filteredHasatlar = hasatlar.filter((h) => {
    // Tarla filtresi
    if (filterTarla !== 'HEPSİ' && h.tarla_id.toString() !== filterTarla) return false;

    // Ürün filtresi
    if (filterUrun !== 'HEPSİ' && h.urun_id.toString() !== filterUrun) return false;

    // Tarih filtresi
    if (filterDateStart && h.tarih < filterDateStart) return false;
    if (filterDateEnd && h.tarih > filterDateEnd) return false;

    // Gelir filtresi
    if (filterMinGelir && h.gelir < parseFloat(filterMinGelir)) return false;
    if (filterMaxGelir && h.gelir > parseFloat(filterMaxGelir)) return false;

    // Arama filtresi
    if (filterSearch.trim() !== '') {
      const s = filterSearch.toLowerCase();
      const urunMatch = h.urun_isim.toLowerCase().includes(s);
      const tarlaMatch = h.tarla_isim.toLowerCase().includes(s);
      const aciklamaMatch = h.aciklama?.toLowerCase().includes(s) || false;
      if (!urunMatch && !tarlaMatch && !aciklamaMatch) return false;
    }

    return true;
  });

  // Filtrelenmiş toplam gelir
  const filteredTotal = filteredHasatlar.reduce((sum, h) => sum + h.gelir, 0);

  // Formdaki anlık gelir hesabı
  const calculatedTotal = parseFloat(form.miktar) * parseFloat(form.birim_satis_fiyati);

  return (
    <div>
      {/* Üst Bilgi ve Buton Paneli */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--slate-700)' }}>
            Listelenen Toplam Gelir: <span style={{ color: 'var(--success)', fontWeight: '800' }}>{filteredTotal.toLocaleString('tr-TR')} TL</span>
          </h2>
        </div>
        <button 
          className="btn btn-primary btn-large" 
          onClick={() => {
            if (tarlalar.length === 0 || urunler.length === 0) {
              alert('Hasat kaydı eklemeden önce en az bir Tarla ve bir Ürün tanımlamalısınız!');
            } else {
              setShowModal(true);
            }
          }}
        >
          <Plus size={20} />
          <span>Yeni Hasat / Satış Ekle</span>
        </button>
      </div>

      {/* Gelişmiş Filtre Paneli */}
      <div className="filter-panel">
        <div className="filter-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
            <Filter size={18} style={{ color: 'var(--primary-600)' }} />
            <span>Gelişmiş Filtreler</span>
          </div>
          {(filterTarla !== 'HEPSİ' || filterUrun !== 'HEPSİ' || filterDateStart || filterDateEnd || filterMinGelir || filterMaxGelir || filterSearch) && (
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
              {tarlalar.map(t => (
                <option key={t.id} value={t.id.toString()}>{t.isim}</option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Ürün</label>
            <select 
              className="form-control" 
              style={{ padding: '8px 12px' }}
              value={filterUrun}
              onChange={(e) => setFilterUrun(e.target.value)}
            >
              <option value="HEPSİ">Tüm Ürünler</option>
              {urunler.map(u => (
                <option key={u.id} value={u.id.toString()}>{u.isim}</option>
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
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Min Gelir (TL)</label>
            <input 
              type="number" 
              placeholder="Min"
              className="form-control" 
              style={{ padding: '8px 12px' }}
              value={filterMinGelir}
              onChange={(e) => setFilterMinGelir(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Max Gelir (TL)</label>
            <input 
              type="number" 
              placeholder="Max"
              className="form-control" 
              style={{ padding: '8px 12px' }}
              value={filterMaxGelir}
              onChange={(e) => setFilterMaxGelir(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 0, position: 'relative' }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Detaylı Arama</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              placeholder="Tarla adı, ürün adı veya açıklama ara..."
              className="form-control"
              style={{ padding: '10px 16px 10px 40px' }}
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
            <Search size={18} style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--slate-500)' }} />
          </div>
        </div>
      </div>

      {/* Hasat Kayıtları Listesi */}
      {filteredHasatlar.length === 0 ? (
        <div className="card empty-state">
          <TrendingUp size={48} />
          <h3>Kayıtlı hasat ve satış bulunamadı.</h3>
          <p style={{ marginTop: '8px' }}>Filtrelerinize uygun veya kaydedilmiş bir satış kaydı bulunmamaktadır. "Yeni Hasat / Satış Ekle" ile ekleme yapın.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Tarla Adı</th>
                <th>Hasat Edilen Ürün</th>
                <th>Miktar</th>
                <th>Satış Fiyatı</th>
                <th>Toplam Gelir</th>
                <th>Tarih</th>
                <th>Açıklama</th>
                <th style={{ textAlign: 'right' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredHasatlar.map((hasat) => (
                <tr key={hasat.id}>
                  <td style={{ fontWeight: '600', color: 'var(--slate-900)' }}>{hasat.tarla_isim}</td>
                  <td>
                    <span className="badge badge-primary">{hasat.urun_isim}</span>
                  </td>
                  <td style={{ fontWeight: '600' }}>{hasat.miktar} {hasat.birim}</td>
                  <td>{hasat.birim_satis_fiyati.toLocaleString('tr-TR')} TL</td>
                  <td style={{ fontWeight: '700', color: 'var(--success)' }}>
                    {hasat.gelir.toLocaleString('tr-TR')} TL
                  </td>
                  <td>{new Date(hasat.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                  <td style={{ color: 'var(--slate-600)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {hasat.aciklama || '-'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ color: 'var(--danger)', borderColor: 'transparent', padding: '6px 12px', boxShadow: 'none' }}
                      onClick={() => handleDelete(hasat.id)}
                    >
                      <Trash2 size={16} />
                      <span>Sil</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Yeni Hasat Ekleme Modalı */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <TrendingUp style={{ color: 'var(--success)' }} />
              <span>Yeni Hasat / Satış Ekle</span>
            </h3>

            {error && (
              <div className="badge badge-danger" style={{ width: '100%', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '16px', display: 'block', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Hasat Yapılan Tarla *</label>
                  <select 
                    className="form-control"
                    value={form.tarla_id}
                    onChange={(e) => setForm({ ...form, tarla_id: e.target.value })}
                  >
                    {tarlalar.map((t) => (
                      <option key={t.id} value={t.id}>{t.isim} ({t.donum} Dönüm)</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Hasat Edilen / Satılan Ürün *</label>
                  <select 
                    className="form-control"
                    value={form.urun_id}
                    onChange={(e) => setForm({ ...form, urun_id: e.target.value })}
                  >
                    {urunler.map((u) => (
                      <option key={u.id} value={u.id}>{u.isim}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Hasat Miktarı *</label>
                  <input 
                    type="number" 
                    step="any"
                    className="form-control"
                    placeholder="Örn: 10"
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
                    {birimler.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Satış Fiyatı (TL / Birim) *</label>
                  <input 
                    type="number" 
                    step="any"
                    className="form-control"
                    placeholder="Örn: 8500"
                    value={form.birim_satis_fiyati}
                    onChange={(e) => setForm({ ...form, birim_satis_fiyati: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: 'var(--slate-500)' }}>Hesaplanan Toplam Gelir</label>
                  <div 
                    className="form-control" 
                    style={{ 
                      backgroundColor: 'var(--slate-100)', 
                      fontWeight: '700', 
                      color: 'var(--success)', 
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
                <label className="form-label">Hasat / Satış Tarihi *</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={form.tarih}
                  onChange={(e) => setForm({ ...form, tarih: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Açıklama / Notlar</label>
                <textarea 
                  className="form-control"
                  placeholder="Satış yapılan tüccar adı, kalite derecesi vb. notlar..."
                  value={form.aciklama}
                  onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
                  rows={3}
                  maxLength={200}
                />
              </div>

              <div style={{ display: 'flex', justifyItems: 'center', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Hasat;
