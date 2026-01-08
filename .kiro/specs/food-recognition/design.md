# Design Document: Food Recognition Feature

## Overview

Cette fonctionnalité permet aux utilisateurs de reconnaître des aliments par photo et d'obtenir leurs informations nutritionnelles. L'architecture suit le pattern Angular standard avec un service dédié pour la communication API et un composant standalone pour l'interface utilisateur.

## Architecture

```mermaid
graph TB
    subgraph Frontend Angular
        FSC[Food Scanner Component]
        FRS[Food Recognition Service]
        FSC --> FRS
    end
    
    subgraph Backend API
        API[/api/food-recognition]
        REC[POST /recognize]
        SUG[GET /suggestions]
        MAN[POST /manual]
        NUT[GET /nutritional-info]
        API --> REC
        API --> SUG
        API --> MAN
        API --> NUT
    end
    
    FRS -->|HTTP| API
```

## Components and Interfaces

### FoodRecognitionService

Service Angular injectable responsable de toutes les communications avec l'API backend.

```typescript
@Injectable({ providedIn: 'root' })
export class FoodRecognitionService {
  private apiUrl = 'http://localhost:8095/api/food-recognition';
  
  // Reconnaissance par photo - POST /recognize
  recognizeFood(imageFile: File): Observable<FoodRecognitionResult>
  
  // Recherche d'aliments - GET /suggestions?query=xxx
  searchFoods(query: string): Observable<FoodRecognitionResult[]>
  
  // Saisie manuelle - POST /manual
  manualEntry(foodName: string, quantity?: number): Observable<FoodRecognitionResult>
  
  // Info nutritionnelle - GET /nutritional-info/{alimentId}?quantity=xxx
  getNutritionalInfo(alimentId: number, quantity?: number): Observable<NutritionalInfo>
}
```

### FoodScannerComponent

Composant standalone gérant l'interface utilisateur complète.

```typescript
@Component({
  selector: 'app-food-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule]
})
export class FoodScannerComponent {
  // State
  selectedImage: File | null
  imagePreview: string | null
  result: FoodRecognitionResult | null
  loading: boolean
  error: string | null
  showManualEntry: boolean
  searchQuery: string
  searchResults: FoodRecognitionResult[]
  quantity: number
  
  // Events
  @Output() foodConfirmed = new EventEmitter<ConfirmedFood>()
  
  // Methods
  onFileSelected(event: Event): void
  analyzeImage(): void
  selectAlternative(foodName: string): void
  searchFoods(): void
  selectSearchResult(result: FoodRecognitionResult): void
  updateQuantity(quantity: number): void
  confirmFood(): void
  retry(): void
  reset(): void
}
```

## Data Models

### Interfaces TypeScript

```typescript
export interface NutritionalInfo {
  foodName: string;
  quantity: number;
  calories: number;
  proteines: number;
  lipides: number;
  glucides: number;
}

export interface FoodRecognitionResult {
  recognized: boolean;
  confidence: number;
  foodId?: number;
  foodName?: string;
  category?: string;
  message?: string;
  alternatives?: string[];
  nutritionalInfo?: NutritionalInfo;
}

export interface ConfirmedFood {
  foodId: number;
  foodName: string;
  quantity: number;
  nutritionalInfo: NutritionalInfo;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}
```

### Validation Rules

```typescript
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function validateImageFile(file: File): FileValidationResult {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Format non supporté. Utilisez JPEG, PNG ou WebP.' };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `Fichier trop volumineux. Maximum ${MAX_FILE_SIZE_MB}MB.` };
  }
  return { valid: true };
}
```

### Quantity Calculation

```typescript
function calculateNutritionalValues(
  baseInfo: NutritionalInfo, 
  newQuantity: number
): NutritionalInfo {
  const ratio = newQuantity / baseInfo.quantity;
  return {
    foodName: baseInfo.foodName,
    quantity: newQuantity,
    calories: Math.round(baseInfo.calories * ratio),
    proteines: Math.round(baseInfo.proteines * ratio * 10) / 10,
    lipides: Math.round(baseInfo.lipides * ratio * 10) / 10,
    glucides: Math.round(baseInfo.glucides * ratio * 10) / 10
  };
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: File Validation Correctness

*For any* file, the validation function SHALL return valid=true if and only if the file type is in ALLOWED_IMAGE_TYPES AND the file size is less than or equal to MAX_FILE_SIZE_BYTES.

**Validates: Requirements 1.2, 1.4**

### Property 2: Recognition Result Display Completeness

*For any* FoodRecognitionResult with recognized=true, the component SHALL display the foodName AND the confidence as a percentage (confidence * 100).

**Validates: Requirements 2.3, 2.4**

### Property 3: Nutritional Info Display Completeness

*For any* NutritionalInfo object, the component SHALL display all four nutritional values: calories, proteines, lipides, and glucides.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

### Property 4: Alternatives Rendering Consistency

*For any* FoodRecognitionResult, the alternatives section SHALL be visible if and only if the alternatives array exists AND has length > 0.

**Validates: Requirements 4.1, 4.4**

### Property 5: Quantity Proportional Calculation

*For any* base NutritionalInfo and any positive quantity, the recalculated nutritional values SHALL be proportional to the ratio (newQuantity / baseQuantity). Specifically: newCalories = baseCalories * ratio, and similarly for proteines, lipides, glucides.

**Validates: Requirements 6.2**

### Property 6: Search Results Rendering

*For any* non-empty array of FoodRecognitionResult from search, the dropdown SHALL display exactly the same number of items as the array length.

**Validates: Requirements 5.3**

## Error Handling

### Error Types

```typescript
enum FoodRecognitionErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  UPLOAD_ERROR = 'UPLOAD_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_RECOGNIZED = 'NOT_RECOGNIZED'
}

interface FoodRecognitionError {
  type: FoodRecognitionErrorType;
  message: string;
  retryable: boolean;
}
```

### Error Messages (French)

| Error Type | Message |
|------------|---------|
| CONNECTION_ERROR | "Impossible de se connecter au serveur. Vérifiez votre connexion." |
| UPLOAD_ERROR | "Erreur lors de l'envoi de l'image. Veuillez réessayer." |
| TIMEOUT_ERROR | "L'analyse prend trop de temps. Veuillez réessayer." |
| VALIDATION_ERROR | Dynamic based on validation result |
| NOT_RECOGNIZED | "Aliment non reconnu. Essayez la saisie manuelle." |

## Testing Strategy

### Unit Tests

- Test file validation with various file types and sizes
- Test nutritional calculation with edge cases (0 quantity, very large quantities)
- Test component state transitions
- Test error handling scenarios

### Property-Based Tests

Using fast-check library for property-based testing:

1. **File Validation Property**: Generate random file metadata and verify validation logic
2. **Quantity Calculation Property**: Generate random nutritional info and quantities, verify proportionality
3. **Alternatives Rendering Property**: Generate random alternatives arrays, verify visibility logic

### Integration Tests

- Test service HTTP calls with mock backend
- Test component interaction with service
- Test end-to-end flow from image selection to confirmation

### Test Configuration

```typescript
// Minimum 100 iterations per property test
const FC_CONFIG = { numRuns: 100 };
```
