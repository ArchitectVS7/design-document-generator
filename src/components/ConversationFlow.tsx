// Conversation Flow Component v0.7.0

import React from 'react';
import { useConversation } from '../hooks/useConversation';
import { AgentConfiguration } from '../types/agent';
import { LLMProvider } from '../services/llmProvider';

interface ConversationFlowProps {
  agents: AgentConfiguration[];
  llmProvider: LLMProvider;
}

const ConversationFlow: React.FC<ConversationFlowProps> = ({ agents, llmProvider }) => {
  const [currentMode, setCurrentMode] = React.useState<'auto' | 'manual'>('auto');
  
  const {
    state,
    startConversation,
    pauseConversation,
    resumeConversation,
    stopConversation,
    proceedToNextAgent,
    retryCurrentAgent,
    approvePrompt,
    approveResponse,
    rejectResponse,
    editResponse,
    editPrompt,
    toggleMode,
    getProgress,
    getConversationSummary
  } = useConversation(llmProvider, {
    autoProceed: true,
    enableReview: true,
    maxRetries: 3,
    timeout: 30000,
    mode: currentMode
  });

  const [userInput, setUserInput] = React.useState('');
  const [isInputValid, setIsInputValid] = React.useState(false);
  const [editingPrompt, setEditingPrompt] = React.useState<number | null>(null);
  const [editingResponse, setEditingResponse] = React.useState<number | null>(null);
  const [editedPromptText, setEditedPromptText] = React.useState('');
  const [editedResponseText, setEditedResponseText] = React.useState('');

  // Validate user input
  React.useEffect(() => {
    setIsInputValid(userInput.trim().length > 0);
  }, [userInput]);

  const handleStartConversation = async () => {
    if (!isInputValid) return;
    await startConversation(userInput, agents);
  };

  const handleStopConversation = () => {
    stopConversation();
    setUserInput('');
  };

  const handleEditPrompt = (agentId: number, currentPrompt: string) => {
    setEditingPrompt(agentId);
    setEditedPromptText(currentPrompt);
  };

  const handleSavePrompt = (agentId: number) => {
    editPrompt(agentId, editedPromptText);
    setEditingPrompt(null);
    setEditedPromptText('');
  };

  const handleEditResponse = (agentId: number, currentResponse: string) => {
    setEditingResponse(agentId);
    setEditedResponseText(currentResponse);
  };

  const handleSaveResponse = (agentId: number) => {
    editResponse(agentId, editedResponseText);
    setEditingResponse(null);
    setEditedResponseText('');
  };

  const handleToggleMode = () => {
    const newMode = currentMode === 'auto' ? 'manual' : 'auto';
    setCurrentMode(newMode);
    toggleMode();
  };

  // Generate final output when conversation is completed
  const generateFinalOutput = () => {
    if (state.status !== 'completed' || !state.agentStates) {
      return '';
    }

    const output = Object.entries(state.agentStates)
      .filter(([_, agentState]) => agentState.state === 'Complete')
      .map(([agentId, agentState]) => {
        const agent = agents.find(a => a.id === parseInt(agentId));
        return `## ${agent?.name || `Agent ${agentId}`}\n\n${agentState.currentResponse || ''}\n\n---\n\n`;
      })
      .join('');

    return `# Design Document Generated\n\n**User Request:** ${state.userInput}\n\n**Generated on:** ${new Date().toLocaleString()}\n\n**Session ID:** ${state.sessionId}\n\n---\n\n${output}`;
  };

  const finalOutput = generateFinalOutput();
  const progress = getProgress();
  const summary = getConversationSummary();

  // Get current agent state
  const getCurrentAgentState = () => {
    if (!state.currentAgentId) return null;
    return state.agentStates[state.currentAgentId];
  };

  const currentAgentState = getCurrentAgentState();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Conversation Flow</h2>
        <p className="text-gray-600 mb-4">
          Enter your creative idea below and watch as our AI agents transform it into a comprehensive design document.
        </p>
      </div>

      {/* User Input Section */}
      {!state.isActive && state.status !== 'completed' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Start Your Design Journey</h3>
          
          {/* Mode Selection */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Conversation Mode</h4>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="auto-mode"
                  name="mode"
                  checked={currentMode === 'auto'}
                  onChange={() => setCurrentMode('auto')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="auto-mode" className="text-sm font-medium text-gray-700">
                  Auto Mode
                </label>
                <span className="text-xs text-gray-500">Complete all agents automatically</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="manual-mode"
                  name="mode"
                  checked={currentMode === 'manual'}
                  onChange={() => setCurrentMode('manual')}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="manual-mode" className="text-sm font-medium text-gray-700">
                  Manual Mode
                </label>
                <span className="text-xs text-gray-500">Review and approve each step</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="userInput" className="block text-sm font-medium text-gray-700 mb-2">
                Describe your creative idea or project:
              </label>
              <textarea
                id="userInput"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="e.g., I want to build a task management app for small teams that sends notifications when deadlines are approaching..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={state.isActive}
              />
            </div>
            <button
              onClick={handleStartConversation}
              disabled={!isInputValid || state.isActive}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Start Conversation ({currentMode === 'auto' ? 'Auto' : 'Manual'} Mode)
            </button>
          </div>
        </div>
      )}

      {/* Conversation Status */}
      {state.isActive && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Conversation Progress</h3>
            <div className="flex items-center space-x-4">
              {/* Mode Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Mode:</span>
                <button
                  onClick={handleToggleMode}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    currentMode === 'auto' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {currentMode === 'auto' ? 'Auto' : 'Manual'}
                </button>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                state.status === 'running' ? 'bg-green-100 text-green-800' :
                state.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                state.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {state.status}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress: {summary.completed} of {summary.total} agents completed</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Current Agent Info */}
          {state.currentAgentId && currentAgentState && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-gray-900 mb-2">Current Agent</h4>
              <p className="text-gray-600 mb-2">
                {agents.find(a => a.id === state.currentAgentId)?.name || 'Unknown Agent'}
              </p>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">State:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  currentAgentState.state === 'Idle' ? 'bg-gray-100 text-gray-800' :
                  currentAgentState.state === 'Active.Prompt_Draft' ? 'bg-blue-100 text-blue-800' :
                  currentAgentState.state === 'Active.Prompt_OK' ? 'bg-green-100 text-green-800' :
                  currentAgentState.state === 'Active.Generating' ? 'bg-yellow-100 text-yellow-800' :
                  currentAgentState.state === 'Active.Response_Draft' ? 'bg-purple-100 text-purple-800' :
                  currentAgentState.state === 'Active.Response_OK' ? 'bg-green-100 text-green-800' :
                  currentAgentState.state === 'Complete' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {currentAgentState.state}
                </span>
              </div>
              
              {/* Manual Mode Controls for Current Agent */}
              {currentMode === 'manual' && currentAgentState && (
                <div className="mt-3 flex space-x-2">
                  {currentAgentState.state === 'Active.Prompt_Draft' && (
                    <button
                      onClick={() => approvePrompt(state.currentAgentId!)}
                      className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700"
                    >
                      Approve Prompt
                    </button>
                  )}
                  {currentAgentState.state === 'Active.Response_Draft' && (
                    <>
                      <button
                        onClick={() => approveResponse(state.currentAgentId!)}
                        className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700"
                      >
                        Approve Response
                      </button>
                      <button
                        onClick={() => rejectResponse(state.currentAgentId!, 'User rejected')}
                        className="bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700"
                      >
                        Reject Response
                      </button>
                    </>
                  )}
                  {currentAgentState.state === 'Active.Response_OK' && (
                    <button
                      onClick={proceedToNextAgent}
                      className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700"
                    >
                      Next Agent
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex space-x-3">
            {state.status === 'running' && (
              <button
                onClick={pauseConversation}
                className="bg-yellow-600 text-white py-2 px-4 rounded-md hover:bg-yellow-700 transition-colors"
              >
                Pause
              </button>
            )}
            {state.status === 'paused' && (
              <button
                onClick={resumeConversation}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              >
                Resume
              </button>
            )}
            <button
              onClick={handleStopConversation}
              className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
            >
              Stop
            </button>
          </div>

          {/* Error Display */}
          {state.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{state.error}</p>
              <button
                onClick={retryCurrentAgent}
                className="mt-2 bg-red-600 text-white py-1 px-3 rounded text-sm hover:bg-red-700 transition-colors"
              >
                Retry Current Agent
              </button>
            </div>
          )}
        </div>
      )}

      {/* Final Output Display */}
      {state.status === 'completed' && finalOutput && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Final Design Document</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => navigator.clipboard.writeText(finalOutput)}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={() => {
                  stopConversation();
                  setUserInput('');
                }}
                className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
              >
                Start New Conversation
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono overflow-auto max-h-96">
              {finalOutput}
            </pre>
          </div>
        </div>
      )}

      {/* Agent States Overview */}
      {state.isActive && state.agentStates && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent States</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(agent => {
              const agentState = state.agentStates[agent.id];
              return (
                <div key={agent.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900 text-sm">{agent.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      agentState?.state === 'Idle' ? 'bg-gray-100 text-gray-800' :
                      agentState?.state === 'Active.Prompt_Draft' ? 'bg-blue-100 text-blue-800' :
                      agentState?.state === 'Active.Prompt_OK' ? 'bg-green-100 text-green-800' :
                      agentState?.state === 'Active.Generating' ? 'bg-yellow-100 text-yellow-800' :
                      agentState?.state === 'Active.Response_Draft' ? 'bg-purple-100 text-purple-800' :
                      agentState?.state === 'Active.Response_OK' ? 'bg-green-100 text-green-800' :
                      agentState?.state === 'Complete' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {agentState?.state || 'Unknown'}
                    </span>
                  </div>
                  {agentState?.lastUpdated && (
                    <p className="text-xs text-gray-500">
                      Updated: {new Date(agentState.lastUpdated).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conversation History */}
      {state.conversationHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversation History</h3>
          <div className="space-y-4">
            {state.conversationHistory.map((entry, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{entry.agentName}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      entry.status === 'completed' ? 'bg-green-100 text-green-800' :
                      entry.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      entry.status === 'failed' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {entry.status}
                    </span>
                  </div>
                </div>
                
                {entry.status === 'completed' && (
                  <div className="space-y-3">
                    {/* Prompt Section with Edit Capability */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-blue-900">Prompt</h5>
                        <button
                          onClick={() => handleEditPrompt(entry.agentId, entry.prompt)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                      </div>
                      {editingPrompt === entry.agentId ? (
                        <div className="space-y-2">
                          <textarea
                            value={editedPromptText}
                            onChange={(e) => setEditedPromptText(e.target.value)}
                            className="w-full h-32 px-2 py-1 border border-blue-300 rounded text-sm"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSavePrompt(entry.agentId)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingPrompt(null)}
                              className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <pre className="whitespace-pre-wrap text-sm text-blue-800 font-mono">
                          {entry.prompt}
                        </pre>
                      )}
                    </div>

                    {/* Response Section with Edit Capability */}
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-green-900">Response</h5>
                        <button
                          onClick={() => handleEditResponse(entry.agentId, entry.response)}
                          className="text-green-600 hover:text-green-800 text-sm"
                        >
                          Edit
                        </button>
                      </div>
                      {editingResponse === entry.agentId ? (
                        <div className="space-y-2">
                          <textarea
                            value={editedResponseText}
                            onChange={(e) => setEditedResponseText(e.target.value)}
                            className="w-full h-32 px-2 py-1 border border-green-300 rounded text-sm"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveResponse(entry.agentId)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingResponse(null)}
                              className="bg-gray-600 text-white px-3 py-1 rounded text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <pre className="whitespace-pre-wrap text-sm text-green-800 font-mono">
                          {entry.response}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
                
                {entry.status === 'pending' && (
                  <div className="text-gray-500 text-sm">Processing...</div>
                )}
                
                {entry.status === 'failed' && (
                  <div className="text-red-600 text-sm">{entry.response}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationFlow; 