# Requirements Document

## Introduction

Ce document définit les exigences pour la création d'un système de gestion des préférences de notifications frontend Angular compatible avec le backend Spring Boot existant. Le système permettra aux utilisateurs de visualiser et modifier leurs préférences de notifications de manière intuitive et fiable.

## Glossary

- **NotificationPreferencesComponent**: Composant principal de gestion des préférences de notifications
- **NotificationService**: Service Angular pour la communication avec l'API backend
- **PreferencesForm**: Formulaire réactif pour la modification des préférences
- **Backend_API**: API REST Spring Boot existante pour les notifications
- **User**: Utilisateur connecté de l'application fitness
- **ErrorHandler**: Gestionnaire d'erreurs pour les réponses API

## Requirements

### Requirement 1: Affichage des Préférences Utilisateur

**User Story:** En tant qu'utilisateur connecté, je veux voir mes préférences de notifications actuelles, afin de comprendre quels rappels sont activés et à quelles heures.

#### Acceptance Criteria

1. WHEN l'utilisateur accède à la page des préférences, THE NotificationPreferencesComponent SHALL récupérer les préférences existantes via l'API
2. WHEN les préférences sont chargées avec succès, THE PreferencesForm SHALL afficher toutes les valeurs actuelles (booléens et heures)
3. WHEN aucune préférence n'existe pour l'utilisateur, THE Backend_API SHALL créer des préférences par défaut et les retourner
4. WHEN le chargement échoue, THE ErrorHandler SHALL afficher un message d'erreur approprié
5. WHILE les données se chargent, THE NotificationPreferencesComponent SHALL afficher un indicateur de chargement

### Requirement 2: Modification des Préférences de Repas

**User Story:** En tant qu'utilisateur, je veux activer/désactiver les rappels de repas et définir leurs horaires, afin de recevoir des notifications aux moments qui me conviennent.

#### Acceptance Criteria

1. WHEN l'utilisateur modifie l'état d'activation des rappels de repas, THE PreferencesForm SHALL mettre à jour la valeur booléenne correspondante
2. WHEN l'utilisateur saisit une heure de rappel, THE PreferencesForm SHALL valider le format HH:mm avant acceptation
3. WHEN une heure invalide est saisie, THE PreferencesForm SHALL afficher un message d'erreur de validation
4. THE PreferencesForm SHALL permettre la configuration séparée du petit-déjeuner, déjeuner, dîner et collations
5. WHEN les rappels de collations sont désactivés, THE PreferencesForm SHALL désactiver les champs d'heures correspondants

### Requirement 3: Modification des Préférences d'Entraînement

**User Story:** En tant qu'utilisateur, je veux configurer mes rappels d'entraînement, afin de maintenir ma routine sportive.

#### Acceptance Criteria

1. WHEN l'utilisateur active/désactive les rappels d'entraînement, THE PreferencesForm SHALL mettre à jour la propriété workoutRemindersEnabled
2. WHEN l'utilisateur définit l'heure d'entraînement par défaut, THE PreferencesForm SHALL valider et stocker l'heure au format LocalTime
3. THE PreferencesForm SHALL permettre la sélection des jours actifs via des cases à cocher
4. WHEN aucun jour n'est sélectionné, THE PreferencesForm SHALL afficher un avertissement de validation
5. THE PreferencesForm SHALL supporter la configuration des heures de silence (début et fin)

### Requirement 4: Gestion des Messages Motivationnels

**User Story:** En tant qu'utilisateur, je veux contrôler la fréquence des messages motivationnels, afin de recevoir le bon niveau d'encouragement.

#### Acceptance Criteria

1. WHEN l'utilisateur active/désactive les messages motivationnels, THE PreferencesForm SHALL mettre à jour motivationalMessagesEnabled
2. WHEN les messages sont activés, THE PreferencesForm SHALL permettre de définir la fréquence (nombre par semaine)
3. WHEN l'utilisateur saisit une fréquence, THE PreferencesForm SHALL valider que la valeur est entre 1 et 7
4. THE PreferencesForm SHALL afficher la fréquence avec une description claire (ex: "3 messages par semaine")
5. WHEN la fréquence est invalide, THE PreferencesForm SHALL empêcher la soumission du formulaire

### Requirement 5: Sauvegarde des Modifications

**User Story:** En tant qu'utilisateur, je veux sauvegarder mes modifications de préférences, afin qu'elles soient appliquées à mes futures notifications.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur "Sauvegarder", THE NotificationService SHALL envoyer une requête PUT à l'API backend
2. WHEN la sauvegarde réussit, THE NotificationPreferencesComponent SHALL afficher un message de succès
3. WHEN la sauvegarde échoue avec une erreur 400, THE ErrorHandler SHALL afficher les détails de validation
4. WHEN la sauvegarde échoue avec une erreur 500, THE ErrorHandler SHALL afficher un message d'erreur serveur générique
5. WHILE la sauvegarde est en cours, THE PreferencesForm SHALL désactiver le bouton de soumission et afficher un indicateur de chargement

### Requirement 6: Validation des Données

**User Story:** En tant qu'utilisateur, je veux que mes saisies soient validées en temps réel, afin d'éviter les erreurs lors de la sauvegarde.

#### Acceptance Criteria

1. WHEN l'utilisateur saisit une heure, THE PreferencesForm SHALL valider le format HH:mm en temps réel
2. WHEN une validation échoue, THE PreferencesForm SHALL afficher l'erreur sous le champ concerné
3. WHEN toutes les validations passent, THE PreferencesForm SHALL activer le bouton de sauvegarde
4. THE PreferencesForm SHALL empêcher la soumission si des erreurs de validation existent
5. WHEN l'utilisateur corrige une erreur, THE PreferencesForm SHALL masquer le message d'erreur correspondant

### Requirement 7: Gestion des Erreurs API

**User Story:** En tant qu'utilisateur, je veux comprendre les erreurs qui se produisent, afin de pouvoir les corriger ou contacter le support si nécessaire.

#### Acceptance Criteria

1. WHEN l'API retourne une erreur 400, THE ErrorHandler SHALL extraire et afficher les messages de validation spécifiques
2. WHEN l'API retourne une erreur 401, THE ErrorHandler SHALL rediriger vers la page de connexion
3. WHEN l'API retourne une erreur 500, THE ErrorHandler SHALL afficher un message d'erreur serveur générique
4. WHEN une erreur réseau se produit, THE ErrorHandler SHALL afficher un message de problème de connexion
5. THE ErrorHandler SHALL logger toutes les erreurs pour le débogage

### Requirement 8: Interface Utilisateur Responsive

**User Story:** En tant qu'utilisateur sur différents appareils, je veux une interface adaptée à ma taille d'écran, afin d'avoir une expérience optimale.

#### Acceptance Criteria

1. THE NotificationPreferencesComponent SHALL s'adapter aux écrans mobiles, tablettes et desktop
2. WHEN l'écran est petit, THE PreferencesForm SHALL organiser les champs en colonnes simples
3. WHEN l'écran est large, THE PreferencesForm SHALL organiser les champs en colonnes multiples pour optimiser l'espace
4. THE PreferencesForm SHALL utiliser des composants Angular Material pour la cohérence visuelle
5. THE NotificationPreferencesComponent SHALL respecter le thème de l'application existante

### Requirement 9: Intégration avec l'Architecture Existante

**User Story:** En tant que développeur, je veux que le nouveau composant s'intègre parfaitement avec l'architecture Angular existante, afin de maintenir la cohérence du code.

#### Acceptance Criteria

1. THE NotificationService SHALL utiliser HttpClient avec les intercepteurs existants
2. THE NotificationService SHALL gérer l'authentification via les tokens JWT existants
3. THE NotificationPreferencesComponent SHALL utiliser les services de gestion d'état existants si disponibles
4. THE NotificationPreferencesComponent SHALL suivre les conventions de nommage et structure du projet
5. THE NotificationService SHALL être compatible avec les services d'erreur existants

### Requirement 10: Performance et Optimisation

**User Story:** En tant qu'utilisateur, je veux que l'interface soit rapide et réactive, afin d'avoir une expérience fluide.

#### Acceptance Criteria

1. THE NotificationPreferencesComponent SHALL charger les préférences en moins de 2 secondes
2. THE PreferencesForm SHALL réagir aux changements utilisateur sans délai perceptible
3. THE NotificationService SHALL implémenter un cache pour éviter les requêtes répétées
4. THE NotificationPreferencesComponent SHALL utiliser OnPush change detection pour optimiser les performances
5. THE PreferencesForm SHALL utiliser le debouncing pour les validations en temps réel