import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, Observable, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { StompWebsocketService } from './stomp-websocket.service';
import { TypingIndicatorDTO } from '../models/message.model';

interface TypingState {
  userId: number;
  username: string;
  isTyping: boolean;
  lastUpdate: number;
}

/**
 * Service de gestion des indicateurs de frappe
 * - Debounce de 2 secondes pour l'envoi
 * - Auto-masquage après 3 secondes sans mise à jour
 */
@Injectable({
  providedIn: 'root'
})
export class TypingIndicatorService implements OnDestroy {
  // Délais en millisecondes
  private readonly TYPING_DEBOUNCE_MS = 2000; // 2 secondes avant d'envoyer typing: false
  private readonly TYPING_TIMEOUT_MS = 3000;  // 3 secondes pour auto-masquer
  private readonly CLEANUP_INTERVAL_MS = 1000; // Vérification toutes les secondes

  // État des utilisateurs en train de taper
  private typingUsersMap = new Map<number, TypingState>();
  private typingUsersSubject = new BehaviorSubject<TypingState[]>([]);
  
  // Gestion du debounce pour l'envoi
  private typingInputSubject = new Subject<{ recipientId: number; isTyping: boolean }>();
  private lastTypingState = new Map<number, boolean>();
  private typingTimers = new Map<number, ReturnType<typeof setTimeout>>();
  
  // Subscriptions
  private subscriptions: Subscription[] = [];
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  // Observable public
  public typingUsers$ = this.typingUsersSubject.asObservable();

  constructor(private wsService: StompWebsocketService) {
    this.setupTypingSubscription();
    this.setupDebounce();
    this.startCleanupInterval();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.typingTimers.forEach(timer => clearTimeout(timer));
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Configure la subscription aux indicateurs de frappe reçus
   */
  private setupTypingSubscription(): void {
    const sub = this.wsService.typing$.subscribe((indicator: TypingIndicatorDTO) => {
      this.handleReceivedTypingIndicator(indicator);
    });
    this.subscriptions.push(sub);
  }

  /**
   * Configure le debounce pour l'envoi des indicateurs
   */
  private setupDebounce(): void {
    const sub = this.typingInputSubject.pipe(
      distinctUntilChanged((prev, curr) => 
        prev.recipientId === curr.recipientId && prev.isTyping === curr.isTyping
      )
    ).subscribe(({ recipientId, isTyping }) => {
      this.wsService.sendTypingIndicator(recipientId, isTyping);
    });
    this.subscriptions.push(sub);
  }

  /**
   * Démarre l'intervalle de nettoyage des indicateurs expirés
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredIndicators();
    }, this.CLEANUP_INTERVAL_MS);
  }

  /**
   * Appelé quand l'utilisateur tape dans le champ de message
   * Gère le debounce automatique
   */
  onUserTyping(recipientId: number): void {
    // Envoyer typing: true immédiatement si pas déjà en train de taper
    const currentState = this.lastTypingState.get(recipientId);
    if (!currentState) {
      this.typingInputSubject.next({ recipientId, isTyping: true });
      this.lastTypingState.set(recipientId, true);
    }

    // Annuler le timer précédent
    const existingTimer = this.typingTimers.get(recipientId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Créer un nouveau timer pour envoyer typing: false après 2 secondes
    const timer = setTimeout(() => {
      this.typingInputSubject.next({ recipientId, isTyping: false });
      this.lastTypingState.set(recipientId, false);
      this.typingTimers.delete(recipientId);
    }, this.TYPING_DEBOUNCE_MS);

    this.typingTimers.set(recipientId, timer);
  }

  /**
   * Appelé quand l'utilisateur arrête de taper (blur, envoi, etc.)
   */
  onUserStoppedTyping(recipientId: number): void {
    // Annuler le timer
    const existingTimer = this.typingTimers.get(recipientId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.typingTimers.delete(recipientId);
    }

    // Envoyer typing: false immédiatement
    if (this.lastTypingState.get(recipientId)) {
      this.typingInputSubject.next({ recipientId, isTyping: false });
      this.lastTypingState.set(recipientId, false);
    }
  }

  /**
   * Gère un indicateur de frappe reçu
   */
  private handleReceivedTypingIndicator(indicator: TypingIndicatorDTO): void {
    const now = Date.now();

    if (indicator.typing) {
      // Ajouter ou mettre à jour l'utilisateur
      this.typingUsersMap.set(indicator.userId, {
        userId: indicator.userId,
        username: indicator.username,
        isTyping: true,
        lastUpdate: now
      });
    } else {
      // Supprimer l'utilisateur
      this.typingUsersMap.delete(indicator.userId);
    }

    this.emitTypingUsers();
  }

  /**
   * Nettoie les indicateurs expirés (> 3 secondes sans mise à jour)
   */
  private cleanupExpiredIndicators(): void {
    const now = Date.now();
    let hasChanges = false;

    this.typingUsersMap.forEach((state, userId) => {
      if (now - state.lastUpdate > this.TYPING_TIMEOUT_MS) {
        this.typingUsersMap.delete(userId);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.emitTypingUsers();
    }
  }

  /**
   * Émet la liste des utilisateurs en train de taper
   */
  private emitTypingUsers(): void {
    const users = Array.from(this.typingUsersMap.values());
    this.typingUsersSubject.next(users);
  }

  /**
   * Vérifie si un utilisateur spécifique est en train de taper
   */
  isUserTyping(userId: number): boolean {
    return this.typingUsersMap.has(userId);
  }

  /**
   * Récupère le texte d'affichage pour les indicateurs de frappe
   * Ex: "Jean est en train d'écrire..." ou "Jean et Marie sont en train d'écrire..."
   */
  getTypingText(conversationUserId?: number): string {
    const users = Array.from(this.typingUsersMap.values());
    
    // Filtrer par conversation si spécifié
    const relevantUsers = conversationUserId 
      ? users.filter(u => u.userId === conversationUserId)
      : users;

    if (relevantUsers.length === 0) {
      return '';
    }

    if (relevantUsers.length === 1) {
      return `${relevantUsers[0].username} est en train d'écrire...`;
    }

    const names = relevantUsers.map(u => u.username);
    const lastUser = names.pop();
    return `${names.join(', ')} et ${lastUser} sont en train d'écrire...`;
  }

  /**
   * Réinitialise tous les états
   */
  reset(): void {
    this.typingUsersMap.clear();
    this.lastTypingState.clear();
    this.typingTimers.forEach(timer => clearTimeout(timer));
    this.typingTimers.clear();
    this.emitTypingUsers();
  }
}
