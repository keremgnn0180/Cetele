const { BrowserWindow } = require("electron");
const path = require("path");

class WindowManager {
  constructor({ isDev, rootDir, securityManager, logger }) {
    this.isDev = isDev;
    this.rootDir = rootDir;
    this.securityManager = securityManager;
    this.logger = logger;
    this.mainWindow = null;
  }

  createMainWindow() {
    console.log("Creating BrowserWindow...");
    console.log("Preload:", path.join(this.rootDir, "preload.js"));

    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 1000,
      minHeight: 700,
      title: "Cetele",
      show: false,
      icon: path.join(this.rootDir, "assets", "icon.ico"),
      webPreferences: {
        preload: path.join(this.rootDir, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
      },
    });

    this.securityManager.attach(this.mainWindow);
    this.attachFailureHandlers();
    this.loadApp();

    this.mainWindow.once("ready-to-show", () => {
      this.mainWindow.show();
    });

    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
    });

    return this.mainWindow;
  }

  attachFailureHandlers() {
    this.mainWindow.webContents.on(
      "did-fail-load",
      (_event, errorCode, errorDescription) => {
        console.error("LOAD ERROR:", errorCode, errorDescription);

        if (!this.isDev) {
          this.loadRecovery();
        }
      }
    );

    this.mainWindow.webContents.on(
      "render-process-gone",
      (_event, details) => {
        console.error("Renderer process gone:", details);

        if (!this.isDev) {
          this.loadRecovery();
        }
      }
    );

    this.mainWindow.webContents.on(
      "did-finish-load",
      () => {
        console.log("Renderer loaded successfully.");
      }
    );
  }

  loadApp() {
    if (this.isDev) {
      console.log("Loading:", "http://localhost:5173");

      this.mainWindow
        .loadURL("http://localhost:5173")
        .catch((err) => console.error("loadURL failed:", err));

      this.mainWindow.webContents.openDevTools();

      return;
    }

    const file = path.join(this.rootDir, "dist", "index.html");
    console.log("Loading:", file);

    this.mainWindow.loadFile(file);
  }

  loadRecovery() {
    if (!this.mainWindow || this.mainWindow.isDestroyed()) {
      return;
    }

    this.mainWindow.loadFile(
      path.join(this.rootDir, "dist", "recovery.html")
    );
  }

  getMainWindow() {
    return this.mainWindow;
  }
}

module.exports = WindowManager;