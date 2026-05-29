import React from 'react';

export default function RecoveryMode({ report, onRetry }) {
  const checks = report?.checks || {};

  return (
    <div className="crash-screen">
      <div className="crash-panel recovery-panel">
        <div className="crash-badge">Recovery Mode</div>
        <h1>Çetele güvenli modda açıldı</h1>
        <p>Başlangıç kontrollerinden biri başarısız oldu. Verilerin zarar görmemesi için uygulama normal ekrana geçmedi.</p>

        <div className="health-list">
          {Object.entries(checks).map(([name, item]) => (
            <div key={name} className={`health-row ${item.ok ? 'ok' : 'fail'}`}>
              <span>{name}</span>
              <strong>{item.ok ? 'Sağlıklı' : 'Sorun var'}</strong>
              {!item.ok && item.message && <small>{item.message}</small>}
            </div>
          ))}
        </div>

        <div className="crash-actions">
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            Tekrar Kontrol Et
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>
            Yeniden Başlat
          </button>
        </div>
      </div>
    </div>
  );
}
