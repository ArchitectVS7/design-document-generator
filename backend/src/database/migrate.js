// Database Migration Runner v0.7.0
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import databaseConfig from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DatabaseMigrator {
  constructor() {
    this.migrationsPath = path.join(__dirname, 'migrations');
    this.connection = null;
  }

  async initialize() {
    try {
      await databaseConfig.initialize();
      this.connection = databaseConfig.getConnection();
      
      if (databaseConfig.getDatabaseType() !== 'postgresql') {
        console.log('⚠️  Migrations are only supported for PostgreSQL. Supabase migrations should be handled manually.');
        return;
      }

      console.log('✅ Database connection established for migrations');
    } catch (error) {
      console.error('❌ Failed to initialize database connection:', error.message);
      throw error;
    }
  }

  async createMigrationsTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await this.connection.query(query);
    console.log('✅ Migrations table created/verified');
  }

  async getExecutedMigrations() {
    const query = 'SELECT filename FROM migrations ORDER BY id';
    const result = await this.connection.query(query);
    return result.rows.map(row => row.filename);
  }

  async getMigrationFiles() {
    try {
      const files = await fs.readdir(this.migrationsPath);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort();
    } catch (error) {
      console.error('❌ Failed to read migrations directory:', error.message);
      return [];
    }
  }

  async executeMigration(filename) {
    const filePath = path.join(this.migrationsPath, filename);
    
    try {
      console.log(`🔄 Executing migration: ${filename}`);
      
      const sql = await fs.readFile(filePath, 'utf8');
      
      // Execute the migration
      await this.connection.query(sql);
      
      // Record the migration
      await this.connection.query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [filename]
      );
      
      console.log(`✅ Migration completed: ${filename}`);
      return true;
    } catch (error) {
      console.error(`❌ Migration failed: ${filename}`, error.message);
      return false;
    }
  }

  async runMigrations() {
    try {
      await this.initialize();
      await this.createMigrationsTable();
      
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();
      
      console.log(`📋 Found ${migrationFiles.length} migration files`);
      console.log(`📋 Already executed: ${executedMigrations.length} migrations`);
      
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('✅ All migrations are up to date');
        return;
      }
      
      console.log(`🔄 Executing ${pendingMigrations.length} pending migrations...`);
      
      for (const migration of pendingMigrations) {
        const success = await this.executeMigration(migration);
        if (!success) {
          console.error('❌ Migration failed, stopping execution');
          process.exit(1);
        }
      }
      
      console.log('✅ All migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration process failed:', error.message);
      process.exit(1);
    } finally {
      await databaseConfig.close();
    }
  }

  async rollbackMigration(filename) {
    try {
      await this.initialize();
      
      console.log(`🔄 Rolling back migration: ${filename}`);
      
      // Remove the migration record
      await this.connection.query(
        'DELETE FROM migrations WHERE filename = $1',
        [filename]
      );
      
      console.log(`✅ Migration rollback completed: ${filename}`);
    } catch (error) {
      console.error(`❌ Migration rollback failed: ${filename}`, error.message);
    } finally {
      await databaseConfig.close();
    }
  }

  async showStatus() {
    try {
      await this.initialize();
      await this.createMigrationsTable();
      
      const executedMigrations = await this.getExecutedMigrations();
      const migrationFiles = await this.getMigrationFiles();
      
      console.log('\n📊 Migration Status:');
      console.log('==================');
      
      for (const file of migrationFiles) {
        const status = executedMigrations.includes(file) ? '✅ Executed' : '⏳ Pending';
        console.log(`${status} - ${file}`);
      }
      
      console.log('\n📈 Summary:');
      console.log(`- Total migrations: ${migrationFiles.length}`);
      console.log(`- Executed: ${executedMigrations.length}`);
      console.log(`- Pending: ${migrationFiles.length - executedMigrations.length}`);
    } catch (error) {
      console.error('❌ Failed to show migration status:', error.message);
    } finally {
      await databaseConfig.close();
    }
  }
}

// CLI interface
const migrator = new DatabaseMigrator();
const command = process.argv[2];

switch (command) {
case 'run':
  migrator.runMigrations();
  break;
case 'status':
  migrator.showStatus();
  break;
case 'rollback':
  const filename = process.argv[3];
  if (!filename) {
    console.error('❌ Please specify a migration filename to rollback');
    process.exit(1);
  }
  migrator.rollbackMigration(filename);
  break;
default:
  console.log('Usage: node migrate.js [run|status|rollback <filename>]');
  console.log('  run      - Execute all pending migrations');
  console.log('  status   - Show migration status');
  console.log('  rollback - Rollback a specific migration');
  process.exit(1);
} 