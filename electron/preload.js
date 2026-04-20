const { contextBridge, ipcRenderer } = require('electron');

/**
 * Preload script - Secure contextBridge exposure
 * Exposes window.api object with all IPC methods
 * Never expose ipcRenderer directly
 */

contextBridge.exposeInMainWorld('api', {
  // Client operations
  client: {
    getAll: () => ipcRenderer.invoke('client:getAll'),
    getById: (id) => ipcRenderer.invoke('client:getById', id),
    create: (data) => ipcRenderer.invoke('client:create', data),
    update: (id, data) => ipcRenderer.invoke('client:update', id, data),
    delete: (id) => ipcRenderer.invoke('client:delete', id),
    search: (query) => ipcRenderer.invoke('client:search', query)
  },

  // Product operations
  product: {
    getAll: () => ipcRenderer.invoke('product:getAll'),
    getById: (id) => ipcRenderer.invoke('product:getById', id),
    create: (data) => ipcRenderer.invoke('product:create', data),
    update: (id, data) => ipcRenderer.invoke('product:update', id, data),
    delete: (id) => ipcRenderer.invoke('product:delete', id),
    search: (query) => ipcRenderer.invoke('product:search', query),
    getLowStock: (threshold) => ipcRenderer.invoke('product:getLowStock', threshold)
  },

  // Invoice operations
  invoice: {
    getAll: () => ipcRenderer.invoke('invoice:getAll'),
    getById: (id) => ipcRenderer.invoke('invoice:getById', id),
    create: (data) => ipcRenderer.invoke('invoice:create', data),
    update: (id, data) => ipcRenderer.invoke('invoice:update', id, data),
    delete: (id) => ipcRenderer.invoke('invoice:delete', id),
    updateStatus: (id, status) => ipcRenderer.invoke('invoice:updateStatus', id, status),
    getUnpaid: () => ipcRenderer.invoke('invoice:getUnpaid')
  },

  // Settings operations
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (data) => ipcRenderer.invoke('settings:update', data)
  },

  // License operations
  license: {
    activate: (licenseToken) => ipcRenderer.invoke('license:activate', { licenseToken }),
    checkStatus: () => ipcRenderer.invoke('license:checkStatus'),
    getDetails: () => ipcRenderer.invoke('license:getDetails'),
    getMachineId: () => ipcRenderer.invoke('license:getMachineId'),
    getLicenseType: () => ipcRenderer.invoke('license:getLicenseType')
  },

  // Backup operations
  backup: {
    create: () => ipcRenderer.invoke('backup:create'),
    getAll: () => ipcRenderer.invoke('backup:getAll'),
    delete: (filename) => ipcRenderer.invoke('backup:delete', filename),
    restore: (filename) => ipcRenderer.invoke('backup:restore', filename),
    getStats: () => ipcRenderer.invoke('backup:getStats'),
    prune: () => ipcRenderer.invoke('backup:prune')
  },

  // Audit operations
  audit: {
    getRecent: (limit) => ipcRenderer.invoke('audit:getRecent', limit),
    getByEntity: (entity, entityId) => ipcRenderer.invoke('audit:getByEntity', entity, entityId),
    getByDateRange: (startDate, endDate) => ipcRenderer.invoke('audit:getByDateRange', startDate, endDate)
  },

  // App operations
  app: {
    getLogPath: () => ipcRenderer.invoke('app:getLogPath'),
    openInExplorer: (path) => ipcRenderer.invoke('app:openInExplorer', path)
  }
});
