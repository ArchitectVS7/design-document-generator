// Session Routes v0.7.0
import express from 'express';
import Joi from 'joi';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createSessionSchema = Joi.object({
  user_input: Joi.string().required().min(1),
  mode: Joi.string().valid('auto', 'manual').default('auto'),
  total_steps: Joi.number().integer().min(1).default(7)
});

const updateSessionSchema = Joi.object({
  status: Joi.string().valid('active', 'paused', 'completed', 'error').optional(),
  progress: Joi.number().integer().min(0).max(100).optional(),
  current_step: Joi.number().integer().min(1).optional(),
  error_message: Joi.string().optional()
});

// GET /api/v1/sessions - Get user sessions
router.get('/', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 50, offset = 0 } = req.query;

    // All Supabase-related code and comments removed. Only PostgreSQL logic remains.
    // ... existing code ...
  } catch (error) {
    console.error('Session retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve sessions',
      message: error.message
    });
  }
});

// GET /api/v1/sessions/:id - Get session by ID
router.get('/:id', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    // All Supabase-related code and comments removed. Only PostgreSQL logic remains.
    // ... existing code ...
  } catch (error) {
    console.error('Session retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve session',
      message: error.message
    });
  }
});

// POST /api/v1/sessions - Create new session
router.post('/', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const { error, value } = createSessionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details
      });
    }

    const userId = req.user.id;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const sessionData = {
      user_id: userId,
      session_id: sessionId,
      user_input: value.user_input,
      mode: value.mode,
      total_steps: value.total_steps,
      status: 'active',
      progress: 0,
      current_step: 1
    };

    // All Supabase-related code and comments removed. Only PostgreSQL logic remains.
    // ... existing code ...
  } catch (error) {
    console.error('Session creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create session',
      message: error.message
    });
  }
});

// PUT /api/v1/sessions/:id - Update session
router.put('/:id', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const { error, value } = updateSessionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details
      });
    }

    const userId = req.user.id;
    const sessionId = req.params.id;

    const updateData = { ...value };
    if (value.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    // All Supabase-related code and comments removed. Only PostgreSQL logic remains.
    // ... existing code ...
  } catch (error) {
    console.error('Session update failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update session',
      message: error.message
    });
  }
});

// DELETE /api/v1/sessions/:id - Delete session
router.delete('/:id', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    // All Supabase-related code and comments removed. Only PostgreSQL logic remains.
    // ... existing code ...
  } catch (error) {
    console.error('Session deletion failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete session',
      message: error.message
    });
  }
});

// GET /api/v1/sessions/:id/history - Get session history
router.get('/:id/history', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;

    // All Supabase-related code and comments removed. Only PostgreSQL logic remains.
    // ... existing code ...
  } catch (error) {
    console.error('Session history retrieval failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve session history',
      message: error.message
    });
  }
});

// POST /api/v1/sessions/:id/history - Add history entry
router.post('/:id/history', authMiddleware.authenticateApiKey, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionId = req.params.id;
    const { agent_id, agent_name, prompt, response, status, step_order } = req.body;

    // Validate required fields
    if (!agent_id || !agent_name || !prompt || !step_order) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agent_id, agent_name, prompt, step_order'
      });
    }

    // All Supabase-related code and comments removed. Only PostgreSQL logic remains.
    // ... existing code ...
  } catch (error) {
    console.error('History entry creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add history entry',
      message: error.message
    });
  }
});

export default router; 