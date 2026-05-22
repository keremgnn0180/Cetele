import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Sprout, Search, Filter, Star } from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';

const PREDEFINED_PRODUCTS = {
  Tahıllar: ["Buğday", "Arpa", "Yulaf", "Çavdar", "Mısır", "Pirinç", "Sorgum", "Darı"],
  Baklagiller: ["Nohut", "Mercimek", "Fasulye", "Bakla", "Soya", "Bezelye"],
  Sebzeler: ["Soğan", "Patates", "Domates", "Biber", "Turp", "Yaban Turpu", "Havuç", "Kabak", "Patlıcan", "Sarımsak"],
  Meyveler: ["Elma", "Armut", "Üzüm", "Nar", "Limon", "Portakal", "Kiraz", "Şeftali"],
  Yem: ["Yonca", "Fiğ", "Korunga", "Silajlık Mısır"],
  Endüstri: ["Pamuk", "Kanola", "Şeker Pancarı", "Tütün", "Ayçiçeği"]
};

const PREDEFINED_BRANDS = [
  "Limagrain", "Dekalb", "Pioneer", "Syngenta", "KWS", "Bayer", "May Tohum", "Agromar", "Corteva"
];

function Urunler() {
  const [urunler, setUrunler] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ isim: '', kategori: 'Tahıllar', tohum_markasi: '', tohum_cesidi: '', tohum_notu: '' });
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isManualBrand, setIsManualBrand] = useState(false);

  // Silme onay modalı durumları
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [urunToDelete, setUrunToDelete] = useState(null);

  const fetchUrunler = async () => {
    try {
      const data = await window.api.urunler.getAll();
      const sorted = [...data].sort((a, b) => a.isim.localeCompare(b.isim, 'tr'));
      setUrunler(sorted);
    } catch (err) {
      console.error('Ürünler yüklenirken hata:', err);
    }
  };

  useEffect(() => {
    fetchUrunler();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.isim) {
      setError('Lütfen ürün adını doldurun.');
      return;
    }

    try {
      await window.api.urunler.add({
        isim: form.isim.trim(),
        kategori: form.kategori,
        tohum_markasi: form.tohum_markasi.trim(),
        tohum_cesidi: form.tohum_cesidi.trim(),
        tohum_notu: form.tohum_notu.trim()
      });
      
      if (window.dashboardCache) {
        window.dashboardCache.isDirty = true;
      }

      setForm({ isim: '', kategori: 'Tahıllar', tohum_markasi: '', tohum_cesidi: '', tohum_notu: '' });
      setShowModal(false);
      setIsManualEntry(false);
      setIsManualBrand(false);
      fetchUrunler();
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        setError('Bu isimde bir ürün zaten kayıtlı.');
      } else {
        setError('Ürün kaydedilirken bir hata oluştu: ' + err.message);
      }
    }
  };

  const handleDeleteTrigger = (urun) => {
    setUrunToDelete(urun);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!urunToDelete) return;
    try {
      await window.api.urunler.remove(urunToDelete.id);
      if (window.dashboardCache) window.dashboardCache.isDirty = true;
      setUrunToDelete(null);
      fetchUrunler();
    } catch (err) {
      alert('Ürün silinirken hata oluştu: ' + err.message);
    }
  };

  const filteredUrunler = urunler.filter(urun => {
    const matchesSearch = urun.isim.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? urun.kategori === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', flex: 1, minWidth: '300px' }}>
          <div className="search-box" style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
            <input 
              type="text" 
              className="form-control" 
              placeholder="Ürün Ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '38px', width: '100%' }}
            />
          </div>
          <select 
            className="form-control" 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="">Tüm Kategoriler</option>
            {Object.keys(PREDEFINED_PRODUCTS).map(kat => (
              <option key={kat} value={kat}>{kat}</option>
            ))}
          </select>
        </div>
        <button className="btn btn-primary btn-large" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          <span>Yeni Ürün Ekle</span>
        </button>
      </div>

      {filteredUrunler.length === 0 ? (
        <div className="card empty-state">
          <Sprout size={48} />
          <h3>Aramanıza uygun ürün bulunamadı.</h3>
          <p style={{ marginTop: '8px' }}>Ekim ve hasat yapabilmek için sağ üstteki butondan ürün ekleyin.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {filteredUrunler.map((urun) => (
            <div key={urun.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-600)', flexShrink: 0 }}>
                    <Sprout size={22} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {urun.isim}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: '500' }}>{urun.kategori}</span>
                  </div>
                </div>
                <button 
                  className="btn btn-secondary" 
                  style={{ color: 'var(--danger)', borderColor: 'transparent', padding: '8px', boxShadow: 'none' }}
                  onClick={() => handleDeleteTrigger(urun)}
                  title="Ürünü Sil"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              {(urun.tohum_markasi || urun.tohum_cesidi || urun.tohum_notu) && (
                <div style={{ backgroundColor: 'var(--slate-50)', padding: '10px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                  {urun.tohum_markasi && <div><strong>Marka:</strong> {urun.tohum_markasi}</div>}
                  {urun.tohum_cesidi && <div><strong>Çeşit:</strong> {urun.tohum_cesidi}</div>}
                  {urun.tohum_notu && <div><strong>Not:</strong> {urun.tohum_notu}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sprout style={{ color: 'var(--primary-600)' }} />
              <span>Yeni Ürün Ekle</span>
            </h3>

            {error && (
              <div className="badge badge-danger" style={{ width: '100%', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '16px', display: 'block', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Ürün Kategorisi</label>
                <select 
                  className="form-control"
                  value={form.kategori}
                  onChange={(e) => setForm({ ...form, kategori: e.target.value, isim: '' })}
                >
                  {Object.keys(PREDEFINED_PRODUCTS).map((kat) => (
                    <option key={kat} value={kat}>{kat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Ürün Adı *</label>
                  <label style={{ fontSize: '0.8rem', color: 'var(--primary-600)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input type="checkbox" checked={isManualEntry} onChange={(e) => { setIsManualEntry(e.target.checked); setForm({...form, isim: ''}); }} />
                    Elle Yaz
                  </label>
                </div>
                {isManualEntry ? (
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Ürün adını girin..."
                    value={form.isim}
                    onChange={(e) => setForm({ ...form, isim: e.target.value })}
                    required
                  />
                ) : (
                  <select 
                    className="form-control"
                    value={form.isim}
                    onChange={(e) => setForm({ ...form, isim: e.target.value })}
                    required
                  >
                    <option value="">-- Ürün Seçin --</option>
                    {PREDEFINED_PRODUCTS[form.kategori].map(urun => (
                      <option key={urun} value={urun}>{urun}</option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ borderTop: '1px solid var(--slate-200)', marginTop: '20px', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--slate-700)', marginBottom: '16px' }}>Tohum Bilgileri (İsteğe Bağlı)</h4>
                
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Tohum Markası</label>
                    <label style={{ fontSize: '0.8rem', color: 'var(--primary-600)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <input type="checkbox" checked={isManualBrand} onChange={(e) => { setIsManualBrand(e.target.checked); setForm({...form, tohum_markasi: ''}); }} />
                      Elle Yaz
                    </label>
                  </div>
                  
                  {isManualBrand ? (
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Marka girin..."
                      value={form.tohum_markasi}
                      onChange={(e) => setForm({ ...form, tohum_markasi: e.target.value })}
                    />
                  ) : (
                    <select 
                      className="form-control"
                      value={form.tohum_markasi}
                      onChange={(e) => setForm({ ...form, tohum_markasi: e.target.value })}
                    >
                      <option value="">-- Marka Seçin --</option>
                      {PREDEFINED_BRANDS.map(marka => (
                        <option key={marka} value={marka}>{marka}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Tohum Çeşidi</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Örn: LG 59.50"
                    value={form.tohum_cesidi}
                    onChange={(e) => setForm({ ...form, tohum_cesidi: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tohum Notu</label>
                  <input 
                    type="text" 
                    className="form-control"
                    placeholder="Örn: 2026 sezonu yeni nesil"
                    value={form.tohum_notu}
                    onChange={(e) => setForm({ ...form, tohum_notu: e.target.value })}
                  />
                </div>
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

      <DeleteConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Ürünü Sil"
      />
    </div>
  );
}

export default Urunler;
