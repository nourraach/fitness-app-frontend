# Design Document

## Overview

Ce document décrit l'architecture technique pour le système de gestion des préférences de notifications frontend Angular. Le système sera composé d'un composant principal, d'un service de communication API, et d'interfaces TypeScript pour assurer une compatibilité parfaite avec le backend Spring Boot existant.

## Architecture

### Component Architecture
```
NotificationPreferencesComponent
├── NotificationPreferencesService (API communication)
├── ReactiveFormsModule (Form management)
├── Angular Material (UI components)
└── ErrorHandlerService (Error management)
```

### Data Flow
```
User Input → Reactive Form → Validation → Service → Backend API
Backend Response → Service → Component → UI Update → User Feedback
```

## Components and Interfaces

### 1. NotificationPreferencesComponent

**Responsabilité:** Composant principal pour l'affichage et la modification des préférences

**Template Features:**
- Formulaire réactif avec validation en temps réel
- Sections organisées par type (repas, entraînement, motivation)
- Indicateurs de chargement et messages de feedback
- Interface responsive avec Angular Material

**Component Logic:**
- Initialisation du formulaire avec FormBuilder
- Chargement des préférences existantes au ngOnInit
- Validation des données avant soumission
- Gestion des états de chargement et d'erreur

### 2. NotificationPreferencesService

**Responsabilité:** Service de communication avec l'API backend

**Methods:**
- `getUserPreferences(userId: number): Observable<NotificationPreferences>`
- `updatePreferences(userId: number, preferences: NotificationPreferencesUpdateRequest): Observable<NotificationPreferences>`
- `handleApiError(error: HttpErrorResponse): Observable<never>`

**Features:**
- Gestion automatique des tokens JWT
- Retry logic pour les erreurs réseau
- Cache des préférences pour optimiser les performances
- Transformation des données entre frontend et backend

### 3. Interfaces TypeScript

**NotificationPreferences Interface:**
```typescript
interface NotificationPreferences {
  id?: number;
  // Meal reminders
  mealRemindersEnabled: boolean;
  breakfastTime: string; // "HH:mm" format
  lunchTime: string;
  dinnerTime: string;
  snackRemindersEnabled: boolean;
  morningSnackTime: string;
  afternoonSnackTime: string;
  
  // Workout reminders
  workoutRemindersEnabled: boolean;
  defaultWorkoutTime: string;
  
  // Motivational messages
  motivationalMessagesEnabled: boolean;
  motivationalFrequency: number; // 1-7 messages per week
  
  // Active days
  activeDays: string[]; // ["MONDAY", "TUESDAY", ...]
  
  // Quiet time
  quietTimeEnabled: boolean;
  quietTimeStart: string;
  quietTimeEnd: string;
  
  // General settings
  notifications: boolean;
  email: boolean;
  push: boolean;
  maxNotificationsPerDay: number;
}
```

## Data Models

### Form Model Structure
```typescript
interface PreferencesFormModel {
  mealSettings: FormGroup;
  workoutSettings: FormGroup;
  motivationalSettings: FormGroup;
  generalSettings: FormGroup;
  quietTimeSettings: FormGroup;
}
```

### Validation Rules
- **Time fields:** Pattern validation for HH:mm format
- **Frequency:** Min 1, Max 7 for motivational messages
- **Active days:** At least one day must be selected
- **Quiet time:** End time must be different from start time
- **Max notifications:** Min 1, Max 50 per day

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Component Initialization API Call
*For any* user accessing the notification preferences page, the component should automatically trigger an API call to load existing preferences
**Validates: Requirements 1.1**

### Property 2: Form Population Consistency
*For any* valid preferences data received from the API, all corresponding form controls should be populated with the correct values
**Validates: Requirements 1.2**

### Property 3: Loading State Management
*For any* async operation (load or save), the component should display appropriate loading indicators and disable interactive elements during the operation
**Validates: Requirements 1.5, 5.5**

### Property 4: Form Control Updates
*For any* user interaction with form controls (toggles, inputs), the form model should immediately reflect the changes
**Validates: Requirements 2.1, 3.1, 4.1**

### Property 5: Time Format Validation
*For any* time input field, only values matching the HH:mm format should be accepted, and invalid formats should trigger validation errors
**Validates: Requirements 2.2, 3.2, 6.1**

### Property 6: Validation Error Display
*For any* validation error, the error message should appear below the corresponding form field and disappear when the error is corrected
**Validates: Requirements 2.3, 6.2, 6.5**

### Property 7: Conditional Form Control States
*For any* dependent form controls (like snack times depending on snack reminders), the dependent controls should be enabled/disabled based on their parent control state
**Validates: Requirements 2.5, 4.2**

### Property 8: Numeric Range Validation
*For any* numeric input with defined ranges (like motivational frequency 1-7), values outside the range should be rejected with appropriate error messages
**Validates: Requirements 4.3**

### Property 9: Form Submission Prevention
*For any* form with validation errors, the save button should be disabled and form submission should be prevented
**Validates: Requirements 4.5, 6.4**

### Property 10: API Communication
*For any* save operation, the service should send a PUT request to the correct endpoint with properly formatted data
**Validates: Requirements 5.1**

### Property 11: Success Feedback
*For any* successful API response, the component should display a success message to the user
**Validates: Requirements 5.2**

### Property 12: Error Handling by Status Code
*For any* API error response, the error handler should display appropriate messages based on the HTTP status code (400 for validation, 401 for auth, 500 for server errors)
**Validates: Requirements 5.3, 5.4, 7.1, 7.2, 7.3**

### Property 13: Authentication Integration
*For any* API request, the service should include valid JWT tokens in the request headers
**Validates: Requirements 9.2**

### Property 14: Caching Behavior
*For any* repeated API call within a session, the service should use cached data instead of making redundant network requests
**Validates: Requirements 10.3**

### Property 15: Input Debouncing
*For any* real-time validation, the validation should not trigger on every keystroke but should be debounced to improve performance
**Validates: Requirements 10.5**

<function_calls>
<invoke name="prework">
<parameter name="featureName">notification-preferences-frontend

## Error Handling

### Error Types and Responses
- **400 Bad Request:** Display specific validation errors from backend
- **401 Unauthorized:** Redirect to login page
- **403 Forbidden:** Display access denied message
- **500 Internal Server Error:** Display generic server error message
- **Network Errors:** Display connection problem message

### Error Display Strategy
- Field-level errors appear below the corresponding input
- General errors appear in a toast notification
- All errors are logged for debugging purposes
- Error messages are user-friendly and actionable

### Retry Logic
- Automatic retry for network errors (max 3 attempts)
- Exponential backoff for retry attempts
- User option to manually retry failed operations

## Testing Strategy

### Unit Testing Approach
The testing strategy follows a dual approach combining unit tests for specific scenarios and property-based tests for comprehensive validation:

**Unit Tests Focus:**
- Component initialization and lifecycle
- Form validation edge cases
- Error handling scenarios
- Service method behavior
- UI state management

**Property-Based Tests Focus:**
- Form input validation across all possible inputs
- API communication patterns
- Error handling consistency
- State management correctness

### Testing Framework Configuration
- **Framework:** Jasmine with Karma
- **Property Testing:** Use fast-check library for property-based testing
- **Minimum Iterations:** 100 iterations per property test
- **Mock Strategy:** Mock HTTP calls and external dependencies
- **Coverage Target:** 90% code coverage minimum

### Test Organization
```
notification-preferences/
├── notification-preferences.component.spec.ts
├── notification-preferences.service.spec.ts
├── notification-preferences.property.spec.ts
└── test-helpers/
    ├── mock-data.ts
    └── test-utilities.ts
```

### Property Test Tags
Each property test must include a comment referencing its design document property:
```typescript
// Feature: notification-preferences-frontend, Property 1: Component Initialization API Call
it('should trigger API call on component initialization', () => { ... });
```

## Implementation Notes

### Angular Material Components Used
- `mat-form-field` for input containers
- `mat-input` for text inputs
- `mat-checkbox` for boolean toggles
- `mat-select` for dropdown selections
- `mat-button` for actions
- `mat-progress-spinner` for loading indicators
- `mat-snack-bar` for notifications

### Performance Optimizations
- OnPush change detection strategy
- Debounced validation (300ms delay)
- Lazy loading of component
- Efficient form value change subscriptions
- HTTP request caching with 5-minute TTL

### Accessibility Features
- ARIA labels for all form controls
- Keyboard navigation support
- Screen reader compatible error messages
- High contrast mode support
- Focus management for better UX

### Browser Compatibility
- Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design for all screen sizes
- Progressive enhancement approach