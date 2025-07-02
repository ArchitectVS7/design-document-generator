// Version management utilities for Design Document Generator v0.7.0

export const APP_VERSION = "0.7.1";
export const COMPATIBLE_VERSIONS = ["0.7.1"];

export interface VersionInfo {
  version: string;
  phase: string;
  description: string;
  isProduction: boolean;
}

export const getVersionInfo = (): VersionInfo => {
  const [major, minor] = APP_VERSION.split('.').map(Number);
  
  let phase = "Development";
  let isProduction = false;
  
  if (major === 0) {
    if (minor === 7) {
      phase = "Internal Testing";
    } else if (minor === 8) {
      phase = "Alpha Testing";
    } else if (minor === 9) {
      phase = "Beta Testing";
    }
  } else if (major >= 1) {
    phase = "Production";
    isProduction = true;
  }
  
  return {
    version: APP_VERSION,
    phase,
    description: `Design Document Generator ${phase} Phase`,
    isProduction
  };
};

export const isVersionCompatible = (version: string): boolean => {
  return COMPATIBLE_VERSIONS.includes(version);
};

export const formatVersionDisplay = (): string => {
  const versionInfo = getVersionInfo();
  return `v${versionInfo.version} (${versionInfo.phase})`;
};

export const getVersionBadgeColor = (): string => {
  const versionInfo = getVersionInfo();
  
  if (versionInfo.isProduction) {
    return "bg-green-100 text-green-800";
  } else if (versionInfo.phase === "Internal Testing") {
    return "bg-blue-100 text-blue-800";
  } else if (versionInfo.phase === "Alpha Testing") {
    return "bg-yellow-100 text-yellow-800";
  } else if (versionInfo.phase === "Beta Testing") {
    return "bg-orange-100 text-orange-800";
  } else {
    return "bg-gray-100 text-gray-800";
  }
}; 