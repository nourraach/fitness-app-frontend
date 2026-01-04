import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retryWhen, mergeMap, finalize } from 'rxjs/operators';

export interface ErrorContext {
  operation?: string;
  userMessage?: string;
  showToUser?: boolean;
  retryable?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiErrorHandlerService {
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor() {}

  handleError(error: HttpErrorResponse, context?: ErrorContext): Observable<never> {
    let userMessage = this.getUserFriendlyMessage(error, context);
    
    console.error('API Error:', {
      status: error.status,
      message: error.message,
      url: error.url,
      context: context
    });

    // Show user-friendly message if configured
    if (context?.showToUser !== false) {
      this.showErrorToUser(userMessage);
    }

    return throwError(() => ({
      originalError: error,
      userMessage: userMessage,
      context: context
    }));
  }

  createRetryStrategy(context?: ErrorContext) {
    return (errors: Observable<any>) => {
      return errors.pipe(
        mergeMap((error, index) => {
          const retryAttempt = index + 1;
          
          // Don't retry if not retryable or max retries exceeded
          if (!this.isRetryable(error) || retryAttempt > this.maxRetries) {
            return throwError(() => error);
          }

          console.log(`Retry attempt ${retryAttempt} for ${context?.operation || 'operation'}`);
          
          // Exponential backoff
          const delay = this.retryDelay * Math.pow(2, index);
          return timer(delay);
        }),
        finalize(() => {
          console.log('Retry strategy completed');
        })
      );
    };
  }

  private getUserFriendlyMessage(error: HttpErrorResponse, context?: ErrorContext): string {
    // Use custom message if provided
    if (context?.userMessage) {
      return context.userMessage;
    }

    // Handle specific HTTP status codes
    switch (error.status) {
      case 0:
        return 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      
      case 400:
        return this.handleBadRequest(error);
      
      case 401:
        return 'Votre session a expiré. Veuillez vous reconnecter.';
      
      case 403:
        return 'Vous n\'avez pas les permissions nécessaires pour cette action.';
      
      case 404:
        return 'La ressource demandée n\'a pas été trouvée.';
      
      case 409:
        return 'Cette action ne peut pas être effectuée car elle entre en conflit avec des données existantes.';
      
      case 413:
        return 'Le fichier est trop volumineux. Veuillez choisir un fichier plus petit.';
      
      case 415:
        return 'Le format de fichier n\'est pas supporté.';
      
      case 422:
        return this.handleValidationError(error);
      
      case 429:
        return 'Trop de requêtes. Veuillez patienter avant de réessayer.';
      
      case 500:
        return 'Une erreur interne du serveur s\'est produite. Veuillez réessayer plus tard.';
      
      case 502:
      case 503:
      case 504:
        return 'Le service est temporairement indisponible. Veuillez réessayer dans quelques minutes.';
      
      default:
        return `Une erreur inattendue s'est produite (${error.status}). Veuillez réessayer.`;
    }
  }

  private handleBadRequest(error: HttpErrorResponse): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.error?.errors && Array.isArray(error.error.errors)) {
      return error.error.errors.join(', ');
    }
    return 'Les données fournies ne sont pas valides.';
  }

  private handleValidationError(error: HttpErrorResponse): string {
    if (error.error?.fieldErrors) {
      const fieldErrors = Object.entries(error.error.fieldErrors)
        .map(([field, message]) => `${field}: ${message}`)
        .join(', ');
      return `Erreurs de validation: ${fieldErrors}`;
    }
    return 'Les données fournies ne respectent pas les critères de validation.';
  }

  private isRetryable(error: HttpErrorResponse): boolean {
    // Retry on network errors and server errors (5xx)
    return error.status === 0 || (error.status >= 500 && error.status < 600);
  }

  private showErrorToUser(message: string): void {
    // This could be integrated with a toast service or notification system
    console.warn('User Error Message:', message);
    
    // For now, we'll just log it. In a real app, you'd show this in a toast/snackbar
    // Example: this.toastService.error(message);
  }

  // Utility method to wrap HTTP calls with error handling
  wrapHttpCall<T>(
    httpCall: Observable<T>, 
    context?: ErrorContext
  ): Observable<T> {
    return httpCall.pipe(
      retryWhen(this.createRetryStrategy(context)),
      // Add error handling here if needed
    );
  }

  // Method to check if an error should trigger a logout
  shouldLogout(error: HttpErrorResponse): boolean {
    return error.status === 401;
  }

  // Method to extract error details for logging
  extractErrorDetails(error: HttpErrorResponse): any {
    return {
      status: error.status,
      statusText: error.statusText,
      url: error.url,
      message: error.message,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    };
  }
}