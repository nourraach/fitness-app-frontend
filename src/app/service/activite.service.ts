import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { StorageService } from './storage-service.service';
import { ActivitePhysique, CreerActiviteRequest, TotauxActivites, BilanJournalier } from '../models/activite.model';

const BASE_URL = "http://localhost:8095/";

@Injectable({
  providedIn: 'root'
})
export class ActiviteService {

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

  creerActivite(request: CreerActiviteRequest): Observable<ActivitePhysique> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.post<ActivitePhysique>(BASE_URL + 'api/activites/creer', request, { headers });
  }

  getTotauxActivites(date: string): Observable<TotauxActivites> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.get<TotauxActivites>(
      BASE_URL + `api/activites/journalieres?date=${date}`,
      { headers }
    );
  }

  getBilanJournalier(date: string): Observable<BilanJournalier> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.get<BilanJournalier>(
      BASE_URL + `api/activites/bilan?date=${date}`,
      { headers }
    );
  }

  supprimerActivite(activiteId: number): Observable<any> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.delete(BASE_URL + `api/activites/${activiteId}`, { headers });
  }
}
