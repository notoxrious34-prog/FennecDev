const { app, BrowserWindow, ipcMain, session } = require('electron');
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

// FIX: Apply strict CSP to session BEFORE window creation
function applySessionCSP(targetSession) {
  targetSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          [
            "default-src 'self'",
            "script-src 'self'",
            "style-src 'self' 'unsafe-inline'",
            "font-src 'self'",
            "img-src 'self' data:",
            "connect-src 'self'",
            "media-src 'none'",
            "object-src 'none'",
            "frame-src 'none'",
            "worker-src 'self'",
            "base-uri 'self'",
            "form-action 'self'",
            "upgrade-insecure-requests",
          ].join('; ')
        ]
      }
    })
  })
}

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
      devTools: true, // Always enable for debugging
      webSecurity: true
    }
  });

  // FIX: Timeout fallback for ready-to-show
  let isShown = false;
  win.once('ready-to-show', () => {
    isShown = true;
    win.show();
    console.log('[license] ready-to-show fired');
  });

  setTimeout(() => {
    if (!isShown) {
      console.warn('[license] ready-to-show timeout — forcing show');
      win.show();
      win.webContents.openDevTools();
    }
  }, 5000);

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

  // FIX: Use app.getAppPath() for correct path in production
  const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
  console.log('[license] Loading:', indexPath);

  win.loadFile(indexPath).catch(err => {
    console.error('[license] loadFile failed:', err);
    // Fallback to resourcesPath
    const fallbackPath = path.join(process.resourcesPath, 'app', 'dist', 'index.html');
    console.log('[license] Trying fallback:', fallbackPath);
    win.loadFile(fallbackPath).catch(err2 => {
      console.error('[license] Fallback also failed:', err2);
    });
  });

  // FIX: Add load failure logging
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[license] did-fail-load:', { errorCode, errorDescription });
  });

  win.webContents.on('dom-ready', () => {
    console.log('[license] dom-ready');
  });

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
      devTools: true, // Always enable for debugging
      webSecurity: true
    }
  });

  win.maximize();

  // FIX: Timeout fallback for ready-to-show
  let isShown = false;
  win.once('ready-to-show', () => {
    isShown = true;
    win.show();
    console.log('[main] ready-to-show fired');
  });

  setTimeout(() => {
    if (!isShown) {
      console.warn('[main] ready-to-show timeout — forcing show');
      win.show();
      win.webContents.openDevTools();
    }
  }, 5000);

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

  // FIX: Use app.getAppPath() for correct path in production
  const indexPath = path.join(app.getAppPath(), 'dist', 'index.html');
  console.log('[main] Loading:', indexPath);

  win.loadFile(indexPath).catch(err => {
    console.error('[main] loadFile failed:', err);
    // Fallback to resourcesPath
    const fallbackPath = path.join(process.resourcesPath, 'app', 'dist', 'index.html');
    console.log('[main] Trying fallback:', fallbackPath);
    win.loadFile(fallbackPath).catch(err2 => {
      console.error('[main] Fallback also failed:', err2);
    });
  });

  // FIX: Add load failure logging
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[main] did-fail-load:', { errorCode, errorDescription });
  });

  win.webContents.on('dom-ready', () => {
    console.log('[main] dom-ready');
  });

  return win;
}

app.whenReady().then(async () => {
  // FIX: Apply CSP to session BEFORE window creation
  applySessionCSP(session.defaultSession);

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