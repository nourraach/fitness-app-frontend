# Requirements Document - Messaging Backend Integration

## Introduction

Cette spécification définit l'intégration complète du système de messagerie frontend Angular avec le backend Spring Boot. L'objectif est de permettre aux utilisateurs de communiquer en temps réel avec leurs coachs et nutritionnistes via une messagerie intégrée, avec support WebSocket (SockJS/STOMP), notifications et historique des conversations.

## Glossary

- **System**: Le système de messagerie frontend Angular
- **User**: Un utilisateur connecté (client, coach ou nutritionniste)
- **Message**: Un message texte, image ou fichier envoyé entre deux utilisateurs
- **Conversation**: Un fil de discussion entre deux utilisateurs
- **WebSocket_Service**: Le service gérant la connexion temps réel via SockJS/STOMP
- **Message_Service**: Le service HTTP gérant les appels REST API
- **Typing_Indicator**: L'indicateur visuel montrant qu'un utilisateur est en train d'écrire
- **Backend_API**: L'API REST disponible sur `http://localhost:8099/api`
- **STOMP_Client**: Le client STOMP utilisé pour la communication WebSocket

## Requirements

### Requirement 1: Configuration API et WebSocket

**User Story:** En tant que développeur, je veux configurer correctement les services pour communiquer avec le backend, afin que la messagerie fonctionne avec les bons endpoints.

#### Acceptance Criteria

1. THE System SHALL use `http://localhost:8099/api` as the base URL for REST API calls
2. THE System SHALL use `http://localhost:8099/ws/messaging` as the WebSocket endpoint with SockJS
3. THE System SHALL include the JWT token in the `Authorization` header for all REST requests
4. THE System SHALL include the JWT token in the `connectHeaders` for WebSocket connections
5. WHEN the backend is unavailable, THE System SHALL fallback to mock mode gracefully

### Requirement 2: Envoi de Messages

**User Story:** En tant qu'utilisateur, je veux envoyer des messages à mon coach ou nutritionniste, afin de communiquer mes questions et préoccupations.

#### Acceptance Criteria

1. WHEN a user sends a message, THE System SHALL POST to `/api/messages?userId={userId}` with `destinataireId`, `contenu`, and `type`
2. WHEN WebSocket is connected, THE System SHALL send messages via `/app/message.send` destination
3. THE System SHALL support message types: TEXT, IMAGE, FILE
4. WHEN a message is sent successfully, THE System SHALL update the conversation list immediately
5. IF the message fails to send, THEN THE System SHALL queue the message for retry and show an error indicator
6. THE System SHALL validate message content length (max 2000 characters) before sending

### Requirement 3: Récupération des Conversations

**User Story:** En tant qu'utilisateur, je veux voir la liste de mes conversations, afin de choisir avec qui communiquer.

#### Acceptance Criteria

1. WHEN the messaging page loads, THE System SHALL GET `/api/messages/conversations?userId={userId}`
2. THE System SHALL display conversations sorted by `lastMessageAt` (most recent first)
3. THE System SHALL show `userName`, `lastMessageContent`, and `unreadMessageCount` for each conversation
4. WHEN a conversation has unread messages, THE System SHALL display a badge with the count
5. THE System SHALL refresh the conversation list when a new message is received

### Requirement 4: Historique des Messages

**User Story:** En tant qu'utilisateur, je veux voir l'historique de mes messages avec un contact, afin de suivre nos échanges.

#### Acceptance Criteria

1. WHEN a user selects a conversation, THE System SHALL GET `/api/messages/conversation?userId={userId}&autreUserId={coachId}`
2. THE System SHALL support pagination via `/api/messages/conversation/paginated?userId={userId}&autreUserId={coachId}&page=0&size=20`
3. THE System SHALL display messages with `senderName`, `content`, `timestamp`, and read status
4. WHEN scrolling up, THE System SHALL load older messages automatically (infinite scroll)
5. THE System SHALL scroll to the most recent message when opening a conversation

### Requirement 5: Marquage des Messages Lus

**User Story:** En tant qu'utilisateur, je veux que mes messages soient marqués comme lus automatiquement, afin que mon interlocuteur sache que j'ai vu ses messages.

#### Acceptance Criteria

1. WHEN a user opens a conversation, THE System SHALL PUT `/api/messages/conversation/{conversationId}/lire?userId={userId}`
2. WHEN WebSocket is connected, THE System SHALL send read receipts via `/app/message.read`
3. THE System SHALL update the unread count in the conversation list after marking as read
4. THE System SHALL display visual indicators for read/unread messages (checkmarks)

### Requirement 6: Connexion WebSocket Temps Réel

**User Story:** En tant qu'utilisateur, je veux recevoir les messages en temps réel, afin de ne pas avoir à rafraîchir la page.

#### Acceptance Criteria

1. WHEN the user is authenticated, THE System SHALL connect to WebSocket via SockJS at `http://localhost:8099/ws/messaging`
2. THE System SHALL subscribe to `/user/{userId}/queue/messages` for incoming messages
3. THE System SHALL subscribe to `/user/{userId}/queue/message-sent` for send confirmations
4. THE System SHALL subscribe to `/user/{userId}/queue/message-read` for read receipts
5. THE System SHALL subscribe to `/user/{userId}/queue/typing` for typing indicators
6. WHEN the WebSocket disconnects, THE System SHALL attempt automatic reconnection with exponential backoff
7. THE System SHALL display connection status indicator (connected/disconnected/reconnecting)

### Requirement 7: Indicateurs de Frappe

**User Story:** En tant qu'utilisateur, je veux voir quand mon interlocuteur est en train d'écrire, afin de savoir qu'une réponse arrive.

#### Acceptance Criteria

1. WHEN a user starts typing, THE System SHALL send typing indicator via `/app/typing` with `destinataireId` and `typing: true`
2. WHEN a user stops typing for 2 seconds, THE System SHALL send `/app/typing` with `typing: false`
3. WHEN receiving a typing indicator, THE System SHALL display "En train d'écrire..." under the contact name
4. THE System SHALL automatically hide the typing indicator after 3 seconds without update

### Requirement 8: Compteur de Messages Non Lus

**User Story:** En tant qu'utilisateur, je veux voir le nombre total de messages non lus, afin de savoir si j'ai des messages en attente.

#### Acceptance Criteria

1. THE System SHALL GET `/api/messages/non-lus/count?userId={userId}` to display total unread count
2. THE System SHALL display the unread count as a badge on the messaging icon in the navbar
3. WHEN a new message is received, THE System SHALL increment the unread count
4. WHEN messages are marked as read, THE System SHALL decrement the unread count
5. THE System SHALL update the count in real-time via WebSocket notifications

### Requirement 9: Recherche dans les Messages

**User Story:** En tant qu'utilisateur, je veux rechercher dans mes messages, afin de retrouver une information spécifique.

#### Acceptance Criteria

1. WHEN a user enters a search query, THE System SHALL GET `/api/messages/search?userId={userId}&keyword={mot}`
2. THE System SHALL display search results with message content, sender name, and timestamp
3. WHEN a user clicks on a search result, THE System SHALL navigate to that message in the conversation
4. THE System SHALL highlight the search term in the results
5. IF no results are found, THEN THE System SHALL display an appropriate message

### Requirement 10: Gestion des Erreurs et Mode Hors Ligne

**User Story:** En tant qu'utilisateur, je veux que l'application gère les erreurs gracieusement, afin de ne pas perdre mes messages.

#### Acceptance Criteria

1. WHEN the network is unavailable, THE System SHALL queue messages locally for later sending
2. WHEN the network is restored, THE System SHALL automatically send queued messages
3. IF a message fails after 3 retries, THEN THE System SHALL mark it as failed and allow manual retry
4. THE System SHALL display clear error messages in French for all error scenarios
5. WHEN in offline mode, THE System SHALL allow reading cached conversations
