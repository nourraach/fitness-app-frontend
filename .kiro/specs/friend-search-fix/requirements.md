# Requirements Document

## Introduction

Cette fonctionnalité corrige le composant de recherche d'amis pour qu'il vérifie l'état des demandes d'amitié existantes avant d'afficher les boutons d'action. Actuellement, le frontend permet d'envoyer des demandes d'amitié même si une demande est déjà en attente, ce qui génère des erreurs HTTP 409 du backend. La solution consiste à charger les demandes envoyées et la liste d'amis au démarrage, puis à afficher le bouton approprié selon l'état de chaque utilisateur.

## Glossary

- **Friend_Service**: Service Angular responsable de la gestion des amis et des demandes d'amitié
- **User_Search_Component**: Composant Angular permettant de rechercher et d'ajouter des amis
- **Sent_Requests**: Ensemble des demandes d'amitié envoyées par l'utilisateur courant et en attente
- **Friend_List**: Liste des utilisateurs déjà amis avec l'utilisateur courant
- **Button_State**: État du bouton d'action pour un utilisateur donné ('add', 'pending', 'friend')
- **HTTP_409_Conflict**: Code de réponse HTTP indiquant un conflit (demande déjà existante)

## Requirements

### Requirement 1: Récupération des demandes envoyées

**User Story:** En tant qu'utilisateur, je veux que le système charge mes demandes d'amitié envoyées au démarrage, afin que je puisse voir quelles demandes sont déjà en attente.

#### Acceptance Criteria

1. WHEN the User_Search_Component initializes, THE Friend_Service SHALL call GET /api/friends/requests/sent to retrieve sent friend requests
2. THE Friend_Service SHALL store the receiver IDs from sent requests in a Set for O(1) lookup
3. IF the API call fails, THEN THE Friend_Service SHALL log the error and initialize an empty Set

### Requirement 2: Récupération de la liste d'amis

**User Story:** En tant qu'utilisateur, je veux que le système charge ma liste d'amis au démarrage, afin que je puisse voir qui est déjà mon ami.

#### Acceptance Criteria

1. WHEN the User_Search_Component initializes, THE Friend_Service SHALL call GET /api/friends to retrieve the friends list
2. THE Friend_Service SHALL store the friend IDs in a Set for O(1) lookup
3. IF the API call fails, THEN THE Friend_Service SHALL log the error and initialize an empty Set

### Requirement 3: Détermination de l'état du bouton

**User Story:** En tant qu'utilisateur, je veux voir le bouton approprié pour chaque utilisateur dans les résultats de recherche, afin de savoir si je peux envoyer une demande ou si une action est déjà en cours.

#### Acceptance Criteria

1. WHEN displaying a user in search results, THE User_Search_Component SHALL determine the button state based on existing data
2. IF the user ID exists in Friend_List, THEN THE User_Search_Component SHALL display "Déjà amis" button (disabled)
3. IF the user ID exists in Sent_Requests, THEN THE User_Search_Component SHALL display "Demande envoyée" button (disabled)
4. IF the user ID exists in neither collection, THEN THE User_Search_Component SHALL display "Ajouter" button (enabled)

### Requirement 4: Gestion des erreurs HTTP 409

**User Story:** En tant qu'utilisateur, je veux que le système gère gracieusement les erreurs de conflit, afin que l'interface reste cohérente même si l'état local est désynchronisé.

#### Acceptance Criteria

1. WHEN a friend request returns HTTP 409 with code 'REQUEST_PENDING', THE User_Search_Component SHALL add the user ID to Sent_Requests and display an info message
2. WHEN a friend request returns HTTP 409 with code 'ALREADY_FRIENDS', THE User_Search_Component SHALL add the user ID to Friend_List and display an info message
3. WHEN a friend request returns HTTP 409 with any other code, THE User_Search_Component SHALL display the error message from the response

### Requirement 5: Mise à jour de l'état après envoi réussi

**User Story:** En tant qu'utilisateur, je veux que l'interface se mette à jour immédiatement après l'envoi d'une demande, afin de voir que ma demande a été prise en compte.

#### Acceptance Criteria

1. WHEN a friend request is sent successfully, THE User_Search_Component SHALL add the user ID to Sent_Requests
2. WHEN a friend request is sent successfully, THE User_Search_Component SHALL update the button state to 'pending' for that user
3. THE User_Search_Component SHALL display a success message confirming the request was sent

### Requirement 6: Interfaces de réponse API

**User Story:** En tant que développeur, je veux des interfaces TypeScript typées pour les réponses API, afin d'avoir une meilleure sécurité de type et autocomplétion.

#### Acceptance Criteria

1. THE Friend_Service SHALL define a SentRequestsResponse interface with requests array and count
2. THE Friend_Service SHALL define a PendingRequestsResponse interface with requests array and count
3. THE Friend_Service SHALL define a FriendsResponse interface with friends array and count
4. WHEN parsing API responses, THE Friend_Service SHALL use these interfaces for type safety
