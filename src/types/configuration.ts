// Configuration File Structure v0.7.0

import { AgentConfiguration } from './agent';

export interface ConfigurationFile {
  // File Header
  header: {
    version: string;                  // "0.7.0"
    compatibleVersions: string[];     // Backwards compatibility list
    compatibilityMap: CompatibilityMapping[];
    created: string;                  // ISO timestamp
    modified: string;                 // ISO timestamp
    description: string;              // User description
  };
  
  // Agent Configurations
  agents: AgentConfiguration[];
  
  // System Settings
  settings: {
    defaultLLM: string;               // "openai-gpt4" | "claude-3" | etc.
    autoSave: boolean;
    qualityGates: boolean;
  };
}

export interface CompatibilityMapping {
  fromVersion: string;                // "0.6.0"
  toVersion: string;                  // "0.7.0"
  fieldMappings: FieldMapping[];
  warnings: string[];
}

export interface FieldMapping {
  oldPath: string;                    // "agents[].name"
  newPath: string;                    // "agents[].role.title"
  transformation?: string;            // Optional transformation function
  requiresUserInput: boolean;         // Manual verification needed
}

// Configuration Management Types
export interface ConfigurationValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  compatibility: CompatibilityResult;
}

export interface CompatibilityResult {
  compatible: boolean;
  requiresMigration: boolean;
  migrationPath?: string[];
  warnings: string[];
}

export interface ConfigurationSaveOptions {
  description?: string;
  isPublic?: boolean;
  downloadFile?: boolean;
}

export interface ConfigurationLoadOptions {
  validateSchema?: boolean;
  checkCompatibility?: boolean;
  autoMigrate?: boolean;
}

// Migration Types
export interface MigrationResult {
  success: boolean;
  migratedConfig?: ConfigurationFile;
  warnings: string[];
  requiresUserApproval: boolean;
  pendingChanges: FieldMapping[];
  tagMappings?: Record<string, string>;
  deprecatedFields?: string[];
  newFields?: string[];
}

export interface MigrationDialogData {
  originalConfig: ConfigurationFile;
  migratedConfig: ConfigurationFile;
  warnings: string[];
  pendingChanges: FieldMapping[];
  tagMappings: Record<string, string>;
  deprecatedFields: string[];
  newFields: string[];
}

// Version Control Types
export interface VersionInfo {
  current: string;
  compatible: string[];
  migrations: Record<string, string[]>;
}

export interface VersionValidationResult {
  valid: boolean;
  error?: string;
  requiresMigration: boolean;
  migrationPath?: string[];
}

// Configuration State Types
export interface ConfigurationState {
  currentConfig: ConfigurationFile | null;
  isModified: boolean;
  lastSaved?: string;
  autoSaveEnabled: boolean;
  validationStatus: ConfigurationValidationResult | null;
  migrationStatus: MigrationResult | null;
}

// Configuration UI Types
export interface ConfigurationListItem {
  id: string;
  name: string;
  description: string;
  version: string;
  created: string;
  modified: string;
  isPublic: boolean;
  agentCount: number;
}

export interface ConfigurationFilter {
  version?: string;
  isPublic?: boolean;
  createdAfter?: string;
  createdBefore?: string;
  searchTerm?: string;
} 