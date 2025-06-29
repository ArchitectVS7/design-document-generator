// Default Configuration v0.7.0
// 7 specialized AI agents for Design Document Generator

import { ConfigurationFile } from '../types/configuration';
import { 
  RoleCategory, 
  ContextType, 
  OutputFormat 
} from '../types/agent';

export const DEFAULT_CONFIG_V07: ConfigurationFile = {
  header: {
    version: "0.7.0",
    compatibleVersions: ["0.7.0"],
    compatibilityMap: [],
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    description: "Default configuration v0.7.0 - 7 specialized AI agents"
  },
  agents: [
    {
      id: 1,
      name: "Product Strategist",
      schemaVersion: "0.7.0",
      compatibleVersions: ["0.7.0"],
      role: {
        title: "Product Strategist",
        category: RoleCategory.STRATEGIST,
        description: "Analyzes market opportunities and defines product strategy",
        icon: "target"
      },
      contextSources: [
        {
          id: "user_input",
          label: "User Creative Input", 
          type: ContextType.USER_INPUT,
          selected: true
        }
      ],
      task: {
        promptTemplate: `You are a Product Strategist. Based on the user's creative idea: "{USER_INPUT}", please analyze and provide strategic insights.

Focus on:
- Market opportunity assessment
- Target audience identification
- Competitive landscape analysis
- Value proposition definition
- Strategic positioning

Provide your analysis in a structured format.`,
        outputFormat: OutputFormat.JSON,
        maxTokens: 2000,
        temperature: 0.7,
        instructions: ["Focus on market viability", "Identify core value proposition", "Consider competitive landscape"]
      },
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      version: "0.7.0"
    },
    {
      id: 2,
      name: "Customer Persona",
      schemaVersion: "0.7.0",
      compatibleVersions: ["0.7.0"],
      role: {
        title: "Customer Persona Specialist",
        category: RoleCategory.RESEARCHER,
        description: "Develops detailed customer personas and user profiles",
        icon: "users"
      },
      contextSources: [
        {
          id: "user_input",
          label: "User Creative Input",
          type: ContextType.USER_INPUT,
          selected: true
        },
        {
          id: "agent_1_output",
          label: "Product Strategist Output",
          type: ContextType.AGENT_OUTPUT,
          agentId: 1,
          selected: true
        }
      ],
      task: {
        promptTemplate: `You are a Customer Persona Specialist. Using the user's creative idea and strategic analysis, develop detailed customer personas.

Input:
- User Idea: "{USER_INPUT}"
- Strategic Analysis: {AGENT_1_OUTPUT}

Create comprehensive customer personas including:
- Demographics
- Psychographics
- Pain points
- Goals and motivations
- User journey stages
- Decision-making factors

Provide detailed, actionable personas.`,
        outputFormat: OutputFormat.JSON,
        maxTokens: 2500,
        temperature: 0.6,
        instructions: ["Create realistic personas", "Include behavioral insights", "Focus on actionable details"]
      },
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      version: "0.7.0"
    },
    {
      id: 3,
      name: "UI/UX Product Manager",
      schemaVersion: "0.7.0",
      compatibleVersions: ["0.7.0"],
      role: {
        title: "UI/UX Product Manager",
        category: RoleCategory.DESIGNER,
        description: "Defines user experience and interface requirements",
        icon: "layout"
      },
      contextSources: [
        {
          id: "user_input",
          label: "User Creative Input",
          type: ContextType.USER_INPUT,
          selected: true
        },
        {
          id: "agent_1_output",
          label: "Product Strategist Output",
          type: ContextType.AGENT_OUTPUT,
          agentId: 1,
          selected: true
        },
        {
          id: "agent_2_output",
          label: "Customer Persona Output",
          type: ContextType.AGENT_OUTPUT,
          agentId: 2,
          selected: true
        }
      ],
      task: {
        promptTemplate: `You are a UI/UX Product Manager. Based on the product strategy and customer personas, define the user experience and interface requirements.

Input:
- User Idea: "{USER_INPUT}"
- Strategy: {AGENT_1_OUTPUT}
- Personas: {AGENT_2_OUTPUT}

Define:
- User journey flows
- Key user stories
- Interface requirements
- UX principles
- Accessibility considerations
- Mobile responsiveness needs

Focus on user-centered design principles.`,
        outputFormat: OutputFormat.JSON,
        maxTokens: 2200,
        temperature: 0.6,
        instructions: ["Prioritize user experience", "Consider accessibility", "Include mobile-first design"]
      },
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      version: "0.7.0"
    },
    {
      id: 4,
      name: "Creative Director",
      schemaVersion: "0.7.0",
      compatibleVersions: ["0.7.0"],
      role: {
        title: "Creative Director",
        category: RoleCategory.DESIGNER,
        description: "Establishes visual identity and creative direction",
        icon: "palette"
      },
      contextSources: [
        {
          id: "user_input",
          label: "User Creative Input",
          type: ContextType.USER_INPUT,
          selected: true
        },
        {
          id: "agent_1_output",
          label: "Product Strategist Output",
          type: ContextType.AGENT_OUTPUT,
          agentId: 1,
          selected: true
        },
        {
          id: "agent_2_output",
          label: "Customer Persona Output",
          type: ContextType.AGENT_OUTPUT,
          agentId: 2,
          selected: true
        },
        {
          id: "agent_3_output",
          label: "UI/UX Product Manager Output",
          type: ContextType.AGENT_OUTPUT,
          agentId: 3,
          selected: true
        }
      ],
      task: {
        promptTemplate: `You are a Creative Director. Based on the product strategy, personas, and UX requirements, establish the visual identity and creative direction.

Input:
- User Idea: "{USER_INPUT}"
- Strategy: {AGENT_1_OUTPUT}
- Personas: {AGENT_2_OUTPUT}
- UX Requirements: {AGENT_3_OUTPUT}

Define:
- Brand identity guidelines
- Color palette and typography
- Visual style and aesthetics
- Brand voice and tone
- Creative assets requirements
- Design system principles

Create a cohesive visual identity that resonates with the target audience.`,
        outputFormat: OutputFormat.JSON,
        maxTokens: 2000,
        temperature: 0.7,
        instructions: ["Create cohesive brand identity", "Consider target audience preferences", "Ensure scalability"]
      },
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      version: "0.7.0"
    },
    {
      id: 5,
      name: "Market Researcher",
      schemaVersion: "0.7.0",
      compatibleVersions: ["0.7.0"],
      role: {
        title: "Market Researcher",
        category: RoleCategory.RESEARCHER,
        description: "Conducts market analysis and competitive research",
        icon: "trending-up"
      },
      contextSources: [
        {
          id: "user_input",
          label: "User Creative Input",
          type: ContextType.USER_INPUT,
          selected: true
        },
        {
          id: "agent_1_output",
          label: "Product Strategist Output",
          type: ContextType.AGENT_OUTPUT,
          agentId: 1,
          selected: true
        }
      ],
      task: {
        promptTemplate: `You are a Market Researcher. Based on the user's idea and strategic analysis, conduct comprehensive market research.

Input:
- User Idea: "{USER_INPUT}"
- Strategy: {AGENT_1_OUTPUT}

Research and analyze:
- Market size and growth potential
- Competitive landscape
- Market trends and opportunities
- Regulatory environment
- Pricing strategies
- Distribution channels
- Market entry strategies

Provide data-driven market insights.`,
        outputFormat: OutputFormat.JSON,
        maxTokens: 2500,
        temperature: 0.5,
        instructions: ["Provide data-driven insights", "Identify market opportunities", "Analyze competitive landscape"]
      },
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      version: "0.7.0"
    },
    {
      id: 6,
      name: "Visual Researcher",
      schemaVersion: "0.7.0",
      compatibleVersions: ["0.7.0"],
      role: {
        title: "Visual Researcher",
        category: RoleCategory.RESEARCHER,
        description: "Researches visual trends and design inspiration",
        icon: "eye"
      },
      contextSources: [
        {
          id: "user_input",
          label: "User Creative Input",
          type: ContextType.USER_INPUT,
          selected: true
        },
        {
          id: "agent_4_output",
          label: "Creative Director Output",
          type: ContextType.AGENT_OUTPUT,
          agentId: 4,
          selected: true
        },
        {
          id: "agent_5_output",
          label: "Market Researcher Output",
          type: ContextType.AGENT_OUTPUT,
          agentId: 5,
          selected: true
        }
      ],
      task: {
        promptTemplate: `You are a Visual Researcher. Based on the creative direction and market research, identify visual trends and design inspiration.

Input:
- User Idea: "{USER_INPUT}"
- Creative Direction: {AGENT_4_OUTPUT}
- Market Research: {AGENT_5_OUTPUT}

Research and identify:
- Current design trends
- Visual inspiration sources
- Color and typography trends
- UI/UX patterns
- Visual storytelling approaches
- Design tools and technologies
- Industry best practices

Provide visual research insights and recommendations.`,
        outputFormat: OutputFormat.JSON,
        maxTokens: 2000,
        temperature: 0.6,
        instructions: ["Identify current trends", "Provide visual inspiration", "Consider industry best practices"]
      },
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      version: "0.7.0"
    },
    {
      id: 7,
      name: "Frontend Architect",
      schemaVersion: "0.7.0",
      compatibleVersions: ["0.7.0"],
      role: {
        title: "Frontend Architect",
        category: RoleCategory.ARCHITECT,
        description: "Defines technical architecture and implementation strategy",
        icon: "code"
      },
      contextSources: [
        {
          id: "user_input",
          label: "User Creative Input",
          type: ContextType.USER_INPUT,
          selected: true
        },
        {
          id: "agent_3_output",
          label: "UI/UX Product Manager Output",
          type: ContextType.AGENT_OUTPUT,
          agentId: 3,
          selected: true
        },
        {
          id: "agent_4_output",
          label: "Creative Director Output",
          type: ContextType.AGENT_OUTPUT,
          agentId: 4,
          selected: true
        },
        {
          id: "agent_6_output",
          label: "Visual Researcher Output",
          type: ContextType.AGENT_OUTPUT,
          agentId: 6,
          selected: true
        }
      ],
      task: {
        promptTemplate: `You are a Frontend Architect. Based on the UX requirements, creative direction, and visual research, define the technical architecture and implementation strategy.

Input:
- User Idea: "{USER_INPUT}"
- UX Requirements: {AGENT_3_OUTPUT}
- Creative Direction: {AGENT_4_OUTPUT}
- Visual Research: {AGENT_6_OUTPUT}

Define:
- Technology stack recommendations
- Architecture patterns
- Component structure
- State management approach
- Performance optimization strategies
- Accessibility implementation
- Testing strategy
- Deployment considerations

Provide comprehensive technical architecture.`,
        outputFormat: OutputFormat.JSON,
        maxTokens: 2500,
        temperature: 0.5,
        instructions: ["Define scalable architecture", "Consider performance", "Include accessibility", "Plan for maintainability"]
      },
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      version: "0.7.0"
    }
  ],
  settings: {
    defaultLLM: "claude-3-sonnet",
    autoSave: true,
    qualityGates: true
  }
};

// Helper function to get default configuration
export const getDefaultConfiguration = (): ConfigurationFile => {
  return JSON.parse(JSON.stringify(DEFAULT_CONFIG_V07));
};

// Helper function to reset to default configuration
export const resetToDefaultConfiguration = (): ConfigurationFile => {
  const config = getDefaultConfiguration();
  config.header.modified = new Date().toISOString();
  return config;
}; 