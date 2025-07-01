// Database Configuration v0.7.0
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import pkg from 'pg';
const { Pool } = pkg;

dotenv.config();

class DatabaseConfig {
  constructor() {
    this.dbType = process.env.DB_TYPE || 'postgresql';
    this.connection = null;
    this.supabase = null;
  }

  // Get database type (postgresql or supabase)
  getDatabaseType() {
    return this.dbType;
  }

  // Initialize PostgreSQL connection
  async initPostgreSQL() {
    try {
      this.connection = new Pool({
        host: process.env.POSTGRES_HOST || 'localhost',
        port: process.env.POSTGRES_PORT || 5432,
        database: process.env.POSTGRES_DB || 'design_doc_generator',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD,
        ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      await this.connection.query('SELECT NOW()');
      console.log('✅ PostgreSQL connection established');
      return this.connection;
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error.message);
      throw error;
    }
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

  // Initialize database based on configuration
  async initialize() {
    try {
      if (this.dbType === 'supabase') {
        return await this.initSupabase();
      } else {
        return await this.initPostgreSQL();
      }
    } catch (error) {
      console.error('Database initialization failed:', error.message);
      // Return null instead of throwing for testing
      return null;
    }
  }

  // Get current database connection
  getConnection() {
    if (this.dbType === 'supabase') {
      return this.supabase;
    } else {
      return this.connection;
    }
  }

  // Close database connection
  async close() {
    if (this.dbType === 'postgresql' && this.connection) {
      await this.connection.end();
      console.log('PostgreSQL connection closed');
    }
  }

  // Switch database type (for admin use)
  async switchDatabaseType(newType) {
    if (newType !== 'postgresql' && newType !== 'supabase') {
      throw new Error('Invalid database type. Must be "postgresql" or "supabase"');
    }

    // Close existing connection
    await this.close();

    // Update environment variable
    process.env.DB_TYPE = newType;
    this.dbType = newType;

    // Initialize new connection
    return await this.initialize();
  }

  // Get database status
  async getStatus() {
    try {
      if (this.dbType === 'postgresql') {
        const result = await this.connection.query('SELECT NOW() as timestamp, version() as version');
        return {
          type: 'postgresql',
          status: 'connected',
          timestamp: result.rows[0].timestamp,
          version: result.rows[0].version.split(' ')[0]
        };
      } else {
        const { data, error } = await this.supabase.from('configurations').select('count').limit(1);
        if (error) throw error;
        return {
          type: 'supabase',
          status: 'connected',
          timestamp: new Date().toISOString(),
          version: 'supabase'
        };
      }
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