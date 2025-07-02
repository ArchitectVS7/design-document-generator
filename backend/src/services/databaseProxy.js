// Database Proxy Service v0.7.1
// Handles database operations for configurations using PostgreSQL

import databaseConfig from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class DatabaseProxy {
  // Create a new configuration
  async createConfiguration(userId, configData) {
    const client = await databaseConfig.getClient();
    try {
      await client.query('BEGIN');
      
      const id = uuidv4();
      const query = `
        INSERT INTO configurations (
          id, user_id, name, description, version, config_data,
          is_default, is_public, tags, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `;
      
      const values = [
        id,
        userId,
        configData.name,
        configData.description || '',
        configData.version || '1.0.0',
        JSON.stringify(configData.config_data || {}),
        configData.is_default || false,
        configData.is_public || false,
        configData.tags || []
      ];
      
      const result = await client.query(query, values);
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get configuration by ID
  async getConfigurationById(configId, userId) {
    const query = `
      SELECT * FROM configurations 
      WHERE id = $1 AND (user_id = $2 OR is_public = true)
    `;
    
    const result = await databaseConfig.query(query, [configId, userId]);
    return result.rows[0] || null;
  }

  // Get all configurations for a user
  async getUserConfigurations(userId, includePublic = false) {
    let query;
    let values;
    
    if (includePublic) {
      query = `
        SELECT * FROM configurations 
        WHERE user_id = $1 OR is_public = true
        ORDER BY created_at DESC
      `;
      values = [userId];
    } else {
      query = `
        SELECT * FROM configurations 
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      values = [userId];
    }
    
    const result = await databaseConfig.query(query, values);
    return result.rows;
  }

  // Update configuration
  async updateConfiguration(configId, userId, updateData) {
    const client = await databaseConfig.getClient();
    try {
      await client.query('BEGIN');
      
      // Build dynamic update query
      const updateFields = [];
      const values = [];
      let valueIndex = 1;
      
      if (updateData.name !== undefined) {
        updateFields.push(`name = $${valueIndex++}`);
        values.push(updateData.name);
      }
      if (updateData.description !== undefined) {
        updateFields.push(`description = $${valueIndex++}`);
        values.push(updateData.description);
      }
      if (updateData.config_data !== undefined) {
        updateFields.push(`config_data = $${valueIndex++}`);
        values.push(JSON.stringify(updateData.config_data));
      }
      if (updateData.is_default !== undefined) {
        updateFields.push(`is_default = $${valueIndex++}`);
        values.push(updateData.is_default);
      }
      if (updateData.is_public !== undefined) {
        updateFields.push(`is_public = $${valueIndex++}`);
        values.push(updateData.is_public);
      }
      if (updateData.tags !== undefined) {
        updateFields.push(`tags = $${valueIndex++}`);
        values.push(updateData.tags);
      }
      
      updateFields.push('updated_at = NOW()');
      
      values.push(configId);
      values.push(userId);
      
      const query = `
        UPDATE configurations 
        SET ${updateFields.join(', ')}
        WHERE id = $${valueIndex++} AND user_id = $${valueIndex}
        RETURNING *
      `;
      
      const result = await client.query(query, values);
      await client.query('COMMIT');
      
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Delete configuration
  async deleteConfiguration(configId, userId) {
    const query = `
      DELETE FROM configurations 
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `;
    
    const result = await databaseConfig.query(query, [configId, userId]);
    return result.rowCount > 0;
  }

  // Get configuration statistics
  async getConfigurationStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_configurations,
        COUNT(CASE WHEN is_public = true THEN 1 END) as public_configurations,
        COUNT(CASE WHEN is_default = true THEN 1 END) as default_configurations,
        COUNT(DISTINCT tags) as unique_tags
      FROM configurations
      WHERE user_id = $1
    `;
    
    const result = await databaseConfig.query(query, [userId]);
    return result.rows[0];
  }

  // Get default configuration
  async getDefaultConfiguration() {
    const query = `
      SELECT * FROM configurations 
      WHERE is_default = true
      ORDER BY created_at DESC
      LIMIT 1
    `;
    
    const result = await databaseConfig.query(query);
    return result.rows[0] || null;
  }

  // Search configurations
  async searchConfigurations(userId, searchTerm, includePublic = false) {
    let query;
    const values = [`%${searchTerm}%`, userId];
    
    if (includePublic) {
      query = `
        SELECT * FROM configurations 
        WHERE (user_id = $2 OR is_public = true)
          AND (name ILIKE $1 OR description ILIKE $1)
        ORDER BY created_at DESC
      `;
    } else {
      query = `
        SELECT * FROM configurations 
        WHERE user_id = $2
          AND (name ILIKE $1 OR description ILIKE $1)
        ORDER BY created_at DESC
      `;
    }
    
    const result = await databaseConfig.query(query, values);
    return result.rows;
  }
}

export default new DatabaseProxy();