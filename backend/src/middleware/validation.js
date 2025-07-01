// Validation Middleware v0.7.0
import Joi from 'joi';

// Common validation schemas
export const commonSchemas = {
  uuid: Joi.string().uuid().required(),
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(50),
    offset: Joi.number().integer().min(0).default(0)
  }),
  search: Joi.object({
    query: Joi.string().min(1).max(255).required()
  })
};

// Configuration validation schemas
export const configurationSchemas = {
  create: Joi.object({
    name: Joi.string().required().min(1).max(255),
    description: Joi.string().max(1000).optional(),
    config_data: Joi.object().required(),
    is_default: Joi.boolean().default(false),
    is_public: Joi.boolean().default(false),
    tags: Joi.array().items(Joi.string()).default([])
  }),
  
  update: Joi.object({
    name: Joi.string().min(1).max(255).optional(),
    description: Joi.string().max(1000).optional(),
    config_data: Joi.object().optional(),
    is_default: Joi.boolean().optional(),
    is_public: Joi.boolean().optional(),
    tags: Joi.array().items(Joi.string()).optional()
  }),
  
  import: Joi.object({
    jsonData: Joi.object().required()
  })
};

// Session validation schemas
export const sessionSchemas = {
  create: Joi.object({
    user_input: Joi.string().required().min(1),
    mode: Joi.string().valid('auto', 'manual').default('auto'),
    total_steps: Joi.number().integer().min(1).default(7)
  }),
  
  update: Joi.object({
    status: Joi.string().valid('active', 'paused', 'completed', 'error').optional(),
    progress: Joi.number().integer().min(0).max(100).optional(),
    current_step: Joi.number().integer().min(1).optional(),
    error_message: Joi.string().optional()
  }),
  
  historyEntry: Joi.object({
    agent_id: Joi.number().integer().min(1).required(),
    agent_name: Joi.string().required().min(1).max(255),
    prompt: Joi.string().required().min(1),
    response: Joi.string().optional(),
    status: Joi.string().valid('pending', 'completed', 'failed').default('pending'),
    step_order: Joi.number().integer().min(1).required()
  })
};

// Authentication validation schemas
export const authSchemas = {
  register: Joi.object({
    username: Joi.string().required().min(3).max(50).alphanum(),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8).max(100),
    role: Joi.string().valid('user', 'admin').default('user')
  }),
  
  login: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
  }),
  
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().required().min(8).max(100)
  }),
  
  createApiKey: Joi.object({
    keyName: Joi.string().required().min(1).max(100),
    permissions: Joi.array().items(Joi.string()).default([])
  })
};

// Validation middleware factory
export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errorDetails
      });
    }

    // Replace request data with validated data
    req[property] = value;
    next();
  };
};

// Custom validation middleware for specific use cases
export const validateConfiguration = {
  create: validate(configurationSchemas.create),
  update: validate(configurationSchemas.update),
  import: validate(configurationSchemas.import)
};

export const validateSession = {
  create: validate(sessionSchemas.create),
  update: validate(sessionSchemas.update),
  historyEntry: validate(sessionSchemas.historyEntry)
};

export const validateAuth = {
  register: validate(authSchemas.register),
  login: validate(authSchemas.login),
  changePassword: validate(authSchemas.changePassword),
  createApiKey: validate(authSchemas.createApiKey)
};

// Query parameter validation
export const validateQuery = (schema) => {
  return validate(schema, 'query');
};

// URL parameter validation
export const validateParams = (schema) => {
  return validate(schema, 'params');
};

// Custom validators
export const customValidators = {
  // Validate UUID parameter
  validateUuid: (req, res, next) => {
    const { error } = commonSchemas.uuid.validate(req.params.id);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid UUID format',
        message: 'The provided ID is not a valid UUID'
      });
    }
    next();
  },

  // Validate pagination parameters
  validatePagination: validateQuery(commonSchemas.pagination),

  // Validate search query
  validateSearch: validateQuery(commonSchemas.search)
};

export default {
  validate,
  validateConfiguration,
  validateSession,
  validateAuth,
  validateQuery,
  validateParams,
  customValidators,
  schemas: {
    common: commonSchemas,
    configuration: configurationSchemas,
    session: sessionSchemas,
    auth: authSchemas
  }
}; 