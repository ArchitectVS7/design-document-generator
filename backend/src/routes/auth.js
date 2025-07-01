// Authentication Routes v0.7.0
import express from 'express';
import Joi from 'joi';
import userService from '../services/userService.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().required().min(3).max(50).alphanum(),
  email: Joi.string().required().email(),
  password: Joi.string().required().min(8).max(100),
  role: Joi.string().valid('user', 'admin').default('user')
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required()
});

const createApiKeySchema = Joi.object({
  keyName: Joi.string().required().min(1).max(100),
  permissions: Joi.array().items(Joi.string()).default([])
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().required().min(8).max(100)
});

// POST /api/v1/auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details
      });
    }

    // Check if user already exists
    const { usernameExists, emailExists } = await userService.checkUserExists(
      value.username, 
      value.email
    );

    if (usernameExists) {
      return res.status(409).json({
        success: false,
        error: 'Username already exists'
      });
    }

    if (emailExists) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists'
      });
    }

    // Create user
    const user = await userService.createUser(value);

    // Generate JWT token
    const token = authMiddleware.generateJWT(user);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('User registration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
      message: error.message
    });
  }
});

// POST /api/v1/auth/login - User login
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details
      });
    }

    // Authenticate user
    const user = await userService.authenticateUser(value.username, value.password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = authMiddleware.generateJWT(user);

    // Log successful authentication
    authMiddleware.logAuthAttempt(req, true, 'login');

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('User login failed:', error);
    
    // Log failed authentication
    authMiddleware.logAuthAttempt(req, false, 'login');
    
    res.status(500).json({
      success: false,
      error: 'Failed to authenticate user',
      message: error.message
    });
  }
});

// POST /api/v1/auth/api-key - Create API key
router.post('/api-key', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const { error, value } = createApiKeySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details
      });
    }

    const userId = req.user.id;
    const apiKeyData = await userService.createApiKey(
      userId, 
      value.keyName, 
      value.permissions
    );

    res.status(201).json({
      success: true,
      data: {
        id: apiKeyData.id,
        keyName: apiKeyData.keyName,
        permissions: apiKeyData.permissions,
        apiKey: apiKeyData.apiKey, // Only returned once
        createdAt: apiKeyData.created_at
      },
      message: 'API key created successfully'
    });
  } catch (error) {
    console.error('API key creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create API key',
      message: error.message
    });
  }
});

// GET /api/v1/auth/api-keys - Get user's API keys
router.get('/api-keys', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const apiKeys = await userService.getUserApiKeys(userId);

    res.json({
      success: true,
      data: apiKeys.map(key => ({
        id: key.id,
        keyName: key.key_name,
        permissions: key.permissions,
        isActive: key.is_active,
        lastUsed: key.last_used,
        expiresAt: key.expires_at,
        createdAt: key.created_at
      })),
      count: apiKeys.length
    });
  } catch (error) {
    console.error('API key retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve API keys',
      message: error.message
    });
  }
});

// DELETE /api/v1/auth/api-keys/:id - Revoke API key
router.delete('/api-keys/:id', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const apiKeyId = req.params.id;

    const revoked = await userService.revokeApiKey(apiKeyId, userId);

    if (!revoked) {
      return res.status(404).json({
        success: false,
        error: 'API key not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'API key revoked successfully'
    });
  } catch (error) {
    console.error('API key revocation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke API key',
      message: error.message
    });
  }
});

// GET /api/v1/auth/profile - Get user profile
router.get('/profile', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user statistics
    const stats = await userService.getUserStats(userId);

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        },
        stats
      }
    });
  } catch (error) {
    console.error('Profile retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile',
      message: error.message
    });
  }
});

// PUT /api/v1/auth/profile - Update user profile
router.put('/profile', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, role } = req.body;

    // Validate input
    if (username && (username.length < 3 || username.length > 50)) {
      return res.status(400).json({
        success: false,
        error: 'Username must be between 3 and 50 characters'
      });
    }

    if (email && !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Check if new username/email already exists
    if (username || email) {
      const { usernameExists, emailExists } = await userService.checkUserExists(
        username || req.user.username, 
        email || req.user.email
      );

      if (username && usernameExists && username !== req.user.username) {
        return res.status(409).json({
          success: false,
          error: 'Username already exists'
        });
      }

      if (email && emailExists && email !== req.user.email) {
        return res.status(409).json({
          success: false,
          error: 'Email already exists'
        });
      }
    }

    const updatedUser = await userService.updateUser(userId, { username, email, role });

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          isActive: updatedUser.is_active,
          createdAt: updatedUser.created_at,
          updatedAt: updatedUser.updated_at
        }
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: error.message
    });
  }
});

// POST /api/v1/auth/change-password - Change password
router.post('/change-password', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details
      });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = value;

    const success = await userService.changePassword(userId, currentPassword, newPassword);

    if (!success) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Password change failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      message: error.message
    });
  }
});

// POST /api/v1/auth/logout - Logout (client-side token removal)
router.post('/logout', authMiddleware.authenticateApiKey, (req, res) => {
  // Log the logout attempt
  authMiddleware.logAuthAttempt(req, true, 'logout');
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

export default router; 