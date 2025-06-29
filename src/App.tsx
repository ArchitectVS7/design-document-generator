import React from 'react';
import Layout from './components/Layout';
import { getVersionInfo, formatVersionDisplay, getVersionBadgeColor } from './utils/version';

const App: React.FC = () => {
  const versionInfo = getVersionInfo();
  const versionDisplay = formatVersionDisplay();
  const badgeColor = getVersionBadgeColor();

  return (
    <Layout>
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${badgeColor}`}>
            {versionDisplay}
          </span>
        </div>
        
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Design Document Generator
        </h2>
        
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
          Transform your creative ideas into comprehensive technical specifications using our multi-agent AI system.
        </p>
        
        <div className="flex justify-center space-x-4">
          <button className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
            Get Started
          </button>
          <button className="bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-6 rounded-lg border border-gray-300 transition-colors">
            Learn More
          </button>
        </div>
      </div>

      {/* Phase Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
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
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-gray-400 font-bold">2</span>
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

      {/* Placeholder Components for Future Phases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Agent Configuration Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent Configuration</h3>
          <p className="text-gray-600 mb-4">
            Configure your specialized AI agents with custom roles, context sources, and task templates.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Coming in Phase 2</p>
          </div>
        </div>

        {/* Document Generation Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Generation</h3>
          <p className="text-gray-600 mb-4">
            Generate comprehensive design documents through sequential agent processing.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Coming in Phase 3</p>
          </div>
        </div>
      </div>

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