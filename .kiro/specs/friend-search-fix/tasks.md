# Implementation Plan - Correction de la Recherche d'Amis

## Tasks

- [x] 1. Corriger l'endpoint API dans FriendService
  - Changer `/api/users/search` vers `/api/friends/search`
  - _Requirements: 2.1_

- [x] 2. Implémenter la transformation des données
  - Mapper les champs FriendDTO vers UserSearchResult
  - Gérer les champs manquants avec des valeurs par défaut
  - _Requirements: 2.2, 2.3_

- [x] 3. Intégrer la détermination du statut d'amitié
  - Utiliser getFriendshipStatus() pour chaque résultat
  - _Requirements: 2.4, 3.5_

- [ ] 4. Tester la fonctionnalité corrigée
  - Vérifier que la recherche fonctionne avec des noms
  - Tester la recherche par email
  - Confirmer l'affichage correct des statuts d'amitié
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 5. Validation des cas d'erreur
  - Tester le comportement en cas d'erreur réseau
  - Vérifier la gestion des réponses vides
  - _Requirements: 2.5_

## Checkpoint
- Ensure all tests pass, ask the user if questions arise.