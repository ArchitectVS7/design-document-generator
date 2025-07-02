import React from 'react';
import { formatVersionDisplay, getVersionBadgeColor } from '../utils/version';

interface AppHeaderProps {
  isModified: boolean;
  validationStatus: { valid: boolean } | null;
  hasModifications: boolean;
  isLoading: boolean;
  currentConfig: any;
  onSaveConfiguration: () => void;
  onResetConfiguration: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  isModified,
  validationStatus,
  hasModifications,
  isLoading,
  currentConfig,
  onSaveConfiguration,
  onResetConfiguration,
}) => {
  const versionDisplay = formatVersionDisplay();
  const badgeColor = getVersionBadgeColor();

  return (
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
            onClick={onSaveConfiguration}
            disabled={isLoading || (!hasModifications && !currentConfig)}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
          <button
            onClick={onResetConfiguration}
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
  );
};

export default AppHeader;