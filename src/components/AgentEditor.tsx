import React, { useState, useEffect } from 'react';
import { AgentConfiguration, ContextSource, ContextType, RoleCategory } from '../types/agent';

interface AgentEditorProps {
  agent: AgentConfiguration;
  allAgents: AgentConfiguration[];
  onSave: (updatedAgent: AgentConfiguration) => void;
  onCancel: () => void;
  isOpen: boolean;
}

const AgentEditor: React.FC<AgentEditorProps> = ({
  agent,
  allAgents,
  onSave,
  onCancel,
  isOpen
}) => {
  const [editedAgent, setEditedAgent] = useState<AgentConfiguration>(agent);
  const [errors, setErrors] = useState<string[]>([]);

  // Update edited agent when prop changes
  useEffect(() => {
    setEditedAgent(agent);
    setErrors([]);
  }, [agent]);

  // Get available context sources (upstream agents + user input)
  const getAvailableContextSources = (): ContextSource[] => {
    const sources: ContextSource[] = [
      {
        id: 'user_input',
        label: 'User Raw Input',
        type: ContextType.USER_INPUT,
        selected: false,
        available: true
      }
    ];

    // Add upstream agents (agents with lower IDs)
    allAgents
      .filter(a => a.id < agent.id)
      .forEach(upstreamAgent => {
        sources.push({
          id: `agent_${upstreamAgent.id}_output`,
          label: `${upstreamAgent.role.title} Output`,
          type: ContextType.AGENT_OUTPUT,
          agentId: upstreamAgent.id,
          selected: false,
          available: true
        });
      });

    return sources;
  };

  // Validate agent configuration
  const validateAgent = (): boolean => {
    const newErrors: string[] = [];

    if (!editedAgent.role.title.trim()) {
      newErrors.push('Agent name is required');
    }

    if (!editedAgent.role.description.trim()) {
      newErrors.push('Agent role description is required');
    }

    if (editedAgent.contextSources.length === 0) {
      newErrors.push('At least one context source must be selected');
    }

    if (!editedAgent.task.promptTemplate.trim()) {
      newErrors.push('Task prompt template is required');
    }

    if (editedAgent.task.maxTokens < 100 || editedAgent.task.maxTokens > 4000) {
      newErrors.push('Max tokens must be between 100 and 4000');
    }

    if (editedAgent.task.temperature < 0 || editedAgent.task.temperature > 2) {
      newErrors.push('Temperature must be between 0 and 2');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Handle context source selection
  const handleContextSourceToggle = (sourceId: string) => {
    setEditedAgent(prev => ({
      ...prev,
      contextSources: prev.contextSources.some(s => s.id === sourceId)
        ? prev.contextSources.filter(s => s.id !== sourceId)
        : [...prev.contextSources, getAvailableContextSources().find(s => s.id === sourceId)!]
    }));
  };

  // Handle save
  const handleSave = () => {
    if (validateAgent()) {
      onSave({
        ...editedAgent,
        modified: new Date().toISOString()
      });
    }
  };

  if (!isOpen) return null;

  const availableSources = getAvailableContextSources();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Agent: {agent.role.title}</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error display */}
        {errors.length > 0 && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-400 mr-2">⚠️</div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
                <ul className="text-sm text-red-700 mt-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Agent Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Name
                </label>
                <input
                  type="text"
                  value={editedAgent.role.title}
                  onChange={(e) => setEditedAgent(prev => ({
                    ...prev,
                    role: { ...prev.role, title: e.target.value }
                  }))}
                  placeholder="e.g., Intake Agent, Market Researcher"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A brief description such as "Intake Agent" or "Market Researcher"
                </p>
              </div>

              {/* Agent Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Role
                </label>
                <textarea
                  value={editedAgent.role.description}
                  onChange={(e) => setEditedAgent(prev => ({
                    ...prev,
                    role: { ...prev.role, description: e.target.value }
                  }))}
                  placeholder="e.g., You are a programming expert well versed in full stack development of mobile apps according to industry standards and best practices"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  A more descriptive term of the Agent's job which will provide instructions to an LLM prompt
                </p>
              </div>

              {/* Task Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Prompt Template
                </label>
                <textarea
                  value={editedAgent.task.promptTemplate}
                  onChange={(e) => setEditedAgent(prev => ({
                    ...prev,
                    task: { ...prev.task, promptTemplate: e.target.value }
                  }))}
                  placeholder="Enter the task prompt template..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The specific task instructions for this agent
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Context Sources */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Context Sources
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Multiple radio button selections allowing an Agent to select any of the upstream agents final output as well as the original user raw input
                </p>
                <div className="space-y-3">
                  {availableSources.map((source) => (
                    <label key={source.id} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editedAgent.contextSources.some(s => s.id === source.id)}
                        onChange={() => handleContextSourceToggle(source.id)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{source.label}</div>
                        <div className="text-xs text-gray-500">
                          {source.type === ContextType.USER_INPUT 
                            ? 'Original user request and requirements'
                            : `Final output from ${allAgents.find(a => a.id === source.agentId)?.role.title || 'Unknown Agent'}`
                          }
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                {availableSources.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No upstream agents available for context</p>
                )}
              </div>

              {/* Task Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Tokens
                  </label>
                  <input
                    type="number"
                    value={editedAgent.task.maxTokens}
                    onChange={(e) => setEditedAgent(prev => ({
                      ...prev,
                      task: { ...prev.task, maxTokens: parseInt(e.target.value) || 1000 }
                    }))}
                    min="100"
                    max="4000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editedAgent.task.temperature}
                    onChange={(e) => setEditedAgent(prev => ({
                      ...prev,
                      task: { ...prev.task, temperature: parseFloat(e.target.value) || 0.7 }
                    }))}
                    min="0"
                    max="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {/* Agent Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent Category
                </label>
                <select
                  value={editedAgent.role.category}
                  onChange={(e) => setEditedAgent(prev => ({
                    ...prev,
                    role: { ...prev.role, category: e.target.value as RoleCategory }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value={RoleCategory.ANALYST}>Analyst</option>
                  <option value={RoleCategory.RESEARCHER}>Researcher</option>
                  <option value={RoleCategory.DESIGNER}>Designer</option>
                  <option value={RoleCategory.AUTHOR}>Author</option>
                  <option value={RoleCategory.STRATEGIST}>Strategist</option>
                  <option value={RoleCategory.ARCHITECT}>Architect</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentEditor; 