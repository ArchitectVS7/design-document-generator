// Configuration Routes v0.7.0
import express from 'express';
import Joi from 'joi';
import configurationService from '../services/configurationService.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createConfigurationSchema = Joi.object({
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().max(1000).optional(),
  config_data: Joi.object().required(),
  is_default: Joi.boolean().default(false),
  is_public: Joi.boolean().default(false),
  tags: Joi.array().items(Joi.string()).default([])
});

const updateConfigurationSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).optional(),
  config_data: Joi.object().optional(),
  is_default: Joi.boolean().optional(),
  is_public: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string()).optional()
});

// GET /api/v1/configurations - Get all configurations for user
router.get('/', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const { includePublic = false } = req.query;
    
    const configurations = await configurationService.getUserConfigurations(
      userId, 
      includePublic === 'true'
    );

    res.json({
      success: true,
      data: configurations,
      count: configurations.length
    });
  } catch (error) {
    console.error('Configuration retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configurations',
      message: error.message
    });
  }
});

// GET /api/v1/configurations/:id - Get configuration by ID
router.get('/:id', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const configId = req.params.id;

    const configuration = await configurationService.getConfigurationById(configId, userId);

    if (!configuration) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found'
      });
    }

    res.json({
      success: true,
      data: configuration
    });
  } catch (error) {
    console.error('Configuration retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configuration',
      message: error.message
    });
  }
});

// POST /api/v1/configurations - Create new configuration
router.post('/', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const { error, value } = createConfigurationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details
      });
    }

    const userId = req.user.id;
    const configuration = await configurationService.createConfiguration(userId, value);

    res.status(201).json({
      success: true,
      data: configuration,
      message: 'Configuration created successfully'
    });
  } catch (error) {
    console.error('Configuration creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create configuration',
      message: error.message
    });
  }
});

// PUT /api/v1/configurations/:id - Update configuration
router.put('/:id', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const { error, value } = updateConfigurationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details
      });
    }

    const userId = req.user.id;
    const configId = req.params.id;

    const configuration = await configurationService.updateConfiguration(configId, userId, value);

    if (!configuration) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found or access denied'
      });
    }

    res.json({
      success: true,
      data: configuration,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    console.error('Configuration update failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration',
      message: error.message
    });
  }
});

// DELETE /api/v1/configurations/:id - Delete configuration
router.delete('/:id', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const configId = req.params.id;

    const deleted = await configurationService.deleteConfiguration(configId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found or access denied'
      });
    }

    res.json({
      success: true,
      message: 'Configuration deleted successfully'
    });
  } catch (error) {
    console.error('Configuration deletion failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete configuration',
      message: error.message
    });
  }
});

// POST /api/v1/configurations/:id/export - Export configuration
router.post('/:id/export', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const configId = req.params.id;

    const configuration = await configurationService.exportConfiguration(configId, userId);

    if (!configuration) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found or access denied'
      });
    }

    res.json({
      success: true,
      data: configuration,
      message: 'Configuration exported successfully'
    });
  } catch (error) {
    console.error('Configuration export failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export configuration',
      message: error.message
    });
  }
});

// POST /api/v1/configurations/import - Import configuration
router.post('/import', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const { jsonData } = req.body;

    if (!jsonData) {
      return res.status(400).json({
        success: false,
        error: 'Configuration data is required'
      });
    }

    const configuration = await configurationService.importConfiguration(userId, jsonData);

    res.status(201).json({
      success: true,
      data: configuration,
      message: 'Configuration imported successfully'
    });
  } catch (error) {
    console.error('Configuration import failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import configuration',
      message: error.message
    });
  }
});

// POST /api/v1/configurations/:id/duplicate - Duplicate configuration
router.post('/:id/duplicate', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const configId = req.params.id;
    const { name, description } = req.body;

    // Get original configuration
    const originalConfig = await configurationService.getConfigurationById(configId, userId);
    if (!originalConfig) {
      return res.status(404).json({
        success: false,
        error: 'Configuration not found or access denied'
      });
    }

    // Create duplicate with new name
    const duplicateData = {
      name: name || `${originalConfig.name} (Copy)`,
      description: description || originalConfig.description,
      config_data: originalConfig.config_data,
      is_default: false,
      is_public: false,
      tags: originalConfig.tags || []
    };

    const duplicatedConfig = await configurationService.createConfiguration(userId, duplicateData);

    res.status(201).json({
      success: true,
      data: duplicatedConfig,
      message: 'Configuration duplicated successfully'
    });
  } catch (error) {
    console.error('Configuration duplication failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to duplicate configuration',
      message: error.message
    });
  }
});

// GET /api/v1/configurations/stats - Get configuration statistics
router.get('/stats', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const stats = await configurationService.getConfigurationStats(userId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Configuration stats retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configuration statistics',
      message: error.message
    });
  }
});

export default router; 