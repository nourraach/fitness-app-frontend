# Design Document

## Overview

Ce document décrit l'architecture technique pour l'intégration frontend du système de notifications in-app. Le système sera composé d'un centre de notifications, d'un badge de compteur, d'un service de communication API, et d'une intégration WebSocket pour les notifications temps réel. L'implémentation utilisera PrimeNG pour la cohérence avec l'application existante.

## Architecture

### Component Architecture
```
NotificationCenterComponent
├── NotificationBadgeComponent (badge compteur dans navbar)
├── NotificationListComponent (liste des notifications)
├── NotificationItemComponent (notification individuelle)
├── NotificationHistoryComponent (historique avec filtres)
├── NotificationStatsComponent (statistiques)
└── NotificationToastComponent (toast temps réel)

Services
├── InAppNotificationService (API communication)
├── WebsocketService (existing - extended for notifications)
└── NotificationStateService (state management)
```

### Data Flow
```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
├─────────────────────────────────────────────────────────────────┤
│  NavbarComponent                                                 │
│  └── NotificationBadgeComponent (compteur non-lues)             │
│                                                                  │
│  NotificationCenterComponent (panneau/dropdown)                  │
│  ├── NotificationListComponent                                   │
│  │   └── NotificationItemComponent[] (liste)                    │
│  ├── NotificationHistoryComponent (historique + filtres)        │
│  └── NotificationStatsComponent (graphiques)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     State Management                             │
├─────────────────────────────────────────────────────────────────┤
│  NotificationStateService                                        │
│  ├── notifications$ (BehaviorSubject<Notification[]>)           │
│  ├── unreadCount$ (BehaviorSubject<number>)                     │
│  ├── loading$ (BehaviorSubject<boolean>)                        │
│  └── error$ (BehaviorSubject<string | null>)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Services Layer                               │
├─────────────────────────────────────────────────────────────────┤
│  InAppNotificationService                                        │
│  ├── getNotifications()                                          │
│  ├── getUnreadNotifications()                                    │
│  ├── getUnreadCount()                                            │
│  ├── markAsRead(id)                                              │
│  ├── markAsUnread(id)                                            │
│  ├── markAllAsRead()                                             │
│  ├── getHistory(filters)                                         │
│  ├── getStats()                                                  │
│  └── exportNotifications()                                       │
│                                                                  │
│  WebsocketService (extended)                                     │
│  └── notificationSubject$ (new notification events)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Backend API                                  │
├─────────────────────────────────────────────────────────────────┤
│  GET  /api/notifications                                         │
│  GET  /api/notifications/non-lues                                │
│  GET  /api/notifications/count-non-lues                          │
│  PUT  /api/notifications/{id}/lire                               │
│  PUT  /api/notifications/{id}/unread                             │
│  PUT  /api/notifications/lire-toutes                             │
│  GET  /api/notifications/history                                 │
│  GET  /api/notifications/stats                                   │
│  GET  /api/notifications/export                                  │
│  POST /api/notifications/test                                    │
│  POST /api/notifications/creer                                   │
│  GET  /api/notifications/preferences                             │
│  PUT  /api/notifications/preferences                             │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. NotificationBadgeComponent

**Responsabilité:** Afficher le compteur de notifications non lues dans la navbar

**Template Features:**
- Badge PrimeNG avec compteur
- Affichage "99+" si > 99
- Masqué si compteur = 0
- Animation pulse pour nouvelles notifications

**Inputs/Outputs:**
```typescript
@Input() count: number = 0;
@Output() badgeClick = new EventEmitter<void>();
```

### 2. NotificationCenterComponent

**Responsabilité:** Panneau principal de gestion des notifications

**Template Features:**
- Panneau latéral (p-sidebar) ou dropdown selon taille écran
- Tabs pour "Toutes" / "Non lues" / "Historique" / "Stats"
- Bouton "Tout marquer comme lu"
- Indicateur de chargement
- Messages d'erreur avec retry

### 3. NotificationItemComponent

**Responsabilité:** Affichage d'une notification individuelle

**Template Features:**
- Icône selon type de notification
- Titre et message
- Date relative (il y a 5 min, hier, etc.)
- Indicateur visuel lu/non-lu
- Menu contextuel (marquer lu/non-lu)

### 4. NotificationHistoryComponent

**Responsabilité:** Historique avec filtres

**Template Features:**
- Filtres par type (dropdown)
- Filtres par date (date range picker)
- Filtre par statut (lu/non-lu)
- Pagination
- Export RGPD

### 5. NotificationStatsComponent

**Responsabilité:** Affichage des statistiques

**Template Features:**
- Graphique camembert (répartition par type)
- Graphique barre (notifications par jour)
- KPIs (total, taux de lecture)

### 6. InAppNotificationService

**Responsabilité:** Communication avec l'API backend

**Methods:**
```typescript
getNotifications(): Observable<Notification[]>
getUnreadNotifications(): Observable<Notification[]>
getUnreadCount(): Observable<number>
markAsRead(id: number): Observable<Notification>
markAsUnread(id: number): Observable<Notification>
markAllAsRead(): Observable<void>
getHistory(filters: NotificationFilters): Observable<NotificationHistory>
getStats(): Observable<NotificationStats>
exportNotifications(): Observable<Blob>
createTestNotification(): Observable<Notification>
createNotification(data: CreateNotificationRequest): Observable<Notification>
getPreferences(): Observable<NotificationPreferences>
updatePreferences(preferences: NotificationPreferences): Observable<NotificationPreferences>
```

### 7. NotificationStateService

**Responsabilité:** Gestion centralisée de l'état des notifications

**State:**
```typescript
private notificationsSubject = new BehaviorSubject<Notification[]>([]);
private unreadCountSubject = new BehaviorSubject<number>(0);
private loadingSubject = new BehaviorSubject<boolean>(false);
private errorSubject = new BehaviorSubject<string | null>(null);

// Public observables
notifications$ = this.notificationsSubject.asObservable();
unreadCount$ = this.unreadCountSubject.asObservable();
loading$ = this.loadingSubject.asObservable();
error$ = this.errorSubject.asObservable();
```

## Data Models

### Notification Interface
```typescript
interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string; // ISO date
  data?: Record<string, any>; // données additionnelles
  actionUrl?: string; // lien vers action
}

enum NotificationType {
  MEAL_REMINDER = 'MEAL_REMINDER',
  WORKOUT_REMINDER = 'WORKOUT_REMINDER',
  MOTIVATIONAL = 'MOTIVATIONAL',
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  CHALLENGE = 'CHALLENGE',
  ACHIEVEMENT = 'ACHIEVEMENT',
  SYSTEM = 'SYSTEM'
}
```

### NotificationFilters Interface
```typescript
interface NotificationFilters {
  type?: NotificationType;
  startDate?: string;
  endDate?: string;
  read?: boolean;
  page?: number;
  size?: number;
}
```

### NotificationStats Interface
```typescript
interface NotificationStats {
  total: number;
  unread: number;
  readRate: number; // percentage
  byType: { type: NotificationType; count: number }[];
  byDay: { date: string; count: number }[];
}
```

### NotificationHistory Interface
```typescript
interface NotificationHistory {
  content: Notification[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}
```

### CreateNotificationRequest Interface
```typescript
interface CreateNotificationRequest {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  actionUrl?: string;
}
```

### NotificationPreferences Interface
```typescript
interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  mealReminders: boolean;
  workoutReminders: boolean;
  motivationalMessages: boolean;
  friendRequests: boolean;
  challenges: boolean;
  achievements: boolean;
  reminderTime?: string; // HH:mm format
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: API Communication Correctness
*For any* user action (open notifications, mark as read, mark as unread), the service should call the correct API endpoint with proper parameters and authentication headers.
**Validates: Requirements 1.1, 3.1, 4.1**

### Property 2: Notification Rendering Completeness
*For any* notification data received from the API, the rendered notification item should display all required fields: title, message, date, and read status indicator.
**Validates: Requirements 1.2**

### Property 3: Loading State Consistency
*For any* async operation (load, save, export), the loading indicator should be visible during the operation and hidden after completion or error.
**Validates: Requirements 1.3, 8.3**

### Property 4: Badge Display Logic
*For any* unread count value, the badge should display the count if > 0, display "99+" if > 99, and be hidden if = 0.
**Validates: Requirements 2.2, 2.4**

### Property 5: Badge Count Synchronization
*For any* state change (mark read, mark unread, new notification), the badge count should be updated to reflect the current number of unread notifications.
**Validates: Requirements 2.5, 3.4, 4.3, 6.3**

### Property 6: Notification Visual State Consistency
*For any* notification, its visual appearance (read/unread style) should match its actual read status in the state.
**Validates: Requirements 3.2, 4.2**

### Property 7: Filter Functionality
*For any* filter combination (type, date range, status), the returned notifications should only include items matching all active filter criteria.
**Validates: Requirements 5.2, 5.3, 5.4, 5.5**

### Property 8: Real-time Update Integration
*For any* new notification received via WebSocket, it should be added to the top of the notification list and trigger a toast notification.
**Validates: Requirements 6.2, 6.4**

### Property 9: WebSocket Reconnection
*For any* WebSocket connection loss, the service should attempt automatic reconnection with exponential backoff up to the maximum retry limit.
**Validates: Requirements 6.5**

### Property 10: Stats Data Rendering
*For any* stats data received from the API, the component should display total count, type distribution, and read rate correctly.
**Validates: Requirements 7.2, 7.3, 7.4**

### Property 11: Error Handling by Status Code
*For any* API error, the appropriate error message should be displayed based on the HTTP status code (401 → redirect to login, 500 → generic error, network → connection error).
**Validates: Requirements 1.5, 3.5, 4.4, 8.4, 10.1, 10.2, 10.3**

### Property 12: Retry Logic
*For any* network error, the service should retry the request up to 3 times with exponential backoff before showing an error.
**Validates: Requirements 10.4**

### Property 13: Test Notification Creation
*For any* test notification request, the service should call POST /api/notifications/test and the created notification should appear in the notification list.
**Validates: Requirements 11.1, 11.2, 11.3**

### Property 14: Manual Notification Creation
*For any* valid CreateNotificationRequest, the service should call POST /api/notifications/creer with the correct payload and return the created notification.
**Validates: Requirements 12.1, 12.2**

### Property 15: Preferences Synchronization
*For any* preferences update, the service should call PUT /api/notifications/preferences and the updated preferences should be reflected in subsequent GET requests.
**Validates: Requirements 14.1, 14.3**

## Error Handling

### Error Types and Responses
| Status Code | Action | Message |
|-------------|--------|---------|
| 400 | Display validation errors | Message du backend |
| 401 | Redirect to login | "Session expirée" |
| 403 | Display access denied | "Accès refusé" |
| 500 | Display generic error | "Erreur serveur" |
| Network | Display connection error + retry | "Problème de connexion" |

### Retry Strategy
```typescript
const retryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};
```

## Testing Strategy

### Dual Testing Approach
- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

### Testing Framework Configuration
- **Framework**: Jasmine with Karma (existing)
- **Property Testing**: fast-check library
- **Minimum Iterations**: 100 per property test
- **Mock Strategy**: Mock HTTP calls, WebSocket, and external dependencies

### Test Organization
```
in-app-notifications/
├── notification-badge.component.spec.ts
├── notification-center.component.spec.ts
├── notification-item.component.spec.ts
├── in-app-notification.service.spec.ts
├── notification-state.service.spec.ts
├── in-app-notifications.property.spec.ts
└── test-helpers/
    ├── mock-notifications.ts
    └── notification-generators.ts
```

### Property Test Tags
Each property test must include a comment referencing its design document property:
```typescript
// Feature: in-app-notifications, Property 1: API Communication Correctness
it('should call correct API endpoint for each action', () => { ... });
```

## Implementation Notes

### PrimeNG Components Used
- `p-sidebar` - Panneau latéral notifications
- `p-badge` - Badge compteur
- `p-button` - Boutons actions
- `p-menu` - Menu contextuel
- `p-dropdown` - Filtres type
- `p-calendar` - Filtres date
- `p-paginator` - Pagination historique
- `p-chart` - Graphiques stats
- `p-toast` - Notifications toast
- `p-progressSpinner` - Indicateur chargement
- `p-tabView` - Onglets navigation

### Performance Optimizations
- OnPush change detection
- Virtual scrolling pour longues listes
- Debounce sur les filtres (300ms)
- Cache des notifications avec TTL 2 minutes
- Lazy loading du composant stats

### Accessibility Features
- ARIA labels sur tous les contrôles
- Navigation clavier
- Annonces screen reader pour nouvelles notifications
- Contraste suffisant pour indicateurs lu/non-lu

### Integration avec l'existant
- Utilisation du WebsocketService existant (extension)
- Utilisation du JwtService pour l'authentification
- Utilisation de l'ApiErrorHandlerService existant
- Intégration dans NavbarComponent existant
