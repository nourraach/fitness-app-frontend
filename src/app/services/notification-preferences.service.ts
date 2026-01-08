import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, of } from 'rxjs';
import { map, catchError, tap, shareReplay } from 'rxjs/operators';

import { NotificationPreferences, NotificationPreferencesUpdateRequest, ApiResponse, ErrorResponse } from '../models/notification-preferences.model';
import { JwtService } from '../service/jwt.service';
import { ApiErrorHandlerService } from './api-error-handler.service';

const BASE_URL = "http://localhost:8095/";

@Injectable({
  providedIn: 'root'
})
export class NotificationPreferencesService {
  private preferencesCache$ = new BehaviorSubject<NotificationPreferences | null>(null);
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private http: HttpClient,
    private jwtService: JwtService,
    private errorHandler: ApiErrorHandlerService
  ) {}

  /**
   * Récupère les préférences de notification pour l'utilisateur connecté
   */
  getUserPreferences(): Observable<NotificationPreferences> {
    const userId = this.jwtService.getUserId();
    
    if (!userId) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }

    // Vérifier le cache
    if (this.isCacheValid()) {
      const cachedPreferences = this.preferencesCache$.value;
      if (cachedPreferences) {
        console.log('📦 Utilisation du cache pour les préférences');
        return of(cachedPreferences);
      }
    }

    console.log('🔄 Chargement des préférences depuis l\'API pour userId:', userId);

    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Token d\'authentification manquant'));
    }

    return this.http.get<ApiResponse<NotificationPreferences>>(
      `${BASE_URL}api/notifications/preferences/by-user-id?userId=${userId}`,
      { headers }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || 'Erreur lors du chargement des préférences');
        }
      }),
      tap(preferences => {
        // Mettre à jour le cache
        this.updateCache(preferences);
        this.saveToLocalStorage(preferences, userId);
        console.log('✅ Préférences chargées et mises en cache:', preferences);
      }),
      catchError(error => {
        // Si le backend n'est pas disponible (404), charger depuis localStorage ou créer des valeurs par défaut
        if (error.status === 404) {
          console.warn('⚠️ Endpoint backend non disponible, chargement local');
          const localPrefs = this.loadFromLocalStorage(userId);
          if (localPrefs) {
            this.updateCache(localPrefs);
            return of(localPrefs);
          }
          // Créer des préférences par défaut
          const defaultPrefs = this.createDefaultPreferences();
          this.updateCache(defaultPrefs);
          this.saveToLocalStorage(defaultPrefs, userId);
          return of(defaultPrefs);
        }
        return this.handleApiError(error, 'getUserPreferences');
      }),
      shareReplay(1)
    );
  }

  /**
   * Met à jour les préférences de notification
   */
  updatePreferences(preferences: NotificationPreferencesUpdateRequest): Observable<NotificationPreferences> {
    const userId = this.jwtService.getUserId();
    
    if (!userId) {
      return throwError(() => new Error('Utilisateur non connecté'));
    }

    console.log('💾 Sauvegarde des préférences pour userId:', userId, preferences);

    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Token d\'authentification manquant'));
    }

    // Valider les données avant envoi
    const validatedPreferences = this.validatePreferences(preferences);

    return this.http.put<ApiResponse<NotificationPreferences>>(
      `${BASE_URL}api/notifications/preferences/by-user-id?userId=${userId}`,
      validatedPreferences,
      { headers }
    ).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        } else {
          throw new Error(response.error || 'Erreur lors de la sauvegarde des préférences');
        }
      }),
      tap(updatedPreferences => {
        // Mettre à jour le cache avec les nouvelles préférences
        this.updateCache(updatedPreferences);
        this.saveToLocalStorage(updatedPreferences, userId);
        console.log('✅ Préférences sauvegardées et cache mis à jour:', updatedPreferences);
      }),
      catchError(error => {
        // Si le backend n'est pas disponible (404), sauvegarder localement
        if (error.status === 404) {
          console.warn('⚠️ Endpoint backend non disponible, sauvegarde locale');
          const localPrefs = this.saveToLocalStorage(validatedPreferences as NotificationPreferences, userId);
          this.updateCache(localPrefs);
          return of(localPrefs);
        }
        return this.handleApiError(error, 'updatePreferences');
      })
    );
  }

  /**
   * Sauvegarde les préférences dans le localStorage
   */
  private saveToLocalStorage(preferences: NotificationPreferences, userId: number): NotificationPreferences {
    const key = `notification_preferences_${userId}`;
    localStorage.setItem(key, JSON.stringify(preferences));
    console.log('💾 Préférences sauvegardées localement');
    return preferences;
  }

  /**
   * Charge les préférences depuis le localStorage
   */
  private loadFromLocalStorage(userId: number): NotificationPreferences | null {
    const key = `notification_preferences_${userId}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Invalide le cache des préférences
   */
  invalidateCache(): void {
    this.preferencesCache$.next(null);
    this.cacheTimestamp = 0;
    console.log('🗑️ Cache des préférences invalidé');
  }

  /**
   * Obtient les préférences depuis le cache (si disponible)
   */
  getCachedPreferences(): NotificationPreferences | null {
    return this.isCacheValid() ? this.preferencesCache$.value : null;
  }

  /**
   * Crée les headers d'autorisation avec le token JWT
   */
  private createAuthorizationHeader(): HttpHeaders | null {
    const token = this.jwtService.getToken();
    
    if (!token) {
      console.error('❌ Aucun token JWT trouvé');
      return null;
    }

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Valide les préférences avant envoi au backend
   */
  private validatePreferences(preferences: NotificationPreferencesUpdateRequest): NotificationPreferencesUpdateRequest {
    const validated = { ...preferences };

    // Normalisation et validation des heures (format HH:mm)
    const timeFields = [
      'breakfastTime', 'lunchTime', 'dinnerTime', 
      'morningSnackTime', 'afternoonSnackTime',
      'defaultWorkoutTime', 'quietTimeStart', 'quietTimeEnd'
    ];

    timeFields.forEach(field => {
      const value = (validated as any)[field];
      if (value) {
        // Normaliser le format HH:mm:ss vers HH:mm
        const normalizedTime = this.normalizeTimeFormat(value);
        if (!normalizedTime) {
          console.warn(`Format d'heure invalide pour ${field}: ${value}, utilisation de la valeur par défaut`);
          // Utiliser une valeur par défaut au lieu de lancer une erreur
          (validated as any)[field] = '12:00';
        } else {
          (validated as any)[field] = normalizedTime;
        }
      }
    });

    // Validation de la fréquence motivationnelle
    if (validated.motivationalFrequency !== undefined) {
      if (validated.motivationalFrequency < 1 || validated.motivationalFrequency > 7) {
        validated.motivationalFrequency = 3; // Valeur par défaut
      }
    }

    // Validation du nombre maximum de notifications
    if (validated.maxNotificationsPerDay !== undefined) {
      if (validated.maxNotificationsPerDay < 1 || validated.maxNotificationsPerDay > 50) {
        validated.maxNotificationsPerDay = 10; // Valeur par défaut
      }
    }

    // Validation des jours actifs - s'assurer qu'au moins un jour est sélectionné
    if (!validated.activeDays || validated.activeDays.length === 0) {
      validated.activeDays = ['MONDAY', 'WEDNESDAY', 'FRIDAY']; // Valeurs par défaut
    }

    return validated;
  }

  /**
   * Normalise le format d'heure vers HH:mm
   * Accepte HH:mm, HH:mm:ss, H:mm, etc.
   */
  private normalizeTimeFormat(time: string): string | null {
    if (!time) return null;
    
    // Si c'est déjà au format HH:mm
    const shortFormat = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
    if (shortFormat.test(time)) {
      const [hours, minutes] = time.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
    
    // Si c'est au format HH:mm:ss
    const longFormat = /^([01]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/;
    if (longFormat.test(time)) {
      const [hours, minutes] = time.split(':');
      return `${hours.padStart(2, '0')}:${minutes}`;
    }
    
    return null;
  }

  /**
   * Valide le format d'heure HH:mm ou HH:mm:ss
   */
  private isValidTimeFormat(time: string): boolean {
    const shortFormat = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    const longFormat = /^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
    return shortFormat.test(time) || longFormat.test(time);
  }

  /**
   * Met à jour le cache avec les nouvelles préférences
   */
  private updateCache(preferences: NotificationPreferences): void {
    this.preferencesCache$.next(preferences);
    this.cacheTimestamp = Date.now();
  }

  /**
   * Vérifie si le cache est encore valide
   */
  private isCacheValid(): boolean {
    return (Date.now() - this.cacheTimestamp) < this.CACHE_TTL;
  }

  /**
   * Gère les erreurs API avec des messages spécifiques
   */
  private handleApiError(error: HttpErrorResponse, context: string): Observable<never> {
    console.error(`❌ Erreur API dans ${context}:`, error);

    // Gestion spécifique des erreurs de validation (400)
    if (error.status === 400 && error.error) {
      let errorMessage = 'Données invalides';
      
      // Extraire le message d'erreur du backend
      if (error.error.error) {
        errorMessage = error.error.error;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      }

      return throwError(() => new Error(errorMessage));
    }

    // Gestion des erreurs d'authentification (401)
    if (error.status === 401) {
      console.warn('🔐 Token expiré, déconnexion nécessaire');
      this.jwtService.logout();
      return throwError(() => new Error('Session expirée. Veuillez vous reconnecter.'));
    }

    // Utiliser le service d'erreur existant pour les autres cas
    return this.errorHandler.handleError(error, 'notification-preferences');
  }

  /**
   * Crée des préférences par défaut pour les tests
   */
  createDefaultPreferences(): NotificationPreferences {
    return {
      notifications: true,
      email: true,
      push: true,
      mealRemindersEnabled: true,
      breakfastTime: '08:00',
      lunchTime: '12:30',
      dinnerTime: '19:00',
      snackRemindersEnabled: false,
      morningSnackTime: '10:00',
      afternoonSnackTime: '16:00',
      workoutRemindersEnabled: true,
      defaultWorkoutTime: '18:00',
      motivationalMessagesEnabled: true,
      motivationalFrequency: 3,
      activeDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
      quietTimeEnabled: true,
      quietTimeStart: '22:00',
      quietTimeEnd: '07:00',
      maxNotificationsPerDay: 10,
      hydrationRemindersEnabled: true,
      hydrationIntervalMinutes: 120,
      weatherBasedSuggestionsEnabled: true,
      timezoneAdaptationEnabled: true
    };
  }
}