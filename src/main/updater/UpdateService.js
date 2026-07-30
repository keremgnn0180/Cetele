const { app, Notification } = require("electron");

class UpdateService {
  constructor({ getMainWindow, logger }) {
    this.getMainWindow = getMainWindow;
    this.logger = logger;
    this.autoUpdater = null;
    this.lastCheck = null;
    this.status = "Hazır";
    this.isSetup = false;
    this.installTimer = null;
    this.pendingInstall = false;
    this.installDelayMs = 10000;

    try {
      this.autoUpdater = require("electron-updater").autoUpdater;
      this.autoUpdater.logger = logger;
      this.autoUpdater.autoDownload = true;
      this.autoUpdater.autoInstallOnAppQuit = true;
      this.autoUpdater.requestHeaders = {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      };
      this.logger.info("Auto updater initialized");
    } catch (err) {
      this.logger.warn("Auto updater yüklenemedi:", err.message);
    }
  }

  setup() {
    if (!this.autoUpdater || this.isSetup) return;
    this.isSetup = true;

    this.autoUpdater.on("checking-for-update", () => {
      this.status = "Kontrol ediliyor";
      this.logger.info("Checking for updates");
      this.send("update:checking-for-update", {
        checkedAt: new Date().toISOString(),
      });
    });

    this.autoUpdater.on("update-available", (info) => {
      this.status = "Güncelleme indiriliyor";
      this.logger.info("Update available, background download started", {
        version: info?.version,
        releaseDate: info?.releaseDate,
      });
      this.send("update:available", {
        version: info?.version || null,
        releasedAt: info?.releaseDate || null,
      });
    });

    this.autoUpdater.on("update-not-available", (info) => {
      this.status = "Güncel";
      this.logger.info("No updates available", {
        version: info?.version || app.getVersion(),
      });
      this.send("update:not-available", {
        checkedAt: new Date().toISOString(),
        version: info?.version || app.getVersion(),
      });
    });

    this.autoUpdater.on("download-progress", (progress) => {
      const percent = Number.isFinite(progress?.percent)
        ? Math.round(progress.percent)
        : 0;
      this.status = `İndiriliyor (%${percent})`;
      this.logger.debug("Update download progress", {
        percent,
        transferred: progress?.transferred,
        total: progress?.total,
      });
      this.send("update:download-progress", { percent });
    });

    this.autoUpdater.on("update-downloaded", (info) => {
      this.status = "Güncelleme hazır";
      this.pendingInstall = true;
      this.logger.info("Update downloaded, scheduling restart", {
        version: info?.version,
        delayMs: this.installDelayMs,
      });
      this.send("update:downloaded", { version: info?.version || null });
      this.notify(
        "Güncelleme hazır",
        "Çetele birazdan yeniden başlatılıp yeni sürümü kuracak.",
      );
      this.scheduleInstall();
    });

    this.autoUpdater.on("error", (err) => {
      this.status = "Hata";
      this.logger.error("autoUpdater error:", err);
      this.send("update:error", {
        message: err?.message || "Bilinmeyen güncelleme hatası",
      });
    });
  }

  async check(source = "manual") {
    this.lastCheck = new Date().toISOString();
    this.logger.info("Update check requested", { source });

    if (!this.autoUpdater) {
      this.status = "Updater modülü yüklenemedi";
      throw new Error("electron-updater bulunamadı");
    }

    if (!app.isPackaged) {
      this.status = "Geliştirme modunda atlandı";
      this.logger.info("Update check skipped in development mode");
      this.send("update:not-available", {
        checkedAt: this.lastCheck,
        version: app.getVersion(),
        devMode: true,
      });
      return { ok: true, skipped: true, reason: "dev-mode" };
    }

    const result = await this.autoUpdater.checkForUpdates();

    return { ok: true, updateInfo: result?.updateInfo || null };
  }

  getState() {
    return {
      currentVersion: `v${app.getVersion()}`,
      lastCheck: this.lastCheck,
      status: this.status,
      pendingInstall: this.pendingInstall,
    };
  }

  send(channel, payload = {}) {
    const mainWindow = this.getMainWindow();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, payload);
    }
  }

  notify(title, body) {
    try {
      if (Notification.isSupported()) new Notification({ title, body }).show();
    } catch (err) {
      this.logger.error("Notification error:", err);
    }
  }

  scheduleInstall() {
    if (!this.autoUpdater || this.installTimer) return;

    this.installTimer = setTimeout(() => {
      this.status = "Güncelleme kuruluyor";
      this.logger.info("Restarting app to install update");
      this.send("update:installing", {
        installingAt: new Date().toISOString(),
      });

      try {
        this.autoUpdater.quitAndInstall(false, true);
      } catch (err) {
        this.status = "Hata";
        this.logger.error("quitAndInstall failed:", err);
        this.send("update:error", {
          message: err?.message || "Güncelleme kurulumu başlatılamadı",
        });
      }
    }, this.installDelayMs);
  }
}

module.exports = UpdateService;
