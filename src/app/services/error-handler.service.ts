import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface BackendError {
  erreur: string;
  success: boolean;
  count?: number;
  users?: any[];
  conversations?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {

  constructor() { }

  /**
   * Extract error message from the new consistent JSON error responses
   * @param error HTTP error response
   * @returns User-friendly error message
   */
  extractErrorMessage(error: HttpErrorResponse): string {
    // Handle new consistent JSON error format
    if (error.error && typeof error.error === 'object') {
      const backendError = error.error as BackendError;
      
      if (backendError.erreur) {
        return backendError.erreur;
      }
    }

    // Fallback for other error types
    if (error.message) {
      return error.message;
    }

    // Default error message based on status code
    switch (error.status) {
      case 400:
        return 'Requête invalide. Veuillez vérifier les données envoyées.';
      case 401:
        return 'Non autorisé. Veuillez vous reconnecter.';
      case 403:
        return 'Accès interdit. Vous n\'avez pas les permissions nécessaires.';
      case 404:
        return 'Ressource non trouvée.';
      case 405:
        return 'Méthode non autorisée.';
      case 500:
        return 'Erreur interne du serveur. Veuillez réessayer plus tard.';
      default:
        return 'Une erreur inattendue s\'est produite.';
    }
  }

  /**
   * Check if the error response indicates success=false from backend
   * @param error HTTP error response
   * @returns true if backend explicitly returned success=false
   */
  isBackendError(error: HttpErrorResponse): boolean {
    return error.error && 
           typeof error.error === 'object' && 
           error.error.success === false;
  }

  /**
   * Log error details for debugging
   * @param context Context where the error occurred
   * @param error HTTP error response
   */
  logError(context: string, error: HttpErrorResponse): void {
    console.group(`🚨 Erreur dans ${context}`);
    console.error('Status:', error.status);
    console.error('Message:', this.extractErrorMessage(error));
    
    if (this.isBackendError(error)) {
      console.error('Erreur backend:', error.error);
    } else {
      console.error('Erreur complète:', error);
    }
    
    console.groupEnd();
  }

  /**
   * Handle array responses that might be null (though backend now guarantees arrays)
   * @param response Response that should be an array
   * @returns Safe array (never null)
   */
  ensureArray<T>(response: T[] | null | undefined): T[] {
    // Backend now guarantees arrays instead of null, but keeping this for safety
    return Array.isArray(response) ? response : [];
  }

  /**
   * Extract data from wrapped response format
   * @param response Backend response that might be wrapped
   * @param dataKey Key to extract data from (e.g., 'users', 'conversations')
   * @returns Extracted data or empty array
   */
  extractData<T>(response: any, dataKey: string): T[] {
    if (response && response[dataKey]) {
      return this.ensureArray(response[dataKey]);
    }
    
    // Fallback to direct array response
    return this.ensureArray(response);
  }
}