import React, { useState } from 'react';
import { AgentConfiguration, RoleCategory } from '../types/agent';
import AgentEditor from './AgentEditor';

interface AgentListProps {
  agents: AgentConfiguration[];
  onAgentSelect?: (agent: AgentConfiguration) => void;
  selectedAgentId?: number;
  onAgentUpdate?: (updatedAgent: AgentConfiguration) => void;
}

const AgentList: React.FC<AgentListProps> = ({ 
  agents, 
  onAgentSelect, 
  selectedAgentId,
  onAgentUpdate
}) => {
  const [editingAgent, setEditingAgent] = useState<AgentConfiguration | null>(null);

  console.log('AgentList received agents:', agents);
  console.log('Agent names:', agents.map(a => a.name));

  const getCategoryColor = (category: RoleCategory): string => {
    switch (category) {
      case RoleCategory.STRATEGIST:
        return 'bg-blue-100 text-blue-800';
      case RoleCategory.RESEARCHER:
        return 'bg-green-100 text-green-800';
      case RoleCategory.DESIGNER:
        return 'bg-purple-100 text-purple-800';
      case RoleCategory.AUTHOR:
        return 'bg-yellow-100 text-yellow-800';
      case RoleCategory.ANALYST:
        return 'bg-orange-100 text-orange-800';
      case RoleCategory.ARCHITECT:
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: RoleCategory): string => {
    switch (category) {
      case RoleCategory.STRATEGIST:
        return '🎯';
      case RoleCategory.RESEARCHER:
        return '🔍';
      case RoleCategory.DESIGNER:
        return '🎨';
      case RoleCategory.AUTHOR:
        return '✍️';
      case RoleCategory.ANALYST:
        return '📊';
      case RoleCategory.ARCHITECT:
        return '🏗️';
      default:
        return '🤖';
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleEditAgent = (agent: AgentConfiguration, event: React.MouseEvent) => {
    event.stopPropagation();
    setEditingAgent(agent);
  };

  const handleSaveAgent = (updatedAgent: AgentConfiguration) => {
    onAgentUpdate?.(updatedAgent);
    setEditingAgent(null);
  };

  const handleCancelEdit = () => {
    setEditingAgent(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Agent Configuration</h2>
        <span className="text-sm text-gray-500">{agents.length} agents</span>
      </div>

      <div className="grid gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedAgentId === agent.id 
                ? 'border-primary-500 shadow-md' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onAgentSelect?.(agent)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{getCategoryIcon(agent.role.category)}</span>
                  <div>
                    <h3 className="font-medium text-gray-900">{agent.name}</h3>
                    <p className="text-sm text-gray-600">{agent.role.title}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {agent.role.description}
                </p>

                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(agent.role.category)}`}>
                    {agent.role.category}
                  </span>
                  <span className="text-xs text-gray-500">
                    v{agent.version}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Modified: {formatDate(agent.modified)}</span>
                  <span>{agent.contextSources.filter(s => s.selected).length} context sources</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                <div className="text-xs text-gray-400">
                  ID: {agent.id}
                </div>
                <button
                  onClick={(e) => handleEditAgent(agent, e)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Edit
                </button>
                {agent.contextSources.some(s => s.selected) && (
                  <div className="flex gap-1">
                    {agent.contextSources
                      .filter(s => s.selected)
                      .slice(0, 3)
                      .map((source) => (
                        <div
                          key={source.id}
                          className={`w-2 h-2 rounded-full ${
                            source.type === 'user_input' 
                              ? 'bg-green-400' 
                              : 'bg-blue-400'
                          }`}
                          title={source.label}
                        />
                      ))}
                    {agent.contextSources.filter(s => s.selected).length > 3 && (
                      <div className="w-2 h-2 rounded-full bg-gray-400" title="More sources" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Task preview */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-1">Task Preview:</div>
              <p className="text-xs text-gray-700 line-clamp-2">
                {agent.task.promptTemplate.length > 100 
                  ? `${agent.task.promptTemplate.substring(0, 100)}...`
                  : agent.task.promptTemplate
                }
              </p>
            </div>
          </div>
        ))}
      </div>

      {agents.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-400 text-6xl mb-4">🤖</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Agents Configured</h3>
          <p className="text-gray-600">Start by adding your first AI agent to the configuration.</p>
        </div>
      )}

      {/* Agent Editor Modal */}
      {editingAgent && (
        <AgentEditor
          agent={editingAgent}
          allAgents={agents}
          onSave={handleSaveAgent}
          onCancel={handleCancelEdit}
          isOpen={true}
        />
      )}
    </div>
  );
};

export default AgentList; 