// Agent Data Type Specification v0.7.0

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
  available?: boolean;                // Runtime property for UI
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

// Agent State Management
export type AgentState = 
  | "Idle" 
  | "Active.Prompt_Draft" 
  | "Active.Prompt_OK" 
  | "Active.Generating" 
  | "Active.Response_Draft" 
  | "Active.Response_OK" 
  | "Complete";

export interface AgentStateInfo {
  state: AgentState;
  currentPrompt?: string;
  currentResponse?: string;
  promptApproved?: boolean;
  responseApproved?: boolean;
  lastUpdated: string;
}

// Runtime Agent State
export interface AgentStatus {
  isActive: boolean;
  isProcessing: boolean;
  lastExecuted?: string;
  executionCount: number;
  errorCount: number;
  lastError?: string;
  state: AgentStateInfo;
}

export interface AgentResponse {
  agentId: number;
  prompt: string;
  response: any;
  timestamp: string;
  executionTime: number;
  tokensUsed: number;
  status: 'success' | 'error' | 'pending';
  error?: string;
}

// Agent Management Types
export interface AgentUpdatePayload {
  id: number;
  field: keyof AgentConfiguration;
  value: any;
}

export interface ContextSourceUpdate {
  agentId: number;
  contextSources: ContextSource[];
}

export interface TaskUpdatePayload {
  agentId: number;
  task: Partial<TaskConfiguration>;
}

// Agent Execution Types
export interface AgentExecutionRequest {
  agentId: number;
  userInput: string;
  agentResponses: Record<number, AgentResponse>;
  context: string;
}

export interface AgentExecutionResult {
  success: boolean;
  response?: any;
  error?: string;
  executionTime: number;
  tokensUsed: number;
}

// Agent Validation Types
export interface AgentValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AgentValidationContext {
  agent: AgentConfiguration;
  allAgents: AgentConfiguration[];
  userInput?: string;
} 