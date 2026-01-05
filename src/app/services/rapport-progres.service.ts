import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, retry, tap, map } from 'rxjs/operators';
import { RapportProgresDTO, CreerRapportRequest, CompiledDataDTO } from '../models/rapport-progres.model';
import { StorageService } from '../service/storage-service.service';

@Injectable({
  providedIn: 'root'
})
export class RapportProgresService {
  private apiUrl = 'http://localhost:8095/api/rapports';
  private rapportsSubject = new BehaviorSubject<RapportProgresDTO[]>([]);
  public rapports$ = this.rapportsSubject.asObservable();

  constructor(private http: HttpClient, private storageService: StorageService) {}

  private getHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('RapportProgresService error:', error);
    return throwError(() => error);
  }

  // Legacy methods (keeping for compatibility)
  genererRapport(clientId: number, dateDebut: string, dateFin: string): Observable<RapportProgresDTO> {
    const params = new HttpParams()
      .set('clientId', clientId.toString())
      .set('dateDebut', dateDebut)
      .set('dateFin', dateFin);
    return this.http.post<RapportProgresDTO>(`${this.apiUrl}/generer`, null, { params, headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  genererRapportSemaineCourante(clientId: number): Observable<RapportProgresDTO> {
    const params = new HttpParams().set('clientId', clientId.toString());
    return this.http.get<RapportProgresDTO>(`${this.apiUrl}/semaine-courante`, { params, headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  getRapportsCoach(): Observable<RapportProgresDTO[]> {
    return this.http.get<RapportProgresDTO[]>(`${this.apiUrl}/coach`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  getRapportsClient(): Observable<RapportProgresDTO[]> {
    return this.http.get<RapportProgresDTO[]>(`${this.apiUrl}/client`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  getRapportById(id: number): Observable<RapportProgresDTO> {
    return this.http.get<RapportProgresDTO>(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // Enhanced methods
  // Create progress report with automatic data compilation
  creerRapport(request: CreerRapportRequest): Observable<RapportProgresDTO> {
    return this.http.post<RapportProgresDTO>(`${this.apiUrl}/creer`, request, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(() => this.refreshRapports()),
        catchError(this.handleError)
      );
  }

  // Get reports by client
  getRapportsParClient(clientId: number): Observable<RapportProgresDTO[]> {
    return this.http.get<RapportProgresDTO[]>(`${this.apiUrl}/client/${clientId}`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // Get reports by coach
  getRapportsParCoach(coachId: number): Observable<RapportProgresDTO[]> {
    return this.http.get<RapportProgresDTO[]>(`${this.apiUrl}/coach/${coachId}`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  // Update report
  updateRapport(id: number, request: CreerRapportRequest): Observable<RapportProgresDTO> {
    return this.http.put<RapportProgresDTO>(`${this.apiUrl}/${id}`, request, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(() => this.refreshRapports()),
        catchError(this.handleError)
      );
  }

  // Delete report
  supprimerRapport(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.getHeaders() })
      .pipe(
        retry(2),
        tap(() => this.refreshRapports()),
        catchError(this.handleError)
      );
  }

  // Parse compiled data from JSON string
  parseCompiledData(donneesCompilees: string): CompiledDataDTO | null {
    try {
      return JSON.parse(donneesCompilees) as CompiledDataDTO;
    } catch (error) {
      console.error('Error parsing compiled data:', error);
      return null;
    }
  }

  // Generate chart data for visualization
  generateChartData(compiledData: CompiledDataDTO): any {
    return {
      calories: {
        labels: ['Consommées', 'Brûlées'],
        data: [compiledData.caloriesConsommees, compiledData.caloriesBrulees],
        backgroundColor: ['#FF6384', '#36A2EB']
      },
      macros: {
        labels: ['Protéines', 'Glucides', 'Lipides'],
        data: [
          compiledData.pourcentageProteines,
          compiledData.pourcentageGlucides,
          compiledData.pourcentageLipides
        ],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56']
      },
      activities: {
        labels: ['Activités réalisées', 'Objectif'],
        data: [compiledData.totalActivites, 7], // Assuming 7 activities per week goal
        backgroundColor: ['#4BC0C0', '#E7E9ED']
      }
    };
  }

  // Calculate achievement percentage
  calculateAchievementPercentage(compiledData: CompiledDataDTO): number {
    let achievements = 0;
    let totalGoals = 2;

    if (compiledData.objectifActiviteAtteint) achievements++;
    if (compiledData.objectifNutritionAtteint) achievements++;

    return Math.round((achievements / totalGoals) * 100);
  }

  // Get weekly summary
  getWeeklySummary(compiledData: CompiledDataDTO): any {
    return {
      totalActivities: compiledData.totalActivites,
      totalMeals: compiledData.totalRepas,
      averageCaloriesPerDay: Math.round(compiledData.moyenneCaloriesParJour),
      calorieBalance: Math.round(compiledData.bilanCalorique),
      activeDays: compiledData.joursAvecActivite,
      mealDays: compiledData.joursAvecRepas,
      achievementPercentage: this.calculateAchievementPercentage(compiledData)
    };
  }

  // Utility methods
  private refreshRapports(): void {
    // This would typically refresh the current user's reports
    // Implementation depends on user context
  }

  // Format date for display
  formatDateRange(dateDebut: Date, dateFin: Date): string {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return `${dateDebut.toLocaleDateString('fr-FR', options)} - ${dateFin.toLocaleDateString('fr-FR', options)}`;
  }

  // Validate report date range
  isValidDateRange(dateDebut: Date, dateFin: Date): boolean {
    return dateDebut < dateFin && 
           (dateFin.getTime() - dateDebut.getTime()) <= (7 * 24 * 60 * 60 * 1000); // Max 7 days
  }

  // Get report status based on data
  getReportStatus(rapport: RapportProgresDTO): 'excellent' | 'good' | 'needs-improvement' {
    const compiledData = this.parseCompiledData(rapport.donneesCompilees);
    if (!compiledData) return 'needs-improvement';

    const achievementPercentage = this.calculateAchievementPercentage(compiledData);
    
    if (achievementPercentage >= 80) return 'excellent';
    if (achievementPercentage >= 60) return 'good';
    return 'needs-improvement';
  }

  // Missing methods that components are trying to use
  createReport(reportData: any): Observable<RapportProgresDTO> {
    return this.creerRapport(reportData);
  }

  updateReport(id: number, reportData: any): Observable<RapportProgresDTO> {
    return this.updateRapport(id, reportData);
  }

  getReports(filters?: any): Observable<{ reports: RapportProgresDTO[], total: number }> {
    // For now, return all reports - in a real implementation, this would handle filtering
    return this.getRapportsCoach().pipe(
      map(reports => ({ reports, total: reports.length }))
    );
  }

  deleteReport(id: number): Observable<any> {
    return this.supprimerRapport(id);
  }

  duplicateReport(id: number): Observable<RapportProgresDTO> {
    return this.getRapportById(id).pipe(
      map(report => {
        const duplicatedReport = {
          ...report,
          id: undefined,
          dateGeneration: new Date(),
          resume: `Copie de ${report.resume || 'Rapport'}`
        };
        return duplicatedReport;
      }),
      // In a real implementation, this would call the backend to create the duplicate
      // For now, we'll just return the modified report
    );
  }

  shareReport(id: number): Observable<RapportProgresDTO> {
    // In a real implementation, this would handle sharing logic
    return this.getRapportById(id);
  }

  exportReport(id: number, format: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/export?format=${format}`, {
      headers: this.getHeaders(),
      responseType: 'blob'
    }).pipe(
      retry(2),
      catchError(this.handleError)
    );
  }

  getReportChartData(id: number): Observable<any> {
    return this.getRapportById(id).pipe(
      map(report => {
        const compiledData = this.parseCompiledData(report.donneesCompilees);
        return compiledData ? this.generateChartData(compiledData) : null;
      })
    );
  }
}
