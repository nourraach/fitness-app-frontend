# Implementation Plan: Friend Challenges Backend Integration

## Overview

Ce plan d'implémentation décrit les tâches pour intégrer le frontend Angular avec l'API backend des "Défis entre Amis". L'implémentation se concentre sur la correction des appels API, l'amélioration de la gestion d'état, et l'ajout des fonctionnalités manquantes.

## Tasks

- [x] 1. Corriger le FriendChallengeService pour utiliser les bons endpoints API
  - [x] 1.1 Mettre à jour l'URL de base et les endpoints selon le rapport technique backend
    - Corriger `createChallenge()` pour utiliser `POST /api/friend-challenges/create?createurId={id}`
    - Corriger `joinChallenge()` pour utiliser `POST /api/friend-challenges/{id}/join?userId={id}`
    - Corriger `updateProgress()` pour utiliser `POST /api/friend-challenges/{id}/progress?userId={id}&progress={val}`
    - _Requirements: 1.3, 3.1, 4.2_
  
  - [x] 1.2 Ajouter la gestion correcte des réponses ApiResponse<T>
    - Extraire `response.data` des réponses backend
    - Gérer le champ `success` pour la validation
    - _Requirements: 1.4, 3.2_

  - [ ]* 1.3 Write property test for API response handling
    - **Property 17: Error Handling Without Crash**
    - **Validates: Requirements 8.1**

- [x] 2. Implémenter les fonctions helper de mapping
  - [x] 2.1 Créer ou mettre à jour les fonctions de mapping dans le service
    - `getChallengeTypeUnit(type)` - retourne l'unité correspondante
    - `getChallengeTypeIcon(type)` - retourne la classe d'icône FontAwesome
    - `getChallengeTypeColor(type)` - retourne la couleur hexadécimale
    - `getStatusLabel(status)` - retourne le label français
    - `getStatusBadgeClass(status)` - retourne la classe CSS
    - _Requirements: 1.2, 7.2, 7.3, 7.4_

  - [ ]* 2.2 Write property test for objective type to unit mapping
    - **Property 1: Objective Type to Unit Mapping**
    - **Validates: Requirements 1.2**

  - [ ]* 2.3 Write property test for status badge rendering
    - **Property 15: Status Badge Rendering**
    - **Validates: Requirements 7.2, 7.3, 7.4**

- [x] 3. Implémenter la validation du formulaire de création
  - [x] 3.1 Ajouter la validation des dates dans le composant
    - Implémenter `validateChallengeDates(startDate, endDate)`
    - Ajouter un validateur personnalisé pour le formulaire réactif
    - Afficher un message d'erreur si dateFin <= dateDebut
    - _Requirements: 1.5, 1.6_

  - [ ]* 3.2 Write property test for date validation
    - **Property 2: Date Validation**
    - **Validates: Requirements 1.5**

  - [ ]* 3.3 Write property test for form validation
    - **Property 3: Form Validation - Required Fields**
    - **Validates: Requirements 1.6**

- [x] 4. Checkpoint - Vérifier les fonctions de base
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Améliorer la gestion d'état après les opérations
  - [x] 5.1 Implémenter la mise à jour d'état après création de défi
    - Ajouter le défi créé à `myChallengesSubject` et `createdChallengesSubject`
    - Émettre les nouvelles valeurs via les BehaviorSubjects
    - _Requirements: 1.4_

  - [x] 5.2 Implémenter la mise à jour d'état après avoir rejoint un défi
    - Déplacer le défi de `activeChallengesSubject` vers `myChallengesSubject`
    - Rafraîchir les listes si nécessaire
    - _Requirements: 3.2, 3.5_

  - [x] 5.3 Implémenter le nettoyage d'état après annulation
    - Retirer le défi de toutes les listes (my, active, created, leaderboards)
    - Utiliser la méthode `removeFromAllLists(challengeId)`
    - _Requirements: 6.3_

  - [ ]* 5.4 Write property test for state update after creation
    - **Property 5: State Update After Challenge Creation**
    - **Validates: Requirements 1.4**

  - [ ]* 5.5 Write property test for state cleanup after cancellation
    - **Property 12: State Cleanup After Challenge Cancellation**
    - **Validates: Requirements 6.3**

- [x] 6. Implémenter l'affichage conditionnel dans les composants
  - [x] 6.1 Ajouter la logique de visibilité du bouton "Rejoindre"
    - Vérifier si l'utilisateur est déjà participant
    - Masquer le bouton et afficher "Participant" si déjà inscrit
    - _Requirements: 3.3_

  - [x] 6.2 Ajouter la logique de visibilité du bouton "Annuler"
    - Vérifier si l'utilisateur courant est le créateur
    - Masquer le bouton si `currentUserId !== challenge.createurId`
    - _Requirements: 6.4_

  - [x] 6.3 Ajouter le style urgent pour les jours restants
    - Appliquer la classe CSS 'urgent' si `joursRestants <= 2`
    - Afficher en rouge avec style distinct
    - _Requirements: 7.5_

  - [ ]* 6.4 Write property test for participant button visibility
    - **Property 7: Participant Button Visibility**
    - **Validates: Requirements 3.3**

  - [ ]* 6.5 Write property test for cancel button visibility
    - **Property 13: Cancel Button Visibility Based on Creator Status**
    - **Validates: Requirements 6.4**

  - [ ]* 6.6 Write property test for urgent styling
    - **Property 16: Urgent Styling for Low Remaining Days**
    - **Validates: Requirements 7.5**

- [x] 7. Checkpoint - Vérifier l'affichage conditionnel
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Améliorer le composant Leaderboard
  - [x] 8.1 Implémenter la mise en évidence de l'utilisateur courant
    - Ajouter la classe CSS 'current-user' à la ligne de l'utilisateur
    - Comparer `participant.userId` avec `getCurrentUserId()`
    - _Requirements: 5.3_

  - [x] 8.2 Implémenter l'icône couronne pour la première position
    - Afficher `<i class="fas fa-crown">` si `participant.position === 1`
    - _Requirements: 5.4_

  - [x] 8.3 Vérifier l'affichage complet des données participant
    - Afficher position, userName, progression, pourcentageCompletion
    - Formater les nombres avec le pipe `number`
    - _Requirements: 5.2_

  - [ ]* 8.4 Write property test for current user highlighting
    - **Property 10: Current User Highlighting in Leaderboard**
    - **Validates: Requirements 5.3**

  - [ ]* 8.5 Write property test for first position crown
    - **Property 11: First Position Crown Icon**
    - **Validates: Requirements 5.4**

  - [ ]* 8.6 Write property test for leaderboard data display
    - **Property 9: Leaderboard Participant Data Display**
    - **Validates: Requirements 5.2**

- [x] 9. Implémenter la célébration à 100% de progression
  - [x] 9.1 Ajouter la détection de complétion
    - Vérifier si `progressPercentage >= 100` après mise à jour
    - Déclencher l'animation de célébration
    - _Requirements: 4.4_

  - [ ]* 9.2 Write property test for celebration trigger
    - **Property 8: Celebration Trigger at 100% Progress**
    - **Validates: Requirements 4.4**

- [x] 10. Améliorer la gestion des erreurs et notifications
  - [x] 10.1 Implémenter le logging des erreurs
    - Appeler `errorHandler.logError(operation, error)` pour chaque erreur
    - Inclure le nom de l'opération et l'objet erreur
    - _Requirements: 8.3_

  - [x] 10.2 Implémenter les notifications toast
    - Afficher toast de succès après création, join, cancel, update
    - Afficher toast d'erreur en cas d'échec
    - _Requirements: 8.4, 8.5_

  - [ ]* 10.3 Write property test for error logging
    - **Property 18: Error Logging**
    - **Validates: Requirements 8.3**

  - [ ]* 10.4 Write property test for toast notifications
    - **Property 19: Toast Notifications for Actions**
    - **Validates: Requirements 8.4, 8.5**

- [x] 11. Vérifier l'intégration avec l'authentification
  - [x] 11.1 Vérifier que les headers Authorization sont inclus
    - Utiliser `createAuthHeaders()` pour toutes les requêtes
    - Inclure le token Bearer depuis StorageService
    - _Requirements: 9.2_

  - [ ]* 11.2 Write property test for authorization header
    - **Property 20: Authorization Header in API Requests**
    - **Validates: Requirements 9.2**

- [x] 12. Checkpoint - Vérifier l'intégration complète
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Vérifier l'affichage des cartes de défi
  - [x] 13.1 Vérifier que tous les champs requis sont affichés
    - nom, description, typeObjectif avec icône
    - valeurCible avec unité, dates, nombreParticipants, joursRestants
    - _Requirements: 7.1_

  - [x] 13.2 Vérifier l'état vide avec suggestion d'action
    - Afficher message et bouton d'action si liste vide
    - _Requirements: 2.6_

  - [ ]* 13.3 Write property test for challenge card fields
    - **Property 14: Challenge Card Required Fields Display**
    - **Validates: Requirements 7.1**

  - [ ]* 13.4 Write property test for empty state display
    - **Property 4: Empty State Display**
    - **Validates: Requirements 2.6**

- [x] 14. Final checkpoint - Validation complète
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Intégrer le rafraîchissement du fil social après les actions sur les défis
  - [x] 15.1 Ajouter la méthode publique refreshSocialFeed() dans FriendService
    - Exposer la méthode loadSocialFeed() publiquement
    - Permettre aux autres services de déclencher un rafraîchissement
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 15.2 Injecter FriendService dans FriendChallengeService
    - Ajouter FriendService comme dépendance
    - Importer le service dans le constructeur
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 15.3 Appeler refreshSocialFeed() après création de défi
    - Dans createChallenge(), après succès, appeler friendService.refreshSocialFeed()
    - Gérer les erreurs silencieusement (ne pas bloquer l'action principale)
    - _Requirements: 11.1, 11.6_

  - [x] 15.4 Appeler refreshSocialFeed() après avoir rejoint un défi
    - Dans joinChallenge(), après succès, appeler friendService.refreshSocialFeed()
    - _Requirements: 11.2, 11.6_

  - [x] 15.5 Appeler refreshSocialFeed() après complétion d'un défi (100%)
    - Dans updateProgress(), vérifier si progression >= 100%
    - Si oui, appeler friendService.refreshSocialFeed()
    - _Requirements: 11.3, 11.6_

  - [ ]* 15.6 Write property test for social feed refresh after creation
    - **Property 21: Social Feed Refresh After Challenge Creation**
    - **Validates: Requirements 11.1**

  - [ ]* 15.7 Write property test for social feed refresh after joining
    - **Property 22: Social Feed Refresh After Joining Challenge**
    - **Validates: Requirements 11.2**

- [x] 16. Mettre à jour le modèle SocialActivity pour supporter les types backend
  - [x] 16.1 Ajouter les types d'activités manquants dans le modèle
    - Ajouter 'challenge_joined' au type union
    - Ajouter les champs relatedEntityId et relatedEntityType optionnels
    - _Requirements: 11.4_

  - [x] 16.2 Créer une fonction de mapping des types d'activités
    - Mapper CHALLENGE_JOINED → challenge_joined
    - Mapper CHALLENGE_COMPLETED → challenge_completed
    - Mapper WORKOUT_COMPLETED → workout
    - _Requirements: 11.4_

  - [ ]* 16.3 Write property test for activity type mapping
    - **Property 24: Social Activity Type Mapping**
    - **Validates: Requirements 11.4**

- [x] 17. Améliorer l'affichage des activités de défi dans le fil social
  - [x] 17.1 Mettre à jour le template SocialFeedComponent pour les activités de défi
    - Afficher le nom du défi
    - Afficher le type d'objectif avec icône
    - Afficher la progression si disponible
    - _Requirements: 11.5_

  - [x] 17.2 Ajouter les styles CSS pour les activités de défi
    - Style distinct pour challenge_joined
    - Style distinct pour challenge_completed avec célébration
    - _Requirements: 11.5_

- [x] 18. Final checkpoint - Validation intégration Social Activities
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties using fast-check
- Unit tests validate specific examples and edge cases
- The implementation builds on existing code in `FriendChallengeService` and `FriendChallengesComponent`
- **NEW**: Tasks 15-18 add Social Activity integration to show challenge actions in the social feed
