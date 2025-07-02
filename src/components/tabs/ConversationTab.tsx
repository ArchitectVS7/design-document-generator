import React from 'react';
import { AgentConfiguration } from '../../types/agent';
import { LLMProvider } from '../../services/llmProvider';
import ConversationFlow from '../ConversationFlow';

interface ConversationTabProps {
  agents: AgentConfiguration[];
  llmProvider: LLMProvider;
}

const ConversationTab: React.FC<ConversationTabProps> = ({
  agents,
  llmProvider,
}) => {
  return (
    <div className="space-y-6">
      <ConversationFlow
        agents={agents}
        llmProvider={llmProvider}
      />
    </div>
  );
};

export default ConversationTab;