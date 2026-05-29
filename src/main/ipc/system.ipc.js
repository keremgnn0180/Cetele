function registerSystemIpc(registry, { healthCheckService, updateService }) {
  registry.handle('health:check', () => healthCheckService.run());
  registry.handle('check-updates', () => updateService.check('manual'));
  registry.handle('updates:get-state', () => updateService.getState());
}

module.exports = registerSystemIpc;
