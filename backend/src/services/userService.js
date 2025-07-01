// User Service v0.7.0
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import databaseConfig from '../config/database.js';
import authMiddleware from '../middleware/auth.js';

class UserService {
  constructor() {
    this.dbType = databaseConfig.getDatabaseType();
  }

  // Create a new user
  async createUser(userData) {
    try {
      const { username, email, password, role = 'user' } = userData;
      
      // Hash password
      const passwordHash = await authMiddleware.hashPassword(password);
      
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          INSERT INTO users (username, email, password_hash, role)
          VALUES ($1, $2, $3, $4)
          RETURNING id, username, email, role, created_at
        `;
        
        const result = await connection.query(query, [
          username, email, passwordHash, role
        ]);
        
        return result.rows[0];
      } else {
        // Supabase implementation would go here
        throw new Error('Supabase user creation not implemented yet');
      }
    } catch (error) {
      console.error('User creation failed:', error);
      throw error;
    }
  }

  // Authenticate user
  async authenticateUser(username, password) {
    try {
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          SELECT id, username, email, password_hash, role, is_active
          FROM users 
          WHERE username = $1 OR email = $1
        `;
        
        const result = await connection.query(query, [username]);
        const user = result.rows[0];
        
        if (!user || !user.is_active) {
          return null;
        }
        
        // Verify password
        const isValidPassword = await authMiddleware.comparePassword(password, user.password_hash);
        if (!isValidPassword) {
          return null;
        }
        
        // Remove password hash from response
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      } else {
        // Supabase implementation would go here
        throw new Error('Supabase authentication not implemented yet');
      }
    } catch (error) {
      console.error('User authentication failed:', error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          SELECT id, username, email, role, is_active, created_at, updated_at
          FROM users 
          WHERE id = $1
        `;
        
        const result = await connection.query(query, [userId]);
        return result.rows[0] || null;
      } else {
        // Supabase implementation would go here
        throw new Error('Supabase user retrieval not implemented yet');
      }
    } catch (error) {
      console.error('User retrieval failed:', error);
      throw error;
    }
  }

  // Create API key for user
  async createApiKey(userId, keyName, permissions = []) {
    try {
      const apiKey = authMiddleware.generateApiKey();
      const keyHash = authMiddleware.hashApiKey(apiKey);
      
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          INSERT INTO api_keys (user_id, key_name, key_hash, permissions)
          VALUES ($1, $2, $3, $4)
          RETURNING id, key_name, permissions, created_at
        `;
        
        const result = await connection.query(query, [
          userId, keyName, keyHash, JSON.stringify(permissions)
        ]);
        
        return {
          ...result.rows[0],
          apiKey // Return the plain API key only once
        };
      } else {
        // Supabase implementation would go here
        throw new Error('Supabase API key creation not implemented yet');
      }
    } catch (error) {
      console.error('API key creation failed:', error);
      throw error;
    }
  }

  // Get API keys for user
  async getUserApiKeys(userId) {
    try {
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          SELECT id, key_name, permissions, is_active, last_used, expires_at, created_at
          FROM api_keys 
          WHERE user_id = $1
          ORDER BY created_at DESC
        `;
        
        const result = await connection.query(query, [userId]);
        return result.rows;
      } else {
        // Supabase implementation would go here
        throw new Error('Supabase API key retrieval not implemented yet');
      }
    } catch (error) {
      console.error('API key retrieval failed:', error);
      throw error;
    }
  }

  // Revoke API key
  async revokeApiKey(apiKeyId, userId) {
    try {
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          UPDATE api_keys 
          SET is_active = false 
          WHERE id = $1 AND user_id = $2
          RETURNING id
        `;
        
        const result = await connection.query(query, [apiKeyId, userId]);
        return result.rows.length > 0;
      } else {
        // Supabase implementation would go here
        throw new Error('Supabase API key revocation not implemented yet');
      }
    } catch (error) {
      console.error('API key revocation failed:', error);
      throw error;
    }
  }

  // Update user profile
  async updateUser(userId, updateData) {
    try {
      const { username, email, role } = updateData;
      
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          UPDATE users 
          SET username = COALESCE($2, username),
              email = COALESCE($3, email),
              role = COALESCE($4, role),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING id, username, email, role, is_active, created_at, updated_at
        `;
        
        const result = await connection.query(query, [
          userId, username, email, role
        ]);
        
        return result.rows[0] || null;
      } else {
        // Supabase implementation would go here
        throw new Error('Supabase user update not implemented yet');
      }
    } catch (error) {
      console.error('User update failed:', error);
      throw error;
    }
  }

  // Change user password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // First verify current password
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        
        // Get current password hash
        const currentUserQuery = `
          SELECT password_hash FROM users WHERE id = $1
        `;
        const currentUserResult = await connection.query(currentUserQuery, [userId]);
        const currentPasswordHash = currentUserResult.rows[0].password_hash;
        
        // Verify current password
        const isValidCurrentPassword = await authMiddleware.comparePassword(currentPassword, currentPasswordHash);
        if (!isValidCurrentPassword) {
          throw new Error('Current password is incorrect');
        }
        
        // Hash new password
        const newPasswordHash = await authMiddleware.hashPassword(newPassword);
        
        // Update password
        const updateQuery = `
          UPDATE users 
          SET password_hash = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING id
        `;
        
        const result = await connection.query(updateQuery, [userId, newPasswordHash]);
        return result.rows.length > 0;
      } else {
        // Supabase implementation would go here
        throw new Error('Supabase password change not implemented yet');
      }
    } catch (error) {
      console.error('Password change failed:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(userId) {
    try {
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          SELECT 
            (SELECT COUNT(*) FROM configurations WHERE user_id = $1) as config_count,
            (SELECT COUNT(*) FROM conversations WHERE user_id = $1) as conversation_count,
            (SELECT COUNT(*) FROM api_keys WHERE user_id = $1 AND is_active = true) as active_api_keys,
            (SELECT COUNT(*) FROM configurations WHERE user_id = $1 AND created_at >= NOW() - INTERVAL '7 days') as recent_configs
        `;
        
        const result = await connection.query(query, [userId]);
        return result.rows[0];
      } else {
        // Supabase implementation would go here
        throw new Error('Supabase user stats not implemented yet');
      }
    } catch (error) {
      console.error('User stats retrieval failed:', error);
      throw error;
    }
  }

  // Check if username or email exists
  async checkUserExists(username, email) {
    try {
      if (this.dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          SELECT username, email 
          FROM users 
          WHERE username = $1 OR email = $2
        `;
        
        const result = await connection.query(query, [username, email]);
        return {
          usernameExists: result.rows.some(row => row.username === username),
          emailExists: result.rows.some(row => row.email === email)
        };
      } else {
        // Supabase implementation would go here
        throw new Error('Supabase user existence check not implemented yet');
      }
    } catch (error) {
      console.error('User existence check failed:', error);
      throw error;
    }
  }
}

export default new UserService(); 