import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiErrorHandlerService {

  constructor() {}

  /**
   * Handle HTTP errors with context-specific messages
   */
  handleError(error: HttpErrorResponse, context: string): Observable<never> {
    let userMessage: string;
    
    switch (error.status) {
      case 400:
        userMessage = this.getBadRequestMessage(error, context);
        break;
      case 401:
        userMessage = 'Session expirée. Veuillez vous reconnecter.';
        // Could trigger logout here
        break;
      case 403:
        userMessage = 'Accès non autorisé à cette fonctionnalité.';
        break;
      case 404:
        userMessage = this.getNotFoundMessage(context);
        break;
      case 413:
        userMessage = 'Fichier trop volumineux. Taille maximale: 5MB.';
        break;
      case 415:
        userMessage = 'Format de fichier non supporté. Utilisez JPG, PNG ou GIF.';
        break;
      case 422:
        userMessage = 'Données invalides. Vérifiez les champs requis.';
        break;
      case 500:
        userMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        break;
      case 503:
        userMessage = 'Service temporairement indisponible. Réessayez dans quelques minutes.';
        break;
      default:
        userMessage = 'Une erreur inattendue s\'est produite.';
    }
    
    // Log error for debugging
    console.error(`API Error in ${context}:`, {
      status: error.status,
      message: error.message,
      url: error.url,
      error: error.error
    });
    
    return throwError(() => new Error(userMessage));
  }

  /**
   * Execute request with retry logic
   */
  executeWithRetry<T>(
    request: () => Observable<T>, 
    maxRetries: number = 3,
    context: string = 'unknown'
  ): Observable<T> {
    return request().pipe(
      retry({
        count: maxRetries,
        delay: (error, retryCount) => {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, retryCount - 1) * 1000;
          console.log(`Retry ${retryCount}/${maxRetries} for ${context} in ${delay}ms`);
          return timer(delay);
        }
      }),
      catchError(error => this.handleError(error, context))
    );
  }

  private getBadRequestMessage(error: HttpErrorResponse, context: string): string {
    // Try to extract specific error message from backend
    if (error.error?.message) {
      return `Erreur: ${error.error.message}`;
    }

    switch (context) {
      case 'programme-management':
        return 'Données du programme invalides. Vérifiez les champs requis.';
      case 'nutrition-plan':
        return 'Plan nutritionnel invalide. Vérifiez les aliments et quantités.';
      case 'challenge':
        return 'Défi invalide. Vérifiez les paramètres du défi.';
      case 'rapport-progres':
        return 'Impossible de générer le rapport. Vérifiez la période sélectionnée.';
      case 'admin':
        return 'Action administrative non autorisée ou données invalides.';
      default:
        return 'Données invalides. Veuillez vérifier votre saisie.';
    }
  }

  private getNotFoundMessage(context: string): string {
    switch (context) {
      case 'audit-logs':
        return 'Aucun log d\'audit trouvé pour ces critères.';
      case 'programme-management':
        return 'Programme non trouvé ou supprimé.';
      case 'nutrition-plan':
        return 'Plan nutritionnel non trouvé.';
      case 'challenge':
        return 'Défi non trouvé ou expiré.';
      case 'rapport-progres':
        return 'Rapport non trouvé.';
      case 'client':
        return 'Client non trouvé.';
      case 'admin':
        return 'Utilisateur ou ressource non trouvé.';
      default:
        return 'Ressource non trouvée.';
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error: HttpErrorResponse): boolean {
    return error.status >= 500 || error.status === 0 || error.status === 408;
  }

  /**
   * Get user-friendly error message for display
   */
  getDisplayMessage(error: any, context: string = 'unknown'): string {
    if (error instanceof Error) {
      return error.message;
    }
    
    if (error instanceof HttpErrorResponse) {
      return this.getBadRequestMessage(error, context);
    }
    
    return 'Une erreur inattendue s\'est produite.';
  }
}