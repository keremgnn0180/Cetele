// main.js - corrected
const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const log = require('electron-log');
let autoUpdater = null;

try {
  autoUpdater = require('electron-updater').autoUpdater;
} catch (err) {
  console.log('Auto updater yuklenemedi:', err.message);
}
app.setName('Cetele');
app.setPath('userData', path.join(app.getPath('appData'), 'Çetele'));
app.setAppUserModelId('com.cetele.app');
const fs = require('fs');
const database = require('./database.js');

let mainWindow;
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let lastUpdateCheckAt = null;
let updateStatus = 'Hazir';
let isUpdateDialogVisible = false;

log.transports.file.level = 'info';
if (autoUpdater) {
  autoUpdater.logger = log;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
}

function sendUpdateEvent(channel, payload = {}) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function showNativeNotification(title, body) {
  try {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  } catch (err) {
    log.error('Notification error:', err);
  }
}

function setupAutoUpdaterEvents() {
  if (!autoUpdater) return;

  autoUpdater.on('checking-for-update', () => {
    updateStatus = 'Kontrol ediliyor';
    sendUpdateEvent('update:checking-for-update', { checkedAt: new Date().toISOString() });
    log.info('checking-for-update');
  });

  autoUpdater.on('update-available', (info) => {
    updateStatus = 'Guncelleme bulundu';
    sendUpdateEvent('update:available', { version: info?.version || null, releasedAt: info?.releaseDate || null });
    showNativeNotification('Yeni guncelleme bulundu', 'Cetele yeni surumu indiriyor...');
    log.info('update-available', info);
  });

  autoUpdater.on('update-not-available', (info) => {
    updateStatus = 'Guncel';
    sendUpdateEvent('update:not-available', { checkedAt: new Date().toISOString(), version: info?.version || app.getVersion() });
    log.info('update-not-available', info);
  });

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Number.isFinite(progressObj?.percent) ? Math.round(progressObj.percent) : 0;
    updateStatus = `Indiriliyor (%${percent})`;
    sendUpdateEvent('update:download-progress', { percent });
    log.info(`download-progress: ${percent}%`);
  });

  autoUpdater.on('update-downloaded', async (info) => {
    updateStatus = 'Guncelleme hazir';
    sendUpdateEvent('update:downloaded', { version: info?.version || null });
    showNativeNotification('Guncelleme hazir', 'Uygulama kapatildiginda yeni surum kurulacak.');
    log.info('update-downloaded', info);

    if (isUpdateDialogVisible) return;
    isUpdateDialogVisible = true;
    try {
      const result = await dialog.showMessageBox({
        type: 'info',
        buttons: ['Simdi Yeniden Baslat', 'Daha Sonra'],
        defaultId: 0,
        cancelId: 1,
        title: 'Cetele',
        message: 'Uygulama yeniden baslatildiginda yeni surum kurulacak.',
        detail: 'Guncellemeyi simdi kurmak icin yeniden baslatabilirsiniz.'
      });
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    } catch (err) {
      log.error('update-downloaded dialog error:', err);
    } finally {
      isUpdateDialogVisible = false;
    }
  });

  autoUpdater.on('error', (err) => {
    updateStatus = 'Hata';
    sendUpdateEvent('update:error', { message: err?.message || 'Bilinmeyen guncelleme hatasi' });
    log.error('autoUpdater error:', err);
  });
}

async function checkForUpdates(source = 'startup') {
  lastUpdateCheckAt = new Date().toISOString();
  try {
    if (!autoUpdater) {
      updateStatus = 'Updater modulu yuklenemedi';
      return { ok: false, error: 'electron-updater bulunamadi' };
    }
    if (!app.isPackaged) {
      updateStatus = 'Gelistirme modunda atlandi';
      sendUpdateEvent('update:not-available', { checkedAt: lastUpdateCheckAt, version: app.getVersion(), devMode: true });
      return { ok: true, skipped: true, reason: 'dev-mode' };
    }
    const result = source === 'startup'
      ? await autoUpdater.checkForUpdatesAndNotify()
      : await autoUpdater.checkForUpdates();
    return { ok: true, updateInfo: result?.updateInfo || null };
  } catch (err) {
    updateStatus = 'Hata';
    log.error('checkForUpdates error:', err);
    sendUpdateEvent('update:error', { message: err?.message || 'Guncelleme kontrolu basarisiz' });
    return { ok: false, error: err?.message || 'Guncelleme kontrolu basarisiz' };
  }
}

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    title: 'Cetele',
    minHeight: 700,
    show: false,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Log loading errors.
  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.log('LOAD ERROR:', errorCode, errorDescription);
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // Open DevTools only in development.
    mainWindow.webContents.openDevTools();
  } else {
    // Production loading.
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const appDataPath = isDev ? __dirname : app.getPath('userData');
  const currentDbPath = path.join(appDataPath, 'cetele.db');
  const legacyCandidates = ['Cetele', '?etele', 'Çetele']
    .map((name) => path.join(app.getPath('appData'), name))
    .filter((p, i, arr) => arr.indexOf(p) === i);

  try {
    if (!isDev) {
      fs.mkdirSync(appDataPath, { recursive: true });
      const hasCurrentDb = fs.existsSync(currentDbPath);
      const currentDbSize = hasCurrentDb ? fs.statSync(currentDbPath).size : 0;

      for (const legacyPath of legacyCandidates) {
        if (legacyPath === appDataPath) continue;

        const legacyDbPath = path.join(legacyPath, 'cetele.db');
        if (fs.existsSync(legacyDbPath)) {
          const legacyDbSize = fs.statSync(legacyDbPath).size;
          const shouldRecoverDb = !hasCurrentDb || (currentDbSize < 32768 && legacyDbSize > currentDbSize);
          if (shouldRecoverDb) {
            fs.copyFileSync(legacyDbPath, currentDbPath);
          }
        }

        const legacyBackups = path.join(legacyPath, 'backups');
        const currentBackups = path.join(appDataPath, 'backups');
        if (fs.existsSync(legacyBackups) && !fs.existsSync(currentBackups)) {
          fs.cpSync(legacyBackups, currentBackups, { recursive: true });
        }
      }
      console.log('Legacy profile recovery scan completed.');
    }

    await database.initDatabase(appDataPath);
    console.log('SQLite veritabani basariyla baglandi.');
  } catch (err) {
    console.error('Veritabani baslatilamadi:', err.message);
  }

  createWindow();
  if (autoUpdater) {
    setupAutoUpdaterEvents();
    await checkForUpdates('startup');
  }

  // On macOS, recreate a window when the dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ===================================================
// SECURE IPC HANDLERS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ unchanged (preserved from original file)
// ===================================================

// 1. TARLALAR
ipcMain.handle('tarlalar:get-all', async () => {
  try {
    return database.query('SELECT * FROM tarlalar ORDER BY id DESC');
  } catch (err) {
    console.error('tarlalar:get-all error:', err);
    throw err;
  }
});

ipcMain.handle('tarlalar:add', async (event, data) => {
  try {
    const sql = 'INSERT INTO tarlalar (isim, donum, konum) VALUES (?, ?, ?)';
    return database.run(sql, [data.isim, parseFloat(data.donum), data.konum || '']);
  } catch (err) {
    console.error('tarlalar:add error:', err);
    throw err;
  }
});

ipcMain.handle('tarlalar:remove', async (event, id) => {
  try {
    return database.run('DELETE FROM tarlalar WHERE id = ?', [parseInt(id)]);
  } catch (err) {
    console.error('tarlalar:remove error:', err);
    throw err;
  }
});

// 2. ÃƒÆ’Ã†â€™Ãƒâ€¦Ã¢â‚¬Å“RÃƒÆ’Ã†â€™Ãƒâ€¦Ã¢â‚¬Å“NLER
ipcMain.handle('urunler:get-all', async () => {
  try {
    return database.query('SELECT * FROM urunler ORDER BY id DESC');
  } catch (err) {
    console.error('urunler:get-all error:', err);
    throw err;
  }
});

ipcMain.handle('urunler:add', async (event, data) => {
  try {
    const sql = 'INSERT INTO urunler (isim, kategori, tohum_markasi, tohum_marka, tohum_cesidi, tohum_cesit, tohum_notu) VALUES (?, ?, ?, ?, ?, ?, ?)';
    return database.run(sql, [
      data.isim, 
      data.kategori || '',
      data.tohum_markasi || '',
      data.tohum_markasi || data.tohum_marka || '',
      data.tohum_cesidi || '',
      data.tohum_cesidi || data.tohum_cesit || '',
      data.tohum_notu || ''
    ]);
  } catch (err) {
    console.error('urunler:add error:', err);
    throw err;
  }
});

ipcMain.handle('urunler:remove', async (event, id) => {
  try {
    return database.run('DELETE FROM urunler WHERE id = ?', [parseInt(id)]);
  } catch (err) {
    console.error('urunler:remove error:', err);
    throw err;
  }
});

// 3. EKÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â°MLER
ipcMain.handle('ekimler:get-all', async () => {
  try {
    const sql = `
      SELECT e.*, t.isim AS tarla_isim, u.isim AS urun_isim
      FROM ekimler e
      LEFT JOIN tarlalar t ON e.tarla_id = t.id
      LEFT JOIN urunler u ON e.urun_id = u.id
      ORDER BY e.tarih DESC, e.id DESC
    `;
    return database.query(sql);
  } catch (err) {
    console.error('ekimler:get-all error:', err);
    throw err;
  }
});

ipcMain.handle('ekimler:add', async (event, data) => {
  try {
    const sql = 'INSERT INTO ekimler (tarla_id, urun_id, miktar, birim, tarih, aciklama) VALUES (?, ?, ?, ?, ?, ?)';
    return database.run(sql, [
      parseInt(data.tarla_id),
      parseInt(data.urun_id),
      parseFloat(data.miktar),
      data.birim,
      data.tarih,
      data.aciklama || '',
    ]);
  } catch (err) {
    console.error('ekimler:add error:', err);
    throw err;
  }
});

ipcMain.handle('ekimler:remove', async (event, id) => {
  try {
    return database.run('DELETE FROM ekimler WHERE id = ?', [parseInt(id)]);
  } catch (err) {
    console.error('ekimler:remove error:', err);
    throw err;
  }
});

// 4. MASRAFLAR
ipcMain.handle('masraflar:get-all', async () => {
  try {
    const sql = `
      SELECT m.*, t.isim AS tarla_isim
      FROM masraflar m
      LEFT JOIN tarlalar t ON m.tarla_id = t.id
      ORDER BY m.tarih DESC, m.id DESC
    `;
    return database.query(sql);
  } catch (err) {
    console.error('masraflar:get-all error:', err);
    throw err;
  }
});

ipcMain.handle('masraflar:add', async (event, data) => {
  try {
    const miktar = parseFloat(data.miktar);
    const birim_fiyat = parseFloat(data.birim_fiyat);
    const tutar = miktar * birim_fiyat;
    const sql = 'INSERT INTO masraflar (tarla_id, kategori, urun_adi, gubre_marka, gubre_turu, gubre_cesit, miktar, birim, birim_fiyat, tutar, tarih, aciklama) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    return database.run(sql, [
      data.tarla_id ? parseInt(data.tarla_id) : null,
      data.kategori,
      data.urun_adi || '',
      data.gubre_marka || null,
      data.gubre_turu || null,
      data.gubre_cesit || null,
      miktar,
      data.birim,
      birim_fiyat,
      tutar,
      data.tarih,
      data.aciklama || '',
    ]);
  } catch (err) {
    console.error('masraflar:add error:', err);
    throw err;
  }
});

ipcMain.handle('masraflar:update', async (event, id, data) => {
  try {
    const miktar = parseFloat(data.miktar);
    const birim_fiyat = parseFloat(data.birim_fiyat);
    const tutar = miktar * birim_fiyat;
    const sql = `
      UPDATE masraflar
      SET tarla_id = ?, kategori = ?, urun_adi = ?, gubre_marka = ?, gubre_turu = ?, gubre_cesit = ?,
          miktar = ?, birim = ?, birim_fiyat = ?, tutar = ?, tarih = ?, aciklama = ?
      WHERE id = ?
    `;
    return database.run(sql, [
      data.tarla_id ? parseInt(data.tarla_id) : null,
      data.kategori,
      data.urun_adi || '',
      data.gubre_marka || null,
      data.gubre_turu || null,
      data.gubre_cesit || null,
      miktar,
      data.birim,
      birim_fiyat,
      tutar,
      data.tarih,
      data.aciklama || '',
      parseInt(id)
    ]);
  } catch (err) {
    console.error('masraflar:update error:', err);
    throw err;
  }
});

ipcMain.handle('masraflar:remove', async (event, id) => {
  try {
    return database.run('DELETE FROM masraflar WHERE id = ?', [parseInt(id)]);
  } catch (err) {
    console.error('masraflar:remove error:', err);
    throw err;
  }
});

// 5. HASATLAR
ipcMain.handle('hasatlar:get-all', async () => {
  try {
    const sql = `
      SELECT h.*, t.isim AS tarla_isim, u.isim AS urun_isim
      FROM hasatlar h
      LEFT JOIN tarlalar t ON h.tarla_id = t.id
      LEFT JOIN urunler u ON h.urun_id = u.id
      ORDER BY h.tarih DESC, h.id DESC
    `;
    return database.query(sql);
  } catch (err) {
    console.error('hasatlar:get-all error:', err);
    throw err;
  }
});

ipcMain.handle('hasatlar:add', async (event, data) => {
  try {
    const miktar = parseFloat(data.miktar);
    const birim_satis_fiyati = parseFloat(data.birim_satis_fiyati);
    const gelir = miktar * birim_satis_fiyati;
    const sql = 'INSERT INTO hasatlar (tarla_id, urun_id, miktar, birim, birim_satis_fiyati, gelir, tarih, aciklama) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    return database.run(sql, [
      parseInt(data.tarla_id),
      parseInt(data.urun_id),
      miktar,
      data.birim,
      birim_satis_fiyati,
      gelir,
      data.tarih,
      data.aciklama || '',
    ]);
  } catch (err) {
    console.error('hasatlar:add error:', err);
    throw err;
  }
});

ipcMain.handle('hasatlar:remove', async (event, id) => {
  try {
    return database.run('DELETE FROM hasatlar WHERE id = ?', [parseInt(id)]);
  } catch (err) {
    console.error('hasatlar:remove error:', err);
    throw err;
  }
});

// 6. RAPORLAR & ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Å“ZET ANALÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â°Z
ipcMain.handle('raporlar:get-summary', async () => {
  try {
    // Toplam sayÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â± ve dÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼m
    const tarlalarRes = database.query('SELECT COUNT(*) AS count, SUM(donum) AS totalDonum FROM tarlalar');
    const totalFields = tarlalarRes[0]?.count || 0;
    const totalArea = tarlalarRes[0]?.totalDonum || 0;
    // Toplam masraf
    const masraflarRes = database.query('SELECT SUM(tutar) AS total FROM masraflar');
    const totalExpenses = masraflarRes[0]?.total || 0;
    // Toplam gelir
    const hasatlarRes = database.query('SELECT SUM(gelir) AS total FROM hasatlar');
    const totalRevenue = hasatlarRes[0]?.total || 0;
    // Net Kar
    const netProfit = totalRevenue - totalExpenses;
    // Kategoriye GÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¶re Masraf DaÃƒÆ’Ã¢â‚¬ÂÃƒâ€¦Ã‚Â¸ÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â±lÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â±mÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â±
    const catExpenses = database.query('SELECT kategori, SUM(tutar) AS total FROM masraflar GROUP BY kategori');
    // AylÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â±k Masraf Trendi (Son 12 Ay)
    const monthlyExpenses = database.query(`
      SELECT strftime('%Y-%m', tarih) AS ay, SUM(tutar) AS total 
      FROM masraflar 
      GROUP BY ay 
      ORDER BY ay ASC 
      LIMIT 12
    `);
    // AylÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â±k Gelir Trendi (Son 12 Ay)
    const monthlyRevenue = database.query(`
      SELECT strftime('%Y-%m', tarih) AS ay, SUM(gelir) AS total 
      FROM hasatlar 
      GROUP BY ay 
      ORDER BY ay ASC 
      LIMIT 12
    `);
    // Son Aktiviteler
    const lastPlantings = database.query(`
      SELECT 'ekim' AS tip, e.tarih, e.miktar || ' ' || e.birim AS miktar, u.isim AS detay, t.isim AS tarla 
      FROM ekimler e 
      LEFT JOIN tarlalar t ON e.tarla_id = t.id 
      LEFT JOIN urunler u ON e.urun_id = u.id 
      ORDER BY e.tarih DESC, e.id DESC LIMIT 5
    `);
    const lastExpenses = database.query(`
      SELECT 'masraf' AS tip, m.tarih, m.tutar || ' TL' AS miktar, m.kategori || ' - ' || COALESCE(m.urun_adi, '') AS detay, COALESCE(t.isim, 'Genel') AS tarla 
      FROM masraflar m 
      LEFT JOIN tarlalar t ON m.tarla_id = t.id 
      ORDER BY m.tarih DESC, m.id DESC LIMIT 5
    `);
    const lastHarvests = database.query(`
      SELECT 'hasat' AS tip, h.tarih, h.gelir || ' TL' AS miktar, u.isim AS detay, t.isim AS tarla 
      FROM hasatlar h 
      LEFT JOIN tarlalar t ON h.tarla_id = t.id 
      LEFT JOIN urunler u ON h.urun_id = u.id 
      ORDER BY h.tarih DESC, h.id DESC LIMIT 5
    `);
    const recentActivities = [...lastPlantings, ...lastExpenses, ...lastHarvests]
      .sort((a, b) => new Date(b.tarih) - new Date(a.tarih))
      .slice(0, 8);
    // Tarla PerformanslarÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â±
    const tarlaExpenses = database.query('SELECT tarla_id, SUM(tutar) AS total FROM masraflar GROUP BY tarla_id');
    const tarlaRevenue = database.query('SELECT tarla_id, SUM(gelir) AS total FROM hasatlar GROUP BY tarla_id');
    const allTarlalar = database.query('SELECT id, isim, donum FROM tarlalar');
    const expensesMap = {};
    tarlaExpenses.forEach(x => { if (x.tarla_id) expensesMap[x.tarla_id] = x.total; });
    const revenueMap = {};
    tarlaRevenue.forEach(x => { if (x.tarla_id) revenueMap[x.tarla_id] = x.total; });
    const fieldPerformances = allTarlalar.map(t => {
      const expenses = expensesMap[t.id] || 0;
      const revenue = revenueMap[t.id] || 0;
      const profit = revenue - expenses;
      const profitPerDonum = t.donum > 0 ? profit / t.donum : 0;
      return { id: t.id, isim: t.isim, donum: t.donum, expenses, revenue, profit, profitPerDonum };
    }).sort((a, b) => b.profit - a.profit);
    return {
      totalFields,
      totalArea,
      totalExpenses,
      totalRevenue,
      netProfit,
      catExpenses,
      monthlyExpenses,
      monthlyRevenue,
      recentActivities,
      fieldPerformances,
    };
  } catch (err) {
    console.error('raporlar:get-summary error:', err);
    throw err;
  }
});

// 7. YEDEKLER & DOSYA ÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â°ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚ÂLEMLERÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â°
ipcMain.handle('backup:export', async () => {
  if (!mainWindow) return { success: false, error: 'Pencere bulunamadÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â±' };
  const { filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'ÃƒÆ’Ã¢â‚¬Â¡etele',
    defaultPath: path.join(app.getPath('downloads'), `tarla-masraf-manuel-${new Date().toISOString().split('T')[0]}.db`),
    filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
  });
  if (!filePath) return { success: false, cancelled: true };
  try {
    database.exportBackup(filePath);
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('backup:import', async () => {
  if (!mainWindow) return { success: false, error: 'Pencere bulunamadÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â±' };
  const { filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'ÃƒÆ’Ã¢â‚¬Â¡etele',
    filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
    properties: ['openFile'],
  });
  if (!filePaths || filePaths.length === 0) return { success: false, cancelled: true };
  const selectedFile = filePaths[0];
  try {
    await database.importBackup(selectedFile);
    dialog.showMessageBoxSync(mainWindow, { type: 'info', title: 'ÃƒÆ’Ã¢â‚¬Â¡etele', message: 'VeritabanÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â± yedeÃƒÆ’Ã¢â‚¬ÂÃƒâ€¦Ã‚Â¸i baÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€¦Ã‚Â¸arÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â±yla geri yÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼klendi! Veriler yenilenecektir.' });
    mainWindow.reload();
    return { success: true };
  } catch (err) {
    dialog.showErrorBox('YÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼kleme HatasÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â±', `Yedek yÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼klenirken hata oluÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€¦Ã‚Â¸tu:\n${err.message}`);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('backup:get-list', async () => {
  try {
    return database.getBackupsList();
  } catch (err) {
    console.error('backup:get-list error:', err);
    throw err;
  }
});

ipcMain.handle('backup:create-manual', async () => {
  try {
    return database.createManualBackup();
  } catch (err) {
    console.error('backup:create-manual error:', err);
    throw err;
  }
});

ipcMain.handle('backup:restore-from-path', async (event, filePath) => {
  if (!mainWindow) return { success: false, error: 'Pencere bulunamadÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â±' };
  try {
    await database.importBackup(filePath);
    mainWindow.reload();
    return { success: true };
  } catch (err) {
    dialog.showErrorBox('Geri YÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼kleme HatasÃƒÆ’Ã¢â‚¬ÂÃƒâ€šÃ‚Â±', `SeÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â§ilen yedek yÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¼klenirken hata oluÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€¦Ã‚Â¸tu:\n${err.message}`);
    return { success: false, error: err.message };
  }
});

ipcMain.handle('check-updates', async () => {
  return checkForUpdates('manual');
});

ipcMain.handle('updates:get-state', async () => {
  return {
    currentVersion: `v${app.getVersion()}`,
    lastCheck: lastUpdateCheckAt,
    status: updateStatus,
  };
});

