import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { StorageService } from './storage-service.service';
import { 
  SuiviPoidsDTO, 
  AjouterPoidsRequest, 
  EvolutionPoidsDTO, 
  StatistiquesProgressionDTO 
} from '../models/suivi-poids.model';

const BASE_URL = "http://localhost:8095/";

@Injectable({
  providedIn: 'root'
})
export class SuiviPoidsService {

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

  ajouterPoids(request: AjouterPoidsRequest): Observable<SuiviPoidsDTO> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.post<SuiviPoidsDTO>(
      BASE_URL + 'api/suivi-poids/ajouter',
      request,
      { headers }
    );
  }

  getEvolutionPoids(dateDebut?: string, dateFin?: string): Observable<EvolutionPoidsDTO> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    
    let url = BASE_URL + 'api/suivi-poids/evolution';
    const params: string[] = [];
    
    if (dateDebut) params.push(`dateDebut=${dateDebut}`);
    if (dateFin) params.push(`dateFin=${dateFin}`);
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get<EvolutionPoidsDTO>(url, { headers });
  }

  getStatistiquesProgression(dateDebut: string, dateFin: string): Observable<StatistiquesProgressionDTO> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.get<StatistiquesProgressionDTO>(
      BASE_URL + `api/suivi-poids/statistiques?dateDebut=${dateDebut}&dateFin=${dateFin}`,
      { headers }
    );
  }

  getHistoriquePoids(): Observable<SuiviPoidsDTO[]> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.get<SuiviPoidsDTO[]>(
      BASE_URL + 'api/suivi-poids/historique',
      { headers }
    );
  }

  supprimerPoids(poidsId: number): Observable<any> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.delete(
      BASE_URL + `api/suivi-poids/${poidsId}`,
      { headers }
    );
  }
}
