const { app, Notification, dialog } = require('electron');

class UpdateService {
  constructor({ getMainWindow, logger }) {
    this.getMainWindow = getMainWindow;
    this.logger = logger;
    this.autoUpdater = null;
    this.lastCheck = null;
    this.status = 'Hazır';
    this.isDialogVisible = false;

    try {
      this.autoUpdater = require('electron-updater').autoUpdater;
      this.autoUpdater.logger = logger;
      this.autoUpdater.autoDownload = true;
      this.autoUpdater.autoInstallOnAppQuit = true;
      this.autoUpdater.requestHeaders = {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache'
      };
    } catch (err) {
      this.logger.warn('Auto updater yüklenemedi:', err.message);
    }
  }

  setup() {
    if (!this.autoUpdater) return;

    this.autoUpdater.on('checking-for-update', () => {
      this.status = 'Kontrol ediliyor';
      this.send('update:checking-for-update', { checkedAt: new Date().toISOString() });
    });

    this.autoUpdater.on('update-available', (info) => {
      this.status = 'Güncelleme bulundu';
      this.send('update:available', { version: info?.version || null, releasedAt: info?.releaseDate || null });
      this.notify('Yeni güncelleme bulundu', 'Çetele yeni sürümü indiriyor...');
    });

    this.autoUpdater.on('update-not-available', (info) => {
      this.status = 'Güncel';
      this.send('update:not-available', { checkedAt: new Date().toISOString(), version: info?.version || app.getVersion() });
    });

    this.autoUpdater.on('download-progress', (progress) => {
      const percent = Number.isFinite(progress?.percent) ? Math.round(progress.percent) : 0;
      this.status = `İndiriliyor (%${percent})`;
      this.send('update:download-progress', { percent });
    });

    this.autoUpdater.on('update-downloaded', async (info) => {
      this.status = 'Güncelleme hazır';
      this.send('update:downloaded', { version: info?.version || null });
      this.notify('Güncelleme hazır', 'Uygulama kapatıldığında yeni sürüm kurulacak.');
      await this.promptInstall();
    });

    this.autoUpdater.on('error', (err) => {
      this.status = 'Hata';
      this.logger.error('autoUpdater error:', err);
      this.send('update:error', { message: err?.message || 'Bilinmeyen güncelleme hatası' });
    });
  }

  async check(source = 'manual') {
    this.lastCheck = new Date().toISOString();

    if (!this.autoUpdater) {
      this.status = 'Updater modülü yüklenemedi';
      throw new Error('electron-updater bulunamadı');
    }

    if (!app.isPackaged) {
      this.status = 'Geliştirme modunda atlandı';
      this.send('update:not-available', { checkedAt: this.lastCheck, version: app.getVersion(), devMode: true });
      return { skipped: true, reason: 'dev-mode' };
    }

    const result = source === 'startup'
      ? await this.autoUpdater.checkForUpdatesAndNotify()
      : await this.autoUpdater.checkForUpdates();

    return { updateInfo: result?.updateInfo || null };
  }

  getState() {
    return {
      currentVersion: `v${app.getVersion()}`,
      lastCheck: this.lastCheck,
      status: this.status
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
      this.logger.error('Notification error:', err);
    }
  }

  async promptInstall() {
    if (this.isDialogVisible || !this.autoUpdater) return;
    this.isDialogVisible = true;
    try {
      const result = await dialog.showMessageBox({
        type: 'info',
        buttons: ['Şimdi Yeniden Başlat', 'Daha Sonra'],
        defaultId: 0,
        cancelId: 1,
        title: 'Çetele',
        message: 'Uygulama yeniden başlatıldığında yeni sürüm kurulacak.',
        detail: 'Güncellemeyi şimdi kurmak için yeniden başlatabilirsiniz.'
      });
      if (result.response === 0) this.autoUpdater.quitAndInstall();
    } finally {
      this.isDialogVisible = false;
    }
  }
}

module.exports = UpdateService;
