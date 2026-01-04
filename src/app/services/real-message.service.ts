import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  MessageDTO, 
  ConversationDTO, 
  EnvoyerMessageRequest,
  MessageType 
} from '../models/message.model';
import { StorageService } from '../service/storage-service.service';
import { JwtService } from '../service/jwt.service';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class RealMessageService {
  private apiUrl = 'http://localhost:8095/api';
  
  // State management
  private conversationsSubject = new BehaviorSubject<ConversationDTO[]>([]);
  private messagesSubject = new BehaviorSubject<{ [conversationId: string]: MessageDTO[] }>({});
  
  public conversations$ = this.conversationsSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();

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
      this.loadConversations();
    }
  }

  // Load conversations from backend - Updated to use new dedicated endpoint
  loadConversations(): Observable<ConversationDTO[]> {
    const headers = this.createAuthHeaders();
    
    // Use new dedicated /api/conversations endpoint
    return this.http.get<any>(`${this.apiUrl}/conversations`, { headers })
      .pipe(
        map(response => {
          // Use error handler to extract data safely
          return this.errorHandler.extractData<ConversationDTO>(response, 'conversations');
        }),
        tap(conversations => {
          this.conversationsSubject.next(conversations);
        }),
        catchError(error => {
          this.errorHandler.logError('loadConversations', error);
          return of([]);
        })
      );
  }

  // Load messages for a specific conversation
  loadMessagesForConversation(conversationId: string): Observable<MessageDTO[]> {
    const headers = this.createAuthHeaders();
    
    return this.http.get<MessageDTO[]>(`${this.apiUrl}/conversations/${conversationId}/messages`, { headers })
      .pipe(
        tap(messages => {
          const currentMessages = this.messagesSubject.value;
          this.messagesSubject.next({
            ...currentMessages,
            [conversationId]: messages
          });
        }),
        catchError(error => {
          console.error('Erreur lors du chargement des messages:', error);
          return of([]);
        })
      );
  }

  // Send a message
  sendMessage(request: EnvoyerMessageRequest): Observable<MessageDTO> {
    const headers = this.createAuthHeaders();
    
    return this.http.post<MessageDTO>(`${this.apiUrl}/messages`, request, { headers })
      .pipe(
        tap(message => {
          // Add message to local state
          const currentMessages = this.messagesSubject.value;
          const conversationId = message.conversationId;
          const conversationMessages = currentMessages[conversationId] || [];
          
          this.messagesSubject.next({
            ...currentMessages,
            [conversationId]: [...conversationMessages, message]
          });

          // Update conversation last message
          this.updateConversationLastMessage(conversationId, message);
        }),
        catchError(error => {
          console.error('Erreur lors de l\'envoi du message:', error);
          throw error;
        })
      );
  }

  // Create a new conversation
  createConversation(otherUserId: number): Observable<ConversationDTO> {
    const headers = this.createAuthHeaders();
    const body = { otherUserId };
    
    return this.http.post<ConversationDTO>(`${this.apiUrl}/conversations`, body, { headers })
      .pipe(
        tap(conversation => {
          // Add conversation to local state
          const currentConversations = this.conversationsSubject.value;
          this.conversationsSubject.next([conversation, ...currentConversations]);
        }),
        catchError(error => {
          console.error('Erreur lors de la création de la conversation:', error);
          throw error;
        })
      );
  }

  // Mark messages as read
  markMessagesAsRead(conversationId: string): Observable<boolean> {
    const headers = this.createAuthHeaders();
    
    return this.http.put<any>(`${this.apiUrl}/conversations/${conversationId}/read`, {}, { headers })
      .pipe(
        tap(() => {
          // Update local conversation state
          const conversations = this.conversationsSubject.value;
          const updatedConversations = conversations.map(conv => 
            conv.conversationId === conversationId 
              ? { ...conv, messagesNonLus: 0 }
              : conv
          );
          this.conversationsSubject.next(updatedConversations);
        }),
        map(() => true),
        catchError(error => {
          console.error('Erreur lors du marquage des messages comme lus:', error);
          return of(false);
        })
      );
  }

  // Get messages for a conversation from local state
  getMessagesForConversation(conversationId: string): MessageDTO[] {
    const allMessages = this.messagesSubject.value;
    return allMessages[conversationId] || [];
  }

  // Get conversation by ID
  getConversationById(conversationId: string): ConversationDTO | null {
    const conversations = this.conversationsSubject.value;
    return conversations.find(conv => conv.conversationId === conversationId) || null;
  }

  // Update conversation last message locally
  private updateConversationLastMessage(conversationId: string, message: MessageDTO): void {
    const conversations = this.conversationsSubject.value;
    const updatedConversations = conversations.map(conv => 
      conv.conversationId === conversationId 
        ? { 
            ...conv, 
            dernierMessage: message.contenu,
            dateDernierMessage: message.dateEnvoi
          }
        : conv
    );
    this.conversationsSubject.next(updatedConversations);
  }

  // Get total unread messages count
  getTotalUnreadCount(): Observable<number> {
    return this.conversations$.pipe(
      map(conversations => 
        conversations.reduce((total, conv) => total + conv.messagesNonLus, 0)
      )
    );
  }

  // Search conversations
  searchConversations(query: string): Observable<ConversationDTO[]> {
    return this.conversations$.pipe(
      map(conversations => 
        conversations.filter(conv => 
          conv.autreUtilisateurNom.toLowerCase().includes(query.toLowerCase()) ||
          conv.dernierMessage.toLowerCase().includes(query.toLowerCase())
        )
      )
    );
  }

  // Refresh all data (useful for manual refresh)
  refreshAllData(): void {
    this.loadInitialData();
  }

  // Clear local state (useful for logout)
  clearState(): void {
    this.conversationsSubject.next([]);
    this.messagesSubject.next({});
  }
}