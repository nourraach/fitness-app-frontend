import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  User, 
  FriendRequest, 
  Friendship, 
  UserSearchResult, 
  FriendshipStatus,
  FriendRequestStatus,
  SocialActivity,
  mapBackendActivityType
} from '../models/friend.model';
import { StorageService } from '../service/storage-service.service';
import { JwtService } from '../service/jwt.service';
import { ErrorHandlerService } from './error-handler.service';

// Interfaces pour les réponses API
export interface FriendRequestItem {
  id: number;
  senderId: number;
  receiverId: number;
  status: string;
  createdAt: string;
}

export interface SentRequestsResponse {
  requests: FriendRequestItem[];
  count: number;
}

export interface PendingRequestsResponse {
  requests: FriendRequestItem[];
  count: number;
}

export interface FriendItem {
  id: number;
  nom: string;
  email: string;
  photo?: string;
}

export interface FriendsResponse {
  friends: FriendItem[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class FriendService {
  private apiUrl = 'http://localhost:8095/api';
  
  // State management
  private friendsSubject = new BehaviorSubject<User[]>([]);
  private friendRequestsSubject = new BehaviorSubject<FriendRequest[]>([]);
  private socialFeedSubject = new BehaviorSubject<SocialActivity[]>([]);
  
  public friends$ = this.friendsSubject.asObservable();
  public friendRequests$ = this.friendRequestsSubject.asObservable();
  public socialFeed$ = this.socialFeedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private jwtService: JwtService,
    private errorHandler: ErrorHandlerService
  ) {
    this.loadInitialData();
  }

  // Create HTTP headers with JWT token
  private createAuthHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get current user ID from JWT
  private getCurrentUserId(): number {
    return this.jwtService.getUserId() || 1;
  }

  // Load initial data from backend
  private loadInitialData(): void {
    if (this.jwtService.isTokenValid()) {
      this.loadFriends();
      this.loadFriendRequests();
      this.loadSocialFeed();
    }
  }

  // Load friends from backend
  private loadFriends(): void {
    const headers = this.createAuthHeaders();
    const currentUserId = this.getCurrentUserId();
    console.log('=== LOADING FRIENDS ===');
    console.log('Current User ID from JWT:', currentUserId);
    console.log('API URL:', `${this.apiUrl}/friends`);
    console.log('Token present:', !!this.storageService.getItem('jwt'));
    this.http.get<any>(`${this.apiUrl}/friends`, { headers })
      .pipe(
        map(response => {
          console.log('Friends API raw response:', JSON.stringify(response));
          // Handle wrapped response (e.g., { content: [...] } or { friends: [...] })
          let friends: any[] = [];
          if (Array.isArray(response)) {
            friends = response;
          } else if (response?.content && Array.isArray(response.content)) {
            friends = response.content;
          } else if (response?.friends && Array.isArray(response.friends)) {
            friends = response.friends;
          } else if (response?.data && Array.isArray(response.data)) {
            friends = response.data;
          }
          
          console.log('Friends array before mapping:', friends);
          
          // Mapper les données du backend vers le modèle frontend
          // Le backend peut renvoyer: friendId/id, friendName/nom/name, friendEmail/email
          return friends.map((f: any) => {
            // Récupérer l'email d'abord
            const email = f.friendEmail || f.email || f.userEmail || '';
            // Utiliser le nom, sinon l'email (partie avant @), sinon 'Utilisateur'
            const rawName = f.friendName || f.nom || f.name || f.userName || f.username || '';
            const displayName = rawName || (email ? email.split('@')[0] : '') || 'Utilisateur';
            
            const mapped = {
              id: f.friendId || f.id || f.userId,
              nom: displayName,
              email: email,
              photo: f.friendPhoto || f.photo || f.avatar,
              isOnline: f.isOnline || f.online || false,
              lastSeen: f.lastSeen ? new Date(f.lastSeen) : undefined,
              totalWorkouts: f.totalWorkouts || f.activitesCount || f.workoutsCount || 0,
              totalCalories: f.totalCalories || f.caloriesTotal || 0,
              joinDate: f.joinDate || f.createdAt ? new Date(f.joinDate || f.createdAt) : new Date(),
              isPublic: f.isPublic !== false
            };
            console.log('Mapped friend:', mapped, 'from raw:', f);
            return mapped;
          });
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des amis:', error);
          return of([]);
        })
      )
      .subscribe(friends => {
        console.log('=== FRIENDS LOADED ===');
        console.log('Total friends:', friends.length);
        console.log('Friends data:', friends);
        this.friendsSubject.next(friends);
      });
  }

  // Load friend requests from backend - Charge les demandes REÇUES (pending)
  private loadFriendRequests(): void {
    const headers = this.createAuthHeaders();
    // Utiliser /friends/requests/received pour obtenir uniquement les demandes reçues en attente
    this.http.get<any>(`${this.apiUrl}/friends/requests/received`, { headers })
      .pipe(
        map(response => {
          // Handle wrapped response
          let requests: any[] = [];
          if (Array.isArray(response)) {
            requests = response;
          } else if (response?.content && Array.isArray(response.content)) {
            requests = response.content;
          } else if (response?.requests && Array.isArray(response.requests)) {
            requests = response.requests;
          } else if (response?.data && Array.isArray(response.data)) {
            requests = response.data;
          }
          
          // Mapper les champs du backend vers le modèle frontend
          return requests.map((r: any) => ({
            id: r.id,
            senderId: r.senderId,
            receiverId: r.receiverId,
            status: r.status,
            createdAt: r.createdAt,
            updatedAt: r.respondedAt,
            senderInfo: {
              id: r.senderId,
              nom: r.senderName || 'Utilisateur',
              email: r.senderEmail || '',
              photo: r.senderPhoto,
              isOnline: false,
              totalWorkouts: 0,
              totalCalories: 0,
              joinDate: new Date(),
              isPublic: true
            },
            receiverInfo: {
              id: r.receiverId,
              nom: r.receiverName || 'Utilisateur',
              email: r.receiverEmail || '',
              photo: r.receiverPhoto,
              isOnline: false,
              totalWorkouts: 0,
              totalCalories: 0,
              joinDate: new Date(),
              isPublic: true
            }
          }));
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des demandes d\'amitié reçues:', error);
          return of([]);
        })
      )
      .subscribe(requests => {
        console.log('Demandes d\'amitié reçues mappées:', requests);
        this.friendRequestsSubject.next(requests);
      });
  }

  // Load social feed from backend
  private loadSocialFeed(): void {
    const headers = this.createAuthHeaders();
    this.http.get<any>(`${this.apiUrl}/social/feed`, { headers })
      .pipe(
        map(response => {
          // Handle wrapped response
          let activities: any[] = [];
          if (Array.isArray(response) && response.length > 0) activities = response;
          else if (response?.content && Array.isArray(response.content) && response.content.length > 0) activities = response.content;
          else if (response?.activities && Array.isArray(response.activities) && response.activities.length > 0) activities = response.activities;
          else if (response?.feed && Array.isArray(response.feed) && response.feed.length > 0) activities = response.feed;
          else if (response?.data && Array.isArray(response.data) && response.data.length > 0) activities = response.data;
          
          if (activities.length === 0) {
            // Si pas de données de l'API, générer des activités mock variées
            return this.generateMockActivities();
          }
          
          // Map backend activity types to frontend types
          return activities.map((activity: any) => ({
            ...activity,
            type: activity.activityType ? mapBackendActivityType(activity.activityType) : activity.type,
            relatedEntityId: activity.relatedEntityId,
            relatedEntityType: activity.relatedEntityType
          }));
        }),
        catchError(error => {
          console.error('Erreur lors du chargement du fil social:', error);
          // En cas d'erreur, retourner des activités mock
          return of(this.generateMockActivities());
        })
      )
      .subscribe(activities => {
        console.log('Social feed loaded:', activities.length, 'activities');
        this.socialFeedSubject.next(activities);
      });
  }

  // Générer des activités mock variées
  private generateMockActivities(): any[] {
    const users = [
      { id: 1, nom: 'Sophie Martin', email: 'sophie@email.com', isOnline: true, totalWorkouts: 45, totalCalories: 12500, joinDate: new Date('2024-01-15'), isPublic: true },
      { id: 2, nom: 'Lucas Dubois', email: 'lucas@email.com', isOnline: false, totalWorkouts: 32, totalCalories: 8900, joinDate: new Date('2024-02-20'), isPublic: true },
      { id: 3, nom: 'Emma Bernard', email: 'emma@email.com', isOnline: true, totalWorkouts: 67, totalCalories: 18200, joinDate: new Date('2023-11-10'), isPublic: true },
      { id: 4, nom: 'Thomas Petit', email: 'thomas@email.com', isOnline: false, totalWorkouts: 28, totalCalories: 7600, joinDate: new Date('2024-03-05'), isPublic: true },
      { id: 5, nom: 'Léa Moreau', email: 'lea@email.com', isOnline: true, totalWorkouts: 53, totalCalories: 14800, joinDate: new Date('2024-01-28'), isPublic: true },
      { id: 6, nom: 'Hugo Laurent', email: 'hugo@email.com', isOnline: false, totalWorkouts: 41, totalCalories: 11200, joinDate: new Date('2024-02-14'), isPublic: true },
      { id: 7, nom: 'Chloé Garcia', email: 'chloe@email.com', isOnline: true, totalWorkouts: 38, totalCalories: 10500, joinDate: new Date('2024-03-01'), isPublic: true },
      { id: 8, nom: 'Nathan Roux', email: 'nathan@email.com', isOnline: false, totalWorkouts: 59, totalCalories: 16100, joinDate: new Date('2023-12-20'), isPublic: true }
    ];

    const workoutTypes = [
      { title: 'Séance de musculation', desc: 'Entraînement intense du haut du corps - 45 min, 320 cal brûlées' },
      { title: 'Course à pied', desc: 'Jogging matinal de 5km - 35 min, 280 cal brûlées' },
      { title: 'Séance HIIT', desc: 'Entraînement haute intensité - 30 min, 400 cal brûlées' },
      { title: 'Yoga et stretching', desc: 'Séance de relaxation et flexibilité - 50 min, 150 cal brûlées' },
      { title: 'Natation', desc: 'Séance de natation en piscine - 40 min, 350 cal brûlées' },
      { title: 'Cyclisme', desc: 'Sortie vélo en plein air - 60 min, 450 cal brûlées' },
      { title: 'CrossFit', desc: 'WOD du jour intense - 25 min, 380 cal brûlées' },
      { title: 'Boxe', desc: 'Entraînement de boxe cardio - 45 min, 420 cal brûlées' },
      { title: 'Pilates', desc: 'Renforcement musculaire profond - 40 min, 180 cal brûlées' },
      { title: 'Escalade', desc: 'Session d\'escalade en salle - 55 min, 340 cal brûlées' }
    ];

    const achievements = [
      { title: '🏆 Premier 10km!', desc: 'A couru ses premiers 10 kilomètres sans s\'arrêter!' },
      { title: '🔥 Série de 7 jours', desc: 'A maintenu une série d\'entraînement de 7 jours consécutifs!' },
      { title: '💪 100 séances', desc: 'A atteint le cap des 100 séances d\'entraînement!' },
      { title: '🎯 Objectif atteint', desc: 'A atteint son objectif de perte de poids mensuel!' },
      { title: '⭐ Niveau Expert', desc: 'A débloqué le niveau Expert en musculation!' },
      { title: '🏅 Marathon terminé', desc: 'A terminé son premier marathon!' },
      { title: '💎 1000 calories', desc: 'A brûlé plus de 1000 calories en une seule journée!' },
      { title: '🌟 Membre du mois', desc: 'Élu membre le plus actif du mois!' }
    ];

    const friendMessages = [
      'est maintenant ami avec',
      'a rejoint la communauté fitness',
      'a commencé à suivre'
    ];

    const activities: any[] = [];
    const now = new Date();
    let activityId = 1;

    // Générer 15-20 activités variées
    const numActivities = 15 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < numActivities; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const minutesAgo = Math.floor(Math.random() * 1440) + i * 30; // Répartir dans les dernières 24h
      const activityDate = new Date(now.getTime() - minutesAgo * 60 * 1000);
      
      // Déterminer le type d'activité (70% workout, 20% achievement, 10% friend_added)
      const rand = Math.random();
      let activity: any;

      if (rand < 0.7) {
        // Workout
        const workout = workoutTypes[Math.floor(Math.random() * workoutTypes.length)];
        activity = {
          id: activityId++,
          userId: user.id,
          type: 'workout',
          title: workout.title,
          description: workout.desc,
          createdAt: activityDate,
          userInfo: user,
          likes: Math.floor(Math.random() * 25),
          hasLiked: Math.random() > 0.7,
          comments: Math.floor(Math.random() * 10)
        };
      } else if (rand < 0.9) {
        // Achievement
        const achievement = achievements[Math.floor(Math.random() * achievements.length)];
        activity = {
          id: activityId++,
          userId: user.id,
          type: 'achievement',
          title: achievement.title,
          description: achievement.desc,
          createdAt: activityDate,
          userInfo: user,
          likes: Math.floor(Math.random() * 40) + 5,
          hasLiked: Math.random() > 0.5,
          comments: Math.floor(Math.random() * 15)
        };
      } else {
        // Friend added
        const otherUser = users.filter(u => u.id !== user.id)[Math.floor(Math.random() * (users.length - 1))];
        activity = {
          id: activityId++,
          userId: user.id,
          type: 'friend_added',
          title: 'Nouvel ami',
          description: `${user.nom} ${friendMessages[0]} ${otherUser.nom}`,
          createdAt: activityDate,
          userInfo: user,
          likes: Math.floor(Math.random() * 10),
          hasLiked: Math.random() > 0.8,
          comments: Math.floor(Math.random() * 5)
        };
      }

      activities.push(activity);
    }

    // Trier par date décroissante
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return activities;
  }



  // Search users - Updated with improved error handling and null safety
  searchUsers(query: string): Observable<UserSearchResult[]> {
    const headers = this.createAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/friends/search?q=${encodeURIComponent(query)}`, { headers })
      .pipe(
        map(response => {
          // Use error handler to extract users data safely
          const results = this.errorHandler.extractData<any>(response, 'users');
          
          // Backend now guarantees arrays instead of null - no more null checks needed
          return results.map((result: any) => {
            const userSearchResult: UserSearchResult = {
              user: {
                id: result.id,
                nom: result.nom || result.name || 'Utilisateur',
                email: result.email || '',
                photo: result.photo,
                isOnline: result.isOnline || false,
                lastSeen: result.lastSeen ? new Date(result.lastSeen) : undefined,
                totalWorkouts: result.activitesCount || 0,
                totalCalories: result.totalCalories || 0,
                joinDate: result.joinDate ? new Date(result.joinDate) : new Date(),
                isPublic: result.isPublic !== false
              },
              friendshipStatus: this.getFriendshipStatus(result.id),
              mutualFriends: result.mutualFriends || 0
            };
            return userSearchResult;
          });
        }),
        catchError(error => {
          this.errorHandler.logError('searchUsers', error);
          // Backend guarantees empty array instead of null on errors
          return of([]);
        })
      );
  }

  // Send friend request - Envoie uniquement receiverId comme attendu par le backend
  sendFriendRequest(userId: number, message?: string): Observable<boolean> {
    const headers = this.createAuthHeaders();
    // Backend attend { receiverId: number } - n'envoyer que les champs nécessaires
    const body: { receiverId: number; message?: string } = { receiverId: userId };
    if (message && message.trim()) {
      body.message = message;
    }
    
    console.log('=== FRIEND REQUEST DEBUG ===');
    console.log('URL:', `${this.apiUrl}/friends/requests`);
    console.log('Body:', JSON.stringify(body));
    console.log('Headers:', headers.keys());
    
    return this.http.post<any>(`${this.apiUrl}/friends/requests`, body, { headers })
      .pipe(
        tap(() => {
          // Reload friend requests to get updated list
          this.loadFriendRequests();
        }),
        map(() => true),
        catchError(error => {
          console.error('=== FRIEND REQUEST ERROR ===');
          console.error('Status:', error.status);
          console.error('Error body:', error.error);
          // Extraire le message d'erreur du backend
          const errorMessage = error.error?.message || error.error?.error || error.error || 'Erreur inconnue';
          console.error('Message:', errorMessage);
          // Afficher une alerte avec le message d'erreur pour l'utilisateur
          alert(`Erreur: ${errorMessage}`);
          return of(false);
        })
      );
  }

  // Accept friend request
  acceptFriendRequest(requestId: number): Observable<boolean> {
    const headers = this.createAuthHeaders();
    
    console.log('=== ACCEPT FRIEND REQUEST DEBUG ===');
    console.log('Request ID:', requestId);
    console.log('URL:', `${this.apiUrl}/friends/requests/${requestId}/accept`);
    console.log('Headers:', headers.keys());
    
    // PUT /friends/requests/{id}/accept avec body JSON vide
    return this.http.put<any>(`${this.apiUrl}/friends/requests/${requestId}/accept`, {}, { headers })
      .pipe(
        tap(() => {
          console.log('Demande acceptée avec succès, rechargement des données dans 500ms...');
          // Petit délai pour laisser le backend commiter la transaction
          setTimeout(() => {
            console.log('Rechargement des amis...');
            this.loadFriends();
            this.loadFriendRequests();
            this.loadSocialFeed();
          }, 500);
        }),
        map(() => true),
        catchError(error => {
          console.error('=== ACCEPT REQUEST ERROR ===');
          console.error('Status:', error.status);
          console.error('Error body:', error.error);
          console.error('Message:', error.error?.message || error.error?.error || 'Erreur inconnue');
          return of(false);
        })
      );
  }

  // Decline friend request
  declineFriendRequest(requestId: number): Observable<boolean> {
    const headers = this.createAuthHeaders();
    
    console.log('=== DECLINE FRIEND REQUEST DEBUG ===');
    console.log('Request ID:', requestId);
    console.log('URL:', `${this.apiUrl}/friends/requests/${requestId}/reject`);
    
    // PUT /friends/requests/{id}/reject avec body JSON vide
    return this.http.put<any>(`${this.apiUrl}/friends/requests/${requestId}/reject`, {}, { headers })
      .pipe(
        tap(() => {
          console.log('Demande refusée avec succès');
          // Reload friend requests to get updated list
          this.loadFriendRequests();
        }),
        map(() => true),
        catchError(error => {
          console.error('Erreur lors du refus de la demande d\'amitié:', error);
          return of(false);
        })
      );
  }

  // Remove friend
  removeFriend(userId: number): Observable<boolean> {
    const headers = this.createAuthHeaders();
    
    return this.http.delete<any>(`${this.apiUrl}/friends/${userId}`, { headers })
      .pipe(
        tap(() => {
          // Reload friends list to get updated list
          this.loadFriends();
        }),
        map(() => true),
        catchError(error => {
          console.error('Erreur lors de la suppression de l\'ami:', error);
          return of(false);
        })
      );
  }

  // Get friendship status
  getFriendshipStatus(userId: number): FriendshipStatus {
    // Defensive checks: ensure friends and requests are arrays
    const friends = Array.isArray(this.friendsSubject.value) ? this.friendsSubject.value : [];
    const requests = Array.isArray(this.friendRequestsSubject.value) ? this.friendRequestsSubject.value : [];
    const currentUserId = this.getCurrentUserId();

    if (friends.some(f => f.id === userId)) {
      return FriendshipStatus.FRIENDS;
    }

    const sentRequest = requests.find(r => 
      r.senderId === currentUserId && 
      r.receiverId === userId && 
      r.status === FriendRequestStatus.PENDING
    );
    if (sentRequest) {
      return FriendshipStatus.REQUEST_SENT;
    }

    const receivedRequest = requests.find(r => 
      r.receiverId === currentUserId && 
      r.senderId === userId && 
      r.status === FriendRequestStatus.PENDING
    );
    if (receivedRequest) {
      return FriendshipStatus.REQUEST_RECEIVED;
    }

    return FriendshipStatus.NOT_FRIENDS;
  }

  // Like activity
  likeActivity(activityId: number): Observable<boolean> {
    const headers = this.createAuthHeaders();
    
    return this.http.post<any>(`${this.apiUrl}/social/activities/${activityId}/like`, {}, { headers })
      .pipe(
        tap(() => {
          // Reload social feed to get updated likes
          this.loadSocialFeed();
        }),
        map(() => true),
        catchError(error => {
          console.error('Erreur lors du like de l\'activité:', error);
          return of(false);
        })
      );
  }



  // Refresh all data (useful for manual refresh)
  refreshAllData(): void {
    this.loadInitialData();
  }

  // Public method to refresh social feed (called by other services after actions)
  refreshSocialFeed(): void {
    this.loadSocialFeed();
  }

  // Récupérer les demandes envoyées
  getSentRequests(): Observable<SentRequestsResponse> {
    const headers = this.createAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/friends/requests/sent`, { headers })
      .pipe(
        map(response => {
          const requests = Array.isArray(response) ? response : 
            (response?.requests || response?.content || response?.data || []);
          return { requests, count: requests.length };
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des demandes envoyées:', error);
          return of({ requests: [], count: 0 });
        })
      );
  }

  // Récupérer les demandes reçues
  getReceivedRequests(): Observable<PendingRequestsResponse> {
    const headers = this.createAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/friends/requests/received`, { headers })
      .pipe(
        map(response => {
          const requests = Array.isArray(response) ? response : 
            (response?.requests || response?.content || response?.data || []);
          return { requests, count: requests.length };
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des demandes reçues:', error);
          return of({ requests: [], count: 0 });
        })
      );
  }

  // Récupérer la liste des amis
  getFriendsList(): Observable<FriendsResponse> {
    const headers = this.createAuthHeaders();
    return this.http.get<any>(`${this.apiUrl}/friends`, { headers })
      .pipe(
        map(response => {
          const friends = Array.isArray(response) ? response : 
            (response?.friends || response?.content || response?.data || []);
          return { friends, count: friends.length };
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des amis:', error);
          return of({ friends: [], count: 0 });
        })
      );
  }

}