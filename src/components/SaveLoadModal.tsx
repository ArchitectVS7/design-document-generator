import React, { useState, useRef, useEffect } from 'react';
import { ConfigurationFile } from '../types/configuration';

interface SaveLoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ConfigurationFile, description: string) => Promise<boolean>;
  onLoad: (config: ConfigurationFile) => void;
  onImport: (file: File) => Promise<ConfigurationFile | null>;
  currentConfig: ConfigurationFile | null;
  savedConfigurations: Array<{
    id: string;
    name: string;
    description: string;
    version: string;
    created: string;
    modified: string;
  }>;
  onLoadSaved: (configId: string) => Promise<ConfigurationFile | null>;
  onDeleteSaved: (configId: string) => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

const SaveLoadModal: React.FC<SaveLoadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onLoad,
  onImport,
  currentConfig,
  savedConfigurations,
  onLoadSaved,
  onDeleteSaved,
  isLoading,
  error
}) => {
  const [activeTab, setActiveTab] = useState<'save' | 'load' | 'import'>('save');
  const [saveDescription, setSaveDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSaveDescription('');
      setSelectedFile(null);
      setSelectedConfigId(null);
    }
  }, [isOpen]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid JSON configuration file');
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!currentConfig) {
      alert('No configuration to save');
      return;
    }

    const success = await onSave(currentConfig, saveDescription);
    if (success) {
      onClose();
    }
  };

  // Handle load saved configuration
  const handleLoadSaved = async () => {
    if (!selectedConfigId) {
      alert('Please select a configuration to load');
      return;
    }

    const config = await onLoadSaved(selectedConfigId);
    if (config) {
      onLoad(config);
      onClose();
    }
  };

  // Handle import file
  const handleImportFile = async () => {
    if (!selectedFile) {
      alert('Please select a file to import');
      return;
    }

    const config = await onImport(selectedFile);
    if (config) {
      onLoad(config);
      onClose();
    }
  };

  // Handle delete saved configuration
  const handleDeleteSaved = async (configId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      const success = await onDeleteSaved(configId);
      if (success) {
        // Refresh the list (this would typically be handled by the parent)
        console.log('Configuration deleted');
      }
    }
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Configuration Management</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-400 mr-2">⚠️</div>
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Tab navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('save')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'save'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Save Configuration
            </button>
            <button
              onClick={() => setActiveTab('load')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'load'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Load Saved ({savedConfigurations.length})
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Import File
            </button>
          </nav>
        </div>

        {/* Tab content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'save' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Configuration Description
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Enter a description for this configuration..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Current Configuration</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>Version: {currentConfig?.header.version || 'N/A'}</div>
                  <div>Agents: {currentConfig?.agents.length || 0}</div>
                  <div>Last Modified: {currentConfig?.header.modified ? formatDate(currentConfig.header.modified) : 'N/A'}</div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 transition-colors"
                >
                  {isLoading ? 'Saving...' : 'Save & Download'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'load' && (
            <div className="space-y-4">
              {savedConfigurations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-4">📁</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Saved Configurations</h3>
                  <p className="text-gray-600">Save a configuration first to see it here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedConfigurations.map((config) => (
                    <div
                      key={config.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedConfigId === config.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedConfigId(config.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{config.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>v{config.version}</span>
                            <span>Created: {formatDate(config.created)}</span>
                            <span>Modified: {formatDate(config.modified)}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => handleDeleteSaved(config.id, e)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Delete configuration"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLoadSaved}
                  disabled={!selectedConfigId || isLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Load Configuration'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Configuration File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {selectedFile ? (
                    <div>
                      <div className="text-green-600 mb-2">✓ File selected</div>
                      <div className="text-sm text-gray-600">{selectedFile.name}</div>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-gray-400 text-4xl mb-4">📄</div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        Choose a JSON file
                      </button>
                      <p className="text-sm text-gray-500 mt-2">
                        or drag and drop a configuration file here
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Import Information</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Only JSON configuration files are supported</li>
                  <li>• The file will be validated before import</li>
                  <li>• Older versions will be automatically migrated</li>
                  <li>• Current configuration will be replaced</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImportFile}
                  disabled={!selectedFile || isLoading}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 transition-colors"
                >
                  {isLoading ? 'Importing...' : 'Import Configuration'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaveLoadModal; 