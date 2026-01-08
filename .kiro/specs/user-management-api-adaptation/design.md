# Design Document

## Overview

Adaptation du frontend Angular pour correspondre au format de l'API backend de gestion des utilisateurs.

## Architecture

Le composant `UserManagementComponent` utilise `JwtService` pour les opérations CRUD. Un nouveau service `AdminService` sera utilisé pour l'endpoint `/api/admin/users/{id}/status`.

## Components and Interfaces

### BackendUser Interface
```typescript
interface BackendUser {
  id: number;
  name: string;
  email: string;
  role: 'USER' | 'COACH' | 'ADMIN';
  phoneNumber: string;
  enabled: boolean;
}
```

### User Mapper Function
```typescript
mapBackendUser(user: BackendUser): UserDTO {
  const nameParts = user.name.split(' ');
  const prenom = nameParts[0] || '';
  const nom = nameParts.slice(1).join(' ') || prenom;
  
  return {
    id: user.id,
    nom: nameParts.length > 1 ? nom : user.name,
    prenom: nameParts.length > 1 ? prenom : '',
    email: user.email,
    role: user.role.toLowerCase(),
    status: user.enabled ? 'active' : 'inactive',
    telephone: user.phoneNumber
  };
}
```

## Data Models

Pas de changement aux modèles existants, uniquement transformation à la réception.

## Correctness Properties

Pas de propriétés testables par PBT pour cette adaptation simple.

## Error Handling

- 204 No Content: Succès sans body
- 401: Redirection login
- 403: Message "Accès non autorisé"
- 404: Message "Utilisateur non trouvé"
- 500: Message "Erreur serveur"

## Testing Strategy

Tests unitaires pour valider le mapping des données.
