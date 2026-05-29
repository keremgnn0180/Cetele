const { app, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const database = require('./database.js');
const LoggerService = require('./src/main/services/LoggerService.js');
const WindowManager = require('./src/main/window/WindowManager.js');
const SecurityManager = require('./src/main/security/SecurityManager.js');
const BackupService = require('./src/main/services/BackupService.js');
const HealthCheckService = require('./src/main/services/HealthCheckService.js');
const UpdateService = require('./src/main/updater/UpdateService.js');
const registerIpcHandlers = require('./src/main/ipc/index.js');

app.setName('Cetele');
app.setPath('userData', path.join(app.getPath('appData'), 'Çetele'));
app.setAppUserModelId('com.cetele.app');

const isE2E = process.env.CETELE_E2E === '1';
const isDev = !isE2E && (process.env.NODE_ENV === 'development' || !app.isPackaged);
const loggerService = new LoggerService();
const logger = loggerService.child('main');

let windowManager;
let updateService;

function recoverLegacyProfile(appDataPath) {
  if (isDev) return;

  const currentDbPath = path.join(appDataPath, 'cetele.db');
  const legacyCandidates = ['Cetele', '?etele', 'Çetele']
    .map((name) => path.join(app.getPath('appData'), name))
    .filter((p, i, arr) => arr.indexOf(p) === i);

  fs.mkdirSync(appDataPath, { recursive: true });
  const hasCurrentDb = fs.existsSync(currentDbPath);
  const currentDbSize = hasCurrentDb ? fs.statSync(currentDbPath).size : 0;

  for (const legacyPath of legacyCandidates) {
    if (legacyPath === appDataPath) continue;

    const legacyDbPath = path.join(legacyPath, 'cetele.db');
    if (fs.existsSync(legacyDbPath)) {
      const legacyDbSize = fs.statSync(legacyDbPath).size;
      const shouldRecoverDb = !hasCurrentDb || (currentDbSize < 32768 && legacyDbSize > currentDbSize);
      if (shouldRecoverDb) fs.copyFileSync(legacyDbPath, currentDbPath);
    }

    const legacyBackups = path.join(legacyPath, 'backups');
    const currentBackups = path.join(appDataPath, 'backups');
    if (fs.existsSync(legacyBackups) && !fs.existsSync(currentBackups)) {
      fs.cpSync(legacyBackups, currentBackups, { recursive: true });
    }
  }
}

async function bootstrap() {
  const appDataPath = isDev ? __dirname : app.getPath('userData');

  try {
    recoverLegacyProfile(appDataPath);
    await database.initDatabase(appDataPath);
    await database.integrityCheck();
    logger.info('SQLite initialized');
  } catch (error) {
    logger.error('Database startup failed:', error);
  }

  const securityManager = new SecurityManager({ isDev, logger: loggerService.child('security') });
  windowManager = new WindowManager({
    isDev,
    rootDir: __dirname,
    securityManager,
    logger: loggerService.child('window')
  });

  updateService = new UpdateService({
    getMainWindow: () => windowManager.getMainWindow(),
    logger: loggerService.child('updater')
  });

  const backupService = new BackupService({
    database,
    getMainWindow: () => windowManager.getMainWindow()
  });

  const healthCheckService = new HealthCheckService({
    database,
    updateStateProvider: () => updateService.getState()
  });

  registerIpcHandlers({
    ipcMain,
    logger: loggerService.child('ipc'),
    database,
    backupService,
    healthCheckService,
    updateService
  });

  windowManager.createMainWindow();
  updateService.setup();
  await updateService.check('startup').catch((error) => logger.warn('Startup update check skipped:', error.message));
}

app.whenReady().then(async () => {
  await bootstrap();

  app.on('activate', () => {
    if (!windowManager?.getMainWindow()) windowManager.createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  database.closeDatabase();
});
