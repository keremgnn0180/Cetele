import React, { useEffect, useState } from "react";
import RecoveryMode from "./RecoveryMode";

export default function StartupHealthGate({ children }) {
  const [state, setState] = useState({
    loading: true,
    report: null,
  });

  const runHealthCheck = async () => {
    setState((prev) => ({ ...prev, loading: true }));

    try {
      // preload henüz yüklenmemiş olabilir
      if (
        typeof window === "undefined" ||
        !window.api ||
        !window.api.health ||
        typeof window.api.health.check !== "function"
      ) {
        throw new Error("Preload API yüklenemedi.");
      }

      const report = await window.api.health.check();

      setState({
        loading: false,
        report,
      });
    } catch (error) {
      console.error("Startup Health Error:", error);

      setState({
        loading: false,
        report: {
          ok: false,
          checks: {
            IPC: {
              ok: false,
              message:
                error?.message || "IPC sağlık kontrolü çalıştırılamadı.",
            },
          },
        },
      });
    }
  };

  useEffect(() => {
    // renderer tamamen hazır olduktan sonra çalıştır
    const timer = setTimeout(runHealthCheck, 100);
    return () => clearTimeout(timer);
  }, []);

  if (state.loading) {
    return (
      <div className="app-loading">
        <div className="app-loading-card">
          <strong>Çetele hazırlanıyor...</strong>
          <span>Servisler kontrol ediliyor...</span>
        </div>
      </div>
    );
  }

  if (state.report && !state.report.ok) {
    return (
      <RecoveryMode
        report={state.report}
        onRetry={runHealthCheck}
      />
    );
  }

  return children;
}