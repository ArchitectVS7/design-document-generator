// Supabase Proxy Service v0.7.0
// Acts as a secure API layer between frontend and Supabase
// Prevents exposure of private API keys to the client

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

class SupabaseProxy {
  constructor() {
    this.supabase = null;
    this.initialize();
  }

  // Initialize Supabase client with service role key (server-side only)
  initialize() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('❌ Supabase configuration missing. Please check your environment variables.');
      return;
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✅ Supabase proxy initialized');
  }

  // Get client for public operations (anon key)
  getPublicClient() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      throw new Error('Public Supabase configuration missing');
    }

    return createClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  // Configuration operations
  async createConfiguration(userId, configData) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await this.supabase
      .from('configurations')
      .insert({
        user_id: userId,
        name: configData.name,
        description: configData.description,
        config_data: configData.config_data,
        is_default: configData.is_default || false,
        is_public: configData.is_public || false,
        tags: configData.tags || []
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getConfigurationById(configId, userId) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await this.supabase
      .from('configurations')
      .select('*')
      .eq('id', configId)
      .or(`user_id.eq.${userId},is_public.eq.true`)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async getUserConfigurations(userId, includePublic = false) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    let query = this.supabase
      .from('configurations')
      .select('*')
      .eq('user_id', userId);

    if (includePublic) {
      query = this.supabase
        .from('configurations')
        .select('*')
        .or(`user_id.eq.${userId},is_public.eq.true`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async updateConfiguration(configId, userId, updateData) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const updateFields = {};
    if (updateData.name !== undefined) updateFields.name = updateData.name;
    if (updateData.description !== undefined) updateFields.description = updateData.description;
    if (updateData.config_data !== undefined) updateFields.config_data = updateData.config_data;
    if (updateData.is_default !== undefined) updateFields.is_default = updateData.is_default;
    if (updateData.is_public !== undefined) updateFields.is_public = updateData.is_public;
    if (updateData.tags !== undefined) updateFields.tags = updateData.tags;

    const { data, error } = await this.supabase
      .from('configurations')
      .update(updateFields)
      .eq('id', configId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async deleteConfiguration(configId, userId) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const { error } = await this.supabase
      .from('configurations')
      .delete()
      .eq('id', configId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  async getConfigurationStats(userId) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    // Get total configurations
    const { count: total, error: totalError } = await this.supabase
      .from('configurations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (totalError) throw totalError;

    // Get public configurations
    const { count: publicCount, error: publicError } = await this.supabase
      .from('configurations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_public', true);

    if (publicError) throw publicError;

    // Get default configurations
    const { count: defaultCount, error: defaultError } = await this.supabase
      .from('configurations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_default', true);

    if (defaultError) throw defaultError;

    return {
      total: total || 0,
      public: publicCount || 0,
      default: defaultCount || 0,
      private: (total || 0) - (publicCount || 0)
    };
  }

  // Session operations
  async createSession(sessionData) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await this.supabase
      .from('conversations')
      .insert(sessionData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getSessionById(sessionId, userId) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await this.supabase
      .from('conversations')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async getUserSessions(userId, params = {}) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    let query = this.supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (params.status) {
      query = query.eq('status', params.status);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    if (params.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 50) - 1);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateSession(sessionId, userId, updateData) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await this.supabase
      .from('conversations')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async deleteSession(sessionId, userId) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const { error } = await this.supabase
      .from('conversations')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }

  // History operations
  async getSessionHistory(sessionId) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await this.supabase
      .from('conversation_history')
      .select('*')
      .eq('conversation_id', sessionId)
      .order('step_order', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async addHistoryEntry(entryData) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await this.supabase
      .from('conversation_history')
      .insert(entryData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // User operations
  async createUser(userData) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await this.supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      user_metadata: {
        username: userData.username,
        role: userData.role || 'user'
      }
    });

    if (error) throw error;
    return data.user;
  }

  async getUserById(userId) {
    if (!this.supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await this.supabase.auth.admin.getUserById(userId);
    if (error) throw error;
    return data.user;
  }

  // Health check
  async healthCheck() {
    if (!this.supabase) {
      return { status: 'error', message: 'Supabase not initialized' };
    }

    try {
      const { data, error } = await this.supabase.from('configurations').select('count').limit(1);
      if (error) throw error;
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'supabase'
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
const supabaseProxy = new SupabaseProxy();

export default supabaseProxy; 