// Mock LLM Provider for Testing v0.7.0

import { BaseLLMProvider, LLMRequest, LLMResponse, LLMProviderConfig } from './llmProvider';

export class MockLLMProvider extends BaseLLMProvider {
  private responseTemplates: Record<string, string> = {
    'strategist': `{
  "marketAnalysis": {
    "targetAudience": "Tech-savvy professionals aged 25-40",
    "marketSize": "Estimated $2.5B addressable market",
    "competition": "Moderate competition with room for differentiation"
  },
  "valueProposition": "Streamlined workflow automation with AI-powered insights",
  "successMetrics": ["User adoption rate", "Time savings per user", "ROI improvement"],
  "risks": ["Market saturation", "Technical complexity", "User resistance to change"]
}`,
    'researcher': `# Market Research Summary

## Key Findings
- 78% of target users report workflow inefficiencies
- 65% are open to AI-powered solutions
- Primary pain points: manual data entry, repetitive tasks, decision fatigue

## Competitive Analysis
- 3 major competitors identified
- Gap in user-friendly AI integration
- Opportunity for seamless UX design

## Recommendations
1. Focus on intuitive user interface
2. Emphasize time-saving benefits
3. Provide clear ROI demonstration`,
    'designer': `# UI/UX Design Strategy

## Design Principles
- **Simplicity**: Clean, uncluttered interface
- **Efficiency**: Minimize clicks and cognitive load
- **Accessibility**: WCAG 2.1 AA compliance
- **Responsiveness**: Mobile-first approach

## Key Features
1. **Dashboard**: Centralized view of all workflows
2. **Wizard Interface**: Step-by-step setup process
3. **Progress Tracking**: Visual indicators of completion
4. **Smart Suggestions**: AI-powered recommendations

## Visual Design
- Color palette: Professional blues and grays
- Typography: Clean, readable sans-serif
- Icons: Consistent, meaningful iconography
- Spacing: Generous whitespace for clarity`,
    'author': `# Technical Specification Document

## Executive Summary
This document outlines the technical requirements for a workflow automation platform that leverages AI to streamline business processes and improve productivity.

## System Architecture
The platform will be built using a microservices architecture with the following components:
- Frontend: React-based SPA with TypeScript
- Backend: Node.js with Express
- Database: PostgreSQL for data persistence
- AI Engine: Integration with multiple LLM providers
- Authentication: OAuth 2.0 with JWT tokens

## Key Features
1. **Workflow Builder**: Drag-and-drop interface for creating automation workflows
2. **AI Integration**: Natural language processing for task automation
3. **Analytics Dashboard**: Real-time insights and performance metrics
4. **API Gateway**: RESTful API for third-party integrations

## Technical Requirements
- **Performance**: Sub-2-second response times
- **Scalability**: Support for 10,000+ concurrent users
- **Security**: SOC 2 Type II compliance
- **Reliability**: 99.9% uptime SLA`,
    'analyst': `# Data Analysis Report

## User Behavior Patterns
- Peak usage: 9 AM - 5 PM weekdays
- Most common workflows: Data entry, report generation, customer communication
- Average session duration: 45 minutes
- Drop-off point: Complex setup processes

## Performance Metrics
- **Adoption Rate**: 23% in first month
- **Retention**: 67% after 30 days
- **Satisfaction**: 4.2/5 average rating
- **Efficiency Gain**: 34% time savings reported

## Recommendations
1. **Simplify Onboarding**: Reduce setup steps by 50%
2. **Enhance Tutorials**: Add interactive walkthroughs
3. **Improve Feedback**: Real-time progress indicators
4. **Optimize Performance**: Reduce load times by 30%`,
    'architect': `# System Architecture Design

## High-Level Architecture
\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   Backend       │
│   (React SPA)   │◄──►│   (Kong)        │◄──►│   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Load Balancer │    │   Database      │
                       │   (Nginx)       │    │   (PostgreSQL)  │
                       └─────────────────┘    └─────────────────┘
\`\`\`

## Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL 15, Redis for caching
- **Infrastructure**: Docker, Kubernetes, AWS
- **Monitoring**: Prometheus, Grafana, ELK Stack

## Security Considerations
- API authentication via JWT tokens
- Rate limiting and DDoS protection
- Data encryption at rest and in transit
- Regular security audits and penetration testing`,
    'default': `# AI Agent Response

Based on the provided context and requirements, here is my analysis and recommendations:

## Key Insights
- The project shows strong potential for market success
- User feedback indicates clear pain points to address
- Technical feasibility is high with current technology stack

## Recommendations
1. **Phase 1**: Focus on core functionality and user experience
2. **Phase 2**: Add advanced AI features and integrations
3. **Phase 3**: Scale infrastructure and optimize performance

## Next Steps
- Conduct user research and testing
- Develop MVP with essential features
- Gather feedback and iterate on design
- Plan for production deployment

This response demonstrates the AI agent's ability to analyze information and provide structured, actionable insights.`
  };

  constructor(config: LLMProviderConfig = { provider: 'mock', model: 'mock-v1' }) {
    super(config);
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const startTime = Date.now();
    
    // Simulate processing delay
    await this.simulateProcessingDelay();
    
    // Generate mock response based on prompt content
    const content = this.generateMockResponse(request);
    
    // Calculate mock usage
    const usage = this.calculateMockUsage(request.prompt, content);
    
    const duration = Date.now() - startTime;
    
    return this.createResponse(content, usage, { duration });
  }

  private async simulateProcessingDelay(): Promise<void> {
    // Random delay between 500ms and 2000ms to simulate real API calls
    const delay = Math.random() * 1500 + 500;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private generateMockResponse(request: LLMRequest): string {
    // Determine response template based on prompt content
    let templateKey = 'default';
    
    const promptLower = request.prompt.toLowerCase();
    
    if (promptLower.includes('strategist') || promptLower.includes('strategy')) {
      templateKey = 'strategist';
    } else if (promptLower.includes('research') || promptLower.includes('market')) {
      templateKey = 'researcher';
    } else if (promptLower.includes('design') || promptLower.includes('ui') || promptLower.includes('ux')) {
      templateKey = 'designer';
    } else if (promptLower.includes('author') || promptLower.includes('document') || promptLower.includes('spec')) {
      templateKey = 'author';
    } else if (promptLower.includes('analyst') || promptLower.includes('data') || promptLower.includes('metrics')) {
      templateKey = 'analyst';
    } else if (promptLower.includes('architect') || promptLower.includes('system') || promptLower.includes('technical')) {
      templateKey = 'architect';
    }

    let response = this.responseTemplates[templateKey];
    
    // Format response based on output format
    switch (request.outputFormat) {
      case 'json':
        if (!response.startsWith('{')) {
          // Convert non-JSON response to JSON format
          response = JSON.stringify({
            content: response,
            type: templateKey,
            timestamp: new Date().toISOString()
          }, null, 2);
        }
        break;
      case 'markdown':
        if (!response.includes('#')) {
          response = `# AI Response\n\n${response}`;
        }
        break;
      case 'text':
        // Remove markdown formatting for plain text
        response = response.replace(/^#+\s*/gm, '').replace(/\*\*(.*?)\*\*/g, '$1');
        break;
    }

    // Add some randomness to make responses more realistic
    response = this.addRandomVariation(response);
    
    return response;
  }

  private addRandomVariation(response: string): string {
    // Add random variations to make responses more realistic
    const variations = [
      'Note: This analysis is based on available data and may require further validation.',
      'Additional research may be needed to confirm these findings.',
      'Consider user feedback when implementing these recommendations.',
      'This response represents one possible approach to the given problem.',
      'Further iteration and testing is recommended for optimal results.'
    ];
    
    if (Math.random() > 0.7) {
      const variation = variations[Math.floor(Math.random() * variations.length)];
      response += `\n\n${variation}`;
    }
    
    return response;
  }

  private calculateMockUsage(prompt: string, response: string): LLMResponse['usage'] {
    // Rough token estimation (4 characters per token)
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(response.length / 4);
    
    return {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens
    };
  }

  async estimateCost(request: LLMRequest): Promise<{
    estimatedTokens: number;
    estimatedCost: number;
    currency: string;
  }> {
    const estimatedTokens = Math.ceil(request.prompt.length / 4) + request.maxTokens;
    
    // Mock cost calculation (very low cost for testing)
    const estimatedCost = estimatedTokens * 0.000001; // $0.000001 per token
    
    return {
      estimatedTokens,
      estimatedCost,
      currency: 'USD'
    };
  }

  // Method to customize response templates for testing
  setResponseTemplate(key: string, template: string): void {
    this.responseTemplates[key] = template;
  }

  // Method to get all available template keys
  getAvailableTemplates(): string[] {
    return Object.keys(this.responseTemplates);
  }
}

// Register the mock provider with the factory
import { LLMProviderFactory } from './llmProvider';
LLMProviderFactory.register('mock', MockLLMProvider); 