import React from 'react';
import { AgentConfiguration } from '../../types/agent';
import { logger } from '../../utils/logger';

interface AdminTabProps {
  agents: AgentConfiguration[];
  onShowLogViewer: () => void;
}

const AdminTab: React.FC<AdminTabProps> = ({
  agents,
  onShowLogViewer,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Admin Panel</h2>
        
        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">System Logs</h3>
            <p className="text-gray-600 mb-4">
              View real-time system logs for debugging and monitoring the conversation flow.
            </p>
            <button
              onClick={onShowLogViewer}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Open Log Viewer
            </button>
          </div>
          
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">System Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="font-mono">0.7.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Agents:</span>
                <span className="font-mono">{agents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Log Entries:</span>
                <span className="font-mono">{logger.getLogs().length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTab;