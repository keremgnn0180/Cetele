const log = require('electron-log');

class LoggerService {
  constructor() {
    log.transports.file.level = 'info';
    log.transports.file.maxSize = 1024 * 1024;
  }

  debug(...args) {
    log.debug(...args);
  }

  info(...args) {
    log.info(...args);
  }

  warn(...args) {
    log.warn(...args);
  }

  error(...args) {
    log.error(...args);
  }

  child(scope) {
    return {
      debug: (...args) => this.debug(`[${scope}]`, ...args),
      info: (...args) => this.info(`[${scope}]`, ...args),
      warn: (...args) => this.warn(`[${scope}]`, ...args),
      error: (...args) => this.error(`[${scope}]`, ...args)
    };
  }
}

module.exports = LoggerService;
