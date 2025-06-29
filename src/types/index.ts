// TypeScript type definitions for Design Document Generator v0.7.0

// Core Agent Data Structure
export interface AgentConfiguration {
  // Schema Information
  schemaVersion: string;              // "0.7.0"
  compatibleVersions: string[];       // ["0.7.0"]
  
  // Agent Identity
  id: number;                         // Unique identifier
  name: string;                       // Display name
  role: AgentRole;                    // Functional role
  
  // Configuration
  contextSources: ContextSource[];    // Selected context inputs
  task: TaskConfiguration;            // Prompt template and settings
  
  // Metadata
  created: string;                    // ISO timestamp
  modified: string;                   // ISO timestamp
  version: string;                    // Agent config version
}

export interface AgentRole {
  title: string;                      // "Product Strategist"
  category: RoleCategory;             // DESIGNER | RESEARCHER | AUTHOR | ANALYST
  description: string;                // Role description
  icon: string;                       // Icon identifier
}

export interface ContextSource {
  id: string;                         // "user_input" | "agent_1_output" | etc.
  label: string;                      // Display name
  type: ContextType;                  // USER_INPUT | AGENT_OUTPUT
  agentId?: number;                   // If type is AGENT_OUTPUT
  selected: boolean;                  // Whether this source is active
}

export interface TaskConfiguration {
  promptTemplate: string;             // Template with placeholders
  outputFormat: OutputFormat;         // JSON | MARKDOWN | TEXT
  maxTokens: number;                  // Token limit
  temperature: number;                // LLM creativity setting
  instructions: string[];             // Special instructions
}

export enum RoleCategory {
  DESIGNER = "designer",
  RESEARCHER = "researcher", 
  AUTHOR = "author",
  ANALYST = "analyst",
  STRATEGIST = "strategist",
  ARCHITECT = "architect"
}

export enum ContextType {
  USER_INPUT = "user_input",
  AGENT_OUTPUT = "agent_output"
}

export enum OutputFormat {
  JSON = "json",
  MARKDOWN = "markdown", 
  TEXT = "text"
}

// Configuration File Structure
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

// Application State Types
export interface AppState {
  version: string;
  agents: AgentConfiguration[];
  currentAgent: number | null;
  userInput: string;
  agentResponses: Record<number, any>;
  isLoading: boolean;
  error: string | null;
}

// Component Props Types
export interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export interface VersionDisplayProps {
  showPhase?: boolean;
  showBadge?: boolean;
} 