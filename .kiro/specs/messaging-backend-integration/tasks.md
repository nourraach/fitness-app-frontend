# Implementation Plan: Messaging Backend Integration

## Overview

Ce plan d'implémentation détaille les tâches pour intégrer le système de messagerie Angular avec le backend Spring Boot. L'implémentation suit une approche incrémentale, en commençant par la configuration des services, puis les fonctionnalités de base, et enfin les fonctionnalités avancées.

## Tasks

- [x] 1. Mettre à jour les modèles de données
  - [x] 1.1 Aligner les interfaces Message et Conversation avec le backend
    - Mettre à jour `src/app/models/message.model.ts` avec les DTOs du guide d'intégration
    - Ajouter les interfaces `SendMessageRequest`, `TypingIndicator`, `ReadReceipt`, `PagedResponse`
    - Assurer la compatibilité avec les noms de champs backend (senderId, receiverId, content, timestamp, isRead)
    - _Requirements: 2.1, 2.3, 3.3, 4.3_

- [x] 2. Configurer le MessageService pour l'API REST
  - [x] 2.1 Créer/Mettre à jour le service HTTP pour la messagerie
    - Créer `src/app/services/message-api.service.ts`
    - Configurer la base URL `http://localhost:8099/api`
    - Implémenter les méthodes: `getConversations`, `getConversationHistory`, `sendMessage`
    - Ajouter l'intercepteur pour le header Authorization avec JWT
    - _Requirements: 1.1, 1.3, 2.1, 3.1, 4.1_

  - [ ]* 2.2 Écrire le test de propriété pour l'inclusion du JWT
    - **Property 1: JWT Token Inclusion in HTTP Requests**
    - **Validates: Requirements 1.3**

  - [x] 2.3 Implémenter les méthodes de marquage comme lu
    - Ajouter `markMessageAsRead(messageId, userId)` - PUT `/api/messages/{messageId}/lire`
    - Ajouter `markConversationAsRead(conversationId, userId)` - PUT `/api/messages/conversation/{conversationId}/lire`
    - _Requirements: 5.1_

  - [x] 2.4 Implémenter les méthodes pour les messages non lus
    - Ajouter `getUnreadCount(userId)` - GET `/api/messages/non-lus/count`
    - Ajouter `getUnreadMessages(userId)` - GET `/api/messages/non-lus`
    - _Requirements: 8.1_

  - [x] 2.5 Implémenter la recherche de messages
    - Ajouter `searchMessages(userId, keyword)` - GET `/api/messages/search`
    - _Requirements: 9.1_

  - [x] 2.6 Implémenter la pagination pour l'historique
    - Ajouter `getConversationHistoryPaginated(userId, otherUserId, page, size)`
    - GET `/api/messages/conversation/paginated`
    - _Requirements: 4.2_

  - [ ]* 2.7 Écrire le test de propriété pour la validation des messages
    - **Property 2: Message Validation**
    - **Validates: Requirements 2.6**

- [x] 3. Checkpoint - Vérifier les services REST
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Configurer le WebSocketService avec SockJS/STOMP
  - [x] 4.1 Mettre à jour le WebSocketService pour utiliser SockJS et STOMP
    - Installer les dépendances: `@stomp/stompjs`, `sockjs-client`
    - Configurer l'URL WebSocket `http://localhost:8099/ws/messaging`
    - Implémenter la connexion avec token JWT dans connectHeaders
    - _Requirements: 1.2, 1.4, 6.1_

  - [x] 4.2 Implémenter les subscriptions STOMP
    - Subscribe à `/user/{userId}/queue/messages` pour les messages entrants
    - Subscribe à `/user/{userId}/queue/message-sent` pour les confirmations
    - Subscribe à `/user/{userId}/queue/message-read` pour les accusés de lecture
    - Subscribe à `/user/{userId}/queue/typing` pour les indicateurs de frappe
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

  - [x] 4.3 Implémenter les méthodes de publication STOMP
    - `sendMessage()` vers `/app/message.send`
    - `markAsRead()` vers `/app/message.read`
    - `sendTypingIndicator()` vers `/app/typing`
    - _Requirements: 2.2, 5.2, 7.1_

  - [x] 4.4 Implémenter la reconnexion avec exponential backoff
    - Délais: 1s, 2s, 4s, 8s, 16s, max 30s
    - Maximum 10 tentatives
    - Réinitialiser le compteur après connexion réussie
    - _Requirements: 6.6_

  - [ ]* 4.5 Écrire le test de propriété pour l'exponential backoff
    - **Property 7: Exponential Backoff Reconnection**
    - **Validates: Requirements 6.6**

  - [x] 4.6 Implémenter l'indicateur de statut de connexion
    - Observable `connectionStatus$` avec états: connected, disconnected, connecting, reconnecting
    - _Requirements: 6.7_

- [x] 5. Checkpoint - Vérifier la connexion WebSocket
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implémenter la gestion des indicateurs de frappe
  - [x] 6.1 Implémenter le debounce pour l'envoi des indicateurs
    - Envoyer `typing: true` au premier keystroke
    - Envoyer `typing: false` après 2 secondes sans frappe
    - _Requirements: 7.1, 7.2_

  - [x] 6.2 Implémenter l'affichage des indicateurs reçus
    - Afficher "En train d'écrire..." sous le nom du contact
    - Auto-masquer après 3 secondes sans mise à jour
    - _Requirements: 7.3, 7.4_

  - [ ]* 6.3 Écrire le test de propriété pour le timing des indicateurs
    - **Property 8: Typing Indicator Debounce**
    - **Validates: Requirements 7.2, 7.4**

- [-] 7. Implémenter la file d'attente de messages hors ligne
  - [x] 7.1 Créer le service de queue de messages
    - Stocker les messages en attente dans localStorage
    - Limiter la taille de la queue (max 100 messages)
    - _Requirements: 10.1_

  - [x] 7.2 Implémenter l'envoi automatique à la reconnexion
    - Traiter la queue en FIFO à la reconnexion
    - Mettre à jour le statut des messages (sending → sent/failed)
    - _Requirements: 10.2_

  - [x] 7.3 Implémenter la limite de retry
    - Maximum 3 tentatives par message
    - Marquer comme 'failed' après 3 échecs
    - Permettre le retry manuel
    - _Requirements: 10.3_

  - [ ]* 7.4 Écrire le test de propriété pour la queue de messages
    - **Property 4: Message Queue Persistence**
    - **Validates: Requirements 2.5, 10.1, 10.2**

  - [ ]* 7.5 Écrire le test de propriété pour la limite de retry
    - **Property 5: Retry Limit Enforcement**
    - **Validates: Requirements 10.3**

- [x] 8. Checkpoint - Vérifier la gestion hors ligne
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Mettre à jour le MessagingContainerComponent
  - [x] 9.1 Intégrer le nouveau MessageService
    - Remplacer les appels mock par les vrais appels API
    - Charger les conversations au démarrage
    - Afficher le statut de connexion
    - _Requirements: 3.1, 6.7_

  - [x] 9.2 Implémenter le tri des conversations
    - Trier par `lastMessageAt` décroissant
    - Mettre à jour l'ordre après réception d'un nouveau message
    - _Requirements: 3.2_

  - [ ]* 9.3 Écrire le test de propriété pour le tri des conversations
    - **Property 3: Conversation Sorting**
    - **Validates: Requirements 3.2**

  - [x] 9.4 Implémenter l'affichage des badges de messages non lus
    - Afficher le badge si `unreadMessageCount > 0`
    - Mettre à jour en temps réel via WebSocket
    - _Requirements: 3.4, 8.2_

  - [x] 9.5 Implémenter la mise à jour du compteur non lu
    - Incrémenter à la réception d'un message
    - Décrémenter au marquage comme lu
    - _Requirements: 8.3, 8.4_

  - [ ]* 9.6 Écrire le test de propriété pour la cohérence du compteur
    - **Property 6: Unread Count Consistency**
    - **Validates: Requirements 3.4, 5.3, 8.3, 8.4**

- [ ] 10. Implémenter la fonctionnalité de recherche
  - [x] 10.1 Ajouter l'interface de recherche
    - Champ de recherche dans l'en-tête de la messagerie
    - Afficher les résultats avec contenu, expéditeur, date
    - _Requirements: 9.1, 9.2_

  - [x] 10.2 Implémenter le highlighting des résultats
    - Mettre en surbrillance le terme recherché dans les résultats
    - _Requirements: 9.4_

  - [ ]* 10.3 Écrire le test de propriété pour le highlighting
    - **Property 9: Search Result Highlighting**
    - **Validates: Requirements 9.4**

  - [x] 10.4 Gérer l'état vide de recherche
    - Afficher "Aucun résultat trouvé" si pas de résultats
    - _Requirements: 9.5_

- [-] 11. Implémenter la gestion des erreurs
  - [x] 11.1 Créer le service de gestion d'erreurs messagerie
    - Mapper les codes HTTP aux messages français
    - Gérer les erreurs WebSocket
    - _Requirements: 10.4_

  - [ ]* 11.2 Écrire le test de propriété pour la localisation des erreurs
    - **Property 10: Error Message Localization**
    - **Validates: Requirements 10.4**

  - [x] 11.3 Implémenter le fallback en mode mock
    - Détecter l'indisponibilité du backend
    - Basculer vers les données mock
    - Afficher un indicateur "Mode démonstration"
    - _Requirements: 1.5_

- [x] 12. Checkpoint final - Vérifier l'intégration complète
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Les tâches marquées avec `*` sont optionnelles (tests de propriété)
- Chaque tâche référence les requirements spécifiques pour la traçabilité
- Les checkpoints permettent de valider l'avancement incrémental
- L'implémentation utilise TypeScript avec Angular 19
- Les tests de propriété utilisent la bibliothèque fast-check
