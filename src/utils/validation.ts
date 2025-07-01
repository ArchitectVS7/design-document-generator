// Configuration Validation Utilities v0.7.0

import { 
  ConfigurationValidationResult, 
  CompatibilityResult,
  VersionValidationResult 
} from '../types/configuration';
import { 
  AgentConfiguration, 
  AgentValidationResult, 
  AgentValidationContext 
} from '../types/agent';

// Version constants
export const APP_VERSION = "0.7.0";
export const COMPATIBLE_VERSIONS = ["0.7.0"];

// Configuration Schema Validation
export const validateConfigurationSchema = (config: any): ConfigurationValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check if config is an object
  if (!config || typeof config !== 'object') {
    errors.push('Configuration must be a valid object');
    return { valid: false, errors, warnings, compatibility: { compatible: false, requiresMigration: false, warnings: [] } };
  }

  // Validate header
  if (!config.header) {
    errors.push('Configuration must have a header section');
  } else {
    const headerErrors = validateHeader(config.header);
    errors.push(...headerErrors);
  }

  // Validate agents
  if (!Array.isArray(config.agents)) {
    errors.push('Configuration must have an agents array');
  } else {
    config.agents.forEach((agent: any, index: number) => {
      const agentErrors = validateAgent(agent, index);
      errors.push(...agentErrors);
    });
  }

  // Validate settings
  if (!config.settings) {
    errors.push('Configuration must have a settings section');
  } else {
    const settingsErrors = validateSettings(config.settings);
    errors.push(...settingsErrors);
  }

  // Check compatibility
  const compatibility = checkCompatibility(config);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    compatibility
  };
};

// Header validation
const validateHeader = (header: any): string[] => {
  const errors: string[] = [];

  if (!header.version || typeof header.version !== 'string') {
    errors.push('Header must have a valid version string');
  }

  if (!Array.isArray(header.compatibleVersions)) {
    errors.push('Header must have a compatibleVersions array');
  }

  if (!header.created || typeof header.created !== 'string') {
    errors.push('Header must have a valid created timestamp');
  }

  if (!header.modified || typeof header.modified !== 'string') {
    errors.push('Header must have a valid modified timestamp');
  }

  if (!header.description || typeof header.description !== 'string') {
    errors.push('Header must have a valid description');
  }

  return errors;
};

// Agent validation
const validateAgent = (agent: any, index: number): string[] => {
  const errors: string[] = [];

  if (!agent.id || typeof agent.id !== 'number') {
    errors.push(`Agent ${index + 1} must have a valid numeric ID`);
  }

  if (!agent.name || typeof agent.name !== 'string') {
    errors.push(`Agent ${index + 1} must have a valid name`);
  }

  if (!agent.role || typeof agent.role !== 'object') {
    errors.push(`Agent ${index + 1} must have a valid role object`);
  } else {
    const roleErrors = validateAgentRole(agent.role, index);
    errors.push(...roleErrors);
  }

  if (!Array.isArray(agent.contextSources)) {
    errors.push(`Agent ${index + 1} must have a contextSources array`);
  } else {
    agent.contextSources.forEach((source: any, sourceIndex: number) => {
      const sourceErrors = validateContextSource(source, index, sourceIndex);
      errors.push(...sourceErrors);
    });
  }

  if (!agent.task || typeof agent.task !== 'object') {
    errors.push(`Agent ${index + 1} must have a valid task object`);
  } else {
    const taskErrors = validateTaskConfiguration(agent.task, index);
    errors.push(...taskErrors);
  }

  if (!agent.created || typeof agent.created !== 'string') {
    errors.push(`Agent ${index + 1} must have a valid created timestamp`);
  }

  if (!agent.modified || typeof agent.modified !== 'string') {
    errors.push(`Agent ${index + 1} must have a valid modified timestamp`);
  }

  if (!agent.version || typeof agent.version !== 'string') {
    errors.push(`Agent ${index + 1} must have a valid version`);
  }

  return errors;
};

// Agent role validation
const validateAgentRole = (role: any, agentIndex: number): string[] => {
  const errors: string[] = [];

  if (!role.title || typeof role.title !== 'string') {
    errors.push(`Agent ${agentIndex + 1} role must have a valid title`);
  }

  if (!role.category || typeof role.category !== 'string') {
    errors.push(`Agent ${agentIndex + 1} role must have a valid category`);
  }

  if (!role.description || typeof role.description !== 'string') {
    errors.push(`Agent ${agentIndex + 1} role must have a valid description`);
  }

  if (!role.icon || typeof role.icon !== 'string') {
    errors.push(`Agent ${agentIndex + 1} role must have a valid icon`);
  }

  return errors;
};

// Context source validation
const validateContextSource = (source: any, agentIndex: number, sourceIndex: number): string[] => {
  const errors: string[] = [];

  if (!source.id || typeof source.id !== 'string') {
    errors.push(`Agent ${agentIndex + 1} context source ${sourceIndex + 1} must have a valid ID`);
  }

  if (!source.label || typeof source.label !== 'string') {
    errors.push(`Agent ${agentIndex + 1} context source ${sourceIndex + 1} must have a valid label`);
  }

  if (!source.type || typeof source.type !== 'string') {
    errors.push(`Agent ${agentIndex + 1} context source ${sourceIndex + 1} must have a valid type`);
  }

  if (typeof source.selected !== 'boolean') {
    errors.push(`Agent ${agentIndex + 1} context source ${sourceIndex + 1} must have a valid selected boolean`);
  }

  return errors;
};

// Task configuration validation
const validateTaskConfiguration = (task: any, agentIndex: number): string[] => {
  const errors: string[] = [];

  if (!task.promptTemplate || typeof task.promptTemplate !== 'string') {
    errors.push(`Agent ${agentIndex + 1} task must have a valid promptTemplate`);
  }

  if (!task.outputFormat || typeof task.outputFormat !== 'string') {
    errors.push(`Agent ${agentIndex + 1} task must have a valid outputFormat`);
  }

  if (!task.maxTokens || typeof task.maxTokens !== 'number') {
    errors.push(`Agent ${agentIndex + 1} task must have a valid maxTokens number`);
  }

  if (typeof task.temperature !== 'number' || task.temperature < 0 || task.temperature > 1) {
    errors.push(`Agent ${agentIndex + 1} task must have a valid temperature between 0 and 1`);
  }

  if (!Array.isArray(task.instructions)) {
    errors.push(`Agent ${agentIndex + 1} task must have an instructions array`);
  }

  return errors;
};

// Settings validation
const validateSettings = (settings: any): string[] => {
  const errors: string[] = [];

  if (!settings.defaultLLM || typeof settings.defaultLLM !== 'string') {
    errors.push('Settings must have a valid defaultLLM');
  }

  if (typeof settings.autoSave !== 'boolean') {
    errors.push('Settings must have a valid autoSave boolean');
  }

  if (typeof settings.qualityGates !== 'boolean') {
    errors.push('Settings must have a valid qualityGates boolean');
  }

  return errors;
};

// Compatibility checking
export const checkCompatibility = (config: any): CompatibilityResult => {
  const warnings: string[] = [];

  if (!config.header || !config.header.version) {
    return { compatible: false, requiresMigration: false, warnings: ['Invalid configuration format'] };
  }

  const fileVersion = config.header.version;

  // Exact version match
  if (fileVersion === APP_VERSION) {
    return { compatible: true, requiresMigration: false, warnings };
  }

  // Check if version is in compatible list
  if (COMPATIBLE_VERSIONS.includes(fileVersion)) {
    return { compatible: true, requiresMigration: false, warnings };
  }

  // Check if migration is possible
  const migrationPath = findMigrationPath(fileVersion, APP_VERSION);
  if (migrationPath.length > 0) {
    warnings.push(`Configuration version ${fileVersion} requires migration to ${APP_VERSION}`);
    return { 
      compatible: true, 
      requiresMigration: true, 
      migrationPath, 
      warnings 
    };
  }

  return { 
    compatible: false, 
    requiresMigration: false, 
    warnings: [`Configuration version ${fileVersion} is not compatible with current version ${APP_VERSION}`] 
  };
};

// Version validation
export const validateVersion = (version: string): VersionValidationResult => {
  if (version === APP_VERSION) {
    return { valid: true, requiresMigration: false };
  }

  if (COMPATIBLE_VERSIONS.includes(version)) {
    return { valid: true, requiresMigration: false };
  }

  const migrationPath = findMigrationPath(version, APP_VERSION);
  if (migrationPath.length > 0) {
    return { valid: true, requiresMigration: true, migrationPath };
  }

  return { 
    valid: false, 
    requiresMigration: false,
    error: `Unsupported configuration version: ${version}` 
  };
};

// Migration path finding
const findMigrationPath = (fromVersion: string, _toVersion: string): string[] => {
  // Simple migration path for now - can be expanded
  const migrations: Record<string, string[]> = {
    "0.6.0": ["0.6.0_to_0.7.0"],
    "0.5.0": ["0.5.0_to_0.6.0", "0.6.0_to_0.7.0"]
  };

  return migrations[fromVersion] || [];
};

// Agent-specific validation
export const validateAgentConfiguration = (agent: AgentConfiguration, context: AgentValidationContext): AgentValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for duplicate agent IDs
  const duplicateId = context.allAgents.find(a => a.id === agent.id && a !== agent);
  if (duplicateId) {
    errors.push(`Agent ID ${agent.id} is already used by another agent`);
  }

  // Validate context sources
  agent.contextSources.forEach((source, index) => {
    if (source.type === 'agent_output' && !source.agentId) {
      errors.push(`Context source ${index + 1} is agent_output type but missing agentId`);
    }

    if (source.type === 'agent_output' && source.agentId) {
      const sourceAgent = context.allAgents.find(a => a.id === source.agentId);
      if (!sourceAgent) {
        errors.push(`Context source ${index + 1} references non-existent agent ${source.agentId}`);
      }
    }
  });

  // Validate task configuration
  if (agent.task.maxTokens <= 0) {
    errors.push('Task maxTokens must be greater than 0');
  }

  if (agent.task.temperature < 0 || agent.task.temperature > 1) {
    errors.push('Task temperature must be between 0 and 1');
  }

  if (agent.task.promptTemplate.length === 0) {
    errors.push('Task promptTemplate cannot be empty');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}; 