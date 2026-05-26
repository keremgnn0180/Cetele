import React, { useEffect, useState } from 'react';
import {
  Layers,
  Sprout,
  Wallet,
  TrendingUp,
  RefreshCw,
  ArrowRight,
  Map,
  DollarSign,
  CalendarDays,
  FileText,
  Database
} from 'lucide-react';

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
      console.error('Dashboard verileri yuklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const [welcomeName, setWelcomeName] = useState(() => localStorage.getItem(USER_NAME_KEY) || 'Ciftci');

  useEffect(() => {
    const handleNameUpdate = (event) => {
      const newName = event?.detail?.trim?.() || localStorage.getItem(USER_NAME_KEY) || 'Ciftci';
      setWelcomeName(newName || 'Ciftci');
    };

    window.addEventListener('cetele:user-name-updated', handleNameUpdate);
    return () => window.removeEventListener('cetele:user-name-updated', handleNameUpdate);
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 10, color: 'var(--slate-600)' }}>
        <RefreshCw size={18} className="animate-spin" />
        <span>Dashboard hazirlaniyor...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="dashboard-topline">
        <div>
          <h2 className="dashboard-welcome">Hos geldin, {welcomeName} 🌿</h2>
          <p className="dashboard-sub">Bugun tarlalarinin durumu nasil?</p>
        </div>
        <button className="btn btn-primary" onClick={() => setActiveTab('masraflar')}>
          <span>+ Yeni Kayit Ekle</span>
        </button>
      </div>

      <div className="stats-grid stats-grid-4">
        <div className="stat-card clean">
          <div className="stat-icon soft-green"><Layers size={22} /></div>
          <div className="stat-copy">
            <p>Toplam Tarla</p>
            <strong>{stats.tarlaSayisi}</strong>
            <small>Toplam {stats.toplamDonum.toLocaleString('tr-TR')} donum</small>
          </div>
        </div>
        <div className="stat-card clean">
          <div className="stat-icon soft-gold"><Sprout size={22} /></div>
          <div className="stat-copy">
            <p>Toplam Urun</p>
            <strong>{stats.urunSayisi}</strong>
            <small>{stats.urunSayisi} farkli urun</small>
          </div>
        </div>
        <div className="stat-card clean">
          <div className="stat-icon soft-purple"><Wallet size={22} /></div>
          <div className="stat-copy">
            <p>Toplam Masraf</p>
            <strong>₺{stats.toplamMasraf.toLocaleString('tr-TR')}</strong>
            <small>Bu yil toplam</small>
          </div>
        </div>
        <div className="stat-card clean">
          <div className="stat-icon soft-blue"><TrendingUp size={22} /></div>
          <div className="stat-copy">
            <p>Toplam Gelir</p>
            <strong>₺{stats.toplamGelir.toLocaleString('tr-TR')}</strong>
            <small>Bu yil toplam</small>
          </div>
        </div>
      </div>

      <div className="dashboard-panels">
        <div className="card">
          <div className="panel-head">
            <h3>Son Kayitlar</h3>
            <button className="btn btn-secondary" style={{ padding: '8px 12px' }} onClick={() => setActiveTab('raporlar')}>Tumunu Gor</button>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Tur</th>
                  <th>Aciklama</th>
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
          <h3 style={{ marginBottom: 16 }}>Hizli Erisim</h3>
          <div className="quick-grid">
            <button className="quick-item" onClick={() => setActiveTab('tarlalar')}><Map className="quick-item-icon" size={22} />Tarla Ekle</button>
            <button className="quick-item" onClick={() => setActiveTab('masraflar')}><DollarSign className="quick-item-icon" size={22} />Masraf Ekle</button>
            <button className="quick-item" onClick={() => setActiveTab('ekim')}><CalendarDays className="quick-item-icon" size={22} />Ekim Kaydi</button>
            <button className="quick-item" onClick={() => setActiveTab('hasat')}><TrendingUp className="quick-item-icon" size={22} />Hasat Kaydi</button>
            <button className="quick-item" onClick={() => setActiveTab('raporlar')}><FileText className="quick-item-icon" size={22} />Raporlar</button>
            <button className="quick-item" onClick={() => setActiveTab('ayarlar')}><Database className="quick-item-icon" size={22} />Yedekleme</button>
          </div>
          <button className="btn btn-secondary" style={{ marginTop: 16, width: '100%' }} onClick={() => setActiveTab('raporlar')}>
            Detayli Rapor <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
