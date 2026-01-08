import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  MessageDTO,
  TypingIndicatorDTO,
  ReadReceiptDTO,
  SendMessageRequest,
  TypingIndicatorRequest,
  MessageReadRequest,
  MessageType
} from '../models/message.model';
import { StorageService } from '../service/storage-service.service';
import { JwtService } from '../service/jwt.service';

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'reconnecting';

/**
 * Service WebSocket utilisant SockJS et STOMP
 * URL: http://localhost:8099/ws/messaging
 * Conforme au guide d'intégration backend
 */
@Injectable({
  providedIn: 'root'
})
export class StompWebsocketService implements OnDestroy {
  private readonly wsUrl = 'http://localhost:8099/ws/messaging';
  private client: Client | null = null;
  private subscriptions: StompSubscription[] = [];
  
  // Reconnection settings (exponential backoff)
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 10;
  private readonly baseReconnectDelay = 1000; // 1 second
  private readonly maxReconnectDelay = 30000; // 30 seconds
  
  // Subjects for observables
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>('disconnected');
  private messagesSubject = new Subject<MessageDTO>();
  private messageSentSubject = new Subject<MessageDTO>();
  private messageReadSubject = new Subject<ReadReceiptDTO>();
  private typingSubject = new Subject<TypingIndicatorDTO>();
  
  // Public observables
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  public messages$ = this.messagesSubject.asObservable();
  public messageSent$ = this.messageSentSubject.asObservable();
  public messageRead$ = this.messageReadSubject.asObservable();
  public typing$ = this.typingSubject.asObservable();

  constructor(
    private storageService: StorageService,
    private jwtService: JwtService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnDestroy(): void {
    this.disconnect();
  }

  /**
   * Connecte au WebSocket avec le token JWT
   */
  connect(userId?: number): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const token = this.storageService.getItem('jwt');
    if (!token) {
      console.warn('Pas de token JWT, connexion WebSocket impossible');
      return;
    }

    const currentUserId = userId || this.jwtService.getUserId() || 1;
    
    if (this.client?.connected) {
      console.log('WebSocket déjà connecté');
      return;
    }

    this.connectionStatusSubject.next('connecting');

    this.client = new Client({
      webSocketFactory: () => new SockJS(this.wsUrl),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => {
        // console.log('STOMP Debug:', str);
      },
      reconnectDelay: 0, // We handle reconnection manually
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 20000,
      
      onConnect: () => {
        console.log('✅ WebSocket STOMP connecté');
        this.connectionStatusSubject.next('connected');
        this.reconnectAttempts = 0;
        this.setupSubscriptions(currentUserId);
      },
      
      onDisconnect: () => {
        console.log('❌ WebSocket STOMP déconnecté');
        this.connectionStatusSubject.next('disconnected');
        this.clearSubscriptions();
      },
      
      onStompError: (frame) => {
        console.error('Erreur STOMP:', frame.headers['message']);
        this.handleReconnection();
      },
      
      onWebSocketClose: () => {
        console.log('WebSocket fermé');
        this.connectionStatusSubject.next('disconnected');
        this.handleReconnection();
      },
      
      onWebSocketError: (event) => {
        console.error('Erreur WebSocket:', event);
        this.handleReconnection();
      }
    });

    this.client.activate();
  }

  /**
   * Déconnecte du WebSocket
   */
  disconnect(): void {
    this.clearSubscriptions();
    
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    
    this.connectionStatusSubject.next('disconnected');
    this.reconnectAttempts = 0;
  }

  /**
   * Vérifie si connecté
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  /**
   * Récupère le statut de connexion actuel
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatusSubject.value;
  }

  // ============================================
  // Publishing methods (envoi vers le serveur)
  // ============================================

  /**
   * Envoie un message via WebSocket
   * Destination: /app/message.send
   */
  sendMessage(request: SendMessageRequest): void {
    if (!this.client?.connected) {
      console.warn('WebSocket non connecté, impossible d\'envoyer le message');
      return;
    }

    this.client.publish({
      destination: '/app/message.send',
      body: JSON.stringify({
        destinataireId: request.destinataireId,
        contenu: request.contenu,
        type: request.type || MessageType.TEXT
      })
    });
  }

  /**
   * Marque un message comme lu via WebSocket
   * Destination: /app/message.read
   */
  markAsRead(messageId: number, senderId: number): void {
    if (!this.client?.connected) {
      console.warn('WebSocket non connecté');
      return;
    }

    const request: MessageReadRequest = {
      messageId,
      expediteurId: senderId
    };

    this.client.publish({
      destination: '/app/message.read',
      body: JSON.stringify(request)
    });
  }

  /**
   * Envoie un indicateur de frappe via WebSocket
   * Destination: /app/typing
   */
  sendTypingIndicator(recipientId: number, isTyping: boolean): void {
    if (!this.client?.connected) {
      return;
    }

    const request: TypingIndicatorRequest = {
      destinataireId: recipientId,
      typing: isTyping
    };

    this.client.publish({
      destination: '/app/typing',
      body: JSON.stringify(request)
    });
  }

  // ============================================
  // Subscription setup
  // ============================================

  /**
   * Configure les subscriptions STOMP
   */
  private setupSubscriptions(userId: number): void {
    if (!this.client?.connected) {
      return;
    }

    // Subscribe aux messages entrants
    // /user/{userId}/queue/messages
    const messagesSub = this.client.subscribe(
      `/user/${userId}/queue/messages`,
      (message: IMessage) => {
        try {
          const msg: MessageDTO = JSON.parse(message.body);
          console.log('📩 Nouveau message reçu:', msg);
          this.messagesSubject.next(msg);
        } catch (e) {
          console.error('Erreur parsing message:', e);
        }
      }
    );
    this.subscriptions.push(messagesSub);

    // Subscribe aux confirmations d'envoi
    // /user/{userId}/queue/message-sent
    const sentSub = this.client.subscribe(
      `/user/${userId}/queue/message-sent`,
      (message: IMessage) => {
        try {
          const msg: MessageDTO = JSON.parse(message.body);
          console.log('✅ Message envoyé confirmé:', msg);
          this.messageSentSubject.next(msg);
        } catch (e) {
          console.error('Erreur parsing confirmation:', e);
        }
      }
    );
    this.subscriptions.push(sentSub);

    // Subscribe aux notifications de lecture
    // /user/{userId}/queue/message-read
    const readSub = this.client.subscribe(
      `/user/${userId}/queue/message-read`,
      (message: IMessage) => {
        try {
          const receipt: ReadReceiptDTO = JSON.parse(message.body);
          console.log('👁️ Message lu:', receipt);
          this.messageReadSubject.next(receipt);
        } catch (e) {
          console.error('Erreur parsing read receipt:', e);
        }
      }
    );
    this.subscriptions.push(readSub);

    // Subscribe aux indicateurs de frappe
    // /user/{userId}/queue/typing
    const typingSub = this.client.subscribe(
      `/user/${userId}/queue/typing`,
      (message: IMessage) => {
        try {
          const typing: TypingIndicatorDTO = JSON.parse(message.body);
          console.log('⌨️ Indicateur de frappe:', typing);
          this.typingSubject.next(typing);
        } catch (e) {
          console.error('Erreur parsing typing:', e);
        }
      }
    );
    this.subscriptions.push(typingSub);

    console.log(`Subscriptions configurées pour userId: ${userId}`);
  }

  /**
   * Nettoie les subscriptions
   */
  private clearSubscriptions(): void {
    this.subscriptions.forEach(sub => {
      try {
        sub.unsubscribe();
      } catch (e) {
        // Ignore errors during cleanup
      }
    });
    this.subscriptions = [];
  }

  // ============================================
  // Reconnection with exponential backoff
  // ============================================

  /**
   * Gère la reconnexion avec exponential backoff
   * Délais: 1s, 2s, 4s, 8s, 16s, max 30s
   */
  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Nombre maximum de tentatives de reconnexion atteint');
      this.connectionStatusSubject.next('disconnected');
      return;
    }

    this.connectionStatusSubject.next('reconnecting');
    this.reconnectAttempts++;

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, max 30s
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.maxReconnectDelay
    );

    console.log(`Reconnexion dans ${delay}ms (tentative ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.connectionStatusSubject.value !== 'connected') {
        this.connect();
      }
    }, delay);
  }

  /**
   * Force une reconnexion immédiate
   */
  forceReconnect(): void {
    this.reconnectAttempts = 0;
    this.disconnect();
    setTimeout(() => this.connect(), 500);
  }
}
