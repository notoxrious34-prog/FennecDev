const LicenseService = require('../services/licenseService');

/**
 * LicenseController - IPC handlers for license operations
 * Thin orchestrator layer - no business logic
 */
class LicenseController {
  constructor(licenseService) {
    this.licenseService = licenseService;
  }

  async activate(event, { licenseToken }) {
    if (!licenseToken || typeof licenseToken !== 'string') {
      return { success: false, error: { code: 'INVALID_INPUT', message: 'License token is required' } };
    }

    const verification = this.licenseService.verifyLicense(licenseToken);
    if (!verification.success) {
      return { success: false, error: { code: verification.error, message: verification.error } };
    }

    const storage = this.licenseService.storeLicense(licenseToken);
    if (!storage.success) {
      return { success: false, error: { code: 'STORAGE_ERROR', message: storage.error } };
    }

    return { success: true, data: { license: verification.license } };
  }

  async checkStatus(event) {
    const result = await this.licenseService.isLicenseValid();
    return { success: true, data: result };
  }

  async getDetails(event) {
    const result = this.licenseService.getLicenseDetails();
    return result;
  }

  async getMachineId(event) {
    const result = await this.licenseService.getMachineId();
    return result;
  }
}

module.exports = LicenseController;
