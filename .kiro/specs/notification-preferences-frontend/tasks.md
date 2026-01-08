# Implementation Plan: Notification Preferences Frontend

## Overview

Ce plan d'implémentation détaille la création d'un système complet de gestion des préférences de notifications frontend Angular, compatible avec le backend Spring Boot existant. L'approche suit une progression logique : interfaces → service → composant → tests → intégration.

## Tasks

- [x] 1. Créer les interfaces TypeScript et modèles de données
  - Définir l'interface NotificationPreferences selon l'API backend
  - Créer l'interface NotificationPreferencesUpdateRequest
  - Définir les types pour les réponses d'erreur
  - Créer les enums pour les jours de la semaine et types de notification
  - _Requirements: 9.1, 9.4_

- [ ] 2. Implémenter le service de communication API
  - [x] 2.1 Créer NotificationPreferencesService avec HttpClient
    - Configurer les endpoints API selon le backend Spring Boot
    - Implémenter getUserPreferences() avec gestion d'erreur
    - Implémenter updatePreferences() avec validation
    - _Requirements: 5.1, 9.1, 9.2_

  - [ ]* 2.2 Écrire les tests unitaires pour le service
    - Tester les appels API avec HttpClientTestingModule
    - Tester la gestion d'erreurs pour chaque code de statut
    - Tester l'inclusion des tokens JWT
    - _Requirements: 7.1, 7.2, 7.3, 9.2_

  - [ ]* 2.3 Écrire le test de propriété pour la communication API
    - **Property 10: API Communication**
    - **Validates: Requirements 5.1**

- [ ] 3. Développer le composant principal
  - [x] 3.1 Créer NotificationPreferencesComponent avec structure de base
    - Configurer le composant avec OnPush change detection
    - Initialiser le FormBuilder et les FormGroups
    - Implémenter ngOnInit avec chargement des préférences
    - _Requirements: 1.1, 1.2, 10.4_

  - [x] 3.2 Implémenter la logique de formulaire réactif
    - Créer les FormControls pour tous les champs de préférences
    - Configurer les validateurs (format heure, plages numériques)
    - Implémenter la logique de contrôles conditionnels
    - _Requirements: 2.1, 2.2, 3.1, 4.1_

  - [ ]* 3.3 Écrire les tests unitaires pour le composant
    - Tester l'initialisation du composant et du formulaire
    - Tester la population du formulaire avec les données chargées
    - Tester les validations de champs
    - _Requirements: 1.1, 1.2, 2.2, 6.1_

  - [ ]* 3.4 Écrire le test de propriété pour la population du formulaire
    - **Property 2: Form Population Consistency**
    - **Validates: Requirements 1.2**

- [x] 4. Créer le template HTML avec Angular Material
  - [x] 4.1 Structurer le template avec sections organisées
    - Créer la section rappels de repas avec mat-form-field
    - Créer la section rappels d'entraînement
    - Créer la section messages motivationnels
    - Créer la section paramètres généraux
    - _Requirements: 8.4, 2.4, 3.3_

  - [x] 4.2 Implémenter les contrôles de formulaire avec validation
    - Configurer les inputs de temps avec validation HH:mm
    - Implémenter les checkboxes pour les jours actifs
    - Configurer les sliders pour la fréquence des messages
    - Ajouter les messages d'erreur sous chaque champ
    - _Requirements: 2.2, 2.3, 6.2, 4.3_

  - [ ]* 4.3 Écrire les tests unitaires pour le template
    - Tester l'affichage des champs de formulaire
    - Tester l'affichage des messages d'erreur
    - Tester les interactions utilisateur
    - _Requirements: 2.3, 6.2, 8.4_

- [ ] 5. Implémenter la gestion des états et du feedback
  - [x] 5.1 Ajouter les indicateurs de chargement
    - Implémenter loading state pour le chargement initial
    - Implémenter loading state pour la sauvegarde
    - Désactiver les contrôles pendant les opérations async
    - _Requirements: 1.5, 5.5_

  - [x] 5.2 Implémenter les messages de feedback utilisateur
    - Configurer mat-snack-bar pour les messages de succès
    - Implémenter l'affichage des erreurs de validation
    - Configurer les messages d'erreur par code de statut
    - _Requirements: 5.2, 5.3, 5.4, 7.1_

  - [ ]* 5.3 Écrire les tests unitaires pour la gestion d'état
    - Tester les états de chargement
    - Tester l'affichage des messages de feedback
    - Tester la gestion des erreurs API
    - _Requirements: 1.5, 5.2, 7.1_

  - [ ]* 5.4 Écrire le test de propriété pour la gestion des erreurs
    - **Property 12: Error Handling by Status Code**
    - **Validates: Requirements 5.3, 5.4, 7.1, 7.2, 7.3**

- [ ] 6. Checkpoint - Vérifier le fonctionnement de base
  - Vérifier que le composant se charge sans erreur
  - Tester le chargement des préférences depuis l'API
  - Tester la sauvegarde des modifications
  - S'assurer que tous les tests passent, demander à l'utilisateur si des questions se posent.

- [ ] 7. Implémenter les fonctionnalités avancées
  - [ ] 7.1 Ajouter la validation en temps réel avec debouncing
    - Configurer le debouncing pour les validations (300ms)
    - Implémenter la validation asynchrone si nécessaire
    - Optimiser les performances des validations
    - _Requirements: 6.1, 10.5_

  - [ ] 7.2 Implémenter le cache pour les préférences
    - Configurer le cache dans le service avec TTL
    - Implémenter la logique de cache pour éviter les requêtes répétées
    - Gérer l'invalidation du cache après mise à jour
    - _Requirements: 10.3_

  - [ ]* 7.3 Écrire les tests de propriété pour les fonctionnalités avancées
    - **Property 14: Caching Behavior**
    - **Property 15: Input Debouncing**
    - **Validates: Requirements 10.3, 10.5**

- [ ] 8. Ajouter le style CSS responsive
  - [x] 8.1 Créer les styles CSS avec Angular Material theming
    - Implémenter le layout responsive (mobile, tablette, desktop)
    - Configurer les breakpoints pour l'organisation des colonnes
    - Appliquer le thème de l'application existante
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

  - [x] 8.2 Optimiser l'accessibilité
    - Ajouter les labels ARIA appropriés
    - Configurer la navigation au clavier
    - Tester avec les lecteurs d'écran
    - _Requirements: 8.4_

- [ ] 9. Intégrer avec l'architecture existante
  - [x] 9.1 Configurer le routing pour le composant
    - Ajouter la route dans app.routes.ts
    - Configurer les guards d'authentification si nécessaire
    - Ajouter le lien de navigation dans le menu
    - _Requirements: 9.3, 9.4_

  - [x] 9.2 Intégrer avec les services existants
    - Utiliser les intercepteurs HTTP existants
    - Intégrer avec le service d'authentification JWT
    - Utiliser les services d'erreur existants si disponibles
    - _Requirements: 9.1, 9.2, 9.5_

  - [ ]* 9.3 Écrire les tests d'intégration
    - Tester l'intégration avec les services existants
    - Tester le routing et la navigation
    - Tester l'authentification et les intercepteurs
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 10. Tests de propriétés complets et validation finale
  - [ ]* 10.1 Écrire tous les tests de propriété restants
    - **Property 1: Component Initialization API Call**
    - **Property 3: Loading State Management**
    - **Property 4: Form Control Updates**
    - **Property 5: Time Format Validation**
    - **Property 6: Validation Error Display**
    - **Property 7: Conditional Form Control States**
    - **Property 8: Numeric Range Validation**
    - **Property 9: Form Submission Prevention**
    - **Property 11: Success Feedback**
    - **Property 13: Authentication Integration**
    - **Validates: Requirements 1.1, 1.5, 2.1, 2.2, 2.3, 2.5, 3.1, 4.3, 4.5, 5.2, 5.5, 6.2, 6.5, 9.2**

  - [ ]* 10.2 Exécuter la suite de tests complète
    - Vérifier que tous les tests unitaires passent
    - Vérifier que tous les tests de propriété passent
    - Atteindre l'objectif de couverture de 90%
    - _Requirements: All_

- [ ] 11. Checkpoint final - Validation complète
  - Tester l'application end-to-end avec le backend
  - Vérifier la compatibilité avec tous les navigateurs supportés
  - Valider l'accessibilité et la responsivité
  - S'assurer que tous les tests passent, demander à l'utilisateur si des questions se posent.

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints permettent une validation incrémentale
- Les tests de propriété valident les propriétés de correction universelles
- Les tests unitaires valident des exemples spécifiques et les cas limites