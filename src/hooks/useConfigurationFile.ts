// Configuration File Management Hooks v0.7.0
// Handles configuration file operations and migration

import { useState, useCallback } from 'react';
import { ConfigurationFile, MigrationDialogData } from '../types/configuration';
import { configurationService } from '../services/configurationService';
import { MigrationSystem } from '../utils/migration';
import { checkCompatibility } from '../utils/validation';

export interface UseConfigurationFileReturn {
  // State
  isLoading: boolean;
  error: string | null;
  migrationDialog: MigrationDialogData | null;
  
  // Actions
  saveConfiguration: (config: ConfigurationFile, description?: string) => Promise<boolean>;
  loadConfiguration: (source: 'local' | 'file', identifier?: string | File) => Promise<ConfigurationFile | null>;
  importFile: (file: File) => Promise<ConfigurationFile | null>;
  exportFile: (config: ConfigurationFile, filename?: string) => void;
  getSavedConfigurations: () => Promise<Array<{
    id: string;
    name: string;
    description: string;
    version: string;
    created: string;
    modified: string;
  }>>;
  deleteConfiguration: (configId: string) => Promise<boolean>;
  
  // Migration
  handleMigration: (originalConfig: ConfigurationFile) => Promise<ConfigurationFile | null>;
  approveMigration: (userChanges?: Record<string, any>) => void;
  rejectMigration: () => void;
  
  // Utilities
  clearError: () => void;
}

export const useConfigurationFile = (): UseConfigurationFileReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [migrationDialog, setMigrationDialog] = useState<MigrationDialogData | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Save configuration
  const saveConfiguration = useCallback(async (
    config: ConfigurationFile, 
    description?: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await configurationService.saveConfiguration(config, {
        description,
        downloadFile: true
      });

      if (!result.success) {
        setError(result.error || 'Failed to save configuration');
        return false;
      }

      console.log('Configuration saved successfully:', result.id);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load configuration
  const loadConfiguration = useCallback(async (
    source: 'local' | 'file',
    identifier?: string | File
  ): Promise<ConfigurationFile | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await configurationService.loadConfiguration(source, identifier);

      if (!result.success) {
        setError(result.error || 'Failed to load configuration');
        return null;
      }

      // Check if migration is needed
      if (result.config && result.config.header.version !== '0.7.0') {
        const compatibility = checkCompatibility(result.config);
        if (compatibility.requiresMigration) {
          return await handleMigration(result.config);
        }
      }

      console.log('Configuration loaded successfully');
      return result.config || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configuration';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Import file
  const importFile = useCallback(async (file: File): Promise<ConfigurationFile | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await configurationService.importConfigurationFile(file);

      if (!result.success) {
        setError(result.error || 'Failed to import configuration file');
        return null;
      }

      // Check if migration is needed
      if (result.config && result.config.header.version !== '0.7.0') {
        const compatibility = checkCompatibility(result.config);
        if (compatibility.requiresMigration) {
          return await handleMigration(result.config);
        }
      }

      console.log('Configuration file imported successfully');
      return result.config || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import configuration file';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Export file
  const exportFile = useCallback((config: ConfigurationFile, filename?: string): void => {
    try {
      configurationService.downloadConfigurationFile(config, filename);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export configuration file';
      setError(errorMessage);
    }
  }, []);

  // Get saved configurations
  const getSavedConfigurations = useCallback(async (): Promise<Array<{
    id: string;
    name: string;
    description: string;
    version: string;
    created: string;
    modified: string;
  }>> => {
    try {
      return await configurationService.getSavedConfigurations();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get saved configurations';
      setError(errorMessage);
      return [];
    }
  }, []);

  // Delete configuration
  const deleteConfiguration = useCallback(async (configId: string): Promise<boolean> => {
    try {
      const result = await configurationService.deleteConfiguration(configId);
      
      if (!result.success) {
        setError(result.error || 'Failed to delete configuration');
        return false;
      }

      console.log('Configuration deleted successfully:', configId);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete configuration';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Handle migration
  const handleMigration = useCallback(async (originalConfig: ConfigurationFile): Promise<ConfigurationFile | null> => {
    try {
      const migrationPath = MigrationSystem.getMigrationPath(originalConfig.header.version);
      
      if (migrationPath.length === 0) {
        setError('No migration path available for this configuration version');
        return null;
      }

      const migrationResult = MigrationSystem.migrateConfiguration(originalConfig, migrationPath);

      if (!migrationResult.success) {
        setError(`Migration failed: ${migrationResult.warnings.join(', ')}`);
        return null;
      }

      if (migrationResult.requiresUserApproval) {
        // Show migration dialog for user approval
        const dialogData = MigrationSystem.createMigrationDialogData(originalConfig, migrationResult);
        setMigrationDialog(dialogData);
        return null; // Will be resolved when user approves/rejects
      }

      // Auto-apply migration if no user approval needed
      console.log('Configuration migrated successfully');
      return migrationResult.migratedConfig || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Migration failed';
      setError(errorMessage);
      return null;
    }
  }, []);

  // Approve migration
  const approveMigration = useCallback((userChanges?: Record<string, any>): void => {
    if (!migrationDialog) {
      setError('No migration dialog to approve');
      return;
    }

    try {
      let finalConfig = migrationDialog.migratedConfig;

      // Apply user changes if provided
      if (userChanges && Object.keys(userChanges).length > 0) {
        finalConfig = MigrationSystem.applyUserChanges(finalConfig, userChanges);
      }

      // Apply tag mappings if any
      if (migrationDialog.tagMappings && Object.keys(migrationDialog.tagMappings).length > 0) {
        finalConfig = MigrationSystem.applyTagMappings(finalConfig, migrationDialog.tagMappings);
      }

      // Clear migration dialog
      setMigrationDialog(null);
      
      // Return the migrated configuration (this would typically be handled by the parent component)
      console.log('Migration approved and applied');
      
      // The parent component should handle applying this configuration
      // We don't automatically apply it here to avoid conflicts
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to apply migration';
      setError(errorMessage);
    }
  }, [migrationDialog]);

  // Reject migration
  const rejectMigration = useCallback((): void => {
    setMigrationDialog(null);
    console.log('Migration rejected');
  }, []);

  return {
    // State
    isLoading,
    error,
    migrationDialog,
    
    // Actions
    saveConfiguration,
    loadConfiguration,
    importFile,
    exportFile,
    getSavedConfigurations,
    deleteConfiguration,
    
    // Migration
    handleMigration,
    approveMigration,
    rejectMigration,
    
    // Utilities
    clearError
  };
}; 