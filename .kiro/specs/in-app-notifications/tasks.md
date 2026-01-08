# Implementation Plan: In-App Notifications

## Overview

Ce plan d'implémentation détaille l'intégration frontend du système de notifications in-app avec le backend Spring Boot. L'approche suit une progression logique : modèles → services → composants → intégration → tests.

## Tasks

- [x] 1. Créer les modèles et interfaces TypeScript
  - Définir l'interface Notification avec tous les champs
  - Créer l'enum NotificationType
  - Définir NotificationFilters, NotificationStats, NotificationHistory
  - Ajouter les interfaces de réponse API
  - _Requirements: 1.2, 5.2, 7.2_

- [x] 2. Implémenter le service de communication API
  - [x] 2.1 Créer InAppNotificationService avec les méthodes de base
    - Implémenter getNotifications() et getUnreadNotifications()
    - Implémenter getUnreadCount()
    - Configurer les endpoints selon l'API backend
    - _Requirements: 1.1, 2.1_

  - [x] 2.2 Implémenter les méthodes de marquage lu/non-lu
    - Implémenter markAsRead(id)
    - Implémenter markAsUnread(id)
    - Implémenter markAllAsRead()
    - _Requirements: 3.1, 3.3, 4.1_

  - [x] 2.3 Implémenter les méthodes historique, stats et export
    - Implémenter getHistory(filters) avec pagination
    - Implémenter getStats()
    - Implémenter exportNotifications() avec téléchargement blob
    - _Requirements: 5.1, 7.1, 8.1_

  - [ ]* 2.4 Écrire le test de propriété pour la communication API
    - **Property 1: API Communication Correctness**
    - **Validates: Requirements 1.1, 3.1, 4.1**

- [x] 3. Implémenter le service de gestion d'état
  - [x] 3.1 Créer NotificationStateService
    - Configurer les BehaviorSubjects (notifications$, unreadCount$, loading$, error$)
    - Implémenter les méthodes de mise à jour d'état
    - Gérer la synchronisation du compteur
    - _Requirements: 2.5, 3.4, 4.3_

  - [ ]* 3.2 Écrire le test de propriété pour la synchronisation du badge
    - **Property 5: Badge Count Synchronization**
    - **Validates: Requirements 2.5, 3.4, 4.3, 6.3**

- [x] 4. Étendre le WebsocketService pour les notifications
  - [x] 4.1 Ajouter le support des notifications temps réel
    - Créer notificationSubject$ pour les nouvelles notifications
    - Gérer le type de message 'notification' dans onmessage
    - Intégrer avec NotificationStateService
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 4.2 Écrire le test de propriété pour les mises à jour temps réel
    - **Property 8: Real-time Update Integration**
    - **Validates: Requirements 6.2, 6.4**

- [x] 5. Checkpoint - Vérifier les services
  - Tester les appels API avec le backend
  - Vérifier la connexion WebSocket
  - S'assurer que tous les tests passent, demander à l'utilisateur si des questions se posent.

- [x] 6. Créer le composant NotificationBadgeComponent
  - [x] 6.1 Implémenter le badge avec compteur
    - Créer le template avec p-badge PrimeNG
    - Gérer l'affichage "99+" pour compteur > 99
    - Masquer le badge si compteur = 0
    - Ajouter animation pulse pour nouvelles notifications
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ]* 6.2 Écrire le test de propriété pour la logique d'affichage du badge
    - **Property 4: Badge Display Logic**
    - **Validates: Requirements 2.2, 2.4**

- [x] 7. Créer le composant NotificationItemComponent
  - [x] 7.1 Implémenter l'affichage d'une notification
    - Créer le template avec icône, titre, message, date
    - Implémenter le style différencié lu/non-lu
    - Ajouter le menu contextuel (marquer lu/non-lu)
    - Formater la date en relatif (il y a X minutes)
    - _Requirements: 1.2, 3.2, 4.2_

  - [ ]* 7.2 Écrire le test de propriété pour le rendu des notifications
    - **Property 2: Notification Rendering Completeness**
    - **Validates: Requirements 1.2**

  - [ ]* 7.3 Écrire le test de propriété pour l'état visuel
    - **Property 6: Notification Visual State Consistency**
    - **Validates: Requirements 3.2, 4.2**

- [ ] 8. Créer le composant NotificationListComponent
  - [x] 8.1 Implémenter la liste des notifications
    - Créer le template avec liste scrollable
    - Intégrer NotificationItemComponent
    - Gérer l'état vide "Aucune notification"
    - Ajouter le bouton "Tout marquer comme lu"
    - _Requirements: 1.4, 3.3_

- [x] 9. Créer le composant NotificationCenterComponent
  - [x] 9.1 Implémenter le panneau principal
    - Créer le template avec p-sidebar PrimeNG
    - Ajouter les tabs (Toutes, Non lues, Historique, Stats)
    - Intégrer les indicateurs de chargement
    - Gérer les messages d'erreur avec retry
    - _Requirements: 1.3, 1.5, 9.2, 9.3_

  - [ ]* 9.2 Écrire le test de propriété pour l'état de chargement
    - **Property 3: Loading State Consistency**
    - **Validates: Requirements 1.3, 8.3**

- [ ] 10. Checkpoint - Vérifier les composants de base
  - Tester l'affichage des notifications
  - Vérifier le marquage lu/non-lu
  - S'assurer que tous les tests passent, demander à l'utilisateur si des questions se posent.

- [ ] 11. Créer le composant NotificationHistoryComponent
  - [ ] 11.1 Implémenter l'historique avec filtres
    - Créer les filtres (type dropdown, date range, statut)
    - Implémenter la pagination avec p-paginator
    - Ajouter le bouton export RGPD
    - Gérer le rechargement sur changement de filtres
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 8.1_

  - [ ]* 11.2 Écrire le test de propriété pour les filtres
    - **Property 7: Filter Functionality**
    - **Validates: Requirements 5.2, 5.3, 5.4, 5.5**

- [ ] 12. Créer le composant NotificationStatsComponent
  - [ ] 12.1 Implémenter les statistiques
    - Créer les KPIs (total, non lues, taux de lecture)
    - Ajouter le graphique camembert (répartition par type)
    - Ajouter le graphique barre (notifications par jour)
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

  - [ ]* 12.2 Écrire le test de propriété pour le rendu des stats
    - **Property 10: Stats Data Rendering**
    - **Validates: Requirements 7.2, 7.3, 7.4**

- [ ] 13. Implémenter les notifications toast temps réel
  - [ ] 13.1 Ajouter les toasts pour nouvelles notifications
    - Configurer p-toast PrimeNG
    - Afficher toast sur réception WebSocket
    - Permettre clic sur toast pour ouvrir le centre
    - _Requirements: 6.4_

- [x] 14. Intégrer dans la navbar existante
  - [x] 14.1 Ajouter le badge dans NavbarComponent
    - Intégrer NotificationBadgeComponent
    - Connecter au NotificationStateService
    - Ajouter le clic pour ouvrir NotificationCenterComponent
    - _Requirements: 2.1, 2.2_

  - [x] 14.2 Configurer le routing
    - Ajouter les routes si nécessaire
    - Configurer le lazy loading
    - _Requirements: 9.4_

- [ ] 15. Implémenter la gestion d'erreurs complète
  - [ ] 15.1 Ajouter la gestion d'erreurs par code de statut
    - Gérer 401 avec redirection login
    - Gérer 500 avec message générique
    - Gérer erreurs réseau avec message connexion
    - Implémenter retry automatique (max 3)
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 15.2 Écrire le test de propriété pour la gestion d'erreurs
    - **Property 11: Error Handling by Status Code**
    - **Validates: Requirements 1.5, 3.5, 4.4, 8.4, 10.1, 10.2, 10.3**

  - [ ]* 15.3 Écrire le test de propriété pour le retry
    - **Property 12: Retry Logic**
    - **Validates: Requirements 10.4**

- [ ] 16. Ajouter les styles CSS responsive
  - [ ] 16.1 Implémenter le responsive design
    - Panneau plein écran sur mobile
    - Dropdown/sidebar sur desktop
    - Adapter les filtres pour mobile
    - _Requirements: 9.1, 9.2, 9.3_

- [ ] 17. Checkpoint - Vérifier l'intégration complète
  - Tester le flux complet avec le backend
  - Vérifier les notifications temps réel
  - Tester sur différentes tailles d'écran
  - S'assurer que tous les tests passent, demander à l'utilisateur si des questions se posent.

- [ ] 18. Tests de propriétés restants
  - [ ]* 18.1 Écrire le test de propriété pour la reconnexion WebSocket
    - **Property 9: WebSocket Reconnection**
    - **Validates: Requirements 6.5**

  - [ ]* 18.2 Exécuter la suite de tests complète
    - Vérifier que tous les tests unitaires passent
    - Vérifier que tous les tests de propriété passent
    - _Requirements: All_

- [ ] 19. Checkpoint final - Validation complète
  - Tester l'application end-to-end avec le backend
  - Valider l'accessibilité
  - Vérifier les performances
  - S'assurer que tous les tests passent, demander à l'utilisateur si des questions se posent.

- [ ] 20. Implémenter les nouveaux endpoints backend
  - [ ] 20.1 Ajouter la méthode createTestNotification()
    - Implémenter POST /api/notifications/test
    - Ajouter la notification créée à la liste
    - Mettre à jour le compteur de notifications non lues
    - _Requirements: 11.1, 11.2, 11.3_

  - [ ] 20.2 Ajouter la méthode createNotification()
    - Implémenter POST /api/notifications/creer
    - Définir l'interface CreateNotificationRequest
    - Gérer les erreurs de validation
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [ ] 20.3 Ajouter les méthodes de gestion des préférences
    - Implémenter getPreferences() via GET /api/notifications/preferences
    - Implémenter updatePreferences() via PUT /api/notifications/preferences
    - Définir l'interface NotificationPreferences
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

  - [ ]* 20.4 Écrire le test de propriété pour la création de notifications
    - **Property 13: Test Notification Creation**
    - **Validates: Requirements 11.1, 11.2, 11.3**

  - [ ]* 20.5 Écrire le test de propriété pour la synchronisation des préférences
    - **Property 15: Preferences Synchronization**
    - **Validates: Requirements 14.1, 14.3**

- [ ] 21. Checkpoint - Vérifier l'intégration des nouveaux endpoints
  - Tester la création de notifications de test
  - Tester la création de notifications manuelles
  - Tester la synchronisation des préférences
  - S'assurer que tous les tests passent, demander à l'utilisateur si des questions se posent.

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être ignorées pour un MVP plus rapide
- Chaque tâche référence les exigences spécifiques pour la traçabilité
- Les checkpoints permettent une validation incrémentale
- Les tests de propriété valident les propriétés de correction universelles
- Les tests unitaires valident des exemples spécifiques et les cas limites
- L'intégration avec le WebsocketService existant minimise la duplication de code
