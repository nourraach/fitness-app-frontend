import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { 
  NutritionPlan,
  FoodItem,
  CreateNutritionPlanRequest,
  ShoppingList,
  DietaryFilter,
  PlanStatus,
  DietaryRestriction
} from '../models/coach.model';
import { StorageService } from '../service/storage-service.service';
import { JwtService } from '../service/jwt.service';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({
  providedIn: 'root'
})
export class NutritionService {
  private apiUrl = 'http://localhost:8095/api/nutrition';
  
  // State management
  private nutritionPlansSubject = new BehaviorSubject<NutritionPlan[]>([]);
  private foodItemsSubject = new BehaviorSubject<FoodItem[]>([]);
  
  public nutritionPlans$ = this.nutritionPlansSubject.asObservable();
  public foodItems$ = this.foodItemsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService,
    private jwtService: JwtService,
    private errorHandler: ErrorHandlerService
  ) {}

  // Create HTTP headers with JWT token
  private createAuthHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Get current nutritionist ID from JWT
  private getCurrentNutritionistId(): number {
    return this.jwtService.getUserId() || 1;
  }

  /**
   * Create a new nutrition plan
   */
  createNutritionPlan(request: CreateNutritionPlanRequest, nutritionistId?: number): Observable<NutritionPlan> {
    const headers = this.createAuthHeaders();
    const id = nutritionistId || this.getCurrentNutritionistId();
    
    let params = new HttpParams();
    params = params.set('nutritionistId', id.toString());
    
    return this.http.post<NutritionPlan>(`${this.apiUrl}/plans`, request, { headers, params })
      .pipe(
        tap(plan => {
          // Add to local state
          const currentPlans = this.nutritionPlansSubject.value;
          this.nutritionPlansSubject.next([plan, ...currentPlans]);
        }),
        catchError(error => {
          this.errorHandler.logError('createNutritionPlan', error);
          throw error;
        })
      );
  }

  /**
   * Get nutrition plans for nutritionist
   */
  getNutritionistPlans(nutritionistId?: number, status?: PlanStatus): Observable<NutritionPlan[]> {
    const id = nutritionistId || this.getCurrentNutritionistId();
    const headers = this.createAuthHeaders();
    
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    
    return this.http.get<NutritionPlan[]>(`${this.apiUrl}/plans/nutritionist/${id}`, { headers, params })
      .pipe(
        tap(plans => {
          this.nutritionPlansSubject.next(plans);
        }),
        catchError(error => {
          this.errorHandler.logError('getNutritionistPlans', error);
          return of([]);
        })
      );
  }

  /**
   * Get nutrition plan by ID
   */
  getNutritionPlan(planId: number): Observable<NutritionPlan> {
    const headers = this.createAuthHeaders();
    
    return this.http.get<NutritionPlan>(`${this.apiUrl}/plans/${planId}`, { headers })
      .pipe(
        catchError(error => {
          this.errorHandler.logError('getNutritionPlan', error);
          throw error;
        })
      );
  }

  /**
   * Update nutrition plan
   */
  updateNutritionPlan(planId: number, updates: Partial<NutritionPlan>): Observable<NutritionPlan> {
    const headers = this.createAuthHeaders();
    
    return this.http.put<NutritionPlan>(`${this.apiUrl}/plans/${planId}`, updates, { headers })
      .pipe(
        tap(updatedPlan => {
          // Update local state
          const currentPlans = this.nutritionPlansSubject.value;
          const index = currentPlans.findIndex(plan => plan.id === planId);
          if (index !== -1) {
            currentPlans[index] = updatedPlan;
            this.nutritionPlansSubject.next([...currentPlans]);
          }
        }),
        catchError(error => {
          this.errorHandler.logError('updateNutritionPlan', error);
          throw error;
        })
      );
  }

  /**
   * Delete nutrition plan
   */
  deleteNutritionPlan(planId: number): Observable<boolean> {
    const headers = this.createAuthHeaders();
    
    return this.http.delete(`${this.apiUrl}/plans/${planId}`, { headers })
      .pipe(
        tap(() => {
          // Remove from local state
          const currentPlans = this.nutritionPlansSubject.value;
          const filteredPlans = currentPlans.filter(plan => plan.id !== planId);
          this.nutritionPlansSubject.next(filteredPlans);
        }),
        map(() => true),
        catchError(error => {
          this.errorHandler.logError('deleteNutritionPlan', error);
          return of(false);
        })
      );
  }

  /**
   * Search food items
   */
  searchFoods(query?: string, category?: string, filters?: DietaryFilter): Observable<FoodItem[]> {
    const headers = this.createAuthHeaders();
    
    let params = new HttpParams();
    if (query) {
      params = params.set('query', query);
    }
    if (category) {
      params = params.set('category', category);
    }
    if (filters?.restrictions) {
      filters.restrictions.forEach(restriction => {
        params = params.append('restrictions', restriction);
      });
    }
    if (filters?.maxCalories) {
      params = params.set('maxCalories', filters.maxCalories.toString());
    }
    if (filters?.minProtein) {
      params = params.set('minProtein', filters.minProtein.toString());
    }
    
    return this.http.get<FoodItem[]>(`${this.apiUrl}/foods/search`, { headers, params })
      .pipe(
        tap(foods => {
          this.foodItemsSubject.next(foods);
        }),
        catchError(error => {
          this.errorHandler.logError('searchFoods', error);
          return of([]);
        })
      );
  }

  /**
   * Get food categories
   */
  getFoodCategories(): Observable<string[]> {
    const headers = this.createAuthHeaders();
    
    return this.http.get<string[]>(`${this.apiUrl}/foods/categories`, { headers })
      .pipe(
        catchError(error => {
          this.errorHandler.logError('getFoodCategories', error);
          return of(['Viandes', 'Poissons', 'Légumes', 'Fruits', 'Céréales', 'Produits laitiers', 'Légumineuses']);
        })
      );
  }

  /**
   * Generate shopping list for nutrition plan
   */
  generateShoppingList(planId: number, startDate: Date, endDate: Date): Observable<ShoppingList> {
    const headers = this.createAuthHeaders();
    
    let params = new HttpParams();
    params = params.set('startDate', startDate.toISOString().split('T')[0]);
    params = params.set('endDate', endDate.toISOString().split('T')[0]);
    
    return this.http.get<ShoppingList>(`${this.apiUrl}/plans/${planId}/shopping-list`, { headers, params })
      .pipe(
        catchError(error => {
          this.errorHandler.logError('generateShoppingList', error);
          throw error;
        })
      );
  }

  /**
   * Calculate caloric needs for client
   */
  calculateCaloricNeeds(clientId: number): Observable<number> {
    const headers = this.createAuthHeaders();
    
    return this.http.get<{ calories: number }>(`${this.apiUrl}/calculate-calories/${clientId}`, { headers })
      .pipe(
        map(response => response.calories),
        catchError(error => {
          this.errorHandler.logError('calculateCaloricNeeds', error);
          return of(2000); // Default value
        })
      );
  }

  /**
   * Get nutrition plan templates
   */
  getPlanTemplates(): Observable<NutritionPlan[]> {
    const headers = this.createAuthHeaders();
    
    return this.http.get<NutritionPlan[]>(`${this.apiUrl}/templates`, { headers })
      .pipe(
        catchError(error => {
          this.errorHandler.logError('getPlanTemplates', error);
          return of([]);
        })
      );
  }

  /**
   * Duplicate nutrition plan
   */
  duplicatePlan(planId: number, newClientId: number): Observable<NutritionPlan> {
    const headers = this.createAuthHeaders();
    
    const body = { newClientId };
    
    return this.http.post<NutritionPlan>(`${this.apiUrl}/plans/${planId}/duplicate`, body, { headers })
      .pipe(
        tap(plan => {
          // Add to local state
          const currentPlans = this.nutritionPlansSubject.value;
          this.nutritionPlansSubject.next([plan, ...currentPlans]);
        }),
        catchError(error => {
          this.errorHandler.logError('duplicatePlan', error);
          throw error;
        })
      );
  }

  /**
   * Get nutrition analysis for plan
   */
  getNutritionAnalysis(planId: number, date?: Date): Observable<any> {
    const headers = this.createAuthHeaders();
    
    let params = new HttpParams();
    if (date) {
      params = params.set('date', date.toISOString().split('T')[0]);
    }
    
    return this.http.get(`${this.apiUrl}/plans/${planId}/analysis`, { headers, params })
      .pipe(
        catchError(error => {
          this.errorHandler.logError('getNutritionAnalysis', error);
          return of({});
        })
      );
  }

  /**
   * Get dietary restrictions options
   */
  getDietaryRestrictions(): DietaryRestriction[] {
    return Object.values(DietaryRestriction);
  }

  /**
   * Clear local state (useful for logout)
   */
  clearState(): void {
    this.nutritionPlansSubject.next([]);
    this.foodItemsSubject.next([]);
  }

  /**
   * Refresh nutrition plans
   */
  refreshPlans(nutritionistId?: number): void {
    this.getNutritionistPlans(nutritionistId).subscribe();
  }
}