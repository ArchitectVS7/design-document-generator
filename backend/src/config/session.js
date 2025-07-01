// Session Configuration v0.7.0
import session from 'express-session';
import pgSession from 'connect-pg-simple';
import dotenv from 'dotenv';
import databaseConfig from './database.js';

dotenv.config();

const PostgresStore = pgSession(session);

class SessionConfig {
  constructor() {
    this.sessionSecret = process.env.SESSION_SECRET || 'fallback-secret-key';
    this.cookieSecure = process.env.SESSION_COOKIE_SECURE === 'true';
    this.cookieHttpOnly = process.env.SESSION_COOKIE_HTTPONLY !== 'false';
    this.cookieMaxAge = parseInt(process.env.SESSION_COOKIE_MAX_AGE) || 86400000; // 24 hours
  }

  // Create session store based on database type
  async createSessionStore() {
    const dbType = databaseConfig.getDatabaseType();
    
    if (dbType === 'postgresql') {
      const connection = databaseConfig.getConnection();
      return new PostgresStore({
        conObject: connection,
        tableName: 'sessions',
        createTableIfMissing: true,
        ttl: this.cookieMaxAge / 1000, // Convert to seconds
        pruneSessionInterval: 60 * 60 * 1000 // 1 hour
      });
    } else {
      // For Supabase, we'll use memory store for now
      // In production, you might want to implement a custom store
      return new session.MemoryStore();
    }
  }

  // Configure session middleware
  async configureSession() {
    const store = await this.createSessionStore();
    
    return session({
      store: store,
      secret: this.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: this.cookieSecure,
        httpOnly: this.cookieHttpOnly,
        maxAge: this.cookieMaxAge,
        sameSite: 'lax'
      },
      name: 'design-doc-generator.sid'
    });
  }

  // Get session configuration for admin
  getSessionConfig() {
    return {
      secret: this.sessionSecret ? '***configured***' : '***not configured***',
      cookieSecure: this.cookieSecure,
      cookieHttpOnly: this.cookieHttpOnly,
      cookieMaxAge: this.cookieMaxAge,
      databaseType: databaseConfig.getDatabaseType()
    };
  }

  // Update session configuration
  updateSessionConfig(newConfig) {
    if (newConfig.secret) {
      this.sessionSecret = newConfig.secret;
      process.env.SESSION_SECRET = newConfig.secret;
    }
    
    if (newConfig.cookieSecure !== undefined) {
      this.cookieSecure = newConfig.cookieSecure;
      process.env.SESSION_COOKIE_SECURE = newConfig.cookieSecure.toString();
    }
    
    if (newConfig.cookieHttpOnly !== undefined) {
      this.cookieHttpOnly = newConfig.cookieHttpOnly;
      process.env.SESSION_COOKIE_HTTPONLY = newConfig.cookieHttpOnly.toString();
    }
    
    if (newConfig.cookieMaxAge) {
      this.cookieMaxAge = newConfig.cookieMaxAge;
      process.env.SESSION_COOKIE_MAX_AGE = newConfig.cookieMaxAge.toString();
    }
  }
}

// Create singleton instance
const sessionConfig = new SessionConfig();

export default sessionConfig; 