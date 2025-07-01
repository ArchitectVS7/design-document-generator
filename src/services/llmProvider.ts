// LLM Provider Abstraction v0.7.0

export interface LLMRequest {
  prompt: string;
  maxTokens: number;
  temperature: number;
  outputFormat: 'json' | 'markdown' | 'text';
  instructions?: string[];
  systemPrompt?: string;
}

export interface LLMResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    model: string;
    provider: string;
    timestamp: string;
    duration: number;
  };
}

export interface LLMProviderConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
}

export interface LLMProvider {
  // Core functionality
  complete(request: LLMRequest): Promise<LLMResponse>;
  
  // Configuration
  getConfig(): LLMProviderConfig;
  updateConfig(config: Partial<LLMProviderConfig>): void;
  
  // Health check
  isAvailable(): Promise<boolean>;
  
  // Cost estimation
  estimateCost(request: LLMRequest): Promise<{
    estimatedTokens: number;
    estimatedCost: number;
    currency: string;
  }>;
}

// Base LLM Provider implementation
export abstract class BaseLLMProvider implements LLMProvider {
  protected config: LLMProviderConfig;

  constructor(config: LLMProviderConfig) {
    this.config = {
      timeout: 30000,
      maxRetries: 3,
      ...config
    };
  }

  abstract complete(request: LLMRequest): Promise<LLMResponse>;

  getConfig(): LLMProviderConfig {
    return { ...this.config };
  }

  updateConfig(config: Partial<LLMProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Simple health check - try a minimal request
      const testRequest: LLMRequest = {
        prompt: "Hello",
        maxTokens: 10,
        temperature: 0,
        outputFormat: 'text'
      };
      
      await this.complete(testRequest);
      return true;
    } catch (error) {
      console.error('LLM Provider health check failed:', error);
      return false;
    }
  }

  async estimateCost(request: LLMRequest): Promise<{
    estimatedTokens: number;
    estimatedCost: number;
    currency: string;
  }> {
    // Default implementation - override in specific providers
    const estimatedTokens = Math.ceil(request.prompt.length / 4) + request.maxTokens;
    return {
      estimatedTokens,
      estimatedCost: 0, // Will be calculated by specific providers
      currency: 'USD'
    };
  }

  protected createResponse(
    content: string,
    usage: LLMResponse['usage'],
    metadata: Partial<LLMResponse['metadata']>
  ): LLMResponse {
    return {
      content,
      usage,
      metadata: {
        model: this.config.model,
        provider: this.config.provider,
        timestamp: new Date().toISOString(),
        duration: 0,
        ...metadata
      }
    };
  }

  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.maxRetries || 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}

// LLM Provider Factory
export class LLMProviderFactory {
  private static providers: Map<string, new (config: LLMProviderConfig) => LLMProvider> = new Map();

  static register(providerName: string, providerClass: new (config: LLMProviderConfig) => LLMProvider): void {
    this.providers.set(providerName, providerClass);
  }

  static create(providerName: string, config: LLMProviderConfig): LLMProvider {
    const ProviderClass = this.providers.get(providerName);
    if (!ProviderClass) {
      throw new Error(`Unknown LLM provider: ${providerName}`);
    }
    
    return new ProviderClass(config);
  }

  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Default provider configurations
export const DEFAULT_LLM_CONFIGS: Record<string, LLMProviderConfig> = {
  'mock': {
    provider: 'mock',
    model: 'mock-v1',
    timeout: 1000
  },
  'openai-gpt4': {
    provider: 'openai',
    model: 'gpt-4',
    timeout: 30000
  },
  'openai-gpt35': {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    timeout: 30000
  },
  'claude-3-sonnet': {
    provider: 'anthropic',
    model: 'claude-3-sonnet-20240229',
    timeout: 30000
  },
  'claude-3-haiku': {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    timeout: 30000
  }
};

export class AnthropicLLMProvider extends BaseLLMProvider {
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch('/api/v1/llm/anthropic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Anthropic LLM proxy error');
    }
    const data = await response.json();
    // Map Anthropic API response to LLMResponse shape
    return {
      content: data.content?.[0]?.text || '',
      usage: {
        promptTokens: data.usage?.input_tokens || 0,
        completionTokens: data.usage?.output_tokens || 0,
        totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      },
      metadata: {
        model: data.model || 'claude-3-sonnet-20240229',
        provider: 'anthropic',
        timestamp: new Date().toISOString(),
        duration: 0
      }
    };
  }
}

LLMProviderFactory.register('anthropic', AnthropicLLMProvider); 