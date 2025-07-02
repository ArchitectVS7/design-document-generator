import React from 'react';
import { AgentConfiguration } from '../../types/agent';
import AgentList from '../AgentList';

interface AgentsTabProps {
  agents: AgentConfiguration[];
  selectedAgentId: number | undefined;
  onAgentSelect: (agent: AgentConfiguration) => void;
  onAgentUpdate: (agent: AgentConfiguration) => void;
}

const AgentsTab: React.FC<AgentsTabProps> = ({
  agents,
  selectedAgentId,
  onAgentSelect,
  onAgentUpdate,
}) => {
  return (
    <div className="space-y-6">
      <AgentList
        agents={agents}
        onAgentSelect={onAgentSelect}
        selectedAgentId={selectedAgentId}
        onAgentUpdate={onAgentUpdate}
      />
      
      {selectedAgentId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            Agent {selectedAgentId} selected. Click "Edit" on any agent to modify its configuration.
          </p>
        </div>
      )}
    </div>
  );
};

export default AgentsTab;