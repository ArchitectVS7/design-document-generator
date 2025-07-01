// Configuration Service v0.7.0
import supabaseProxy from './supabaseProxy.js';
import { v4 as uuidv4 } from 'uuid';

class ConfigurationService {
  // Create a new configuration
  async createConfiguration(userId, configData) {
    try {
      return await supabaseProxy.createConfiguration(userId, configData);
    } catch (error) {
      console.error('Configuration creation failed:', error);
      throw error;
    }
  }

  // Get configuration by ID
  async getConfigurationById(configId, userId) {
    try {
      return await supabaseProxy.getConfigurationById(configId, userId);
    } catch (error) {
      console.error('Configuration retrieval failed:', error);
      throw error;
    }
  }

  // Get all configurations for a user
  async getUserConfigurations(userId, includePublic = false) {
    try {
      return await supabaseProxy.getUserConfigurations(userId, includePublic);
    } catch (error) {
      console.error('User configurations retrieval failed:', error);
      throw error;
    }
  }

  // Update configuration
  async updateConfiguration(configId, userId, updateData) {
    try {
      return await supabaseProxy.updateConfiguration(configId, userId, updateData);
    } catch (error) {
      console.error('Configuration update failed:', error);
      throw error;
    }
  }

  // Delete configuration
  async deleteConfiguration(configId, userId) {
    try {
      return await supabaseProxy.deleteConfiguration(configId, userId);
    } catch (error) {
      console.error('Configuration deletion failed:', error);
      throw error;
    }
  }

  // Get default configuration
  async getDefaultConfiguration() {
    try {
      const { data, error } = await supabaseProxy.supabase
        .from('configurations')
        .select('*')
        .eq('is_default', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Default configuration retrieval failed:', error);
      throw error;
    }
  }

  // Search configurations
  async searchConfigurations(userId, searchTerm, includePublic = false) {
    try {
      let query = supabaseProxy.supabase
        .from('configurations')
        .select('*')
        .or(`user_id.eq.${userId},is_public.eq.true`)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      
      if (!includePublic) {
        query = supabaseProxy.supabase
          .from('configurations')
          .select('*')
          .eq('user_id', userId)
          .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
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
      return await supabaseProxy.getConfigurationStats(userId);
    } catch (error) {
      console.error('Configuration stats retrieval failed:', error);
      throw error;
    }
  }
}

export default new ConfigurationService(); 