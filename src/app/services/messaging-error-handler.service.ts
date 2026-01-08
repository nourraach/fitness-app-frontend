import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';

export interface MessagingError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
  canRetry: boolean;
}

/**
 * Service de gestion des erreurs pour la messagerie
 * Tous les messages sont en français
 */
@Injectable({
  providedIn: 'root'
})
export class MessagingErrorHandlerService {
  private lastErrorSubject = new BehaviorSubject<MessagingError | null>(null);
  public lastError$ = this.lastErrorSubject.asObservable();

  /**
   * Mappe les codes HTTP aux messages d'erreur en français
   */
  private readonly errorMessages: { [key: number]: { message: string; canRetry: boolean } } = {
    400: {
      message: 'Vous ne pouvez pas envoyer de message à cet utilisateur',
      canRetry: false
    },
    401: {
      message: 'Session expirée, veuillez vous reconnecter',
      canRetry: false
    },
    403: {
      message: 'Accès non autorisé',
      canRetry: false
    },
    404: {
      message: 'Conversation introuvable',
      canRetry: false
    },
    408: {
      message: 'Délai d\'attente dépassé, veuillez réessayer',
      canRetry: true
    },
    429: {
      message: 'Trop de requêtes, veuillez patienter',
      canRetry: true
    },
    500: {
      message: 'Erreur serveur, veuillez réessayer',
      canRetry: true
    },
    502: {
      message: 'Service temporairement indisponible',
      canRetry: true
    },
    503: {
      message: 'Service en maintenance, veuillez réessayer plus tard',
      canRetry: true
    },
    504: {
      message: 'Délai d\'attente du serveur dépassé',
      canRetry: true
    }
  };

  /**
   * Messages d'erreur pour les erreurs réseau/WebSocket
   */
  private readonly networkErrors: { [key: string]: { message: string; canRetry: boolean } } = {
    'network_offline': {
      message: 'Connexion perdue, message en attente d\'envoi',
      canRetry: true
    },
    'websocket_disconnected': {
      message: 'Connexion temps réel interrompue, reconnexion en cours...',
      canRetry: true
    },
    'websocket_error': {
      message: 'Erreur de connexion temps réel',
      canRetry: true
    },
    'message_too_long': {
      message: 'Le message ne peut pas dépasser 2000 caractères',
      canRetry: false
    },
    'message_empty': {
      message: 'Le message ne peut pas être vide',
      canRetry: false
    },
    'invalid_recipient': {
      message: 'Destinataire invalide',
      canRetry: false
    },
    'queue_full': {
      message: 'File d\'attente pleine, veuillez réessayer plus tard',
      canRetry: true
    },
    'max_retries': {
      message: 'Échec après plusieurs tentatives, veuillez réessayer manuellement',
      canRetry: true
    },
    'unknown': {
      message: 'Une erreur inattendue s\'est produite',
      canRetry: true
    }
  };

  /**
   * Gère une erreur HTTP
   */
  handleHttpError(error: HttpErrorResponse): MessagingError {
    const errorInfo = this.errorMessages[error.status] || {
      message: 'Une erreur inattendue s\'est produite',
      canRetry: true
    };

    const messagingError: MessagingError = {
      code: `HTTP_${error.status}`,
      message: errorInfo.message,
      details: error.error?.message || error.message,
      timestamp: new Date(),
      canRetry: errorInfo.canRetry
    };

    this.lastErrorSubject.next(messagingError);
    return messagingError;
  }

  /**
   * Gère une erreur réseau/WebSocket
   */
  handleNetworkError(errorType: string, details?: string): MessagingError {
    const errorInfo = this.networkErrors[errorType] || this.networkErrors['unknown'];

    const messagingError: MessagingError = {
      code: errorType.toUpperCase(),
      message: errorInfo.message,
      details,
      timestamp: new Date(),
      canRetry: errorInfo.canRetry
    };

    this.lastErrorSubject.next(messagingError);
    return messagingError;
  }

  /**
   * Gère une erreur de validation
   */
  handleValidationError(field: string, message: string): MessagingError {
    const messagingError: MessagingError = {
      code: `VALIDATION_${field.toUpperCase()}`,
      message,
      timestamp: new Date(),
      canRetry: false
    };

    this.lastErrorSubject.next(messagingError);
    return messagingError;
  }

  /**
   * Efface la dernière erreur
   */
  clearError(): void {
    this.lastErrorSubject.next(null);
  }

  /**
   * Récupère un message d'erreur pour un code HTTP
   */
  getErrorMessageForStatus(status: number): string {
    return this.errorMessages[status]?.message || 'Une erreur inattendue s\'est produite';
  }

  /**
   * Récupère un message d'erreur pour un type d'erreur réseau
   */
  getNetworkErrorMessage(errorType: string): string {
    return this.networkErrors[errorType]?.message || this.networkErrors['unknown'].message;
  }

  /**
   * Vérifie si une erreur permet un retry
   */
  canRetryError(error: MessagingError): boolean {
    return error.canRetry;
  }

  /**
   * Formate une erreur pour l'affichage
   */
  formatErrorForDisplay(error: MessagingError): string {
    return error.message;
  }

  /**
   * Log une erreur (pour debugging)
   */
  logError(context: string, error: any): void {
    console.error(`[Messagerie - ${context}]`, error);
  }
}
