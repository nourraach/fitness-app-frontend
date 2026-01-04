import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, retry, tap, map } from 'rxjs/operators';
import { 
  DefiDTO, 
  ParticipantDefiDTO, 
  ClassementDefiDTO, 
  CreerDefiRequest, 
  UpdateProgressionRequest,
  TypeObjectif,
  StatutDefi,
  StatutParticipation 
} from '../models/defi.model';
import { StorageService } from '../service/storage-service.service';

@Injectable({
  providedIn: 'root'
})
export class DefiService {
  private apiUrl = 'http://localhost:8095/api/defis';
  private defisSubject = new BehaviorSubject<DefiDTO[]>([]);
  public defis$ = this.defisSubject.asObservable();

  constructor(private http: HttpClient, private storageService: StorageService) {}

  private getHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('DefiService error:', error);
    return throwError(() => error);
  }

  // Challenge creation, participation, and progress tracking
  creerDefi(request: CreerDefiRequest): Observable<DefiDTO> {
    return this.http.post<DefiDTO>(this.apiUrl, request, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(() => this.refreshDefis()),
        catchError(this.handleError)
      );
  }

  // Get all available challenges
  getDefisDisponibles(): Observable<DefiDTO[]> {
    return this.http.get<DefiDTO[]>(`${this.apiUrl}/disponibles`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // Get user's active challenges
  getDefisActifs(): Observable<DefiDTO[]> {
    return this.http.get<DefiDTO[]>(`${this.apiUrl}/actifs`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(defis => this.defisSubject.next(defis)),
        catchError(this.handleError)
      );
  }

  // Get user's completed challenges
  getDefisTermines(): Observable<DefiDTO[]> {
    return this.http.get<DefiDTO[]>(`${this.apiUrl}/termines`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // Get challenge by ID
  getDefiById(id: number): Observable<DefiDTO> {
    return this.http.get<DefiDTO>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // Join a challenge
  rejoindreDefi(defiId: number): Observable<ParticipantDefiDTO> {
    return this.http.post<ParticipantDefiDTO>(`${this.apiUrl}/${defiId}/rejoindre`, {}, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(() => this.refreshDefis()),
        catchError(this.handleError)
      );
  }

  // Leave a challenge
  quitterDefi(defiId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${defiId}/quitter`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(() => this.refreshDefis()),
        catchError(this.handleError)
      );
  }

  // Update user progress in a challenge
  updateProgression(defiId: number, request: UpdateProgressionRequest): Observable<ParticipantDefiDTO> {
    return this.http.put<ParticipantDefiDTO>(`${this.apiUrl}/${defiId}/progression`, request, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(() => this.refreshDefis()),
        catchError(this.handleError)
      );
  }

  // Leaderboard management and ranking calculations
  getClassement(defiId: number): Observable<ClassementDefiDTO> {
    return this.http.get<ClassementDefiDTO>(`${this.apiUrl}/${defiId}/classement`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // Get all leaderboards for user's active challenges
  getClassementsActifs(): Observable<ClassementDefiDTO[]> {
    return this.http.get<ClassementDefiDTO[]>(`${this.apiUrl}/classements/actifs`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // Integration with activity tracking systems
  synchroniserProgression(defiId: number): Observable<ParticipantDefiDTO> {
    return this.http.post<ParticipantDefiDTO>(`${this.apiUrl}/${defiId}/synchroniser`, {}, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(() => this.refreshDefis()),
        catchError(this.handleError)
      );
  }

  // Get challenges by type
  getDefisByType(typeObjectif: TypeObjectif): Observable<DefiDTO[]> {
    const params = new HttpParams().set('type', typeObjectif);
    return this.http.get<DefiDTO[]>(`${this.apiUrl}/type`, { params, headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // Get challenges by status
  getDefisByStatut(statut: StatutDefi): Observable<DefiDTO[]> {
    const params = new HttpParams().set('statut', statut);
    return this.http.get<DefiDTO[]>(`${this.apiUrl}/statut`, { params, headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // Search challenges
  rechercherDefis(query: string): Observable<DefiDTO[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<DefiDTO[]>(`${this.apiUrl}/recherche`, { params, headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // Invite friends to challenge
  inviterAmis(defiId: number, utilisateursIds: number[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${defiId}/inviter`, { utilisateursIds }, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // Get user's friends for invitation
  getAmisDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/amis/disponibles`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // Utility methods
  private refreshDefis(): void {
    this.getDefisActifs().subscribe();
  }

  // Calculate progress percentage
  calculateProgressPercentage(progressionActuelle: number, valeurCible: number): number {
    if (valeurCible === 0) return 0;
    return Math.min(Math.round((progressionActuelle / valeurCible) * 100), 100);
  }

  // Check if challenge is completed for user
  isDefiCompleted(participant: ParticipantDefiDTO, valeurCible: number): boolean {
    return participant.progressionActuelle >= valeurCible;
  }

  // Get challenge status display text
  getStatutDisplay(statut: string): string {
    switch (statut) {
      case StatutDefi.EN_COURS:
        return 'En cours';
      case StatutDefi.TERMINE:
        return 'Terminé';
      case StatutDefi.ANNULE:
        return 'Annulé';
      default:
        return statut;
    }
  }

  // Get objective type display text
  getTypeObjectifDisplay(type: string): string {
    switch (type) {
      case TypeObjectif.CALORIES_BRULEES:
        return 'Calories brûlées';
      case TypeObjectif.DUREE_ACTIVITE:
        return 'Durée d\'activité';
      case TypeObjectif.POIDS:
        return 'Poids';
      case TypeObjectif.PAS:
        return 'Nombre de pas';
      case TypeObjectif.DISTANCE:
        return 'Distance';
      default:
        return type;
    }
  }

  // Get objective unit
  getObjectifUnit(type: string): string {
    switch (type) {
      case TypeObjectif.CALORIES_BRULEES:
        return 'kcal';
      case TypeObjectif.DUREE_ACTIVITE:
        return 'min';
      case TypeObjectif.POIDS:
        return 'kg';
      case TypeObjectif.PAS:
        return 'pas';
      case TypeObjectif.DISTANCE:
        return 'km';
      default:
        return '';
    }
  }

  // Format progress display
  formatProgress(progression: number, type: string): string {
    const unit = this.getObjectifUnit(type);
    if (type === TypeObjectif.DISTANCE) {
      return `${(progression / 1000).toFixed(1)} ${unit}`;
    }
    return `${Math.round(progression)} ${unit}`;
  }

  // Check if user can join challenge
  canJoinChallenge(defi: DefiDTO, userId: number): boolean {
    const isParticipant = defi.participants.some(p => p.utilisateurId === userId);
    const isActive = defi.statut === StatutDefi.EN_COURS;
    const isNotFull = defi.participants.length < 10; // Assuming max 10 participants
    
    return !isParticipant && isActive && isNotFull;
  }

  // Get user's rank in challenge
  getUserRank(defi: DefiDTO, userId: number): number | null {
    const participant = defi.participants.find(p => p.utilisateurId === userId);
    return participant?.classement || null;
  }

  // Sort participants by progress for leaderboard
  sortParticipantsByProgress(participants: ParticipantDefiDTO[]): ParticipantDefiDTO[] {
    return [...participants].sort((a, b) => b.progressionActuelle - a.progressionActuelle);
  }

  // Get challenge duration in days
  getChallengeDuration(dateDebut: Date, dateFin: Date): number {
    const diffTime = Math.abs(dateFin.getTime() - dateDebut.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // Check if challenge is ending soon (within 24 hours)
  isEndingSoon(dateFin: Date): boolean {
    const now = new Date();
    const timeUntilEnd = dateFin.getTime() - now.getTime();
    return timeUntilEnd > 0 && timeUntilEnd <= (24 * 60 * 60 * 1000);
  }

  // Get challenges filtered by participation status
  getChallengesByParticipation(): Observable<{
    participating: DefiDTO[],
    available: DefiDTO[],
    completed: DefiDTO[]
  }> {
    return this.defis$.pipe(
      map(defis => ({
        participating: defis.filter(d => d.statut === StatutDefi.EN_COURS),
        available: [], // This would be populated by getDefisDisponibles()
        completed: defis.filter(d => d.statut === StatutDefi.TERMINE)
      }))
    );
  }
}