import React, { useEffect, useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Map,
  Sprout,
  DollarSign,
  CalendarDays,
  TrendingUp,
  BarChart3,
  Settings,
  Database,
  Bell,
  Search
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import Tarlalar from './components/Tarlalar';
import Urunler from './components/Urunler';
import Ekim from './components/Ekim';
import Masraflar from './components/Masraflar';
import Hasat from './components/Hasat';
import Raporlar from './components/Raporlar';
import Ayarlar from './components/Ayarlar';
import SplashScreen from './components/SplashScreen';
import leafLogo from './assets/leaf-logo.svg';
import appIconPng from './assets/app-icon.png';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSplash, setShowSplash] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const menuItems = [
    { id: 'dashboard', name: 'Ana Ekran', icon: LayoutDashboard },
    { id: 'tarlalar', name: 'Tarlalar', icon: Map },
    { id: 'urunler', name: 'Ürünler', icon: Sprout },
    { id: 'ekim', name: 'Ekim Kayıtları', icon: CalendarDays },
    { id: 'masraflar', name: 'Masraflar', icon: DollarSign },
    { id: 'hasat', name: 'Hasat & Satış', icon: TrendingUp },
    { id: 'raporlar', name: 'Raporlar', icon: BarChart3 },
    { id: 'ayarlar', name: 'Yedekleme & Ayarlar', icon: Settings }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'tarlalar':
        return <Tarlalar />;
      case 'urunler':
        return <Urunler />;
      case 'ekim':
        return <Ekim />;
      case 'masraflar':
        return <Masraflar />;
      case 'hasat':
        return <Hasat />;
      case 'raporlar':
        return <Raporlar />;
      case 'ayarlar':
        return <Ayarlar />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  const activePageName = menuItems.find((item) => item.id === activeTab)?.name || 'Ana Ekran';
  const todayLabel = useMemo(
    () =>
      new Date().toLocaleDateString('tr-TR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
    []
  );
  const todayWeekday = useMemo(
    () =>
      new Date().toLocaleDateString('tr-TR', {
        weekday: 'long'
      }),
    []
  );

  const parseSearchDate = (value) => {
    const text = value.trim().toLowerCase();
    if (!text) return null;

    const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

    const dotMatch = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (dotMatch) {
      const day = dotMatch[1].padStart(2, '0');
      const month = dotMatch[2].padStart(2, '0');
      return `${dotMatch[3]}-${month}-${day}`;
    }

    const monthMap = {
      ocak: '01', subat: '02', 'şubat': '02', mart: '03', nisan: '04', mayis: '05', mayıs: '05',
      haziran: '06', temmuz: '07', agustos: '08', ağustos: '08', eylul: '09', eylül: '09',
      ekim: '10', kasim: '11', kasım: '11', aralik: '12', aralık: '12'
    };

    const longMatch = text.match(/^(\d{1,2})\s+([a-zçğıöşü]+)\s+(\d{4})$/i);
    if (longMatch) {
      const day = longMatch[1].padStart(2, '0');
      const month = monthMap[longMatch[2]];
      if (month) return `${longMatch[3]}-${month}-${day}`;
    }

    return null;
  };

  useEffect(() => {
    const query = searchText.trim();
    if (!query) {
      setSearchResults([]);
      return;
    }

    const runSearch = async () => {
      setSearchLoading(true);
      try {
        const [ekimler, masraflar, hasatlar] = await Promise.all([
          window.api.ekimler.getAll(),
          window.api.masraflar.getAll(),
          window.api.hasatlar.getAll()
        ]);

        const activities = [
          ...ekimler.map((item) => ({
            tip: 'Ekim',
            tarih: item.tarih,
            detay: item.urun_isim || item.aciklama || 'Ekim Kaydı',
            tarla: item.tarla_isim || '-',
            miktar: `${item.miktar || 0} ${item.birim || ''}`.trim(),
            aranabilir: `${item.urun_isim || ''} ${item.tarla_isim || ''} ${item.aciklama || ''}`.toLowerCase()
          })),
          ...masraflar.map((item) => ({
            tip: 'Masraf',
            tarih: item.tarih,
            detay: item.kategori ? `${item.kategori} - ${item.urun_adi || ''}` : (item.urun_adi || 'Masraf Kaydı'),
            tarla: item.tarla_isim || 'Genel',
            miktar: `${Number(item.tutar || 0).toLocaleString('tr-TR')} TL`,
            aranabilir: `${item.kategori || ''} ${item.urun_adi || ''} ${item.tarla_isim || ''} ${item.aciklama || ''}`.toLowerCase()
          })),
          ...hasatlar.map((item) => ({
            tip: 'Hasat',
            tarih: item.tarih,
            detay: item.urun_isim || item.aciklama || 'Hasat Kaydı',
            tarla: item.tarla_isim || '-',
            miktar: `${Number(item.gelir || 0).toLocaleString('tr-TR')} TL`,
            aranabilir: `${item.urun_isim || ''} ${item.tarla_isim || ''} ${item.aciklama || ''}`.toLowerCase()
          }))
        ];

        const dateQuery = parseSearchDate(query);
        const lowerQuery = query.toLowerCase();

        const filtered = activities
          .filter((item) => {
            const itemDate = String(item.tarih || '').slice(0, 10);
            if (dateQuery) {
              return itemDate === dateQuery || item.aranabilir.includes(lowerQuery);
            }
            return item.aranabilir.includes(lowerQuery) || itemDate.includes(lowerQuery);
          })
          .sort((a, b) => new Date(b.tarih) - new Date(a.tarih))
          .slice(0, 30);

        setSearchResults(filtered);
      } catch (error) {
        console.error('Arama sırasında hata oluştu:', error);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    };

    const timeoutId = setTimeout(runSearch, 220);
    return () => clearTimeout(timeoutId);
  }, [searchText]);

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">
            <img
              src={leafLogo}
              alt="Çetele Logo"
              style={{ width: 38, height: 38, display: 'block' }}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = appIconPng;
              }}
            />
          </div>
          <div className="logo-text">
            <span>Çetele</span>
            <div className="logo-sub">Tarımsal kayıt ve mali takip</div>
          </div>
        </div>

        <ul className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.id} className="menu-item">
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`menu-link ${activeTab === item.id ? 'active' : ''}`}
                  style={{ width: '100%', textAlign: 'left' }}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="sidebar-footer">
          <p>© 2026 Çetele v1.0</p>
        </div>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <div className="header-left">
            <div className="header-title-row">
              <span className="header-seed">🌱</span>
              <h1 className="page-title">{activePageName}</h1>
            </div>
            <p className="header-date">{todayLabel}</p>
            <p className="header-date-sub">{todayWeekday}</p>
          </div>

          <div className="header-right">
            <div className="header-search-wrap">
              <Search size={16} className="header-search-icon" />
              <input
                type="text"
                className="header-search-input"
                placeholder="Tarla, ürün veya masraf ara..."
                aria-label="Tarla, ürün veya masraf ara"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </div>

            <button type="button" className="header-icon-btn" aria-label="Bildirimler" disabled title="Bildirimler yakında aktif olacak">
              <Bell size={18} />
            </button>

            <button type="button" className="header-icon-btn" aria-label="Ayarlar" onClick={() => setActiveTab('ayarlar')}>
              <Settings size={18} />
            </button>

            <div className="header-db-status" aria-label="SQLite durumu aktif">
              <span className="status-dot" />
              <Database size={14} />
              <span>Aktif</span>
            </div>
          </div>
        </header>

        <div className="content-body">
          {searchText.trim() && (
            <div className="search-results-card">
              <h3>Arama Sonuçları</h3>
              {searchLoading ? (
                <p className="search-results-meta">Aranıyor...</p>
              ) : (
                <p className="search-results-meta">
                  {searchResults.length} kayıt bulundu
                  {parseSearchDate(searchText) ? ` • Tarih: ${parseSearchDate(searchText)}` : ''}
                </p>
              )}

              {!searchLoading && searchResults.length === 0 && (
                <p className="search-empty">Bu kriterde işlem bulunamadı.</p>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="search-results-list">
                  {searchResults.map((item, idx) => (
                    <div key={`${item.tip}-${item.tarih}-${idx}`} className="search-item">
                      <div>
                        <strong>{item.tip}</strong> • {item.detay}
                      </div>
                      <div className="search-item-sub">
                        {new Date(item.tarih).toLocaleDateString('tr-TR')} • Tarla: {item.tarla} • {item.miktar}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
