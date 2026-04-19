const ProductRepository = require('../repositories/productRepository');
const logger = require('../utils/logger');
const { validate } = require('../validation/validate');
const { ProductSchema, ProductUpdateSchema } = require('../validation/schemas');
const AuditService = require('./auditService');

/**
 * ProductService - Business logic for product operations
 * All methods return standardized response envelopes
 */
class ProductService {
  constructor(productRepository, auditService) {
    this.productRepository = productRepository;
    this.auditService = auditService || new AuditService(new (require('../repositories/auditRepository'))());
  }

  /**
   * Get all products
   */
  async getAllProducts() {
    try {
      const products = this.productRepository.findActive();
      return { success: true, data: products };
    } catch (error) {
      logger.error('productService.getAllProducts failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(id) {
    try {
      const product = this.productRepository.findById(id);
      if (!product) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } };
      }
      return { success: true, data: product };
    } catch (error) {
      logger.error('productService.getProductById failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Create a new product
   */
  async createProduct(data) {
    const validation = validate(ProductSchema, data);
    if (!validation.success) return validation;

    try {
      const id = data.id || require('crypto').randomUUID();
      const product = this.productRepository.create({ ...validation.data, id });
      this.auditService.logCreate('product', id, product);
      return { success: true, data: product };
    } catch (error) {
      logger.error('productService.createProduct failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Update a product
   */
  async updateProduct(id, data) {
    const validation = validate(ProductUpdateSchema, data);
    if (!validation.success) return validation;

    try {
      const existing = this.productRepository.findById(id);
      if (!existing) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } };
      }
      const product = this.productRepository.update(id, validation.data);
      this.auditService.logUpdate('product', id, existing, product);
      return { success: true, data: product };
    } catch (error) {
      logger.error('productService.updateProduct failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(id) {
    try {
      const existing = this.productRepository.findById(id);
      if (!existing) {
        return { success: false, error: { code: 'NOT_FOUND', message: 'Product not found' } };
      }
      this.productRepository.delete(id);
      this.auditService.logDelete('product', id, existing);
      return { success: true, data: { id } };
    } catch (error) {
      logger.error('productService.deleteProduct failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Search products by query
   */
  async searchProducts(query) {
    try {
      const products = this.productRepository.search(query);
      return { success: true, data: products };
    } catch (error) {
      logger.error('productService.searchProducts failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }

  /**
   * Get products with low stock
   */
  async getLowStockProducts(threshold = 5) {
    try {
      const products = this.productRepository.findLowStock(threshold);
      return { success: true, data: products };
    } catch (error) {
      logger.error('productService.getLowStockProducts failed', error);
      return { success: false, error: { code: 'DB_ERROR', message: error.message } };
    }
  }
}

module.exports = ProductService;
