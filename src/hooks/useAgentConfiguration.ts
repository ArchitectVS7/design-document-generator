// Agent Configuration Management Hooks v0.7.0

import { useState, useCallback, useEffect } from 'react';
import { 
  AgentConfiguration, 
  AgentUpdatePayload, 
  ContextSourceUpdate, 
  TaskUpdatePayload,
  AgentValidationContext,
  AgentValidationResult 
} from '../types/agent';
import { 
  ConfigurationFile, 
  ConfigurationValidationResult,
  ConfigurationSaveOptions,
  ConfigurationLoadOptions 
} from '../types/configuration';
import { getDefaultConfiguration, resetToDefaultConfiguration } from '../data/defaultConfig';
import { 
  validateConfigurationSchema, 
  validateAgentConfiguration
} from '../utils/validation';

// Main agent configuration hook
export const useAgentConfiguration = () => {
  const [agents, setAgents] = useState<AgentConfiguration[]>([]);
  const [currentConfig, setCurrentConfig] = useState<ConfigurationFile | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ConfigurationValidationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with default configuration
  const initializeDefaultConfig = useCallback(() => {
    const defaultConfig = getDefaultConfiguration();
    setCurrentConfig(defaultConfig);
    setAgents(defaultConfig.agents);
    setIsModified(false);
    setError(null);
    console.log('Initialized with default configuration v0.7.0');
  }, []);

  // Reset to default configuration
  const resetToDefault = useCallback(() => {
    const resetConfig = resetToDefaultConfiguration();
    setCurrentConfig(resetConfig);
    setAgents(resetConfig.agents);
    setIsModified(false);
    setError(null);
    console.log('Reset to default configuration');
  }, []);

  // Update agent configuration
  const updateAgent = useCallback((payload: AgentUpdatePayload) => {
    setAgents(prev => prev.map(agent => 
      agent.id === payload.id 
        ? {
            ...agent,
            [payload.field]: payload.value,
            modified: new Date().toISOString(),
            version: incrementPatchVersion(agent.version)
          }
        : agent
    ));
    setIsModified(true);
    console.log(`Updated agent ${payload.id} field: ${String(payload.field)}`);
  }, []);

  // Update agent role
  const updateAgentRole = useCallback((agentId: number, role: Partial<AgentConfiguration['role']>) => {
    setAgents(prev => prev.map(agent => 
      agent.id === agentId 
        ? {
            ...agent,
            role: { ...agent.role, ...role },
            modified: new Date().toISOString(),
            version: incrementPatchVersion(agent.version)
          }
        : agent
    ));
    setIsModified(true);
    console.log(`Updated agent ${agentId} role`);
  }, []);

  // Update context sources
  const updateContextSources = useCallback((payload: ContextSourceUpdate) => {
    setAgents(prev => prev.map(agent =>
      agent.id === payload.agentId
        ? {
            ...agent,
            contextSources: payload.contextSources.map(source => ({
              ...source,
              available: isContextAvailable(source, agent.id, prev)
            })),
            modified: new Date().toISOString(),
            version: incrementPatchVersion(agent.version)
          }
        : agent
    ));
    setIsModified(true);
    console.log(`Updated agent ${payload.agentId} context sources`);
  }, []);

  // Update task configuration
  const updateTask = useCallback((payload: TaskUpdatePayload) => {
    setAgents(prev => prev.map(agent =>
      agent.id === payload.agentId
        ? {
            ...agent,
            task: { ...agent.task, ...payload.task },
            modified: new Date().toISOString(),
            version: incrementPatchVersion(agent.version)
          }
        : agent
    ));
    setIsModified(true);
    console.log(`Updated agent ${payload.agentId} task configuration`);
  }, []);

  // Validate configuration
  const validateConfiguration = useCallback(() => {
    if (!currentConfig) {
      setValidationStatus({
        valid: false,
        errors: ['No configuration loaded'],
        warnings: [],
        compatibility: { compatible: false, requiresMigration: false, warnings: [] }
      });
      return;
    }

    const validation = validateConfigurationSchema(currentConfig);
    setValidationStatus(validation);
    console.log('Configuration validation completed:', validation.valid);
    return validation;
  }, [currentConfig]);

  // Save configuration
  const saveConfiguration = useCallback(async (options: ConfigurationSaveOptions = {}) => {
    if (!currentConfig) {
      setError('No configuration to save');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Update configuration with current agents
      const configToSave: ConfigurationFile = {
        ...currentConfig,
        agents,
        header: {
          ...currentConfig.header,
          modified: new Date().toISOString(),
          description: options.description || currentConfig.header.description
        }
      };

      // Validate before saving
      const validation = validateConfigurationSchema(configToSave);
      if (!validation.valid) {
        throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
      }

      // Save to localStorage (simulating database save)
      const configKey = `ddg_config_${Date.now()}`;
      localStorage.setItem(configKey, JSON.stringify(configToSave));

      // Download file if requested
      if (options.downloadFile !== false) {
        downloadConfigFile(configToSave);
      }

      setCurrentConfig(configToSave);
      setIsModified(false);
      console.log('Configuration saved successfully');

      return configToSave;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration';
      setError(errorMessage);
      console.error('Save configuration error:', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentConfig, agents, validateConfiguration]);

  // Load configuration
  const loadConfiguration = useCallback(async (configData: ConfigurationFile, options: ConfigurationLoadOptions = {}) => {
    console.log('loadConfiguration called with:', configData);
    console.log('Config agents:', configData.agents);
    setIsLoading(true);
    setError(null);

    try {
      // Validate schema if requested
      if (options.validateSchema !== false) {
        const validation = validateConfigurationSchema(configData);
        if (!validation.valid) {
          throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Check compatibility if requested
      if (options.checkCompatibility !== false) {
        const validation = validateConfigurationSchema(configData);
        if (!validation.compatibility.compatible) {
          throw new Error(`Configuration is not compatible: ${validation.compatibility.warnings.join(', ')}`);
        }
      }

      console.log('Setting currentConfig and agents...');
      setCurrentConfig(configData);
      setAgents(configData.agents);
      setIsModified(false);
      console.log('Configuration loaded successfully');
      console.log('New agents state:', configData.agents);

      return configData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration';
      setError(errorMessage);
      console.error('Load configuration error:', errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Validate individual agent
  const validateAgent = useCallback((agent: AgentConfiguration): AgentValidationResult => {
    const context: AgentValidationContext = {
      agent,
      allAgents: agents
    };
    return validateAgentConfiguration(agent, context);
  }, [agents]);

  // Get agent by ID
  const getAgentById = useCallback((id: number): AgentConfiguration | undefined => {
    return agents.find(agent => agent.id === id);
  }, [agents]);

  // Get agents by category
  const getAgentsByCategory = useCallback((category: string): AgentConfiguration[] => {
    return agents.filter(agent => agent.role.category === category);
  }, [agents]);

  // Initialize on mount
  useEffect(() => {
    initializeDefaultConfig();
  }, [initializeDefaultConfig]);

  // Auto-validate when agents change
  useEffect(() => {
    if (currentConfig && agents.length > 0) {
      const updatedConfig = { ...currentConfig, agents };
      const validation = validateConfigurationSchema(updatedConfig);
      setValidationStatus(validation);
    }
  }, [agents, currentConfig]);

  // Debug effect to monitor agents state changes
  useEffect(() => {
    console.log('Agents state changed:', agents);
    console.log('Agent names:', agents.map(a => a.name));
  }, [agents]);

  return {
    // State
    agents,
    currentConfig,
    isModified,
    validationStatus,
    isLoading,
    error,

    // Actions
    initializeDefaultConfig,
    resetToDefault,
    updateAgent,
    updateAgentRole,
    updateContextSources,
    updateTask,
    validateConfiguration,
    saveConfiguration,
    loadConfiguration,
    validateAgent,
    getAgentById,
    getAgentsByCategory
  };
};

// Helper functions
const incrementPatchVersion = (version: string): string => {
  const [major, minor, patch] = version.split('.').map(Number);
  return `${major}.${minor}.${patch + 1}`;
};

const isContextAvailable = (source: any, agentId: number, allAgents: AgentConfiguration[]): boolean => {
  if (source.type === 'user_input') {
    return true;
  }
  
  if (source.type === 'agent_output' && source.agentId) {
    // Check if the source agent exists and comes before this agent
    const sourceAgent = allAgents.find(a => a.id === source.agentId);
    const currentAgent = allAgents.find(a => a.id === agentId);
    
    if (!sourceAgent || !currentAgent) {
      return false;
    }
    
    // Simple check: source agent should have a lower ID (comes first in sequence)
    return sourceAgent.id < currentAgent.id;
  }
  
  return false;
};

const downloadConfigFile = (config: ConfigurationFile) => {
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `agent-config-v${config.header.version}-${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
}; 