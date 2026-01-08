import { Injectable, Inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { SendMessageRequest, MessageType } from '../models/message.model';
import { StompWebsocketService, ConnectionStatus } from './stomp-websocket.service';
import { MessageApiService } from './message-api.service';

export type QueuedMessageStatus = 'pending' | 'sending' | 'sent' | 'failed';

export interface QueuedMessage {
  id: string;
  request: SendMessageRequest;
  timestamp: number;
  retryCount: number;
  status: QueuedMessageStatus;
  error?: string;
}

const STORAGE_KEY = 'messaging_queue';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 3;

/**
 * Service de file d'attente pour les messages hors ligne
 * - Stockage dans localStorage
 * - Envoi automatique à la reconnexion
 * - Maximum 3 tentatives par message
 */
@Injectable({
  providedIn: 'root'
})
export class MessageQueueService implements OnDestroy {
  private queue: QueuedMessage[] = [];
  private queueSubject = new BehaviorSubject<QueuedMessage[]>([]);
  private subscriptions: Subscription[] = [];
  private isProcessing = false;

  public queue$ = this.queueSubject.asObservable();

  constructor(
    private wsService: StompWebsocketService,
    private apiService: MessageApiService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.loadFromStorage();
    this.setupConnectionListener();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Charge la queue depuis localStorage
   */
  private loadFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        // Réinitialiser les statuts "sending" à "pending"
        this.queue.forEach(msg => {
          if (msg.status === 'sending') {
            msg.status = 'pending';
          }
        });
        this.emitQueue();
      }
    } catch (e) {
      console.error('Erreur chargement queue:', e);
      this.queue = [];
    }
  }

  /**
   * Sauvegarde la queue dans localStorage
   */
  private saveToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (e) {
      console.error('Erreur sauvegarde queue:', e);
    }
  }

  /**
   * Configure le listener de connexion pour traiter la queue
   */
  private setupConnectionListener(): void {
    const sub = this.wsService.connectionStatus$.subscribe((status: ConnectionStatus) => {
      if (status === 'connected') {
        this.processQueue();
      }
    });
    this.subscriptions.push(sub);
  }

  /**
   * Ajoute un message à la queue
   */
  enqueue(request: SendMessageRequest): string {
    const id = this.generateId();
    
    const queuedMessage: QueuedMessage = {
      id,
      request,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    // Limiter la taille de la queue
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      // Supprimer le plus ancien message en échec ou le plus ancien
      const failedIndex = this.queue.findIndex(m => m.status === 'failed');
      if (failedIndex !== -1) {
        this.queue.splice(failedIndex, 1);
      } else {
        this.queue.shift();
      }
    }

    this.queue.push(queuedMessage);
    this.saveToStorage();
    this.emitQueue();

    // Essayer d'envoyer immédiatement si connecté
    if (this.wsService.isConnected()) {
      this.processQueue();
    }

    return id;
  }

  /**
   * Traite la queue (envoi des messages en attente)
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !this.wsService.isConnected()) {
      return;
    }

    this.isProcessing = true;

    const pendingMessages = this.queue.filter(m => m.status === 'pending');
    
    for (const message of pendingMessages) {
      await this.sendQueuedMessage(message);
    }

    this.isProcessing = false;
    this.saveToStorage();
    this.emitQueue();
  }

  /**
   * Envoie un message de la queue
   */
  private async sendQueuedMessage(message: QueuedMessage): Promise<void> {
    message.status = 'sending';
    message.retryCount++;
    this.emitQueue();

    try {
      // Essayer via WebSocket d'abord
      if (this.wsService.isConnected()) {
        this.wsService.sendMessage(message.request);
        message.status = 'sent';
        // Supprimer de la queue après succès
        this.removeFromQueue(message.id);
      } else {
        // Fallback vers REST API
        await this.apiService.sendMessage(message.request).toPromise();
        message.status = 'sent';
        this.removeFromQueue(message.id);
      }
    } catch (error: any) {
      console.error('Erreur envoi message:', error);
      
      if (message.retryCount >= MAX_RETRIES) {
        message.status = 'failed';
        message.error = error?.message || 'Échec après 3 tentatives';
      } else {
        message.status = 'pending';
      }
    }
  }

  /**
   * Retire un message de la queue
   */
  private removeFromQueue(id: string): void {
    const index = this.queue.findIndex(m => m.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.saveToStorage();
      this.emitQueue();
    }
  }

  /**
   * Retry manuel d'un message en échec
   */
  retryMessage(id: string): void {
    const message = this.queue.find(m => m.id === id);
    if (message && message.status === 'failed') {
      message.status = 'pending';
      message.retryCount = 0;
      message.error = undefined;
      this.saveToStorage();
      this.emitQueue();
      this.processQueue();
    }
  }

  /**
   * Supprime un message de la queue (abandon)
   */
  removeMessage(id: string): void {
    this.removeFromQueue(id);
  }

  /**
   * Récupère les messages en échec
   */
  getFailedMessages(): QueuedMessage[] {
    return this.queue.filter(m => m.status === 'failed');
  }

  /**
   * Récupère les messages en attente
   */
  getPendingMessages(): QueuedMessage[] {
    return this.queue.filter(m => m.status === 'pending' || m.status === 'sending');
  }

  /**
   * Récupère la taille de la queue
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Vide la queue
   */
  clearQueue(): void {
    this.queue = [];
    this.saveToStorage();
    this.emitQueue();
  }

  /**
   * Vide uniquement les messages en échec
   */
  clearFailedMessages(): void {
    this.queue = this.queue.filter(m => m.status !== 'failed');
    this.saveToStorage();
    this.emitQueue();
  }

  /**
   * Émet l'état actuel de la queue
   */
  private emitQueue(): void {
    this.queueSubject.next([...this.queue]);
  }

  /**
   * Génère un ID unique pour un message
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
