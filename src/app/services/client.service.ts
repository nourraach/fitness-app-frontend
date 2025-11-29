import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Client, ClientAssignment } from '../models/client.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private apiUrl = 'http://localhost:8095/api/coach/clients';

  constructor(private http: HttpClient) {}

  // Récupérer tous les clients du coach
  getMyClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}`);
  }

  // Récupérer les clients disponibles (non assignés)
  getAvailableClients(): Observable<Client[]> {
    return this.http.get<Client[]>(`${this.apiUrl}/available`);
  }

  // Assigner un client au coach
  assignClient(clientId: number): Observable<ClientAssignment> {
    return this.http.post<ClientAssignment>(`${this.apiUrl}/assign/${clientId}`, {});
  }

  // Retirer un client
  unassignClient(clientId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/unassign/${clientId}`);
  }

  // Récupérer les détails d'un client
  getClientDetails(clientId: number): Observable<Client> {
    return this.http.get<Client>(`${this.apiUrl}/${clientId}`);
  }
}
