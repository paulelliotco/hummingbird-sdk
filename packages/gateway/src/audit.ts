/**
 * Audit logging
 */

export interface AuditEvent {
  timestamp: Date;
  userId: string;
  action: string;
  resource?: string;
  result: 'success' | 'failure';
  error?: string;
  metadata?: any;
}

export class AuditLogger {
  private events: AuditEvent[] = [];
  private enabled: boolean;
  
  constructor(options: { storage?: string; enabled?: boolean } = {}) {
    this.enabled = options.enabled !== false;
  }
  
  async log(event: AuditEvent): Promise<void> {
    if (this.enabled) {
      this.events.push(event);
    }
  }
  
  async query(filters: {
    userId?: string;
    action?: string;
    result?: 'success' | 'failure';
    startTime?: Date;
    endTime?: Date;
  }): Promise<AuditEvent[]> {
    let results = [...this.events];
    
    if (filters.userId) {
      results = results.filter((e) => e.userId === filters.userId);
    }
    
    if (filters.action) {
      results = results.filter((e) => e.action === filters.action);
    }
    
    if (filters.result) {
      results = results.filter((e) => e.result === filters.result);
    }
    
    if (filters.startTime) {
      results = results.filter((e) => e.timestamp >= filters.startTime!);
    }
    
    if (filters.endTime) {
      results = results.filter((e) => e.timestamp <= filters.endTime!);
    }
    
    return results;
  }
}
