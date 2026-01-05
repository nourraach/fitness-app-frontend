import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { StorageService } from '../service/storage-service.service';
import { ApiErrorHandlerService } from './api-error-handler.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthEnhancedService {
  private apiUrl = 'http://localhost:8095/auth'; // CORRECTION: Utilise /auth au lieu de /api/auth
  private currentUserSubject = new BehaviorSubject<any>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);

  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private errorHandler: ApiErrorHandlerService
  ) {
    this.initializeAuth();
  }

  /**
   * Connexion utilisateur
   * CORRECTION: Utilise POST /auth/login
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.errorHandler.executeWithRetry(
      () => this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials),
      3,
      'auth-login'
    ).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      })
    );
  }

  /**
   * Inscription utilisateur
   * CORRECTION: Utilise POST /auth/register
   */
  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.errorHandler.executeWithRetry(
      () => this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData),
      3,
      'auth-register'
    ).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      })
    );
  }

  /**
   * Rafraîchir le token
   * CORRECTION: Utilise POST /auth/refresh
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.storageService.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    return this.errorHandler.executeWithRetry(
      () => this.http.post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken }),
      2,
      'auth-refresh'
    ).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      }),
      catchError(error => {
        // Si le refresh échoue, déconnecter l'utilisateur
        this.logout();
        throw error;
      })
    );
  }

  /**
   * Déconnexion utilisateur
   */
  logout(): void {
    // Nettoyer le stockage local
    this.storageService.removeItem('jwt');
    this.storageService.removeItem('refreshToken');
    this.storageService.removeItem('user');
    
    // Mettre à jour les subjects
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    const token = this.storageService.getItem('jwt');
    if (!token) return false;

    // Vérifier si le token n'est pas expiré
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Obtenir l'utilisateur actuel
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Obtenir le token JWT
   */
  getToken(): string | null {
    return this.storageService.getItem('jwt');
  }

  /**
   * Vérifier le rôle de l'utilisateur
   */
  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user && user.role === role;
  }

  /**
   * Vérifier si l'utilisateur est admin
   */
  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  /**
   * Vérifier si l'utilisateur est coach
   */
  isCoach(): boolean {
    return this.hasRole('COACH');
  }

  /**
   * Vérifier si l'utilisateur est client
   */
  isClient(): boolean {
    return this.hasRole('CLIENT');
  }

  private initializeAuth(): void {
    const token = this.storageService.getItem('jwt');
    const userStr = this.storageService.getItem('user');

    if (token && userStr && this.isAuthenticated()) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
        this.isAuthenticatedSubject.next(true);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        this.logout();
      }
    }
  }

  private handleAuthSuccess(response: AuthResponse): void {
    // Stocker les tokens et les informations utilisateur
    this.storageService.setItem('jwt', response.token);
    this.storageService.setItem('refreshToken', response.refreshToken);
    this.storageService.setItem('user', JSON.stringify(response.user));

    // Mettre à jour les subjects
    this.currentUserSubject.next(response.user);
    this.isAuthenticatedSubject.next(true);
  }
}