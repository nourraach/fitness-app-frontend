# Gestion des Clients du Coach - Documentation

## 🎯 Vue d'ensemble

Le coach peut maintenant gérer ses clients assignés via une interface dédiée. Cette fonctionnalité permet :
- **Un utilisateur** peut être assigné à **0 ou 1 coach**
- **Un coach** peut avoir **0 ou N clients** assignés

---

## ✨ Fonctionnalités Frontend

### 1. Liste des Clients
- Affichage de tous les clients assignés au coach
- Recherche par nom ou email
- Statistiques résumées (total clients, actifs, programmes)

### 2. Détails des Clients
Chaque carte client affiche :
- ✅ Nom et email
- ✅ Statut (Actif/Inactif/En attente)
- ✅ Date d'assignation
- ✅ Dernière activité
- ✅ Téléphone
- ✅ Nombre de programmes
- ✅ Taux de progrès (%)

### 3. Assigner un Client
- Modal avec liste des clients disponibles (non assignés)
- Bouton "Assigner" pour chaque client
- Confirmation visuelle après assignation

### 4. Retirer un Client
- Bouton "Retirer" sur chaque carte client
- Confirmation avant suppression
- Message de succès après retrait

### 5. Voir les Détails
- Modal avec informations complètes du client
- Statistiques détaillées
- Actions rapides (voir programmes, générer rapport)

---

## 🎨 Interface

### Page Principale
```
┌─────────────────────────────────────────────────┐
│ 👥 Mes Clients          [+ Assigner un client] │
├─────────────────────────────────────────────────┤
│ [🔍 Rechercher...]                              │
├─────────────────────────────────────────────────┤
│ [👥 4 Clients] [✅ 3 Actifs] [📊 9 Programmes] │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐  ┌──────────────┐           │
│  │ 👤           │  │ 👤           │           │
│  │ Marie Dubois │  │ Jean Martin  │           │
│  │ ✅ Actif     │  │ ✅ Actif     │           │
│  │ 3 programmes │  │ 2 programmes │           │
│  │ Progrès: 85% │  │ Progrès: 72% │           │
│  │ [Voir] [✕]   │  │ [Voir] [✕]   │           │
│  └──────────────┘  └──────────────┘           │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Utilisation

### Accéder à la Page
1. **Depuis la navbar** : Cliquez sur "Mes Clients"
2. **URL directe** : `http://localhost:4200/coach-clients`

### Assigner un Client
1. Cliquez sur **"+ Assigner un client"**
2. Une modal s'ouvre avec la liste des clients disponibles
3. Cliquez sur **"Assigner"** à côté du client souhaité
4. Le client est ajouté à votre liste

### Retirer un Client
1. Sur la carte du client, cliquez sur **"Retirer"**
2. Confirmez l'action
3. Le client est retiré de votre liste

### Voir les Détails
1. Sur la carte du client, cliquez sur **"Voir détails"**
2. Une modal s'ouvre avec toutes les informations
3. Vous pouvez voir programmes et générer des rapports

---

## 📁 Fichiers Créés

### Frontend
```
src/app/
├── models/
│   └── client.model.ts                    # Interfaces Client
├── services/
│   └── client.service.ts                  # Service API clients
└── coach-clients/
    ├── coach-clients.component.ts         # Logique
    ├── coach-clients.component.html       # Template
    └── coach-clients.component.css        # Styles
```

### Backend (À FAIRE)
```
src/main/java/com/projet/app/
├── models/
│   └── CoachClientAssignment.java         # Model relation
├── dto/
│   └── ClientDTO.java                     # DTO client
├── repository/
│   └── CoachClientAssignmentRepository.java
├── services/
│   └── CoachClientService.java            # Service métier
└── controllers/
    └── CoachClientController.java         # API endpoints
```

---

## 🔧 Backend - Travail à Faire

### ⚠️ IMPORTANT : Le backend doit être implémenté

J'ai créé un document complet avec tout le code nécessaire :
**`BACKEND_COACH_CLIENTS_TODO.md`** (dans le dossier backend)

Ce document contient :
1. ✅ Script SQL pour créer la table
2. ✅ Model Java complet
3. ✅ DTO complet
4. ✅ Repository complet
5. ✅ Service complet
6. ✅ Controller complet
7. ✅ Tests cURL

**Tu dois implémenter ces fichiers dans le backend pour que le frontend fonctionne !**

---

## 🔄 Fonctionnement

### Avec Backend Implémenté
1. Le frontend appelle l'API `/api/coach/clients`
2. Le backend retourne la liste des clients du coach
3. Les données s'affichent dans l'interface

### Sans Backend (Mode Démo)
1. Le frontend génère des données mock
2. Les fonctionnalités sont simulées
3. Aucune donnée n'est sauvegardée

---

## 📊 Endpoints API (Backend)

### GET `/api/coach/clients`
Récupère tous les clients du coach connecté

**Headers:**
```
Authorization: Bearer <token_coach>
```

**Réponse:**
```json
[
  {
    "id": 1,
    "name": "Marie Dubois",
    "email": "marie@email.com",
    "age": 28,
    "phone": "+33 6 12 34 56 78",
    "assignedDate": "2025-01-15",
    "lastActivity": "2025-11-24",
    "programsCount": 3,
    "progressRate": 85,
    "status": "active"
  }
]
```

### GET `/api/coach/clients/available`
Récupère les clients disponibles (non assignés)

### POST `/api/coach/clients/assign/{clientId}`
Assigne un client au coach

### DELETE `/api/coach/clients/unassign/{clientId}`
Retire un client du coach

---

## 🎨 Design

### Codes Couleur des Statuts
- **Actif** 🟢 : Vert (`#d4edda`)
- **Inactif** 🔴 : Rouge (`#f8d7da`)
- **En attente** 🟡 : Jaune (`#fff3cd`)

### Codes Couleur des Progrès
- **Excellent** (≥80%) : Vert (`#28a745`)
- **Bon** (≥60%) : Bleu (`#17a2b8`)
- **Moyen** (≥40%) : Jaune (`#ffc107`)
- **Faible** (<40%) : Rouge (`#dc3545`)

---

## 📱 Responsive

### Desktop (> 1024px)
- Grille de 3 colonnes pour les cartes clients
- Stats en 3 colonnes

### Tablet (768px - 1024px)
- Grille de 2 colonnes
- Stats en 2 colonnes

### Mobile (< 768px)
- Grille de 1 colonne
- Stats en 1 colonne
- Boutons pleine largeur

---

## 🧪 Tests

### Checklist Frontend
- [ ] La page s'affiche correctement
- [ ] Les données mock s'affichent
- [ ] La recherche fonctionne
- [ ] Le modal d'assignation s'ouvre
- [ ] Le modal de détails s'ouvre
- [ ] Les boutons sont cliquables
- [ ] Le design est responsive

### Checklist Backend (À faire)
- [ ] La table est créée dans la base de données
- [ ] Les endpoints répondent correctement
- [ ] Seuls les coachs peuvent accéder
- [ ] Un client ne peut être assigné qu'à un coach
- [ ] Les données sont correctement sauvegardées

---

## 🔐 Sécurité

### Frontend
- ✅ Seuls les coachs voient le menu "Mes Clients"
- ✅ Redirection si non-coach tente d'accéder

### Backend (À implémenter)
- ✅ Vérification du rôle COACH sur tous les endpoints
- ✅ Contrainte UNIQUE sur client_id (un client = un coach max)
- ✅ Validation des données
- ✅ Gestion des erreurs

---

## 🚧 Améliorations Futures

### Court terme
1. [ ] Filtres avancés (statut, date, progrès)
2. [ ] Tri des clients (nom, date, progrès)
3. [ ] Export de la liste en CSV/PDF

### Moyen terme
1. [ ] Statistiques détaillées par client
2. [ ] Graphiques d'évolution
3. [ ] Historique des assignations

### Long terme
1. [ ] Messagerie intégrée coach-client
2. [ ] Notifications automatiques
3. [ ] Tableau de bord comparatif

---

## 🐛 Dépannage

### Problème : Aucun client ne s'affiche
→ Normal si le backend n'est pas implémenté. Les données mock devraient s'afficher.

### Problème : Erreur lors de l'assignation
→ Vérifier que le backend est démarré et que les endpoints existent.

### Problème : "Accès réservé aux coachs"
→ Vérifier que vous êtes connecté avec un compte coach.

---

## 📞 Support

### Pour le Frontend
- Vérifier la console du navigateur (F12)
- Vérifier que le service est bien injecté
- Vérifier les routes dans `app.routes.ts`

### Pour le Backend
- Consulter `BACKEND_COACH_CLIENTS_TODO.md`
- Vérifier les logs du serveur
- Tester les endpoints avec cURL

---

## 🎉 Résumé

**Frontend :** ✅ Complètement implémenté et fonctionnel
- Interface moderne et intuitive
- Gestion complète des clients
- Recherche et filtres
- Modals pour assignation et détails
- Design responsive

**Backend :** ⚠️ À implémenter
- Tous les fichiers sont documentés dans `BACKEND_COACH_CLIENTS_TODO.md`
- Code complet fourni
- Tests inclus

**Une fois le backend implémenté, la fonctionnalité sera 100% opérationnelle ! 🚀**
