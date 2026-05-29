const { BrowserWindow } = require('electron');
const path = require('path');

class WindowManager {
  constructor({ isDev, rootDir, securityManager, logger }) {
    this.isDev = isDev;
    this.rootDir = rootDir;
    this.securityManager = securityManager;
    this.logger = logger;
    this.mainWindow = null;
  }

  createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 1000,
      minHeight: 700,
      title: 'Cetele',
      show: false,
      icon: path.join(this.rootDir, 'assets', 'icon.ico'),
      webPreferences: {
        preload: path.join(this.rootDir, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false
      }
    });

    this.securityManager.attach(this.mainWindow);
    this.attachFailureHandlers();
    this.loadApp();

    this.mainWindow.once('ready-to-show', () => this.mainWindow.show());
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    return this.mainWindow;
  }

  attachFailureHandlers() {
    this.mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      this.logger.error('LOAD ERROR:', errorCode, errorDescription);
      this.loadRecovery();
    });

    this.mainWindow.webContents.on('render-process-gone', (_event, details) => {
      this.logger.error('Renderer process gone:', details);
      this.loadRecovery();
    });
  }

  loadApp() {
    if (this.isDev) {
      this.mainWindow.loadURL('http://localhost:5173');
      this.mainWindow.webContents.openDevTools();
      return;
    }

    this.mainWindow.loadFile(path.join(this.rootDir, 'dist', 'index.html'));
  }

  loadRecovery() {
    if (!this.isDev && this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.loadFile(path.join(this.rootDir, 'dist', 'recovery.html'));
    }
  }

  getMainWindow() {
    return this.mainWindow;
  }
}

module.exports = WindowManager;
