import React from 'react';

interface TabNavigationProps {
  activeTab: string;
  agentCount: number;
  onTabChange: (tab: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  agentCount,
  onTabChange,
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'agents', label: `Agent Configuration (${agentCount})` },
    { id: 'conversation', label: 'Conversation' },
    { id: 'settings', label: 'Settings' },
    { id: 'admin', label: 'Admin' },
  ];

  return (
    <div className="border-b border-gray-200 mb-8">
      <nav className="-mb-px flex space-x-8">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === id
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TabNavigation;