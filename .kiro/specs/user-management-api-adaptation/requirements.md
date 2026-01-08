# Requirements Document

## Introduction

Cette fonctionnalité adapte le frontend de gestion des utilisateurs pour correspondre exactement au format de l'API backend existante. Le backend retourne des données dans un format spécifique (name, phoneNumber, enabled, role en majuscules) que le frontend doit transformer pour l'affichage (nom, prenom, telephone, status, role en minuscules).

## Glossary

- **User_Management_Component**: Composant Angular responsable de l'affichage et de la gestion des utilisateurs dans l'interface d'administration
- **Backend_User**: Structure de données retournée par l'API backend avec les champs id, name, email, role, phoneNumber, enabled
- **Frontend_User**: Structure de données utilisée par le frontend avec les champs id, nom, prenom, email, role, status, telephone
- **User_Mapper**: Service ou fonction responsable de la transformation des données Backend_User vers Frontend_User
- **Admin_Service**: Service Angular pour les opérations d'administration incluant l'activation/désactivation des utilisateurs

## Requirements

### Requirement 1: Mapping des données utilisateur

**User Story:** En tant qu'administrateur, je veux voir la liste des utilisateurs avec leurs noms et prénoms séparés, afin de pouvoir les identifier facilement.

#### Acceptance Criteria

1. WHEN the User_Management_Component receives a Backend_User with a "name" field containing "Jean Dupont", THE User_Mapper SHALL split it into prenom="Jean" and nom="Dupont"
2. WHEN the Backend_User has a "name" field with a single word "Jean", THE User_Mapper SHALL set prenom="" and nom="Jean"
3. WHEN the Backend_User has a "name" field with multiple words "Jean Pierre Dupont", THE User_Mapper SHALL set prenom="Jean" and nom="Pierre Dupont"
4. WHEN the Backend_User has a "phoneNumber" field, THE User_Mapper SHALL map it to the "telephone" field
5. WHEN the Backend_User has "enabled: true", THE User_Mapper SHALL map it to status="active"
6. WHEN the Backend_User has "enabled: false", THE User_Mapper SHALL map it to status="inactive"
7. WHEN the Backend_User has role="USER", THE User_Mapper SHALL map it to role="user" (lowercase)
8. WHEN the Backend_User has role="COACH", THE User_Mapper SHALL map it to role="coach" (lowercase)
9. WHEN the Backend_User has role="ADMIN", THE User_Mapper SHALL map it to role="admin" (lowercase)

### Requirement 2: Suppression d'utilisateur

**User Story:** En tant qu'administrateur, je veux supprimer un utilisateur et recevoir une confirmation, afin de gérer les comptes utilisateurs.

#### Acceptance Criteria

1. WHEN an administrator deletes a user, THE User_Management_Component SHALL call DELETE /api/users/{id}
2. WHEN the backend returns HTTP 204 No Content, THE User_Management_Component SHALL treat it as a successful deletion
3. WHEN the deletion is successful, THE User_Management_Component SHALL remove the user from the local list without expecting a response body
4. IF the deletion fails with an error, THEN THE User_Management_Component SHALL display an error message to the administrator

### Requirement 3: Activation/Désactivation d'utilisateur

**User Story:** En tant qu'administrateur, je veux activer ou désactiver un compte utilisateur, afin de contrôler l'accès à l'application.

#### Acceptance Criteria

1. WHEN an administrator toggles user status, THE Admin_Service SHALL call PUT /api/admin/users/{userId}/status
2. WHEN toggling status, THE Admin_Service SHALL send the body { "enabled": true } or { "enabled": false }
3. WHEN the status update is successful, THE User_Management_Component SHALL update the local user status
4. IF the status update fails, THEN THE User_Management_Component SHALL revert the local status change and display an error message
5. THE Admin_Service SHALL include the Authorization Bearer token in the request header

### Requirement 4: Interface Backend_User

**User Story:** En tant que développeur, je veux une interface TypeScript claire pour les données backend, afin d'assurer la cohérence du typage.

#### Acceptance Criteria

1. THE Backend_User interface SHALL define id as number
2. THE Backend_User interface SHALL define name as string
3. THE Backend_User interface SHALL define email as string
4. THE Backend_User interface SHALL define role as string with values "USER", "COACH", or "ADMIN"
5. THE Backend_User interface SHALL define phoneNumber as string
6. THE Backend_User interface SHALL define enabled as boolean

### Requirement 5: Gestion des erreurs API

**User Story:** En tant qu'administrateur, je veux être informé des erreurs lors des opérations sur les utilisateurs, afin de comprendre ce qui s'est passé.

#### Acceptance Criteria

1. IF the API returns a 401 Unauthorized error, THEN THE User_Management_Component SHALL redirect to the login page
2. IF the API returns a 403 Forbidden error, THEN THE User_Management_Component SHALL display "Accès non autorisé"
3. IF the API returns a 404 Not Found error, THEN THE User_Management_Component SHALL display "Utilisateur non trouvé"
4. IF the API returns a 500 Server error, THEN THE User_Management_Component SHALL display "Erreur serveur, veuillez réessayer"
