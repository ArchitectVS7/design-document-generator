// Express.js Server v0.7.0
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configurations and services
import databaseConfig from './config/database.js';
import sessionConfig from './config/session.js';

// Import routes
import configurationRoutes from './routes/configurations.js';
import sessionRoutes from './routes/sessions.js';
import llmRoutes from './routes/llm.js';

// Import middleware
import authMiddleware from './middleware/auth.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.apiPrefix = process.env.API_PREFIX || '/api';
    this.apiVersion = process.env.API_VERSION || 'v1';
  }

  // Initialize database connection
  async initializeDatabase() {
    try {
      console.log('🔄 Initializing database connection...');
      await databaseConfig.initialize();
      console.log('✅ Database connection established');
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      console.log('⚠️  Server will start without database connection (for testing)');
      // Don't exit for testing purposes
      // process.exit(1);
    }
  }

  // Configure middleware
  configureMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    const allowedOrigins = [
      "https://frontend-g7gc.onrender.com",
      "http://localhost:5173"
    ];
    this.app.use(cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
    }));

    // Compression middleware
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
      message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
      });
      next();
    });
  }

  // Configure session management
  async configureSession() {
    try {
      const sessionMiddleware = await sessionConfig.configureSession();
      this.app.use(sessionMiddleware);
      console.log('✅ Session management configured');
    } catch (error) {
      console.error('❌ Session configuration failed:', error);
      // Continue without session management
    }
  }

  // Configure API routes
  configureRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '0.7.0',
        database: databaseConfig.getDatabaseType()
      });
    });

    // API status endpoint
    this.app.get('/api/status', (req, res) => {
      res.json({
        success: true,
        data: {
          version: '0.7.0',
          database: databaseConfig.getDatabaseType(),
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        }
      });
    });

    // Database status endpoint (admin only)
    this.app.get('/api/admin/database/status', authMiddleware.authenticateApiKey, authMiddleware.requireAdmin, async (req, res) => {
      try {
        const status = await databaseConfig.getStatus();
        res.json({
          success: true,
          data: status
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to get database status',
          message: error.message
        });
      }
    });

    // API routes with versioning
    const apiPath = `${this.apiPrefix}/${this.apiVersion}`;
    
    // Configuration routes
    this.app.use(`${apiPath}/configurations`, configurationRoutes);
    
    // Session routes
    this.app.use(`${apiPath}/sessions`, sessionRoutes);

    // LLM routes
    this.app.use('/api/v1/llm', llmRoutes);

    // 404 handler for API routes
    this.app.use(`${apiPath}/*`, (req, res) => {
      res.status(404).json({
        success: false,
        error: 'API endpoint not found',
        message: `The requested endpoint ${req.method} ${req.path} does not exist`
      });
    });

    // General 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `The requested endpoint ${req.method} ${req.path} does not exist`
      });
    });
  }

  // Error handling middleware
  configureErrorHandling() {
    // Global error handler
    this.app.use((error, req, res, next) => {
      console.error('Unhandled error:', error);

      // Don't leak error details in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(error.status || 500).json({
        success: false,
        error: 'Internal server error',
        message: isDevelopment ? error.message : 'An unexpected error occurred',
        ...(isDevelopment && { stack: error.stack })
      });
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => this.gracefulShutdown());
    process.on('SIGINT', () => this.gracefulShutdown());
  }

  // Graceful shutdown
  async gracefulShutdown() {
    console.log('🔄 Shutting down server gracefully...');
    
    try {
      await databaseConfig.close();
      console.log('✅ Database connection closed');
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  // Start the server
  async start() {
    try {
      // Initialize database
      await this.initializeDatabase();

      // Configure middleware
      this.configureMiddleware();

      // Configure session management
      await this.configureSession();

      // Configure routes
      this.configureRoutes();

      // Configure error handling
      this.configureErrorHandling();

      // Start listening
      this.app.listen(this.port, () => {
        console.log('🚀 Design Document Generator Backend v0.7.0');
        console.log(`📍 Server running on port ${this.port}`);
        console.log(`🌐 API available at http://localhost:${this.port}${this.apiPrefix}/${this.apiVersion}`);
        console.log(`💾 Database: ${databaseConfig.getDatabaseType()}`);
        console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log('✅ Server started successfully');
      });

    } catch (error) {
      console.error('❌ Server startup failed:', error);
      process.exit(1);
    }
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new Server();
  server.start();
}

export default Server; 