import React from 'react';

export default function CrashScreen({ title = 'Uygulama beklenmeyen bir hata ile karşılaştı', message, onRetry }) {
  return (
    <div className="crash-screen">
      <div className="crash-panel">
        <div className="crash-badge">Çetele</div>
        <h1>{title}</h1>
        <p>{message || 'Verileriniz korunuyor. Uygulamayı yeniden yükleyerek kaldığınız yerden devam edebilirsiniz.'}</p>
        <div className="crash-actions">
          {onRetry && (
            <button type="button" className="btn btn-primary" onClick={onRetry}>
              Yeniden Dene
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => window.location.reload()}>
            Uygulamayı Yenile
          </button>
        </div>
      </div>
    </div>
  );
}
