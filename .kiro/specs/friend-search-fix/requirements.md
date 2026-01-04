# Requirements Document - Correction de la Recherche d'Amis

## Introduction

Ce document spécifie les corrections nécessaires pour faire fonctionner la recherche d'amis dans l'application fitness. Le problème identifié est une incompatibilité entre l'endpoint API utilisé par le frontend et celui implémenté dans le backend.

## Glossary

- **Frontend**: Interface utilisateur Angular de l'application
- **Backend**: API Spring Boot de l'application
- **FriendService**: Service Angular responsable des opérations liées aux amis
- **UserSearchResult**: Interface TypeScript définissant la structure des résultats de recherche
- **FriendDTO**: Objet de transfert de données utilisé par le backend pour les informations d'amis

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux pouvoir rechercher d'autres utilisateurs par nom ou email, afin de pouvoir les ajouter comme amis.

#### Acceptance Criteria

1. WHEN a user types a search query in the friend search input THEN the system SHALL call the correct backend endpoint `/api/friends/search`
2. WHEN the backend returns search results THEN the system SHALL transform the data to match the frontend UserSearchResult interface
3. WHEN search results are displayed THEN the system SHALL show user name, email, and activity statistics
4. WHEN a user appears in search results THEN the system SHALL display the correct friendship status (friends, request sent, etc.)
5. WHERE a user has mutual friends with the searched user THEN the system SHALL display the count of mutual friends

### Requirement 2

**User Story:** En tant que développeur, je veux que le service FriendService utilise les bons endpoints API, afin d'assurer la communication correcte avec le backend.

#### Acceptance Criteria

1. WHEN the searchUsers method is called THEN the system SHALL use the endpoint `/api/friends/search` instead of `/api/users/search`
2. WHEN the backend response is received THEN the system SHALL map the FriendDTO fields to UserSearchResult fields correctly
3. WHEN mapping user data THEN the system SHALL handle missing or null fields gracefully with default values
4. WHEN determining friendship status THEN the system SHALL use the existing getFriendshipStatus method
5. WHEN an error occurs during search THEN the system SHALL return an empty array and log the error

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux voir des résultats de recherche précis et à jour, afin de pouvoir identifier et ajouter les bons amis.

#### Acceptance Criteria

1. WHEN search results are displayed THEN the system SHALL show the user's display name from their profile
2. WHEN a user has activity statistics THEN the system SHALL display their workout count and calories
3. WHEN a user is already a friend THEN the system SHALL exclude them from search results (handled by backend)
4. WHEN the current user searches THEN the system SHALL exclude their own profile from results (handled by backend)
5. WHEN search results include friendship status THEN the system SHALL display appropriate action buttons (Add Friend, Request Sent, etc.)