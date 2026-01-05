# Problèmes API Mismatches - Frontend vs Backend

## 🚨 PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. **AUTHENTIFICATION - Endpoints manquants**

**Frontend appelle :**
- `POST /auth/login` (JwtService)
- `POST /auth/register` (JwtService)
- `POST /auth/refresh` (JwtService)

**Backend a :**
- `POST /login` (LoginController)
- `POST /signup` (SignupController)
- `POST /signup/coach` (SignupController)

❌ **PROBLÈME:** Préfixes `/auth/` vs endpoints directs

---

### 2. **PROFILS - Endpoints incompatibles**

**Frontend appelle :**
- `GET /api/profile/imc` (ProfileService)
- `POST /api/profile/besoins-caloriques` (ProfileService)

**Backend a :**
- `GET /api/profile/bmi` (ProfileController)
- `GET /api/profile/caloric-needs` (ProfileController)

❌ **PROBLÈME:** 
- `imc` vs `bmi`
- `besoins-caloriques` vs `caloric-needs`
- POST vs GET pour besoins caloriques

---

### 3. **RAPPORTS - Structure différente**

**Frontend appelle :**
- `POST /api/rapports/generer` (RapportProgresService)
- `GET /api/rapports/semaine-courante` (RapportProgresService)

**Backend a :**
- `POST /api/rapports/creer` (RapportProgresController)
- Pas de `/generer` ni `/semaine-courante`

❌ **PROBLÈME:** Endpoints complètement différents

---

### 4. **DÉFIS - URLs incompatibles**

**Frontend appelle :**
- `POST /api/defis/` (DefiService)
- `GET /api/defis/disponibles` (DefiService)
- `POST /api/defis/{defiId}/rejoindre` (DefiService)

**Backend a :**
- `POST /api/defis/creer` (DefiController)
- `GET /api/defis/mes-defis` (DefiController)
- `POST /api/defis/{defiId}/accepter` (DefiController)

❌ **PROBLÈME:** 
- `/creer` manquant côté frontend
- `disponibles` vs `mes-defis`
- `rejoindre` vs `accepter`

---

### 5. **MESSAGERIE - Endpoints manquants**

**Frontend appelle :**
- `POST /api/messages` (MessageService)
- `PUT /api/messages/{messageId}/read` (MessageService)

**Backend a :**
- `POST /api/messages/envoyer` (MessageController)
- `PUT /api/messages/{messageId}/lire` (MessageController)

❌ **PROBLÈME:** 
- `/envoyer` manquant côté frontend
- `read` vs `lire`

---

### 6. **NUTRITION - Doubles services**

**Frontend a 2 services :**
- `NutritionService` (legacy) → `/api/repas`
- `NutritionService` (nouveau) → `/api/nutrition`

**Backend a :**
- `RepasController` → `/api/repas`
- `NutritionPlanController` → `/api/nutrition`

❌ **PROBLÈME:** Confusion entre les deux services côté frontend

---

### 7. **CHALLENGES - Endpoints inexistants**

**Frontend appelle :**
- `POST /api/challenges` (ChallengeService)
- `GET /api/challenges/available` (ChallengeService)

**Backend n'a PAS :**
- Aucun endpoint `/api/challenges`
- Seulement `/api/defis` et `/api/friend-challenges`

❌ **PROBLÈME:** Service frontend pointe vers des endpoints inexistants

---

### 8. **GRAPHIQUES - Endpoints manquants**

**Frontend appelle :**
- `GET /api/charts/weight-progress/{userId}` (ChartDataService)
- `GET /api/charts/activity-summary/{userId}` (ChartDataService)

**Backend a :**
- `GET /api/charts/weight-evolution` (ChartController)
- Pas de `/weight-progress`

❌ **PROBLÈME:** Noms d'endpoints différents

---

### 9. **NOTIFICATIONS - Structure différente**

**Frontend appelle :**
- `PUT /api/notifications/{notificationId}/read` (NotificationService)
- `PUT /api/notifications/{notificationId}/unread` (NotificationService)

**Backend a :**
- `PUT /api/notifications/{id}/lire` (NotificationController)
- Pas de `/unread`

❌ **PROBLÈME:** 
- `read` vs `lire`
- Endpoint `/unread` manquant

---

### 10. **ADMIN - Endpoints manquants**

**Frontend appelle :**
- `GET /api/admin/audit-logs` (AdminService)
- `GET /api/admin/audit-logs/search` (AdminService)

**Backend n'a PAS :**
- Aucun endpoint d'audit dans AdminController

❌ **PROBLÈME:** Fonctionnalités d'audit manquantes côté backend

---

## 📊 RÉSUMÉ DES PROBLÈMES PAR CATÉGORIE

| Catégorie | Problème Principal | Impact |
|-----------|-------------------|---------|
| **Authentification** | Préfixes `/auth/` manquants | 🔴 CRITIQUE |
| **Profils** | Noms d'endpoints différents | 🔴 CRITIQUE |
| **Rapports** | Endpoints complètement différents | 🔴 CRITIQUE |
| **Défis** | Structure d'URLs incompatible | 🔴 CRITIQUE |
| **Messagerie** | Suffixes manquants (`/envoyer`, `/lire`) | 🔴 CRITIQUE |
| **Challenges** | Endpoints inexistants côté backend | 🔴 CRITIQUE |
| **Graphiques** | Noms d'endpoints différents | 🟡 MOYEN |
| **Notifications** | Traduction FR/EN incohérente | 🟡 MOYEN |
| **Admin** | Fonctionnalités manquantes | 🟡 MOYEN |
| **Nutrition** | Double service côté frontend | 🟡 MOYEN |

---

## 🔧 SOLUTIONS RECOMMANDÉES

### Option 1: Modifier le Backend (Recommandé)
- Ajouter des endpoints compatibles avec le frontend
- Garder les anciens pour la rétrocompatibilité
- Standardiser sur l'anglais

### Option 2: Modifier le Frontend
- Adapter tous les services aux endpoints backend existants
- Risque de casser d'autres fonctionnalités

### Option 3: Hybride
- Corriger les problèmes critiques côté backend
- Adapter le frontend pour les problèmes mineurs

---

## 🎯 PRIORITÉS DE CORRECTION

### 🔴 **URGENT (Bloque l'application)**
1. Authentification (`/auth/login`, `/auth/register`)
2. Profils (`/imc` vs `/bmi`)
3. Messagerie (`/messages` vs `/messages/envoyer`)

### 🟡 **IMPORTANT (Fonctionnalités cassées)**
4. Défis (`/disponibles`, `/rejoindre`)
5. Rapports (`/generer`, `/semaine-courante`)
6. Challenges (endpoints manquants)

### 🟢 **MINEUR (Améliorations)**
7. Graphiques (noms d'endpoints)
8. Notifications (traduction)
9. Admin (fonctionnalités avancées)

---

## 📝 NOTES TECHNIQUES

1. **Cohérence linguistique :** Backend mélange français/anglais
2. **Versioning :** Pas de versioning d'API
3. **Documentation :** Manque de synchronisation entre équipes
4. **Tests :** Besoin de tests d'intégration frontend/backend

---

*Analyse effectuée le: ${new Date().toLocaleDateString('fr-FR')}*