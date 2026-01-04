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
  SocialNotification 
} from '../models/friend.model';
import { StorageService } from '../service/storage-service.service';
import { JwtService } from '../service/jwt.service';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class FriendService {
  private apiUrl = 'http://localhost:8095/api';
  
  // State management
  private friendsSubject = new BehaviorSubject<User[]>([]);
  private friendRequestsSubject = new BehaviorSubject<FriendRequest[]>([]);
  private socialFeedSubject = new BehaviorSubject<SocialActivity[]>([]);
  private notificationsSubject = new BehaviorSubject<SocialNotification[]>([]);
  
  public friends$ = this.friendsSubject.asObservable();
  public friendRequests$ = this.friendRequestsSubject.asObservable();
  public socialFeed$ = this.socialFeedSubject.asObservable();
  public notifications$ = this.notificationsSubject.asObservable();

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
      this.loadNotifications();
    }
  }

  // Load friends from backend
  private loadFriends(): void {
    const headers = this.createAuthHeaders();
    this.http.get<User[]>(`${this.apiUrl}/friends`, { headers })
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des amis:', error);
          return of([]);
        })
      )
      .subscribe(friends => {
        this.friendsSubject.next(friends);
      });
  }

  // Load friend requests from backend
  private loadFriendRequests(): void {
    const headers = this.createAuthHeaders();
    this.http.get<FriendRequest[]>(`${this.apiUrl}/friends/requests`, { headers })
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des demandes d\'amitié:', error);
          return of([]);
        })
      )
      .subscribe(requests => {
        this.friendRequestsSubject.next(requests);
      });
  }

  // Load social feed from backend
  private loadSocialFeed(): void {
    const headers = this.createAuthHeaders();
    this.http.get<SocialActivity[]>(`${this.apiUrl}/social/feed`, { headers })
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement du fil social:', error);
          return of([]);
        })
      )
      .subscribe(activities => {
        this.socialFeedSubject.next(activities);
      });
  }

  // Load notifications from backend
  private loadNotifications(): void {
    const headers = this.createAuthHeaders();
    this.http.get<SocialNotification[]>(`${this.apiUrl}/social/notifications`, { headers })
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des notifications:', error);
          return of([]);
        })
      )
      .subscribe(notifications => {
        this.notificationsSubject.next(notifications);
      });
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

  // Send friend request
  sendFriendRequest(userId: number, message?: string): Observable<boolean> {
    const headers = this.createAuthHeaders();
    const body = { receiverId: userId, message: message || '' };
    
    return this.http.post<any>(`${this.apiUrl}/friends/request`, body, { headers })
      .pipe(
        tap(() => {
          // Reload friend requests to get updated list
          this.loadFriendRequests();
        }),
        map(() => true),
        catchError(error => {
          console.error('Erreur lors de l\'envoi de la demande d\'amitié:', error);
          return of(false);
        })
      );
  }

  // Accept friend request
  acceptFriendRequest(requestId: number): Observable<boolean> {
    const headers = this.createAuthHeaders();
    
    return this.http.put<any>(`${this.apiUrl}/friends/request/${requestId}/accept`, {}, { headers })
      .pipe(
        tap(() => {
          // Reload both friends and requests to get updated lists
          this.loadFriends();
          this.loadFriendRequests();
          this.loadSocialFeed(); // New friendship might create social activity
        }),
        map(() => true),
        catchError(error => {
          console.error('Erreur lors de l\'acceptation de la demande d\'amitié:', error);
          return of(false);
        })
      );
  }

  // Decline friend request
  declineFriendRequest(requestId: number): Observable<boolean> {
    const headers = this.createAuthHeaders();
    
    return this.http.put<any>(`${this.apiUrl}/friends/request/${requestId}/reject`, {}, { headers })
      .pipe(
        tap(() => {
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
    const friends = this.friendsSubject.value;
    const requests = this.friendRequestsSubject.value;
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

  // Mark notification as read
  markNotificationAsRead(notificationId: number): Observable<boolean> {
    const headers = this.createAuthHeaders();
    
    return this.http.put<any>(`${this.apiUrl}/social/notifications/${notificationId}/read`, {}, { headers })
      .pipe(
        tap(() => {
          // Update local notification state
          const notifications = this.notificationsSubject.value;
          const notification = notifications.find(n => n.id === notificationId);
          if (notification) {
            notification.isRead = true;
            this.notificationsSubject.next([...notifications]);
          }
        }),
        map(() => true),
        catchError(error => {
          console.error('Erreur lors du marquage de la notification comme lue:', error);
          return of(false);
        })
      );
  }

  // Get unread notifications count
  getUnreadNotificationsCount(): Observable<number> {
    return this.notifications$.pipe(
      map(notifications => notifications.filter(n => !n.isRead).length)
    );
  }

  // Refresh all data (useful for manual refresh)
  refreshAllData(): void {
    this.loadInitialData();
  }

}