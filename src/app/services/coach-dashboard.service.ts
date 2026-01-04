import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  DashboardOverview, 
  ClientSummary, 
  Alert, 
  BusinessMetrics,
  ClientFilters,
  ProgressChart,
  Recommendation,
  MetricType
} from '../models/coach.model';
import { StorageService } from '../service/storage-service.service';
import { JwtService } from '../service/jwt.service';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class CoachDashboardService {
  private apiUrl = 'http://localhost:8095/api/coach/dashboard';
  
  // State management
  private dashboardOverviewSubject = new BehaviorSubject<DashboardOverview | null>(null);
  private clientsSubject = new BehaviorSubject<ClientSummary[]>([]);
  private alertsSubject = new BehaviorSubject<Alert[]>([]);
  
  public dashboardOverview$ = this.dashboardOverviewSubject.asObservable();
  public clients$ = this.clientsSubject.asObservable();
  public alerts$ = this.alertsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private jwtService: JwtService,
    private errorHandler: ErrorHandlerService
  ) {}

  // Create HTTP headers with JWT token
  private createAuthHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get current coach ID from JWT
  private getCurrentCoachId(): number {
    return this.jwtService.getUserId() || 1;
  }

  /**
   * Get dashboard overview for coach
   */
  getDashboardOverview(coachId?: number): Observable<DashboardOverview> {
    const id = coachId || this.getCurrentCoachId();
    const headers = this.createAuthHeaders();
    
    return this.http.get<DashboardOverview>(`${this.apiUrl}/overview/${id}`, { headers })
      .pipe(
        tap(overview => {
          this.dashboardOverviewSubject.next(overview);
        }),
        catchError(error => {
          this.errorHandler.logError('getDashboardOverview', error);
          return of({
            totalClients: 0,
            activePrograms: 0,
            completionRate: 0,
            recentClients: [],
            urgentAlerts: [],
            businessMetrics: {
              monthlyRevenue: 0,
              retentionRate: 0,
              successRate: 0,
              averageSessionsPerClient: 0,
              clientGrowthRate: 0
            }
          });
        })
      );
  }

  /**
   * Get clients list with optional filters
   */
  getClients(coachId?: number, filters?: ClientFilters): Observable<ClientSummary[]> {
    const id = coachId || this.getCurrentCoachId();
    const headers = this.createAuthHeaders();
    
    let params = new HttpParams();
    if (filters?.search) {
      params = params.set('search', filters.search);
    }
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.relationType) {
      params = params.set('relationType', filters.relationType);
    }
    if (filters?.alertLevel) {
      params = params.set('alertLevel', filters.alertLevel);
    }
    
    return this.http.get<ClientSummary[]>(`${this.apiUrl}/clients/${id}`, { headers, params })
      .pipe(
        tap(clients => {
          this.clientsSubject.next(clients);
        }),
        catchError(error => {
          this.errorHandler.logError('getClients', error);
          return of([]);
        })
      );
  }

  /**
   * Get urgent alerts for coach
   */
  getUrgentAlerts(coachId?: number): Observable<Alert[]> {
    const id = coachId || this.getCurrentCoachId();
    const headers = this.createAuthHeaders();
    
    return this.http.get<Alert[]>(`${this.apiUrl}/alerts/${id}`, { headers })
      .pipe(
        tap(alerts => {
          this.alertsSubject.next(alerts);
        }),
        catchError(error => {
          this.errorHandler.logError('getUrgentAlerts', error);
          return of([]);
        })
      );
  }

  /**
   * Get business metrics for coach
   */
  getBusinessMetrics(coachId?: number, period?: string): Observable<BusinessMetrics> {
    const id = coachId || this.getCurrentCoachId();
    const headers = this.createAuthHeaders();
    
    let params = new HttpParams();
    if (period) {
      params = params.set('period', period);
    }
    
    return this.http.get<BusinessMetrics>(`${this.apiUrl}/metrics/${id}`, { headers, params })
      .pipe(
        catchError(error => {
          this.errorHandler.logError('getBusinessMetrics', error);
          return of({
            monthlyRevenue: 0,
            retentionRate: 0,
            successRate: 0,
            averageSessionsPerClient: 0,
            clientGrowthRate: 0
          });
        })
      );
  }

  /**
   * Get progress charts for a client
   */
  getProgressCharts(clientId: number, metrics: MetricType[], startDate?: Date, endDate?: Date): Observable<ProgressChart[]> {
    const headers = this.createAuthHeaders();
    
    let params = new HttpParams();
    metrics.forEach(metric => {
      params = params.append('metrics', metric);
    });
    if (startDate) {
      params = params.set('startDate', startDate.toISOString().split('T')[0]);
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString().split('T')[0]);
    }
    
    return this.http.get<ProgressChart[]>(`${this.apiUrl}/progress/${clientId}`, { headers, params })
      .pipe(
        catchError(error => {
          this.errorHandler.logError('getProgressCharts', error);
          return of([]);
        })
      );
  }

  /**
   * Get AI recommendations for a client
   */
  getRecommendations(clientId: number): Observable<Recommendation[]> {
    const headers = this.createAuthHeaders();
    
    return this.http.get<Recommendation[]>(`${this.apiUrl}/recommendations/${clientId}`, { headers })
      .pipe(
        catchError(error => {
          this.errorHandler.logError('getRecommendations', error);
          return of([]);
        })
      );
  }

  /**
   * Search clients by name or email
   */
  searchClients(query: string, coachId?: number): Observable<ClientSummary[]> {
    return this.getClients(coachId, { search: query });
  }

  /**
   * Get clients by alert level
   */
  getClientsByAlertLevel(alertLevel: string, coachId?: number): Observable<ClientSummary[]> {
    return this.getClients(coachId, { alertLevel: alertLevel as any });
  }

  /**
   * Refresh all dashboard data
   */
  refreshDashboard(coachId?: number): void {
    const id = coachId || this.getCurrentCoachId();
    this.getDashboardOverview(id).subscribe();
    this.getClients(id).subscribe();
    this.getUrgentAlerts(id).subscribe();
  }

  /**
   * Clear local state (useful for logout)
   */
  clearState(): void {
    this.dashboardOverviewSubject.next(null);
    this.clientsSubject.next([]);
    this.alertsSubject.next([]);
  }

  /**
   * Get client details by ID
   */
  getClientDetails(clientId: number): Observable<ClientSummary | null> {
    return this.clients$.pipe(
      map(clients => clients.find(client => client.clientId === clientId) || null)
    );
  }

  /**
   * Get total unread alerts count
   */
  getUnreadAlertsCount(): Observable<number> {
    return this.alerts$.pipe(
      map(alerts => alerts.length)
    );
  }
}