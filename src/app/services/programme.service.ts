import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { 
  ProgrammeEntrainement, 
  CreerProgrammeRequest, 
  UpdateStatutRequest,
  ProgrammeStatut
} from '../models/programme.model';
import { StorageService } from '../service/storage-service.service';

@Injectable({
  providedIn: 'root'
})
export class ProgrammeService {
  private readonly API_URL = 'http://localhost:8095/api/programmes';

  constructor(
    private http: HttpClient, 
    private storageService: StorageService
  ) {}

  /**
   * Génère les headers avec le token JWT
   * Le coachId est extrait du token côté backend
   */
  private getHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Gestion centralisée des erreurs HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = error.error.message;
    } else {
      // Erreur côté serveur
      switch (error.status) {
        case 400:
          errorMessage = error.error?.message || error.error?.erreur || 'Données invalides';
          break;
        case 401:
          errorMessage = 'Non authentifié. Veuillez vous reconnecter.';
          break;
        case 403:
          errorMessage = error.error?.message || 'Accès non autorisé';
          break;
        case 404:
          errorMessage = 'Ressource non trouvée';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = error.error?.message || `Erreur ${error.status}`;
      }
    }
    
    console.error('ProgrammeService Error:', { status: error.status, message: errorMessage, error });
    return throwError(() => new Error(errorMessage));
  }

  // ============================================
  // ENDPOINTS PRINCIPAUX
  // ============================================

  /**
   * POST /api/programmes
   * Créer un nouveau programme d'entraînement
   * Le coachId est automatiquement extrait du JWT côté backend
   */
  creerProgramme(request: CreerProgrammeRequest): Observable<ProgrammeEntrainement> {
    console.log('📤 Création programme - Request:', JSON.stringify(request, null, 2));
    
    return this.http.post<ProgrammeEntrainement>(
      this.API_URL, 
      request, 
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('✅ Programme créé:', response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * GET /api/programmes/coach
   * Récupérer tous les programmes du coach connecté
   */
  getProgrammesCoach(): Observable<ProgrammeEntrainement[]> {
    return this.http.get<ProgrammeEntrainement[]>(
      `${this.API_URL}/coach`, 
      { headers: this.getHeaders() }
    ).pipe(
      tap(programmes => console.log('📥 Programmes coach:', programmes.length)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * GET /api/programmes/client/{id}
   * Récupérer les programmes d'un client spécifique
   */
  getProgrammesClient(clientId?: number): Observable<ProgrammeEntrainement[]> {
    const url = clientId 
      ? `${this.API_URL}/client/${clientId}` 
      : `${this.API_URL}/client`;
    
    return this.http.get<ProgrammeEntrainement[]>(
      url, 
      { headers: this.getHeaders() }
    ).pipe(
      tap(programmes => console.log('📥 Programmes client:', programmes.length)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * GET /api/programmes/{id}
   * Récupérer les détails d'un programme
   */
  getProgrammeById(id: number): Observable<ProgrammeEntrainement> {
    return this.http.get<ProgrammeEntrainement>(
      `${this.API_URL}/${id}`, 
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * PUT /api/programmes/{id}
   * Modifier un programme existant
   */
  updateProgramme(id: number, request: CreerProgrammeRequest): Observable<ProgrammeEntrainement> {
    console.log('📤 Modification programme:', id, request);
    
    return this.http.put<ProgrammeEntrainement>(
      `${this.API_URL}/${id}`, 
      request, 
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('✅ Programme modifié:', response)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * PUT /api/programmes/{id}/status
   * Modifier le statut d'un programme (EN)
   */
  updateStatus(id: number, statut: ProgrammeStatut): Observable<ProgrammeEntrainement> {
    const request: UpdateStatutRequest = { statut };
    
    return this.http.put<ProgrammeEntrainement>(
      `${this.API_URL}/${id}/status`, 
      request, 
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('✅ Statut modifié:', response.statut)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * PATCH /api/programmes/{id}/statut
   * Modifier le statut d'un programme (FR)
   */
  changerStatut(id: number, statut: string): Observable<ProgrammeEntrainement> {
    return this.http.patch<ProgrammeEntrainement>(
      `${this.API_URL}/${id}/statut`, 
      { statut }, 
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => console.log('✅ Statut changé:', statut)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * DELETE /api/programmes/{id}
   * Supprimer/Annuler un programme
   */
  deleteProgramme(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.API_URL}/${id}`, 
      { headers: this.getHeaders() }
    ).pipe(
      tap(() => console.log('🗑️ Programme supprimé:', id)),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * GET /api/programmes/with-progress
   * Récupérer les programmes avec leur progression
   */
  getProgrammesWithProgress(): Observable<ProgrammeEntrainement[]> {
    return this.http.get<ProgrammeEntrainement[]>(
      `${this.API_URL}/with-progress`, 
      { headers: this.getHeaders() }
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  // Alias pour compatibilité
  supprimerProgramme(id: number): Observable<void> {
    return this.deleteProgramme(id);
  }

  modifierProgramme(id: number, request: CreerProgrammeRequest): Observable<ProgrammeEntrainement> {
    return this.updateProgramme(id, request);
  }
}
