import { Database } from 'sqlite';
import { ApiLog, databaseService } from '@/services/database.service';
import { logger } from '@/utils/logger';

export interface CreateLogData {
  userId: string;
  panelConfigId?: number;
  requestId: string;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
  errorMessage?: string;
}

export interface LogFilter {
  userId?: string;
  panelConfigId?: number;
  method?: string;
  statusCode?: number;
  dateFrom?: string;
  dateTo?: string;
  hasError?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface LogStats {
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  averageResponseTime: number;
  requestsByMethod: Record<string, number>;
  requestsByStatus: Record<string, number>;
}

export class ApiLogRepository {
  private get db(): Database {
    return databaseService.getDatabase();
  }

  /**
   * Create a new API log entry
   */
  public async create(logData: CreateLogData): Promise<ApiLog> {
    try {
      const result = await this.db.run(
        `INSERT INTO api_logs (user_id, panel_config_id, request_id, method, path, status_code, response_time, error_message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          logData.userId,
          logData.panelConfigId || null,
          logData.requestId,
          logData.method,
          logData.path,
          logData.statusCode,
          logData.responseTime,
          logData.errorMessage || null,
        ]
      );

      if (!result.lastID) {
        throw new Error('Failed to create API log entry');
      }

      const log = await this.findById(result.lastID);
      if (!log) {
        throw new Error('Failed to retrieve created API log entry');
      }

      return log;
    } catch (error) {
      logger.error('Failed to create API log entry:', error);
      throw error;
    }
  }

  /**
   * Find API log by ID
   */
  public async findById(id: number): Promise<ApiLog | null> {
    try {
      const log = await this.db.get<ApiLog>(
        'SELECT * FROM api_logs WHERE id = ?',
        [id]
      );
      return log || null;
    } catch (error) {
      logger.error('Failed to find API log by ID:', error);
      throw error;
    }
  }

  /**
   * List API logs with filtering
   */
  public async list(filter: LogFilter = {}): Promise<ApiLog[]> {
    try {
      let query = 'SELECT * FROM api_logs WHERE 1=1';
      const values: any[] = [];

      if (filter.userId) {
        query += ' AND user_id = ?';
        values.push(filter.userId);
      }

      if (filter.panelConfigId) {
        query += ' AND panel_config_id = ?';
        values.push(filter.panelConfigId);
      }

      if (filter.method) {
        query += ' AND method = ?';
        values.push(filter.method);
      }

      if (filter.statusCode) {
        query += ' AND status_code = ?';
        values.push(filter.statusCode);
      }

      if (filter.dateFrom) {
        query += ' AND created_at >= ?';
        values.push(filter.dateFrom);
      }

      if (filter.dateTo) {
        query += ' AND created_at <= ?';
        values.push(filter.dateTo);
      }

      if (filter.hasError !== undefined) {
        if (filter.hasError) {
          query += ' AND error_message IS NOT NULL';
        } else {
          query += ' AND error_message IS NULL';
        }
      }

      if (filter.search) {
        query += ' AND (path LIKE ? OR error_message LIKE ?)';
        const searchPattern = `%${filter.search}%`;
        values.push(searchPattern, searchPattern);
      }

      query += ' ORDER BY created_at DESC';

      if (filter.limit) {
        query += ' LIMIT ?';
        values.push(filter.limit);

        if (filter.offset) {
          query += ' OFFSET ?';
          values.push(filter.offset);
        }
      }

      const logs = await this.db.all<ApiLog[]>(query, values);
      return logs;
    } catch (error) {
      logger.error('Failed to list API logs:', error);
      throw error;
    }
  }

  /**
   * Get API logs count
   */
  public async count(filter: LogFilter = {}): Promise<number> {
    try {
      let query = 'SELECT COUNT(*) as count FROM api_logs WHERE 1=1';
      const values: any[] = [];

      if (filter.userId) {
        query += ' AND user_id = ?';
        values.push(filter.userId);
      }

      if (filter.panelConfigId) {
        query += ' AND panel_config_id = ?';
        values.push(filter.panelConfigId);
      }

      if (filter.method) {
        query += ' AND method = ?';
        values.push(filter.method);
      }

      if (filter.statusCode) {
        query += ' AND status_code = ?';
        values.push(filter.statusCode);
      }

      if (filter.dateFrom) {
        query += ' AND created_at >= ?';
        values.push(filter.dateFrom);
      }

      if (filter.dateTo) {
        query += ' AND created_at <= ?';
        values.push(filter.dateTo);
      }

      if (filter.hasError !== undefined) {
        if (filter.hasError) {
          query += ' AND error_message IS NOT NULL';
        } else {
          query += ' AND error_message IS NULL';
        }
      }

      if (filter.search) {
        query += ' AND (path LIKE ? OR error_message LIKE ?)';
        const searchPattern = `%${filter.search}%`;
        values.push(searchPattern, searchPattern);
      }

      const result = await this.db.get<{ count: number }>(query, values);
      return result?.count || 0;
    } catch (error) {
      logger.error('Failed to count API logs:', error);
      throw error;
    }
  }

  /**
   * Get API usage statistics
   */
  public async getStats(filter: LogFilter = {}): Promise<LogStats> {
    try {
      let baseQuery = 'FROM api_logs WHERE 1=1';
      const values: any[] = [];

      if (filter.userId) {
        baseQuery += ' AND user_id = ?';
        values.push(filter.userId);
      }

      if (filter.panelConfigId) {
        baseQuery += ' AND panel_config_id = ?';
        values.push(filter.panelConfigId);
      }

      if (filter.dateFrom) {
        baseQuery += ' AND created_at >= ?';
        values.push(filter.dateFrom);
      }

      if (filter.dateTo) {
        baseQuery += ' AND created_at <= ?';
        values.push(filter.dateTo);
      }

      // Get basic stats
      const basicStats = await this.db.get<{
        total: number;
        success: number;
        error: number;
        avgResponseTime: number;
      }>(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status_code < 400 THEN 1 ELSE 0 END) as success,
          SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as error,
          AVG(response_time) as avgResponseTime
        ${baseQuery}
      `, values);

      // Get requests by method
      const methodStats = await this.db.all<{ method: string; count: number }[]>(
        `SELECT method, COUNT(*) as count ${baseQuery} GROUP BY method`,
        values
      );

      // Get requests by status code
      const statusStats = await this.db.all<{ status_code: number; count: number }[]>(
        `SELECT status_code, COUNT(*) as count ${baseQuery} GROUP BY status_code`,
        values
      );

      const requestsByMethod: Record<string, number> = {};
      methodStats.forEach(stat => {
        requestsByMethod[stat.method] = stat.count;
      });

      const requestsByStatus: Record<string, number> = {};
      statusStats.forEach(stat => {
        requestsByStatus[stat.status_code.toString()] = stat.count;
      });

      return {
        totalRequests: basicStats?.total || 0,
        successRequests: basicStats?.success || 0,
        errorRequests: basicStats?.error || 0,
        averageResponseTime: basicStats?.avgResponseTime || 0,
        requestsByMethod,
        requestsByStatus,
      };
    } catch (error) {
      logger.error('Failed to get API log stats:', error);
      throw error;
    }
  }

  /**
   * Delete old logs
   */
  public async deleteOldLogs(retentionDays: number = 30): Promise<number> {
    try {
      const result = await this.db.run(
        'DELETE FROM api_logs WHERE created_at < datetime("now", "-" || ? || " days")',
        [retentionDays]
      );

      const deletedCount = result.changes || 0;

      logger.info('Old API logs deleted', {
        deletedCount,
        retentionDays,
      });

      return deletedCount;
    } catch (error) {
      logger.error('Failed to delete old logs:', error);
      throw error;
    }
  }

  /**
   * Get daily request counts for a date range
   */
  public async getDailyStats(dateFrom: string, dateTo: string, userId?: string): Promise<{ date: string; count: number }[]> {
    try {
      let query = `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM api_logs 
        WHERE created_at >= ? AND created_at <= ?
      `;
      const values: any[] = [dateFrom, dateTo];

      if (userId) {
        query += ' AND user_id = ?';
        values.push(userId);
      }

      query += ' GROUP BY DATE(created_at) ORDER BY date';

      const stats = await this.db.all<{ date: string; count: number }[]>(query, values);
      return stats;
    } catch (error) {
      logger.error('Failed to get daily stats:', error);
      throw error;
    }
  }
}

export const apiLogRepository = new ApiLogRepository();