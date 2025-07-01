import React, { useState, useEffect } from 'react';
import { ConfigurationFile } from '../types/configuration';
import { useConfigurationFile } from '../hooks/useConfigurationFile';
import SaveLoadModal from './SaveLoadModal';
import { MigrationSystem } from '../utils/migration';
import WorkflowTemplateManager from './WorkflowTemplateManager';

interface ConfigurationManagerProps {
  currentConfig: ConfigurationFile;
  onConfigChange: (config: ConfigurationFile) => void;
}

const ConfigurationManager: React.FC<ConfigurationManagerProps> = ({
  currentConfig,
  onConfigChange
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedConfigurations, setSavedConfigurations] = useState<Array<{
    id: string;
    name: string;
    description: string;
    version: string;
    created: string;
    modified: string;
  }>>([]);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [migratedConfig, setMigratedConfig] = useState<ConfigurationFile | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);

  const {
    isLoading,
    error,
    migrationDialog,
    saveConfiguration,
    loadConfiguration,
    importFile,
    exportFile,
    getSavedConfigurations,
    deleteConfiguration,
    approveMigration,
    rejectMigration,
    clearError
  } = useConfigurationFile();

  // Load saved configurations on mount
  useEffect(() => {
    loadSavedConfigurations();
  }, []);

  // Load saved configurations
  const loadSavedConfigurations = async () => {
    const configs = await getSavedConfigurations();
    setSavedConfigurations(configs);
  };

  // Handle save
  const handleSave = async (config: ConfigurationFile, description: string): Promise<boolean> => {
    const success = await saveConfiguration(config, description);
    if (success) {
      // Refresh the saved configurations list
      await loadSavedConfigurations();
    }
    return success;
  };

  // Handle load
  const handleLoad = (config: ConfigurationFile) => {
    onConfigChange(config);
  };

  // Handle import
  const handleImport = async (file: File): Promise<ConfigurationFile | null> => {
    const config = await importFile(file);
    if (config) {
      // Apply the imported configuration
      onConfigChange(config);
      
      // Show success message
      setImportSuccess(`Configuration imported successfully from ${file.name}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setImportSuccess(null), 3000);
    }
    return config;
  };

  // Handle load saved configuration
  const handleLoadSaved = async (configId: string): Promise<ConfigurationFile | null> => {
    const config = await loadConfiguration('local', configId);
    if (config) {
      // Apply the loaded configuration
      onConfigChange(config);
      
      // Show success message
      setImportSuccess(`Configuration "${config.header.description || 'Untitled'}" loaded successfully`);
      
      // Refresh the saved configurations list
      await loadSavedConfigurations();
      
      // Clear success message after 3 seconds
      setTimeout(() => setImportSuccess(null), 3000);
    }
    return config;
  };

  // Handle delete saved configuration
  const handleDeleteSaved = async (configId: string): Promise<boolean> => {
    const success = await deleteConfiguration(configId);
    if (success) {
      // Refresh the saved configurations list
      await loadSavedConfigurations();
    }
    return success;
  };

  // Handle migration approval
  const handleMigrationApproval = (userChanges?: Record<string, any>) => {
    if (migrationDialog) {
      // Apply user changes if provided
      let finalConfig = migrationDialog.migratedConfig;
      if (userChanges && Object.keys(userChanges).length > 0) {
        finalConfig = MigrationSystem.applyUserChanges(finalConfig, userChanges);
      }

      // Apply tag mappings if any
      if (migrationDialog.tagMappings && Object.keys(migrationDialog.tagMappings).length > 0) {
        finalConfig = MigrationSystem.applyTagMappings(finalConfig, migrationDialog.tagMappings);
      }

      // Apply the migrated configuration
      onConfigChange(finalConfig);
      
      // Store the migrated config for saving
      setMigratedConfig(finalConfig);
      setMigrationComplete(true);
      
      // Clear migration dialog
      approveMigration(userChanges);
      
      console.log('Migration completed successfully');
    }
  };

  // Handle migration rejection
  const handleMigrationRejection = () => {
    rejectMigration();
  };

  // Handle save migrated configuration
  const handleSaveMigratedConfig = async () => {
    if (migratedConfig) {
      const success = await saveConfiguration(migratedConfig, 
        `Migrated from v${migrationDialog?.originalConfig.header.version || 'unknown'} to v${migratedConfig.header.version}`
      );
      if (success) {
        setMigrationComplete(false);
        setMigratedConfig(null);
        await loadSavedConfigurations();
      }
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Configuration Manager</h2>
          <p className="text-sm text-gray-600 mt-1">
            Save, load, and manage your agent configurations
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsTemplateManagerOpen(true)}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            Workflow Templates
          </button>
          <button
            onClick={() => exportFile(currentConfig)}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Export
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Save/Load
          </button>
        </div>
      </div>

      {/* Migration Complete Message */}
      {migrationComplete && migratedConfig && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-green-400 mr-3">✅</div>
              <div>
                <h3 className="text-sm font-medium text-green-800">Migration Completed Successfully</h3>
                <p className="text-sm text-green-700 mt-1">
                  Configuration has been migrated from v{migrationDialog?.originalConfig.header.version || 'unknown'} to v{migratedConfig.header.version}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSaveMigratedConfig}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Save New Version
              </button>
              <button
                onClick={() => {
                  setMigrationComplete(false);
                  setMigratedConfig(null);
                }}
                className="px-3 py-1 text-green-600 text-sm hover:text-green-700 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Success Message */}
      {importSuccess && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-green-400 mr-3">✅</div>
              <div>
                <h3 className="text-sm font-medium text-green-800">Configuration Loaded Successfully</h3>
                <p className="text-sm text-green-700 mt-1">{importSuccess}</p>
              </div>
            </div>
            <button
              onClick={() => setImportSuccess(null)}
              className="text-green-400 hover:text-green-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-red-400 mr-2">⚠️</div>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Current configuration info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-3">Current Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Version:</span>
            <div className="font-medium">{currentConfig.header.version}</div>
          </div>
          <div>
            <span className="text-gray-600">Agents:</span>
            <div className="font-medium">{currentConfig.agents.length}</div>
          </div>
          <div>
            <span className="text-gray-600">Created:</span>
            <div className="font-medium">{formatDate(currentConfig.header.created)}</div>
          </div>
          <div>
            <span className="text-gray-600">Modified:</span>
            <div className="font-medium">{formatDate(currentConfig.header.modified)}</div>
          </div>
        </div>
        {currentConfig.header.description && (
          <div className="mt-3">
            <span className="text-gray-600">Description:</span>
            <div className="font-medium">{currentConfig.header.description}</div>
          </div>
        )}
      </div>

      {/* Saved configurations preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Saved Configurations</h3>
          <span className="text-sm text-gray-500">{savedConfigurations.length} saved</span>
        </div>
        
        {savedConfigurations.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-gray-400 text-3xl mb-3">📁</div>
            <p className="text-gray-600">No saved configurations yet</p>
            <p className="text-sm text-gray-500 mt-1">Save your first configuration to get started</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {savedConfigurations.slice(0, 3).map((config) => (
              <div
                key={config.id}
                className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{config.name}</h4>
                    <div className="flex items-center space-x-3 mt-1 text-xs text-gray-500">
                      <span>v{config.version}</span>
                      <span>{formatDate(config.modified)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLoadSaved(config.id)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Load
                  </button>
                </div>
              </div>
            ))}
            {savedConfigurations.length > 3 && (
              <div className="text-center py-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  View all {savedConfigurations.length} configurations
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save/Load Modal */}
      <SaveLoadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        onLoad={handleLoad}
        onImport={handleImport}
        currentConfig={currentConfig}
        savedConfigurations={savedConfigurations}
        onLoadSaved={handleLoadSaved}
        onDeleteSaved={handleDeleteSaved}
        isLoading={isLoading}
        error={error}
      />

      {/* Migration Dialog */}
      {migrationDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Configuration Migration Required</h2>
              <button
                onClick={handleMigrationRejection}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-6">
                {/* Version info */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Version Update</h4>
                  <div className="text-sm text-blue-800">
                    <div>From: v{migrationDialog.originalConfig.header.version}</div>
                    <div>To: v{migrationDialog.migratedConfig.header.version}</div>
                  </div>
                </div>

                {/* Warnings */}
                {migrationDialog.warnings.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Migration Warnings</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      {migrationDialog.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Tag Mappings */}
                {Object.keys(migrationDialog.tagMappings).length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900 mb-2">Tag Name Changes</h4>
                    <p className="text-sm text-purple-800 mb-3">
                      The following tag names have been updated to match the new version format:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(migrationDialog.tagMappings).map(([oldTag, newTag]) => (
                        <div key={oldTag} className="flex items-center justify-between p-2 bg-white rounded border">
                          <span className="text-sm font-mono text-purple-700">{oldTag}</span>
                          <span className="text-purple-500 mx-2">→</span>
                          <span className="text-sm font-mono text-purple-700">{newTag}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Deprecated Fields */}
                {migrationDialog.deprecatedFields.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">Deprecated Fields</h4>
                    <p className="text-sm text-red-800 mb-3">
                      The following fields are no longer used in the current version:
                    </p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {migrationDialog.deprecatedFields.map((field, index) => (
                        <li key={index} className="font-mono">• {field}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* New Fields */}
                {migrationDialog.newFields.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">New Fields</h4>
                    <p className="text-sm text-green-800 mb-3">
                      The following new fields have been added with default values:
                    </p>
                    <ul className="text-sm text-green-700 space-y-1">
                      {migrationDialog.newFields.map((field, index) => (
                        <li key={index} className="font-mono">• {field}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Pending changes */}
                {migrationDialog.pendingChanges.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Manual Review Required</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      The following changes require your approval:
                    </p>
                    <ul className="text-sm text-gray-700 space-y-2">
                      {migrationDialog.pendingChanges.map((change, index) => (
                        <li key={index} className="flex items-center">
                          <span className="text-gray-500 mr-2">•</span>
                          <span className="font-mono">{change.oldPath} → {change.newPath}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleMigrationRejection}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel Migration
                  </button>
                  <button
                    onClick={() => handleMigrationApproval()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Apply Migration
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Workflow Template Manager */}
      {isTemplateManagerOpen && (
        <WorkflowTemplateManager
          onApplyTemplate={(config) => {
            onConfigChange(config);
            setIsTemplateManagerOpen(false);
          }}
          onClose={() => setIsTemplateManagerOpen(false)}
        />
      )}
    </div>
  );
};

export default ConfigurationManager; 