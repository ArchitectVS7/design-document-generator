// Internal System Logger v0.7.0

export interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  component: string;
  function: string;
  message: string;
  data?: any;
  state?: any;
}

export interface LoggerConfig {
  enabled: boolean;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  maxEntries: number;
  includeState: boolean;
}

class InternalLogger {
  private logs: LogEntry[] = [];
  private config: LoggerConfig = {
    enabled: true,
    level: 'DEBUG',
    maxEntries: 1000,
    includeState: true
  };

  private shouldLog(level: LogEntry['level']): boolean {
    if (!this.config.enabled) return false;
    
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const configLevelIndex = levels.indexOf(this.config.level);
    const logLevelIndex = levels.indexOf(level);
    
    return logLevelIndex >= configLevelIndex;
  }

  private addLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) return;
    
    this.logs.push(entry);
    
    // Keep only the last maxEntries
    if (this.logs.length > this.config.maxEntries) {
      this.logs = this.logs.slice(-this.config.maxEntries);
    }
    
    // Also log to console for immediate debugging
    const consoleMethod = entry.level === 'ERROR' ? 'error' : 
                         entry.level === 'WARN' ? 'warn' : 
                         entry.level === 'INFO' ? 'info' : 'log';
    
    console[consoleMethod](`[${entry.timestamp}] ${entry.level} [${entry.component}.${entry.function}] ${entry.message}`, entry.data || '');
  }

  debug(component: string, functionName: string, message: string, data?: any, state?: any): void {
    this.addLog({
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      component,
      function: functionName,
      message,
      data,
      state: this.config.includeState ? state : undefined
    });
  }

  info(component: string, functionName: string, message: string, data?: any, state?: any): void {
    this.addLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      component,
      function: functionName,
      message,
      data,
      state: this.config.includeState ? state : undefined
    });
  }

  warn(component: string, functionName: string, message: string, data?: any, state?: any): void {
    this.addLog({
      timestamp: new Date().toISOString(),
      level: 'WARN',
      component,
      function: functionName,
      message,
      data,
      state: this.config.includeState ? state : undefined
    });
  }

  error(component: string, functionName: string, message: string, data?: any, state?: any): void {
    this.addLog({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      component,
      function: functionName,
      message,
      data,
      state: this.config.includeState ? state : undefined
    });
  }

  // Decision point logging
  decision(component: string, functionName: string, decision: string, condition: string, result: boolean, data?: any): void {
    this.info(component, functionName, `DECISION: ${decision}`, {
      condition,
      result,
      data
    });
  }

  // State change logging
  stateChange(component: string, functionName: string, field: string, oldValue: any, newValue: any, reason?: string): void {
    this.info(component, functionName, `STATE CHANGE: ${field}`, {
      oldValue,
      newValue,
      reason
    });
  }

  // Function entry/exit logging
  functionEntry(component: string, functionName: string, params?: any): void {
    this.debug(component, functionName, `FUNCTION ENTRY`, params);
  }

  functionExit(component: string, functionName: string, result?: any): void {
    this.debug(component, functionName, `FUNCTION EXIT`, result);
  }

  // Get logs
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  // Get logs as formatted string
  getLogsAsString(): string {
    return this.logs.map(entry => 
      `[${entry.timestamp}] ${entry.level} [${entry.component}.${entry.function}] ${entry.message}${entry.data ? ` | Data: ${JSON.stringify(entry.data, null, 2)}` : ''}${entry.state ? ` | State: ${JSON.stringify(entry.state, null, 2)}` : ''}`
    ).join('\n');
  }

  // Clear logs
  clearLogs(): void {
    this.logs = [];
  }

  // Update config
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
    this.info('Logger', 'updateConfig', 'Logger configuration updated', config);
  }

  // Get config
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const logger = new InternalLogger(); 