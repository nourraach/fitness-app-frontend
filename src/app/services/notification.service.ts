import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { StorageService } from '../service/storage-service.service';

export interface NotificationPreferences {
  id?: number;
  userId: number;
  rappelEntrainement: boolean;
  heureRappelEntrainement: string;
  rappelNutrition: boolean;
  heureRappelNutrition: string;
  rappelPesee: boolean;
  heureRappelPesee: string;
  joursPesee: string[];
  motivationnel: boolean;
  frequenceMotivationnel: number;
  silenceDebut: string;
  silenceFin: string;
  notifications: boolean;
  email: boolean;
  push: boolean;
}

export interface NotificationHistory {
  id: number;
  userId: number;
  type: 'ENTRAINEMENT' | 'NUTRITION' | 'PESEE' | 'MOTIVATIONNEL';
  titre: string;
  message: string;
  dateEnvoi: string;
  lu: boolean;
  utile?: boolean;
}

export interface NotificationStats {
  totalNotifications: number;
  notificationsLues: number;
  tauxLecture: number;
  repartitionParType: { [key: string]: number };
  tendanceHebdomadaire: Array<{
    semaine: string;
    total: number;
    lues: number;
  }>;
  recommandations: string[];
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8095/api/notifications';
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {
    this.loadUnreadCount();
  }

  // Preferences methods
  getPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.apiUrl}/preferences`, {
      headers: this.getHeaders()
    });
  }

  savePreferences(preferences: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.post<NotificationPreferences>(`${this.apiUrl}/preferences`, preferences, {
      headers: this.getHeaders()
    });
  }

  // History methods
  getHistory(page: number = 0, size: number = 20, type?: string, period?: string): Observable<PaginatedResponse<NotificationHistory>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (type) {
      params = params.set('type', type);
    }
    if (period) {
      params = params.set('period', period);
    }

    return this.http.get<PaginatedResponse<NotificationHistory>>(`${this.apiUrl}/history`, {
      headers: this.getHeaders(),
      params
    });
  }

  markAsRead(notificationId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${notificationId}/read`, {}, {
      headers: this.getHeaders()
    });
  }

  markAsUnread(notificationId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${notificationId}/unread`, {}, {
      headers: this.getHeaders()
    });
  }

  markAsUseful(notificationId: number, useful: boolean): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${notificationId}/feedback`, { useful }, {
      headers: this.getHeaders()
    });
  }

  // Stats methods
  getStats(period?: string): Observable<NotificationStats> {
    let params = new HttpParams();
    if (period) {
      params = params.set('period', period);
    }

    return this.http.get<NotificationStats>(`${this.apiUrl}/stats`, {
      headers: this.getHeaders(),
      params
    });
  }

  // Real-time methods
  getUnreadCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/unread-count`, {
      headers: this.getHeaders()
    });
  }

  private loadUnreadCount() {
    this.getUnreadCount().subscribe({
      next: (count) => {
        this.unreadCountSubject.next(count);
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
      }
    });
  }

  updateUnreadCount(count: number) {
    this.unreadCountSubject.next(count);
  }

  // Test notification
  sendTestNotification(type: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/test`, { type }, {
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
}