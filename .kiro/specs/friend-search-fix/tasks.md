# Implementation Plan: Friend Search Fix

## Overview

Ce plan d'implémentation corrige le composant de recherche d'amis pour vérifier l'état des demandes d'amitié existantes avant d'afficher les boutons d'action. L'implémentation utilise TypeScript/Angular et fast-check pour les tests basés sur les propriétés.

## Tasks

- [x] 1. Ajouter les interfaces de réponse API au service Friend
  - [x] 1.1 Définir les interfaces FriendRequestItem, SentRequestsResponse, PendingRequestsResponse
    - Ajouter dans friend.service.ts les interfaces pour typer les réponses API
    - _Requirements: 6.1, 6.2_
  - [x] 1.2 Définir les interfaces FriendItem et FriendsResponse
    - Ajouter l'interface pour la réponse de la liste d'amis
    - _Requirements: 6.3_

- [x] 2. Implémenter les méthodes de récupération des données dans FriendService
  - [x] 2.1 Implémenter getSentRequests()
    - Appeler GET /api/friends/requests/sent avec les headers d'authentification
    - Retourner Observable<SentRequestsResponse>
    - _Requirements: 1.1_
  - [x] 2.2 Implémenter getReceivedRequests()
    - Appeler GET /api/friends/requests/received avec les headers d'authentification
    - Retourner Observable<PendingRequestsResponse>
    - _Requirements: 1.1_
  - [x] 2.3 Implémenter getFriendsList()
    - Appeler GET /api/friends avec les headers d'authentification
    - Retourner Observable<FriendsResponse>
    - _Requirements: 2.1_

- [x] 3. Étendre UserSearchComponent avec la gestion d'état
  - [x] 3.1 Ajouter les propriétés pendingRequestUserIds et friendUserIds
    - Déclarer deux Sets pour stocker les IDs
    - Ajouter isLoadingState pour l'état de chargement
    - _Requirements: 1.2, 2.2_
  - [x] 3.2 Implémenter loadPendingRequests()
    - Appeler friendService.getSentRequests()
    - Extraire les receiverIds dans pendingRequestUserIds
    - Gérer les erreurs avec Set vide
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 3.3 Implémenter loadFriends()
    - Appeler friendService.getFriendsList()
    - Extraire les IDs dans friendUserIds
    - Gérer les erreurs avec Set vide
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 3.4 Implémenter getButtonState()
    - Retourner 'friend' si userId dans friendUserIds
    - Retourner 'pending' si userId dans pendingRequestUserIds
    - Retourner 'add' sinon
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  - [ ]* 3.5 Écrire le test de propriété pour getButtonState
    - **Property 1-4: Button state consistency**
    - **Validates: Requirements 3.2, 3.3, 3.4**

- [x] 4. Modifier ngOnInit pour charger les données au démarrage
  - [x] 4.1 Appeler loadPendingRequests() et loadFriends() dans ngOnInit
    - Charger les deux ensembles de données en parallèle
    - Mettre isLoadingState à false une fois terminé
    - _Requirements: 1.1, 2.1_

- [x] 5. Mettre à jour sendFriendRequest avec gestion HTTP 409
  - [x] 5.1 Modifier sendFriendRequest() pour gérer les erreurs 409
    - Vérifier err.status === 409
    - Extraire err.error?.code
    - Mettre à jour pendingRequestUserIds ou friendUserIds selon le code
    - Afficher le message approprié
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 5.2 Ajouter la mise à jour de l'état après succès
    - Ajouter userId à pendingRequestUserIds
    - Afficher message de succès
    - _Requirements: 5.1, 5.2, 5.3_
  - [ ]* 5.3 Écrire le test de propriété pour la mise à jour d'état
    - **Property 5-7: State update after request**
    - **Validates: Requirements 4.1, 4.2, 5.1, 5.2**

- [x] 6. Mettre à jour le template HTML
  - [x] 6.1 Remplacer les conditions de bouton par getButtonState()
    - Utiliser getButtonState(user.id) === 'add' pour le bouton Ajouter
    - Utiliser getButtonState(user.id) === 'pending' pour Demande envoyée
    - Utiliser getButtonState(user.id) === 'friend' pour Déjà amis
    - _Requirements: 3.2, 3.3, 3.4_

- [x] 7. Ajouter les méthodes de notification utilisateur
  - [x] 7.1 Implémenter showSuccess(), showInfo(), showError()
    - Utiliser console.log ou un service de toast si disponible
    - _Requirements: 5.3, 4.1, 4.2, 4.3_

- [x] 8. Checkpoint - Vérifier l'intégration
  - Ensure all tests pass, ask the user if questions arise.
  - Tester manuellement la recherche d'amis
  - Vérifier que les boutons s'affichent correctement

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- L'implémentation utilise TypeScript avec Angular 19
- fast-check sera utilisé pour les tests basés sur les propriétés
