import React, { useState } from 'react';
import Layout from './components/Layout';
import AgentList from './components/AgentList';
import ConfigurationManager from './components/ConfigurationManager';
import ConversationFlow from './components/ConversationFlow';
import { getVersionInfo, formatVersionDisplay, getVersionBadgeColor } from './utils/version';
import { useAgentConfiguration } from './hooks/useAgentConfiguration';
import { AgentConfiguration } from './types/agent';
import { LLMProviderFactory } from './services/llmProvider';
import './services/mockLLM'; // Ensure mock provider is registered
import { LogViewer } from './components/LogViewer';
import { logger } from './utils/logger';

const App: React.FC = () => {
  const versionInfo = getVersionInfo();
  const versionDisplay = formatVersionDisplay();
  const badgeColor = getVersionBadgeColor();
  
  // Initialize LLM provider (using mock for now)
  const llmProvider = LLMProviderFactory.create('mock', {
    provider: 'mock',
    model: 'mock-v1',
    timeout: 1000
  });
  
  // Agent configuration management
  const {
    agents,
    currentConfig,
    isModified,
    validationStatus,
    isLoading,
    error,
    saveConfiguration,
    resetToDefault,
    loadConfiguration
  } = useAgentConfiguration();

  // UI state
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'conversation' | 'settings' | 'admin'>('overview');
  const [showLogViewer, setShowLogViewer] = useState(false);

  const handleAgentSelect = (agent: AgentConfiguration) => {
    setSelectedAgentId(agent.id);
    console.log('Selected agent:', agent.name);
  };

  const handleSaveConfiguration = async () => {
    const result = await saveConfiguration({
      description: `Configuration saved on ${new Date().toLocaleDateString()}`,
      downloadFile: true
    });
    
    if (result) {
      console.log('Configuration saved successfully');
    }
  };

  const handleResetConfiguration = () => {
    if (window.confirm('Are you sure you want to reset to default configuration? This will clear all customizations.')) {
      resetToDefault();
      setSelectedAgentId(undefined);
    }
  };

  const handleConfigChange = (newConfig: any) => {
    loadConfiguration(newConfig);
    console.log('Configuration updated from ConfigurationManager');
  };

  const handleAgentUpdate = (updatedAgent: any) => {
    // Update the agent in the current configuration
    if (currentConfig) {
      const updatedAgents = agents.map(agent => 
        agent.id === updatedAgent.id ? updatedAgent : agent
      );
      const updatedConfig = {
        ...currentConfig,
        agents: updatedAgents,
        header: {
          ...currentConfig.header,
          modified: new Date().toISOString()
        }
      };
      loadConfiguration(updatedConfig);
      console.log('Agent updated:', updatedAgent.role.title);
    }
  };

  // Check if configuration has been modified (either through agent updates or other changes)
  const hasModifications = isModified || agents.some(agent => 
    new Date(agent.modified).getTime() > new Date(agent.created).getTime()
  );

  return (
    <Layout>
      {/* Header with version and actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeColor}`}>
              {versionDisplay}
            </span>
            {isModified && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Modified
              </span>
            )}
            {validationStatus && !validationStatus.valid && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Validation Errors
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveConfiguration}
              disabled={isLoading || (!hasModifications && !currentConfig)}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {isLoading ? 'Saving...' : 'Save Configuration'}
            </button>
            <button
              onClick={handleResetConfiguration}
              className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg border border-gray-300 transition-colors"
            >
              Reset to Default
            </button>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Design Document Generator
        </h1>
        
        <p className="text-xl text-gray-600 max-w-3xl">
          Transform your creative ideas into comprehensive technical specifications using our multi-agent AI system.
        </p>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'agents'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Agent Configuration ({agents.length})
          </button>
          <button
            onClick={() => setActiveTab('conversation')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'conversation'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Conversation
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'admin'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Admin
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Phase Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Development Phase</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Phase 1</h4>
                <p className="text-sm text-gray-600">Basic React application with Tailwind CSS</p>
                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Complete</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Phase 2</h4>
                <p className="text-sm text-gray-600">Agent configuration system</p>
                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Complete</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-green-600 font-bold">✓</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Phase 3</h4>
                <p className="text-sm text-gray-600">Configuration file management</p>
                <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Complete</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Phase 4</h4>
                <p className="text-sm text-gray-600">LLM integration & conversation flow</p>
                <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Current</span>
              </div>
            </div>
          </div>

          {/* Configuration Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Agents Configured:</span>
                  <span className="font-medium">{agents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Configuration Version:</span>
                  <span className="font-medium">{currentConfig?.header.version || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Modified:</span>
                  <span className="font-medium">
                    {currentConfig?.header.modified 
                      ? new Date(currentConfig.header.modified).toLocaleDateString()
                      : 'N/A'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Validation Status:</span>
                  <span className={`font-medium ${
                    validationStatus?.valid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {validationStatus?.valid ? 'Valid' : 'Invalid'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab('agents')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Configure Agents</div>
                  <div className="text-sm text-gray-600">Customize agent roles and tasks</div>
                </button>
                <button
                  onClick={() => setActiveTab('conversation')}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Start Conversation</div>
                  <div className="text-sm text-gray-600">Begin multi-agent document generation</div>
                </button>
                <button
                  onClick={handleSaveConfiguration}
                  disabled={!hasModifications}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-50"
                >
                  <div className="font-medium text-gray-900">Save Configuration</div>
                  <div className="text-sm text-gray-600">Export current settings</div>
                </button>
                <button
                  onClick={handleResetConfiguration}
                  className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Reset to Default</div>
                  <div className="text-sm text-gray-600">Restore factory settings</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'agents' && (
        <div className="space-y-6">
          <AgentList
            agents={agents}
            onAgentSelect={handleAgentSelect}
            selectedAgentId={selectedAgentId}
            onAgentUpdate={handleAgentUpdate}
          />
          
          {selectedAgentId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                Agent {selectedAgentId} selected. Click "Edit" on any agent to modify its configuration.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'conversation' && (
        <div className="space-y-6">
          <ConversationFlow
            agents={agents}
            llmProvider={llmProvider}
          />
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Configuration Manager */}
          {currentConfig && (
            <ConfigurationManager
              currentConfig={currentConfig}
              onConfigChange={handleConfigChange}
            />
          )}
          
          {/* System Settings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Default LLM Provider</h4>
                  <p className="text-sm text-gray-600">{currentConfig?.settings.defaultLLM || 'Not configured'}</p>
                </div>
                <span className="text-sm text-gray-500">Coming in Phase 3</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Auto Save</h4>
                  <p className="text-sm text-gray-600">Automatically save configuration changes</p>
                </div>
                <span className="text-sm text-gray-500">Coming in Phase 3</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Quality Gates</h4>
                  <p className="text-sm text-gray-600">Review agent outputs before proceeding</p>
                </div>
                <span className="text-sm text-gray-500">Coming in Phase 3</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h2>
            
            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">System Logs</h3>
                <p className="text-gray-600 mb-4">
                  View real-time system logs for debugging and monitoring the conversation flow.
                </p>
                <button
                  onClick={() => setShowLogViewer(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Open Log Viewer
                </button>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-4">System Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-mono">0.7.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Agents:</span>
                    <span className="font-mono">{agents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Log Entries:</span>
                    <span className="font-mono">{logger.getLogs().length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version Details */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
          <span>Version {versionInfo.version}</span>
          <span>•</span>
          <span>{versionInfo.phase} Phase</span>
          <span>•</span>
          <span>Built with React + TypeScript + Tailwind CSS</span>
        </div>
      </div>

      {/* Log Viewer Modal */}
      <LogViewer
        isVisible={showLogViewer}
        onClose={() => setShowLogViewer(false)}
      />
    </Layout>
  );
};

export default App;