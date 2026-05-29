const { shell } = require('electron');

class SecurityManager {
  constructor({ isDev, logger }) {
    this.isDev = isDev;
    this.logger = logger;
    this.allowedExternalHosts = new Set(['github.com']);
  }

  attach(window) {
    this.applyHeaders(window);
    this.lockNavigation(window);
    this.lockWindowOpen(window);
    this.lockPermissions(window);
  }

  applyHeaders(window) {
    const csp = this.isDev
      ? "default-src 'self' http://localhost:5173; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;"
      : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:;";

    window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': [csp],
          'X-Content-Type-Options': ['nosniff']
        }
      });
    });
  }

  lockNavigation(window) {
    window.webContents.on('will-navigate', (event, url) => {
      const allowedDevUrl = this.isDev && url.startsWith('http://localhost:5173');
      const allowedFileUrl = !this.isDev && url.startsWith('file://');
      if (!allowedDevUrl && !allowedFileUrl) event.preventDefault();
    });
  }

  lockWindowOpen(window) {
    window.webContents.setWindowOpenHandler(({ url }) => {
      try {
        const parsed = new URL(url);
        if (parsed.protocol === 'https:' && this.allowedExternalHosts.has(parsed.hostname)) {
          shell.openExternal(url);
        }
      } catch (err) {
        this.logger.warn('Blocked invalid external URL:', url);
      }
      return { action: 'deny' };
    });
  }

  lockPermissions(window) {
    window.webContents.session.setPermissionRequestHandler((_webContents, _permission, callback) => {
      callback(false);
    });
  }
}

module.exports = SecurityManager;
