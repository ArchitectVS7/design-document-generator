// Database Integration Hook v0.7.0
// Provides React hooks for database operations

import { useState, useCallback, useEffect } from 'react';
import apiClient, { 
  ApiResponse, 
  ConfigurationData, 
  SessionData, 
  HistoryEntry 
} from '../services/apiClient';

export interface UseDatabaseState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface UseDatabaseReturn<T> extends UseDatabaseState<T> {
  refetch: () => Promise<void>;
  clearError: () => void;
}

// Hook for managing configurations
export const useConfigurations = (includePublic = false): UseDatabaseReturn<ConfigurationData[]> => {
  const [state, setState] = useState<UseDatabaseState<ConfigurationData[]>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const fetchConfigurations = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiClient.getConfigurations(includePublic);
      
      if (response.success && response.data) {
        setState({
          data: response.data,
          loading: false,
          error: null,
          success: true,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch configurations',
          success: false,
        });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
    }
  }, [includePublic]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  return {
    ...state,
    refetch: fetchConfigurations,
    clearError,
  };
};

// Hook for managing a single configuration
export const useConfiguration = (id: string | null): UseDatabaseReturn<ConfigurationData> => {
  const [state, setState] = useState<UseDatabaseState<ConfigurationData>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const fetchConfiguration = useCallback(async () => {
    if (!id) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiClient.getConfiguration(id);
      
      if (response.success && response.data) {
        setState({
          data: response.data,
          loading: false,
          error: null,
          success: true,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch configuration',
          success: false,
        });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
    }
  }, [id]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    fetchConfiguration();
  }, [fetchConfiguration]);

  return {
    ...state,
    refetch: fetchConfiguration,
    clearError,
  };
};

// Hook for configuration operations
export const useConfigurationOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createConfiguration = useCallback(async (configData: {
    name: string;
    description?: string;
    config_data: any;
    is_default?: boolean;
    is_public?: boolean;
    tags?: string[];
  }): Promise<ConfigurationData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.createConfiguration(configData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to create configuration');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfiguration = useCallback(async (
    id: string,
    updateData: Partial<{
      name: string;
      description: string;
      config_data: any;
      is_default: boolean;
      is_public: boolean;
      tags: string[];
    }>
  ): Promise<ConfigurationData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.updateConfiguration(id, updateData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to update configuration');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteConfiguration = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.deleteConfiguration(id);
      
      if (response.success) {
        return true;
      } else {
        setError(response.error || 'Failed to delete configuration');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createConfiguration,
    updateConfiguration,
    deleteConfiguration,
    clearError,
  };
};

// Hook for managing sessions
export const useSessions = (params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): UseDatabaseReturn<SessionData[]> => {
  const [state, setState] = useState<UseDatabaseState<SessionData[]>>({
    data: null,
    loading: false,
    error: null,
    success: false,
  });

  const fetchSessions = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiClient.getSessions(params);
      
      if (response.success && response.data) {
        setState({
          data: response.data,
          loading: false,
          error: null,
          success: true,
        });
      } else {
        setState({
          data: null,
          loading: false,
          error: response.error || 'Failed to fetch sessions',
          success: false,
        });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      });
    }
  }, [params]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return {
    ...state,
    refetch: fetchSessions,
    clearError,
  };
};

// Hook for session operations
export const useSessionOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async (sessionData: {
    user_input: string;
    mode?: 'auto' | 'manual';
    total_steps?: number;
  }): Promise<SessionData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.createSession(sessionData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to create session');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSession = useCallback(async (
    id: string,
    updateData: Partial<{
      status: 'active' | 'paused' | 'completed' | 'error';
      progress: number;
      current_step: number;
      error_message: string;
    }>
  ): Promise<SessionData | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.updateSession(id, updateData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to update session');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addHistoryEntry = useCallback(async (
    sessionId: string,
    entryData: {
      agent_id: number;
      agent_name: string;
      prompt: string;
      response?: string;
      status?: 'pending' | 'completed' | 'failed';
      step_order: number;
    }
  ): Promise<HistoryEntry | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.addHistoryEntry(sessionId, entryData);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to add history entry');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createSession,
    updateSession,
    addHistoryEntry,
    clearError,
  };
};

// Hook for API connection status
export const useApiStatus = () => {
  const [status, setStatus] = useState<{
    connected: boolean;
    loading: boolean;
    error: string | null;
  }>({
    connected: false,
    loading: true,
    error: null,
  });

  const checkStatus = useCallback(async () => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await apiClient.healthCheck();
      
      if (response.success) {
        setStatus({
          connected: true,
          loading: false,
          error: null,
        });
      } else {
        setStatus({
          connected: false,
          loading: false,
          error: response.error || 'API not responding',
        });
      }
    } catch (error) {
      setStatus({
        connected: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }, []);

  useEffect(() => {
    checkStatus();
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return {
    ...status,
    refetch: checkStatus,
  };
}; 