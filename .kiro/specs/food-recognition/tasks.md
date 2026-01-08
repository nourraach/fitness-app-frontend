# Implementation Plan: Food Recognition Feature

## Overview

Implémentation de la fonctionnalité de reconnaissance d'aliments par photo en Angular. Le plan suit une approche incrémentale : modèles de données, service API, composant UI, puis intégration.

## Tasks

- [x] 1. Créer les modèles de données et interfaces
  - [x] 1.1 Créer le fichier des interfaces TypeScript
    - Créer `src/app/models/food-recognition.model.ts`
    - Définir `NutritionalInfo`, `FoodRecognitionResult`, `ConfirmedFood`, `FileValidationResult`
    - _Requirements: 2.3, 3.1-3.5_

  - [x] 1.2 Créer les fonctions utilitaires de validation et calcul
    - Créer `src/app/utils/food-recognition.utils.ts`
    - Implémenter `validateImageFile()` et `calculateNutritionalValues()`
    - _Requirements: 1.2, 1.4, 6.2_

  - [ ]* 1.3 Écrire les tests de propriété pour la validation de fichier
    - **Property 1: File Validation Correctness**
    - **Validates: Requirements 1.2, 1.4**

  - [ ]* 1.4 Écrire les tests de propriété pour le calcul proportionnel
    - **Property 5: Quantity Proportional Calculation**
    - **Validates: Requirements 6.2**

- [x] 2. Implémenter le FoodRecognitionService
  - [x] 2.1 Créer le service Angular
    - Créer `src/app/services/food-recognition.service.ts`
    - Implémenter `recognizeFood()`, `searchFoods()`, `manualEntry()`, `getNutritionalInfo()`
    - Configurer l'URL de base vers `http://localhost:8095/api/food-recognition`
    - _Requirements: 2.1, 4.2, 5.2, 5.4_

  - [ ]* 2.2 Écrire les tests unitaires du service
    - Tester les appels HTTP avec HttpClientTestingModule
    - Vérifier la construction correcte des requêtes
    - _Requirements: 2.1_

- [x] 3. Checkpoint - Vérifier les fondations
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Créer le composant FoodScannerComponent
  - [x] 4.1 Créer la structure de base du composant
    - Créer `src/app/components/food-scanner/food-scanner.component.ts`
    - Créer `src/app/components/food-scanner/food-scanner.component.html`
    - Créer `src/app/components/food-scanner/food-scanner.component.css`
    - Définir les propriétés d'état et les méthodes de base
    - _Requirements: 1.1, 1.3, 1.5_

  - [x] 4.2 Implémenter la sélection et prévisualisation d'image
    - Implémenter `onFileSelected()` avec validation
    - Afficher la prévisualisation de l'image
    - Gérer les erreurs de validation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 4.3 Implémenter l'analyse d'image
    - Implémenter `analyzeImage()` avec gestion du loading
    - Afficher les résultats de reconnaissance
    - Afficher le niveau de confiance en pourcentage
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 4.4 Écrire les tests de propriété pour l'affichage des résultats
    - **Property 2: Recognition Result Display Completeness**
    - **Validates: Requirements 2.3, 2.4**

- [x] 5. Implémenter l'affichage nutritionnel et alternatives
  - [x] 5.1 Implémenter l'affichage des informations nutritionnelles
    - Afficher calories, protéines, lipides, glucides
    - Afficher la catégorie de l'aliment
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 5.2 Écrire les tests de propriété pour l'affichage nutritionnel
    - **Property 3: Nutritional Info Display Completeness**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4**

  - [x] 5.3 Implémenter la gestion des alternatives
    - Afficher la liste des alternatives
    - Implémenter `selectAlternative()` pour charger les infos d'une alternative
    - Masquer la section si pas d'alternatives
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 5.4 Écrire les tests de propriété pour les alternatives
    - **Property 4: Alternatives Rendering Consistency**
    - **Validates: Requirements 4.1, 4.4**

- [x] 6. Implémenter la saisie manuelle
  - [x] 6.1 Implémenter le mode saisie manuelle
    - Ajouter le bouton et le champ de saisie manuelle
    - Implémenter `searchFoods()` avec debounce
    - Afficher les résultats de recherche en dropdown
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [x] 6.2 Implémenter la sélection depuis la recherche
    - Implémenter `selectSearchResult()` pour charger les infos nutritionnelles
    - _Requirements: 5.4_

  - [ ]* 6.3 Écrire les tests de propriété pour les résultats de recherche
    - **Property 6: Search Results Rendering**
    - **Validates: Requirements 5.3**

- [x] 7. Implémenter la confirmation et ajustement de quantité
  - [x] 7.1 Implémenter l'ajustement de quantité
    - Ajouter le champ de saisie de quantité
    - Implémenter `updateQuantity()` avec recalcul proportionnel
    - _Requirements: 6.2_

  - [x] 7.2 Implémenter la confirmation
    - Ajouter le bouton de confirmation
    - Implémenter `confirmFood()` avec émission d'événement
    - Afficher le message de succès et réinitialiser le formulaire
    - _Requirements: 6.1, 6.3, 6.4_

- [x] 8. Implémenter la gestion des erreurs
  - [x] 8.1 Implémenter les messages d'erreur et retry
    - Gérer les erreurs de connexion, upload, timeout
    - Afficher les messages d'erreur appropriés
    - Implémenter `retry()` pour réessayer l'opération
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 9. Intégration et routing
  - [x] 9.1 Ajouter la route et le lien de navigation
    - Ajouter la route `/food-scanner` dans `app.routes.ts`
    - Ajouter le lien dans la navbar si nécessaire
    - _Requirements: 1.1_

- [x] 10. Checkpoint final - Vérifier l'intégration complète
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Le backend est disponible sur `http://localhost:8095/api/food-recognition`
- CORS est déjà configuré côté backend
- Utiliser fast-check pour les tests de propriété
- Les messages d'erreur sont en français
