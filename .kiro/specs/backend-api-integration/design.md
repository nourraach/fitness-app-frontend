# Design Document - Backend API Integration

## Overview

Ce design intègre les nouvelles APIs backend critiques dans le frontend Angular existant. L'architecture suit les patterns établis et ajoute les fonctionnalités manquantes pour atteindre 100% d'alignement frontend/backend. Les nouvelles fonctionnalités incluent l'audit logging admin, les statistiques coach améliorées, la reconnaissance d'aliments, les graphiques d'évolution, et l'administration complète.

## Architecture

### Structure des Nouveaux Modules
```
AdminModule (nouveau)
├── AuditLogsComponent
├── AdminDashboardComponent
├── UserManagementComponent
├── SystemStatsComponent
└── ModerationQueueComponent

FoodRecognitionModule (nouveau)
├── FoodUploadComponent
├── FoodRecognitionResultComponent
├── FoodSuggestionsComponent
└── NutritionalInfoComponent

ChartsModule (nouveau)
├── ChartsContainerComponent
├── WeightEvolutionComponent
├── BMIEvolutionComponent
├── CaloriesComparisonComponent
├── ActivityDistributionComponent
├── WeeklyProgressComponent
└── MonthlyTrendsComponent

EnhancedProgrammeModule (améliorations)
├── ProgrammeEditModalComponent (nouveau)
├── ProgrammeDeleteConfirmComponent (nouveau)
└── CoachStatsEnhancedComponent (amélioré)
```

### Services Architecture
```
AdminService (nouveau)
├── AuditLogService
├── UserManagementService
├── SystemStatsService
└── ModerationService

FoodRecognitionService (nouveau)
├── ImageUploadService
├── FoodSuggestionService
└── NutritionalCalculationService

ChartDataService (nouveau)
├── WeightEvolutionService
├── BMICalculationService
├── CaloriesAnalysisService
└── ActivityAnalysisService

EnhancedProgrammeService (améliorations)
├── updateProgramme() (nouveau)
├── deleteProgramme() (nouveau)
└── getEnhancedClientStats() (amélioré)
```

## Components and Interfaces

### Models TypeScript

#### Audit Logging Models
```typescript
export interface AuditLogDTO {
  id: number;
  adminUserId: number;
  adminUserEmail: string;
  action: string;
  entityType: string;
  entityId?: number;
  details: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE' | 'MODERATE' | 'VIEW';
}

export interface AuditStatsDTO {
  totalLogs: number;
  logsLast24h: number;
  logsLastWeek: number;
  logsLastMonth: number;
  createActions: number;
  updateActions: number;
  deleteActions: number;
  moderateActions: number;
}

export interface AuditFilters {
  page?: number;
  size?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  actionType?: string;
  adminUserId?: number;
}
```

#### Enhanced Client Statistics
```typescript
export interface EnhancedClientDTO {
  id: number;
  name: string;
  email: string;
  age?: number;
  phone?: string;
  assignedDate?: string;
  status: string;
  // Nouvelles données calculées automatiquement
  programsCount: number;        // Nombre réel de programmes
  progressRate: number;         // Taux de progression (0-100%)
  lastActivity: string;         // Dernière activité ou "Aucune activité"
  // Données additionnelles pour l'interface
  isInactive?: boolean;         // Calculé côté frontend
  progressClass?: string;       // CSS class basée sur progressRate
  lastActivityDate?: Date;      // Parsed date pour tri
}
```

#### Food Recognition Models
```typescript
export interface FoodRecognitionResultDTO {
  recognized: boolean;
  confidence: number;
  foodId?: number;
  foodName?: string;
  category?: string;
  message?: string;
  nutritionalInfo?: NutritionalInfoDTO;
}

export interface NutritionalInfoDTO {
  foodName: string;
  quantity: number;
  calories: number;
  proteines: number;
  lipides: number;
  glucides: number;
  unit: string;
}

export interface FoodSuggestionDTO {
  id: number;
  name: string;
  category: string;
  commonName?: string;
}

export interface ManualFoodEntryDTO {
  foodName: string;
  quantity?: number;
}
```

#### Chart Data Models
```typescript
export interface ChartDataDTO {
  labels: string[];
  datasets: ChartDatasetDTO[];
}

export interface ChartDatasetDTO {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
}

export interface WeeklyProgressDTO {
  weekStart: string;
  weekEnd: string;
  totalCaloriesConsumed: number;
  totalCaloriesBurned: number;
  totalActivityMinutes: number;
  averageWeight?: number;
  averageBMI?: number;
}

export interface MonthlyTrendsDTO {
  month: string;
  averageCaloriesConsumed: number;
  averageCaloriesBurned: number;
  averageActivityMinutes: number;
  weightChange: number;
  bmiChange: number;
}
```

#### Admin Management Models
```typescript
export interface AdminUserDTO {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  enabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface AdminUserDetailDTO extends AdminUserDTO {
  phone?: string;
  address?: string;
  profileCompleteness: number;
  totalLogins: number;
  totalActions: number;
  recentActivity: AdminActionDTO[];
}

export interface SystemStatsDTO {
  totalUsers: number;
  activeUsers: number;
  totalCoaches: number;
  totalClients: number;
  totalProgrammes: number;
  totalActivities: number;
  systemUptime: string;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ModerationItemDTO {
  id: number;
  itemType: string;
  itemId: number;
  reportReason: string;
  reportedBy: number;
  reportedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  moderatedBy?: number;
  moderatedAt?: string;
  moderationNotes?: string;
}
```

## Data Models

### Service Implementation

#### AdminService
```typescript
@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:8095/api/admin';

  constructor(private http: HttpClient, private storageService: StorageService) {}

  // Audit Logs
  getAuditLogs(filters?: AuditFilters): Observable<AuditLogDTO[]> {
    const params = this.buildParams(filters);
    return this.http.get<AuditLogDTO[]>(`${this.apiUrl}/audit-logs`, { 
      headers: this.getHeaders(), 
      params 
    });
  }

  searchAuditLogs(query: string): Observable<AuditLogDTO[]> {
    return this.http.get<AuditLogDTO[]>(`${this.apiUrl}/audit-logs/search`, {
      headers: this.getHeaders(),
      params: { query }
    });
  }

  getAuditStats(): Observable<AuditStatsDTO> {
    return this.http.get<AuditStatsDTO>(`${this.apiUrl}/audit-logs/stats`, {
      headers: this.getHeaders()
    });
  }

  getEntityAuditLogs(entityType: string, entityId: number): Observable<AuditLogDTO[]> {
    return this.http.get<AuditLogDTO[]>(`${this.apiUrl}/audit-logs/entity/${entityType}/${entityId}`, {
      headers: this.getHeaders()
    });
  }

  // User Management
  getUsers(filters?: any): Observable<AdminUserDTO[]> {
    const params = this.buildParams(filters);
    return this.http.get<AdminUserDTO[]>(`${this.apiUrl}/users`, {
      headers: this.getHeaders(),
      params
    });
  }

  getUserDetails(userId: number): Observable<AdminUserDetailDTO> {
    return this.http.get<AdminUserDetailDTO>(`${this.apiUrl}/users/${userId}`, {
      headers: this.getHeaders()
    });
  }

  // System Stats
  getDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`, {
      headers: this.getHeaders()
    });
  }

  getSystemStats(): Observable<SystemStatsDTO> {
    return this.http.get<SystemStatsDTO>(`${this.apiUrl}/statistics`, {
      headers: this.getHeaders()
    });
  }

  // Moderation
  getModerationQueue(): Observable<ModerationItemDTO[]> {
    return this.http.get<ModerationItemDTO[]>(`${this.apiUrl}/moderation`, {
      headers: this.getHeaders()
    });
  }

  moderateItem(itemId: number, action: string, notes?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/moderation/${itemId}/moderate`, {
      action,
      notes
    }, {
      headers: this.getHeaders()
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private buildParams(filters?: any): HttpParams {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key].toString());
        }
      });
    }
    return params;
  }
}
```

#### FoodRecognitionService
```typescript
@Injectable({
  providedIn: 'root'
})
export class FoodRecognitionService {
  private apiUrl = 'http://localhost:8095/api/food-recognition';

  constructor(private http: HttpClient, private storageService: StorageService) {}

  recognizeFood(imageFile: File): Observable<FoodRecognitionResultDTO> {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.http.post<FoodRecognitionResultDTO>(`${this.apiUrl}/recognize`, formData, {
      headers: this.getAuthHeaders()
    });
  }

  getFoodSuggestions(query: string): Observable<FoodSuggestionDTO[]> {
    return this.http.get<FoodSuggestionDTO[]>(`${this.apiUrl}/suggestions`, {
      headers: this.getHeaders(),
      params: { query }
    });
  }

  addManualFood(foodEntry: ManualFoodEntryDTO): Observable<FoodRecognitionResultDTO> {
    return this.http.post<FoodRecognitionResultDTO>(`${this.apiUrl}/manual`, foodEntry, {
      headers: this.getHeaders()
    });
  }

  getNutritionalInfo(alimentId: number, quantity: number): Observable<NutritionalInfoDTO> {
    return this.http.get<NutritionalInfoDTO>(`${this.apiUrl}/nutrition/${alimentId}`, {
      headers: this.getHeaders(),
      params: { quantity: quantity.toString() }
    });
  }

  checkHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health`);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // Note: pas de Content-Type pour FormData
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}
```

#### ChartDataService
```typescript
@Injectable({
  providedIn: 'root'
})
export class ChartDataService {
  private apiUrl = 'http://localhost:8095/api/charts';

  constructor(private http: HttpClient, private storageService: StorageService) {}

  getWeightEvolution(userId: number, days: number = 30): Observable<ChartDataDTO> {
    return this.http.get<ChartDataDTO>(`${this.apiUrl}/weight-evolution/${userId}`, {
      headers: this.getHeaders(),
      params: { days: days.toString() }
    });
  }

  getBMIEvolution(userId: number, days: number = 30): Observable<ChartDataDTO> {
    return this.http.get<ChartDataDTO>(`${this.apiUrl}/bmi-evolution/${userId}`, {
      headers: this.getHeaders(),
      params: { days: days.toString() }
    });
  }

  getCaloriesComparison(userId: number, days: number = 7): Observable<ChartDataDTO> {
    return this.http.get<ChartDataDTO>(`${this.apiUrl}/calories-comparison/${userId}`, {
      headers: this.getHeaders(),
      params: { days: days.toString() }
    });
  }

  getActivityDistribution(userId: number, days: number = 30): Observable<ChartDataDTO> {
    return this.http.get<ChartDataDTO>(`${this.apiUrl}/activity-distribution/${userId}`, {
      headers: this.getHeaders(),
      params: { days: days.toString() }
    });
  }

  getWeeklyProgress(userId: number): Observable<WeeklyProgressDTO[]> {
    return this.http.get<WeeklyProgressDTO[]>(`${this.apiUrl}/weekly-progress/${userId}`, {
      headers: this.getHeaders()
    });
  }

  getMonthlyTrends(userId: number): Observable<MonthlyTrendsDTO[]> {
    return this.http.get<MonthlyTrendsDTO[]>(`${this.apiUrl}/monthly-trends/${userId}`, {
      headers: this.getHeaders()
    });
  }

  private getHeaders(): HttpHeaders {
    const token = this.storageService.getItem('jwt');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

<function_calls>
<invoke name="prework">
<parameter name="featureName">backend-api-integration

### Property 1: Audit Log API Integration
*For any* audit log request with pagination parameters, the system should call the correct API endpoint with properly formatted query parameters
**Validates: Requirements 1.1, 1.2**

### Property 2: Enhanced Client Statistics Display
*For any* coach client list, all displayed statistics (programsCount, progressRate, lastActivity) should reflect real calculated values from the backend
**Validates: Requirements 2.1, 2.2**

### Property 3: Programme CRUD Operations
*For any* programme modification or deletion, the system should call the correct HTTP method (PUT/DELETE) and update the UI accordingly
**Validates: Requirements 3.1, 3.2**

### Property 4: Food Recognition File Validation
*For any* file upload attempt, only JPG, PNG, and GIF formats should be accepted and properly sent to the recognition API
**Validates: Requirements 4.1, 4.2**

### Property 5: Food Recognition Result Display
*For any* successful food recognition, all required fields (name, category, confidence) should be displayed to the user
**Validates: Requirements 4.3**

### Property 6: Chart Data Integration
*For any* chart request, the system should call the correct chart API endpoint and render the data using Chart.js
**Validates: Requirements 5.1, 5.2**

### Property 7: Admin Dashboard Integration
*For any* admin dashboard access, the system should call the admin API and display comprehensive system statistics
**Validates: Requirements 6.1**

### Property 8: Responsive Design Adaptation
*For any* screen size change, all new components should adapt their layout appropriately for mobile, tablet, and desktop
**Validates: Requirements 7.1**

### Property 9: Loading State Management
*For any* API request, appropriate loading indicators should be displayed until the request completes or fails
**Validates: Requirements 8.1**

### Property 10: Route Integration
*For any* new feature route, lazy loading should be properly configured and navigation should work seamlessly
**Validates: Requirements 9.1, 10.1**

## Error Handling

### API Error Management Strategy
```typescript
@Injectable({
  providedIn: 'root'
})
export class ApiErrorHandlerService {
  handleError(error: HttpErrorResponse, context: string): Observable<never> {
    let userMessage: string;
    
    switch (error.status) {
      case 400:
        userMessage = this.getBadRequestMessage(error, context);
        break;
      case 401:
        userMessage = 'Session expirée. Veuillez vous reconnecter.';
        // Redirect to login
        break;
      case 403:
        userMessage = 'Accès non autorisé à cette fonctionnalité.';
        break;
      case 404:
        userMessage = this.getNotFoundMessage(context);
        break;
      case 413:
        userMessage = 'Fichier trop volumineux. Taille maximale: 5MB.';
        break;
      case 415:
        userMessage = 'Format de fichier non supporté. Utilisez JPG, PNG ou GIF.';
        break;
      case 500:
        userMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        break;
      default:
        userMessage = 'Une erreur inattendue s\'est produite.';
    }
    
    // Log error for debugging
    console.error(`API Error in ${context}:`, error);
    
    return throwError(() => new Error(userMessage));
  }

  private getBadRequestMessage(error: HttpErrorResponse, context: string): string {
    if (context === 'food-recognition' && error.error?.message) {
      return `Reconnaissance échouée: ${error.error.message}`;
    }
    if (context === 'programme-management') {
      return 'Données du programme invalides. Vérifiez les champs requis.';
    }
    return 'Données invalides. Veuillez vérifier votre saisie.';
  }

  private getNotFoundMessage(context: string): string {
    switch (context) {
      case 'audit-logs':
        return 'Aucun log d\'audit trouvé pour ces critères.';
      case 'programme-management':
        return 'Programme non trouvé ou supprimé.';
      case 'food-recognition':
        return 'Aliment non trouvé dans la base de données.';
      default:
        return 'Ressource non trouvée.';
    }
  }
}
```

### Offline Mode and Network Resilience
```typescript
@Injectable({
  providedIn: 'root'
})
export class NetworkResilienceService {
  private isOnline$ = new BehaviorSubject<boolean>(navigator.onLine);
  private retryQueue: Array<{ request: () => Observable<any>, callback: (result: any) => void }> = [];

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline$.next(true);
      this.processRetryQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline$.next(false);
    });
  }

  isOnline(): Observable<boolean> {
    return this.isOnline$.asObservable();
  }

  executeWithRetry<T>(request: () => Observable<T>, maxRetries: number = 3): Observable<T> {
    return request().pipe(
      retry({
        count: maxRetries,
        delay: (error, retryCount) => {
          if (!navigator.onLine) {
            // Queue for later if offline
            return NEVER;
          }
          // Exponential backoff: 1s, 2s, 4s
          return timer(Math.pow(2, retryCount - 1) * 1000);
        }
      }),
      catchError(error => {
        if (!navigator.onLine) {
          // Add to retry queue
          this.addToRetryQueue(request);
          return throwError(() => new Error('Hors ligne. La requête sera réessayée automatiquement.'));
        }
        return throwError(() => error);
      })
    );
  }

  private addToRetryQueue<T>(request: () => Observable<T>): void {
    this.retryQueue.push({
      request,
      callback: (result) => {
        // Handle successful retry
        console.log('Requête réessayée avec succès:', result);
      }
    });
  }

  private processRetryQueue(): void {
    const queue = [...this.retryQueue];
    this.retryQueue = [];
    
    queue.forEach(item => {
      item.request().subscribe({
        next: item.callback,
        error: (error) => {
          console.error('Échec de la requête réessayée:', error);
          // Could re-add to queue or show user notification
        }
      });
    });
  }
}
```

## Testing Strategy

### Unit Tests
- Validation des nouveaux services (AdminService, FoodRecognitionService, ChartDataService)
- Tests des composants d'interface (upload, graphiques, tableaux admin)
- Validation des transformations de données et formatage
- Tests des guards et intercepteurs pour les nouvelles routes
- Validation de la logique de cache et synchronisation

### Property-Based Tests
- **Property 1 Test**: Générer des paramètres d'audit aléatoires, vérifier les appels API corrects
- **Property 2 Test**: Générer des données client, vérifier l'affichage des statistiques réelles
- **Property 3 Test**: Générer des opérations CRUD programme, vérifier les méthodes HTTP correctes
- **Property 4 Test**: Générer des fichiers de différents formats, vérifier la validation
- **Property 5 Test**: Générer des résultats de reconnaissance, vérifier l'affichage complet
- **Property 6 Test**: Générer des données de graphiques, vérifier le rendu Chart.js
- **Property 7 Test**: Tester l'accès admin, vérifier les appels API dashboard
- **Property 8 Test**: Tester différentes tailles d'écran, vérifier l'adaptation responsive
- **Property 9 Test**: Générer des requêtes API, vérifier les indicateurs de chargement
- **Property 10 Test**: Tester la navigation, vérifier le lazy loading des routes

### Integration Tests
- Communication avec les nouvelles APIs backend
- Intégration des nouveaux composants avec l'architecture existante
- Tests de bout en bout pour les workflows complets
- Validation de la cohérence des données entre services

### E2E Tests
- Parcours complet d'audit logging admin
- Workflow de reconnaissance d'aliments avec upload
- Navigation dans les graphiques d'évolution
- Gestion complète des programmes (CRUD)
- Tests responsive sur différents appareils

## Implementation Notes

### Performance Optimizations

#### Lazy Loading Configuration
```typescript
// app.routes.ts - Nouvelles routes avec lazy loading
const routes: Routes = [
  // ... routes existantes ...
  
  // Admin routes
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      {
        path: 'audit-logs',
        loadComponent: () => import('./admin/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./admin/user-management/user-management.component').then(m => m.UserManagementComponent)
      }
    ]
  },
  
  // Food Recognition routes
  {
    path: 'food-recognition',
    canActivate: [AuthGuard],
    loadComponent: () => import('./food-recognition/food-recognition-container/food-recognition-container.component').then(m => m.FoodRecognitionContainerComponent)
  },
  
  // Charts routes
  {
    path: 'charts',
    canActivate: [AuthGuard],
    loadComponent: () => import('./charts/charts-container/charts-container.component').then(m => m.ChartsContainerComponent)
  }
];
```

#### Virtual Scrolling for Large Lists
```typescript
// audit-logs.component.html
<cdk-virtual-scroll-viewport itemSize="60" class="audit-viewport">
  <div *cdkVirtualFor="let log of auditLogs; trackBy: trackByLogId" class="audit-log-item">
    <app-audit-log-item [log]="log"></app-audit-log-item>
  </div>
</cdk-virtual-scroll-viewport>
```

#### Image Compression for Food Recognition
```typescript
@Injectable()
export class ImageCompressionService {
  compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          const compressedFile = new File([blob!], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        }, file.type, quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
}
```

### Chart.js Integration
```typescript
// charts-container.component.ts
@Component({
  selector: 'app-charts-container',
  template: `
    <div class="charts-grid">
      <div class="chart-card" *ngFor="let chartConfig of chartConfigs">
        <canvas #chartCanvas></canvas>
      </div>
    </div>
  `
})
export class ChartsContainerComponent implements OnInit, AfterViewInit {
  @ViewChildren('chartCanvas') chartCanvases!: QueryList<ElementRef<HTMLCanvasElement>>;
  
  chartConfigs = [
    { type: 'weight-evolution', title: 'Évolution du Poids' },
    { type: 'bmi-evolution', title: 'Évolution IMC' },
    { type: 'calories-comparison', title: 'Comparaison Calories' },
    { type: 'activity-distribution', title: 'Distribution Activités' },
    { type: 'weekly-progress', title: 'Progrès Hebdomadaire' },
    { type: 'monthly-trends', title: 'Tendances Mensuelles' }
  ];

  private charts: Chart[] = [];

  constructor(private chartDataService: ChartDataService) {}

  ngAfterViewInit(): void {
    this.initializeCharts();
  }

  private initializeCharts(): void {
    this.chartCanvases.forEach((canvasRef, index) => {
      const config = this.chartConfigs[index];
      this.loadChartData(config.type).subscribe(data => {
        const chart = new Chart(canvasRef.nativeElement, {
          type: this.getChartType(config.type),
          data: data,
          options: this.getChartOptions(config.type)
        });
        this.charts.push(chart);
      });
    });
  }

  private loadChartData(chartType: string): Observable<ChartDataDTO> {
    const userId = this.getCurrentUserId();
    
    switch (chartType) {
      case 'weight-evolution':
        return this.chartDataService.getWeightEvolution(userId);
      case 'bmi-evolution':
        return this.chartDataService.getBMIEvolution(userId);
      case 'calories-comparison':
        return this.chartDataService.getCaloriesComparison(userId);
      case 'activity-distribution':
        return this.chartDataService.getActivityDistribution(userId);
      default:
        return of({ labels: [], datasets: [] });
    }
  }
}
```

### Caching Strategy
```typescript
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  invalidate(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter(key => 
      key.includes(pattern)
    );
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  clear(): void {
    this.cache.clear();
  }
}
```

### Accessibility Features
- **ARIA labels** pour tous les nouveaux composants interactifs
- **Keyboard navigation** complète pour les tableaux d'audit et graphiques
- **Screen reader support** pour les résultats de reconnaissance d'aliments
- **High contrast mode** compatibility pour tous les nouveaux éléments
- **Focus management** dans les modals et formulaires d'administration
- **Alternative text** pour les graphiques et images uploadées

### Mobile Optimization
- **Touch-friendly** interfaces pour l'upload d'images
- **Swipe gestures** pour naviguer dans les graphiques
- **Responsive tables** avec scroll horizontal pour les audit logs
- **Modal optimization** pour les petits écrans
- **Performance optimization** pour les appareils moins puissants