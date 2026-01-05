import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StorageService } from '../service/storage-service.service';

export interface ChartDataDTO {
  labels: string[];
  datasets: ChartDatasetDTO[];
}

export interface ChartDatasetDTO {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

export interface WeightEvolutionDTO {
  date: string;
  weight: number;
  bmi: number;
  target?: number;
}

export interface CaloriesComparisonDTO {
  date: string;
  consumed: number;
  burned: number;
  target: number;
}

export interface ActivityDistributionDTO {
  type: string;
  duration: number;
  calories: number;
  percentage: number;
}

export interface WeeklyProgressDTO {
  week: string;
  weightChange: number;
  caloriesAvg: number;
  activitiesCount: number;
  progressScore: number;
}

export interface MonthlyTrendsDTO {
  month: string;
  avgWeight: number;
  avgBMI: number;
  totalActivities: number;
  totalCalories: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChartDataService {
  private apiUrl = 'http://localhost:8095/api/charts';

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {}

  getWeightEvolution(period: '7d' | '30d' | '3m' | '1y' = '30d'): Observable<WeightEvolutionDTO[]> {
    // CORRECTION: Utilise l'endpoint correct avec userId
    const userId = this.getCurrentUserId();
    return this.http.get<WeightEvolutionDTO[]>(`${this.apiUrl}/weight-evolution/${userId}`, {
      headers: this.getHeaders(),
      params: { period }
    });
  }

  getBMIEvolution(period: '7d' | '30d' | '3m' | '1y' = '30d'): Observable<WeightEvolutionDTO[]> {
    // CORRECTION: Utilise l'endpoint correct avec userId
    const userId = this.getCurrentUserId();
    return this.http.get<WeightEvolutionDTO[]>(`${this.apiUrl}/bmi-evolution/${userId}`, {
      headers: this.getHeaders(),
      params: { period }
    });
  }

  getCaloriesComparison(period: '7d' | '30d' | '3m' | '1y' = '30d'): Observable<CaloriesComparisonDTO[]> {
    // CORRECTION: Utilise l'endpoint correct avec userId
    const userId = this.getCurrentUserId();
    return this.http.get<CaloriesComparisonDTO[]>(`${this.apiUrl}/calories-comparison/${userId}`, {
      headers: this.getHeaders(),
      params: { period }
    });
  }

  getActivityDistribution(period: '7d' | '30d' | '3m' | '1y' = '30d'): Observable<ActivityDistributionDTO[]> {
    // CORRECTION: Utilise l'endpoint correct avec userId
    const userId = this.getCurrentUserId();
    return this.http.get<ActivityDistributionDTO[]>(`${this.apiUrl}/activity-distribution/${userId}`, {
      headers: this.getHeaders(),
      params: { period }
    });
  }

  getWeeklyProgress(weeks: number = 12): Observable<WeeklyProgressDTO[]> {
    // CORRECTION: Utilise l'endpoint correct avec userId
    const userId = this.getCurrentUserId();
    return this.http.get<WeeklyProgressDTO[]>(`${this.apiUrl}/weekly-progress/${userId}`, {
      headers: this.getHeaders(),
      params: { weeks: weeks.toString() }
    });
  }

  getMonthlyTrends(months: number = 12): Observable<MonthlyTrendsDTO[]> {
    // CORRECTION: Utilise l'endpoint correct avec userId
    const userId = this.getCurrentUserId();
    return this.http.get<MonthlyTrendsDTO[]>(`${this.apiUrl}/monthly-trends/${userId}`, {
      headers: this.getHeaders(),
      params: { months: months.toString() }
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private getCurrentUserId(): number {
    // CORRECTION: Récupère l'ID utilisateur depuis le token JWT ou storage
    const userStr = this.storageService.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id || 1;
      } catch (e) {
        console.warn('Error parsing user from storage:', e);
      }
    }
    return 1; // Fallback
  }
}