# Requirements Document

## Introduction

Ce document spécifie les exigences pour corriger l'intégration des activités physiques entre le frontend Angular et le backend. Le problème actuel est un décalage entre les champs envoyés par Angular et ceux attendus par l'API backend, causant des erreurs SQL 400 "colonne inexistante".

## Glossary

- **Frontend**: Application Angular qui envoie les requêtes
- **Backend**: API REST qui reçoit et traite les données d'activités
- **ActivitePhysique**: Modèle de données représentant une activité physique
- **API_Endpoint**: Point d'entrée de l'API backend pour créer des activités
- **SQL_Error**: Erreur de base de données causée par des champs inexistants

## Requirements

### Requirement 1: Correction du modèle d'activité physique

**User Story:** En tant que développeur, je veux que le modèle Angular corresponde exactement aux champs backend, afin d'éviter les erreurs SQL lors de la création d'activités.

#### Acceptance Criteria

1. WHEN the ActivitePhysique interface is defined, THE Frontend SHALL include exactly these fields: typeActivite, dureeMinutes, caloriesBrulees, intensite, dateActivite, notes, utilisateur
2. WHEN the ActivitePhysique interface is defined, THE Frontend SHALL NOT include obsolete fields: date, duree, type
3. WHEN the intensite field is used, THE Frontend SHALL restrict values to: 'FAIBLE', 'MODEREE', 'ELEVEE'
4. WHEN the dateActivite field is used, THE Frontend SHALL format it as 'YYYY-MM-DD' string
5. WHEN the utilisateur field is used, THE Frontend SHALL structure it as an object with id property

### Requirement 2: Mise à jour du service d'activité

**User Story:** En tant que développeur, je veux que le service Angular envoie les bonnes données au backend, afin que les activités soient créées sans erreur.

#### Acceptance Criteria

1. WHEN creating an activity request, THE ActiviteService SHALL send only backend-compatible fields
2. WHEN calling the API endpoint, THE ActiviteService SHALL use POST to http://localhost:8095/api/activites/creer
3. WHEN sending the request, THE ActiviteService SHALL include Content-Type: application/json headers
4. WHEN constructing the request payload, THE ActiviteService SHALL include the current user ID in utilisateur field
5. WHEN the backend responds, THE ActiviteService SHALL handle both success (200) and error responses appropriately

### Requirement 3: Correction du composant de suivi

**User Story:** En tant qu'utilisateur, je veux pouvoir créer des activités physiques sans erreur, afin de suivre mes exercices quotidiens.

#### Acceptance Criteria

1. WHEN the user fills the activity form, THE SuiviComponent SHALL collect: typeActivite, dureeMinutes, intensite, dateActivite, notes
2. WHEN the user submits the form, THE SuiviComponent SHALL calculate caloriesBrulees based on activity type and duration
3. WHEN constructing the request object, THE SuiviComponent SHALL include only backend-compatible fields
4. WHEN the request is successful, THE SuiviComponent SHALL display a success message and refresh the data
5. WHEN the request fails, THE SuiviComponent SHALL display a meaningful error message to the user

### Requirement 4: Validation des données d'activité

**User Story:** En tant que système, je veux valider les données d'activité avant envoi, afin d'éviter les erreurs de validation côté backend.

#### Acceptance Criteria

1. WHEN validating typeActivite, THE System SHALL ensure it is a non-empty string
2. WHEN validating dureeMinutes, THE System SHALL ensure it is a positive number
3. WHEN validating intensite, THE System SHALL ensure it matches one of: 'FAIBLE', 'MODEREE', 'ELEVEE'
4. WHEN validating dateActivite, THE System SHALL ensure it follows YYYY-MM-DD format
5. WHEN validating caloriesBrulees, THE System SHALL ensure it is a positive number

### Requirement 5: Gestion des erreurs d'intégration

**User Story:** En tant qu'utilisateur, je veux recevoir des messages d'erreur clairs, afin de comprendre pourquoi ma requête a échoué.

#### Acceptance Criteria

1. WHEN a 400 error occurs, THE System SHALL display "Données invalides - Vérifiez les champs requis"
2. WHEN a 401 error occurs, THE System SHALL display "Non autorisé - Veuillez vous reconnecter"
3. WHEN a 500 error occurs, THE System SHALL display "Erreur serveur - Veuillez réessayer plus tard"
4. WHEN a network error occurs, THE System SHALL display "Impossible de contacter le serveur"
5. WHEN any error occurs, THE System SHALL log the complete error details to the console for debugging

### Requirement 6: Test de l'intégration

**User Story:** En tant que développeur, je veux tester l'intégration avec des données réelles, afin de m'assurer que le problème est résolu.

#### Acceptance Criteria

1. WHEN testing with valid data, THE System SHALL successfully create an activity and return 200 OK
2. WHEN testing the API endpoint, THE System SHALL use the exact payload format expected by backend
3. WHEN testing error scenarios, THE System SHALL handle invalid data gracefully
4. WHEN testing authentication, THE System SHALL include valid JWT token in requests
5. WHEN testing the complete flow, THE System SHALL create, display, and allow deletion of activities