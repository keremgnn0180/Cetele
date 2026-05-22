import React, { useState, useEffect } from 'react';
import { Plus, Trash2, MapPin, Layers } from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';

function Tarlalar() {
  const [tarlalar, setTarlalar] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ isim: '', donum: '', konum: '' });
  const [error, setError] = useState('');
  
  // Silme onay modalı durumları
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tarlaToDelete, setTarlaToDelete] = useState(null);

  // Tarlaları veritabanından çek
  const fetchTarlalar = async () => {
    try {
      const data = await window.api.tarlalar.getAll();
      setTarlalar(data);
    } catch (err) {
      console.error('Tarlalar yüklenirken hata oluştu:', err);
    }
  };

  useEffect(() => {
    fetchTarlalar();
  }, []);

  // Form kaydetme
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.isim || !form.donum) {
      setError('Lütfen isim ve dönüm alanlarını doldurun.');
      return;
    }

    const donumNum = parseFloat(form.donum);
    if (isNaN(donumNum) || donumNum <= 0) {
      setError('Dönüm pozitif bir sayı olmalıdır.');
      return;
    }

    try {
      await window.api.tarlalar.add({
        isim: form.isim,
        donum: donumNum,
        konum: form.konum
      });
      
      // Dashboard önbelleğini geçersiz kıl
      if (window.dashboardCache) {
        window.dashboardCache.isDirty = true;
      }
      
      setForm({ isim: '', donum: '', konum: '' });
      setShowModal(false);
      fetchTarlalar();
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        setError('Bu isimde bir tarla zaten kayıtlı.');
      } else {
        setError('Tarla kaydedilirken bir hata oluştu: ' + err.message);
      }
    }
  };

  // Silme tetikleyici
  const handleDeleteTrigger = (tarla) => {
    setTarlaToDelete(tarla);
    setDeleteModalOpen(true);
  };

  // Güvenli silme eylemi
  const handleConfirmDelete = async () => {
    if (!tarlaToDelete) return;
    
    try {
      await window.api.tarlalar.remove(tarlaToDelete.id);
      
      // Dashboard önbelleğini geçersiz kıl
      if (window.dashboardCache) {
        window.dashboardCache.isDirty = true;
      }
      
      setTarlaToDelete(null);
      fetchTarlalar();
    } catch (err) {
      alert('Tarla silinirken hata oluştu: ' + err.message);
    }
  };

  // Toplam dönüm hesabı
  const totalDonum = tarlalar.reduce((sum, t) => sum + t.donum, 0);

  return (
    <div>
      {/* Üst Bilgi ve Buton Paneli */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--slate-700)' }}>
            Toplam Tarla Alanı: <span style={{ color: 'var(--primary-600)', fontWeight: '800' }}>{totalDonum.toLocaleString('tr-TR')} Dönüm</span>
          </h2>
        </div>
        <button className="btn btn-primary btn-large" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          <span>Yeni Tarla Ekle</span>
        </button>
      </div>

      {/* Tarlalar Listesi */}
      {tarlalar.length === 0 ? (
        <div className="card empty-state">
          <Layers size={48} />
          <h3>Henüz kayıtlı tarla bulunamadı.</h3>
          <p style={{ marginTop: '8px' }}>Uygulamayı kullanmaya başlamak için yukarıdaki butondan ilk tarlanızı ekleyin.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
          {tarlalar.map((tarla) => (
            <div key={tarla.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', position: 'relative' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '700', wordBreak: 'break-word', paddingRight: '32px' }}>{tarla.isim}</h3>
                  <span className="badge badge-primary" style={{ fontSize: '0.9rem', padding: '6px 12px', flexShrink: 0 }}>
                    {tarla.donum} Dönüm
                  </span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', color: 'var(--slate-600)', fontSize: '0.92rem', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MapPin size={16} style={{ color: 'var(--primary-500)' }} />
                    <span>{tarla.konum || 'Konum belirtilmedi'}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--slate-100)', paddingTop: '16px', marginTop: 'auto' }}>
                <button 
                  className="btn btn-secondary" 
                  style={{ color: 'var(--danger)', borderColor: 'rgba(220, 53, 69, 0.2)', padding: '8px 16px' }}
                  onClick={() => handleDeleteTrigger(tarla)}
                >
                  <Trash2 size={16} />
                  <span>Sil</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Yeni Tarla Ekleme Modalı */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers style={{ color: 'var(--primary-600)' }} />
              <span>Yeni Tarla Ekle</span>
            </h3>

            {error && (
              <div className="badge badge-danger" style={{ width: '100%', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '16px', display: 'block', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Tarla Adı / Tanımı *</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Örn: Dere Boyu Tarlası, Evin Arkası"
                  value={form.isim}
                  onChange={(e) => setForm({ ...form, isim: e.target.value })}
                  maxLength={50}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dönüm Büyüklüğü (Miktar) *</label>
                <input 
                  type="number" 
                  step="any"
                  className="form-control"
                  placeholder="Örn: 15.5"
                  value={form.donum}
                  onChange={(e) => setForm({ ...form, donum: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Konum / Açıklama</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Örn: Çatalca, Karacaköy Yolu veya Koordinatlar"
                  value={form.konum}
                  onChange={(e) => setForm({ ...form, konum: e.target.value })}
                  maxLength={100}
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

      {/* Güvenli Silme Onay Modalı */}
      <DeleteConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Tarlayı Sil"
      />
    </div>
  );
}

export default Tarlalar;
