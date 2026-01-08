import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { StorageService } from '../service/storage-service.service';
import { ApiErrorHandlerService } from './api-error-handler.service';

export interface IMCResponse {
  imc: number;
  categorie: string;
  interpretation: string;
}

export interface BesoinsCaloriquesRequest {
  age: number;
  sexe: 'M' | 'F';
  poids: number;
  taille: number;
  niveauActivite: 'SEDENTAIRE' | 'LEGER' | 'MODERE' | 'INTENSE' | 'TRES_INTENSE';
}

export interface BesoinsCaloriquesResponse {
  besoinsCaloriques: number;
  metabolismeBase: number;
  facteurActivite: number;
  recommandations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ProfileEnhancedService {
  private apiUrl = 'http://localhost:8095/api/profile';

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private errorHandler: ApiErrorHandlerService
  ) {}

  /**
   * Calculer l'IMC de l'utilisateur
   */
  calculerIMC(): Observable<IMCResponse> {
    return this.errorHandler.executeWithRetry(
      // CORRECTION: Utilise l'endpoint backend existant (choix anglais pour cohérence)
      () => this.http.get<IMCResponse>(`${this.apiUrl}/bmi`, { headers: this.getHeaders() }),
      3,
      'profile-imc'
    );
  }

  /**
   * Calculer les besoins caloriques
   */
  calculerBesoinsCaloriques(request: BesoinsCaloriquesRequest): Observable<BesoinsCaloriquesResponse> {
    return this.errorHandler.executeWithRetry(
      // CORRECTION: Utilise l'endpoint backend existant (choix anglais pour cohérence)
      () => this.http.post<BesoinsCaloriquesResponse>(`${this.apiUrl}/caloric-needs`, request, { headers: this.getHeaders() }),
      3,
      'profile-besoins-caloriques'
    );
  }

  /**
   * Obtenir les besoins caloriques actuels
   */
  obtenirBesoinsCaloriques(): Observable<BesoinsCaloriquesResponse> {
    return this.errorHandler.executeWithRetry(
      // CORRECTION: Utilise l'endpoint backend existant (choix anglais pour cohérence)
      () => this.http.get<BesoinsCaloriquesResponse>(`${this.apiUrl}/caloric-needs`, { headers: this.getHeaders() }),
      3,
      'profile-besoins-caloriques'
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