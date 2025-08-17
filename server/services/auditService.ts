import { executeQuery } from '../config/database';

interface AuditLogEntry {
  table_name: string;
  record_id: string | number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: any;
  new_values?: any;
  changed_by: string;
}

export class AuditService {
  static async logChange({
    table_name,
    record_id,
    action,
    old_values,
    new_values,
    changed_by
  }: AuditLogEntry): Promise<void> {
    try {
      await executeQuery(
        `INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, changed_by, changed_at) 
         VALUES (?, ?, ?, ?, ?, ?, NOW())`,
        [
          table_name,
          record_id.toString(),
          action,
          old_values ? JSON.stringify(old_values) : null,
          new_values ? JSON.stringify(new_values) : null,
          changed_by
        ]
      );
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  static async logInsert(table_name: string, record_id: string | number, new_values: any, changed_by: string): Promise<void> {
    await this.logChange({
      table_name,
      record_id,
      action: 'INSERT',
      new_values,
      changed_by
    });
  }

  static async logUpdate(table_name: string, record_id: string | number, old_values: any, new_values: any, changed_by: string): Promise<void> {
    await this.logChange({
      table_name,
      record_id,
      action: 'UPDATE',
      old_values,
      new_values,
      changed_by
    });
  }

  static async logDelete(table_name: string, record_id: string | number, old_values: any, changed_by: string): Promise<void> {
    await this.logChange({
      table_name,
      record_id,
      action: 'DELETE',
      old_values,
      changed_by
    });
  }

  // Get audit history for a specific record
  static async getRecordHistory(table_name: string, record_id: string | number): Promise<any[]> {
    try {
      const results = await executeQuery(
        `SELECT * FROM audit_log 
         WHERE table_name = ? AND record_id = ? 
         ORDER BY changed_at DESC`,
        [table_name, record_id.toString()]
      );
      return Array.isArray(results) ? results : [];
    } catch (error) {
      console.error('Failed to get audit history:', error);
      return [];
    }
  }

  // Get audit history for a table
  static async getTableHistory(table_name: string, limit: number = 100): Promise<any[]> {
    try {
      const results = await executeQuery(
        `SELECT * FROM audit_log 
         WHERE table_name = ? 
         ORDER BY changed_at DESC 
         LIMIT ?`,
        [table_name, limit]
      );
      return Array.isArray(results) ? results : [];
    } catch (error) {
      console.error('Failed to get table audit history:', error);
      return [];
    }
  }

  // Get recent audit activity
  static async getRecentActivity(limit: number = 50): Promise<any[]> {
    try {
      // Use simple direct query like leave_attachments approach
      const results = await executeQuery(
        `SELECT * FROM audit_log 
         ORDER BY changed_at DESC 
         LIMIT ?`,
        [limit]
      );
      
      return Array.isArray(results) ? results : [];
    } catch (error) {
      console.error('Failed to get recent audit activity:', error);
      return [];
    }
  }
}