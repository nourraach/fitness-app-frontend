import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, Subject } from 'rxjs';
import { MessageDTO, EnvoyerMessageRequest, MessageType } from '../models/message.model';
import { ConversationDTO } from '../models/conversation.model';
import { StorageService } from '../service/storage-service.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = 'http://localhost:8095/api';
  private wsUrl = 'ws://localhost:8095/ws/messaging';
  
  // Subjects pour la communication en temps réel
  private messagesSubject = new Subject<MessageDTO>();
  private conversationsSubject = new BehaviorSubject<ConversationDTO[]>([]);
  private connectionStatusSubject = new BehaviorSubject<boolean>(false);
  
  // WebSocket connection
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  // Observables publics
  get messages$(): Observable<MessageDTO> {
    return this.messagesSubject.asObservable();
  }

  // Backward compatibility methods
  getMessages(conversationId: number): Observable<MessageDTO[]> {
    return this.getConversationMessages(conversationId);
  }

  markAsRead(messageId: number): Observable<void> {
    return this.markMessageAsRead(messageId);
  }

  get conversations$(): Observable<ConversationDTO[]> {
    return this.conversationsSubject.asObservable();
  }

  get connectionStatus$(): Observable<boolean> {
    return this.connectionStatusSubject.asObservable();
  }

  // Headers d'authentification
  private getAuthHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // ===== API REST =====

  // Récupérer les conversations de l'utilisateur
  getConversations(): Observable<ConversationDTO[]> {
    return this.http.get<ConversationDTO[]>(`${this.apiUrl}/conversations`, {
      headers: this.getAuthHeaders()
    });
  }

  // Récupérer l'historique des messages d'une conversation
  getConversationMessages(conversationId: number): Observable<MessageDTO[]> {
    return this.http.get<MessageDTO[]>(`${this.apiUrl}/conversations/${conversationId}/messages`, {
      headers: this.getAuthHeaders()
    });
  }

  // Envoyer un message via REST (fallback)
  sendMessageRest(request: EnvoyerMessageRequest): Observable<MessageDTO> {
    return this.http.post<MessageDTO>(`${this.apiUrl}/messages`, request, {
      headers: this.getAuthHeaders()
    });
  }

  // Marquer un message comme lu
  markMessageAsRead(messageId: number): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/messages/${messageId}/read`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  // Rechercher dans les messages
  searchMessages(query: string): Observable<MessageDTO[]> {
    return this.http.get<MessageDTO[]>(`${this.apiUrl}/messages/search?q=${encodeURIComponent(query)}`, {
      headers: this.getAuthHeaders()
    });
  }

  // Créer une nouvelle conversation
  createConversation(coachId: number): Observable<ConversationDTO> {
    return this.http.post<ConversationDTO>(`${this.apiUrl}/conversations`, 
      { coachId }, 
      { headers: this.getAuthHeaders() }
    );
  }

  // ===== WebSocket =====

  // Connexion WebSocket
  connectWebSocket(): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return; // Déjà connecté
    }

    const token = this.storageService.getItem('jwt');
    if (!token) {
      console.error('Token JWT manquant pour la connexion WebSocket');
      return;
    }

    try {
      // Connexion WebSocket avec token JWT
      this.socket = new WebSocket(`${this.wsUrl}?token=${token}`);

      this.socket.onopen = (event) => {
        console.log('WebSocket connecté:', event);
        this.connectionStatusSubject.next(true);
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const message: MessageDTO = JSON.parse(event.data);
          this.messagesSubject.next(message);
          this.updateConversationWithNewMessage(message);
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket fermé:', event);
        this.connectionStatusSubject.next(false);
        this.handleReconnection();
      };

      this.socket.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        this.connectionStatusSubject.next(false);
      };

    } catch (error) {
      console.error('Erreur création WebSocket:', error);
      this.handleReconnection();
    }
  }

  // Envoyer un message via WebSocket
  sendMessage(request: EnvoyerMessageRequest): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'SEND_MESSAGE',
        payload: request
      };
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket non connecté, utilisation de l\'API REST');
      this.sendMessageRest(request).subscribe({
        next: (message) => {
          this.messagesSubject.next(message);
          this.updateConversationWithNewMessage(message);
        },
        error: (error) => {
          console.error('Erreur envoi message REST:', error);
        }
      });
    }
  }

  // Déconnexion WebSocket
  disconnectWebSocket(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.connectionStatusSubject.next(false);
  }

  // Gestion de la reconnexion automatique
  private handleReconnection(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
      
      setTimeout(() => {
        this.connectWebSocket();
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('Nombre maximum de tentatives de reconnexion atteint');
    }
  }

  // Mettre à jour la liste des conversations avec un nouveau message
  private updateConversationWithNewMessage(message: MessageDTO): void {
    const currentConversations = this.conversationsSubject.value;
    const updatedConversations = currentConversations.map(conv => {
      if (conv.id === parseInt(message.conversationId || '0')) {
        return {
          ...conv,
          lastMessageContent: message.contenu,
          lastMessageAt: message.dateEnvoi,
          unreadMessageCount: message.lu ? (conv.unreadMessageCount || 0) : ((conv.unreadMessageCount || 0) + 1)
        };
      }
      return conv;
    });
    
    this.conversationsSubject.next(updatedConversations);
  }

  // Charger et mettre à jour les conversations
  loadConversations(): void {
    this.getConversations().subscribe({
      next: (conversations) => {
        this.conversationsSubject.next(conversations);
      },
      error: (error) => {
        console.error('Erreur chargement conversations:', error);
      }
    });
  }

  // Utilitaires
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  // Créer un message rapide
  createQuickMessage(receiverId: number, content: string, type: MessageType = MessageType.TEXT): EnvoyerMessageRequest {
    return {
      destinataireId: receiverId,
      contenu: content,
      type
    };
  }
}