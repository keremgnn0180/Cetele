import React, { useEffect, useState } from 'react';
import RecoveryMode from './RecoveryMode';

export default function StartupHealthGate({ children }) {
  const [state, setState] = useState({ loading: true, report: null });

  const runHealthCheck = async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      const report = await window.api.health.check();
      setState({ loading: false, report });
    } catch (error) {
      setState({
        loading: false,
        report: {
          ok: false,
          checks: {
            IPC: { ok: false, message: error?.message || 'IPC sağlık kontrolü çalışmadı.' }
          }
        }
      });
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  if (state.loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-card">
          <strong>Çetele hazırlanıyor</strong>
          <span>Veritabanı, yedekleme ve servisler kontrol ediliyor...</span>
        </div>
      </div>
    );
  }

  if (state.report && !state.report.ok) {
    return <RecoveryMode report={state.report} onRetry={runHealthCheck} />;
  }

  return children;
}
