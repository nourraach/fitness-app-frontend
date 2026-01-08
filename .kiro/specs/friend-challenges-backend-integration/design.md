# Design Document: Friend Challenges Backend Integration

## Overview

Ce document décrit l'architecture et la conception de l'intégration frontend Angular pour la fonctionnalité "Défis entre Amis". Le frontend se connecte à une API REST Spring Boot existante exposée sur `http://localhost:8095/api/friend-challenges/*`.

L'implémentation utilise une architecture réactive avec RxJS pour la gestion d'état, des services Angular pour l'abstraction des appels API, et des composants standalone pour l'interface utilisateur.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         COMPOSANTS UI                                │
│  ┌─────────────────────┐  ┌─────────────────────────────────────┐   │
│  │ FriendChallenges    │  │ ChallengesManager                   │   │
│  │ Component           │  │ Component                           │   │
│  └─────────────────────┘  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVICES                                     │
│  ┌─────────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ FriendChallenge     │  │ JwtService      │  │ ErrorHandler    │  │
│  │ Service             │  │                 │  │ Service         │  │
│  └─────────────────────┘  └─────────────────┘  └─────────────────┘  │
│  ┌─────────────────────┐  ┌─────────────────┐                       │
│  │ FriendService       │  │ StorageService  │                       │
│  └─────────────────────┘  └─────────────────┘                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API BACKEND                                  │
│                 http://localhost:8095/api/friend-challenges          │
└─────────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### FriendChallengeService

Service principal gérant les appels API et l'état des défis.

```typescript
interface FriendChallengeService {
  // Observables d'état
  myChallenges$: Observable<FriendChallenge[]>;
  activeChallenges$: Observable<FriendChallenge[]>;
  createdChallenges$: Observable<FriendChallenge[]>;
  leaderboards$: Observable<{ [challengeId: number]: ChallengeLeaderboard }>;
  
  // Méthodes CRUD
  createChallenge(request: CreateFriendChallengeRequest): Observable<FriendChallenge>;
  joinChallenge(challengeId: number): Observable<boolean>;
  cancelChallenge(challengeId: number): Observable<boolean>;
  
  // Méthodes de lecture
  loadMyChallenges(): Observable<FriendChallenge[]>;
  loadActiveChallenges(): Observable<FriendChallenge[]>;
  loadCreatedChallenges(): Observable<FriendChallenge[]>;
  getChallengeDetails(challengeId: number): Observable<FriendChallenge>;
  getChallengeLeaderboard(challengeId: number): Observable<ChallengeLeaderboard>;
  
  // Méthodes de progression
  updateProgress(challengeId: number, request: UpdateProgressRequest): Observable<boolean>;
  getChallengeProgress(challengeId: number, userId?: number): Observable<ChallengeProgress>;
  
  // Utilitaires
  getChallengeTypeOptions(): ChallengeTypeOption[];
  refreshAllData(): void;
}
```

### API Endpoints Mapping

| Méthode Frontend | Endpoint Backend | HTTP Method |
|------------------|------------------|-------------|
| `createChallenge()` | `/api/friend-challenges/create?userId={id}` | POST |
| `joinChallenge()` | `/api/friend-challenges/{id}/join?userId={id}` | POST |
| `cancelChallenge()` | `/api/friend-challenges/{id}?userId={id}` | DELETE |
| `loadMyChallenges()` | `/api/friend-challenges/user/{userId}` | GET |
| `loadActiveChallenges()` | `/api/friend-challenges/active` | GET |
| `loadCreatedChallenges()` | `/api/friend-challenges/created/{userId}` | GET |
| `getChallengeDetails()` | `/api/friend-challenges/{id}` | GET |
| `getChallengeLeaderboard()` | `/api/friend-challenges/{id}/leaderboard` | GET |
| `updateProgress()` | `/api/friend-challenges/{id}/progress?userId={id}&progress={val}` | POST |
| `getChallengeProgress()` | `/api/friend-challenges/{id}/progress/{userId}` | GET |

### Helper Functions

```typescript
// Mapping type d'objectif vers unité
function getChallengeTypeUnit(type: ChallengeObjectiveType): string {
  const unitMap: Record<ChallengeObjectiveType, string> = {
    [ChallengeObjectiveType.STEPS]: 'pas',
    [ChallengeObjectiveType.CALORIES]: 'cal',
    [ChallengeObjectiveType.DISTANCE]: 'km',
    [ChallengeObjectiveType.WORKOUTS]: 'séances',
    [ChallengeObjectiveType.DURATION]: 'min'
  };
  return unitMap[type] || '';
}

// Mapping type d'objectif vers icône
function getChallengeTypeIcon(type: ChallengeObjectiveType): string {
  const iconMap: Record<ChallengeObjectiveType, string> = {
    [ChallengeObjectiveType.STEPS]: 'fas fa-walking',
    [ChallengeObjectiveType.CALORIES]: 'fas fa-fire',
    [ChallengeObjectiveType.DISTANCE]: 'fas fa-route',
    [ChallengeObjectiveType.WORKOUTS]: 'fas fa-dumbbell',
    [ChallengeObjectiveType.DURATION]: 'fas fa-clock'
  };
  return iconMap[type] || 'fas fa-trophy';
}

// Mapping type d'objectif vers couleur
function getChallengeTypeColor(type: ChallengeObjectiveType): string {
  const colorMap: Record<ChallengeObjectiveType, string> = {
    [ChallengeObjectiveType.STEPS]: '#4CAF50',
    [ChallengeObjectiveType.CALORIES]: '#FF5722',
    [ChallengeObjectiveType.DISTANCE]: '#2196F3',
    [ChallengeObjectiveType.WORKOUTS]: '#9C27B0',
    [ChallengeObjectiveType.DURATION]: '#FF9800'
  };
  return colorMap[type] || '#607D8B';
}

// Mapping statut vers label
function getStatusLabel(status: ChallengeStatus): string {
  const labelMap: Record<ChallengeStatus, string> = {
    [ChallengeStatus.ACTIVE]: 'Actif',
    [ChallengeStatus.COMPLETED]: 'Terminé',
    [ChallengeStatus.CANCELLED]: 'Annulé'
  };
  return labelMap[status] || status;
}

// Mapping statut vers classe CSS
function getStatusBadgeClass(status: ChallengeStatus): string {
  const classMap: Record<ChallengeStatus, string> = {
    [ChallengeStatus.ACTIVE]: 'status-active',
    [ChallengeStatus.COMPLETED]: 'status-completed',
    [ChallengeStatus.CANCELLED]: 'status-cancelled'
  };
  return classMap[status] || '';
}

// Validation des dates
function validateChallengeDates(startDate: Date, endDate: Date): boolean {
  return endDate > startDate;
}

// Calcul des jours restants
function calculateRemainingDays(endDate: Date): number {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// Vérification si jours restants sont urgents
function isUrgentRemainingDays(joursRestants: number): boolean {
  return joursRestants <= 2;
}
```

## Data Models

### FriendChallenge

```typescript
interface FriendChallenge {
  id: number;
  nom: string;
  description?: string;
  typeObjectif: ChallengeObjectiveType;
  valeurCible: number;
  dateDebut: Date;
  dateFin: Date;
  createurId: number;
  createurNom: string;
  statut: ChallengeStatus;
  nombreParticipants: number;
  isActive: boolean;
  joursRestants: number;
  participants?: ChallengeParticipant[];
  createdAt?: Date;
  updatedAt?: Date;
}
```

### ChallengeParticipant

```typescript
interface ChallengeParticipant {
  id: number;
  challengeId: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  progression: number;
  pourcentageCompletion: number;
  position: number;
  dateInscription: Date;
  dateCompletion?: Date;
  isCompleted: boolean;
  lastActivityDate?: Date;
}
```

### CreateFriendChallengeRequest

```typescript
interface CreateFriendChallengeRequest {
  nom: string;
  description?: string;
  typeObjectif: ChallengeObjectiveType;
  valeurCible: number;
  dateDebut: string; // ISO date string
  dateFin: string;   // ISO date string
  participantsIds: number[];
}
```

### ChallengeLeaderboard

```typescript
interface ChallengeLeaderboard {
  challengeId: number;
  challengeNom: string;
  participants: ChallengeParticipant[];
  totalParticipants: number;
  isCompleted: boolean;
  dateGeneration: Date;
}
```

### Enums

```typescript
enum ChallengeObjectiveType {
  STEPS = 'STEPS',
  CALORIES = 'CALORIES',
  DISTANCE = 'DISTANCE',
  WORKOUTS = 'WORKOUTS',
  DURATION = 'DURATION'
}

enum ChallengeStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}
```

### ApiResponse

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Objective Type to Unit Mapping

*For any* valid ChallengeObjectiveType, the `getChallengeTypeUnit` function should return a non-empty string representing the correct unit for that type.

**Validates: Requirements 1.2**

### Property 2: Date Validation

*For any* pair of dates (startDate, endDate), the `validateChallengeDates` function should return `true` if and only if endDate is strictly after startDate.

**Validates: Requirements 1.5**

### Property 3: Form Validation - Required Fields

*For any* CreateFriendChallengeRequest form state, if any required field (nom, typeObjectif, valeurCible, dateDebut, dateFin) is empty or invalid, the form should be marked as invalid.

**Validates: Requirements 1.6**

### Property 4: Empty State Display

*For any* challenge list that is empty, the component should render an empty state message with a call-to-action suggestion.

**Validates: Requirements 2.6**

### Property 5: State Update After Challenge Creation

*For any* successfully created challenge, the challenge should appear in both `myChallenges$` and `createdChallenges$` observables immediately after creation.

**Validates: Requirements 1.4**

### Property 6: State Update After Joining Challenge

*For any* successfully joined challenge, the challenge should be moved from `activeChallenges$` to `myChallenges$` observable.

**Validates: Requirements 3.2**

### Property 7: Participant Button Visibility

*For any* challenge displayed in the available challenges list, if the current user is already a participant, the "Join" button should be hidden and replaced with "Participant" indicator.

**Validates: Requirements 3.3**

### Property 8: Celebration Trigger at 100% Progress

*For any* progress update that results in progressPercentage >= 100, the celebration animation should be triggered.

**Validates: Requirements 4.4**

### Property 9: Leaderboard Participant Data Display

*For any* participant in a leaderboard, the display should include: position, userName, progression value, and pourcentageCompletion.

**Validates: Requirements 5.2**

### Property 10: Current User Highlighting in Leaderboard

*For any* leaderboard display, if the current user is a participant, their row should have a distinct CSS class applied for highlighting.

**Validates: Requirements 5.3**

### Property 11: First Position Crown Icon

*For any* participant in position 1 of a leaderboard, a crown icon should be displayed next to their position.

**Validates: Requirements 5.4**

### Property 12: State Cleanup After Challenge Cancellation

*For any* successfully cancelled challenge, the challenge should be removed from all observable lists (myChallenges$, activeChallenges$, createdChallenges$, leaderboards$).

**Validates: Requirements 6.3**

### Property 13: Cancel Button Visibility Based on Creator Status

*For any* challenge displayed, the "Cancel" button should only be visible if the current user's ID matches the challenge's createurId.

**Validates: Requirements 6.4**

### Property 14: Challenge Card Required Fields Display

*For any* FriendChallenge object rendered as a card, the display should include: nom, typeObjectif icon, valeurCible with unit, dateDebut, dateFin, nombreParticipants, and joursRestants.

**Validates: Requirements 7.1**

### Property 15: Status Badge Rendering

*For any* ChallengeStatus value, the `getStatusBadgeClass` function should return the correct CSS class: 'status-active' for ACTIVE, 'status-completed' for COMPLETED, 'status-cancelled' for CANCELLED.

**Validates: Requirements 7.2, 7.3, 7.4**

### Property 16: Urgent Styling for Low Remaining Days

*For any* challenge with joursRestants <= 2, the remaining days display should have the 'urgent' CSS class applied.

**Validates: Requirements 7.5**

### Property 17: Error Handling Without Crash

*For any* API error response, the service should catch the error, log it, and return a fallback value (mock data or empty array) without throwing an unhandled exception.

**Validates: Requirements 8.1**

### Property 18: Error Logging

*For any* error caught in the service, the ErrorHandlerService.logError method should be called with the operation name and error object.

**Validates: Requirements 8.3**

### Property 19: Toast Notifications for Actions

*For any* user action (create, join, cancel, update progress), a toast notification should be displayed: success toast for successful operations, error toast for failed operations.

**Validates: Requirements 8.4, 8.5**

### Property 20: Authorization Header in API Requests

*For any* HTTP request made by FriendChallengeService, the request headers should include an 'Authorization' header with the format 'Bearer {token}'.

**Validates: Requirements 9.2**

## Error Handling

### API Error Handling Strategy

```typescript
// Pattern de gestion d'erreur dans le service
private handleApiError<T>(operation: string, fallbackValue: T) {
  return (error: HttpErrorResponse): Observable<T> => {
    // Log l'erreur
    this.errorHandler.logError(operation, error);
    
    // Affiche un toast d'erreur
    this.showErrorToast(`Erreur lors de ${operation}`);
    
    // Retourne une valeur de fallback
    return of(fallbackValue);
  };
}
```

### Error Types

| Code HTTP | Signification | Action Frontend |
|-----------|---------------|-----------------|
| 400 | Bad Request | Afficher erreur de validation |
| 401 | Unauthorized | Rediriger vers login |
| 403 | Forbidden | Afficher message d'accès refusé |
| 404 | Not Found | Afficher message "non trouvé" |
| 500 | Server Error | Afficher erreur générique + mode mock |

### Fallback Mock Data

En cas d'indisponibilité du backend, le service utilise des données mock pour permettre la démonstration de l'interface:

```typescript
private getMockMyChallenges(): FriendChallenge[] {
  return [
    {
      id: 1,
      nom: 'Défi 10 000 Pas',
      description: 'Atteignons ensemble 10 000 pas par jour !',
      typeObjectif: ChallengeObjectiveType.STEPS,
      valeurCible: 70000,
      // ... autres propriétés
    }
  ];
}
```

## Testing Strategy

### Unit Tests

Les tests unitaires couvrent:
- Fonctions de mapping (type → unit, type → icon, type → color, status → label)
- Validation des dates
- Calcul des jours restants
- Logique de visibilité conditionnelle

### Property-Based Tests

Les tests basés sur les propriétés utilisent **fast-check** pour générer des entrées aléatoires et vérifier les invariants:

```typescript
// Exemple de configuration
import * as fc from 'fast-check';

describe('FriendChallenge Properties', () => {
  it('should map all objective types to valid units', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.values(ChallengeObjectiveType)),
        (type) => {
          const unit = getChallengeTypeUnit(type);
          return unit.length > 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Tests

Les tests d'intégration vérifient:
- Appels API corrects avec HttpClientTestingModule
- Mise à jour de l'état après les opérations
- Gestion des erreurs HTTP

### Test Configuration

- Framework: Jasmine + Karma (Angular default)
- Property-based testing: fast-check
- Minimum iterations per property: 100
- Tag format: **Feature: friend-challenges-backend-integration, Property {number}: {property_text}**

## Social Activity Integration

### Architecture d'intégration

Le backend crée automatiquement des activités sociales lors des actions sur les défis. Le frontend doit :
1. Rafraîchir le fil social après chaque action réussie
2. Mapper correctement les types d'activités backend vers l'affichage frontend

```
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUX SOCIAL ACTIVITY                              │
│                                                                      │
│  Utilisateur crée/rejoint/complète un défi                          │
│           │                                                          │
│           ▼                                                          │
│  FriendChallengeService.createChallenge() / joinChallenge()         │
│           │                                                          │
│           ▼                                                          │
│  Backend crée automatiquement SocialActivity                         │
│  (CHALLENGE_JOINED ou CHALLENGE_COMPLETED)                          │
│           │                                                          │
│           ▼                                                          │
│  Frontend appelle FriendService.refreshSocialFeed()                 │
│           │                                                          │
│           ▼                                                          │
│  Fil social mis à jour avec la nouvelle activité                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Mapping des types d'activités

| Type Backend | Type Frontend | Description |
|--------------|---------------|-------------|
| CHALLENGE_JOINED | challenge_joined | Utilisateur a rejoint/créé un défi |
| CHALLENGE_COMPLETED | challenge_completed | Utilisateur a terminé un défi |
| WORKOUT_COMPLETED | workout | Séance d'entraînement terminée |
| GOAL_ACHIEVED | achievement | Objectif atteint |
| FRIEND_JOINED | friend_added | Nouvel ami ajouté |

### Méthode de rafraîchissement

```typescript
// Dans FriendService - méthode publique pour rafraîchir le fil social
public refreshSocialFeed(): void {
  this.loadSocialFeed();
}

// Dans FriendChallengeService - appeler après chaque action réussie
createChallenge(request: CreateFriendChallengeRequest): Observable<FriendChallenge> {
  return this.http.post<ApiResponse<FriendChallenge>>(...).pipe(
    tap(challenge => {
      // ... mise à jour état local
      // Rafraîchir le fil social pour afficher l'activité créée par le backend
      this.friendService.refreshSocialFeed();
    })
  );
}
```

### Correctness Properties pour Social Activities

### Property 21: Social Feed Refresh After Challenge Creation

*For any* successfully created challenge, the FriendService.refreshSocialFeed() method should be called to update the social feed.

**Validates: Requirements 11.1**

### Property 22: Social Feed Refresh After Joining Challenge

*For any* successfully joined challenge, the FriendService.refreshSocialFeed() method should be called to update the social feed.

**Validates: Requirements 11.2**

### Property 23: Social Feed Refresh After Challenge Completion

*For any* progress update that results in 100% completion, the FriendService.refreshSocialFeed() method should be called to update the social feed.

**Validates: Requirements 11.3**

### Property 24: Social Activity Type Mapping

*For any* SocialActivity received from the backend with activityType in [CHALLENGE_JOINED, CHALLENGE_COMPLETED], the frontend should correctly map it to the corresponding display type.

**Validates: Requirements 11.4**
