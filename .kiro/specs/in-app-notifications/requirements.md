# Requirements Document

## Introduction

Ce document définit les exigences pour l'intégration frontend du système de notifications in-app avec le backend Spring Boot. Le système permettra aux utilisateurs de recevoir, visualiser, gérer et interagir avec leurs notifications en temps réel, incluant les badges de compteur, l'historique, et les fonctionnalités de marquage lu/non-lu.

## Glossary

- **NotificationCenter**: Composant principal d'affichage et gestion des notifications
- **NotificationBadge**: Indicateur visuel du nombre de notifications non lues
- **NotificationService**: Service Angular pour la communication avec l'API backend notifications
- **NotificationItem**: Représentation d'une notification individuelle
- **WebSocketService**: Service de communication temps réel pour les notifications push
- **Backend_API**: API REST Spring Boot pour les notifications (base URL: /api/notifications)
- **User**: Utilisateur connecté de l'application fitness

## Requirements

### Requirement 1: Récupération et Affichage des Notifications

**User Story:** En tant qu'utilisateur connecté, je veux voir la liste de mes notifications, afin de rester informé des événements importants de l'application.

#### Acceptance Criteria

1. WHEN l'utilisateur ouvre le centre de notifications, THE NotificationService SHALL récupérer les notifications via GET /api/notifications
2. WHEN les notifications sont chargées, THE NotificationCenter SHALL afficher chaque notification avec son titre, message, date et statut de lecture
3. WHILE les notifications se chargent, THE NotificationCenter SHALL afficher un indicateur de chargement
4. WHEN aucune notification n'existe, THE NotificationCenter SHALL afficher un message "Aucune notification"
5. IF le chargement échoue, THEN THE NotificationCenter SHALL afficher un message d'erreur avec option de réessayer

### Requirement 2: Badge de Notifications Non Lues

**User Story:** En tant qu'utilisateur, je veux voir un badge indiquant le nombre de notifications non lues, afin de savoir rapidement si j'ai des notifications à consulter.

#### Acceptance Criteria

1. WHEN l'application démarre, THE NotificationService SHALL récupérer le compteur via GET /api/notifications/count-non-lues
2. WHEN le compteur est supérieur à zéro, THE NotificationBadge SHALL afficher le nombre de notifications non lues
3. WHEN le compteur est zéro, THE NotificationBadge SHALL être masqué
4. WHEN le compteur dépasse 99, THE NotificationBadge SHALL afficher "99+"
5. WHEN une notification est marquée comme lue, THE NotificationBadge SHALL mettre à jour le compteur automatiquement

### Requirement 3: Marquage des Notifications Comme Lues

**User Story:** En tant qu'utilisateur, je veux pouvoir marquer mes notifications comme lues, afin de suivre celles que j'ai déjà consultées.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur une notification non lue, THE NotificationService SHALL envoyer PUT /api/notifications/{id}/lire
2. WHEN le marquage réussit, THE NotificationItem SHALL mettre à jour son apparence visuelle (style lu)
3. WHEN l'utilisateur clique sur "Tout marquer comme lu", THE NotificationService SHALL envoyer PUT /api/notifications/lire-toutes
4. WHEN le marquage global réussit, THE NotificationCenter SHALL mettre à jour toutes les notifications et le badge
5. IF le marquage échoue, THEN THE NotificationCenter SHALL afficher un message d'erreur

### Requirement 4: Marquage des Notifications Comme Non Lues

**User Story:** En tant qu'utilisateur, je veux pouvoir marquer une notification comme non lue, afin de la retrouver facilement plus tard.

#### Acceptance Criteria

1. WHEN l'utilisateur sélectionne "Marquer comme non lu" sur une notification lue, THE NotificationService SHALL envoyer PUT /api/notifications/{id}/unread
2. WHEN le marquage réussit, THE NotificationItem SHALL mettre à jour son apparence visuelle (style non lu)
3. WHEN le marquage réussit, THE NotificationBadge SHALL incrémenter le compteur
4. IF le marquage échoue, THEN THE NotificationCenter SHALL afficher un message d'erreur

### Requirement 5: Historique des Notifications

**User Story:** En tant qu'utilisateur, je veux consulter l'historique de mes notifications avec des filtres, afin de retrouver des informations passées.

#### Acceptance Criteria

1. WHEN l'utilisateur accède à l'historique, THE NotificationService SHALL récupérer les données via GET /api/notifications/history
2. THE NotificationCenter SHALL permettre de filtrer par type de notification
3. THE NotificationCenter SHALL permettre de filtrer par période (date début/fin)
4. THE NotificationCenter SHALL permettre de filtrer par statut (lu/non lu)
5. WHEN les filtres changent, THE NotificationCenter SHALL recharger les notifications correspondantes

### Requirement 6: Notifications Temps Réel (WebSocket)

**User Story:** En tant qu'utilisateur, je veux recevoir mes notifications en temps réel sans rafraîchir la page, afin d'être informé immédiatement des nouveaux événements.

#### Acceptance Criteria

1. WHEN l'utilisateur se connecte, THE WebSocketService SHALL établir une connexion WebSocket avec le serveur
2. WHEN une nouvelle notification arrive via WebSocket, THE NotificationCenter SHALL l'ajouter en haut de la liste
3. WHEN une nouvelle notification arrive, THE NotificationBadge SHALL incrémenter le compteur
4. WHEN une nouvelle notification arrive, THE NotificationCenter SHALL afficher une notification toast temporaire
5. IF la connexion WebSocket est perdue, THEN THE WebSocketService SHALL tenter une reconnexion automatique

### Requirement 7: Statistiques des Notifications

**User Story:** En tant qu'utilisateur, je veux voir des statistiques sur mes notifications, afin de comprendre mon activité dans l'application.

#### Acceptance Criteria

1. WHEN l'utilisateur accède aux statistiques, THE NotificationService SHALL récupérer les données via GET /api/notifications/stats
2. THE NotificationCenter SHALL afficher le nombre total de notifications
3. THE NotificationCenter SHALL afficher la répartition par type de notification
4. THE NotificationCenter SHALL afficher le taux de lecture des notifications
5. THE NotificationCenter SHALL présenter les statistiques de manière visuelle (graphiques)

### Requirement 8: Export RGPD des Notifications

**User Story:** En tant qu'utilisateur, je veux pouvoir exporter mes données de notifications, afin de respecter mes droits RGPD.

#### Acceptance Criteria

1. WHEN l'utilisateur demande un export, THE NotificationService SHALL appeler GET /api/notifications/export
2. WHEN l'export est prêt, THE NotificationCenter SHALL télécharger le fichier automatiquement
3. THE NotificationCenter SHALL afficher un indicateur de progression pendant l'export
4. IF l'export échoue, THEN THE NotificationCenter SHALL afficher un message d'erreur

### Requirement 9: Interface Utilisateur Responsive

**User Story:** En tant qu'utilisateur sur différents appareils, je veux une interface de notifications adaptée à ma taille d'écran.

#### Acceptance Criteria

1. THE NotificationCenter SHALL s'adapter aux écrans mobiles, tablettes et desktop
2. WHEN l'écran est petit, THE NotificationCenter SHALL utiliser un panneau plein écran
3. WHEN l'écran est large, THE NotificationCenter SHALL utiliser un dropdown ou panneau latéral
4. THE NotificationCenter SHALL utiliser des composants PrimeNG pour la cohérence avec l'application existante
5. THE NotificationCenter SHALL respecter le thème de l'application existante

### Requirement 10: Gestion des Erreurs et Résilience

**User Story:** En tant qu'utilisateur, je veux que le système gère les erreurs gracieusement, afin de ne pas perdre mes actions.

#### Acceptance Criteria

1. WHEN l'API retourne une erreur 401, THE NotificationService SHALL rediriger vers la page de connexion
2. WHEN l'API retourne une erreur 500, THE NotificationCenter SHALL afficher un message d'erreur générique
3. WHEN une erreur réseau se produit, THE NotificationCenter SHALL afficher un message de problème de connexion
4. THE NotificationService SHALL implémenter un retry automatique pour les erreurs réseau (max 3 tentatives)
5. THE NotificationService SHALL utiliser les intercepteurs HTTP existants pour l'authentification JWT

### Requirement 11: Création de Notifications de Test

**User Story:** En tant que développeur ou administrateur, je veux pouvoir créer des notifications de test, afin de vérifier le bon fonctionnement du système de notifications.

#### Acceptance Criteria

1. WHEN un utilisateur autorisé demande une notification de test, THE NotificationService SHALL envoyer POST /api/notifications/test
2. WHEN la notification de test est créée, THE NotificationCenter SHALL l'afficher immédiatement dans la liste
3. WHEN la notification de test est créée, THE NotificationBadge SHALL mettre à jour le compteur

### Requirement 12: Création Manuelle de Notifications

**User Story:** En tant qu'administrateur, je veux pouvoir créer des notifications personnalisées, afin d'envoyer des messages ciblés aux utilisateurs.

#### Acceptance Criteria

1. WHEN un administrateur crée une notification manuelle, THE NotificationService SHALL envoyer POST /api/notifications/creer avec les données de la notification
2. THE NotificationService SHALL permettre de spécifier le type, titre, message et données additionnelles
3. WHEN la création réussit, THE NotificationCenter SHALL confirmer la création avec un message de succès
4. IF la création échoue, THEN THE NotificationCenter SHALL afficher un message d'erreur descriptif

### Requirement 13: Notification de Bienvenue Automatique

**User Story:** En tant que nouvel utilisateur, je veux recevoir une notification de bienvenue, afin de comprendre que le système de notifications fonctionne.

#### Acceptance Criteria

1. WHEN un utilisateur n'a aucune notification, THE Backend_API SHALL créer automatiquement une notification de bienvenue
2. WHEN la notification de bienvenue est créée, THE NotificationCenter SHALL l'afficher lors du premier chargement
3. THE NotificationCenter SHALL traiter la notification de bienvenue comme une notification normale (marquage lu/non-lu)

### Requirement 14: Synchronisation des Préférences de Notifications

**User Story:** En tant qu'utilisateur, je veux que mes préférences de notifications soient synchronisées, afin que mes paramètres soient cohérents dans toute l'application.

#### Acceptance Criteria

1. WHEN l'utilisateur met à jour ses préférences via PUT /api/notifications/preferences, THE Backend_API SHALL synchroniser avec la table preferences_notifications
2. WHEN les préférences sont synchronisées, THE NotificationSchedulerService SHALL utiliser les préférences mises à jour pour les notifications programmées
3. THE NotificationService SHALL récupérer les préférences via GET /api/notifications/preferences
4. THE NotificationCenter SHALL afficher les préférences actuelles de l'utilisateur
