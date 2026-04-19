const ClientService = require('../services/clientService');

/**
 * ClientController - IPC handlers for client operations
 * Thin orchestrator layer - no business logic
 */
class ClientController {
  constructor(clientService) {
    this.clientService = clientService;
  }

  async getAll(event) {
    return await this.clientService.getAllClients();
  }

  async getById(event, id) {
    if (!id || typeof id !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Valid client ID required' } };
    }
    return await this.clientService.getClientById(id);
  }

  async create(event, data) {
    if (!data || !data.name || !data.phone || !data.address) {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Name, phone, and address are required' } };
    }
    return await this.clientService.createClient(data);
  }

  async update(event, id, data) {
    if (!id || typeof id !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Valid client ID required' } };
    }
    if (!data) {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Data is required' } };
    }
    return await this.clientService.updateClient(id, data);
  }

  async delete(event, id) {
    if (!id || typeof id !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Valid client ID required' } };
    }
    return await this.clientService.deleteClient(id);
  }

  async search(event, query) {
    if (!query || typeof query !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Search query is required' } };
    }
    return await this.clientService.searchClients(query);
  }
}

module.exports = ClientController;
