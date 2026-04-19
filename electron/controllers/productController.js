const ProductService = require('../services/productService');

/**
 * ProductController - IPC handlers for product operations
 * Thin orchestrator layer - no business logic
 */
class ProductController {
  constructor(productService) {
    this.productService = productService;
  }

  async getAll(event) {
    return await this.productService.getAllProducts();
  }

  async getById(event, id) {
    if (!id || typeof id !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Valid product ID required' } };
    }
    return await this.productService.getProductById(id);
  }

  async create(event, data) {
    if (!data || !data.name || typeof data.price !== 'number') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Name and price are required' } };
    }
    return await this.productService.createProduct(data);
  }

  async update(event, id, data) {
    if (!id || typeof id !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Valid product ID required' } };
    }
    if (!data) {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Data is required' } };
    }
    return await this.productService.updateProduct(id, data);
  }

  async delete(event, id) {
    if (!id || typeof id !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Valid product ID required' } };
    }
    return await this.productService.deleteProduct(id);
  }

  async search(event, query) {
    if (!query || typeof query !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Search query is required' } };
    }
    return await this.productService.searchProducts(query);
  }

  async getLowStock(event, threshold = 5) {
    if (typeof threshold !== 'number' || threshold < 0) {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'Threshold must be a non-negative number' } };
    }
    return await this.productService.getLowStockProducts(threshold);
  }
}

module.exports = ProductController;
