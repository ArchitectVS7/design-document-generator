// Configuration Service v0.7.1
// Uses PostgreSQL database proxy for all operations
import databaseProxy from './databaseProxy.js';

class ConfigurationService {
  // Create a new configuration
  async createConfiguration(userId, configData) {
    try {
      return await databaseProxy.createConfiguration(userId, configData);
    } catch (error) {
      console.error('Configuration creation failed:', error);
      throw error;
    }
  }

  // Get configuration by ID
  async getConfigurationById(configId, userId) {
    try {
      return await databaseProxy.getConfigurationById(configId, userId);
    } catch (error) {
      console.error('Configuration retrieval failed:', error);
      throw error;
    }
  }

  // Get all configurations for a user
  async getUserConfigurations(userId, includePublic = false) {
    try {
      return await databaseProxy.getUserConfigurations(userId, includePublic);
    } catch (error) {
      console.error('User configurations retrieval failed:', error);
      throw error;
    }
  }

  // Update configuration
  async updateConfiguration(configId, userId, updateData) {
    try {
      return await databaseProxy.updateConfiguration(configId, userId, updateData);
    } catch (error) {
      console.error('Configuration update failed:', error);
      throw error;
    }
  }

  // Delete configuration
  async deleteConfiguration(configId, userId) {
    try {
      return await databaseProxy.deleteConfiguration(configId, userId);
    } catch (error) {
      console.error('Configuration deletion failed:', error);
      throw error;
    }
  }

  // Get default configuration
  async getDefaultConfiguration() {
    try {
      return await databaseProxy.getDefaultConfiguration();
    } catch (error) {
      console.error('Default configuration retrieval failed:', error);
      throw error;
    }
  }

  // Search configurations
  async searchConfigurations(userId, searchTerm, includePublic = false) {
    try {
      return await databaseProxy.searchConfigurations(userId, searchTerm, includePublic);
    } catch (error) {
      console.error('Configuration search failed:', error);
      throw error;
    }
  }

  // Import configuration from JSON
  async importConfiguration(userId, jsonData) {
    try {
      const configData = {
        name: jsonData.name || 'Imported Configuration',
        description: jsonData.description || 'Imported from JSON',
        config_data: jsonData.config || jsonData,
        is_default: false,
        is_public: false,
        tags: jsonData.tags || ['imported']
      };
      
      return await this.createConfiguration(userId, configData);
    } catch (error) {
      console.error('Configuration import failed:', error);
      throw error;
    }
  }

  // Export configuration to JSON
  async exportConfiguration(configId, userId) {
    try {
      const config = await this.getConfigurationById(configId, userId);
      if (!config) {
        throw new Error('Configuration not found');
      }
      
      return {
        name: config.name,
        description: config.description,
        version: config.version,
        config: config.config_data,
        tags: config.tags,
        exported_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Configuration export failed:', error);
      throw error;
    }
  }

  // Get configuration statistics
  async getConfigurationStats(userId) {
    try {
      return await databaseProxy.getConfigurationStats(userId);
    } catch (error) {
      console.error('Configuration stats retrieval failed:', error);
      throw error;
    }
  }
}

export default new ConfigurationService(); 