// Database Configuration v0.8.0 (PostgreSQL for Render)
import dotenv from 'dotenv';
import pkg from 'pg';

const { Pool } = pkg;
dotenv.config();

class DatabaseConfig {
  constructor() {
    this.dbType = 'postgresql';
    this.pool = null;
  }

  // Get database type
  getDatabaseType() {
    return this.dbType;
  }

  // Initialize PostgreSQL connection pool
  async initialize() {
    if (this.pool) return this.pool;
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    this.pool = new Pool({ connectionString: databaseUrl });
    // Test connection
    try {
      await this.pool.query('SELECT 1');
      console.log('✅ PostgreSQL connection established');
    } catch (error) {
      console.error('❌ PostgreSQL connection failed:', error.message);
      throw error;
    }
    return this.pool;
  }

  // Get current database connection pool
  getConnection() {
    return this.pool;
  }

  // Close database connection pool
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('PostgreSQL connection closed');
    }
  }

  // Get database status
  async getStatus() {
    try {
      await this.initialize();
      await this.pool.query('SELECT 1');
      return {
        type: 'postgresql',
        status: 'connected',
        timestamp: new Date().toISOString(),
        version: 'pg'
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