import React from 'react';
import { AgentConfiguration } from '../../types/agent';
import { ConfigurationFile } from '../../types/configuration';

interface OverviewTabProps {
  agents: AgentConfiguration[];
  currentConfig: ConfigurationFile | null;
  validationStatus: { valid: boolean } | null;
  hasModifications: boolean;
  llmStatus: 'online' | 'offline' | 'error';
  dbStatus: 'online' | 'offline' | 'error';
  llmError: string | null;
  offlineMode: boolean;
  onSetActiveTab: (tab: string) => void;
  onSaveConfiguration: () => void;
  onResetConfiguration: () => void;
  onOfflineModeChange: (offline: boolean) => void;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  agents,
  currentConfig,
  validationStatus,
  hasModifications,
  llmStatus,
  dbStatus,
  llmError,
  offlineMode,
  onSetActiveTab,
  onSaveConfiguration,
  onResetConfiguration,
  onOfflineModeChange,
}) => {
  return (
    <div className="space-y-8">
      {/* Phase Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Development Phase</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {[
            { phase: 1, title: "Basic React application with Tailwind CSS", status: "Complete" },
            { phase: 2, title: "Agent configuration system", status: "Complete" },
            { phase: 3, title: "Configuration file management", status: "Complete" },
            { phase: 4, title: "LLM integration & conversation flow", status: "Complete" },
            { phase: 5, title: "Database Integration (Backend)", status: "Current" },
            { phase: 6, title: "Real LLM Integration", status: "Planned" },
          ].map(({ phase, title, status }) => (
            <div key={phase} className="text-center">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${
                status === "Complete" ? "bg-green-100" : 
                status === "Current" ? "bg-orange-100" : "bg-gray-100"
              }`}>
                <span className={`font-bold ${
                  status === "Complete" ? "text-green-600" : 
                  status === "Current" ? "text-orange-600" : "text-gray-600"
                }`}>
                  {status === "Complete" ? "✓" : phase}
                </span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">Phase {phase}</h4>
              <p className="text-sm text-gray-600">{title}</p>
              <span className={`inline-block mt-2 px-2 py-1 text-xs rounded-full ${
                status === "Complete" ? "bg-green-100 text-green-800" : 
                status === "Current" ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-800"
              }`}>
                {status}
              </span>
            </div>
          ))}
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
              onClick={() => onSetActiveTab('agents')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Configure Agents</div>
              <div className="text-sm text-gray-600">Customize agent roles and tasks</div>
            </button>
            <button
              onClick={() => onSetActiveTab('conversation')}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Start Conversation</div>
              <div className="text-sm text-gray-600">Begin multi-agent document generation</div>
            </button>
            <button
              onClick={onSaveConfiguration}
              disabled={!hasModifications}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors disabled:opacity-50"
            >
              <div className="font-medium text-gray-900">Save Configuration</div>
              <div className="text-sm text-gray-600">Export current settings</div>
            </button>
            <button
              onClick={onResetConfiguration}
              className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
            >
              <div className="font-medium text-gray-900">Reset to Default</div>
              <div className="text-sm text-gray-600">Restore factory settings</div>
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-6 flex items-center gap-8">
        <div className="flex items-center gap-2">
          <span className="font-medium">LLM Connection:</span>
          <span className={`inline-block w-3 h-3 rounded-full ${
            llmStatus === 'online' ? 'bg-green-500' : 
            llmStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></span>
          <span className="text-xs text-gray-600">
            {llmStatus === 'online' ? 'Anthropic (Online)' : 
             llmStatus === 'offline' ? 'Offline (Mock)' : 'Error'}
          </span>
          {llmError && <span className="text-xs text-red-500 ml-2">{llmError}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">DB Connection:</span>
          <span className={`inline-block w-3 h-3 rounded-full ${
            dbStatus === 'online' ? 'bg-green-500' : 
            dbStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></span>
          <span className="text-xs text-gray-600">
            {dbStatus === 'online' ? 'Online' : 
             dbStatus === 'offline' ? 'Offline' : 'Error'}
          </span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={offlineMode}
            onChange={(e) => onOfflineModeChange(e.target.checked)}
            className="form-checkbox"
          />
          <span className="text-sm">Offline Test Mode</span>
        </label>
      </div>
    </div>
  );
};

export default OverviewTab;