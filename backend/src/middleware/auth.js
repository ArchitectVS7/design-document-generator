// Authentication Middleware v0.7.0
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import databaseConfig from '../config/database.js';
import crypto from 'crypto';

class AuthMiddleware {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-jwt-secret';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  // API Key authentication middleware
  async authenticateApiKey(req, res, next) {
    try {
      const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
      
      if (!apiKey) {
        return res.status(401).json({
          error: 'API key required',
          message: 'Please provide a valid API key in the x-api-key header or Authorization header'
        });
      }

      const isValidKey = await this.validateApiKey(apiKey);
      if (!isValidKey) {
        return res.status(401).json({
          error: 'Invalid API key',
          message: 'The provided API key is invalid or expired'
        });
      }

      // Add user info to request
      req.user = isValidKey.user;
      req.apiKey = isValidKey.key;
      next();
    } catch (error) {
      console.error('API key authentication failed:', error);
      return res.status(500).json({
        error: 'Authentication error',
        message: 'An error occurred during authentication'
      });
    }
  }

  // Validate API key against database
  async validateApiKey(apiKey) {
    try {
      const dbType = databaseConfig.getDatabaseType();
      
      if (dbType === 'postgresql') {
        const connection = databaseConfig.getConnection();
        const query = `
          SELECT ak.*, u.id as user_id, u.username, u.email, u.role
          FROM api_keys ak
          JOIN users u ON ak.user_id = u.id
          WHERE ak.key_hash = $1 AND ak.is_active = true
          AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
        `;
        
        const result = await connection.query(query, [apiKey]);
        if (result.rows.length === 0) return null;
        
        const keyData = result.rows[0];
        
        // Update last used timestamp
        await connection.query(
          'UPDATE api_keys SET last_used = NOW() WHERE id = $1',
          [keyData.id]
        );
        
        return {
          key: keyData,
          user: {
            id: keyData.user_id,
            username: keyData.username,
            email: keyData.email,
            role: keyData.role
          }
        };
      } else {
        // Supabase implementation
        const supabase = databaseConfig.getConnection();
        const { data, error } = await supabase
          .from('api_keys')
          .select(`
            *,
            users!inner(id, username, email, role)
          `)
          .eq('key_hash', apiKey)
          .eq('is_active', true)
          .gte('expires_at', new Date().toISOString())
          .single();
        
        if (error || !data) return null;
        
        // Update last used timestamp
        await supabase
          .from('api_keys')
          .update({ last_used: new Date().toISOString() })
          .eq('id', data.id);
        
        return {
          key: data,
          user: data.users
        };
      }
    } catch (error) {
      console.error('API key validation failed:', error);
      return null;
    }
  }

  // JWT authentication middleware
  authenticateJWT(req, res, next) {
    try {
      const token = req.headers['authorization']?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          error: 'JWT token required',
          message: 'Please provide a valid JWT token in the Authorization header'
        });
      }

      const decoded = jwt.verify(token, this.jwtSecret);
      req.user = decoded;
      next();
    } catch (error) {
      console.error('JWT authentication failed:', error);
      return res.status(401).json({
        error: 'Invalid JWT token',
        message: 'The provided JWT token is invalid or expired'
      });
    }
  }

  // Session authentication middleware
  authenticateSession(req, res, next) {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        error: 'Session required',
        message: 'Please log in to access this resource'
      });
    }
    
    req.user = {
      id: req.session.userId,
      username: req.session.username,
      role: req.session.role
    };
    next();
  }

  // Admin role check middleware
  requireAdmin(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate to access this resource'
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Admin access required',
        message: 'This resource requires admin privileges'
      });
    }

    next();
  }

  // User ownership check middleware
  requireOwnership(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate to access this resource'
      });
    }

    const resourceUserId = req.params.userId || req.body.userId;
    
    if (req.user.role !== 'admin' && req.user.id !== resourceUserId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
    }

    next();
  }

  // Generate JWT token
  generateJWT(user) {
    return jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );
  }

  // Hash password
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Generate API key
  generateApiKey() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash API key for storage
  hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  // Rate limiting helper
  createRateLimitKey(req) {
    const identifier = req.user?.id || req.ip;
    return `rate_limit:${identifier}:${req.path}`;
  }

  // Log authentication attempt
  logAuthAttempt(req, success, method) {
    const logData = {
      timestamp: new Date().toISOString(),
      ip: req.ip,
      method: method,
      success: success,
      userAgent: req.get('User-Agent'),
      path: req.path
    };

    if (req.user) {
      logData.userId = req.user.id;
      logData.username = req.user.username;
    }

    console.log('🔐 Auth attempt:', logData);
  }
}

export default new AuthMiddleware(); 