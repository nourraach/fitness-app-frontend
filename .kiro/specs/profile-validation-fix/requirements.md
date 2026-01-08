# Requirements Document

## Introduction

Le système de profil utilisateur doit implémenter une validation côté frontend robuste pour éviter les erreurs 400 Bad Request lors de l'envoi des données au backend Spring Boot. Le backend refuse les profils avec des champs invalides (@Min, @NotNull, enums) et le frontend doit s'assurer de ne jamais envoyer de données invalides.

## Glossary

- **Profile_Component**: Le composant Angular responsable de la gestion du profil utilisateur
- **Profile_Service**: Le service Angular qui communique avec l'API backend pour les opérations de profil
- **Backend_API**: L'API Spring Boot qui accepte uniquement PUT /api/profile pour création et mise à jour
- **Validation_System**: Le système de validation côté frontend qui vérifie les données avant envoi
- **Form_State**: L'état du formulaire qui détermine si les données sont valides ou non

## Requirements

### Requirement 1: Validation des Champs Numériques

**User Story:** En tant qu'utilisateur, je veux que le système valide mes données numériques avant l'envoi, afin d'éviter les erreurs de serveur.

#### Acceptance Criteria

1. WHEN a user enters an age value, THE Validation_System SHALL ensure the age is greater than 0
2. WHEN a user enters a height value, THE Validation_System SHALL ensure the height is greater than 0
3. WHEN a user enters a weight value, THE Validation_System SHALL ensure the weight is greater than 0
4. WHEN any numeric field contains 0 or negative values, THE Profile_Component SHALL prevent form submission
5. WHEN numeric validation fails, THE Profile_Component SHALL display specific error messages for each invalid field

### Requirement 2: Validation des Champs Énumérés

**User Story:** En tant qu'utilisateur, je veux que le système s'assure que mes sélections correspondent aux valeurs acceptées par le serveur, afin d'éviter les rejets de données.

#### Acceptance Criteria

1. WHEN a user selects a gender, THE Validation_System SHALL ensure the value matches backend enum values (HOMME, FEMME, AUTRE)
2. WHEN a user selects an objective, THE Validation_System SHALL ensure the value matches backend enum values (PERTE_POIDS, PRISE_MASSE, MAINTIEN, REMISE_EN_FORME)
3. WHEN a user selects an activity level, THE Validation_System SHALL ensure the value matches backend enum values (SEDENTAIRE, LEGER, MODERE, INTENSE, TRES_INTENSE)
4. WHEN any enum field is null or undefined, THE Validation_System SHALL prevent form submission
5. WHEN enum validation fails, THE Profile_Component SHALL display clear error messages indicating valid options

### Requirement 3: Contrôle de l'Interface Utilisateur

**User Story:** En tant qu'utilisateur, je veux que l'interface me guide clairement sur l'état de validité de mon formulaire, afin de comprendre ce qui doit être corrigé.

#### Acceptance Criteria

1. WHEN the form contains invalid data, THE Profile_Component SHALL disable the save button
2. WHEN all form data is valid, THE Profile_Component SHALL enable the save button
3. WHEN validation errors exist, THE Profile_Component SHALL display error messages next to the relevant fields
4. WHEN the form becomes valid after corrections, THE Profile_Component SHALL clear all error messages
5. WHEN the user attempts to save invalid data, THE Profile_Component SHALL prevent the API call and show a summary error message

### Requirement 4: Logging et Débogage

**User Story:** En tant que développeur, je veux pouvoir tracer les données envoyées au serveur, afin de diagnostiquer les problèmes de validation.

#### Acceptance Criteria

1. WHEN the saveProfile method is called, THE Profile_Component SHALL log the complete payload before sending to the API
2. WHEN validation fails, THE Profile_Component SHALL log the specific validation errors with field names and values
3. WHEN the API returns an error, THE Profile_Component SHALL log both the sent payload and the error response
4. WHEN the profile is successfully saved, THE Profile_Component SHALL log a success confirmation with the returned data
5. WHEN debugging is enabled, THE Validation_System SHALL provide detailed validation step information

### Requirement 5: Gestion des Erreurs API

**User Story:** En tant qu'utilisateur, je veux recevoir des messages d'erreur clairs et utiles lorsque mon profil ne peut pas être sauvegardé, afin de comprendre comment corriger le problème.

#### Acceptance Criteria

1. WHEN the API returns a 400 Bad Request, THE Profile_Component SHALL display a user-friendly message indicating which fields are invalid
2. WHEN the API returns a validation error, THE Profile_Component SHALL map the backend error messages to the corresponding form fields
3. WHEN network errors occur, THE Profile_Component SHALL display an appropriate connectivity error message
4. WHEN authentication errors occur, THE Profile_Component SHALL display a message prompting re-authentication
5. WHEN unknown errors occur, THE Profile_Component SHALL display a generic error message with support contact information

### Requirement 6: Validation en Temps Réel

**User Story:** En tant qu'utilisateur, je veux recevoir un feedback immédiat sur la validité de mes données pendant que je remplis le formulaire, afin de corriger les erreurs au fur et à mesure.

#### Acceptance Criteria

1. WHEN a user modifies a numeric field, THE Validation_System SHALL validate the field immediately on blur
2. WHEN a user selects an enum value, THE Validation_System SHALL validate the selection immediately
3. WHEN a field becomes valid after being invalid, THE Profile_Component SHALL immediately remove the error message for that field
4. WHEN a field becomes invalid after being valid, THE Profile_Component SHALL immediately display the error message for that field
5. WHEN all fields become valid, THE Profile_Component SHALL immediately enable the save button

### Requirement 7: Compatibilité Backend

**User Story:** En tant que système, je veux m'assurer que les données envoyées correspondent exactement au format attendu par le backend Spring Boot, afin d'éviter tout rejet de données.

#### Acceptance Criteria

1. WHEN sending profile data, THE Profile_Service SHALL use only the PUT /api/profile endpoint for both creation and updates
2. WHEN preparing the payload, THE Profile_Component SHALL ensure all enum values match exactly the backend enum constants
3. WHEN sending numeric values, THE Profile_Component SHALL ensure they are sent as numbers, not strings
4. WHEN sending the request, THE Profile_Service SHALL include all required headers and authentication tokens
5. WHEN the payload is constructed, THE Validation_System SHALL verify the payload structure matches the backend UserProfile model exactly