// Database Configuration v0.7.1 - Optimized for Render PostgreSQL
import dotenv from 'dotenv';
import pkg from 'pg';

const { Pool } = pkg;
dotenv.config();

class DatabaseConfig {
  constructor() {
    this.dbType = 'postgresql';
    this.pool = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  // Get database type
  getDatabaseType() {
    return this.dbType;
  }

  // Parse database URL and configure SSL for Render
  getPoolConfig() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }

    // Render provides internal database URLs that don't require SSL
    const isRenderInternal = databaseUrl.includes('@dpg-') && databaseUrl.includes('.internal');
    
    const poolConfig = {
      connectionString: databaseUrl,
      // Connection pool settings optimized for Render
      max: parseInt(process.env.DB_POOL_SIZE) || 10,
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000,
      // SSL configuration
      ssl: isRenderInternal ? false : {
        rejectUnauthorized: false // Required for Render external connections
      }
    };

    // Additional production optimizations
    if (process.env.NODE_ENV === 'production') {
      poolConfig.statement_timeout = parseInt(process.env.DB_STATEMENT_TIMEOUT) || 30000;
      poolConfig.query_timeout = parseInt(process.env.DB_QUERY_TIMEOUT) || 30000;
    }

    return poolConfig;
  }

  // Initialize PostgreSQL connection pool with retry logic
  async initialize() {
    if (this.pool) return this.pool;

    try {
      const poolConfig = this.getPoolConfig();
      this.pool = new Pool(poolConfig);

      // Set up error handlers
      this.pool.on('error', (err) => {
        console.error('❌ Unexpected pool error:', err);
        // Don't exit, let the app handle reconnection
      });

      this.pool.on('connect', () => {
        console.log('✅ New client connected to PostgreSQL pool');
      });

      this.pool.on('remove', () => {
        console.log('🔄 Client removed from PostgreSQL pool');
      });

      // Test connection
      await this.testConnection();
      
      this.retryCount = 0; // Reset retry count on success
      return this.pool;
    } catch (error) {
      console.error(`❌ PostgreSQL initialization failed (attempt ${this.retryCount + 1}/${this.maxRetries}):`, error.message);
      
      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔄 Retrying in ${this.retryDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.initialize();
      }
      
      throw error;
    }
  }

  // Test database connection
  async testConnection() {
    if (!this.pool) {
      throw new Error('Database pool not initialized');
    }

    const client = await this.pool.connect();
    try {
      const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
      console.log('✅ PostgreSQL connection established');
      console.log(`📅 Server time: ${result.rows[0].current_time}`);
      console.log(`🐘 PostgreSQL version: ${result.rows[0].pg_version.split(' ')[1]}`);
      return true;
    } finally {
      client.release();
    }
  }

  // Get current database connection pool
  getConnection() {
    if (!this.pool) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  // Execute a query with automatic retry
  async query(text, params) {
    const pool = await this.initialize();
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await pool.query(text, params);
        return result;
      } catch (error) {
        lastError = error;
        console.error(`❌ Query failed (attempt ${attempt + 1}/${this.maxRetries + 1}):`, error.message);
        
        // Check if error is retryable
        const retryableCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', '57P03', '08006', '08001'];
        const isRetryable = retryableCodes.some(code => 
          error.code === code || error.message.includes(code)
        );
        
        if (!isRetryable || attempt === this.maxRetries) {
          throw error;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
    
    throw lastError;
  }

  // Get a client for transactions
  async getClient() {
    const pool = await this.initialize();
    return pool.connect();
  }

  // Close database connection pool
  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('✅ PostgreSQL connection pool closed');
    }
  }

  // Get database status with detailed information
  async getStatus() {
    try {
      if (!this.pool) {
        await this.initialize();
      }
      
      const client = await this.pool.connect();
      try {
        // Get various database metrics
        const [dbInfo, poolInfo, activeConnections] = await Promise.all([
          client.query('SELECT current_database() as db_name, pg_database_size(current_database()) as db_size'),
          client.query('SELECT count(*) as total_clients FROM pg_stat_activity WHERE datname = current_database()'),
          client.query('SELECT state, count(*) as count FROM pg_stat_activity WHERE datname = current_database() GROUP BY state')
        ]);
        
        return {
          type: 'postgresql',
          status: 'connected',
          timestamp: new Date().toISOString(),
          database: {
            name: dbInfo.rows[0].db_name,
            size: `${Math.round(dbInfo.rows[0].db_size / 1024 / 1024)} MB`
          },
          pool: {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount
          },
          connections: {
            total: parseInt(poolInfo.rows[0].total_clients),
            byState: activeConnections.rows.reduce((acc, row) => {
              acc[row.state || 'unknown'] = parseInt(row.count);
              return acc;
            }, {})
          }
        };
      } finally {
        client.release();
      }
    } catch (error) {
      return {
        type: this.dbType,
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
        pool: this.pool ? {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        } : null
      };
    }
  }

  // Health check for monitoring
  async healthCheck() {
    try {
      const result = await this.query('SELECT 1 as healthy');
      return result.rows[0].healthy === 1;
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      return false;
    }
  }
}

// Create singleton instance
const databaseConfig = new DatabaseConfig();

export default databaseConfig; 