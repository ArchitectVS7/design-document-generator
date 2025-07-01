import React, { useState } from 'react';
import { ConfigurationFile } from '../types/configuration';
import { AgentConfiguration } from '../types/agent';
import { DEFAULT_CONFIG_V07 } from '../data/defaultConfig';

// Example MVP 3-agent template
const MVP_3_AGENT_TEMPLATE: ConfigurationFile = {
  ...DEFAULT_CONFIG_V07,
  header: {
    ...DEFAULT_CONFIG_V07.header,
    description: 'MVP 3-Agent Pipeline',
  },
  agents: DEFAULT_CONFIG_V07.agents.slice(0, 3),
};

const BUILT_IN_TEMPLATES: { name: string; description: string; config: ConfigurationFile }[] = [
  {
    name: 'Canonical 7-Agent Pipeline',
    description: 'The full, recommended pipeline for comprehensive design document generation.',
    config: DEFAULT_CONFIG_V07,
  },
  {
    name: 'MVP 3-Agent Pipeline',
    description: 'A minimal pipeline for rapid prototyping and MVPs.',
    config: MVP_3_AGENT_TEMPLATE,
  },
];

interface WorkflowTemplateManagerProps {
  onApplyTemplate: (config: ConfigurationFile) => void;
  onClose: () => void;
}

const WorkflowTemplateManager: React.FC<WorkflowTemplateManagerProps> = ({
  onApplyTemplate,
  onClose,
}) => {
  const [selectedTemplateIdx, setSelectedTemplateIdx] = useState<number | null>(null);
  const [customTemplates, setCustomTemplates] = useState<typeof BUILT_IN_TEMPLATES>([]);

  const templates = [...BUILT_IN_TEMPLATES, ...customTemplates];

  const handleApply = () => {
    if (selectedTemplateIdx !== null) {
      onApplyTemplate(templates[selectedTemplateIdx].config);
      onClose();
    }
  };

  const handleSaveCustom = () => {
    if (selectedTemplateIdx !== null) {
      const custom = templates[selectedTemplateIdx];
      setCustomTemplates((prev) => [
        ...prev,
        {
          ...custom,
          name: custom.name + ' (Custom)',
          description: custom.description + ' (Customized)',
        },
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6 relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-4">Workflow Template Library</h2>
        <div className="mb-6">
          <p className="text-gray-600">Select a workflow template to preview and apply. You can customize and save your own templates for future use.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {templates.map((tpl, idx) => (
            <div
              key={tpl.name}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedTemplateIdx === idx ? 'border-primary-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
              onClick={() => setSelectedTemplateIdx(idx)}
            >
              <h3 className="font-semibold text-lg mb-1">{tpl.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{tpl.description}</p>
              <div className="text-xs text-gray-500">{tpl.config.agents.length} agents</div>
            </div>
          ))}
        </div>
        {selectedTemplateIdx !== null && (
          <div className="mb-6">
            <h4 className="font-semibold text-md mb-2">Template Preview</h4>
            <div className="bg-gray-50 rounded p-4 max-h-64 overflow-y-auto">
              <ol className="list-decimal ml-5">
                {templates[selectedTemplateIdx].config.agents.map((agent: AgentConfiguration) => (
                  <li key={agent.id} className="mb-2">
                    <span className="font-medium">{agent.name}</span> <span className="text-xs text-gray-500">({agent.role.title})</span>
                    <div className="text-xs text-gray-600 ml-2">{agent.role.description}</div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                onClick={handleApply}
              >
                Apply Template
              </button>
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                onClick={handleSaveCustom}
              >
                Save as Custom
              </button>
            </div>
          </div>
        )}
        <div className="text-right">
          <button
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkflowTemplateManager; 