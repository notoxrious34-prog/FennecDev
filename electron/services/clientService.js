const ClientRepository = require('../repositories/clientRepository');
const logger = require('../utils/logger');
const { validate } = require('../validation/validate');
const { ClientSchema, ClientUpdateSchema } = require('../validation/schemas');
const AuditService = require('./auditService');

/**
 * ClientService - Business logic for client operations
 * All methods return standardized response envelopes
 */
class ClientService {
  constructor(clientRepository, auditService) {
    this.clientRepository = clientRepository;
    this.auditService = auditService || new AuditService(new (require('../repositories/auditRepository'))());
  }

  /**
   * Get all clients
   */
  async getAllClients() {
    try {
      const clients = this.clientRepository.findAll();
      return { success: true, data: clients };
    } catch (error) {
      logger.error('clientService.getAllClients failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Get client by ID
   */
  async getClientById(id) {
    try {
      const client = this.clientRepository.findById(id);
      if (!client) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } };
      }
      return { success: true, data: client };
    } catch (error) {
      logger.error('clientService.getClientById failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Create a new client
   */
  async createClient(data) {
    const validation = validate(ClientSchema, data);
    if (!validation.success) return validation;

    try {
      const id = data.id || require('crypto').randomUUID();
      const client = this.clientRepository.create({ ...validation.data, id });
      this.auditService.logCreate('client', id, client);
      return { success: true, data: client };
    } catch (error) {
      logger.error('clientService.createClient failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Update a client
   */
  async updateClient(id, data) {
    const validation = validate(ClientUpdateSchema, data);
    if (!validation.success) return validation;

    try {
      const existing = this.clientRepository.findById(id);
      if (!existing) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } };
      }
      const client = this.clientRepository.update(id, validation.data);
      this.auditService.logUpdate('client', id, existing, client);
      return { success: true, data: client };
    } catch (error) {
      logger.error('clientService.updateClient failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Delete a client
   */
  async deleteClient(id) {
    try {
      const existing = this.clientRepository.findById(id);
      if (!existing) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Client not found' } };
      }
      this.clientRepository.delete(id);
      this.auditService.logDelete('client', id, existing);
      return { success: true, data: { id } };
    } catch (error) {
      logger.error('clientService.deleteClient failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Search clients by query
   */
  async searchClients(query) {
    try {
      const clients = this.clientRepository.search(query);
      return { success: true, data: clients };
    } catch (error) {
      logger.error('clientService.searchClients failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }
}

module.exports = ClientService;
