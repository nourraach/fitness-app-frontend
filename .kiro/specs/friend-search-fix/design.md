# Design Document - Correction de la Recherche d'Amis

## Overview

Cette correction vise à résoudre le problème de recherche d'amis en alignant le frontend Angular avec l'API backend Spring Boot. Le problème principal était l'utilisation d'un endpoint incorrect et une incompatibilité de format de données.

## Architecture

### Frontend Components
- **UserSearchComponent**: Interface utilisateur pour la recherche d'amis
- **FriendService**: Service Angular gérant les appels API
- **UserSearchResult Interface**: Structure de données pour les résultats de recherche

### Backend Integration
- **Endpoint**: `/api/friends/search?q={query}`
- **Response Format**: Array of FriendDTO objects
- **Authentication**: JWT Bearer token required

## Components and Interfaces

### FriendService.searchUsers()

**Before:**
```typescript
searchUsers(query: string): Observable<UserSearchResult[]> {
  return this.http.get<UserSearchResult[]>(`${this.apiUrl}/users/search?q=${query}`, { headers });
}
```

**After:**
```typescript
searchUsers(query: string): Observable<UserSearchResult[]> {
  return this.http.get<any[]>(`${this.apiUrl}/friends/search?q=${query}`, { headers })
    .pipe(
      map(results => results.map(result => ({
        user: {
          id: result.id,
          nom: result.nom || result.name || 'Utilisateur',
          email: result.email || '',
          // ... other field mappings
        },
        friendshipStatus: this.getFriendshipStatus(result.id),
        mutualFriends: result.mutualFriends || 0
      })))
    );
}
```

## Data Models

### Backend FriendDTO Structure
```json
{
  "id": number,
  "nom": string,
  "prenom": string,
  "email": string,
  "activitesCount": number,
  "derniereActivite": string,
  "mutualFriends": number
}
```

### Frontend UserSearchResult Structure
```typescript
interface UserSearchResult {
  user: User;
  friendshipStatus: FriendshipStatus;
  mutualFriends?: number;
}

interface User {
  id: number;
  nom: string;
  email: string;
  totalWorkouts?: number;
  // ... other fields
}
```

## Error Handling

### Network Errors
- HTTP errors are caught and logged
- Empty array returned on error
- User sees "No results" message

### Data Transformation Errors
- Null/undefined fields handled with default values
- Missing fields gracefully handled
- Type conversion errors prevented

## Testing Strategy

### Unit Tests
- Test endpoint URL correction
- Test data transformation logic
- Test error handling scenarios
- Test friendship status determination

### Integration Tests
- Test full search flow from UI to backend
- Test with various search queries
- Test authentication header inclusion
- Test response data mapping

### Manual Testing
- Search for existing users by name
- Search for users by email
- Verify friendship status display
- Test error scenarios (network issues)