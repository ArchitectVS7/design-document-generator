import React from 'react';
import { ConfigurationFile } from '../../types/configuration';
import ConfigurationManager from '../ConfigurationManager';

interface SettingsTabProps {
  currentConfig: ConfigurationFile | null;
  onConfigChange: (config: any) => void;
}

const SettingsTab: React.FC<SettingsTabProps> = ({
  currentConfig,
  onConfigChange,
}) => {
  return (
    <div className="space-y-6">
      {/* Configuration Manager */}
      {currentConfig && (
        <ConfigurationManager
          currentConfig={currentConfig}
          onConfigChange={onConfigChange}
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
  );
};

export default SettingsTab;