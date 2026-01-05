import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client, ClientAssignment } from '../models/client.model';
import { StorageService } from '../service/storage-service.service';
import { ApiErrorHandlerService } from './api-error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = 'http://localhost:8095/api/coach/clients';

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private errorHandler: ApiErrorHandlerService
  ) {}

  // Récupérer tous les clients du coach
  getMyClients(): Observable<Client[]> {
    return this.errorHandler.executeWithRetry(
      () => this.http.get<Client[]>(`${this.apiUrl}`, { headers: this.getHeaders() }),
      3,
      'client-get-my-clients'
    );
  }

  // Récupérer les clients disponibles (non assignés)
  getAvailableClients(): Observable<Client[]> {
    return this.errorHandler.executeWithRetry(
      () => this.http.get<Client[]>(`${this.apiUrl}/available`, { headers: this.getHeaders() }),
      3,
      'client-get-available'
    );
  }

  // Assigner un client au coach
  assignClient(clientId: number): Observable<ClientAssignment> {
    return this.errorHandler.executeWithRetry(
      () => this.http.post<ClientAssignment>(`${this.apiUrl}/assign/${clientId}`, {}, { headers: this.getHeaders() }),
      3,
      'client-assign'
    );
  }

  // Retirer un client
  unassignClient(clientId: number): Observable<void> {
    return this.errorHandler.executeWithRetry(
      () => this.http.delete<void>(`${this.apiUrl}/unassign/${clientId}`, { headers: this.getHeaders() }),
      3,
      'client-unassign'
    );
  }

  // Récupérer les détails d'un client
  getClientDetails(clientId: number): Observable<Client> {
    return this.errorHandler.executeWithRetry(
      () => this.http.get<Client>(`${this.apiUrl}/${clientId}`, { headers: this.getHeaders() }),
      3,
      'client-get-details'
    );
  }

  // NOUVEAU: Get enhanced clients with additional statistics
  getEnhancedClients(): Observable<import('../models/enhanced-client.model').EnhancedClientDTO[]> {
    return this.errorHandler.executeWithRetry(
      () => this.http.get<import('../models/enhanced-client.model').EnhancedClientDTO[]>(`${this.apiUrl}/enhanced`, { headers: this.getHeaders() }),
      3,
      'client-get-enhanced'
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
