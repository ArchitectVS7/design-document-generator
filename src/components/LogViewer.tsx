// Log Viewer Component v0.7.0

import React, { useState, useEffect, useRef } from 'react';
import { logger, LogEntry, LoggerConfig } from '../utils/logger';

interface LogViewerProps {
  isVisible: boolean;
  onClose: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ isVisible, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [config, setConfig] = useState<LoggerConfig>(logger.getConfig());
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [filterComponent, setFilterComponent] = useState<string>('');
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Update logs every 100ms for real-time display
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setLogs(logger.getLogs());
    }, 100);

    return () => clearInterval(interval);
  }, [isVisible]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Update config when it changes
  useEffect(() => {
    setConfig(logger.getConfig());
  }, []);

  const handleConfigChange = (updates: Partial<LoggerConfig>) => {
    logger.updateConfig(updates);
    setConfig(logger.getConfig());
  };

  const handleClearLogs = () => {
    logger.clearLogs();
    setLogs([]);
  };

  const handleExportLogs = () => {
    const logText = logger.getLogsAsString();
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(log => {
    if (filterLevel !== 'ALL' && log.level !== filterLevel) return false;
    if (filterComponent && !log.component.toLowerCase().includes(filterComponent.toLowerCase())) return false;
    return true;
  });

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-600 bg-red-50';
      case 'WARN': return 'text-yellow-600 bg-yellow-50';
      case 'INFO': return 'text-blue-600 bg-blue-50';
      case 'DEBUG': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600';
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-11/12 h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">System Logs</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Logger Config */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Logger Settings</label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => handleConfigChange({ enabled: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Enabled</span>
              </div>
              <select
                value={config.level}
                onChange={(e) => handleConfigChange({ level: e.target.value as any })}
                className="block w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="DEBUG">DEBUG</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>
            </div>

            {/* Filters */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Filters</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as any)}
                className="block w-full text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="ALL">All Levels</option>
                <option value="DEBUG">DEBUG</option>
                <option value="INFO">INFO</option>
                <option value="WARN">WARN</option>
                <option value="ERROR">ERROR</option>
              </select>
              <input
                type="text"
                placeholder="Filter by component..."
                value={filterComponent}
                onChange={(e) => setFilterComponent(e.target.value)}
                className="block w-full text-sm border border-gray-300 rounded px-2 py-1"
              />
            </div>

            {/* Display Options */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Display</label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Auto-scroll</span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.includeState}
                  onChange={(e) => handleConfigChange({ includeState: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Include state</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Actions</label>
              <div className="space-y-1">
                <button
                  onClick={handleClearLogs}
                  className="block w-full text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Clear Logs
                </button>
                <button
                  onClick={handleExportLogs}
                  className="block w-full text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Export Logs
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Log Display */}
        <div className="flex-1 overflow-hidden">
          <div
            ref={logContainerRef}
            className="h-full overflow-y-auto p-4 font-mono text-xs bg-gray-900 text-gray-100"
          >
            {filteredLogs.length === 0 ? (
              <div className="text-gray-400 text-center py-8">No logs to display</div>
            ) : (
              filteredLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="text-gray-400">[{log.timestamp}]</span>
                  <span className={`ml-2 px-1 rounded text-xs font-bold ${getLogLevelColor(log.level)}`}>
                    {log.level}
                  </span>
                  <span className="text-blue-400 ml-2">[{log.component}.{log.function}]</span>
                  <span className="text-white ml-2">{log.message}</span>
                  {log.data && (
                    <div className="ml-4 mt-1 text-gray-300">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(log.data, null, 2)}</pre>
                    </div>
                  )}
                  {log.state && (
                    <div className="ml-4 mt-1 text-gray-300">
                      <div className="text-gray-400">State:</div>
                      <pre className="whitespace-pre-wrap">{JSON.stringify(log.state, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-2 border-t bg-gray-50 text-xs text-gray-600">
          Showing {filteredLogs.length} of {logs.length} logs | 
          Total entries: {logs.length} | 
          Max entries: {config.maxEntries}
        </div>
      </div>
    </div>
  );
}; 