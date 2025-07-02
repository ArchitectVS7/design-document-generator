import React, { useState, useEffect, lazy, Suspense } from 'react';
import Layout from './components/Layout';
import AppHeader from './components/AppHeader';
import TabNavigation from './components/TabNavigation';
import { useAgentConfiguration } from './hooks/useAgentConfiguration';
import { AgentConfiguration } from './types/agent';
import { LLMProviderFactory } from './services/llmProvider';
import './services/mockLLM'; // Ensure mock provider is registered
import { LogViewer } from './components/LogViewer';
import { getVersionInfo } from './utils/version';

// Define tab type
type TabType = 'overview' | 'agents' | 'conversation' | 'settings' | 'admin';

// Lazy load tab components for better performance
const OverviewTab = lazy(() => import('./components/tabs/OverviewTab'));
const AgentsTab = lazy(() => import('./components/tabs/AgentsTab'));
const ConversationTab = lazy(() => import('./components/tabs/ConversationTab'));
const SettingsTab = lazy(() => import('./components/tabs/SettingsTab'));
const AdminTab = lazy(() => import('./components/tabs/AdminTab'));

// Loading component for Suspense fallbacks
const TabLoader: React.FC = () => (
  <div className="flex items-center justify-center py-12">
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse"></div>
      <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
      <div className="w-4 h-4 bg-primary-600 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  </div>
);

// Custom hook for LLM connection management
const useLLMConnection = (offlineMode: boolean) => {
  const [llmStatus, setLlmStatus] = useState<'online' | 'offline' | 'error'>('offline');
  const [llmError, setLlmError] = useState<string | null>(null);
  
  const llmProvider = offlineMode
    ? LLMProviderFactory.create('mock', { provider: 'mock', model: 'mock-v1', timeout: 1000 })
    : LLMProviderFactory.create('anthropic', { provider: 'anthropic', model: 'claude-3-sonnet', timeout: 10000 });

  useEffect(() => {
    if (offlineMode) {
      setLlmStatus('offline');
      setLlmError(null);
      return;
    }

    const checkConnection = async () => {
      try {
        await llmProvider.complete({
          prompt: 'ping',
          maxTokens: 1,
          temperature: 0.1,
          outputFormat: 'text',
        });
        setLlmStatus('online');
        setLlmError(null);
      } catch (e: any) {
        setLlmStatus('error');
        setLlmError(e?.message || 'LLM connection failed');
      }
    };

    checkConnection();
  }, [offlineMode, llmProvider]);

  return { llmProvider, llmStatus, llmError };
};

// Custom hook for database connection
const useDatabaseConnection = () => {
  const [dbStatus, setDbStatus] = useState<'online' | 'offline' | 'error'>('offline');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const res = await fetch('/api/v1/sessions', { method: 'GET' });
        setDbStatus(res.ok ? 'online' : 'error');
      } catch {
        setDbStatus('offline');
      }
    };

    checkConnection();
  }, []);

  return dbStatus;
};

const App: React.FC = () => {
  const versionInfo = getVersionInfo();
  
  // UI state
  const [selectedAgentId, setSelectedAgentId] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [showLogViewer, setShowLogViewer] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);

  // Tab change handler with type conversion
  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
  };

  // Custom hooks for connections
  const { llmProvider, llmStatus, llmError } = useLLMConnection(offlineMode);
  const dbStatus = useDatabaseConnection();

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

  // Event handlers
  const handleAgentSelect = (agent: AgentConfiguration) => {
    setSelectedAgentId(agent.id);
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
  };

  const handleAgentUpdate = (updatedAgent: any) => {
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
    }
  };

  // Check if configuration has been modified
  const hasModifications = isModified || agents.some(agent => 
    new Date(agent.modified).getTime() > new Date(agent.created).getTime()
  );

  // Render tab content with lazy loading
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Suspense fallback={<TabLoader />}>
            <OverviewTab
              agents={agents}
              currentConfig={currentConfig}
              validationStatus={validationStatus}
              hasModifications={hasModifications}
              llmStatus={llmStatus}
              dbStatus={dbStatus}
              llmError={llmError}
              offlineMode={offlineMode}
              onSetActiveTab={handleTabChange}
              onSaveConfiguration={handleSaveConfiguration}
              onResetConfiguration={handleResetConfiguration}
              onOfflineModeChange={setOfflineMode}
            />
          </Suspense>
        );

      case 'agents':
        return (
          <Suspense fallback={<TabLoader />}>
            <AgentsTab
              agents={agents}
              selectedAgentId={selectedAgentId}
              onAgentSelect={handleAgentSelect}
              onAgentUpdate={handleAgentUpdate}
            />
          </Suspense>
        );

      case 'conversation':
        return (
          <Suspense fallback={<TabLoader />}>
            <ConversationTab
              agents={agents}
              llmProvider={llmProvider}
            />
          </Suspense>
        );

      case 'settings':
        return (
          <Suspense fallback={<TabLoader />}>
            <SettingsTab
              currentConfig={currentConfig}
              onConfigChange={handleConfigChange}
            />
          </Suspense>
        );

      case 'admin':
        return (
          <Suspense fallback={<TabLoader />}>
            <AdminTab
              agents={agents}
              onShowLogViewer={() => setShowLogViewer(true)}
            />
          </Suspense>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      {/* Header */}
      <AppHeader
        isModified={isModified}
        validationStatus={validationStatus}
        hasModifications={hasModifications}
        isLoading={isLoading}
        currentConfig={currentConfig}
        onSaveConfiguration={handleSaveConfiguration}
        onResetConfiguration={handleResetConfiguration}
      />

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
      <TabNavigation
        activeTab={activeTab}
        agentCount={agents.length}
        onTabChange={handleTabChange}
      />

      {/* Tab content */}
      {renderTabContent()}

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

      {/* LLM Connection Error */}
      {llmStatus === 'error' && !offlineMode && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">LLM Connection Error</h3>
              <p className="text-sm text-red-700 mt-1">{llmError || 'Unable to connect to Anthropic LLM. Please check your API key or network.'}</p>
              <p className="text-xs text-gray-500 mt-1">You can switch to Offline Test Mode to use the mock LLM for testing.</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;