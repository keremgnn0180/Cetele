import React, { useEffect, useState } from 'react';
import { Layers, Sprout, Wallet, TrendingUp, RefreshCw, ArrowRight } from 'lucide-react';

if (typeof window !== 'undefined' && window.dashboardCache === undefined) {
  window.dashboardCache = { data: null, isDirty: true };
}

function Dashboard({ setActiveTab }) {
  const USER_NAME_KEY = 'cetele_user_name';
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tarlaSayisi: 0,
    toplamDonum: 0,
    urunSayisi: 0,
    toplamMasraf: 0,
    toplamGelir: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);

  const loadDashboardData = async (forceRefresh = false) => {
    if (!forceRefresh && !window.dashboardCache.isDirty && window.dashboardCache.data) {
      const cached = window.dashboardCache.data;
      setStats(cached.stats);
      setRecentActivities(cached.recentActivities);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [summary, urunler] = await Promise.all([
        window.api.raporlar.getSummary(),
        window.api.urunler.getAll()
      ]);

      const statsObj = {
        tarlaSayisi: summary.totalFields || 0,
        toplamDonum: summary.totalArea || 0,
        urunSayisi: urunler.length || 0,
        toplamMasraf: summary.totalExpenses || 0,
        toplamGelir: summary.totalRevenue || 0
      };

      const recent = (summary.recentActivities || []).slice(0, 6);
      setStats(statsObj);
      setRecentActivities(recent);

      window.dashboardCache.data = { stats: statsObj, recentActivities: recent };
      window.dashboardCache.isDirty = false;
    } catch (err) {
      console.error('Dashboard verileri yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const [welcomeName, setWelcomeName] = useState(() => localStorage.getItem(USER_NAME_KEY) || 'Çiftçi');

  useEffect(() => {
    const handleNameUpdate = (event) => {
      const newName = event?.detail?.trim?.() || localStorage.getItem(USER_NAME_KEY) || 'Çiftçi';
      setWelcomeName(newName || 'Çiftçi');
    };

    window.addEventListener('cetele:user-name-updated', handleNameUpdate);
    return () => window.removeEventListener('cetele:user-name-updated', handleNameUpdate);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 10, color: 'var(--slate-600)' }}>
        <RefreshCw size={18} className="animate-spin" />
        <span>Dashboard hazırlanıyor...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-topline">
        <div>
          <h2 className="dashboard-welcome">Hoş geldin, {welcomeName} 🌿</h2>
          <p className="dashboard-sub">Bugün tarlalarının durumu nasıl?</p>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveTab('masraflar')}>
          <span>+ Yeni Kayıt Ekle</span>
        </button>
      </div>

      <div className="stats-grid stats-grid-4">
        <div className="stat-card clean">
          <div className="stat-icon soft-green"><Layers size={22} /></div>
          <div className="stat-copy">
            <p>Toplam Tarla</p>
            <strong>{stats.tarlaSayisi}</strong>
            <small>Toplam {stats.toplamDonum.toLocaleString('tr-TR')} dönüm</small>
          </div>
        </div>
        <div className="stat-card clean">
          <div className="stat-icon soft-gold"><Sprout size={22} /></div>
          <div className="stat-copy">
            <p>Toplam Ürün</p>
            <strong>{stats.urunSayisi}</strong>
            <small>{stats.urunSayisi} farklı ürün</small>
          </div>
        </div>
        <div className="stat-card clean">
          <div className="stat-icon soft-purple"><Wallet size={22} /></div>
          <div className="stat-copy">
            <p>Toplam Masraf</p>
            <strong>₺{stats.toplamMasraf.toLocaleString('tr-TR')}</strong>
            <small>Bu yıl toplam</small>
          </div>
        </div>
        <div className="stat-card clean">
          <div className="stat-icon soft-blue"><TrendingUp size={22} /></div>
          <div className="stat-copy">
            <p>Toplam Gelir</p>
            <strong>₺{stats.toplamGelir.toLocaleString('tr-TR')}</strong>
            <small>Bu yıl toplam</small>
          </div>
        </div>
      </div>

      <div className="dashboard-panels">
        <div className="card">
          <div className="panel-head">
            <h3>Son Kayıtlar</h3>
            <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={() => setActiveTab('raporlar')}>Tümünü Gör</button>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Tür</th>
                  <th>Açıklama</th>
                  <th style={{ textAlign: 'right' }}>Tutar</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((r, i) => (
                  <tr key={`${r.tip}-${i}`}>
                    <td>{new Date(r.tarih).toLocaleDateString('tr-TR')}</td>
                    <td>{r.tip}</td>
                    <td>{r.detay}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.miktar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Hızlı Erişim</h3>
          <div className="quick-grid">
            <button className="quick-item" onClick={() => setActiveTab('tarlalar')}>Tarla Ekle</button>
            <button className="quick-item" onClick={() => setActiveTab('masraflar')}>Masraf Ekle</button>
            <button className="quick-item" onClick={() => setActiveTab('ekim')}>Ekim Kaydı</button>
            <button className="quick-item" onClick={() => setActiveTab('hasat')}>Hasat Kaydı</button>
            <button className="quick-item" onClick={() => setActiveTab('raporlar')}>Raporlar</button>
            <button className="quick-item" onClick={() => setActiveTab('ayarlar')}>Yedekleme</button>
          </div>
          <button className="btn btn-secondary" style={{ marginTop: 16, width: '100%' }} onClick={() => setActiveTab('raporlar')}>
            Detaylı Rapor <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
