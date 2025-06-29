import React, { useState } from 'react';
import Layout from './components/Layout';
import AgentList from './components/AgentList';
import { getVersionInfo, formatVersionDisplay, getVersionBadgeColor } from './utils/version';
import { useAgentConfiguration } from './hooks/useAgentConfiguration';
import { AgentConfiguration } from './types/agent';

const App: React.FC = () => {
  const versionInfo = getVersionInfo();
  const versionDisplay = formatVersionDisplay();
  const badgeColor = getVersionBadgeColor();
  
  // Agent configuration management
  const {
    agents,
    currentConfig,
    isModified,
    validationStatus,
    isLoading,
    error,
    saveConfiguration,
    resetToDefault
  } = useAgentConfiguration();

  // UI state
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState<'overview' | 'agents' | 'settings'>('overview');

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
              disabled={isLoading || !isModified}
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
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Phase Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Development Phase</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-bold">1</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Phase 1</h4>
                <p className="text-sm text-gray-600">Basic React application with Tailwind CSS</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-bold">2</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Phase 2</h4>
                <p className="text-sm text-gray-600">Agent configuration system</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-gray-400 font-bold">3</span>
                </div>
                <h4 className="font-medium text-gray-900 mb-2">Phase 3</h4>
                <p className="text-sm text-gray-600">LLM integration and execution</p>
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
                  onClick={handleSaveConfiguration}
                  disabled={!isModified}
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
          />
          
          {selectedAgentId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                Agent {selectedAgentId} selected. Agent editing interface coming in Phase 3.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
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
    </Layout>
  );
};

export default App; 