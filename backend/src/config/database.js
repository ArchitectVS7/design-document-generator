// Database Configuration v0.7.0 (Supabase Only)
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

class DatabaseConfig {
  constructor() {
    this.dbType = 'supabase';
    this.supabase = null;
  }

  // Get database type (always supabase)
  getDatabaseType() {
    return this.dbType;
  }

  // Initialize Supabase connection
  async initSupabase() {
    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase URL and service role key are required');
      }

      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Test connection
      const { data, error } = await this.supabase.from('configurations').select('count').limit(1);
      if (error) throw error;

      console.log('✅ Supabase connection established');
      return this.supabase;
    } catch (error) {
      console.error('❌ Supabase connection failed:', error.message);
      throw error;
    }
  }

  // Initialize database (Supabase only)
  async initialize() {
    try {
      return await this.initSupabase();
    } catch (error) {
      console.error('Database initialization failed:', error.message);
      // Return null instead of throwing for testing
      return null;
    }
  }

  // Get current database connection
  getConnection() {
    return this.supabase;
  }

  // Close database connection
  async close() {
    // Supabase connections are managed automatically
    console.log('Supabase connection closed');
  }

  // Get database status
  async getStatus() {
    try {
      const { data, error } = await this.supabase.from('configurations').select('count').limit(1);
      if (error) throw error;
      return {
        type: 'supabase',
        status: 'connected',
        timestamp: new Date().toISOString(),
        version: 'supabase'
      };
    } catch (error) {
      return {
        type: this.dbType,
        status: 'error',
        error: error.message
      };
    }
  }
}

// Create singleton instance
const databaseConfig = new DatabaseConfig();

export default databaseConfig; 