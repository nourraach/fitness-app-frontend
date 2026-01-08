import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of, timer } from 'rxjs';
import { map, catchError, tap, retry, retryWhen, delayWhen, take } from 'rxjs/operators';
import { JwtService } from '../service/jwt.service';
import { 
  InAppNotification, 
  NotificationFilters, 
  NotificationStats, 
  NotificationHistory,
  NotificationApiResponse,
  CreateNotificationRequest,
  NotificationPreferences
} from '../models/in-app-notification.model';

const BASE_URL = 'http://localhost:8095/';

@Injectable({
  providedIn: 'root'
})
export class InAppNotificationService {
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000;

  constructor(
    private http: HttpClient,
    private jwtService: JwtService
  ) {}

  private getUserId(): number | null {
    return this.jwtService.getUserId();
  }

  /**
   * Récupère toutes les notifications
   */
  getNotifications(): Observable<InAppNotification[]> {
    const userId = this.getUserId();
    if (!userId) {
      return of([]);
    }
    return this.http.get<InAppNotification[] | NotificationApiResponse<InAppNotification[]>>(
      `${BASE_URL}api/notifications?userId=${userId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => Array.isArray(res) ? res : (res.data || [])),
      retryWhen(errors => this.retryStrategy(errors)),
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Récupère les notifications non lues
   */
  getUnreadNotifications(): Observable<InAppNotification[]> {
    const userId = this.getUserId();
    if (!userId) {
      return of([]);
    }
    return this.http.get<InAppNotification[] | NotificationApiResponse<InAppNotification[]>>(
      `${BASE_URL}api/notifications/non-lues?userId=${userId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => Array.isArray(res) ? res : (res.data || [])),
      retryWhen(errors => this.retryStrategy(errors)),
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Récupère le compteur de notifications non lues
   */
  getUnreadCount(): Observable<number> {
    const userId = this.getUserId();
    if (!userId) {
      return of(0);
    }
    return this.http.get<{ count: number } | NotificationApiResponse<number>>(
      `${BASE_URL}api/notifications/non-lues/count?userId=${userId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => {
        if (typeof res === 'object' && 'count' in res) {
          return res.count;
        }
        return (res as NotificationApiResponse<number>).data || 0;
      }),
      retryWhen(errors => this.retryStrategy(errors)),
      catchError(() => of(0))
    );
  }

  /**
   * Marque une notification comme lue
   */
  markAsRead(id: number): Observable<InAppNotification> {
    const userId = this.getUserId();
    if (!userId) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }
    return this.http.put<InAppNotification | NotificationApiResponse<InAppNotification>>(
      `${BASE_URL}api/notifications/${id}/lire?userId=${userId}`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(res => ('data' in res ? res.data! : res) as InAppNotification),
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Marque une notification comme non lue
   */
  markAsUnread(id: number): Observable<InAppNotification> {
    const userId = this.getUserId();
    if (!userId) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }
    return this.http.put<InAppNotification | NotificationApiResponse<InAppNotification>>(
      `${BASE_URL}api/notifications/${id}/unread?userId=${userId}`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(res => ('data' in res ? res.data! : res) as InAppNotification),
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead(): Observable<void> {
    const userId = this.getUserId();
    if (!userId) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }
    return this.http.put<void | NotificationApiResponse<void>>(
      `${BASE_URL}api/notifications/lire-toutes?userId=${userId}`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(() => void 0),
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Récupère l'historique avec filtres
   */
  getHistory(filters: NotificationFilters): Observable<NotificationHistory> {
    const userId = this.getUserId();
    if (!userId) {
      return of({ content: [], totalElements: 0, totalPages: 0, currentPage: 0, size: 10 });
    }
    let params = new HttpParams().set('userId', userId.toString());
    if (filters.type) params = params.set('type', filters.type);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.read !== undefined) params = params.set('read', filters.read.toString());
    if (filters.page !== undefined) params = params.set('page', filters.page.toString());
    if (filters.size !== undefined) params = params.set('size', filters.size.toString());

    return this.http.get<NotificationHistory | NotificationApiResponse<NotificationHistory>>(
      `${BASE_URL}api/notifications/history`,
      { headers: this.getHeaders(), params }
    ).pipe(
      retryWhen(errors => this.retryStrategy(errors)),
      map(res => ('data' in res ? (res.data || { content: [], totalElements: 0, totalPages: 0, currentPage: 0, size: 10 }) : res) as NotificationHistory),
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Récupère les statistiques
   */
  getStats(): Observable<NotificationStats> {
    const userId = this.getUserId();
    if (!userId) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }
    return this.http.get<NotificationStats | NotificationApiResponse<NotificationStats>>(
      `${BASE_URL}api/notifications/stats?userId=${userId}`,
      { headers: this.getHeaders() }
    ).pipe(
      retryWhen(errors => this.retryStrategy(errors)),
      map(res => ('data' in res ? res.data! : res) as NotificationStats),
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Exporte les notifications (RGPD)
   */
  exportNotifications(): Observable<Blob> {
    const userId = this.getUserId();
    if (!userId) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }
    return this.http.get(`${BASE_URL}api/notifications/export?userId=${userId}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Crée une notification de test
   */
  createTestNotification(): Observable<InAppNotification> {
    const userId = this.getUserId();
    if (!userId) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }
    return this.http.post<InAppNotification | NotificationApiResponse<InAppNotification>>(
      `${BASE_URL}api/notifications/test?userId=${userId}`,
      {},
      { headers: this.getHeaders() }
    ).pipe(
      map(res => ('data' in res ? res.data! : res) as InAppNotification),
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Crée une notification manuelle
   */
  createNotification(data: CreateNotificationRequest): Observable<InAppNotification> {
    const userId = this.getUserId();
    if (!userId) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }
    return this.http.post<InAppNotification | NotificationApiResponse<InAppNotification>>(
      `${BASE_URL}api/notifications/creer?userId=${userId}`,
      data,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => ('data' in res ? res.data! : res) as InAppNotification),
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Récupère les préférences de notifications
   */
  getPreferences(): Observable<NotificationPreferences> {
    const userId = this.getUserId();
    if (!userId) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }
    return this.http.get<NotificationPreferences | NotificationApiResponse<NotificationPreferences>>(
      `${BASE_URL}api/notifications/preferences?userId=${userId}`,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => ('data' in res ? res.data! : res) as NotificationPreferences),
      retryWhen(errors => this.retryStrategy(errors)),
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Met à jour les préférences de notifications
   */
  updatePreferences(preferences: NotificationPreferences): Observable<NotificationPreferences> {
    const userId = this.getUserId();
    if (!userId) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }
    return this.http.put<NotificationPreferences | NotificationApiResponse<NotificationPreferences>>(
      `${BASE_URL}api/notifications/preferences?userId=${userId}`,
      preferences,
      { headers: this.getHeaders() }
    ).pipe(
      map(res => ('data' in res ? res.data! : res) as NotificationPreferences),
      catchError(err => this.handleError(err))
    );
  }

  private getHeaders(): HttpHeaders {
    const token = this.jwtService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private retryStrategy(errors: Observable<any>): Observable<any> {
    return errors.pipe(
      delayWhen((_, i) => timer(this.RETRY_DELAY * Math.pow(2, i))),
      take(this.MAX_RETRIES)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      this.jwtService.logout();
      return throwError(() => new Error('Session expirée'));
    }
    if (error.status === 500) {
      return throwError(() => new Error('Erreur serveur'));
    }
    if (error.status === 0) {
      return throwError(() => new Error('Problème de connexion'));
    }
    return throwError(() => new Error(error.error?.message || 'Erreur inconnue'));
  }
}
