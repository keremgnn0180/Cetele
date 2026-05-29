const IPCRegistry = require('./IPCRegistry.js');
const schemas = require('./schemas.js');
const registerFieldIpc = require('./fields.ipc.js');
const registerProductIpc = require('./products.ipc.js');
const registerPlantingIpc = require('./plantings.ipc.js');
const registerExpenseIpc = require('./expenses.ipc.js');
const registerHarvestIpc = require('./harvests.ipc.js');
const registerReportIpc = require('./reports.ipc.js');
const registerBackupIpc = require('./backup.ipc.js');
const registerSystemIpc = require('./system.ipc.js');

function registerIpcHandlers({ ipcMain, logger, database, backupService, healthCheckService, updateService }) {
  const registry = new IPCRegistry({ ipcMain, logger });
  const deps = { database, backupService, healthCheckService, updateService, schemas };

  registerFieldIpc(registry, deps);
  registerProductIpc(registry, deps);
  registerPlantingIpc(registry, deps);
  registerExpenseIpc(registry, deps);
  registerHarvestIpc(registry, deps);
  registerReportIpc(registry, deps);
  registerBackupIpc(registry, deps);
  registerSystemIpc(registry, deps);
}

module.exports = registerIpcHandlers;
