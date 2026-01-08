# Design Document: Messaging UI Redesign

## Overview

Cette refonte de l'interface de messagerie transforme l'expérience utilisateur en créant un design moderne, immersif et visuellement impressionnant. Le design utilise des techniques modernes comme le glassmorphism, des dégradés subtils, et des micro-animations pour créer une interface "wow" tout en restant cohérente avec le thème fitness de l'application.

### Design Philosophy

- **Glassmorphism**: Effets de verre dépoli avec transparence et flou
- **Gradient-first**: Utilisation extensive des dégradés avec les couleurs du thème
- **Motion Design**: Animations fluides et micro-interactions
- **Immersive**: Arrière-plans dynamiques et effets visuels subtils

### Color Palette

```css
/* Primary Theme Colors */
--primary: #84cabe;
--primary-light: #a8ddd3;
--primary-dark: #6bb5a7;
--primary-gradient: linear-gradient(135deg, #84cabe 0%, #a8ddd3 100%);

/* Glass Effects */
--glass-bg: rgba(255, 255, 255, 0.7);
--glass-border: rgba(255, 255, 255, 0.3);
--glass-shadow: 0 8px 32px rgba(132, 202, 190, 0.15);

/* Message Colors */
--own-message-gradient: linear-gradient(135deg, #84cabe 0%, #6bb5a7 100%);
--other-message-bg: rgba(255, 255, 255, 0.9);

/* Status Colors */
--online-color: #10b981;
--unread-color: #ef4444;
--typing-color: #84cabe;
```

## Architecture

### Component Structure

```
messaging-container/
├── messaging-container.component.ts    # Main container with state management
├── messaging-container.component.html  # Template with new structure
├── messaging-container.component.css   # Complete redesigned styles
│
├── conversation-list/                  # Enhanced conversation list
│   ├── conversation-card/              # Individual conversation card
│   └── search-bar/                     # Animated search component
│
├── chat-window/                        # Immersive chat window
│   ├── chat-header/                    # Glassmorphism header
│   ├── messages-area/                  # Message display with parallax
│   └── message-input/                  # Premium input area
│
├── message-bubble/                     # Redesigned message bubbles
│   ├── own-message/                    # Gradient own messages
│   └── other-message/                  # Glass other messages
│
└── shared/
    ├── typing-indicator/               # Animated typing dots
    ├── avatar/                         # Animated avatar component
    └── skeleton-loader/                # Loading skeletons
```

### State Management

Le composant utilise RxJS BehaviorSubjects pour gérer l'état de manière réactive:

```typescript
interface MessagingState {
  conversations: ConversationDTO[];
  messages: MessageDTO[];
  selectedConversationId: string | null;
  loading: boolean;
  error: string | null;
  animationState: 'idle' | 'entering' | 'leaving';
}
```

## Components and Interfaces

### 1. Main Container Component

Le conteneur principal orchestre tous les sous-composants et gère les animations de transition.

```typescript
interface AnimationConfig {
  duration: number;      // 300-400ms
  easing: string;        // 'cubic-bezier(0.4, 0, 0.2, 1)'
  delay?: number;
}

interface ViewTransition {
  from: 'list' | 'chat';
  to: 'list' | 'chat';
  animation: AnimationConfig;
}
```

### 2. Conversation Card Component

Carte de conversation avec effets de survol et animations.

```typescript
interface ConversationCardProps {
  conversation: ConversationDTO;
  isSelected: boolean;
  isOnline: boolean;
  unreadCount: number;
  onSelect: (id: string) => void;
}
```

### 3. Message Bubble Component

Bulles de messages avec design asymétrique et animations.

```typescript
interface MessageBubbleProps {
  message: MessageDTO;
  isOwnMessage: boolean;
  showAvatar: boolean;
  animationDelay: number;
  onRetry?: () => void;
}

interface MessageAnimationState {
  entering: boolean;
  visible: boolean;
  leaving: boolean;
}
```

### 4. Avatar Component

Avatar avec bordure dégradée animée pour les utilisateurs en ligne.

```typescript
interface AvatarProps {
  name: string;
  imageUrl?: string;
  isOnline: boolean;
  size: 'sm' | 'md' | 'lg';
  showBorder: boolean;
}
```

### 5. Typing Indicator Component

Indicateur de frappe avec animation de rebond.

```typescript
interface TypingIndicatorProps {
  isVisible: boolean;
  userName?: string;
}
```

## Data Models

### Enhanced ConversationDTO

```typescript
interface EnhancedConversationDTO extends ConversationDTO {
  isOnline?: boolean;
  lastSeenAt?: Date;
  avatarUrl?: string;
  animationState?: 'entering' | 'visible' | 'leaving';
}
```

### Enhanced MessageDTO

```typescript
interface EnhancedMessageDTO extends MessageDTO {
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  animationDelay?: number;
  retryCount?: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Unread Count Display Consistency

*For any* conversation with unread messages (messagesNonLus > 0), the conversation card SHALL display a visible unread indicator badge.

**Validates: Requirements 2.4**

### Property 2: Message Timestamp Display

*For any* message displayed in the chat window, the message bubble SHALL include a formatted timestamp that is visible to the user.

**Validates: Requirements 4.5**

### Property 3: Own Message Status Indicator

*For any* message sent by the current user, the message bubble SHALL display a status indicator (sending, sent, delivered, or read icon).

**Validates: Requirements 4.6**

### Property 4: WCAG Color Contrast Compliance

*For any* text element in the messaging interface, the color contrast ratio between text and background SHALL meet WCAG AA standards (minimum 4.5:1 for normal text, 3:1 for large text).

**Validates: Requirements 8.2**

### Property 5: Touch Target Size Compliance

*For any* interactive element (buttons, conversation cards, input fields) in the messaging interface, the touch target size SHALL be at least 44x44 pixels.

**Validates: Requirements 8.4**

## Error Handling

### Message Send Failure

```typescript
interface MessageErrorState {
  messageId: number;
  error: string;
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
}

// Error handling flow:
// 1. Display error state on message bubble
// 2. Show retry button with animation
// 3. Allow up to 3 retry attempts
// 4. After max retries, show permanent error state
```

### Connection Error

```typescript
interface ConnectionErrorState {
  isConnected: boolean;
  lastConnectedAt: Date;
  reconnectAttempts: number;
  showReconnectBanner: boolean;
}

// Display reconnection banner with animated progress
// Auto-retry connection with exponential backoff
```

### Loading States

```typescript
interface LoadingState {
  conversations: boolean;
  messages: boolean;
  sending: boolean;
}

// Show skeleton loaders during loading
// Animate skeleton with shimmer effect
```

## Testing Strategy

### Unit Tests

Les tests unitaires vérifient les comportements spécifiques des composants:

- Affichage correct des conversations avec messages non lus
- Formatage correct des timestamps
- Affichage des indicateurs de statut
- Gestion des états d'erreur
- Comportement responsive

### Property-Based Tests

Les tests basés sur les propriétés utilisent **fast-check** pour TypeScript/Angular:

```typescript
import * as fc from 'fast-check';

// Configuration: minimum 100 iterations per property test
// Tag format: Feature: messaging-ui-redesign, Property N: description
```

**Property Tests to Implement:**

1. **Unread Count Display**: Pour toute conversation générée avec messagesNonLus > 0, vérifier que l'indicateur est affiché
2. **Timestamp Display**: Pour tout message généré, vérifier que le timestamp est formaté et affiché
3. **Status Indicator**: Pour tout message envoyé par l'utilisateur courant, vérifier que l'indicateur de statut est présent
4. **Color Contrast**: Pour toute combinaison de couleurs utilisée, vérifier le ratio de contraste
5. **Touch Target Size**: Pour tout élément interactif, vérifier les dimensions minimales

### Visual Regression Tests

Tests visuels pour les animations et effets:

- Capture d'écran des états clés
- Comparaison des animations
- Vérification des effets glassmorphism

### Accessibility Tests

- Tests de contraste automatisés
- Vérification des attributs ARIA
- Tests de navigation au clavier
