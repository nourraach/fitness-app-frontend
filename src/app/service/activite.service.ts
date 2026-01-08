import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { StorageService } from './storage-service.service';
import { JwtService } from './jwt.service';
import { ActivitePhysique, CreerActiviteRequest, TotauxActivites, BilanJournalier, calculerCalories, validerActivite } from '../models/activite.model';

const BASE_URL = "http://localhost:8095/";

@Injectable({
  providedIn: 'root'
})
export class ActiviteService {

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private jwtService: JwtService
  ) {}

  private createAuthorizationHeader(): HttpHeaders | null {
    const jwtToken = this.storageService.getItem('jwt');
    if (jwtToken) {
      console.log('🔐 JWT trouvé, longueur:', jwtToken.length);
      
      // Vérifier si le JWT est valide
      if (!this.jwtService.isTokenValid()) {
        console.error('❌ JWT invalide ou expiré');
        return null;
      }
      
      return new HttpHeaders()
        .set("Authorization", "Bearer " + jwtToken)
        .set("Content-Type", "application/json");
    }
    console.error("❌ Aucun JWT trouvé dans localStorage.");
    return null;
  }

  creerActivite(request: any): Observable<ActivitePhysique> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }

    // Obtenir l'ID utilisateur depuis le JWT
    const userId = this.jwtService.getUserId();
    if (!userId) {
      return throwError(() => new Error('Impossible de récupérer l\'ID utilisateur.'));
    }

    // Calculer les calories si elles ne sont pas fournies
    let caloriesBrulees = request.caloriesBrulees;
    if (!caloriesBrulees && request.typeActivite && request.dureeMinutes && request.intensite) {
      caloriesBrulees = calculerCalories(request.typeActivite, request.dureeMinutes, request.intensite);
    }

    // Récupérer la date (accepter 'date' ou 'dateActivite')
    const dateValue = request.date || request.dateActivite;

    // Construire le payload exact attendu par le backend
    const payload = {
      typeActivite: request.typeActivite,
      dureeMinutes: request.dureeMinutes,
      caloriesBrulees: caloriesBrulees,
      intensite: request.intensite,
      date: dateValue, // Backend attend 'date'
      notes: request.notes || '',
      utilisateur: { id: userId }
    };

    // Valider les données avant envoi
    if (!payload.typeActivite || !payload.dureeMinutes || !payload.intensite || !payload.date) {
      return throwError(() => new Error('Données invalides: champs requis manquants'));
    }

    console.log('🚀 Envoi de la requête activité au backend:', JSON.stringify(payload, null, 2));

    return this.http.post<ActivitePhysique>(BASE_URL + 'api/activites/creer', payload, { headers });
  }

  getTotauxActivites(date: string): Observable<TotauxActivites> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    
    console.log('🔍 Récupération des totaux activités pour la date:', date);
    
    const url = BASE_URL + `api/activites/journalieres?date=${date}`;
    console.log('🔗 URL appelée:', url);
    
    return this.http.get<TotauxActivites>(url, { headers }).pipe(
      catchError((error) => {
        console.error('❌ Erreur getTotauxActivites:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.error);
        
        // Gestion spécifique des erreurs
        if (error.status === 401) {
          console.error('🔐 Problème d\'authentification - JWT invalide ou expiré');
          // Essayer de déboguer le JWT
          this.jwtService.debugJWT();
        } else if (error.status === 400) {
          console.error('📝 Bad Request - Vérifier les paramètres de la requête');
          console.error('📝 URL testée:', url);
        }
        
        return throwError(() => error);
      })
    );
  }

  getBilanJournalier(date: string): Observable<BilanJournalier> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    
    console.log('🔍 Récupération du bilan journalier pour la date:', date);
    
    const url = BASE_URL + `api/activites/bilan?date=${date}`;
    console.log('🔗 URL appelée:', url);
    
    return this.http.get<BilanJournalier>(url, { headers }).pipe(
      catchError((error) => {
        console.error('❌ Erreur getBilanJournalier:', error);
        console.error('❌ Status:', error.status);
        console.error('❌ Message:', error.error);
        
        // Gestion spécifique des erreurs
        if (error.status === 401) {
          console.error('🔐 Problème d\'authentification - JWT invalide ou expiré');
          // Essayer de déboguer le JWT
          this.jwtService.debugJWT();
        } else if (error.status === 400) {
          console.error('📝 Bad Request - Vérifier les paramètres de la requête');
          console.error('📝 URL testée:', url);
        }
        
        return throwError(() => error);
      })
    );
  }

  supprimerActivite(activiteId: number): Observable<any> {
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      return throwError(() => new Error('Aucun JWT trouvé.'));
    }
    return this.http.delete(BASE_URL + `api/activites/${activiteId}`, { headers });
  }

  // Méthode utilitaire pour gérer les erreurs HTTP
  private handleError(error: any): string {
    console.error('🔥 Erreur complète du service activité:', error);
    
    if (error.status === 0) {
      return 'Impossible de contacter le serveur';
    } else if (error.status === 400) {
      return 'Données invalides - Vérifiez les champs requis';
    } else if (error.status === 401) {
      return 'Non autorisé - Veuillez vous reconnecter';
    } else if (error.status === 500) {
      return 'Erreur serveur - Veuillez réessayer plus tard';
    } else if (error.error?.message) {
      return error.error.message;
    } else {
      return 'Une erreur inattendue s\'est produite';
    }
  }

  // Méthode utilitaire pour créer une activité avec calcul automatique des calories
  creerActiviteAvecCalcul(
    typeActivite: string,
    dureeMinutes: number,
    intensite: 'FAIBLE' | 'MODEREE' | 'ELEVEE',
    dateActivite: string,
    notes?: string
  ): Observable<ActivitePhysique> {
    const caloriesBrulees = calculerCalories(typeActivite, dureeMinutes, intensite);
    
    return this.creerActivite({
      typeActivite,
      dureeMinutes,
      caloriesBrulees,
      intensite,
      dateActivite,
      notes
    });
  }

  // Méthode de diagnostic pour tester les endpoints GET
  diagnostiquerEndpoints(date: string): void {
    console.log('🔍 DIAGNOSTIC - Test des endpoints d\'activité');
    console.log('📅 Date testée:', date);
    
    const headers = this.createAuthorizationHeader();
    if (!headers) {
      console.error('❌ Pas de JWT pour le diagnostic');
      return;
    }

    // Test des différentes variantes d'URL
    const urlsATest = [
      `${BASE_URL}api/activites/journalieres?date=${date}`,
      `${BASE_URL}api/activites/journalieres?dateActivite=${date}`,
      `${BASE_URL}api/activites/bilan?date=${date}`,
      `${BASE_URL}api/activites/bilan?dateActivite=${date}`
    ];

    urlsATest.forEach((url, index) => {
      console.log(`🧪 Test ${index + 1}: ${url}`);
      
      this.http.get(url, { headers }).subscribe({
        next: (response) => {
          console.log(`✅ Test ${index + 1} réussi:`, response);
        },
        error: (error) => {
          console.log(`❌ Test ${index + 1} échoué:`, error.status, error.error);
        }
      });
    });
  }
}