# Design Document - Système de Notifications Frontend

## Overview

Ce design intègre le système de notifications personnalisées backend avec une interface frontend complète. L'architecture suit les patterns Angular existants et s'intègre harmonieusement avec l'application fitness existante.

## Architecture

### Structure des Composants
```
NotificationsModule
├── NotificationsContainerComponent (page principale)
├── NotificationPreferencesComponent (configuration)
├── NotificationHistoryComponent (historique)
├── NotificationStatsComponent (statistiques)
├── NotificationItemComponent (élément individuel)
├── NotificationToastComponent (notifications temps réel)
└── NotificationBadgeComponent (indicateur navbar)
```

### Services
```
NotificationService (API integration)
├── NotificationPreferencesService (gestion préférences)
├── NotificationHistoryService (historique et stats)
├── NotificationRealtimeService (WebSocket/polling)
└── NotificationCacheService (cache local)
```

## Components and Interfaces

### Models TypeScript

#### NotificationPreferences
```typescript
interface NotificationPreferences {
  id?: number;
  userId: number;
  
  // Types de notifications
  mealRemindersEnabled: boolean;
  workoutRemindersEnabled: boolean;
  motivationalMessagesEnabled: boolean;
  hydrationRemindersEnabled: boolean;
  
  // Heures des repas
  breakfastTime: string; // "HH:MM"
  lunchTime: string;
  dinnerTime: string;
  snackTimes: string[]; // ["10:00", "15:00"]
  
  // Configuration entraînement
  workoutDays: WeekDay[];
  workoutTime: string;
  
  // Messages motivationnels
  motivationalFrequency: number; // 0-10 par semaine
  
  // Hydratation
  hydrationInterval: number; // minutes
  hydrationStartTime: string;
  hydrationEndTime: string;
  
  // Heures de silence
  quietTimeEnabled: boolean;
  quietTimeStart: string;
  quietTimeEnd: string;
  
  // Jours actifs
  activeDays: WeekDay[];
  
  // Limites
  maxDailyNotifications: number; // 1-50
  
  // Préférences avancées
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  
  createdAt?: Date;
  updatedAt?: Date;
}

enum WeekDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}
```

#### NotificationHistory
```typescript
interface NotificationHistory {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  content: string;
  scheduledTime: Date;
  sentTime?: Date;
  readTime?: Date;
  status: NotificationStatus;
  actionTaken: boolean;
  feedback?: 'USEFUL' | 'NOT_RELEVANT';
  metadata?: { [key: string]: any };
}

enum NotificationType {
  MEAL_REMINDER = 'MEAL_REMINDER',
  WORKOUT_REMINDER = 'WORKOUT_REMINDER',
  MOTIVATIONAL_MESSAGE = 'MOTIVATIONAL_MESSAGE',
  HYDRATION_REMINDER = 'HYDRATION_REMINDER'
}

enum NotificationStatus {
  SCHEDULED = 'SCHEDULED',
  SENT = 'SENT',
  READ = 'READ',
  DISMISSED = 'DISMISSED',
  FAILED = 'FAILED'
}
```

#### NotificationStats
```typescript
interface NotificationStats {
  totalSent: number;
  totalRead: number;
  totalActionTaken: number;
  readRate: number; // pourcentage
  actionRate: number; // pourcentage
  
  byType: {
    [key in NotificationType]: {
      sent: number;
      read: number;
      actionTaken: number;
    }
  };
  
  weeklyTrend: {
    date: string;
    sent: number;
    read: number;
  }[];
  
  engagementScore: number; // 0-100
  recommendations: string[];
}
```

### Services Architecture

#### NotificationService
```typescript
@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8095/api/notifications';
  
  // Préférences
  getPreferences(userId: number): Observable<NotificationPreferences>;
  updatePreferences(userId: number, prefs: NotificationPreferences): Observable<void>;
  resetPreferences(userId: number): Observable<NotificationPreferences>;
  
  // Historique
  getHistory(userId: number, filters?: HistoryFilters): Observable<NotificationHistory[]>;
  markAsRead(notificationId: number): Observable<void>;
  submitFeedback(notificationId: number, feedback: string): Observable<void>;
  
  // Statistiques
  getStats(userId: number): Observable<NotificationStats>;
  
  // Temps réel
  subscribeToNotifications(userId: number): Observable<NotificationHistory>;
}
```

## Data Models

### API Integration Models

#### API Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

interface HistoryFilters {
  type?: NotificationType;
  startDate?: Date;
  endDate?: Date;
  status?: NotificationStatus;
  page?: number;
  size?: number;
}
```

### Component State Models

#### NotificationState
```typescript
interface NotificationState {
  preferences: NotificationPreferences | null;
  history: NotificationHistory[];
  stats: NotificationStats | null;
  unreadCount: number;
  realtimeNotifications: NotificationHistory[];
  loading: {
    preferences: boolean;
    history: boolean;
    stats: boolean;
  };
  error: {
    preferences: string | null;
    history: string | null;
    stats: string | null;
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Preferences Validation
*For any* notification preferences update, all time fields should be in valid HH:MM format and quiet time start should be before quiet time end
**Validates: Requirements 1.3, 1.5**

### Property 2: History Pagination Consistency
*For any* history request with pagination, the total number of items across all pages should equal the total count returned by the API
**Validates: Requirements 2.1**

### Property 3: Real-time Notification Uniqueness
*For any* real-time notification received, it should not duplicate existing notifications in the history
**Validates: Requirements 4.1, 4.6**

### Property 4: Stats Calculation Accuracy
*For any* notification statistics, the read rate should equal (total read / total sent) * 100
**Validates: Requirements 3.2**

### Property 5: Mobile Responsiveness
*For any* screen size below 768px, all notification components should adapt to mobile layout
**Validates: Requirements 5.1, 5.2**

### Property 6: Cache Consistency
*For any* cached notification data, it should remain consistent with server data within the cache TTL period
**Validates: Requirements 7.7**

## Error Handling

### API Error Management
```typescript
class NotificationErrorHandler {
  handleApiError(error: HttpErrorResponse): Observable<never> {
    let userMessage: string;
    
    switch (error.status) {
      case 400:
        userMessage = 'Données invalides. Veuillez vérifier vos paramètres.';
        break;
      case 404:
        userMessage = 'Ressource non trouvée.';
        break;
      case 500:
        userMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        break;
      default:
        userMessage = 'Une erreur inattendue s\'est produite.';
    }
    
    return throwError(() => new Error(userMessage));
  }
}
```

### Offline Mode Strategy
- **Cache local** : Stockage des préférences et historique récent
- **Queue des actions** : Mise en file d'attente des modifications hors ligne
- **Synchronisation** : Envoi automatique lors du retour en ligne
- **Indicateurs visuels** : Statut de connexion clairement affiché

## Testing Strategy

### Unit Tests
- Validation des formulaires de préférences
- Formatage des dates et heures
- Calculs de statistiques
- Gestion des erreurs API
- Logique de cache et synchronisation

### Property-Based Tests
- **Property 1 Test**: Générer des préférences aléatoires, valider les contraintes temporelles
- **Property 2 Test**: Générer des requêtes de pagination, vérifier la cohérence
- **Property 3 Test**: Générer des notifications temps réel, vérifier l'unicité
- **Property 4 Test**: Générer des données de stats, vérifier les calculs
- **Property 5 Test**: Tester différentes tailles d'écran, vérifier l'adaptation
- **Property 6 Test**: Générer des opérations de cache, vérifier la cohérence

### Integration Tests
- Communication avec les APIs backend
- Synchronisation temps réel des notifications
- Navigation entre les différentes vues
- Persistance des préférences utilisateur

### E2E Tests
- Parcours complet de configuration des préférences
- Réception et gestion des notifications temps réel
- Consultation de l'historique avec filtres
- Responsive design sur différents appareils

## Implementation Notes

### Performance Optimizations
```typescript
// Lazy loading des modules
const routes: Routes = [
  {
    path: 'notifications',
    loadChildren: () => import('./notifications/notifications.module').then(m => m.NotificationsModule)
  }
];

// Virtual scrolling pour l'historique
@Component({
  template: `
    <cdk-virtual-scroll-viewport itemSize="80" class="notification-viewport">
      <div *cdkVirtualFor="let notification of notifications">
        <app-notification-item [notification]="notification"></app-notification-item>
      </div>
    </cdk-virtual-scroll-viewport>
  `
})
```

### Real-time Integration
```typescript
// WebSocket pour les notifications temps réel
@Injectable()
export class NotificationRealtimeService {
  private socket$ = new WebSocketSubject('ws://localhost:8095/ws/notifications');
  
  connect(userId: number): Observable<NotificationHistory> {
    return this.socket$.pipe(
      filter(message => message.userId === userId),
      map(message => message.notification)
    );
  }
}

// Fallback polling si WebSocket indisponible
private pollForNotifications(userId: number): Observable<NotificationHistory[]> {
  return interval(30000).pipe(
    switchMap(() => this.getRecentNotifications(userId))
  );
}
```

### Caching Strategy
```typescript
@Injectable()
export class NotificationCacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttlMinutes: number = 5): void {
    this.cache.set(key, {
      data,
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
}
```

### Accessibility Features
- **ARIA labels** pour tous les éléments interactifs
- **Keyboard navigation** complète
- **Screen reader support** pour les notifications
- **High contrast mode** compatibility
- **Focus management** dans les modals et formulaires