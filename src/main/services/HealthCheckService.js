class HealthCheckService {
  constructor({ database, updateStateProvider }) {
    this.database = database;
    this.updateStateProvider = updateStateProvider;
  }

  async run() {
    const checks = {
      Database: await this.safeCheck(() => this.database.healthCheck()),
      Migration: await this.safeCheck(() => this.database.migrationHealthCheck()),
      Backup: await this.safeCheck(() => this.database.backupHealthCheck()),
      IPC: { ok: true },
      UpdateService: await this.safeCheck(async () => {
        const state = this.updateStateProvider ? this.updateStateProvider() : {};
        return { ok: true, message: state.status || 'Hazır' };
      })
    };

    return {
      ok: Object.values(checks).every((item) => item.ok),
      checkedAt: new Date().toISOString(),
      checks
    };
  }

  async safeCheck(fn) {
    try {
      const result = await fn();
      return typeof result === 'object' ? { ok: true, ...result } : { ok: true };
    } catch (error) {
      return { ok: false, message: error?.message || 'Bilinmeyen hata' };
    }
  }
}

module.exports = HealthCheckService;
