export interface AdminUserDTO {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  prenom?: string; // French alias for firstName
  nom?: string; // French alias for lastName
  telephone?: string; // Phone number
  dateNaissance?: string; // Birth date
  role: string;
  enabled: boolean;
  status?: string; // User status (active/inactive)
  createdAt: string;
  lastLoginAt?: string;
  lastLogin?: string; // Alias for lastLoginAt
  loginCount?: number; // Number of logins
  programsCount?: number; // Number of programs
  messagesCount?: number; // Number of messages
}

export interface AdminUserDetailDTO extends AdminUserDTO {
  phone?: string;
  address?: string;
  profileCompleteness: number;
  totalLogins: number;
  totalActions: number;
  recentActivity: AdminActionDTO[];
}

export interface AdminActionDTO {
  id: number;
  action: string;
  timestamp: string;
  details: string;
}

export interface AuditLogDTO {
  id: number;
  userId: number;
  userName: string;
  action: string;
  entityType: string;
  entityId: number;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  details: string;
}

export interface AuditStatsDTO {
  totalLogs: number;
  logsToday: number;
  logsThisWeek: number;
  logsThisMonth: number;
  topActions: Array<{ action: string; count: number }>;
  topUsers: Array<{ userId: number; userName: string; count: number }>;
}

export interface AuditFilters {
  page?: number;
  size?: number;
  userId?: number;
  action?: string;
  entityType?: string;
  startDate?: string;
  endDate?: string;
}

export interface SystemStatsDTO {
  totalUsers: number;
  activeUsers: number;
  totalCoaches: number;
  totalClients: number;
  totalProgrammes: number;
  totalPrograms: number; // Alias for totalProgrammes
  totalActivities: number;
  systemUptime: number; // Changed from string to number (seconds)
  memoryUsage: number;
  cpuUsage: number;
  // New properties for dashboard
  newUsersToday: number;
  newProgramsThisWeek: number;
  messagesThisWeek: number;
  reportsGenerated: number;
}

export interface ModerationItemDTO {
  id: number;
  itemType: string;
  itemId: number;
  reportReason: string;
  reportedBy: number;
  reportedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderatedBy?: number;
  moderatedAt?: string;
  moderationNotes?: string;
}

export interface UserStatsDTO {
  userId: number;
  totalLogins: number;
  lastLoginAt: string;
  totalActivities: number;
  totalPrograms: number;
  accountAge: number;
}

export interface UserActivityReportDTO {
  userId: number;
  userName: string;
  activitiesLast7Days: number;
  activitiesLast30Days: number;
  programsCompleted: number;
  lastActivity: string;
  engagementScore: number;
}

export enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  COACH = 'COACH',
  CLIENT = 'CLIENT'
}

export interface AdminFilters {
  page?: number;
  size?: number;
  search?: string;
  role?: UserRole;
  status?: 'ACTIVE' | 'INACTIVE';
}