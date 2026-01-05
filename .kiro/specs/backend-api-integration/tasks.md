# Implementation Plan: Backend API Integration

## Overview

Cette implémentation intègre les nouvelles APIs backend critiques dans le frontend Angular existant. L'approche suit une stratégie modulaire avec lazy loading et se concentre sur les fonctionnalités manquantes identifiées dans le rapport backend : audit logging admin, statistiques coach améliorées, reconnaissance d'aliments (US09), graphiques d'évolution (US06), et administration complète.

## Tasks

- [x] 1. Créer les modèles TypeScript pour les nouvelles APIs
  - Créer les interfaces pour AuditLogDTO, AuditStatsDTO, AuditFilters
  - Définir les modèles EnhancedClientDTO avec statistiques calculées
  - Implémenter FoodRecognitionResultDTO, NutritionalInfoDTO, FoodSuggestionDTO
  - Créer ChartDataDTO, WeeklyProgressDTO, MonthlyTrendsDTO
  - Définir AdminUserDTO, SystemStatsDTO, ModerationItemDTO
  - _Requirements: 1.1, 2.1, 4.1, 5.1, 6.1_

- [ ]* 1.1 Écrire des tests de propriété pour la validation des modèles
  - **Property 1: Model validation consistency**
  - **Validates: Requirements 1.1, 2.1, 4.1, 5.1, 6.1**

- [ ] 2. Implémenter les services d'intégration API
  - [x] 2.1 Créer AdminService avec méthodes complètes
    - Implémenter getAuditLogs() avec pagination et filtres
    - Ajouter searchAuditLogs() et getAuditStats()
    - Créer getUsers(), getUserDetails() pour gestion utilisateurs
    - Implémenter getDashboard(), getSystemStats()
    - Ajouter getModerationQueue(), moderateItem()
    - _Requirements: 1.1, 1.2, 1.3, 6.1, 6.2, 6.6, 6.7_

- [ ]* 2.2 Écrire des tests de propriété pour AdminService
  - **Property 2: Audit log API integration**
  - **Validates: Requirements 1.1, 1.2**

- [x] 2.3 Créer FoodRecognitionService
  - Implémenter recognizeFood() avec upload FormData
  - Ajouter getFoodSuggestions() avec recherche temps réel
  - Créer addManualFood() pour saisie manuelle
  - Implémenter getNutritionalInfo() avec calculs proportionnels
  - Ajouter checkHealth() pour monitoring service
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ]* 2.4 Écrire des tests de propriété pour FoodRecognitionService
  - **Property 4: Food recognition file validation**
  - **Validates: Requirements 4.1, 4.2**

- [x] 2.5 Créer ChartDataService
  - Implémenter getWeightEvolution(), getBMIEvolution()
  - Ajouter getCaloriesComparison(), getActivityDistribution()
  - Créer getWeeklyProgress(), getMonthlyTrends()
  - Intégrer filtres temporels (7j, 30j, 3 mois, 1 an)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ]* 2.6 Écrire des tests de propriété pour ChartDataService
  - **Property 6: Chart data integration**
  - **Validates: Requirements 5.1, 5.2**

- [x] 2.7 Améliorer ProgrammeService existant
  - Ajouter updateProgramme() avec PUT /api/coach/programmes/{id}
  - Implémenter deleteProgramme() avec DELETE /api/coach/programmes/{id}
  - Améliorer getCoachClients() pour utiliser les nouvelles statistiques
  - Ajouter validation propriétaire pour sécurité
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ]* 2.8 Écrire des tests de propriété pour Programme CRUD
  - **Property 3: Programme CRUD operations**
  - **Validates: Requirements 3.1, 3.2**

- [ ] 3. Créer les composants d'administration
  - [x] 3.1 Implémenter AuditLogsComponent
    - Créer tableau avec pagination et tri
    - Ajouter filtres par date, admin, type d'action
    - Implémenter recherche en temps réel
    - Afficher colonnes : Date, Admin, Action, Entité, Détails, IP
    - Intégrer virtual scrolling pour performance
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [ ]* 3.2 Écrire des tests de propriété pour AuditLogsComponent
  - **Property 1: Audit log API integration**
  - **Validates: Requirements 1.1, 1.2**

- [x] 3.3 Créer AdminDashboardComponent
  - Implémenter dashboard avec statistiques système
  - Ajouter graphiques temps réel avec Chart.js
  - Créer widgets pour métriques clés
  - Intégrer alertes et notifications admin
  - _Requirements: 6.1, 6.5_

- [x] 3.4 Implémenter UserManagementComponent
  - Créer tableau utilisateurs avec pagination
  - Ajouter filtres par rôle, statut, recherche
  - Implémenter actions activation/désactivation
  - Créer modal détails utilisateur
  - _Requirements: 6.2, 6.3, 6.4_

- [ ] 3.5 Créer ModerationQueueComponent
  - Implémenter queue de modération
  - Ajouter actions approuver/rejeter
  - Créer formulaire notes de modération
  - _Requirements: 6.6, 6.7_

- [ ] 4. Implémenter les composants de reconnaissance d'aliments
  - [x] 4.1 Créer FoodRecognitionContainerComponent
    - Gérer l'état global de reconnaissance
    - Orchestrer les sous-composants
    - Intégrer avec le système de repas existant
    - _Requirements: 4.1, 4.7_

- [x] 4.2 Implémenter FoodUploadComponent
  - Créer interface drag & drop pour images
  - Ajouter validation formats JPG/PNG/GIF
  - Implémenter compression d'images
  - Afficher preview avant upload
  - Gérer états de chargement
  - _Requirements: 4.1, 4.2_

- [ ]* 4.3 Écrire des tests de propriété pour upload d'images
  - **Property 4: Food recognition file validation**
  - **Validates: Requirements 4.1, 4.2**

- [x] 4.4 Créer FoodRecognitionResultComponent
  - Afficher résultats reconnaissance avec confiance
  - Montrer nom, catégorie, score de confiance
  - Intégrer informations nutritionnelles
  - Ajouter bouton "Ajouter au repas"
  - _Requirements: 4.3, 4.6_

- [ ]* 4.5 Écrire des tests de propriété pour affichage résultats
  - **Property 5: Food recognition result display**
  - **Validates: Requirements 4.3**

- [x] 4.6 Implémenter FoodSuggestionsComponent
  - Créer recherche temps réel avec debounce
  - Afficher suggestions avec autocomplete
  - Intégrer sélection rapide
  - _Requirements: 4.4_

- [x] 4.7 Créer NutritionalInfoComponent
  - Afficher informations nutritionnelles détaillées
  - Permettre ajustement quantité
  - Calculer valeurs proportionnelles
  - _Requirements: 4.6_

- [ ] 5. Créer les composants de graphiques d'évolution
  - [ ] 5.1 Implémenter ChartsContainerComponent
    - Orchestrer les 6 types de graphiques
    - Gérer filtres temporels communs
    - Intégrer export PDF/Excel
    - _Requirements: 5.1, 5.7_

- [ ] 5.2 Créer WeightEvolutionComponent
  - Implémenter graphique évolution poids avec Chart.js
  - Ajouter filtres période et zoom
  - Intégrer tendances et moyennes
  - _Requirements: 5.2_

- [ ] 5.3 Implémenter BMIEvolutionComponent
  - Créer graphique évolution IMC
  - Ajouter zones de référence (normal, surpoids, etc.)
  - Intégrer calculs automatiques
  - _Requirements: 5.3_

- [ ] 5.4 Créer CaloriesComparisonComponent
  - Implémenter comparaison calories consommées/dépensées
  - Ajouter graphique en barres avec Chart.js
  - Intégrer objectifs et écarts
  - _Requirements: 5.4_

- [ ] 5.5 Implémenter ActivityDistributionComponent
  - Créer graphique distribution activités (camembert)
  - Ajouter légendes et pourcentages
  - Intégrer drill-down par type d'activité
  - _Requirements: 5.5_

- [ ] 5.6 Créer WeeklyProgressComponent
  - Implémenter graphique progrès hebdomadaire
  - Ajouter métriques multiples (poids, calories, activité)
  - Intégrer comparaisons semaine précédente
  - _Requirements: 5.6_

- [ ]* 5.7 Écrire des tests de propriété pour graphiques
  - **Property 6: Chart data integration**
  - **Validates: Requirements 5.1, 5.2**

- [ ] 6. Améliorer les composants de gestion programmes existants
  - [x] 6.1 Ajouter boutons Modifier/Supprimer à GestionProgrammesComponent
    - Intégrer bouton "Modifier" avec modal pré-rempli
    - Ajouter bouton "Supprimer" avec confirmation
    - Implémenter appels PUT/DELETE APIs
    - Gérer états de chargement et erreurs
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7_

- [ ]* 6.2 Écrire des tests de propriété pour CRUD programmes
  - **Property 3: Programme CRUD operations**
  - **Validates: Requirements 3.1, 3.2**

- [x] 6.3 Améliorer CoachClientsComponent avec vraies statistiques
  - Intégrer affichage programsCount, progressRate, lastActivity
  - Ajouter tri par statistiques
  - Créer alertes visuelles clients inactifs
    - Implémenter indicateurs de progression
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ]* 6.4 Écrire des tests de propriété pour statistiques coach
  - **Property 2: Enhanced client statistics display**
  - **Validates: Requirements 2.1, 2.2**

- [ ] 7. Implémenter les services utilitaires
  - [x] 7.1 Créer ApiErrorHandlerService
    - Implémenter gestion erreurs contextuelles
    - Ajouter messages d'erreur en français
    - Créer retry logic intelligent
    - Gérer erreurs spécifiques (401, 403, 413, 415)
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6_

- [x] 7.2 Implémenter NetworkResilienceService
  - Créer détection état réseau
  - Ajouter queue de retry hors ligne
  - Implémenter synchronisation automatique
  - Gérer mode dégradé
  - _Requirements: 8.4, 8.7_

- [x] 7.3 Créer CacheService
  - Implémenter cache intelligent avec TTL
  - Ajouter invalidation par pattern
  - Créer stratégies de cache par type de données
  - Optimiser performances
  - _Requirements: 8.7, 10.5_

- [ ] 7.4 Implémenter ImageCompressionService
  - Créer compression d'images avant upload
  - Ajouter redimensionnement automatique
  - Optimiser qualité/taille
  - _Requirements: 10.2_

- [ ]* 7.5 Écrire des tests de propriété pour services utilitaires
  - **Property 9: Loading state management**
  - **Validates: Requirements 8.1**

- [ ] 8. Mettre à jour le routing et la navigation
  - [x] 8.1 Ajouter nouvelles routes avec lazy loading
    - Créer routes admin avec AdminGuard
    - Ajouter routes food-recognition avec AuthGuard
    - Implémenter routes charts avec lazy loading
    - Configurer routes programmes améliorées
    - _Requirements: 9.1, 9.2, 10.1_

- [ ]* 8.2 Écrire des tests de propriété pour routing
  - **Property 10: Route integration**
  - **Validates: Requirements 9.1, 10.1**

- [x] 8.3 Mettre à jour NavbarComponent
  - Ajouter liens vers nouvelles fonctionnalités
  - Implémenter navigation conditionnelle par rôle
  - Créer indicateurs notifications/alertes
  - _Requirements: 9.2, 9.3_

- [ ] 8.4 Améliorer les guards existants
  - Étendre AdminGuard pour nouvelles pages admin
  - Vérifier AuthGuard pour nouvelles fonctionnalités
  - Ajouter validation rôles spécifiques
  - _Requirements: 9.4, 9.5_

- [ ] 9. Implémenter le design responsive
  - [ ] 9.1 Adapter tous les nouveaux composants pour mobile
    - Optimiser tableaux audit logs pour mobile
    - Adapter upload d'images pour tactile
    - Créer modals plein écran pour graphiques
    - Optimiser navigation admin sur tablette
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ]* 9.2 Écrire des tests de propriété pour responsive design
  - **Property 8: Responsive design adaptation**
  - **Validates: Requirements 7.1**

- [ ] 9.3 Optimiser les performances mobiles
  - Implémenter lazy loading images
  - Ajouter compression automatique
  - Optimiser rendu graphiques
  - Gérer connexions lentes
  - _Requirements: 7.5, 7.6, 7.7, 10.6, 10.7_

- [ ] 10. Intégration et tests
  - [ ] 10.1 Configurer les tests property-based avec fast-check
    - Installer et configurer fast-check pour TypeScript
    - Créer générateurs de données de test
    - Configurer 100+ itérations par propriété
    - _Requirements: Tous les tests de propriété_

- [ ] 10.2 Écrire les tests d'intégration
  - Tester communication avec nouvelles APIs backend
  - Vérifier intégration composants avec architecture existante
  - Tester workflows complets bout en bout
  - Valider cohérence données entre services
  - _Requirements: Toutes les exigences_

- [ ] 10.3 Implémenter les intercepteurs d'erreur
  - Créer intercepteur HTTP pour nouvelles APIs
  - Ajouter gestion globale erreurs spécifiques
  - Implémenter retry automatique
  - _Requirements: 8.1, 8.2, 8.3_

- [ ] 11. Checkpoint - Tests et validation
  - Exécuter tous les tests unitaires et property-based
  - Vérifier couverture de tests (minimum 80%)
  - Tester intégration avec APIs backend réelles
  - Valider responsive design sur différents appareils

- [ ] 12. Optimisation finale et déploiement
  - [ ] 12.1 Optimiser les performances
    - Implémenter code splitting avancé
    - Optimiser bundle sizes
    - Ajouter preloading stratégique
    - Configurer service worker pour cache
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 12.2 Finaliser l'accessibilité
  - Ajouter ARIA labels complets
  - Tester navigation clavier
  - Valider compatibilité lecteurs d'écran
  - Implémenter mode contraste élevé
  - _Requirements: Accessibilité pour tous les composants_

- [ ] 12.3 Préparer la production
  - Builder bundle de production
  - Tester en mode production
  - Vérifier toutes les fonctionnalités avec backend
  - Documenter configuration déploiement
  - _Requirements: Toutes les exigences_

- [ ] 13. Checkpoint final - Application complète
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Les tâches marquées avec `*` sont des tests property-based optionnels mais recommandés
- Chaque tâche référence les exigences spécifiques pour traçabilité
- Les checkpoints permettent validation incrémentale
- L'implémentation suit une approche modulaire avec lazy loading
- Les tests property-based valident les propriétés de correctness universelles
- L'accent est mis sur l'intégration avec l'architecture existante