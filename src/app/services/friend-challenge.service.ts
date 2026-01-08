import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import {
  FriendChallenge,
  ChallengeParticipant,
  CreateFriendChallengeRequest,
  JoinChallengeRequest,
  UpdateProgressRequest,
  ChallengeLeaderboard,
  ChallengeProgress,
  ChallengeStats,
  ChallengeObjectiveType,
  ChallengeStatus,
  ChallengeTypeOption,
  ApiResponse
} from '../models/friend-challenge.model';
import { StorageService } from '../service/storage-service.service';
import { JwtService } from '../service/jwt.service';
import { ErrorHandlerService } from './error-handler.service';
import { FriendService } from './friend.service';

@Injectable({
  providedIn: 'root'
})
export class FriendChallengeService {
  private apiUrl = 'http://localhost:8095/api/friend-challenges';
  
  // State management
  private myChallengesSubject = new BehaviorSubject<FriendChallenge[]>([]);
  private activeChallengesSubject = new BehaviorSubject<FriendChallenge[]>([]);
  private createdChallengesSubject = new BehaviorSubject<FriendChallenge[]>([]);
  private leaderboardsSubject = new BehaviorSubject<{ [challengeId: number]: ChallengeLeaderboard }>({});
  private statsSubject = new BehaviorSubject<ChallengeStats | null>(null);
  
  public myChallenges$ = this.myChallengesSubject.asObservable();
  public activeChallenges$ = this.activeChallengesSubject.asObservable();
  public createdChallenges$ = this.createdChallengesSubject.asObservable();
  public leaderboards$ = this.leaderboardsSubject.asObservable();
  public stats$ = this.statsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private jwtService: JwtService,
    private errorHandler: ErrorHandlerService,
    private friendService: FriendService
  ) {
    this.loadInitialData();
  }

  private createAuthHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getCurrentUserId(): number {
    return this.jwtService.getUserId() || 1;
  }

  private loadInitialData(): void {
    if (this.jwtService.isTokenValid()) {
      this.loadMyChallenges();
      this.loadActiveChallenges();
      this.loadCreatedChallenges();
    }
  }

  /**
   * Helper to extract data from ApiResponse wrapper
   */
  private extractData<T>(response: ApiResponse<T> | T): T {
    if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
      return (response as ApiResponse<T>).data;
    }
    return response as T;
  }

  /**
   * Get unit for challenge objective type
   */
  getChallengeTypeUnit(type: ChallengeObjectiveType): string {
    const unitMap: Record<ChallengeObjectiveType, string> = {
      [ChallengeObjectiveType.STEPS]: 'pas',
      [ChallengeObjectiveType.CALORIES]: 'cal',
      [ChallengeObjectiveType.DISTANCE]: 'km',
      [ChallengeObjectiveType.WORKOUTS]: 'séances',
      [ChallengeObjectiveType.DURATION]: 'min'
    };
    return unitMap[type] || '';
  }

  /**
   * Get icon class for challenge objective type
   */
  getChallengeTypeIcon(type: ChallengeObjectiveType): string {
    const iconMap: Record<ChallengeObjectiveType, string> = {
      [ChallengeObjectiveType.STEPS]: 'fas fa-walking',
      [ChallengeObjectiveType.CALORIES]: 'fas fa-fire',
      [ChallengeObjectiveType.DISTANCE]: 'fas fa-route',
      [ChallengeObjectiveType.WORKOUTS]: 'fas fa-dumbbell',
      [ChallengeObjectiveType.DURATION]: 'fas fa-clock'
    };
    return iconMap[type] || 'fas fa-trophy';
  }

  /**
   * Get color for challenge objective type
   */
  getChallengeTypeColor(type: ChallengeObjectiveType): string {
    const colorMap: Record<ChallengeObjectiveType, string> = {
      [ChallengeObjectiveType.STEPS]: '#4CAF50',
      [ChallengeObjectiveType.CALORIES]: '#FF5722',
      [ChallengeObjectiveType.DISTANCE]: '#2196F3',
      [ChallengeObjectiveType.WORKOUTS]: '#9C27B0',
      [ChallengeObjectiveType.DURATION]: '#FF9800'
    };
    return colorMap[type] || '#607D8B';
  }

  /**
   * Get label for challenge status
   */
  getStatusLabel(status: ChallengeStatus): string {
    const labelMap: Record<ChallengeStatus, string> = {
      [ChallengeStatus.ACTIVE]: 'Actif',
      [ChallengeStatus.COMPLETED]: 'Terminé',
      [ChallengeStatus.CANCELLED]: 'Annulé'
    };
    return labelMap[status] || status;
  }

  /**
   * Get CSS class for status badge
   */
  getStatusBadgeClass(status: ChallengeStatus): string {
    const classMap: Record<ChallengeStatus, string> = {
      [ChallengeStatus.ACTIVE]: 'status-active',
      [ChallengeStatus.COMPLETED]: 'status-completed',
      [ChallengeStatus.CANCELLED]: 'status-cancelled'
    };
    return classMap[status] || '';
  }

  /**
   * Validate challenge dates (end must be after start)
   */
  validateChallengeDates(startDate: Date | string, endDate: Date | string): boolean {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return end > start;
  }

  /**
   * Calculate remaining days for a challenge
   */
  calculateRemainingDays(endDate: Date | string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Check if remaining days are urgent (<=2)
   */
  isUrgentRemainingDays(joursRestants: number): boolean {
    return joursRestants <= 2;
  }

  /**
   * Check if user is participant in a challenge
   */
  isUserParticipant(challenge: FriendChallenge): boolean {
    const userId = this.getCurrentUserId();
    if (challenge.participants) {
      return challenge.participants.some(p => p.userId === userId);
    }
    // Check in myChallenges
    return this.myChallengesSubject.value.some(c => c.id === challenge.id);
  }

  /**
   * Check if current user is the creator of a challenge
   */
  isUserCreator(challenge: FriendChallenge): boolean {
    return challenge.createurId === this.getCurrentUserId();
  }

  /**
   * Get current user ID (public accessor)
   */
  public getUserId(): number {
    return this.getCurrentUserId();
  }

  /**
   * Create a new friend challenge
   * Backend endpoint: POST /api/friend-challenges/create?createurId={id}
   */
  createChallenge(request: CreateFriendChallengeRequest): Observable<FriendChallenge> {
    const headers = this.createAuthHeaders();
    const userId = this.getCurrentUserId();
    
    return this.http.post<ApiResponse<FriendChallenge>>(`${this.apiUrl}/create?createurId=${userId}`, request, { headers })
      .pipe(
        map(response => response.data),
        tap(challenge => {
          // Add to created challenges
          const currentCreated = this.createdChallengesSubject.value;
          this.createdChallengesSubject.next([challenge, ...currentCreated]);
          
          // Add to my challenges
          const currentMy = this.myChallengesSubject.value;
          this.myChallengesSubject.next([challenge, ...currentMy]);
          
          // Refresh social feed to show the new CHALLENGE_JOINED activity
          this.friendService.refreshSocialFeed();
        }),
        catchError(error => {
          this.errorHandler.logError('createChallenge', error);
          // Return mock challenge for demo
          const mockChallenge = this.createMockChallenge(request);
          return of(mockChallenge);
        })
      );
  }

  /**
   * Join an existing challenge
   */
  joinChallenge(challengeId: number): Observable<boolean> {
    const headers = this.createAuthHeaders();
    const userId = this.getCurrentUserId();
    
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/${challengeId}/join?userId=${userId}`, {}, { headers })
      .pipe(
        map(response => response.success),
        tap(success => {
          if (success) {
            // Refresh challenges
            this.loadMyChallenges();
            this.loadActiveChallenges();
            // Refresh social feed to show the new CHALLENGE_JOINED activity
            this.friendService.refreshSocialFeed();
          }
        }),
        catchError(error => {
          this.errorHandler.logError('joinChallenge', error);
          return of(false);
        })
      );
  }

  /**
   * Load user's challenges
   */
  loadMyChallenges(): Observable<FriendChallenge[]> {
    const headers = this.createAuthHeaders();
    const userId = this.getCurrentUserId();
    
    return this.http.get<ApiResponse<FriendChallenge[]>>(`${this.apiUrl}/user/${userId}`, { headers })
      .pipe(
        map(response => response.data),
        tap(challenges => {
          this.myChallengesSubject.next(challenges);
        }),
        catchError(error => {
          this.errorHandler.logError('loadMyChallenges', error);
          const mockChallenges = this.getMockMyChallenges();
          this.myChallengesSubject.next(mockChallenges);
          return of(mockChallenges);
        })
      );
  }

  /**
   * Load active challenges
   */
  loadActiveChallenges(): Observable<FriendChallenge[]> {
    const headers = this.createAuthHeaders();
    
    return this.http.get<ApiResponse<FriendChallenge[]>>(`${this.apiUrl}/active`, { headers })
      .pipe(
        map(response => response.data),
        tap(challenges => {
          this.activeChallengesSubject.next(challenges);
        }),
        catchError(error => {
          this.errorHandler.logError('loadActiveChallenges', error);
          const mockChallenges = this.getMockActiveChallenges();
          this.activeChallengesSubject.next(mockChallenges);
          return of(mockChallenges);
        })
      );
  }

  /**
   * Load challenges created by user
   */
  loadCreatedChallenges(): Observable<FriendChallenge[]> {
    const headers = this.createAuthHeaders();
    const userId = this.getCurrentUserId();
    
    return this.http.get<ApiResponse<FriendChallenge[]>>(`${this.apiUrl}/created/${userId}`, { headers })
      .pipe(
        map(response => response.data),
        tap(challenges => {
          this.createdChallengesSubject.next(challenges);
        }),
        catchError(error => {
          this.errorHandler.logError('loadCreatedChallenges', error);
          const mockChallenges = this.getMockCreatedChallenges();
          this.createdChallengesSubject.next(mockChallenges);
          return of(mockChallenges);
        })
      );
  }

  /**
   * Get challenge details
   */
  getChallengeDetails(challengeId: number): Observable<FriendChallenge> {
    const headers = this.createAuthHeaders();
    
    return this.http.get<ApiResponse<FriendChallenge>>(`${this.apiUrl}/${challengeId}`, { headers })
      .pipe(
        map(response => response.data),
        catchError(error => {
          this.errorHandler.logError('getChallengeDetails', error);
          throw error;
        })
      );
  }

  /**
   * Get challenge leaderboard
   */
  getChallengeLeaderboard(challengeId: number): Observable<ChallengeLeaderboard> {
    const headers = this.createAuthHeaders();
    
    return this.http.get<ApiResponse<ChallengeLeaderboard>>(`${this.apiUrl}/${challengeId}/leaderboard`, { headers })
      .pipe(
        map(response => response.data),
        tap(leaderboard => {
          const currentLeaderboards = this.leaderboardsSubject.value;
          this.leaderboardsSubject.next({
            ...currentLeaderboards,
            [challengeId]: leaderboard
          });
        }),
        catchError(error => {
          this.errorHandler.logError('getChallengeLeaderboard', error);
          const mockLeaderboard = this.getMockLeaderboard(challengeId);
          return of(mockLeaderboard);
        })
      );
  }

  /**
   * Get user progress in challenge
   */
  getChallengeProgress(challengeId: number, userId?: number): Observable<ChallengeProgress> {
    const headers = this.createAuthHeaders();
    const targetUserId = userId || this.getCurrentUserId();
    
    return this.http.get<ApiResponse<ChallengeProgress>>(`${this.apiUrl}/${challengeId}/progress/${targetUserId}`, { headers })
      .pipe(
        map(response => response.data),
        catchError(error => {
          this.errorHandler.logError('getChallengeProgress', error);
          throw error;
        })
      );
  }

  /**
   * Update user progress in challenge
   * Backend endpoint: POST /api/friend-challenges/{challengeId}/progress?userId={id}&progress={val}
   */
  updateProgress(challengeId: number, request: UpdateProgressRequest): Observable<boolean> {
    const headers = this.createAuthHeaders();
    const userId = request.userId || this.getCurrentUserId();
    
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/${challengeId}/progress?userId=${userId}&progress=${request.progression}`, 
      {}, 
      { headers }
    )
      .pipe(
        map(response => response.success),
        tap(success => {
          if (success) {
            // Refresh leaderboard
            this.getChallengeLeaderboard(challengeId).subscribe(leaderboard => {
              // Check if user reached 100% completion
              const userProgress = leaderboard.participants.find(p => p.userId === userId);
              if (userProgress && userProgress.pourcentageCompletion >= 100) {
                // Refresh social feed to show CHALLENGE_COMPLETED activity
                this.friendService.refreshSocialFeed();
              }
            });
          }
        }),
        catchError(error => {
          this.errorHandler.logError('updateProgress', error);
          return of(false);
        })
      );
  }

  /**
   * Cancel a challenge (only creator can do this)
   */
  cancelChallenge(challengeId: number): Observable<boolean> {
    const headers = this.createAuthHeaders();
    const userId = this.getCurrentUserId();
    
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${challengeId}?userId=${userId}`, { headers })
      .pipe(
        map(response => response.success),
        tap(success => {
          if (success) {
            // Remove from all lists
            this.removeFromAllLists(challengeId);
          }
        }),
        catchError(error => {
          this.errorHandler.logError('cancelChallenge', error);
          return of(false);
        })
      );
  }

  /**
   * Get challenge type options for UI
   */
  getChallengeTypeOptions(): ChallengeTypeOption[] {
    return [
      {
        value: ChallengeObjectiveType.STEPS,
        label: 'Nombre de pas',
        icon: 'fas fa-walking',
        unit: 'pas',
        description: 'Comptez vos pas quotidiens',
        color: '#4CAF50'
      },
      {
        value: ChallengeObjectiveType.CALORIES,
        label: 'Calories brûlées',
        icon: 'fas fa-fire',
        unit: 'cal',
        description: 'Brûlez des calories',
        color: '#FF5722'
      },
      {
        value: ChallengeObjectiveType.DISTANCE,
        label: 'Distance parcourue',
        icon: 'fas fa-route',
        unit: 'km',
        description: 'Parcourez la distance',
        color: '#2196F3'
      },
      {
        value: ChallengeObjectiveType.WORKOUTS,
        label: 'Nombre d\'entraînements',
        icon: 'fas fa-dumbbell',
        unit: 'séances',
        description: 'Complétez vos entraînements',
        color: '#9C27B0'
      },
      {
        value: ChallengeObjectiveType.DURATION,
        label: 'Durée d\'activité',
        icon: 'fas fa-clock',
        unit: 'min',
        description: 'Temps d\'activité physique',
        color: '#FF9800'
      }
    ];
  }

  /**
   * Get leaderboard for specific challenge from cache
   */
  getLeaderboardFromCache(challengeId: number): ChallengeLeaderboard | null {
    const leaderboards = this.leaderboardsSubject.value;
    return leaderboards[challengeId] || null;
  }

  /**
   * Refresh all data
   */
  refreshAllData(): void {
    this.loadMyChallenges();
    this.loadActiveChallenges();
    this.loadCreatedChallenges();
  }

  // Mock data methods for demo mode
  private createMockChallenge(request: CreateFriendChallengeRequest): FriendChallenge {
    const userId = this.getCurrentUserId();
    return {
      id: Date.now(),
      nom: request.nom,
      description: request.description,
      typeObjectif: request.typeObjectif,
      valeurCible: request.valeurCible,
      dateDebut: new Date(request.dateDebut),
      dateFin: new Date(request.dateFin),
      createurId: userId,
      createurNom: 'Vous',
      statut: ChallengeStatus.ACTIVE,
      nombreParticipants: request.participantsIds.length + 1,
      isActive: true,
      joursRestants: Math.ceil((new Date(request.dateFin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      createdAt: new Date()
    };
  }

  private getMockMyChallenges(): FriendChallenge[] {
    const userId = this.getCurrentUserId();
    return [
      {
        id: 1,
        nom: 'Défi 10 000 Pas',
        description: 'Atteignons ensemble 10 000 pas par jour !',
        typeObjectif: ChallengeObjectiveType.STEPS,
        valeurCible: 70000,
        dateDebut: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        dateFin: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        createurId: 2,
        createurNom: 'Dr. Martin',
        statut: ChallengeStatus.ACTIVE,
        nombreParticipants: 4,
        isActive: true,
        joursRestants: 5,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        nom: 'Marathon Calories',
        description: 'Brûlons 5000 calories cette semaine !',
        typeObjectif: ChallengeObjectiveType.CALORIES,
        valeurCible: 5000,
        dateDebut: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        dateFin: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        createurId: userId,
        createurNom: 'Vous',
        statut: ChallengeStatus.ACTIVE,
        nombreParticipants: 3,
        isActive: true,
        joursRestants: 6,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  private getMockActiveChallenges(): FriendChallenge[] {
    return [
      {
        id: 3,
        nom: 'Course de 50km',
        description: 'Parcourons 50km en courant cette semaine',
        typeObjectif: ChallengeObjectiveType.DISTANCE,
        valeurCible: 50,
        dateDebut: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        dateFin: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        createurId: 3,
        createurNom: 'Sarah Johnson',
        statut: ChallengeStatus.ACTIVE,
        nombreParticipants: 6,
        isActive: true,
        joursRestants: 6,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: 4,
        nom: 'Défi Entraînements',
        description: '15 séances d\'entraînement en 2 semaines',
        typeObjectif: ChallengeObjectiveType.WORKOUTS,
        valeurCible: 15,
        dateDebut: new Date(),
        dateFin: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        createurId: 4,
        createurNom: 'Mike Thompson',
        statut: ChallengeStatus.ACTIVE,
        nombreParticipants: 8,
        isActive: true,
        joursRestants: 14,
        createdAt: new Date()
      }
    ];
  }

  private getMockCreatedChallenges(): FriendChallenge[] {
    const userId = this.getCurrentUserId();
    return [
      {
        id: 2,
        nom: 'Marathon Calories',
        description: 'Brûlons 5000 calories cette semaine !',
        typeObjectif: ChallengeObjectiveType.CALORIES,
        valeurCible: 5000,
        dateDebut: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        dateFin: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        createurId: userId,
        createurNom: 'Vous',
        statut: ChallengeStatus.ACTIVE,
        nombreParticipants: 3,
        isActive: true,
        joursRestants: 6,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];
  }

  private getMockLeaderboard(challengeId: number): ChallengeLeaderboard {
    const userId = this.getCurrentUserId();
    return {
      challengeId,
      challengeNom: 'Défi 10 000 Pas',
      participants: [
        {
          id: 1,
          challengeId,
          userId: 2,
          userName: 'Dr. Martin',
          progression: 45000,
          pourcentageCompletion: 64.3,
          position: 1,
          dateInscription: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          isCompleted: false,
          lastActivityDate: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: 2,
          challengeId,
          userId,
          userName: 'Vous',
          progression: 38000,
          pourcentageCompletion: 54.3,
          position: 2,
          dateInscription: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          isCompleted: false,
          lastActivityDate: new Date(Date.now() - 1 * 60 * 60 * 1000)
        },
        {
          id: 3,
          challengeId,
          userId: 3,
          userName: 'Sarah Johnson',
          progression: 32000,
          pourcentageCompletion: 45.7,
          position: 3,
          dateInscription: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          isCompleted: false,
          lastActivityDate: new Date(Date.now() - 3 * 60 * 60 * 1000)
        }
      ],
      totalParticipants: 3,
      isCompleted: false,
      dateGeneration: new Date()
    };
  }

  private removeFromAllLists(challengeId: number): void {
    // Remove from my challenges
    const currentMy = this.myChallengesSubject.value;
    this.myChallengesSubject.next(currentMy.filter(c => c.id !== challengeId));
    
    // Remove from active challenges
    const currentActive = this.activeChallengesSubject.value;
    this.activeChallengesSubject.next(currentActive.filter(c => c.id !== challengeId));
    
    // Remove from created challenges
    const currentCreated = this.createdChallengesSubject.value;
    this.createdChallengesSubject.next(currentCreated.filter(c => c.id !== challengeId));
    
    // Remove from leaderboards
    const currentLeaderboards = this.leaderboardsSubject.value;
    delete currentLeaderboards[challengeId];
    this.leaderboardsSubject.next({ ...currentLeaderboards });
  }
}