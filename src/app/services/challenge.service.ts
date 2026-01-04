import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { 
  Challenge, 
  ChallengeParticipant, 
  ChallengeInvitation, 
  ChallengeProgress,
  ChallengeLeaderboard,
  CreateChallengeRequest,
  ChallengeType,
  ChallengeStatus,
  ParticipantStatus
} from '../models/challenge.model';

@Injectable({
  providedIn: 'root'
})
export class ChallengeService {
  private apiUrl = 'http://localhost:8095/api';
  private currentUserId = 1; // Mock current user ID
  
  // State management
  private challengesSubject = new BehaviorSubject<Challenge[]>([]);
  private myChallengesSubject = new BehaviorSubject<Challenge[]>([]);
  private invitationsSubject = new BehaviorSubject<ChallengeInvitation[]>([]);
  private leaderboardsSubject = new BehaviorSubject<Map<number, ChallengeLeaderboard>>(new Map());
  
  public challenges$ = this.challengesSubject.asObservable();
  public myChallenges$ = this.myChallengesSubject.asObservable();
  public invitations$ = this.invitationsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadMockData();
  }

  // Create new challenge
  createChallenge(request: CreateChallengeRequest): Observable<Challenge> {
    // In real app: return this.http.post<Challenge>(`${this.apiUrl}/challenges`, request);
    
    const newChallenge: Challenge = {
      id: Date.now(),
      creatorId: this.currentUserId,
      title: request.title,
      description: request.description,
      type: request.type,
      targetValue: request.targetValue,
      unit: this.getUnitForType(request.type),
      startDate: request.startDate,
      endDate: request.endDate,
      status: ChallengeStatus.ACTIVE,
      isPublic: request.isPublic,
      maxParticipants: request.maxParticipants,
      createdAt: new Date(),
      creatorInfo: this.getCurrentUser(),
      participantCount: 1, // Creator is automatically a participant
      completedCount: 0
    };

    // Add to challenges list
    const currentChallenges = this.challengesSubject.value;
    this.challengesSubject.next([newChallenge, ...currentChallenges]);

    const currentMyChallenges = this.myChallengesSubject.value;
    this.myChallengesSubject.next([newChallenge, ...currentMyChallenges]);

    // Send invitations to friends
    request.invitedFriends.forEach(friendId => {
      this.sendChallengeInvitation(newChallenge.id, friendId);
    });

    return of(newChallenge);
  }

  // Get available challenges
  getAvailableChallenges(): Observable<Challenge[]> {
    // In real app: return this.http.get<Challenge[]>(`${this.apiUrl}/challenges/available`);
    return this.challenges$;
  }

  // Get my challenges (created or participating)
  getMyChallenges(): Observable<Challenge[]> {
    // In real app: return this.http.get<Challenge[]>(`${this.apiUrl}/challenges/my`);
    return this.myChallenges$;
  }

  // Get challenge invitations
  getChallengeInvitations(): Observable<ChallengeInvitation[]> {
    // In real app: return this.http.get<ChallengeInvitation[]>(`${this.apiUrl}/challenges/invitations`);
    return this.invitations$;
  }

  // Send challenge invitation
  sendChallengeInvitation(challengeId: number, userId: number): Observable<boolean> {
    // In real app: return this.http.post<boolean>(`${this.apiUrl}/challenges/${challengeId}/invite`, { userId });
    
    const challenge = this.challengesSubject.value.find(c => c.id === challengeId);
    if (!challenge) return of(false);

    const invitation: ChallengeInvitation = {
      id: Date.now() + userId, // Simple ID generation
      challengeId,
      inviterId: this.currentUserId,
      inviteeId: userId,
      status: 'PENDING',
      createdAt: new Date(),
      challengeInfo: challenge,
      inviterInfo: this.getCurrentUser()
    };

    // Add to invitations (simulate sending to the user)
    const currentInvitations = this.invitationsSubject.value;
    this.invitationsSubject.next([invitation, ...currentInvitations]);

    return of(true);
  }

  // Accept challenge invitation
  acceptChallengeInvitation(invitationId: number): Observable<boolean> {
    // In real app: return this.http.put<boolean>(`${this.apiUrl}/challenges/invitations/${invitationId}/accept`, {});
    
    const invitations = this.invitationsSubject.value;
    const invitation = invitations.find(i => i.id === invitationId);
    
    if (invitation) {
      invitation.status = 'ACCEPTED';
      this.invitationsSubject.next([...invitations]);

      // Add challenge to my challenges
      const myChallenges = this.myChallengesSubject.value;
      if (!myChallenges.find(c => c.id === invitation.challengeId)) {
        this.myChallengesSubject.next([invitation.challengeInfo, ...myChallenges]);
      }

      // Update participant count
      const challenges = this.challengesSubject.value;
      const challenge = challenges.find(c => c.id === invitation.challengeId);
      if (challenge) {
        challenge.participantCount++;
        this.challengesSubject.next([...challenges]);
      }
    }

    return of(true);
  }

  // Decline challenge invitation
  declineChallengeInvitation(invitationId: number): Observable<boolean> {
    // In real app: return this.http.put<boolean>(`${this.apiUrl}/challenges/invitations/${invitationId}/decline`, {});
    
    const invitations = this.invitationsSubject.value;
    const invitation = invitations.find(i => i.id === invitationId);
    
    if (invitation) {
      invitation.status = 'DECLINED';
      this.invitationsSubject.next([...invitations]);
    }

    return of(true);
  }

  // Join public challenge
  joinChallenge(challengeId: number): Observable<boolean> {
    // In real app: return this.http.post<boolean>(`${this.apiUrl}/challenges/${challengeId}/join`, {});
    
    const challenges = this.challengesSubject.value;
    const challenge = challenges.find(c => c.id === challengeId);
    
    if (challenge && challenge.isPublic) {
      // Add to my challenges
      const myChallenges = this.myChallengesSubject.value;
      if (!myChallenges.find(c => c.id === challengeId)) {
        this.myChallengesSubject.next([challenge, ...myChallenges]);
      }

      // Update participant count
      challenge.participantCount++;
      this.challengesSubject.next([...challenges]);
    }

    return of(true);
  }

  // Leave challenge
  leaveChallenge(challengeId: number): Observable<boolean> {
    // In real app: return this.http.delete<boolean>(`${this.apiUrl}/challenges/${challengeId}/leave`);
    
    const myChallenges = this.myChallengesSubject.value;
    const updatedMyChallenges = myChallenges.filter(c => c.id !== challengeId);
    this.myChallengesSubject.next(updatedMyChallenges);

    // Update participant count
    const challenges = this.challengesSubject.value;
    const challenge = challenges.find(c => c.id === challengeId);
    if (challenge) {
      challenge.participantCount--;
      this.challengesSubject.next([...challenges]);
    }

    return of(true);
  }

  // Get challenge leaderboard
  getChallengeLeaderboard(challengeId: number): Observable<ChallengeLeaderboard> {
    // In real app: return this.http.get<ChallengeLeaderboard>(`${this.apiUrl}/challenges/${challengeId}/leaderboard`);
    
    const leaderboards = this.leaderboardsSubject.value;
    let leaderboard = leaderboards.get(challengeId);
    
    if (!leaderboard) {
      // Generate mock leaderboard
      leaderboard = this.generateMockLeaderboard(challengeId);
      leaderboards.set(challengeId, leaderboard);
      this.leaderboardsSubject.next(leaderboards);
    }

    return of(leaderboard);
  }

  // Update challenge progress
  updateChallengeProgress(challengeId: number, progress: number): Observable<boolean> {
    // In real app: return this.http.put<boolean>(`${this.apiUrl}/challenges/${challengeId}/progress`, { progress });
    
    const leaderboards = this.leaderboardsSubject.value;
    const leaderboard = leaderboards.get(challengeId);
    
    if (leaderboard) {
      const participant = leaderboard.participants.find(p => p.userId === this.currentUserId);
      if (participant) {
        participant.currentValue = progress;
        participant.progressPercentage = Math.min((progress / participant.targetValue) * 100, 100);
        participant.isCompleted = progress >= participant.targetValue;
        
        // Recalculate ranks
        leaderboard.participants.sort((a, b) => b.currentValue - a.currentValue);
        leaderboard.participants.forEach((p, index) => {
          p.rank = index + 1;
        });
        
        leaderboard.lastUpdated = new Date();
        leaderboards.set(challengeId, leaderboard);
        this.leaderboardsSubject.next(leaderboards);
      }
    }

    return of(true);
  }

  // Get challenge types with descriptions
  getChallengeTypes(): { type: ChallengeType; label: string; description: string; unit: string }[] {
    return [
      {
        type: ChallengeType.STEPS,
        label: 'Pas',
        description: 'Défi basé sur le nombre de pas',
        unit: 'pas'
      },
      {
        type: ChallengeType.CALORIES,
        label: 'Calories',
        description: 'Défi basé sur les calories brûlées',
        unit: 'cal'
      },
      {
        type: ChallengeType.WORKOUTS,
        label: 'Entraînements',
        description: 'Défi basé sur le nombre d\'entraînements',
        unit: 'séances'
      },
      {
        type: ChallengeType.DURATION,
        label: 'Durée',
        description: 'Défi basé sur la durée d\'exercice',
        unit: 'minutes'
      },
      {
        type: ChallengeType.DISTANCE,
        label: 'Distance',
        description: 'Défi basé sur la distance parcourue',
        unit: 'km'
      }
    ];
  }

  // Private helper methods
  private loadMockData(): void {
    const mockChallenges: Challenge[] = [
      {
        id: 1,
        creatorId: 2,
        title: 'Défi 10 000 pas',
        description: 'Atteignons 10 000 pas par jour pendant une semaine !',
        type: ChallengeType.STEPS,
        targetValue: 70000,
        unit: 'pas',
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: ChallengeStatus.ACTIVE,
        isPublic: true,
        maxParticipants: 10,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        creatorInfo: {
          id: 2,
          nom: 'Sarah Johnson',
          email: 'sarah@email.com'
        },
        participantCount: 3,
        completedCount: 0
      },
      {
        id: 2,
        creatorId: 4,
        title: 'Brûlons 3000 calories',
        description: 'Défi de 2 semaines pour brûler 3000 calories',
        type: ChallengeType.CALORIES,
        targetValue: 3000,
        unit: 'cal',
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
        status: ChallengeStatus.ACTIVE,
        isPublic: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        creatorInfo: {
          id: 4,
          nom: 'Emma Wilson',
          email: 'emma@email.com'
        },
        participantCount: 2,
        completedCount: 0
      }
    ];

    const mockInvitations: ChallengeInvitation[] = [
      {
        id: 1,
        challengeId: 2,
        inviterId: 4,
        inviteeId: this.currentUserId,
        status: 'PENDING',
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
        challengeInfo: mockChallenges[1],
        inviterInfo: {
          id: 4,
          nom: 'Emma Wilson',
          email: 'emma@email.com'
        }
      }
    ];

    this.challengesSubject.next(mockChallenges);
    this.myChallengesSubject.next([mockChallenges[0]]); // User is participating in first challenge
    this.invitationsSubject.next(mockInvitations);
  }

  private getCurrentUser(): any {
    return {
      id: this.currentUserId,
      nom: 'Vous',
      email: 'current.user@email.com'
    };
  }

  private getUnitForType(type: ChallengeType): string {
    const types = this.getChallengeTypes();
    return types.find(t => t.type === type)?.unit || '';
  }

  private generateMockLeaderboard(challengeId: number): ChallengeLeaderboard {
    const challenge = this.challengesSubject.value.find(c => c.id === challengeId);
    if (!challenge) {
      return {
        challengeId,
        participants: [],
        lastUpdated: new Date()
      };
    }

    const mockParticipants: ChallengeProgress[] = [
      {
        participantId: 1,
        userId: this.currentUserId,
        challengeId,
        currentValue: Math.floor(challenge.targetValue * 0.6),
        targetValue: challenge.targetValue,
        progressPercentage: 60,
        rank: 2,
        isCompleted: false,
        userInfo: this.getCurrentUser()
      },
      {
        participantId: 2,
        userId: challenge.creatorId,
        challengeId,
        currentValue: Math.floor(challenge.targetValue * 0.8),
        targetValue: challenge.targetValue,
        progressPercentage: 80,
        rank: 1,
        isCompleted: false,
        userInfo: challenge.creatorInfo
      }
    ];

    return {
      challengeId,
      participants: mockParticipants,
      lastUpdated: new Date()
    };
  }
}