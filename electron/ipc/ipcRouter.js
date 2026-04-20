const ClientRepository = require('../repositories/clientRepository');
const ProductRepository = require('../repositories/productRepository');
const InvoiceRepository = require('../repositories/invoiceRepository');
const SettingsRepository = require('../repositories/settingsRepository');
const AuditRepository = require('../repositories/auditRepository');

const ClientService = require('../services/clientService');
const ProductService = require('../services/productService');
const InvoiceService = require('../services/invoiceService');
const SettingsService = require('../services/settingsService');
const LicenseService = require('../services/licenseService');
const AuditService = require('../services/auditService');
const BackupService = require('../services/backupService');

const ClientController = require('../controllers/clientController');
const ProductController = require('../controllers/productController');
const InvoiceController = require('../controllers/invoiceController');
const SettingsController = require('../controllers/settingsController');
const LicenseController = require('../controllers/licenseController');
const BackupController = require('../controllers/backupController');
const AuditController = require('../controllers/auditController');

const logger = require('../utils/logger');
const { app, BrowserWindow, ipcMain, shell } = require('electron');

/**
 * IPC Router - Single registration hub for all IPC channels
 * Uses explicit constructor injection (no service locator pattern)
 * All IPC channels use ipcMain.handle (request/response pattern)
 */

function registerAllIpcHandlers(ipcMain) {
  // Instantiate repositories
  const clientRepository = new ClientRepository();
  const productRepository = new ProductRepository();
  const invoiceRepository = new InvoiceRepository();
  const settingsRepository = new SettingsRepository();
  const auditRepository = new AuditRepository();

  // Instantiate services with repository injection
  const auditService = new AuditService(auditRepository);
  const clientService = new ClientService(clientRepository, auditService);
  const productService = new ProductService(productRepository, auditService);
  const invoiceService = new InvoiceService(invoiceRepository, auditService);
  const settingsService = new SettingsService(settingsRepository, auditService);
  const licenseService = new LicenseService();
  const backupService = new BackupService();

  // Instantiate controllers with service injection
  const clientController = new ClientController(clientService);
  const productController = new ProductController(productService);
  const invoiceController = new InvoiceController(invoiceService);
  const settingsController = new SettingsController(settingsService);
  const licenseController = new LicenseController(licenseService);
  const backupController = new BackupController(backupService);
  const auditController = new AuditController(auditService);

  // Register Client channels
  ipcMain.handle('client:getAll', (event) => clientController.getAll(event));
  ipcMain.handle('client:getById', (event, id) => clientController.getById(event, id));
  ipcMain.handle('client:create', (event, data) => clientController.create(event, data));
  ipcMain.handle('client:update', (event, id, data) => clientController.update(event, id, data));
  ipcMain.handle('client:delete', (event, id) => clientController.delete(event, id));
  ipcMain.handle('client:search', (event, query) => clientController.search(event, query));

  // Register Product channels
  ipcMain.handle('product:getAll', (event) => productController.getAll(event));
  ipcMain.handle('product:getById', (event, id) => productController.getById(event, id));
  ipcMain.handle('product:create', (event, data) => productController.create(event, data));
  ipcMain.handle('product:update', (event, id, data) => productController.update(event, id, data));
  ipcMain.handle('product:delete', (event, id) => productController.delete(event, id));
  ipcMain.handle('product:search', (event, query) => productController.search(event, query));
  ipcMain.handle('product:getLowStock', (event, threshold) => productController.getLowStock(event, threshold));

  // Register Invoice channels
  ipcMain.handle('invoice:getAll', (event) => invoiceController.getAll(event));
  ipcMain.handle('invoice:getById', (event, id) => invoiceController.getById(event, id));
  ipcMain.handle('invoice:create', (event, data) => invoiceController.create(event, data));
  ipcMain.handle('invoice:update', (event, id, data) => invoiceController.update(event, id, data));
  ipcMain.handle('invoice:delete', (event, id) => invoiceController.delete(event, id));
  ipcMain.handle('invoice:updateStatus', (event, id, status) => invoiceController.updateStatus(event, id, status));
  ipcMain.handle('invoice:getUnpaid', (event) => invoiceController.getUnpaid(event));

  // Register Settings channels
  ipcMain.handle('settings:get', (event) => settingsController.get(event));
  ipcMain.handle('settings:update', (event, data) => settingsController.update(event, data));

  // Register License channels
  ipcMain.handle('license:activate', (event, data) => licenseController.activate(event, data));
  ipcMain.handle('license:checkStatus', (event) => licenseController.checkStatus(event));
  ipcMain.handle('license:getDetails', (event) => licenseController.getDetails(event));
  ipcMain.handle('license:getMachineId', (event) => licenseController.getMachineId(event));
  
  // NEW: explicit channel for trial/full status (used by trial banner)
  ipcMain.handle('license:getLicenseType', async () => {
    const details = licenseService.getLicenseDetails();
    return {
      success: true,
      data: {
        licenseType:           details?.licenseType        ?? null,
        isTrial:               details?.isTrial            ?? false,
        daysLeft:              details?.daysLeft           ?? 0,
        isExpired:             details?.isExpired          ?? true,
        isExpiringSoon:        details?.isExpiringSoon     ?? false,
        isExpiringSoonCritical: details?.isExpiringSoonCritical ?? false,
      },
    };
  });

  // Register Backup channels
  ipcMain.handle('backup:create', (event) => backupController.create(event));
  ipcMain.handle('backup:getAll', (event) => backupController.getAll(event));
  ipcMain.handle('backup:delete', (event, filename) => backupController.delete(event, filename));
  ipcMain.handle('backup:restore', (event, filename) => backupController.restore(event, filename));
  ipcMain.handle('backup:getStats', (event) => backupController.getStats(event));
  ipcMain.handle('backup:prune', (event) => backupController.prune(event));

  // Register Audit channels
  ipcMain.handle('audit:getRecent', (event, limit) => auditController.getRecent(event, limit));
  ipcMain.handle('audit:getByEntity', (event, entity, entityId) => auditController.getByEntity(event, entity, entityId));
  ipcMain.handle('audit:getByDateRange', (event, startDate, endDate) => auditController.getByDateRange(event, startDate, endDate));

  // Register App channels
  ipcMain.handle('app:getLogPath', () => {
    const path = require('path');
    return { success: true, data: { logPath: path.join(app.getPath('userData'), 'logs') } };
  });

  ipcMain.handle('app:openInExplorer', (event, filePath) => {
    try {
      shell.openPath(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: { code: 'OPEN_FAILED', message: error.message } };
    }
  });

  logger.info('All IPC handlers registered successfully');
}

module.exports = { registerAllIpcHandlers };
