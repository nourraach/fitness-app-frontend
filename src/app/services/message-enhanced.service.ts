import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../service/storage-service.service';
import { ApiErrorHandlerService } from './api-error-handler.service';

export interface MessageDTO {
  id?: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp?: string;
  isRead?: boolean;
  conversationId?: number;
}

export interface ConversationDTO {
  id: number;
  participants: number[];
  lastMessage?: MessageDTO;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class MessageEnhancedService {
  private apiUrl = 'http://localhost:8095/api/messages';

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private errorHandler: ApiErrorHandlerService
  ) {}

  /**
   * Envoyer un message
   * CORRECTION: Utilise POST /api/messages (endpoint racine)
   */
  sendMessage(message: MessageDTO): Observable<MessageDTO> {
    return this.errorHandler.executeWithRetry(
      () => this.http.post<MessageDTO>(`${this.apiUrl}`, message, { headers: this.getHeaders() }),
      3,
      'messages-send'
    );
  }

  /**
   * Obtenir les messages d'une conversation
   */
  getConversationMessages(conversationId: number, page: number = 0, size: number = 50): Observable<MessageDTO[]> {
    return this.errorHandler.executeWithRetry(
      () => this.http.get<MessageDTO[]>(`${this.apiUrl}/conversation/${conversationId}`, {
        headers: this.getHeaders(),
        params: { page: page.toString(), size: size.toString() }
      }),
      3,
      'messages-conversation'
    );
  }

  /**
   * Obtenir toutes les conversations de l'utilisateur
   */
  getConversations(): Observable<ConversationDTO[]> {
    return this.errorHandler.executeWithRetry(
      () => this.http.get<ConversationDTO[]>(`${this.apiUrl}/conversations`, { headers: this.getHeaders() }),
      3,
      'messages-conversations'
    );
  }

  /**
   * Créer une nouvelle conversation
   */
  createConversation(participantIds: number[]): Observable<ConversationDTO> {
    return this.errorHandler.executeWithRetry(
      () => this.http.post<ConversationDTO>(`${this.apiUrl}/conversations`, { participantIds }, { headers: this.getHeaders() }),
      3,
      'messages-create-conversation'
    );
  }

  /**
   * Marquer un message comme lu
   */
  markMessageAsRead(messageId: number): Observable<any> {
    return this.errorHandler.executeWithRetry(
      // CORRECTION: Utilise l'endpoint backend existant
      () => this.http.put(`${this.apiUrl}/${messageId}/lire`, {}, { headers: this.getHeaders() }),
      3,
      'messages-mark-read'
    );
  }

  /**
   * Marquer tous les messages d'une conversation comme lus
   */
  markConversationAsRead(conversationId: number): Observable<any> {
    return this.errorHandler.executeWithRetry(
      // CORRECTION: Utilise l'endpoint backend existant
      () => this.http.put(`http://localhost:8095/api/messages/conversation/${conversationId}/lire`, {}, { headers: this.getHeaders() }),
      3,
      'messages-mark-conversation-read'
    );
  }

  /**
   * Supprimer un message
   */
  deleteMessage(messageId: number): Observable<any> {
    return this.errorHandler.executeWithRetry(
      () => this.http.delete(`${this.apiUrl}/${messageId}`, { headers: this.getHeaders() }),
      3,
      'messages-delete'
    );
  }

  /**
   * Rechercher des messages
   */
  searchMessages(query: string, conversationId?: number): Observable<MessageDTO[]> {
    const params: any = { query };
    if (conversationId) {
      params.conversationId = conversationId.toString();
    }

    return this.errorHandler.executeWithRetry(
      () => this.http.get<MessageDTO[]>(`${this.apiUrl}/search`, {
        headers: this.getHeaders(),
        params
      }),
      3,
      'messages-search'
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