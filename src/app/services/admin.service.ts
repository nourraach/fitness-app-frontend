import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../service/storage-service.service';
import { 
  AuditLogDTO, 
  AuditStatsDTO, 
  AuditFilters,
  AdminUserDTO,
  AdminUserDetailDTO,
  SystemStatsDTO,
  ModerationItemDTO,
  UserActivityReportDTO,
  AdminFilters
} from '../models/admin.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:8095/api/admin';

  constructor(
    private http: HttpClient, 
    private storageService: StorageService
  ) {}

  // Audit Logs
  getAuditLogs(filters?: AuditFilters): Observable<AuditLogDTO[]> {
    const params = this.buildParams(filters);
    return this.http.get<AuditLogDTO[]>(`${this.apiUrl}/audit-logs`, { 
      headers: this.getHeaders(), 
      params 
    });
  }

  searchAuditLogs(query: string): Observable<AuditLogDTO[]> {
    return this.http.get<AuditLogDTO[]>(`${this.apiUrl}/audit-logs/search`, {
      headers: this.getHeaders(),
      params: { query }
    });
  }

  getAuditStats(): Observable<AuditStatsDTO> {
    return this.http.get<AuditStatsDTO>(`${this.apiUrl}/audit-logs/stats`, {
      headers: this.getHeaders()
    });
  }

  getEntityAuditLogs(entityType: string, entityId: number): Observable<AuditLogDTO[]> {
    return this.http.get<AuditLogDTO[]>(`${this.apiUrl}/audit-logs/entity/${entityType}/${entityId}`, {
      headers: this.getHeaders()
    });
  }

  // User Management
  getUsers(filters?: AdminFilters): Observable<{users: AdminUserDTO[], total: number}> {
    const params = this.buildParams(filters);
    return this.http.get<{users: AdminUserDTO[], total: number}>(`${this.apiUrl}/users`, {
      headers: this.getHeaders(),
      params
    });
  }

  getUserDetails(userId: number): Observable<AdminUserDetailDTO> {
    return this.http.get<AdminUserDetailDTO>(`${this.apiUrl}/users/${userId}`, {
      headers: this.getHeaders()
    });
  }

  activateUser(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/activate`, {}, {
      headers: this.getHeaders()
    });
  }

  deactivateUser(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/deactivate`, {}, {
      headers: this.getHeaders()
    });
  }

  deleteUser(userId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/${userId}`, {
      headers: this.getHeaders()
    });
  }

  updateUserStatus(userId: number, status: string): Observable<AdminUserDTO> {
    return this.http.put<AdminUserDTO>(`${this.apiUrl}/users/${userId}/status`, { status }, {
      headers: this.getHeaders()
    });
  }

  resetUserPassword(userId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/${userId}/reset-password`, {}, {
      headers: this.getHeaders()
    });
  }

  // System Stats
  getDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`, {
      headers: this.getHeaders()
    });
  }

  getSystemStats(): Observable<SystemStatsDTO> {
    return this.http.get<SystemStatsDTO>(`${this.apiUrl}/statistics`, {
      headers: this.getHeaders()
    });
  }

  getActivityReports(days: number = 30): Observable<UserActivityReportDTO[]> {
    return this.http.get<UserActivityReportDTO[]>(`${this.apiUrl}/reports/activity`, {
      headers: this.getHeaders(),
      params: { days: days.toString() }
    });
  }

  getRecentAlerts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/alerts/recent`, {
      headers: this.getHeaders()
    });
  }

  // Moderation
  getModerationQueue(): Observable<ModerationItemDTO[]> {
    return this.http.get<ModerationItemDTO[]>(`${this.apiUrl}/moderation`, {
      headers: this.getHeaders()
    });
  }

  moderateItem(itemId: number, action: string, notes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/moderation/${itemId}/moderate`, {
      action,
      notes
    }, {
      headers: this.getHeaders()
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private buildParams(filters?: any): HttpParams {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key].toString());
        }
      });
    }
    return params;
  }
}