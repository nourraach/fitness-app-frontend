import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { ConversationDTO } from '../models/conversation.model';
import { StorageService } from '../service/storage-service.service';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private apiUrl = 'http://localhost:8095/api/conversations';
  private conversationsSubject = new BehaviorSubject<ConversationDTO[]>([]);
  
  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  // Observable pour les conversations
  get conversations$(): Observable<ConversationDTO[]> {
    return this.conversationsSubject.asObservable();
  }

  // Headers d'authentification
  private getAuthHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Récupérer toutes les conversations de l'utilisateur
  getUserConversations(): Observable<ConversationDTO[]> {
    return this.http.get<ConversationDTO[]>(this.apiUrl, {
      headers: this.getAuthHeaders()
    });
  }

  // Récupérer une conversation spécifique
  getConversation(conversationId: number): Observable<ConversationDTO> {
    return this.http.get<ConversationDTO>(`${this.apiUrl}/${conversationId}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Créer une nouvelle conversation
  createConversation(participantId: number): Observable<ConversationDTO> {
    const body = { participantId };
    return this.http.post<ConversationDTO>(this.apiUrl, body, {
      headers: this.getAuthHeaders()
    });
  }

  // Marquer une conversation comme active/inactive
  updateConversationStatus(conversationId: number, isActive: boolean): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${conversationId}/status`, 
      { isActive }, 
      { headers: this.getAuthHeaders() }
    );
  }

  // Rechercher des conversations
  searchConversations(query: string): Observable<ConversationDTO[]> {
    return this.http.get<ConversationDTO[]>(`${this.apiUrl}/search?q=${encodeURIComponent(query)}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Mettre à jour le cache local des conversations
  updateConversationsCache(conversations: ConversationDTO[]): void {
    this.conversationsSubject.next(conversations);
  }

  // Ajouter une nouvelle conversation au cache
  addConversationToCache(conversation: ConversationDTO): void {
    const currentConversations = this.conversationsSubject.value;
    const updatedConversations = [conversation, ...currentConversations];
    this.conversationsSubject.next(updatedConversations);
  }

  // Mettre à jour une conversation dans le cache
  updateConversationInCache(updatedConversation: ConversationDTO): void {
    const currentConversations = this.conversationsSubject.value;
    const index = currentConversations.findIndex(c => c.id === updatedConversation.id);
    
    if (index !== -1) {
      currentConversations[index] = updatedConversation;
      this.conversationsSubject.next([...currentConversations]);
    }
  }

  // Supprimer une conversation du cache
  removeConversationFromCache(conversationId: number): void {
    const currentConversations = this.conversationsSubject.value;
    const filteredConversations = currentConversations.filter(c => c.id !== conversationId);
    this.conversationsSubject.next(filteredConversations);
  }

  // Obtenir le nombre total de messages non lus
  getTotalUnreadCount(): number {
    const conversations = this.conversationsSubject.value;
    return conversations.reduce((total, conv) => total + conv.unreadMessageCount, 0);
  }

  // Réinitialiser le compteur de messages non lus pour une conversation
  resetUnreadCount(conversationId: number): void {
    const currentConversations = this.conversationsSubject.value;
    const conversation = currentConversations.find(c => c.id === conversationId);
    
    if (conversation && conversation.unreadMessageCount > 0) {
      conversation.unreadMessageCount = 0;
      this.conversationsSubject.next([...currentConversations]);
    }
  }
}