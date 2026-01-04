import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../service/storage-service.service';

export interface NutritionPlanDTO {
  id: number;
  clientId: number;
  nutritionistId: number;
  nom: string;
  description: string;
  objectif: string;
  caloriesJournalieres: number;
  proteines: number;
  glucides: number;
  lipides: number;
  dureeJours: number;
  dateDebut: string;
  dateFin: string;
  statut: 'ACTIF' | 'EXPIRE' | 'SUSPENDU';
  restrictions: string[];
  preferences: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateNutritionPlanRequest {
  clientId: number;
  nom: string;
  description: string;
  objectif: 'PERTE_POIDS' | 'PRISE_MASSE' | 'MAINTIEN' | 'PERFORMANCE';
  dureeJours: number;
  restrictions?: string[];
  preferences?: string[];
  caloriesPersonnalisees?: number;
}

export interface FoodItemDTO {
  id: number;
  nom: string;
  categorie: string;
  caloriesPour100g: number;
  proteinesPour100g: number;
  glucidesPour100g: number;
  lipidesPour100g: number;
  fibres?: number;
  sucres?: number;
  sodium?: number;
  vegetarien: boolean;
  vegan: boolean;
  sansGluten: boolean;
  sansLactose: boolean;
}

export interface DietaryFilter {
  vegetarien?: boolean;
  vegan?: boolean;
  sansGluten?: boolean;
  sansLactose?: boolean;
  minCalories?: number;
  maxCalories?: number;
  minProteines?: number;
  maxProteines?: number;
  categorie?: string;
}

export interface ShoppingListDTO {
  planId: number;
  dateDebut: string;
  dateFin: string;
  items: ShoppingListItem[];
  totalEstime: number;
}

export interface ShoppingListItem {
  alimentId: number;
  nom: string;
  categorie: string;
  quantiteTotal: number;
  unite: string;
  prixEstime?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NutritionPlanService {
  private apiUrl = 'http://localhost:8095/api/nutrition';

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  // Plans nutritionnels
  createPlan(request: CreateNutritionPlanRequest): Observable<NutritionPlanDTO> {
    return this.http.post<NutritionPlanDTO>(`${this.apiUrl}/plans`, request, {
      headers: this.getHeaders()
    });
  }

  getClientPlans(clientId: number): Observable<NutritionPlanDTO[]> {
    return this.http.get<NutritionPlanDTO[]>(`${this.apiUrl}/plans/client/${clientId}`, {
      headers: this.getHeaders()
    });
  }

  getNutritionistPlans(nutritionistId: number): Observable<NutritionPlanDTO[]> {
    return this.http.get<NutritionPlanDTO[]>(`${this.apiUrl}/plans/nutritionist/${nutritionistId}`, {
      headers: this.getHeaders()
    });
  }

  getPlan(planId: number): Observable<NutritionPlanDTO> {
    return this.http.get<NutritionPlanDTO>(`${this.apiUrl}/plans/${planId}`, {
      headers: this.getHeaders()
    });
  }

  updatePlan(planId: number, request: Partial<CreateNutritionPlanRequest>): Observable<NutritionPlanDTO> {
    return this.http.put<NutritionPlanDTO>(`${this.apiUrl}/plans/${planId}`, request, {
      headers: this.getHeaders()
    });
  }

  deletePlan(planId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/plans/${planId}`, {
      headers: this.getHeaders()
    });
  }

  // Recherche d'aliments
  searchFoods(query: string, filters?: DietaryFilter): Observable<FoodItemDTO[]> {
    let params = new HttpParams().set('query', query);
    
    if (filters) {
      if (filters.vegetarien !== undefined) params = params.set('vegetarien', filters.vegetarien.toString());
      if (filters.vegan !== undefined) params = params.set('vegan', filters.vegan.toString());
      if (filters.sansGluten !== undefined) params = params.set('sansGluten', filters.sansGluten.toString());
      if (filters.sansLactose !== undefined) params = params.set('sansLactose', filters.sansLactose.toString());
      if (filters.minCalories !== undefined) params = params.set('minCalories', filters.minCalories.toString());
      if (filters.maxCalories !== undefined) params = params.set('maxCalories', filters.maxCalories.toString());
      if (filters.minProteines !== undefined) params = params.set('minProteines', filters.minProteines.toString());
      if (filters.maxProteines !== undefined) params = params.set('maxProteines', filters.maxProteines.toString());
      if (filters.categorie) params = params.set('categorie', filters.categorie);
    }

    return this.http.get<FoodItemDTO[]>(`${this.apiUrl}/foods/search`, {
      headers: this.getHeaders(),
      params
    });
  }

  // Liste de courses
  generateShoppingList(planId: number, startDate: string, endDate: string): Observable<ShoppingListDTO> {
    const request = {
      planId,
      dateDebut: startDate,
      dateFin: endDate
    };

    return this.http.post<ShoppingListDTO>(`${this.apiUrl}/shopping-list`, request, {
      headers: this.getHeaders()
    });
  }

  // Génération automatique de plan
  generateAutomaticPlan(clientId: number, objectif: string, preferences?: string[]): Observable<NutritionPlanDTO> {
    const request = {
      clientId,
      objectif,
      preferences: preferences || [],
      nom: `Plan automatique - ${objectif}`,
      description: `Plan nutritionnel généré automatiquement pour l'objectif: ${objectif}`,
      dureeJours: 30 // Plan d'un mois par défaut
    };

    return this.createPlan(request);
  }

  private getHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}