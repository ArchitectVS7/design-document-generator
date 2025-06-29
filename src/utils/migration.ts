// Migration System v0.7.0
// Handles configuration version migrations and compatibility

import { ConfigurationFile, MigrationResult, MigrationDialogData, FieldMapping } from '../types/configuration';
import { APP_VERSION } from './validation';

// Migration maps for different version transitions
export const MIGRATION_MAPS: Record<string, {
  fieldMappings: FieldMapping[];
  warnings: string[];
  tagMappings?: Record<string, string>;
  deprecatedFields?: string[];
  newFields?: string[];
}> = {
  "0.6.0_to_0.7.0": {
    fieldMappings: [
      {
        oldPath: "agents[].name",
        newPath: "agents[].role.title", 
        transformation: "direct",
        requiresUserInput: false
      },
      {
        oldPath: "agents[].promptTemplate",
        newPath: "agents[].task.promptTemplate",
        transformation: "direct", 
        requiresUserInput: false
      },
      {
        oldPath: "agents[].category",
        newPath: "agents[].role.category",
        transformation: "categoryMapping",
        requiresUserInput: true
      },
      {
        oldPath: "agents[].maxTokens",
        newPath: "agents[].task.maxTokens",
        transformation: "direct",
        requiresUserInput: false
      },
      {
        oldPath: "agents[].temperature",
        newPath: "agents[].task.temperature",
        transformation: "direct",
        requiresUserInput: false
      }
    ],
    warnings: [
      "Context source selection has been enhanced - please review context configurations",
      "Task configuration now includes additional settings - defaults will be applied",
      "Agent roles have been restructured - please verify role assignments"
    ],
    tagMappings: {
      "Agent1_Output": "agent[1].output",
      "Agent2_Output": "agent[2].output", 
      "Agent3_Output": "agent[3].output",
      "Agent4_Output": "agent[4].output",
      "Agent5_Output": "agent[5].output",
      "Agent6_Output": "agent[6].output",
      "Agent7_Output": "agent[7].output",
      "User_Input": "user.input",
      "Raw_Input": "user.raw_input"
    },
    deprecatedFields: [
      "agents[].name",
      "agents[].promptTemplate", 
      "agents[].category",
      "agents[].maxTokens",
      "agents[].temperature"
    ],
    newFields: [
      "agents[].role.title",
      "agents[].role.description",
      "agents[].task.promptTemplate",
      "agents[].task.outputFormat",
      "agents[].task.instructions",
      "agents[].contextSources[].selected"
    ]
  },
  "0.5.0_to_0.6.0": {
    fieldMappings: [
      {
        oldPath: "agents[].type",
        newPath: "agents[].role.category",
        transformation: "typeToCategory",
        requiresUserInput: true
      }
    ],
    warnings: [
      "Agent types have been replaced with role categories",
      "Some agent configurations may need manual review"
    ],
    tagMappings: {
      "Agent1_Output": "Agent1_Output",
      "Agent2_Output": "Agent2_Output",
      "User_Input": "User_Input"
    },
    deprecatedFields: [
      "agents[].type"
    ],
    newFields: [
      "agents[].role.category"
    ]
  }
};

// Migration path definitions
export const MIGRATION_PATHS: Record<string, string[]> = {
  "0.5.0": ["0.5.0_to_0.6.0", "0.6.0_to_0.7.0"],
  "0.6.0": ["0.6.0_to_0.7.0"]
};

// Migration system class
export class MigrationSystem {
  // Check if migration is needed
  public static needsMigration(fromVersion: string, toVersion: string = APP_VERSION): boolean {
    if (fromVersion === toVersion) {
      return false;
    }

    const migrationPath = this.getMigrationPath(fromVersion);
    return migrationPath.length > 0;
  }

  // Get migration path for version transition
  public static getMigrationPath(fromVersion: string): string[] {
    return MIGRATION_PATHS[fromVersion] || [];
  }

  // Migrate configuration
  public static migrateConfiguration(
    oldConfig: ConfigurationFile, 
    migrationPath: string[]
  ): MigrationResult {
    try {
      let newConfig = { ...oldConfig };
      const warnings: string[] = [];
      const pendingChanges: FieldMapping[] = [];
      const tagMappings: Record<string, string> = {};
      const deprecatedFields: string[] = [];
      const newFields: string[] = [];

      // Apply each migration in the path
      migrationPath.forEach(migration => {
        const migrationMap = MIGRATION_MAPS[migration];
        if (!migrationMap) {
          throw new Error(`Migration map not found for: ${migration}`);
        }

        // Apply field mappings
        migrationMap.fieldMappings.forEach((mapping: FieldMapping) => {
          const oldValue = this.getNestedValue(newConfig, mapping.oldPath);
          if (oldValue !== undefined) {
            const transformedValue = this.applyTransformation(oldValue, mapping.transformation);
            this.setNestedValue(newConfig, mapping.newPath, transformedValue);
            
            if (mapping.requiresUserInput) {
              pendingChanges.push(mapping);
            }
          }
        });

        // Collect tag mappings
        if (migrationMap.tagMappings) {
          Object.assign(tagMappings, migrationMap.tagMappings);
        }

        // Collect deprecated and new fields
        if (migrationMap.deprecatedFields) {
          deprecatedFields.push(...migrationMap.deprecatedFields);
        }
        if (migrationMap.newFields) {
          newFields.push(...migrationMap.newFields);
        }

        // Add warnings
        warnings.push(...migrationMap.warnings);
      });

      // Update version and metadata
      newConfig.header.version = APP_VERSION;
      newConfig.header.modified = new Date().toISOString();

      return {
        success: true,
        migratedConfig: newConfig,
        warnings,
        requiresUserApproval: pendingChanges.length > 0 || Object.keys(tagMappings).length > 0,
        pendingChanges,
        tagMappings,
        deprecatedFields,
        newFields
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Migration failed';
      return {
        success: false,
        warnings: [errorMessage],
        requiresUserApproval: false,
        pendingChanges: []
      };
    }
  }

  // Create migration dialog data
  public static createMigrationDialogData(
    originalConfig: ConfigurationFile,
    migrationResult: MigrationResult
  ): MigrationDialogData {
    return {
      originalConfig,
      migratedConfig: migrationResult.migratedConfig!,
      warnings: migrationResult.warnings,
      pendingChanges: migrationResult.pendingChanges,
      tagMappings: migrationResult.tagMappings || {},
      deprecatedFields: migrationResult.deprecatedFields || [],
      newFields: migrationResult.newFields || []
    };
  }

  // Apply user-approved changes
  public static applyUserChanges(
    config: ConfigurationFile,
    userChanges: Record<string, any>
  ): ConfigurationFile {
    const updatedConfig = { ...config };

    Object.entries(userChanges).forEach(([path, value]) => {
      this.setNestedValue(updatedConfig, path, value);
    });

    return updatedConfig;
  }

  // Apply tag mappings to configuration
  public static applyTagMappings(
    config: ConfigurationFile,
    tagMappings: Record<string, string>
  ): ConfigurationFile {
    const updatedConfig = JSON.parse(JSON.stringify(config));
    
    // Apply tag mappings to all text fields that might contain old tags
    const applyMappingsToText = (text: string): string => {
      let updatedText = text;
      Object.entries(tagMappings).forEach(([oldTag, newTag]) => {
        const regex = new RegExp(oldTag, 'g');
        updatedText = updatedText.replace(regex, newTag);
      });
      return updatedText;
    };

    // Apply to agent task templates
    if (updatedConfig.agents) {
      updatedConfig.agents.forEach((agent: any) => {
        if (agent.task && agent.task.promptTemplate) {
          agent.task.promptTemplate = applyMappingsToText(agent.task.promptTemplate);
        }
        if (agent.role && agent.role.description) {
          agent.role.description = applyMappingsToText(agent.role.description);
        }
      });
    }

    return updatedConfig;
  }

  // Utility functions for nested object manipulation
  private static getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (key.includes('[]')) {
        // Handle array paths like "agents[].name"
        const arrayKey = key.replace('[]', '');
        if (Array.isArray(current[arrayKey])) {
          // For array paths, return the first item's value as an example
          current = current[arrayKey][0];
        } else {
          return undefined;
        }
      } else {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          return undefined;
        }
      }
    }

    return current;
  }

  private static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (key.includes('[]')) {
        // Handle array paths
        const arrayKey = key.replace('[]', '');
        if (!current[arrayKey]) {
          current[arrayKey] = [];
        }
        // For array paths, apply to all items
        if (Array.isArray(current[arrayKey])) {
          current[arrayKey].forEach((item: any) => {
            this.setNestedValue(item, keys.slice(i + 1).join('.'), value);
          });
        }
        return;
      } else {
        if (!current[key] || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
    }

    const lastKey = keys[keys.length - 1];
    if (lastKey.includes('[]')) {
      const arrayKey = lastKey.replace('[]', '');
      if (Array.isArray(current[arrayKey])) {
        current[arrayKey].forEach((item: any) => {
          // Apply the value to each array item
          Object.assign(item, value);
        });
      }
    } else {
      current[lastKey] = value;
    }
  }

  // Transformation functions
  private static applyTransformation(value: any, transformation?: string): any {
    switch (transformation) {
      case "direct":
        return value;
      case "categoryMapping":
        return this.mapCategory(value);
      case "typeToCategory":
        return this.mapTypeToCategory(value);
      default:
        return value;
    }
  }

  private static mapCategory(oldCategory: string): string {
    const categoryMap: Record<string, string> = {
      "designer": "designer",
      "researcher": "researcher",
      "author": "author",
      "analyst": "analyst",
      "strategist": "strategist",
      "architect": "architect"
    };
    return categoryMap[oldCategory] || "analyst";
  }

  private static mapTypeToCategory(oldType: string): string {
    const typeMap: Record<string, string> = {
      "product": "strategist",
      "research": "researcher",
      "design": "designer",
      "analysis": "analyst",
      "writing": "author",
      "technical": "architect"
    };
    return typeMap[oldType] || "analyst";
  }
}

// Helper functions for migration utilities
export const migrationUtils = {
  // Check if configuration can be migrated
  canMigrate: (fromVersion: string, toVersion: string = APP_VERSION): boolean => {
    return MigrationSystem.needsMigration(fromVersion, toVersion);
  },

  // Get migration warnings
  getMigrationWarnings: (fromVersion: string): string[] => {
    const migrationPath = MigrationSystem.getMigrationPath(fromVersion);
    const warnings: string[] = [];

    migrationPath.forEach(migration => {
      const migrationMap = MIGRATION_MAPS[migration];
      if (migrationMap) {
        warnings.push(...migrationMap.warnings);
      }
    });

    return warnings;
  },

  // Validate migration result
  validateMigrationResult: (result: MigrationResult): boolean => {
    return result.success && result.migratedConfig !== undefined;
  }
}; 