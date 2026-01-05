import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, retry, tap, map } from 'rxjs/operators';
import { ProgrammeEntrainement, CreerProgrammeRequest, ProgrammeEntrainementDTO, ProgressDTO, CompleteExerciceRequest, UpdateStatusRequest, ProgramStatus } from '../models/programme.model';
import { StorageService } from '../service/storage-service.service';

@Injectable({
  providedIn: 'root'
})
export class ProgrammeService {
  private apiUrl = 'http://localhost:8095/api/programmes';
  private programmesSubject = new BehaviorSubject<ProgrammeEntrainementDTO[]>([]);
  public programmes$ = this.programmesSubject.asObservable();

  constructor(private http: HttpClient, private storageService: StorageService) {}

  private getHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('ProgrammeService error:', error);
    return throwError(() => error);
  }

  // Enhanced CRUD operations
  creerProgramme(request: CreerProgrammeRequest): Observable<ProgrammeEntrainement> {
    return this.http.post<ProgrammeEntrainement>(this.apiUrl, request, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(() => this.refreshProgrammes()),
        catchError(this.handleError)
      );
  }

  getProgrammesCoach(): Observable<ProgrammeEntrainement[]> {
    return this.http.get<ProgrammeEntrainement[]>(`${this.apiUrl}/coach`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  getProgrammesClient(): Observable<ProgrammeEntrainement[]> {
    return this.http.get<ProgrammeEntrainement[]>(`${this.apiUrl}/client`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  getProgrammeById(id: number): Observable<ProgrammeEntrainement> {
    return this.http.get<ProgrammeEntrainement>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  modifierProgramme(id: number, request: CreerProgrammeRequest): Observable<ProgrammeEntrainement> {
    return this.http.put<ProgrammeEntrainement>(`${this.apiUrl}/${id}`, request, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(() => this.refreshProgrammes()),
        catchError(this.handleError)
      );
  }

  // Enhanced status update with optimistic updates
  changerStatut(id: number, statut: string): Observable<ProgrammeEntrainement> {
    // Optimistic update
    const currentProgrammes = this.programmesSubject.value;
    const updatedProgrammes = currentProgrammes.map(p => 
      p.id === id ? { ...p, statut: statut as ProgramStatus } : p
    );
    this.programmesSubject.next(updatedProgrammes);

    // CORRECTION: Utilise l'endpoint PATCH correct du backend
    return this.http.patch<ProgrammeEntrainement>(`${this.apiUrl}/${id}/statut`, { statut }, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError((error) => {
          // Revert optimistic update on error
          this.programmesSubject.next(currentProgrammes);
          return this.handleError(error);
        })
      );
  }

  // New method for updating status with proper DTO
  updateStatus(id: number, request: UpdateStatusRequest): Observable<ProgrammeEntrainementDTO> {
    return this.http.put<ProgrammeEntrainementDTO>(`${this.apiUrl}/${id}/status`, request, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(() => this.refreshProgrammes()),
        catchError(this.handleError)
      );
  }

  // NOUVELLES MÉTHODES POUR INTÉGRATION BACKEND COMPLÈTE
  updateProgramme(id: number, request: CreerProgrammeRequest): Observable<ProgrammeEntrainement> {
    // CORRECTION: Utilise l'endpoint correct du backend
    return this.http.put<ProgrammeEntrainement>(`${this.apiUrl}/${id}`, request, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(() => this.refreshProgrammes()),
        catchError(this.handleError)
      );
  }

  deleteProgramme(id: number): Observable<any> {
    // CORRECTION: Utilise l'endpoint correct du backend
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(() => this.refreshProgrammes()),
        catchError(this.handleError)
      );
  }

  supprimerProgramme(id: number): Observable<any> {
    // Utilise la nouvelle méthode deleteProgramme
    return this.deleteProgramme(id);
  }

  // Exercise completion tracking
  completeExercise(programmeId: number, exerciceIndex: number, request: CompleteExerciceRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/${programmeId}/exercices/${exerciceIndex}/complete`, request, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(() => this.refreshProgrammes()),
        catchError(this.handleError)
      );
  }

  // Progress tracking
  getProgramProgress(programmeId: number, clientId?: number): Observable<ProgressDTO> {
    const params = clientId ? `?clientId=${clientId}` : '';
    return this.http.get<ProgressDTO>(`${this.apiUrl}/${programmeId}/progress${params}`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // Get coach client progress
  getCoachClientProgress(coachId: number): Observable<ProgressDTO[]> {
    return this.http.get<ProgressDTO[]>(`${this.apiUrl}/coach/${coachId}/progress`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // Enhanced methods with DTO support
  getProgrammesWithProgress(): Observable<ProgrammeEntrainementDTO[]> {
    return this.http.get<ProgrammeEntrainementDTO[]>(`${this.apiUrl}/with-progress`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(programmes => this.programmesSubject.next(programmes)),
        catchError(this.handleError)
      );
  }

  // Utility methods
  private refreshProgrammes(): void {
    this.getProgrammesWithProgress().subscribe();
  }

  // Calculate progress percentage
  calculateProgressPercentage(completedExercises: number, totalExercises: number): number {
    if (totalExercises === 0) return 0;
    return Math.round((completedExercises / totalExercises) * 100);
  }

  // Check if programme is completed
  isProgrammeCompleted(programme: ProgrammeEntrainementDTO): boolean {
    return programme.completedExercises === programme.totalExercises;
  }

  // Get programmes by status
  getProgrammesByStatus(status: ProgramStatus): Observable<ProgrammeEntrainementDTO[]> {
    return this.programmes$.pipe(
      map(programmes => programmes.filter(p => p.statut === status))
    );
  }
}
