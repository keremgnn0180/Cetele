import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, AlertTriangle } from 'lucide-react';
import DeleteConfirmModal from './DeleteConfirmModal';

function Ekim() {
  const [ekimler, setEkimler] = useState([]);
  const [tarlalar, setTarlalar] = useState([]);
  const [urunler, setUrunler] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  // Silme onay modalı durumları
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [ekimToDelete, setEkimToDelete] = useState(null);

  const [form, setForm] = useState({
    tarla_id: '',
    urun_id: '',
    miktar: '',
    birim: 'kilogram',
    tarih: new Date().toISOString().split('T')[0],
    aciklama: ''
  });

  const birimler = ['kilogram', 'ton', 'litre', 'gram', 'adet'];

  // Verileri çek
  const fetchData = async () => {
    try {
      const activeTarlalar = await window.api.tarlalar.getAll();
      const activeUrunler = await window.api.urunler.getAll();
      
      // İsme göre sıralayalım
      const sortedTarlalar = [...activeTarlalar].sort((a, b) => a.isim.localeCompare(b.isim, 'tr'));
      const sortedUrunler = [...activeUrunler].sort((a, b) => a.isim.localeCompare(b.isim, 'tr'));
      
      setTarlalar(sortedTarlalar);
      setUrunler(sortedUrunler);

      // İlişkili ekimleri çek
      const activeEkimler = await window.api.ekimler.getAll();
      setEkimler(activeEkimler);

      // Form varsayılanlarını ayarla
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

    if (!form.tarla_id || !form.urun_id || !form.miktar || !form.tarih) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    const miktarNum = parseFloat(form.miktar);
    if (isNaN(miktarNum) || miktarNum <= 0) {
      setError('Miktar pozitif bir sayı olmalıdır.');
      return;
    }

    try {
      await window.api.ekimler.add({
        tarla_id: parseInt(form.tarla_id),
        urun_id: parseInt(form.urun_id),
        miktar: miktarNum,
        birim: form.birim,
        tarih: form.tarih,
        aciklama: form.aciklama.trim()
      });

      // Dashboard önbelleğini geçersiz kıl
      if (window.dashboardCache) {
        window.dashboardCache.isDirty = true;
      }

      setForm(prev => ({
        ...prev,
        miktar: '',
        aciklama: '',
        tarih: new Date().toISOString().split('T')[0]
      }));
      setShowModal(false);
      fetchData();
    } catch (err) {
      setError('Kayıt eklenirken bir hata oluştu: ' + err.message);
    }
  };

  // Silme tetikleyici
  const handleDeleteTrigger = (id) => {
    setEkimToDelete(id);
    setDeleteModalOpen(true);
  };

  // Güvenli silme eylemi
  const handleConfirmDelete = async () => {
    if (!ekimToDelete) return;
    
    try {
      await window.api.ekimler.remove(ekimToDelete);
      
      // Dashboard önbelleğini geçersiz kıl
      if (window.dashboardCache) {
        window.dashboardCache.isDirty = true;
      }
      
      setEkimToDelete(null);
      fetchData();
    } catch (err) {
      alert('Kayıt silinirken hata oluştu: ' + err.message);
    }
  };

  return (
    <div>
      {/* Üst Bilgi ve Buton Paneli */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', color: 'var(--slate-700)' }}>
            Toplam Ekim Kaydı: <span style={{ color: 'var(--primary-600)', fontWeight: '800' }}>{ekimler.length} Adet</span>
          </h2>
        </div>
        <button 
          className="btn btn-primary btn-large" 
          onClick={() => {
            if (tarlalar.length === 0 || urunler.length === 0) {
              alert('Ekim kaydı girmeden önce en az bir Tarla ve bir Ürün tanımlamalısınız!');
            } else {
              setShowModal(true);
            }
          }}
        >
          <Plus size={20} />
          <span>Ekim Kaydı Ekle</span>
        </button>
      </div>

      {/* Tarlalar/Ürünler Eksik Uyarısı */}
      {(tarlalar.length === 0 || urunler.length === 0) && (
        <div className="card" style={{ borderLeft: '4px solid var(--warning)', backgroundColor: 'hsl(45, 90%, 97%)', display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '24px', padding: '16px' }}>
          <AlertTriangle size={24} style={{ color: 'var(--warning)' }} />
          <div>
            <h4 style={{ color: 'var(--slate-900)', fontWeight: '600' }}>Eksik Bilgi Uyarısı</h4>
            <p style={{ fontSize: '0.9rem', color: 'var(--slate-600)', marginTop: '4px' }}>
              Ekim kaydı eklemek için öncelikle **Tarlalar** sekmesinden bir tarla ve **Ürünler** sekmesinden yetiştireceğiniz ürünleri eklemelisiniz.
            </p>
          </div>
        </div>
      )}

      {/* Ekim Kayıtları Listesi */}
      {ekimler.length === 0 ? (
        <div className="card empty-state">
          <Calendar size={48} />
          <h3>Henüz ekim kaydı bulunamadı.</h3>
          <p style={{ marginTop: '8px' }}>Sezon ekimlerinizi listelemek için "Ekim Kaydı Ekle" butonunu kullanın.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Tarla Adı</th>
                <th>Ekilmiş Ürün</th>
                <th>Tohum Miktarı</th>
                <th>Ekim Tarihi</th>
                <th>Açıklama</th>
                <th style={{ textAlign: 'right' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {ekimler.map((ekim) => (
                <tr key={ekim.id}>
                  <td style={{ fontWeight: '600', color: 'var(--slate-900)' }}>{ekim.tarla_isim || 'Silinmiş Tarla'}</td>
                  <td>
                    <span className="badge badge-primary">{ekim.urun_isim || 'Silinmiş Ürün'}</span>
                  </td>
                  <td style={{ fontWeight: '600' }}>{ekim.miktar} {ekim.birim}</td>
                  <td>{new Date(ekim.tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                  <td style={{ color: 'var(--slate-600)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ekim.aciklama}>
                    {ekim.aciklama || '-'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ color: 'var(--danger)', borderColor: 'transparent', padding: '6px 12px', boxShadow: 'none' }}
                      onClick={() => handleDeleteTrigger(ekim.id)}
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

      {/* Yeni Ekim Ekleme Modalı */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar style={{ color: 'var(--primary-600)' }} />
              <span>Yeni Ekim Kaydı</span>
            </h3>

            {error && (
              <div className="badge badge-danger" style={{ width: '100%', borderRadius: 'var(--radius-sm)', padding: '12px', marginBottom: '16px', display: 'block', textAlign: 'center' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Ekilme Yapılan Tarla *</label>
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
                  <label className="form-label">Ekilmeye Değer Ürün *</label>
                  <select 
                    className="form-control"
                    value={form.urun_id}
                    onChange={(e) => setForm({ ...form, urun_id: e.target.value })}
                  >
                    {urunler.map((u) => (
                      <option key={u.id} value={u.id}>{u.isim} ({u.kategori})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row" style={{ marginTop: '10px' }}>
                <div className="form-group">
                  <label className="form-label">Tohum Miktarı *</label>
                  <input 
                    type="number" 
                    step="any"
                    className="form-control"
                    placeholder="Örn: 250"
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

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label className="form-label">Ekim Tarihi *</label>
                <input 
                  type="date" 
                  className="form-control"
                  value={form.tarih}
                  onChange={(e) => setForm({ ...form, tarih: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Açıklama / Detaylar</label>
                <textarea 
                  className="form-control"
                  placeholder="Ekim ile ilgili detaylar (Tohum markası, çeşidi vb.)"
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

      {/* Güvenli Silme Onay Modalı */}
      <DeleteConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Ekim Kaydını Sil"
      />
    </div>
  );
}

export default Ekim;
