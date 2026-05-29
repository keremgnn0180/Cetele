class IPCRegistry {
  constructor({ ipcMain, logger }) {
    this.ipcMain = ipcMain;
    this.logger = logger;
  }

  handle(channel, handler) {
    this.ipcMain.handle(channel, async (event, ...args) => {
      try {
        const data = await handler(event, ...args);
        return { ok: true, data };
      } catch (error) {
        this.logger.error(`IPC failed [${channel}]`, error);
        return {
          ok: false,
          error: this.toPublicError(error)
        };
      }
    });
  }

  toPublicError(error) {
    if (error?.issues?.length) {
      return 'Geçersiz veri gönderildi.';
    }
    return error?.message || 'İşlem başarısız oldu.';
  }
}

module.exports = IPCRegistry;
