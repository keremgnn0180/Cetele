import React, { useEffect, useState } from 'react';
import { Database, Download, Upload, AlertCircle, CheckCircle, Info, RefreshCw } from 'lucide-react';

function Ayarlar() {
  const USER_NAME_KEY = 'cetele_user_name';
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [userName, setUserName] = useState('');
  const [updateInfo, setUpdateInfo] = useState({
    currentVersion: 'v1.0.0',
    lastCheck: null,
    status: 'Bilinmiyor',
    progress: 0
  });

  useEffect(() => {
    let unsubs = [];
    const setupUpdates = async () => {
      try {
        const state = await window.api.getUpdateState();
        if (state) {
          setUpdateInfo(prev => ({ ...prev, ...state }));
        }
      } catch (err) {
        setUpdateInfo(prev => ({ ...prev, status: `Hata: ${err.message}` }));
      }

      unsubs = [
        window.api.onUpdateAvailable(() => {
          setUpdateInfo(prev => ({ ...prev, status: 'Yeni güncelleme bulundu' }));
        }),
        window.api.onDownloadProgress((payload) => {
          setUpdateInfo(prev => ({
            ...prev,
            status: `İndiriliyor (%${payload?.percent ?? 0})`,
            progress: payload?.percent ?? 0
          }));
        }),
        window.api.onUpdateDownloaded(() => {
          setUpdateInfo(prev => ({ ...prev, status: 'Güncelleme hazır', progress: 100 }));
          setUpdating(false);
        }),
        window.api.onUpdateNotAvailable((payload) => {
          setUpdateInfo(prev => ({ ...prev, status: 'Güncel', lastCheck: payload?.checkedAt || prev.lastCheck }));
          setUpdating(false);
        }),
        window.api.onUpdateError((payload) => {
          setUpdateInfo(prev => ({ ...prev, status: `Hata: ${payload?.message || 'Bilinmeyen hata'}` }));
          setUpdating(false);
        })
      ];
    };

    setupUpdates();
    return () => {
      unsubs.forEach((fn) => fn && fn());
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(USER_NAME_KEY) || '';
    setUserName(saved);
  }, []);

  const handleSaveProfile = () => {
    const trimmed = userName.trim();
    localStorage.setItem(USER_NAME_KEY, trimmed);
    window.dispatchEvent(new CustomEvent('cetele:user-name-updated', { detail: trimmed }));
    setStatus({
      type: 'success',
      message: 'Kullanıcı adı kaydedildi. Ana ekranda artık bu isim görünecek.'
    });
  };

  const handleCheckUpdates = async () => {
    setUpdating(true);
    try {
      const res = await window.api.checkUpdates();
      if (!res?.ok) {
        setUpdateInfo(prev => ({ ...prev, status: `Hata: ${res?.error || 'Kontrol başarısız'}` }));
        setUpdating(false);
      } else {
        setUpdateInfo(prev => ({ ...prev, lastCheck: new Date().toISOString(), status: 'Kontrol ediliyor' }));
      }
    } catch (err) {
      setUpdateInfo(prev => ({ ...prev, status: `Hata: ${err.message}` }));
      setUpdating(false);
    }
  };

  // Veritabanı Yedeğini Kaydet (Dışa Aktar)
  const handleBackup = async () => {
    setLoading(true);
    setStatus({ type: '', message: '' });
    try {
      const res = await window.api.backup.export();
      if (res.success) {
        setStatus({
          type: 'success',
          message: `Veritabanı yedeği başarıyla dışa aktarıldı!\nYol: ${res.filePath}`
        });
      } else if (!res.cancelled) {
        setStatus({
          type: 'error',
          message: `Yedekleme başarısız: ${res.error}`
        });
      }
    } catch (err) {
      setStatus({
        type: 'error',
        message: `Bir sistem hatası oluştu: ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Veritabanı Yedeğini Geri Yükle (İçe Aktar)
  const handleRestore = async () => {
    setStatus({ type: '', message: '' });
    if (confirm('DİKKAT: Yeni bir yedek yüklediğinizde mevcut tüm verileriniz silinecek ve yedekteki veriler yazılacaktır! Geri yükleme işlemine devam etmek istiyor musunuz?')) {
      setLoading(true);
      try {
        const res = await window.api.backup.import();
        // Başarı durumunda main.js zaten uyarı gösterip pencereyi yeniden yükleyecek
        if (res.error) {
          setStatus({
            type: 'error',
            message: `Geri yükleme başarısız: ${res.error}`
          });
        }
      } catch (err) {
        setStatus({
          type: 'error',
          message: `Sistem hatası: ${err.message}`
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Genel Bilgi Kartı */}
      <div className="card" style={{ marginBottom: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
          <Database size={32} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Veri Güvenliği ve Depolama</h3>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.95rem', lineHeight: '1.5' }}>
            Uygulama tüm verilerinizi bilgisayarınızda yerel ve yüksek performanslı bir **SQLite** veritabanında saklar.
            Verileriniz hiçbir bulut sunucusuna gönderilmez, tamamen sizin kontrolünüzdedir. Verilerinizi güvenceye almak için aşağıdaki yedekleme araçlarını kullanabilirsiniz.
          </p>
        </div>
      </div>

      {/* Durum Bildirimleri */}
      {status.message && (
        <div 
          className={`card`} 
          style={{ 
            marginBottom: '24px', 
            borderLeft: `4px solid ${status.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
            backgroundColor: status.type === 'success' ? 'hsl(142, 60%, 97%)' : 'hsl(354, 70%, 97%)',
            display: 'flex', 
            gap: '12px', 
            alignItems: 'center',
            padding: '16px 20px'
          }}
        >
          {status.type === 'success' ? (
            <CheckCircle size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
          ) : (
            <AlertCircle size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          )}
          <span style={{ fontSize: '0.92rem', fontWeight: '500', whiteSpace: 'pre-line', color: 'var(--slate-800)' }}>
            {status.message}
          </span>
        </div>
      )}

      {/* İşlem Paneli */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Yedekleme Dışa Aktarma */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={18} style={{ color: 'var(--primary-600)' }} />
            <span>Veritabanı Yedeği Al (Dışa Aktar)</span>
          </h4>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem', marginBottom: '24px', flexGrow: 1, lineHeight: '1.4' }}>
            Mevcut tarlalarınızı, ürünlerinizi, ekim, masraf ve hasat kayıtlarınızı tek bir yedek dosyası (`.db`) olarak bilgisayarınıza indirin. Bilgisayar değişimi veya veri güvenliği için düzenli yedek almanız önerilir.
          </p>
          <button 
            className="btn btn-primary btn-large" 
            style={{ width: '100%' }}
            onClick={handleBackup}
            disabled={loading}
          >
            <Download size={18} />
            <span>{loading ? 'Yedekleniyor...' : 'Yedek Dosyasını Kaydet'}</span>
          </button>
        </div>

        {/* Yedek Geri Yükleme */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <h4 style={{ fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={18} style={{ color: 'var(--accent)' }} />
            <span>Yedekten Geri Yükle (İçe Aktar)</span>
          </h4>
          <p style={{ color: 'var(--slate-600)', fontSize: '0.9rem', marginBottom: '24px', flexGrow: 1, lineHeight: '1.4' }}>
            Daha önce almış olduğunuz bir yedek dosyasını (`.db`, `.sqlite` veya `.bak`) uygulamaya yükleyerek verilerinizi geri getirin. Bu işlem güncel kayıtlarınızı tamamen silecektir.
          </p>
          <button 
            className="btn btn-secondary btn-large" 
            style={{ width: '100%', color: 'var(--accent)', borderColor: 'var(--accent)' }}
            onClick={handleRestore}
            disabled={loading}
          >
            <Upload size={18} />
            <span>{loading ? 'Yükleniyor...' : 'Yedek Dosyası Yükle'}</span>
          </button>
        </div>
      </div>

      {/* Otomatik Yedekleme Bilgilendirmesi */}
      <div className="card" style={{ marginTop: '24px', borderLeft: '4px solid var(--info)', backgroundColor: 'hsl(195, 80%, 97%)', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <Info size={20} style={{ color: 'var(--info)', marginTop: '2px', flexShrink: 0 }} />
        <div>
          <h4 style={{ color: 'var(--slate-900)', fontWeight: '600', fontSize: '0.95rem' }}>Otomatik Arka Plan Yedeklemesi Aktif</h4>
          <p style={{ fontSize: '0.88rem', color: 'var(--slate-600)', marginTop: '4px', lineHeight: '1.4' }}>
            Siz yedek almayı unutsanız bile, uygulamamız her açılışta veritabanınızı otomatik yedekler ve `backups` klasöründe tarih damgalı `cetele-YYYY-AA-GG-SS-DD.db` dosyaları oluşturur.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>Profil</h4>
        <div className="form-group">
          <label className="form-label">Görünecek Ad</label>
          <input
            type="text"
            className="form-control"
            placeholder="Örn: Kerem"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            maxLength={40}
          />
        </div>
        <button className="btn btn-secondary" onClick={handleSaveProfile}>
          Adı Kaydet
        </button>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h4 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>Güncellemeler</h4>
        <div style={{ display: 'grid', gap: '8px', marginBottom: '14px', fontSize: '0.92rem' }}>
          <div><strong>Mevcut sürüm:</strong> {updateInfo.currentVersion || 'v1.0.0'}</div>
          <div><strong>Son kontrol:</strong> {updateInfo.lastCheck ? new Date(updateInfo.lastCheck).toLocaleString('tr-TR') : 'Henüz yapılmadı'}</div>
          <div><strong>Durum:</strong> {updateInfo.status || 'Bilinmiyor'}</div>
          {updateInfo.progress > 0 && updateInfo.progress < 100 && (
            <div><strong>İndirme:</strong> %{Math.round(updateInfo.progress)}</div>
          )}
        </div>
        <button
          className="btn btn-primary"
          onClick={handleCheckUpdates}
          disabled={updating}
        >
          <RefreshCw size={16} />
          <span>{updating ? 'Kontrol ediliyor...' : 'Güncellemeleri Kontrol Et'}</span>
        </button>
      </div>
    </div>
  );
}

export default Ayarlar;
