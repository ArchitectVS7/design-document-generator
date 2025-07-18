// Express.js Server v0.7.1 - Optimized for Render Deployment
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

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

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 10000; // Render default port
    this.apiPrefix = process.env.API_PREFIX || '/api';
    this.apiVersion = process.env.API_VERSION || 'v1';
  }

  // Initialize database connection
  async initializeDatabase() {
    try {
      console.log('🔄 Initializing database connection...');
      await databaseConfig.initialize();
      console.log('✅ Database connection established');
      
      // Run migrations if in production
      if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Running database migrations...');
        try {
          const { default: migrate } = await import('./database/migrate.js');
          await migrate();
          console.log('✅ Database migrations completed');
        } catch (error) {
          console.error('⚠️  Migration error (non-fatal):', error.message);
        }
      }
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      if (process.env.NODE_ENV === 'production') {
        // In production, exit if database fails
        process.exit(1);
      } else {
        console.log('⚠️  Server will start without database connection (development mode)');
      }
    }
  }

  // Configure middleware
  configureMiddleware() {
    // Trust proxy for Render deployment
    this.app.set('trust proxy', 1);

    // Security middleware with Render-friendly CSP
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          connectSrc: ["'self'", 'https:', 'wss:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration for Render
    const corsOptions = {
      origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
          process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()) : 
          ['http://localhost:5173', 'http://localhost:3000'];
        
        // In production, also allow the Render frontend URL
        if (process.env.FRONTEND_URL) {
          allowedOrigins.push(process.env.FRONTEND_URL);
        }
        
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
      maxAge: 86400 // 24 hours
    };
    
    this.app.use(cors(corsOptions));

    // Compression middleware
    this.app.use(compression());

    // Rate limiting with Redis support for distributed environments
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      message: {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
      // Skip rate limiting in development
      skip: () => process.env.NODE_ENV === 'development'
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware with request ID
    this.app.use((req, res, next) => {
      req.id = Math.random().toString(36).substr(2, 9);
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${req.id}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
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
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  // Configure API routes
  configureRoutes() {
    // Health check endpoint (Render will use this)
    this.app.get('/health', async (req, res) => {
      try {
        const dbStatus = await databaseConfig.getStatus();
        const isHealthy = dbStatus.status === 'connected';
        
        res.status(isHealthy ? 200 : 503).json({
          status: isHealthy ? 'healthy' : 'degraded',
          timestamp: new Date().toISOString(),
          version: '0.7.1',
          database: dbStatus,
          environment: process.env.NODE_ENV || 'development'
        });
      } catch (error) {
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          version: '0.7.1',
          error: error.message
        });
      }
    });

    // API status endpoint
    this.app.get('/api/status', (req, res) => {
      res.json({
        success: true,
        data: {
          version: '0.7.1',
          database: databaseConfig.getDatabaseType(),
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'development'
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
    this.app.use(`${apiPath}/llm`, llmRoutes);

    // 404 handler for API routes
    this.app.use(`${this.apiPrefix}/*`, (req, res) => {
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
    this.app.use((error, req, res, _next) => {
      const requestId = req.id || 'unknown';
      console.error(`[${requestId}] Unhandled error:`, error);

      // Don't leak error details in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(error.status || 500).json({
        success: false,
        error: 'Internal server error',
        message: isDevelopment ? error.message : 'An unexpected error occurred',
        requestId,
        ...(isDevelopment && { stack: error.stack })
      });
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => this.gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => this.gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      this.gracefulShutdown('uncaughtException');
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      this.gracefulShutdown('unhandledRejection');
    });
  }

  // Graceful shutdown
  async gracefulShutdown(signal) {
    console.log(`\n🔄 Received ${signal}, shutting down gracefully...`);
    
    // Stop accepting new connections
    if (this.server) {
      this.server.close(() => {
        console.log('✅ HTTP server closed');
      });
    }
    
    try {
      // Close database connection
      await databaseConfig.close();
      console.log('✅ Database connection closed');
      
      // Give some time for ongoing requests to complete
      setTimeout(() => {
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      }, 5000);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  }

  // Start the server
  async start() {
    try {
      console.log('🚀 Starting Design Document Generator Backend v0.7.1');
      console.log(`🔐 Environment: ${process.env.NODE_ENV || 'development'}`);

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
      this.server = this.app.listen(this.port, '0.0.0.0', () => {
        console.log(`📍 Server running on port ${this.port}`);
        console.log(`🌐 API available at http://0.0.0.0:${this.port}${this.apiPrefix}/${this.apiVersion}`);
        console.log(`💾 Database: ${databaseConfig.getDatabaseType()}`);
        console.log('✅ Server started successfully');
      });

    } catch (error) {
      console.error('❌ Server startup failed:', error);
      process.exit(1);
    }
  }
}

// Start the server
const server = new Server();
server.start();

export default Server; 