const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { registerAllIpcHandlers } = require('./electron/ipc/ipcRouter');
const LicenseService = require('./electron/services/licenseService');
const BackupService = require('./electron/services/backupService');
const logger = require('./electron/utils/logger');

// Single instance lock - prevent multiple ERP instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

const licenseService = new LicenseService();
const backupService = new BackupService();

function createLicenseWindow() {
  const win = new BrowserWindow({
    width: 500,
    height: 600,
    minWidth: 500,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron', 'preload.js'),
      devTools: !app.isPackaged,
      webSecurity: true
    }
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.setMenu(null);

  // Restrict navigation to prevent opening external URLs
  win.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.protocol !== 'file:') {
      event.preventDefault();
    }
  });

  win.webContents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });

  const indexPath = path.join(__dirname, 'dist', 'index.html');
  win.loadFile(indexPath);

  return win;
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron', 'preload.js'),
      devTools: !app.isPackaged,
      webSecurity: true
    }
  });

  win.maximize();
  win.once('ready-to-show', () => {
    win.show();
  });

  win.setMenu(null);

  // Restrict navigation to prevent opening external URLs
  win.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.protocol !== 'file:') {
      event.preventDefault();
    }
  });

  win.webContents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
  });

  const indexPath = path.join(__dirname, 'dist', 'index.html');
  win.loadFile(indexPath);

  return win;
}

app.whenReady().then(async () => {
  logger.init();  // Must be first — initializes log file path
  logger.info('Application starting', { version: app.getVersion(), isPackaged: app.isPackaged });

  registerAllIpcHandlers(ipcMain);

  // Start automated daily backups
  backupService.startScheduledBackups();

  // Boot guard - check license before showing main window
  const licenseCheck = await licenseService.isLicenseValid();
  
  if (licenseCheck.valid) {
    createMainWindow();
  } else {
    createLicenseWindow();
  }
});

app.on('window-all-closed', () => {
  backupService.stopScheduledBackups();
  if (process.platform !== 'darwin') app.quit();
});