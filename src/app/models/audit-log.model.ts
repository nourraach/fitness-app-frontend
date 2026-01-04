export interface AuditLogDTO {
  id: number;
  adminUserId: number;
  adminUserEmail: string;
  action: string;
  entityType: string;
  entityId?: number;
  details: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE' | 'MODERATE' | 'VIEW';
}

export interface AuditStatsDTO {
  totalLogs: number;
  logsLast24h: number;
  logsLastWeek: number;
  logsLastMonth: number;
  createActions: number;
  updateActions: number;
  deleteActions: number;
  moderateActions: number;
}

export interface AuditFilters {
  page?: number;
  size?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  actionType?: string;
  adminUserId?: number;
}

export enum AuditActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  ACTIVATE = 'ACTIVATE',
  DEACTIVATE = 'DEACTIVATE',
  MODERATE = 'MODERATE',
  VIEW = 'VIEW'
}