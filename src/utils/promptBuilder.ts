// Prompt Builder System v0.7.0

import { AgentConfiguration } from '../types/agent';
import { LLMRequest } from '../services/llmProvider';

export interface PromptContext {
  userInput: string;
  agentResponses: Record<number, string>;
  conversationHistory: Array<{
    agentId: number;
    agentName: string;
    prompt: string;
    response: string;
    timestamp: string;
  }>;
  metadata: {
    sessionId: string;
    currentAgentId: number;
    totalAgents: number;
    stepNumber: number;
  };
}

export interface PromptTemplate {
  role: string;
  context: string;
  task: string;
  instructions: string[];
  outputFormat: 'json' | 'markdown' | 'text';
  examples?: string[];
}

export class PromptBuilder {
  private static readonly DEFAULT_SYSTEM_PROMPT = `You are an AI agent designed to help create comprehensive technical specifications. 
Please provide detailed, well-structured responses that are actionable and specific to the given context.`;

  /**
   * Build a complete prompt from agent configuration and context
   */
  static buildPrompt(agent: AgentConfiguration, context: PromptContext): LLMRequest {
    const template = this.createPromptTemplate(agent, context);
    const fullPrompt = this.assemblePrompt(template);
    
    return {
      prompt: fullPrompt,
      maxTokens: agent.task.maxTokens,
      temperature: agent.task.temperature,
      outputFormat: agent.task.outputFormat,
      instructions: agent.task.instructions,
      systemPrompt: this.buildSystemPrompt(agent)
    };
  }

  /**
   * Create a prompt template from agent configuration
   */
  private static createPromptTemplate(agent: AgentConfiguration, context: PromptContext): PromptTemplate {
    const role = this.buildRoleSection(agent);
    const contextSection = this.buildContextSection(agent, context);
    const task = this.buildTaskSection(agent, context);
    const instructions = this.buildInstructionsSection(agent);

    return {
      role,
      context: contextSection,
      task,
      instructions,
      outputFormat: agent.task.outputFormat,
      examples: this.getExamplesForAgent(agent)
    };
  }

  /**
   * Build the role section of the prompt
   */
  private static buildRoleSection(agent: AgentConfiguration): string {
    return `## Role: ${agent.role.title}

${agent.role.description}

**Category**: ${agent.role.category}
**Expertise**: ${this.getExpertiseForCategory(agent.role.category)}`;
  }

  /**
   * Build the context section from selected context sources
   */
  private static buildContextSection(agent: AgentConfiguration, context: PromptContext): string {
    const contextParts: string[] = [];
    
    // Add user input if selected
    const userInputSource = agent.contextSources.find(s => s.id === 'user_input' && s.selected);
    if (userInputSource) {
      contextParts.push(`## User Input
${context.userInput}`);
    }

    // Add upstream agent responses if selected
    const agentResponseSources = agent.contextSources
      .filter(s => s.type === 'agent_output' && s.selected && s.agentId)
      .sort((a, b) => (a.agentId || 0) - (b.agentId || 0));

    if (agentResponseSources.length > 0) {
      contextParts.push(`## Previous Agent Outputs`);
      
      agentResponseSources.forEach(source => {
        const response = context.agentResponses[source.agentId!];
        if (response) {
          const sourceAgent = this.findAgentById(source.agentId!, context);
          contextParts.push(`### ${sourceAgent?.name || `Agent ${source.agentId}`}
${response}`);
        }
      });
    }

    // Add conversation history if available
    if (context.conversationHistory.length > 0) {
      contextParts.push(`## Conversation History
${context.conversationHistory
  .map(entry => `**${entry.agentName}** (${new Date(entry.timestamp).toLocaleString()}):
${entry.response.substring(0, 200)}${entry.response.length > 200 ? '...' : ''}`)
  .join('\n\n')}`);
    }

    return contextParts.join('\n\n');
  }

  /**
   * Build the task section with placeholders replaced
   */
  private static buildTaskSection(agent: AgentConfiguration, context: PromptContext): string {
    let task = agent.task.promptTemplate;

    // Replace placeholders
    task = task.replace(/\{USER_INPUT\}/g, context.userInput);
    task = task.replace(/\{AGENT_NAME\}/g, agent.name);
    task = task.replace(/\{ROLE_TITLE\}/g, agent.role.title);
    task = task.replace(/\{ROLE_CATEGORY\}/g, agent.role.category);
    task = task.replace(/\{STEP_NUMBER\}/g, context.metadata.stepNumber.toString());
    task = task.replace(/\{TOTAL_STEPS\}/g, context.metadata.totalAgents.toString());

    // Replace agent response placeholders
    const agentResponseRegex = /\{AGENT_\d+_RESPONSE\}/g;
    task = task.replace(agentResponseRegex, (_match, agentId) => {
      const response = context.agentResponses[parseInt(agentId)];
      return response || `[No response available from Agent ${agentId}]`;
    });

    return `## Task
${task}`;
  }

  /**
   * Build the instructions section
   */
  private static buildInstructionsSection(agent: AgentConfiguration): string[] {
    const instructions = [...agent.task.instructions];

    // Add format-specific instructions
    switch (agent.task.outputFormat) {
      case 'json':
        instructions.push('Provide your response in valid JSON format');
        instructions.push('Use clear, descriptive keys for JSON properties');
        break;
      case 'markdown':
        instructions.push('Format your response using Markdown');
        instructions.push('Use headers, lists, and emphasis appropriately');
        break;
      case 'text':
        instructions.push('Provide a clear, well-structured text response');
        instructions.push('Use paragraphs and formatting for readability');
        break;
    }

    // Add agent-specific instructions
    const categoryInstructions = this.getCategoryInstructions(agent.role.category);
    instructions.push(...categoryInstructions);

    return instructions;
  }

  /**
   * Build the system prompt for the agent
   */
  private static buildSystemPrompt(agent: AgentConfiguration): string {
    return `${this.DEFAULT_SYSTEM_PROMPT}

You are acting as: ${agent.role.title}
Your role category is: ${agent.role.category}
Your expertise includes: ${this.getExpertiseForCategory(agent.role.category)}

Please maintain consistency with your role and provide responses that align with your specialized expertise.`;
  }

  /**
   * Assemble the complete prompt from template parts
   */
  private static assemblePrompt(template: PromptTemplate): string {
    const parts = [
      template.role,
      template.context,
      template.task
    ];

    if (template.instructions.length > 0) {
      parts.push(`## Instructions
${template.instructions.map(instruction => `- ${instruction}`).join('\n')}`);
    }

    if (template.examples && template.examples.length > 0) {
      parts.push(`## Examples
${template.examples.join('\n\n')}`);
    }

    return parts.join('\n\n');
  }

  /**
   * Get expertise description for agent category
   */
  private static getExpertiseForCategory(category: string): string {
    const expertiseMap: Record<string, string> = {
      'strategist': 'Market analysis, competitive positioning, business strategy, value proposition development',
      'researcher': 'Market research, user behavior analysis, competitive intelligence, data gathering',
      'designer': 'User experience design, interface design, visual design, interaction patterns',
      'author': 'Technical writing, documentation, content creation, specification development',
      'analyst': 'Data analysis, metrics interpretation, performance evaluation, insights generation',
      'architect': 'System architecture, technical design, infrastructure planning, scalability considerations'
    };

    return expertiseMap[category] || 'General AI assistance and problem solving';
  }

  /**
   * Get category-specific instructions
   */
  private static getCategoryInstructions(category: string): string[] {
    const instructionMap: Record<string, string[]> = {
      'strategist': [
        'Focus on business value and market opportunity',
        'Consider competitive landscape and differentiation',
        'Provide actionable strategic recommendations'
      ],
      'researcher': [
        'Base recommendations on data and evidence',
        'Consider multiple perspectives and sources',
        'Identify key insights and patterns'
      ],
      'designer': [
        'Prioritize user experience and usability',
        'Consider accessibility and inclusivity',
        'Focus on visual and interaction design principles'
      ],
      'author': [
        'Write clear, concise, and well-structured content',
        'Use appropriate technical terminology',
        'Ensure completeness and accuracy'
      ],
      'analyst': [
        'Provide data-driven insights and recommendations',
        'Consider quantitative and qualitative factors',
        'Focus on measurable outcomes and metrics'
      ],
      'architect': [
        'Consider scalability, performance, and maintainability',
        'Address technical constraints and requirements',
        'Provide clear architectural decisions and rationale'
      ]
    };

    return instructionMap[category] || [];
  }

  /**
   * Get examples for specific agent types
   */
  private static getExamplesForAgent(agent: AgentConfiguration): string[] {
    const examples: string[] = [];

    switch (agent.role.category) {
      case 'strategist':
        examples.push(`Example Strategy Response:
- Market Opportunity: $2.5B addressable market
- Target Audience: Tech-savvy professionals aged 25-40
- Value Proposition: Streamlined workflow automation
- Competitive Advantage: AI-powered insights`);
        break;
      case 'researcher':
        examples.push(`Example Research Response:
- Key Findings: 78% of users report inefficiencies
- Competitive Analysis: 3 major competitors identified
- Recommendations: Focus on intuitive UX design`);
        break;
      case 'designer':
        examples.push(`Example Design Response:
- Design Principles: Simplicity, efficiency, accessibility
- Key Features: Dashboard, wizard interface, progress tracking
- Visual Design: Professional color palette, clean typography`);
        break;
    }

    return examples;
  }

  /**
   * Find agent by ID in conversation history
   */
  private static findAgentById(agentId: number, context: PromptContext): { name: string } | null {
    const historyEntry = context.conversationHistory.find(entry => entry.agentId === agentId);
    return historyEntry ? { name: historyEntry.agentName } : null;
  }

  /**
   * Validate prompt template for completeness
   */
  static validatePromptTemplate(template: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for required placeholders
    if (!template.includes('{USER_INPUT}')) {
      errors.push('Template must include {USER_INPUT} placeholder');
    }

    // Check for balanced braces
    const openBraces = (template.match(/\{/g) || []).length;
    const closeBraces = (template.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push('Template has unbalanced braces');
    }

    // Check for valid agent response placeholders
    const agentResponseMatches = template.match(/\{AGENT_\d+_RESPONSE\}/g) || [];
    for (const match of agentResponseMatches) {
      const agentId = match.match(/\{AGENT_(\d+)_RESPONSE\}/)?.[1];
      if (!agentId || isNaN(parseInt(agentId))) {
        errors.push(`Invalid agent response placeholder: ${match}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Estimate token count for a prompt
   */
  static estimateTokenCount(prompt: string): number {
    // Rough estimation: 4 characters per token
    return Math.ceil(prompt.length / 4);
  }

  /**
   * Create a summary of the prompt for debugging
   */
  static createPromptSummary(agent: AgentConfiguration, context: PromptContext): {
    agentName: string;
    role: string;
    contextSources: string[];
    estimatedTokens: number;
    outputFormat: string;
  } {
    const prompt = this.buildPrompt(agent, context);
    
    return {
      agentName: agent.name,
      role: agent.role.title,
      contextSources: agent.contextSources
        .filter(s => s.selected)
        .map(s => s.label),
      estimatedTokens: this.estimateTokenCount(prompt.prompt),
      outputFormat: agent.task.outputFormat
    };
  }
} 