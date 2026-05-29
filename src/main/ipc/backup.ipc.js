function registerBackupIpc(registry, { backupService, schemas }) {
  registry.handle('backup:export', () => backupService.export());
  registry.handle('backup:import', () => backupService.import());
  registry.handle('backup:get-list', () => backupService.getBackups());
  registry.handle('backup:create-manual', () => backupService.createManual());
  registry.handle('backup:restore-from-path', (_event, filePath) => {
    return backupService.restoreFromPath(schemas.safePathSchema.parse(filePath));
  });
}

module.exports = registerBackupIpc;
