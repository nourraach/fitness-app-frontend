import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserProfile, ImcResult, BesoinsCaloriquesResult } from '../models/user-profile.model';
import { StorageService } from './storage-service.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private baseUrl = 'http://localhost:8095/api/profile';

  constructor(private http: HttpClient, private storageService: StorageService) {}

  private getHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    if (!token) {
      console.error('Aucun JWT trouvé dans localStorage');
    }
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.baseUrl}`, { headers: this.getHeaders() });
  }

 saveProfile(profile: UserProfile): Observable<UserProfile> {
  // Log du payload avant envoi
  this.logPayload(profile);
  
  // Vérification des types de données
  this.ensureDataTypes(profile);
  
  // Vérification des valeurs enum
  this.validateEnumValues(profile);

  // Nettoyer le payload - ne garder que les champs attendus par le backend
  const cleanPayload: any = {
    age: profile.age,
    sexe: profile.sexe,
    taille: profile.taille,
    poids: profile.poids,
    objectif: profile.objectif,
    niveauActivite: profile.niveauActivite
  };

  // Ajouter l'ID si présent (pour les mises à jour)
  if (profile.id) {
    cleanPayload.id = profile.id;
  }
  if (profile.userId) {
    cleanPayload.userId = profile.userId;
  }

  console.log('📤 Payload nettoyé envoyé:', JSON.stringify(cleanPayload, null, 2));

  return this.http.put<UserProfile>(this.baseUrl, cleanPayload, {
    headers: this.getHeaders()
  }).pipe(
    tap({
      next: (response) => {
        console.log('✅ Réponse API réussie:', response);
      },
      error: (error) => {
        console.error('❌ Erreur API:', error);
        console.log('📤 Payload qui a causé l\'erreur:', JSON.stringify(cleanPayload, null, 2));
        
        // Log détaillé de l'erreur
        console.group('🔍 Détails de l\'erreur');
        console.log('Status:', error.status);
        console.log('StatusText:', error.statusText);
        console.log('URL:', error.url);
        console.log('Error body:', error.error);
        console.log('Error body type:', typeof error.error);
        if (error.error) {
          try {
            console.log('Error body stringified:', JSON.stringify(error.error, null, 2));
          } catch (e) {
            console.log('Error body (raw):', error.error);
          }
        }
        console.log('Headers:', error.headers);
        console.groupEnd();
      }
    })
  );
}


  calculateImc(taille: number, poids: number): Observable<ImcResult> {
    return this.http.get<ImcResult>(`${this.baseUrl}/imc?taille=${taille}&poids=${poids}`, 
      { headers: this.getHeaders() });
  }

  calculateBesoinsCaloriques(profile: UserProfile): Observable<BesoinsCaloriquesResult> {
    return this.http.post<BesoinsCaloriquesResult>(`${this.baseUrl}/besoins-caloriques`, profile, 
      { headers: this.getHeaders() });
  }

  /**
   * Log le payload avant envoi à l'API
   */
  private logPayload(profile: UserProfile): void {
    console.group('📤 Payload envoyé à l\'API');
    console.log('URL:', this.baseUrl);
    console.log('Méthode: PUT');
    console.log('Payload:', JSON.stringify(profile, null, 2));
    console.log('Headers:', this.getHeaders());
    console.groupEnd();
  }

  /**
   * S'assure que les types de données sont corrects
   */
  private ensureDataTypes(profile: UserProfile): void {
    // Convertir en nombres si nécessaire
    if (typeof profile.age === 'string') {
      profile.age = Number(profile.age);
      console.log('⚠️ Conversion age string -> number:', profile.age);
    }
    
    if (typeof profile.taille === 'string') {
      profile.taille = Number(profile.taille);
      console.log('⚠️ Conversion taille string -> number:', profile.taille);
    }
    
    if (typeof profile.poids === 'string') {
      profile.poids = Number(profile.poids);
      console.log('⚠️ Conversion poids string -> number:', profile.poids);
    }

    // Vérifier que les conversions ont réussi
    if (isNaN(profile.age) || isNaN(profile.taille) || isNaN(profile.poids)) {
      console.error('❌ Erreur de conversion des types numériques');
      throw new Error('Impossible de convertir les valeurs numériques');
    }
  }

  /**
   * Valide que les valeurs enum correspondent exactement au backend
   */
  private validateEnumValues(profile: UserProfile): void {
    const validSexe = ['HOMME', 'FEMME', 'AUTRE'];
    const validObjectif = ['PERTE_POIDS', 'PRISE_MASSE', 'MAINTIEN', 'REMISE_EN_FORME'];
    const validNiveauActivite = ['SEDENTAIRE', 'LEGER', 'MODERE', 'INTENSE', 'TRES_INTENSE'];

    if (!validSexe.includes(profile.sexe)) {
      console.error('❌ Valeur sexe invalide:', profile.sexe);
      throw new Error(`Valeur sexe invalide: ${profile.sexe}. Valeurs autorisées: ${validSexe.join(', ')}`);
    }

    if (!validObjectif.includes(profile.objectif)) {
      console.error('❌ Valeur objectif invalide:', profile.objectif);
      throw new Error(`Valeur objectif invalide: ${profile.objectif}. Valeurs autorisées: ${validObjectif.join(', ')}`);
    }

    if (profile.niveauActivite && !validNiveauActivite.includes(profile.niveauActivite)) {
      console.error('❌ Valeur niveauActivite invalide:', profile.niveauActivite);
      throw new Error(`Valeur niveauActivite invalide: ${profile.niveauActivite}. Valeurs autorisées: ${validNiveauActivite.join(', ')}`);
    }

    console.log('✅ Validation des enums réussie');
  }
}
