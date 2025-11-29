import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { StorageService } from './storage-service.service';
import { Aliment } from '../models/aliment.model';
import { Repas, CreerRepasRequest, TotauxJournaliers } from '../models/repas.model';

const BASE_URL = "http://localhost:8095/";

@Injectable({
  providedIn: 'root'
})
export class NutritionService {

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

  getTousLesAliments(): Observable<Aliment[]> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.get<Aliment[]>(BASE_URL + 'api/repas/aliments', { headers });
  }

  rechercherAliments(recherche: string): Observable<Aliment[]> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.get<Aliment[]>(
      BASE_URL + `api/repas/aliments/rechercher?recherche=${recherche}`,
      { headers }
    );
  }

  creerRepas(request: CreerRepasRequest): Observable<Repas> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.post<Repas>(BASE_URL + 'api/repas/creer', request, { headers });
  }

  getTotauxJournaliers(date: string): Observable<TotauxJournaliers> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.get<TotauxJournaliers>(
      BASE_URL + `api/repas/journaliers?date=${date}`,
      { headers }
    );
  }

  supprimerRepas(repasId: number): Observable<any> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.delete(BASE_URL + `api/repas/${repasId}`, { headers });
  }
}
