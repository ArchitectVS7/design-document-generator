// Configuration Service v0.7.0
import databaseConfig from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class ConfigurationService {
  constructor() {
    this.dbType = databaseConfig.getDatabaseType();
  }

  // Create a new configuration
  async createConfiguration(userId, configData) {
    try {
      const { name, description, config_data, is_default = false, is_public = false, tags = [] } = configData;
      
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          INSERT INTO configurations (user_id, name, description, config_data, is_default, is_public, tags)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        
        const result = await connection.query(query, [
          userId, name, description, config_data, is_default, is_public, tags
        ]);
        
        return result.rows[0];
      } else {
        // Supabase implementation
        const supabase = databaseConfig.getConnection();
        const { data, error } = await supabase
          .from('configurations')
          .insert({
            user_id: userId,
            name,
            description,
            config_data,
            is_default: is_default,
            is_public: is_public,
            tags
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Configuration creation failed:', error);
      throw error;
    }
  }

  // Get configuration by ID
  async getConfigurationById(configId, userId) {
    try {
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          SELECT * FROM configurations 
          WHERE id = $1 AND (user_id = $2 OR is_public = true)
        `;
        
        const result = await connection.query(query, [configId, userId]);
        return result.rows[0] || null;
      } else {
        const supabase = databaseConfig.getConnection();
        const { data, error } = await supabase
          .from('configurations')
          .select('*')
          .eq('id', configId)
          .or(`user_id.eq.${userId},is_public.eq.true`)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
      }
    } catch (error) {
      console.error('Configuration retrieval failed:', error);
      throw error;
    }
  }

  // Get all configurations for a user
  async getUserConfigurations(userId, includePublic = false) {
    try {
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        let query = 'SELECT * FROM configurations WHERE user_id = $1';
        let params = [userId];
        
        if (includePublic) {
          query = 'SELECT * FROM configurations WHERE user_id = $1 OR is_public = true';
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await connection.query(query, params);
        return result.rows;
      } else {
        const supabase = databaseConfig.getConnection();
        let query = supabase
          .from('configurations')
          .select('*')
          .eq('user_id', userId);
        
        if (includePublic) {
          query = supabase
            .from('configurations')
            .select('*')
            .or(`user_id.eq.${userId},is_public.eq.true`);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }
    } catch (error) {
      console.error('User configurations retrieval failed:', error);
      throw error;
    }
  }

  // Update configuration
  async updateConfiguration(configId, userId, updateData) {
    try {
      const { name, description, config_data, is_default, is_public, tags } = updateData;
      
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          UPDATE configurations 
          SET name = COALESCE($3, name),
              description = COALESCE($4, description),
              config_data = COALESCE($5, config_data),
              is_default = COALESCE($6, is_default),
              is_public = COALESCE($7, is_public),
              tags = COALESCE($8, tags),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND user_id = $2
          RETURNING *
        `;
        
        const result = await connection.query(query, [
          configId, userId, name, description, config_data, is_default, is_public, tags
        ]);
        
        return result.rows[0] || null;
      } else {
        const supabase = databaseConfig.getConnection();
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (description !== undefined) updateFields.description = description;
        if (config_data !== undefined) updateFields.config_data = config_data;
        if (is_default !== undefined) updateFields.is_default = is_default;
        if (is_public !== undefined) updateFields.is_public = is_public;
        if (tags !== undefined) updateFields.tags = tags;
        
        const { data, error } = await supabase
          .from('configurations')
          .update(updateFields)
          .eq('id', configId)
          .eq('user_id', userId)
          .select()
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
      }
    } catch (error) {
      console.error('Configuration update failed:', error);
      throw error;
    }
  }

  // Delete configuration
  async deleteConfiguration(configId, userId) {
    try {
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          DELETE FROM configurations 
          WHERE id = $1 AND user_id = $2
          RETURNING id
        `;
        
        const result = await connection.query(query, [configId, userId]);
        return result.rows.length > 0;
      } else {
        const supabase = databaseConfig.getConnection();
        const { error } = await supabase
          .from('configurations')
          .delete()
          .eq('id', configId)
          .eq('user_id', userId);
        
        if (error) throw error;
        return true;
      }
    } catch (error) {
      console.error('Configuration deletion failed:', error);
      throw error;
    }
  }

  // Get default configuration
  async getDefaultConfiguration() {
    try {
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          SELECT * FROM configurations 
          WHERE is_default = true 
          ORDER BY created_at DESC 
          LIMIT 1
        `;
        
        const result = await connection.query(query);
        return result.rows[0] || null;
      } else {
        const supabase = databaseConfig.getConnection();
        const { data, error } = await supabase
          .from('configurations')
          .select('*')
          .eq('is_default', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        return data || null;
      }
    } catch (error) {
      console.error('Default configuration retrieval failed:', error);
      throw error;
    }
  }

  // Search configurations
  async searchConfigurations(userId, searchTerm, includePublic = false) {
    try {
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        let query = `
          SELECT * FROM configurations 
          WHERE (user_id = $1 OR $2 = true AND is_public = true)
          AND (name ILIKE $3 OR description ILIKE $3 OR tags::text ILIKE $3)
          ORDER BY created_at DESC
        `;
        
        const result = await connection.query(query, [
          userId, includePublic, `%${searchTerm}%`
        ]);
        
        return result.rows;
      } else {
        const supabase = databaseConfig.getConnection();
        let query = supabase
          .from('configurations')
          .select('*')
          .or(`user_id.eq.${userId},is_public.eq.true`)
          .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        
        if (!includePublic) {
          query = supabase
            .from('configurations')
            .select('*')
            .eq('user_id', userId)
            .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      }
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
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN is_default = true THEN 1 END) as defaults,
            COUNT(CASE WHEN is_public = true THEN 1 END) as public,
            COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as recent
          FROM configurations 
          WHERE user_id = $1
        `;
        
        const result = await connection.query(query, [userId]);
        return result.rows[0];
      } else {
        const supabase = databaseConfig.getConnection();
        const { data, error } = await supabase
          .from('configurations')
          .select('*')
          .eq('user_id', userId);
        
        if (error) throw error;
        
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        return {
          total: data.length,
          defaults: data.filter(c => c.is_default).length,
          public: data.filter(c => c.is_public).length,
          recent: data.filter(c => new Date(c.created_at) >= weekAgo).length
        };
      }
    } catch (error) {
      console.error('Configuration stats retrieval failed:', error);
      throw error;
    }
  }
}

export default new ConfigurationService(); 