# Rapport des Endpoints API - Projet Fitness Frontend

## Vue d'ensemble

Ce rapport présente tous les endpoints API utilisés dans l'application Angular de fitness. L'application communique avec un backend Spring Boot hébergé sur `http://localhost:8095`.

## Base URL
```
http://localhost:8095
```

---

## 1. AUTHENTIFICATION ET AUTORISATION

### Service: PasswordService (`src/app/service/password-reset.service.ts`)
**Base URL:** `http://localhost:8095/password`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/forgot` | Demande de réinitialisation de mot de passe |
| POST | `/reset` | Réinitialisation du mot de passe avec token |

### Service: JwtService (`src/app/service/jwt.service.ts`)
**Base URL:** `http://localhost:8095`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/login` | Connexion utilisateur |
| POST | `/auth/register` | Inscription utilisateur |
| POST | `/auth/refresh` | Rafraîchissement du token JWT |

---

## 2. GESTION DES UTILISATEURS ET PROFILS

### Service: ProfileService (`src/app/service/profile.service.ts`)
**Base URL:** `http://localhost:8095/api/profile`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Récupérer le profil utilisateur |
| POST | `/` | Créer un profil utilisateur |
| PUT | `/` | Mettre à jour le profil utilisateur |
| GET | `/imc` | Calculer l'IMC |
| POST | `/besoins-caloriques` | Calculer les besoins caloriques |

### Service: AdminService (`src/app/services/admin.service.ts`)
**Base URL:** `http://localhost:8095/api/admin`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/audit-logs` | Récupérer les logs d'audit |
| GET | `/audit-logs/search` | Rechercher dans les logs d'audit |
| GET | `/audit-logs/stats` | Statistiques des logs d'audit |
| GET | `/audit-logs/entity/{entityType}/{entityId}` | Logs d'audit par entité |
| GET | `/users` | Liste des utilisateurs |
| GET | `/users/{userId}` | Détails d'un utilisateur |
| POST | `/users/{userId}/activate` | Activer un utilisateur |
| POST | `/users/{userId}/deactivate` | Désactiver un utilisateur |
| DELETE | `/users/{userId}` | Supprimer un utilisateur |
| PUT | `/users/{userId}/status` | Mettre à jour le statut utilisateur |
| POST | `/users/{userId}/reset-password` | Réinitialiser le mot de passe |
| GET | `/dashboard` | Tableau de bord admin |
| GET | `/statistics` | Statistiques système |
| GET | `/reports/activity` | Rapports d'activité |
| GET | `/alerts/recent` | Alertes récentes |
| GET | `/moderation` | File de modération |
| POST | `/moderation/{itemId}/moderate` | Modérer un élément |

---

## 3. GESTION DES CLIENTS ET COACHS

### Service: ClientService (`src/app/services/client.service.ts`)
**Base URL:** `http://localhost:8095/api/coach/clients`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Récupérer tous les clients du coach |
| GET | `/available` | Récupérer les clients disponibles |
| POST | `/assign/{clientId}` | Assigner un client au coach |
| DELETE | `/unassign/{clientId}` | Retirer un client |
| GET | `/{clientId}` | Détails d'un client |
| GET | `/enhanced` | Clients avec statistiques avancées |

### Service: CoachDashboardService (`src/app/services/coach-dashboard.service.ts`)
**Base URL:** `http://localhost:8095/api/coach/dashboard`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/overview/{coachId}` | Vue d'ensemble du tableau de bord |
| GET | `/clients/{coachId}` | Liste des clients avec filtres |
| GET | `/alerts/{coachId}` | Alertes urgentes |
| GET | `/metrics/{coachId}` | Métriques business |
| GET | `/progress/{clientId}` | Graphiques de progression |
| GET | `/recommendations/{clientId}` | Recommandations IA |

---

## 4. PROGRAMMES D'ENTRAÎNEMENT

### Service: ProgrammeService (`src/app/services/programme.service.ts`)
**Base URL:** `http://localhost:8095/api/programmes`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/` | Créer un programme |
| GET | `/coach` | Programmes du coach |
| GET | `/client` | Programmes du client |
| GET | `/{id}` | Programme par ID |
| PUT | `/{id}` | Modifier un programme |
| PATCH | `/{id}/statut` | Changer le statut |
| PUT | `/{id}/status` | Mettre à jour le statut (DTO) |
| POST | `/{programmeId}/exercices/{exerciceIndex}/complete` | Compléter un exercice |
| GET | `/{programmeId}/progress` | Progression du programme |
| GET | `/coach/{coachId}/progress` | Progression des clients du coach |
| GET | `/with-progress` | Programmes avec progression |

**Endpoints spéciaux:**
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| PUT | `http://localhost:8095/api/coach/programmes/{id}` | Mettre à jour programme (coach) |
| DELETE | `http://localhost:8095/api/coach/programmes/{id}` | Supprimer programme (coach) |

---

## 5. RAPPORTS DE PROGRESSION

### Service: RapportProgresService (`src/app/services/rapport-progres.service.ts`)
**Base URL:** `http://localhost:8095/api/rapports`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/generer` | Générer un rapport de progression |
| GET | `/semaine-courante` | Rapport de la semaine courante |
| GET | `/coach` | Rapports du coach |
| GET | `/client` | Rapports du client |
| GET | `/{id}` | Rapport par ID |
| POST | `/creer` | Créer un rapport |
| GET | `/client/{clientId}` | Rapports par client |
| GET | `/coach/{coachId}` | Rapports par coach |
| PUT | `/{id}` | Mettre à jour un rapport |
| DELETE | `/{id}` | Supprimer un rapport |
| GET | `/{id}/export` | Exporter un rapport |

---

## 6. NUTRITION

### Service: NutritionService (Legacy) (`src/app/service/nutrition.service.ts`)
**Base URL:** `http://localhost:8095/api/repas`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/aliments` | Tous les aliments |
| GET | `/aliments/rechercher` | Rechercher des aliments |
| POST | `/creer` | Créer un repas |
| GET | `/journaliers` | Totaux journaliers |
| DELETE | `/{repasId}` | Supprimer un repas |

### Service: NutritionService (Nouveau) (`src/app/services/nutrition.service.ts`)
**Base URL:** `http://localhost:8095/api/nutrition`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/plans` | Créer un plan nutritionnel |
| GET | `/plans/nutritionist/{id}` | Plans du nutritionniste |
| GET | `/plans/{planId}` | Plan par ID |
| PUT | `/plans/{planId}` | Mettre à jour un plan |
| DELETE | `/plans/{planId}` | Supprimer un plan |
| GET | `/foods/search` | Rechercher des aliments |
| GET | `/foods/categories` | Catégories d'aliments |
| GET | `/plans/{planId}/shopping-list` | Liste de courses |
| GET | `/calculate-calories/{clientId}` | Calculer besoins caloriques |
| GET | `/templates` | Modèles de plans |
| POST | `/plans/{planId}/duplicate` | Dupliquer un plan |
| GET | `/plans/{planId}/analysis` | Analyse nutritionnelle |

---

## 7. RECONNAISSANCE ALIMENTAIRE

### Service: FoodRecognitionService (`src/app/services/food-recognition.service.ts`)
**Base URL:** `http://localhost:8095/api/food-recognition`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/recognize` | Reconnaître un aliment par image |
| GET | `/suggestions` | Suggestions d'aliments |
| POST | `/manual` | Ajouter un aliment manuellement |
| GET | `/nutrition/{alimentId}` | Informations nutritionnelles |
| GET | `/health` | Vérification de santé du service |

---

## 8. ACTIVITÉS PHYSIQUES

### Service: ActiviteService (`src/app/service/activite.service.ts`)
**Base URL:** `http://localhost:8095/api/activites`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/creer` | Créer une activité |
| GET | `/journalieres` | Totaux journaliers |
| GET | `/bilan` | Bilan journalier |
| DELETE | `/{activiteId}` | Supprimer une activité |

---

## 9. SUIVI DU POIDS

### Service: SuiviPoidsService (`src/app/service/suivi-poids.service.ts`)
**Base URL:** `http://localhost:8095/api/suivi-poids`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/ajouter` | Ajouter une pesée |
| GET | `/evolution` | Évolution du poids |
| GET | `/statistiques` | Statistiques de progression |
| GET | `/historique` | Historique des pesées |
| DELETE | `/{poidsId}` | Supprimer une pesée |

---

## 10. MESSAGERIE ET COMMUNICATION

### Service: MessageService (`src/app/services/message.service.ts`)
**Base URL:** `http://localhost:8095/api`
**WebSocket URL:** `ws://localhost:8095/ws/messaging`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/conversations` | Récupérer les conversations |
| GET | `/conversations/{conversationId}/messages` | Messages d'une conversation |
| POST | `/messages` | Envoyer un message |
| PUT | `/messages/{messageId}/read` | Marquer comme lu |
| GET | `/messages/search` | Rechercher dans les messages |
| POST | `/conversations` | Créer une conversation |

### Service: RealMessageService (`src/app/services/real-message.service.ts`)
**Base URL:** `http://localhost:8095/api`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/conversations` | Récupérer les conversations |
| GET | `/conversations/{conversationId}/messages` | Messages d'une conversation |
| POST | `/messages` | Envoyer un message |
| POST | `/conversations` | Créer une conversation |
| PUT | `/conversations/{conversationId}/read` | Marquer conversation comme lue |

### Service: ConversationService (`src/app/services/conversation.service.ts`)
**Base URL:** `http://localhost:8095/api/conversations`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Toutes les conversations |
| GET | `/{id}` | Conversation par ID |
| POST | `/` | Créer une conversation |
| PUT | `/{id}` | Mettre à jour une conversation |
| DELETE | `/{id}` | Supprimer une conversation |

---

## 11. NOTIFICATIONS

### Service: NotificationService (Legacy) (`src/app/service/notification.service.ts`)
**Base URL:** `http://localhost:8095/api/notifications`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/preferences` | Préférences de notification |
| POST | `/preferences` | Sauvegarder les préférences |
| GET | `/history` | Historique des notifications |
| PUT | `/{id}/read` | Marquer comme lu |
| GET | `/unread-count` | Nombre de non lues |

### Service: NotificationService (Nouveau) (`src/app/services/notification.service.ts`)
**Base URL:** `http://localhost:8095/api/notifications`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/preferences` | Préférences de notification |
| POST | `/preferences` | Sauvegarder les préférences |
| GET | `/history` | Historique paginé |
| PUT | `/{notificationId}/read` | Marquer comme lu |
| PUT | `/{notificationId}/unread` | Marquer comme non lu |
| PUT | `/{notificationId}/feedback` | Marquer comme utile |
| GET | `/stats` | Statistiques des notifications |
| GET | `/unread-count` | Nombre de non lues |
| POST | `/test` | Envoyer notification de test |

---

## 12. RÉSEAUX SOCIAUX ET AMIS

### Service: FriendService (`src/app/services/friend.service.ts`)
**Base URL:** `http://localhost:8095/api`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/friends` | Liste des amis |
| GET | `/friends/requests` | Demandes d'amitié |
| GET | `/social/feed` | Fil social |
| GET | `/social/notifications` | Notifications sociales |
| GET | `/friends/search` | Rechercher des utilisateurs |
| POST | `/friends/request` | Envoyer demande d'amitié |
| PUT | `/friends/request/{requestId}/accept` | Accepter demande |
| PUT | `/friends/request/{requestId}/reject` | Refuser demande |
| DELETE | `/friends/{userId}` | Supprimer un ami |
| POST | `/social/activities/{activityId}/like` | Liker une activité |
| PUT | `/social/notifications/{notificationId}/read` | Marquer notification comme lue |

### Service: FriendChallengeService (`src/app/services/friend-challenge.service.ts`)
**Base URL:** `http://localhost:8095/api/friend-challenges`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/` | Créer un défi entre amis |
| GET | `/` | Récupérer les défis |
| GET | `/{id}` | Défi par ID |
| POST | `/{id}/join` | Rejoindre un défi |
| DELETE | `/{id}/leave` | Quitter un défi |
| PUT | `/{id}/progress` | Mettre à jour la progression |
| GET | `/{id}/leaderboard` | Classement du défi |

---

## 13. DÉFIS ET CHALLENGES

### Service: DefiService (`src/app/services/defi.service.ts`)
**Base URL:** `http://localhost:8095/api/defis`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/` | Créer un défi |
| GET | `/disponibles` | Défis disponibles |
| GET | `/actifs` | Défis actifs de l'utilisateur |
| GET | `/termines` | Défis terminés |
| GET | `/{id}` | Défi par ID |
| POST | `/{defiId}/rejoindre` | Rejoindre un défi |
| DELETE | `/{defiId}/quitter` | Quitter un défi |
| PUT | `/{defiId}/progression` | Mettre à jour la progression |
| GET | `/{defiId}/classement` | Classement du défi |
| GET | `/classements/actifs` | Tous les classements actifs |
| POST | `/{defiId}/synchroniser` | Synchroniser la progression |
| GET | `/type` | Défis par type |
| GET | `/statut` | Défis par statut |
| GET | `/recherche` | Rechercher des défis |
| POST | `/{defiId}/inviter` | Inviter des amis |
| GET | `/amis/disponibles` | Amis disponibles pour invitation |
| DELETE | `/{defiId}/refuser` | Refuser un défi |

### Service: ChallengeService (`src/app/services/challenge.service.ts`)
**Base URL:** `http://localhost:8095/api`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/challenges` | Créer un challenge |
| GET | `/challenges/available` | Challenges disponibles |
| GET | `/challenges/my` | Mes challenges |
| GET | `/challenges/invitations` | Invitations aux challenges |
| POST | `/challenges/{challengeId}/invite` | Inviter à un challenge |
| PUT | `/challenges/invitations/{invitationId}/accept` | Accepter invitation |
| PUT | `/challenges/invitations/{invitationId}/decline` | Refuser invitation |
| POST | `/challenges/{challengeId}/join` | Rejoindre un challenge public |
| DELETE | `/challenges/{challengeId}/leave` | Quitter un challenge |
| GET | `/challenges/{challengeId}/leaderboard` | Classement du challenge |
| PUT | `/challenges/{challengeId}/progress` | Mettre à jour la progression |

---

## 14. GRAPHIQUES ET DONNÉES

### Service: ChartDataService (`src/app/services/chart-data.service.ts`)
**Base URL:** `http://localhost:8095/api/charts`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/weight-progress/{userId}` | Progression du poids |
| GET | `/activity-summary/{userId}` | Résumé d'activité |
| GET | `/nutrition-breakdown/{userId}` | Répartition nutritionnelle |
| GET | `/workout-frequency/{userId}` | Fréquence d'entraînement |
| GET | `/goal-progress/{userId}` | Progression des objectifs |

---

## 15. SERVICES DE TEST ET DEBUG

### Service: DebugService (`src/app/service/debug.service.ts`)
**Base URL:** `http://localhost:8095`

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/test` | Test de connexion |
| GET | `/health` | Vérification de santé |

### Composant: ConnectionTestComponent
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `http://localhost:8095/api/test` | Test simple de connexion |

---

## 16. WEBSOCKETS

### Connexions WebSocket

| URL | Description |
|-----|-------------|
| `ws://localhost:8095/ws/messaging` | Messagerie en temps réel |

---

## Résumé par Domaine Fonctionnel

### 🔐 Authentification (2 endpoints)
- Connexion/Inscription
- Réinitialisation mot de passe

### 👤 Gestion Utilisateurs (15 endpoints)
- Profils utilisateurs
- Administration
- Gestion des clients/coachs

### 🏋️ Fitness & Entraînement (25 endpoints)
- Programmes d'entraînement
- Activités physiques
- Rapports de progression
- Suivi du poids

### 🥗 Nutrition (20 endpoints)
- Plans nutritionnels
- Reconnaissance alimentaire
- Gestion des repas

### 💬 Communication (15 endpoints)
- Messagerie
- Notifications
- WebSocket temps réel

### 👥 Social & Défis (25 endpoints)
- Amis et réseau social
- Défis et challenges
- Classements

### 📊 Analytics & Reporting (8 endpoints)
- Graphiques et données
- Statistiques
- Exports

### 🔧 Technique (3 endpoints)
- Tests de connexion
- Debug et santé

---

## Configuration Réseau

**Serveur Backend:** `http://localhost:8095`
**WebSocket:** `ws://localhost:8095`
**Environnement:** Développement local
**Authentification:** JWT Bearer Token
**Format de données:** JSON
**Gestion d'erreurs:** Retry automatique (2 tentatives)

---

## Notes Techniques

1. **Authentification**: Tous les endpoints (sauf auth et test) nécessitent un token JWT
2. **Headers**: `Authorization: Bearer {token}` et `Content-Type: application/json`
3. **Gestion d'erreurs**: Retry automatique avec gestion des erreurs via `ErrorHandlerService`
4. **État local**: Utilisation de `BehaviorSubject` pour la gestion d'état réactive
5. **WebSocket**: Reconnexion automatique avec fallback sur API REST
6. **Pagination**: Support de la pagination pour les listes importantes
7. **Filtres**: Support des paramètres de requête pour le filtrage et la recherche

---

*Rapport généré le: ${new Date().toLocaleDateString('fr-FR')}*