// API Client Service v0.7.1 - Optimized for Render Deployment
// Handles communication with the backend API

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: any[];
  count?: number;
}

export interface ConfigurationData {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  version: string;
  config_data: any;
  is_default: boolean;
  is_public: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SessionData {
  id: string;
  user_id: string;
  session_id: string;
  user_input: string;
  status: 'active' | 'paused' | 'completed' | 'error';
  mode: 'auto' | 'manual';
  progress: number;
  total_steps: number;
  current_step: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface HistoryEntry {
  id: string;
  conversation_id: string;
  agent_id: number;
  agent_name: string;
  prompt: string;
  response?: string;
  status: 'pending' | 'completed' | 'failed';
  step_order: number;
  created_at: string;
  updated_at: string;
}

class ApiClient {
  private baseUrl: string;
  private apiKey: string | null = null;
  private requestIdCounter = 0;

  constructor() {
    // Dynamic base URL configuration
    this.baseUrl = this.getBaseUrl();
    this.loadApiKey();
    
    // Log the API URL in development
    if (import.meta.env.DEV) {
      console.log('API Client initialized with base URL:', this.baseUrl);
    }
  }

  // Determine the base URL based on environment
  private getBaseUrl(): string {
    // If VITE_API_URL is set, use it
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    
    // In production on Render, use relative URL (same origin)
    if (import.meta.env.PROD) {
      // This assumes frontend and backend are on different services
      // Backend URL will be injected via environment variable during build
      return window.location.origin.replace(
        'design-doc-generator-frontend',
        'design-doc-generator-api'
      );
    }
    
    // Default to localhost for development
    return 'http://localhost:3001';
  }

  // Load API key from localStorage
  private loadApiKey(): void {
    this.apiKey = localStorage.getItem('ddg_api_key');
  }

  // Set API key
  public setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    localStorage.setItem('ddg_api_key', apiKey);
  }

  // Clear API key
  public clearApiKey(): void {
    this.apiKey = null;
    localStorage.removeItem('ddg_api_key');
  }

  // Get API key
  public getApiKey(): string | null {
    return this.apiKey;
  }

  // Generate request ID for tracking
  private generateRequestId(): string {
    this.requestIdCounter++;
    return `${Date.now()}-${this.requestIdCounter}`;
  }

  // Make HTTP request with enhanced error handling
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...options.headers,
      };

      // Add API key if available
      if (this.apiKey) {
        (headers as any)['x-api-key'] = this.apiKey;
      }

      // Log request in development
      if (import.meta.env.DEV) {
        console.log(`[${requestId}] API Request:`, {
          method: options.method || 'GET',
          url,
          headers: { ...headers, 'x-api-key': '***' }, // Hide API key
        });
      }

      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Include cookies for session management
      });

      const duration = Date.now() - startTime;
      const data = await response.json();

      // Log response in development
      if (import.meta.env.DEV) {
        console.log(`[${requestId}] API Response:`, {
          status: response.status,
          duration: `${duration}ms`,
          success: data.success,
        });
      }

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 401) {
          // Unauthorized - clear API key
          this.clearApiKey();
        }
        
        throw new Error(
          data.error || data.message || `HTTP ${response.status} - ${response.statusText}`
        );
      }

      return data;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Enhanced error logging
      console.error(`[${requestId}] API request failed after ${duration}ms:`, error);
      
      // Check for network errors
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        return {
          success: false,
          error: 'Network error - Unable to connect to server',
          message: 'Please check your internet connection and try again',
        };
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  // Configuration API methods
  public async getConfigurations(includePublic = false): Promise<ApiResponse<ConfigurationData[]>> {
    return this.request<ConfigurationData[]>(`/api/v1/configurations?includePublic=${includePublic}`);
  }

  public async getConfiguration(id: string): Promise<ApiResponse<ConfigurationData>> {
    return this.request<ConfigurationData>(`/api/v1/configurations/${id}`);
  }

  public async createConfiguration(configData: {
    name: string;
    description?: string;
    config_data: any;
    is_default?: boolean;
    is_public?: boolean;
    tags?: string[];
  }): Promise<ApiResponse<ConfigurationData>> {
    return this.request<ConfigurationData>('/api/v1/configurations', {
      method: 'POST',
      body: JSON.stringify(configData),
    });
  }

  public async updateConfiguration(
    id: string,
    updateData: Partial<{
      name: string;
      description: string;
      config_data: any;
      is_default: boolean;
      is_public: boolean;
      tags: string[];
    }>
  ): Promise<ApiResponse<ConfigurationData>> {
    return this.request<ConfigurationData>(`/api/v1/configurations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  public async deleteConfiguration(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/v1/configurations/${id}`, {
      method: 'DELETE',
    });
  }

  public async exportConfiguration(id: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/api/v1/configurations/${id}/export`, {
      method: 'POST',
    });
  }

  public async importConfiguration(jsonData: any): Promise<ApiResponse<ConfigurationData>> {
    return this.request<ConfigurationData>('/api/v1/configurations/import', {
      method: 'POST',
      body: JSON.stringify({ jsonData }),
    });
  }

  public async duplicateConfiguration(
    id: string,
    name?: string,
    description?: string
  ): Promise<ApiResponse<ConfigurationData>> {
    return this.request<ConfigurationData>(`/api/v1/configurations/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  }

  public async getConfigurationStats(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/v1/configurations/stats');
  }

  // Session API methods
  public async getSessions(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<SessionData[]>> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.offset) searchParams.append('offset', params.offset.toString());

    const query = searchParams.toString();
    return this.request<SessionData[]>(`/api/v1/sessions${query ? `?${query}` : ''}`);
  }

  public async getSession(id: string): Promise<ApiResponse<SessionData>> {
    return this.request<SessionData>(`/api/v1/sessions/${id}`);
  }

  public async createSession(sessionData: {
    user_input: string;
    mode?: 'auto' | 'manual';
    total_steps?: number;
  }): Promise<ApiResponse<SessionData>> {
    return this.request<SessionData>('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  }

  public async updateSession(
    id: string,
    updateData: Partial<{
      status: 'active' | 'paused' | 'completed' | 'error';
      progress: number;
      current_step: number;
      error_message: string;
    }>
  ): Promise<ApiResponse<SessionData>> {
    return this.request<SessionData>(`/api/v1/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  public async deleteSession(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/v1/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  public async getSessionHistory(id: string): Promise<ApiResponse<HistoryEntry[]>> {
    return this.request<HistoryEntry[]>(`/api/v1/sessions/${id}/history`);
  }

  public async addHistoryEntry(
    sessionId: string,
    entryData: {
      agent_id: number;
      agent_name: string;
      prompt: string;
      response?: string;
      status?: 'pending' | 'completed' | 'failed';
      step_order: number;
    }
  ): Promise<ApiResponse<HistoryEntry>> {
    return this.request<HistoryEntry>(`/api/v1/sessions/${sessionId}/history`, {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  // Authentication API methods
  public async login(credentials: { username: string; password: string }): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request<{ token: string; user: any }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  public async register(userData: {
    username: string;
    email: string;
    password: string;
    role?: 'user' | 'admin';
  }): Promise<ApiResponse<{ token: string; user: any }>> {
    return this.request<{ token: string; user: any }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  public async createApiKey(apiKeyData: {
    keyName: string;
    permissions?: string[];
  }): Promise<ApiResponse<{ apiKey: string; id: string; keyName: string }>> {
    return this.request<{ apiKey: string; id: string; keyName: string }>('/api/v1/auth/api-key', {
      method: 'POST',
      body: JSON.stringify(apiKeyData),
    });
  }

  public async getApiKeys(): Promise<ApiResponse<any[]>> {
    return this.request<any[]>('/api/v1/auth/api-keys');
  }

  public async deleteApiKey(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/v1/auth/api-keys/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check with retry
  public async healthCheck(): Promise<ApiResponse<any>> {
    const maxRetries = 3;
    let lastError: any;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await this.request<any>('/health');
        if (response.success) {
          return response;
        }
        lastError = response.error;
      } catch (error) {
        lastError = error;
      }
      
      // Wait before retry (exponential backoff)
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
    
    return {
      success: false,
      error: lastError || 'Health check failed after multiple attempts',
    };
  }

  // API status
  public async getApiStatus(): Promise<ApiResponse<any>> {
    return this.request<any>('/api/status');
  }

  // Update base URL (useful for environment switching)
  public updateBaseUrl(newUrl: string): void {
    this.baseUrl = newUrl;
    if (import.meta.env.DEV) {
      console.log('API Client base URL updated to:', this.baseUrl);
    }
  }
}

// Create singleton instance
const apiClient = new ApiClient();

// Export for debugging in development
if (import.meta.env.DEV) {
  (window as any).apiClient = apiClient;
}

export default apiClient; 