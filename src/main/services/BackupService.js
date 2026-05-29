const { app, dialog } = require('electron');
const path = require('path');

class BackupService {
  constructor({ database, getMainWindow }) {
    this.database = database;
    this.getMainWindow = getMainWindow;
  }

  async export() {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) throw new Error('Pencere bulunamadı');

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Çetele',
      defaultPath: path.join(app.getPath('downloads'), `tarla-masraf-manuel-${new Date().toISOString().split('T')[0]}.db`),
      filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }]
    });

    if (!filePath) return { cancelled: true };
    this.database.exportBackup(filePath);
    return { filePath };
  }

  async import() {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) throw new Error('Pencere bulunamadı');

    const { filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'Çetele',
      filters: [{ name: 'SQLite Database', extensions: ['db', 'sqlite'] }],
      properties: ['openFile']
    });

    if (!filePaths || filePaths.length === 0) return { cancelled: true };
    await this.database.importBackup(filePaths[0]);
    mainWindow.reload();
    return { restored: true };
  }

  async restoreFromPath(filePath) {
    const mainWindow = this.getMainWindow();
    if (!mainWindow) throw new Error('Pencere bulunamadı');
    await this.database.importBackup(filePath);
    mainWindow.reload();
    return { restored: true };
  }

  getBackups() {
    return this.database.getBackupsList();
  }

  createManual() {
    return this.database.createManualBackup();
  }
}

module.exports = BackupService;
