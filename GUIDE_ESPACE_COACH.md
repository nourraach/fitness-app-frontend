# Guide Rapide - Espace Coach

## 🚀 Démarrage

### Connexion
1. Allez sur `http://localhost:4200/login`
2. Connectez-vous avec un compte **coach**
3. Vous êtes automatiquement redirigé vers `/coach-home`

## 📊 Page d'accueil Coach

```
╔════════════════════════════════════════════════════════╗
║  Bienvenue, Coach 👋                                   ║
║  Tableau de bord Coach - Gérez vos clients            ║
╚════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────┐
│  Actions Rapides                                      │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ 📅          │  │ 📊          │  │ 👤          │ │
│  │ Programmes  │  │ Rapports    │  │ Mon Profil  │ │
│  │ Clients     │  │ de Progrès  │  │             │ │
│  └─────────────┘  └─────────────┘  └─────────────┘ │
│                                                       │
│  ┌─────────────┐                                     │
│  │ 🔔          │                                     │
│  │ Notifications│                                    │
│  │             │                                     │
│  └─────────────┘                                     │
└──────────────────────────────────────────────────────┘
```

## 🎯 Navigation Coach

### Menu disponible
```
┌─────────────────────────────────────────────────────┐
│ HEALTHFIT                                           │
│                                                     │
│ [🏠 Accueil] [📅 Programmes Clients] [📊 Rapports] │
│ [🔔 Notifications] [👤 Profil ▼]                   │
└─────────────────────────────────────────────────────┘
```

### Comparaison avec le menu Client
```
COACH:
✅ Accueil (coach-home)
✅ Programmes Clients
✅ Rapports
✅ Notifications
✅ Profil

CLIENT:
✅ Accueil (home)
✅ Programmes (catalogue)
✅ Mes Programmes
✅ Nutrition
✅ Évolution
✅ Suivi
✅ Notifications
✅ Mes Rapports
✅ Profil
```

## 💼 Fonctionnalités Coach

### 1. Programmes Clients
**Objectif:** Créer et assigner des programmes d'entraînement

**Actions:**
- Créer un nouveau programme
- Assigner à un client spécifique
- Modifier un programme existant
- Suivre les programmes actifs

**Navigation:** Cliquez sur la carte "Programmes Clients"

---

### 2. Rapports de Progrès
**Objectif:** Suivre l'évolution de vos clients

**Actions:**
- Générer un rapport hebdomadaire
- Consulter les statistiques détaillées
- Analyser les tendances
- Exporter les rapports

**Navigation:** Cliquez sur la carte "Rapports de Progrès"

**Exemple d'utilisation:**
```
1. Cliquer sur "Rapports de Progrès"
2. Cliquer sur "+ Générer un rapport"
3. Saisir l'ID du client: 2
4. Cliquer sur "Semaine courante"
5. ✅ Rapport généré !
```

---

### 3. Mon Profil
**Objectif:** Gérer vos informations personnelles

**Actions:**
- Modifier vos informations
- Changer votre mot de passe
- Mettre à jour votre photo
- Gérer vos paramètres

**Navigation:** Cliquez sur la carte "Mon Profil"

---

### 4. Notifications
**Objectif:** Rester en contact avec vos clients

**Actions:**
- Consulter les messages
- Répondre aux questions
- Voir les alertes importantes
- Marquer comme lu

**Navigation:** Cliquez sur la carte "Notifications"

## 🎨 Interface

### Codes couleur
- **Violet** 🟣 : Actions principales, boutons
- **Blanc** ⚪ : Cartes et contenus
- **Gris clair** : Arrière-plans secondaires

### Icônes
- 📅 Programmes
- 📊 Rapports
- 👤 Profil
- 🔔 Notifications
- 🏠 Accueil

## 📱 Responsive

### Sur ordinateur
- 4 cartes par ligne
- Interface spacieuse
- Tous les détails visibles

### Sur tablette
- 2 cartes par ligne
- Navigation adaptée
- Contenu optimisé

### Sur mobile
- 1 carte par ligne
- Menu hamburger
- Interface tactile

## 🔄 Workflow quotidien

### Matin
```
1. Se connecter → /coach-home
2. Consulter les notifications
3. Vérifier les nouveaux messages clients
```

### Pendant la journée
```
1. Créer/modifier des programmes
2. Assigner aux clients
3. Répondre aux questions
```

### Fin de semaine
```
1. Générer les rapports hebdomadaires
2. Analyser les progrès
3. Préparer les ajustements
```

## 💡 Conseils d'utilisation

### 1️⃣ Organisez-vous
- Générez les rapports chaque lundi
- Consultez les notifications 2x par jour
- Mettez à jour les programmes régulièrement

### 2️⃣ Communiquez
- Répondez rapidement aux clients
- Envoyez des encouragements
- Partagez les progrès

### 3️⃣ Analysez
- Utilisez les rapports pour ajuster
- Identifiez les tendances
- Célébrez les réussites

## 🆘 Aide rapide

### Je ne vois pas le menu coach
→ Vérifiez que vous êtes connecté avec un compte **coach**

### Je suis redirigé vers /home
→ Votre compte n'a pas le rôle "coach"

### Les cartes ne s'affichent pas
→ Actualisez la page (F5)

### Erreur lors de la génération de rapport
→ Vérifiez que le backend est démarré (port 8095)

## 🎯 Raccourcis clavier (à venir)

```
Ctrl + H  → Accueil
Ctrl + P  → Programmes
Ctrl + R  → Rapports
Ctrl + N  → Notifications
```

## 📞 Support

**Backend:** `http://localhost:8095`
**Frontend:** `http://localhost:4200`

**Routes coach:**
- `/coach-home` - Page d'accueil
- `/gestion-programmes` - Programmes clients
- `/rapports-progres` - Rapports
- `/notifications` - Notifications
- `/profile` - Profil

## ✅ Checklist de démarrage

- [ ] Se connecter avec un compte coach
- [ ] Vérifier la redirection vers `/coach-home`
- [ ] Explorer les 4 cartes d'actions rapides
- [ ] Tester la navigation vers chaque section
- [ ] Créer un premier programme
- [ ] Générer un premier rapport
- [ ] Consulter les notifications

## 🎉 Vous êtes prêt !

Votre espace coach est maintenant configuré et prêt à l'emploi. Commencez par explorer les différentes sections et familiarisez-vous avec l'interface.

**Bon coaching ! 💪**
