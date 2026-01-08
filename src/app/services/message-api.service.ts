import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import {
  MessageDTO,
  ConversationDTO,
  SendMessageRequest,
  PagedResponse,
  UnreadCountResponse,
  MessageType
} from '../models/message.model';
import { StorageService } from '../service/storage-service.service';
import { JwtService } from '../service/jwt.service';

/**
 * Service HTTP pour la messagerie
 * Base URL: http://localhost:8099/api
 * Conforme au guide d'intégration backend
 */
@Injectable({
  providedIn: 'root'
})
export class MessageApiService {
  private readonly apiUrl = 'http://localhost:8099/api';

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private jwtService: JwtService
  ) {}

  /**
   * Crée les headers HTTP avec le token JWT
   */
  private createAuthHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Récupère l'ID de l'utilisateur courant
   */
  private getCurrentUserId(): number {
    return this.jwtService.getUserId() || 1;
  }

  // ============================================
  // Conversations
  // ============================================

  /**
   * Récupère toutes les conversations de l'utilisateur
   * GET /api/messages/conversations?userId={userId}
   */
  getConversations(userId?: number): Observable<ConversationDTO[]> {
    const headers = this.createAuthHeaders();
    const id = userId || this.getCurrentUserId();
    
    return this.http.get<ConversationDTO[]>(
      `${this.apiUrl}/messages/conversations?userId=${id}`,
      { headers }
    ).pipe(
      map(conversations => this.sortConversationsByDate(conversations)),
      catchError(error => {
        console.error('Erreur lors du chargement des conversations:', error);
        return of([]);
      })
    );
  }

  /**
   * Récupère l'historique d'une conversation
   * GET /api/messages/conversation?userId={userId}&autreUserId={coachId}
   */
  getConversationHistory(userId: number, otherUserId: number): Observable<MessageDTO[]> {
    const headers = this.createAuthHeaders();
    
    let params = new HttpParams();
    params = params.set('userId', userId.toString());
    params = params.set('autreUserId', otherUserId.toString());
    
    return this.http.get<MessageDTO[]>(
      `${this.apiUrl}/messages/conversation`,
      { headers, params }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors du chargement de l\'historique:', error);
        return of([]);
      })
    );
  }

  /**
   * Récupère l'historique avec pagination
   * GET /api/messages/conversation/paginated?userId={userId}&autreUserId={coachId}&page=0&size=20
   */
  getConversationHistoryPaginated(
    userId: number,
    otherUserId: number,
    page: number = 0,
    size: number = 20
  ): Observable<PagedResponse<MessageDTO>> {
    const headers = this.createAuthHeaders();
    
    let params = new HttpParams();
    params = params.set('userId', userId.toString());
    params = params.set('autreUserId', otherUserId.toString());
    params = params.set('page', page.toString());
    params = params.set('size', size.toString());
    
    return this.http.get<PagedResponse<MessageDTO>>(
      `${this.apiUrl}/messages/conversation/paginated`,
      { headers, params }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors du chargement paginé:', error);
        return of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          page: 0,
          size: size
        });
      })
    );
  }

  // ============================================
  // Messages
  // ============================================

  /**
   * Envoie un message
   * POST /api/messages?userId={userId}
   */
  sendMessage(request: SendMessageRequest, userId?: number): Observable<MessageDTO> {
    // Validation: max 2000 caractères
    if (request.contenu.length > 2000) {
      return throwError(() => new Error('Le message ne peut pas dépasser 2000 caractères'));
    }

    const headers = this.createAuthHeaders();
    const id = userId || this.getCurrentUserId();
    
    return this.http.post<MessageDTO>(
      `${this.apiUrl}/messages?userId=${id}`,
      request,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de l\'envoi du message:', error);
        throw error;
      })
    );
  }

  /**
   * Marque un message comme lu
   * PUT /api/messages/{messageId}/lire?userId={userId}
   */
  markMessageAsRead(messageId: number, userId?: number): Observable<void> {
    const headers = this.createAuthHeaders();
    const id = userId || this.getCurrentUserId();
    
    return this.http.put<void>(
      `${this.apiUrl}/messages/${messageId}/lire?userId=${id}`,
      {},
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors du marquage comme lu:', error);
        return of(undefined);
      })
    );
  }

  /**
   * Marque toute une conversation comme lue
   * PUT /api/messages/conversation/{conversationId}/lire?userId={userId}
   */
  markConversationAsRead(conversationId: string, userId?: number): Observable<void> {
    const headers = this.createAuthHeaders();
    const id = userId || this.getCurrentUserId();
    
    return this.http.put<void>(
      `${this.apiUrl}/messages/conversation/${conversationId}/lire?userId=${id}`,
      {},
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors du marquage de la conversation:', error);
        return of(undefined);
      })
    );
  }

  // ============================================
  // Messages non lus
  // ============================================

  /**
   * Compte les messages non lus
   * GET /api/messages/non-lus/count?userId={userId}
   */
  getUnreadCount(userId?: number): Observable<UnreadCountResponse> {
    const headers = this.createAuthHeaders();
    const id = userId || this.getCurrentUserId();
    
    return this.http.get<UnreadCountResponse>(
      `${this.apiUrl}/messages/non-lus/count?userId=${id}`,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors du comptage des non lus:', error);
        return of({ count: 0 });
      })
    );
  }

  /**
   * Récupère les messages non lus
   * GET /api/messages/non-lus?userId={userId}
   */
  getUnreadMessages(userId?: number): Observable<MessageDTO[]> {
    const headers = this.createAuthHeaders();
    const id = userId || this.getCurrentUserId();
    
    return this.http.get<MessageDTO[]>(
      `${this.apiUrl}/messages/non-lus?userId=${id}`,
      { headers }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors du chargement des non lus:', error);
        return of([]);
      })
    );
  }

  // ============================================
  // Recherche
  // ============================================

  /**
   * Recherche dans les messages
   * GET /api/messages/search?userId={userId}&keyword={mot}
   */
  searchMessages(keyword: string, userId?: number): Observable<MessageDTO[]> {
    const headers = this.createAuthHeaders();
    const id = userId || this.getCurrentUserId();
    
    let params = new HttpParams();
    params = params.set('userId', id.toString());
    params = params.set('keyword', keyword);
    
    return this.http.get<MessageDTO[]>(
      `${this.apiUrl}/messages/search`,
      { headers, params }
    ).pipe(
      catchError(error => {
        console.error('Erreur lors de la recherche:', error);
        return of([]);
      })
    );
  }

  // ============================================
  // Utilitaires
  // ============================================

  /**
   * Trie les conversations par date (plus récent en premier)
   */
  private sortConversationsByDate(conversations: ConversationDTO[]): ConversationDTO[] {
    return [...conversations].sort((a, b) => {
      const dateA = new Date(a.lastMessageAt).getTime();
      const dateB = new Date(b.lastMessageAt).getTime();
      return dateB - dateA; // Décroissant
    });
  }

  /**
   * Génère un ID de conversation à partir de deux user IDs
   */
  generateConversationId(userId1: number, userId2: number): string {
    const sortedIds = [userId1, userId2].sort((a, b) => a - b);
    return `conv_${sortedIds[0]}_${sortedIds[1]}`;
  }

  /**
   * Vérifie si le token JWT est valide
   */
  isAuthenticated(): boolean {
    return this.jwtService.isTokenValid();
  }
}
