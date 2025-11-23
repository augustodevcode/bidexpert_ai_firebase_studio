// src/lib/user-action-logger.ts
/**
 * Client-side user action logger for debugging and analytics
 * Helps with Playwright tests and manual error verification
 */

export type ActionCategory = 
  | 'navigation'
  | 'form'
  | 'selection'
  | 'crud'
  | 'validation'
  | 'interaction'
  | 'error';

export interface UserActionLog {
  timestamp: string;
  category: ActionCategory;
  action: string;
  details?: Record<string, any>;
  module?: string;
  userId?: string;
  tenantId?: string;
}

class UserActionLogger {
  private logs: UserActionLog[] = [];
  private maxLogs: number = 500;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      // Make logger accessible in browser console for debugging
      (window as any).__userActionLogger = this;
    }
  }

  /**
   * Log a user action
   */
  log(
    category: ActionCategory,
    action: string,
    details?: Record<string, any>,
    module?: string
  ): void {
    if (!this.enabled) return;

    const logEntry: UserActionLog = {
      timestamp: new Date().toISOString(),
      category,
      action,
      details,
      module,
    };

    // Add to internal storage
    this.logs.push(logEntry);
    
    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output with color coding
    const color = this.getCategoryColor(category);
    const prefix = `[${category.toUpperCase()}]`;
    const moduleInfo = module ? `[${module}]` : '';
    
    console.log(
      `%c${prefix}%c${moduleInfo} ${action}`,
      `color: ${color}; font-weight: bold`,
      'color: inherit',
      details || ''
    );

    // Add data attribute to body for Playwright to detect
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-last-action', action);
      document.body.setAttribute('data-last-action-time', logEntry.timestamp);
    }
  }

  /**
   * Get logs filtered by criteria
   */
  getLogs(filter?: {
    category?: ActionCategory;
    module?: string;
    since?: Date;
  }): UserActionLog[] {
    let filtered = this.logs;

    if (filter?.category) {
      filtered = filtered.filter(log => log.category === filter.category);
    }

    if (filter?.module) {
      filtered = filtered.filter(log => log.module === filter.module);
    }

    if (filter?.since) {
      filtered = filtered.filter(log => new Date(log.timestamp) >= filter.since!);
    }

    return filtered;
  }

  /**
   * Clear all logs
   */
  clear(): void {
    this.logs = [];
    console.log('%c[LOGGER] Logs cleared', 'color: orange; font-weight: bold');
  }

  /**
   * Export logs as JSON
   */
  export(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  private getCategoryColor(category: ActionCategory): string {
    const colors: Record<ActionCategory, string> = {
      navigation: '#3b82f6', // blue
      form: '#10b981', // green
      selection: '#8b5cf6', // purple
      crud: '#f59e0b', // amber
      validation: '#ec4899', // pink
      interaction: '#06b6d4', // cyan
      error: '#ef4444', // red
    };
    return colors[category] || '#6b7280';
  }
}

// Singleton instance
const userActionLogger = new UserActionLogger();

// Convenience methods
export const logNavigation = (action: string, details?: Record<string, any>, module?: string) => {
  userActionLogger.log('navigation', action, details, module);
};

export const logFormAction = (action: string, details?: Record<string, any>, module?: string) => {
  userActionLogger.log('form', action, details, module);
};

export const logSelection = (action: string, details?: Record<string, any>, module?: string) => {
  userActionLogger.log('selection', action, details, module);
};

export const logCrudAction = (action: string, details?: Record<string, any>, module?: string) => {
  userActionLogger.log('crud', action, details, module);
};

export const logValidation = (action: string, details?: Record<string, any>, module?: string) => {
  userActionLogger.log('validation', action, details, module);
};

export const logInteraction = (action: string, details?: Record<string, any>, module?: string) => {
  userActionLogger.log('interaction', action, details, module);
};

export const logError = (action: string, details?: Record<string, any>, module?: string) => {
  userActionLogger.log('error', action, details, module);
};

export default userActionLogger;
