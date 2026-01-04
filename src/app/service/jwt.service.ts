import { jwtDecode } from 'jwt-decode';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, throwError } from 'rxjs';
import { StorageService } from './storage-service.service';

  const BASE_URL = "http://localhost:8095/";

@Injectable({
  providedIn: 'root'
})
export class JwtService {
  private adminStatusSubject = new BehaviorSubject<boolean>(false);
  adminStatus$ = this.adminStatusSubject.asObservable();
  
  constructor(private http: HttpClient, private storageService: StorageService) {}

  register(signRequest: any): Observable<any> {
    return this.http.post(BASE_URL + 'signup', signRequest);
  }

  login(loginRequest: any): Observable<any> {
    return this.http.post(BASE_URL + 'login', loginRequest).pipe(
      tap((response: any) => {
        // Check for both 'jwt' and 'token' properties in response
        const token = response.jwt || response.token;
        if (token) {
          this.storageService.setItem('jwt', token);
          console.log("🔐 JWT stocké avec succès :", token);
          this.updateAdminStatus();
        } else {
          console.error("Aucun token trouvé dans la réponse:", response);
        }
      })
    );
  }

  verifyCode(code: string): Observable<any> {
    const email = this.getEmail();
    
    if (!email) {
      return throwError(() => new Error('Email introuvable. Veuillez vous reconnecter.'));
    }
  
    const payload = { email, code };
  
    const headers = this.createAuthorizationHeader();
  
    console.log("Payload envoyé :", payload);
    console.log("Headers envoyés :", headers);
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.post(BASE_URL + 'api/auth/verify-code', payload, { headers });
  }
  
  private createAuthorizationHeader(): HttpHeaders | null {
    const jwtToken = this.storageService.getItem('jwt');
    if (jwtToken) {
      console.log("JWT token trouvé :", jwtToken.substring(0, 50) + "...");
      return new HttpHeaders()
        .set("Authorization", "Bearer " + jwtToken)
        .set("Content-Type", "application/json");
    }
    console.error("Aucun JWT trouvé dans localStorage.");
    return null;
  }


  gestionUsers(): Observable<any> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      console.error('Aucun JWT trouvé. Impossible de continuer.');
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.get(BASE_URL + 'api/users', { headers });
  }

 
  getRole(): string | null {
    const token = this.storageService.getItem('jwt');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        console.log('Token décodé :', decodedToken);
        return decodedToken.role || null;
      } catch (error) {
        console.error('Erreur lors du décodage du token JWT', error);
        return null;
      }
    }
    return null;
  }

  updateAdminStatus(): void {
    const role = this.getRole();
    const isAdmin = role === 'ROLE_ADMIN';
    this.adminStatusSubject.next(isAdmin); // Mettre à jour le BehaviorSubject
  }
  getEmail(): string | null {
    const token = this.storageService.getItem('jwt');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        console.log('Email du token :', decodedToken.email);
        return decodedToken.email || null;
      } catch (error) {
        console.error('Erreur lors du décodage du token JWT', error);
        return null;
      }
    }
    return null;
  }

  getUserId(): number | null {
    const token = this.storageService.getItem('jwt');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        console.log('ID utilisateur du token :', decodedToken.id || decodedToken.userId || decodedToken.sub);
        return decodedToken.id || decodedToken.userId || decodedToken.sub || null;
      } catch (error) {
        console.error('Erreur lors du décodage du token JWT', error);
        return null;
      }
    }
    return null;
  }

  getUserName(): string | null {
    const token = this.storageService.getItem('jwt');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        return decodedToken.name || decodedToken.username || null;
      } catch (error) {
        console.error('Erreur lors du décodage du token JWT', error);
        return null;
      }
    }
    return null;
  }
  
  getPhoneNumber(): string | null {
    const token = this.storageService.getItem('jwt');
    if (token) {
      try {
        const decodedToken: any = jwtDecode(token);
        console.log('Numéro de téléphone du token :', decodedToken.phoneNumber);
        return decodedToken.phoneNumber || null;
      } catch (error) {
        console.error('Erreur lors du décodage du token JWT', error);
        return null;
      }
    }
    return null;
  }


  isAdmin(): boolean {
    const role = this.getRole();
    console.log('Rôle récupéré depuis le token JWT :', role);
    return role === 'ROLE_ADMIN';
  }

  deleteUser(userId: number): Observable<any> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.delete(BASE_URL + `api/users/${userId}`, { headers });
  }

  getUserById(userId: number): Observable<any> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.get(BASE_URL + `api/users/${userId}`, { headers });
  }
  updateUser(userId: number, userData: any): Observable<any> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
  
    // Construire le payload pour correspondre au backend
    const payload = {
      name: userData.name,
      email: userData.email,
   
      profile: {
        role: userData.profile.role, // Inclure le rôle
      },
      structureId: userData.structure.id,
        
    };
  
    console.log('Payload envoyé au backend:', payload);
    console.log('Headers:', headers);
  
    return this.http.put(BASE_URL + `api/users/${userId}`, payload, { headers });
  }

decodeToken(token: string): any {
  try {
    return JSON.parse(atob(token.split('.')[1])); // Décodage de la charge utile du JWT
  } catch (e) {
    console.error('Erreur de décodage du token', e);
    return null;
  }
}
  getToken(): string | null {
    return this.storageService.getItem('jwt');
  }

  isTokenValid(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }

    try {
      const decodedToken: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Check if token is expired
      if (decodedToken.exp && decodedToken.exp < currentTime) {
        console.warn('Token expiré');
        this.logout();
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Token invalide:', error);
      this.logout();
      return false;
    }
  }

  logout(): void {
    this.storageService.removeItem('jwt');
    this.adminStatusSubject.next(false);
  }

  clearInvalidToken(): void {
    console.warn('Suppression du token invalide');
    this.logout();
  }

}
