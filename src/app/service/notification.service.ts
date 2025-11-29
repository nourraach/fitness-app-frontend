import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, interval } from 'rxjs';
import { StorageService } from './storage-service.service';
import { NotificationDTO, PreferenceNotificationDTO } from '../models/notification.model';

const BASE_URL = "http://localhost:8095/";

@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  private createAuthorizationHeader(): HttpHeaders | null {
    const jwtToken = this.storageService.getItem('jwt');
    if (jwtToken) {
      return new HttpHeaders()
        .set("Authorization", "Bearer " + jwtToken)
        .set("Content-Type", "application/json");
    }
    console.error("Aucun JWT trouvé dans localStorage.");
    return null;
  }

  getNotifications(): Observable<NotificationDTO[]> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.get<NotificationDTO[]>(BASE_URL + 'api/notifications', { headers });
  }

  getNotificationsNonLues(): Observable<NotificationDTO[]> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.get<NotificationDTO[]>(BASE_URL + 'api/notifications/non-lues', { headers });
  }

  countNotificationsNonLues(): Observable<number> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.get<number>(BASE_URL + 'api/notifications/count-non-lues', { headers });
  }

  marquerCommeLue(notificationId: number): Observable<any> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.put(BASE_URL + `api/notifications/${notificationId}/lire`, {}, { headers });
  }

  marquerToutesCommeLues(): Observable<any> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.put(BASE_URL + 'api/notifications/lire-toutes', {}, { headers });
  }

  supprimerNotification(notificationId: number): Observable<any> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.delete(BASE_URL + `api/notifications/${notificationId}`, { headers });
  }

  getPreferences(): Observable<PreferenceNotificationDTO> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.get<PreferenceNotificationDTO>(BASE_URL + 'api/notifications/preferences', { headers });
  }

  updatePreferences(preferences: PreferenceNotificationDTO): Observable<PreferenceNotificationDTO> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.put<PreferenceNotificationDTO>(
      BASE_URL + 'api/notifications/preferences',
      preferences,
      { headers }
    );
  }

  programmerNotifications(): Observable<any> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.post(BASE_URL + 'api/notifications/programmer', {}, { headers });
  }
}
