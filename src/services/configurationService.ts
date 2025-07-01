// Configuration Service v0.7.0
// Handles save/load configuration functionality with file import/export

import { ConfigurationFile, ConfigurationSaveOptions, ConfigurationLoadOptions } from '../types/configuration';
import { validateConfigurationSchema, checkCompatibility } from '../utils/validation';

// Local storage keys
const STORAGE_KEYS = {
  CONFIGURATIONS: 'ddg_configurations',
  CURRENT_CONFIG: 'ddg_current_config',
  SESSION_ID: 'ddg_session_id'
};

// Configuration service class
export class ConfigurationService {
  private static instance: ConfigurationService;
  private sessionId: string;

  private constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  public static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  // Save configuration to local storage and optionally download file
  public async saveConfiguration(
    config: ConfigurationFile, 
    options: ConfigurationSaveOptions = {}
  ): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Validate configuration before saving
      const validation = validateConfigurationSchema(config);
      if (!validation.valid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Update configuration metadata
      const configToSave: ConfigurationFile = {
        ...config,
        header: {
          ...config.header,
          modified: new Date().toISOString(),
          description: options.description || config.header.description
        }
      };

      // Save to local storage
      const configId = await this.saveToLocalStorage(configToSave);

      // Download file if requested
      if (options.downloadFile !== false) {
        this.downloadConfigurationFile(configToSave);
      }

      console.log('Configuration saved successfully:', configId);
      return { success: true, id: configId };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save configuration';
      console.error('Save configuration error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Load configuration from local storage or file
  public async loadConfiguration(
    source: 'local' | 'file' | 'id',
    identifier?: string | File,
    options: ConfigurationLoadOptions = {}
  ): Promise<{ success: boolean; config?: ConfigurationFile; error?: string }> {
    try {
      let configData: ConfigurationFile;

      switch (source) {
        case 'local':
          configData = await this.loadFromLocalStorage(identifier as string);
          break;
        case 'file':
          configData = await this.loadFromFile(identifier as File);
          break;
        case 'id':
          configData = await this.loadFromLocalStorage(identifier as string);
          break;
        default:
          throw new Error('Invalid load source');
      }

      // Validate schema if requested
      if (options.validateSchema !== false) {
        const validation = validateConfigurationSchema(configData);
        if (!validation.valid) {
          throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Check compatibility if requested
      if (options.checkCompatibility !== false) {
        const compatibility = checkCompatibility(configData);
        if (!compatibility.compatible) {
          throw new Error(`Configuration is not compatible: ${compatibility.warnings.join(', ')}`);
        }
      }

      console.log('Configuration loaded successfully');
      return { success: true, config: configData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load configuration';
      console.error('Load configuration error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Get list of saved configurations
  public async getSavedConfigurations(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    version: string;
    created: string;
    modified: string;
  }>> {
    try {
      const savedConfigs = localStorage.getItem(STORAGE_KEYS.CONFIGURATIONS);
      if (!savedConfigs) {
        return [];
      }

      const configs = JSON.parse(savedConfigs);
      return Object.entries(configs).map(([id, config]: [string, any]) => ({
        id,
        name: config.header.description || `Configuration ${id}`,
        description: config.header.description,
        version: config.header.version,
        created: config.header.created,
        modified: config.header.modified
      }));
    } catch (error) {
      console.error('Error getting saved configurations:', error);
      return [];
    }
  }

  // Delete saved configuration
  public async deleteConfiguration(configId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const savedConfigs = localStorage.getItem(STORAGE_KEYS.CONFIGURATIONS);
      if (!savedConfigs) {
        return { success: false, error: 'No saved configurations found' };
      }

      const configs = JSON.parse(savedConfigs);
      if (!configs[configId]) {
        return { success: false, error: 'Configuration not found' };
      }

      delete configs[configId];
      localStorage.setItem(STORAGE_KEYS.CONFIGURATIONS, JSON.stringify(configs));

      console.log('Configuration deleted successfully:', configId);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete configuration';
      console.error('Delete configuration error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Export configuration to file
  public downloadConfigurationFile(config: ConfigurationFile, filename?: string): void {
    try {
      const blob = new Blob([JSON.stringify(config, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || `agent-config-v${config.header.version}-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log('Configuration file downloaded successfully');
    } catch (error) {
      console.error('Error downloading configuration file:', error);
    }
  }

  // Import configuration from file
  public async importConfigurationFile(file: File): Promise<{ success: boolean; config?: ConfigurationFile; error?: string }> {
    try {
      const content = await file.text();
      const configData = JSON.parse(content);

      // Validate the imported configuration
      const validation = validateConfigurationSchema(configData);
      if (!validation.valid) {
        throw new Error(`Invalid configuration file: ${validation.errors.join(', ')}`);
      }

      // Check compatibility
      const compatibility = checkCompatibility(configData);
      if (!compatibility.compatible) {
        throw new Error(`Configuration version ${configData.header.version} is not compatible with current version`);
      }

      console.log('Configuration file imported successfully');
      return { success: true, config: configData };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import configuration file';
      console.error('Import configuration error:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Get current session ID
  public getSessionId(): string {
    return this.sessionId;
  }

  // Private methods
  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
    }
    return sessionId;
  }

  private async saveToLocalStorage(config: ConfigurationFile): Promise<string> {
    const configId = `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Get existing configurations
    const savedConfigs = localStorage.getItem(STORAGE_KEYS.CONFIGURATIONS);
    const configs = savedConfigs ? JSON.parse(savedConfigs) : {};
    
    // Add new configuration
    configs[configId] = config;
    localStorage.setItem(STORAGE_KEYS.CONFIGURATIONS, JSON.stringify(configs));
    
    // Save as current configuration
    localStorage.setItem(STORAGE_KEYS.CURRENT_CONFIG, JSON.stringify(config));
    
    return configId;
  }

  private async loadFromLocalStorage(configId?: string): Promise<ConfigurationFile> {
    if (configId) {
      // Load specific configuration
      const savedConfigs = localStorage.getItem(STORAGE_KEYS.CONFIGURATIONS);
      if (!savedConfigs) {
        throw new Error('No saved configurations found');
      }

      const configs = JSON.parse(savedConfigs);
      
      if (!configs[configId]) {
        throw new Error('Configuration not found');
      }

      return configs[configId];
    } else {
      // Load current configuration
      const currentConfig = localStorage.getItem(STORAGE_KEYS.CURRENT_CONFIG);
      if (!currentConfig) {
        throw new Error('No current configuration found');
      }

      return JSON.parse(currentConfig);
    }
  }

  private async loadFromFile(file: File): Promise<ConfigurationFile> {
    const content = await file.text();
    const configData = JSON.parse(content);
    return configData;
  }
}

// Export singleton instance
export const configurationService = ConfigurationService.getInstance(); 