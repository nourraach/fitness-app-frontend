import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../service/storage-service.service';
import { ApiErrorHandlerService } from './api-error-handler.service';

export interface DefiFrancais {
  id: number;
  nom: string;
  description: string;
  type: string;
  objectif: number;
  unite: string;
  dateDebut: string;
  dateFin: string;
  statut: string;
  participantsCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class DefiFrancaisService {
  private apiUrl = 'http://localhost:8095/api/defis';

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private errorHandler: ApiErrorHandlerService
  ) {}

  /**
   * Obtenir les défis disponibles
   * CORRECTION: Utilise l'endpoint français /api/defis/disponibles
   */
  obtenirDefisDisponibles(): Observable<DefiFrancais[]> {
    return this.errorHandler.executeWithRetry(
      () => this.http.get<DefiFrancais[]>(`${this.apiUrl}/disponibles`, { headers: this.getHeaders() }),
      3,
      'defis-disponibles'
    );
  }

  /**
   * Rejoindre un défi
   * CORRECTION: Utilise l'endpoint français /api/defis/{defiId}/rejoindre
   */
  rejoindreDefi(defiId: number): Observable<any> {
    return this.errorHandler.executeWithRetry(
      () => this.http.post(`${this.apiUrl}/${defiId}/rejoindre`, {}, { headers: this.getHeaders() }),
      3,
      'defis-rejoindre'
    );
  }

  /**
   * Obtenir mes défis
   */
  obtenirMesDefis(): Observable<DefiFrancais[]> {
    return this.errorHandler.executeWithRetry(
      () => this.http.get<DefiFrancais[]>(`${this.apiUrl}/mes-defis`, { headers: this.getHeaders() }),
      3,
      'defis-mes-defis'
    );
  }

  /**
   * Quitter un défi
   */
  quitterDefi(defiId: number): Observable<any> {
    return this.errorHandler.executeWithRetry(
      () => this.http.delete(`${this.apiUrl}/${defiId}/quitter`, { headers: this.getHeaders() }),
      3,
      'defis-quitter'
    );
  }

  private getHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}