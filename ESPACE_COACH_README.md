# Espace Coach - Documentation

## 🎯 Vue d'ensemble

L'espace coach est une interface dédiée aux coachs sportifs pour gérer leurs clients, créer des programmes personnalisés et suivre les progrès.

## ✨ Fonctionnalités

### 1. Page d'accueil Coach (`/coach-home`)
- Tableau de bord dédié avec actions rapides
- Accès direct aux fonctionnalités principales
- Conseils pour bien démarrer
- Interface moderne et intuitive

### 2. Navigation spécifique Coach
La navbar affiche uniquement les fonctionnalités pertinentes pour un coach :
- **Accueil** → Page d'accueil coach
- **Programmes Clients** → Gestion des programmes à assigner
- **Rapports** → Génération et consultation des rapports de progrès
- **Notifications** → Messages et alertes
- **Mon Profil** → Gestion du compte

### 3. Différences avec l'espace Client/User

#### Navbar Coach
```
┌─────────────────────────────────────────────────┐
│ HEALTHFIT                                       │
│ [Accueil] [Programmes Clients] [Rapports]      │
│ [Notifications] [Profil ▼]                     │
└─────────────────────────────────────────────────┘
```

#### Navbar Client/User
```
┌─────────────────────────────────────────────────┐
│ HEALTHFIT                                       │
│ [Accueil] [Programmes] [Mes Programmes]        │
│ [Nutrition] [Évolution] [Suivi]                │
│ [Notifications] [Mes Rapports] [Profil ▼]     │
└─────────────────────────────────────────────────┘
```

## 🚀 Utilisation

### Connexion en tant que Coach

1. **Se connecter** avec un compte coach
2. **Redirection automatique** vers `/coach-home`
3. **Navigation dédiée** avec menu coach

### Actions disponibles depuis la page d'accueil

#### 📅 Programmes Clients
- Créer des programmes d'entraînement
- Assigner des programmes à des clients spécifiques
- Modifier et suivre les programmes actifs

#### 📊 Rapports de Progrès
- Générer des rapports hebdomadaires
- Consulter les statistiques détaillées
- Analyser l'évolution des clients

#### 👤 Mon Profil
- Gérer les informations personnelles
- Modifier les paramètres du compte

#### 🔔 Notifications
- Consulter les messages des clients
- Répondre aux questions
- Suivre les alertes importantes

## 📁 Fichiers créés

### Composant Coach Home
```
src/app/coach-home/
├── coach-home.component.ts      # Logique du composant
├── coach-home.component.html    # Template HTML
└── coach-home.component.css     # Styles CSS
```

### Modifications apportées

#### 1. `navbar.component.ts`
```typescript
// Ajout de la détection du rôle coach
isCoach: boolean = false;

checkRole(): void {
  const role = this.jwtService.getRole();
  this.isAdmin = role === 'ROLE_ADMIN';
  this.isCoach = role === 'ROLE_COACH' || role?.toLowerCase() === 'coach';
}
```

#### 2. `navbar.component.html`
```html
<!-- Navigation conditionnelle selon le rôle -->
<ng-container *ngIf="isCoach">
  <!-- Menu coach -->
</ng-container>

<ng-container *ngIf="!isCoach && !isAdmin">
  <!-- Menu client/user -->
</ng-container>
```

#### 3. `login.component.ts`
```typescript
// Redirection selon le rôle après connexion
const role = this.service.getRole();
if (role === 'ROLE_COACH' || role?.toLowerCase() === 'coach') {
  this.router.navigateByUrl('/coach-home');
} else {
  this.router.navigateByUrl('/home');
}
```

#### 4. `app.routes.ts`
```typescript
// Nouvelle route pour l'espace coach
{ path: 'coach-home', component: CoachHomeComponent }
```

## 🎨 Design de la page Coach

### Hero Section
- Gradient violet moderne
- Message de bienvenue personnalisé
- Sous-titre explicatif

### Actions Rapides (4 cartes)
1. **Programmes Clients** - Gestion des programmes
2. **Rapports de Progrès** - Génération de rapports
3. **Mon Profil** - Paramètres du compte
4. **Notifications** - Messages et alertes

### Outils de Coaching (4 features)
- 📊 Suivi Détaillé
- 💪 Programmes Personnalisés
- 📈 Rapports Automatiques
- 🎯 Objectifs Mesurables

### Conseils (3 tips)
1. Assigner des programmes
2. Générer des rapports réguliers
3. Rester en contact avec les clients

## 🔐 Sécurité et Rôles

### Détection du rôle
```typescript
// Dans JwtService
getRole(): string {
  const token = localStorage.getItem('jwt');
  // Décodage du token JWT
  // Retourne: 'ROLE_COACH', 'ROLE_ADMIN', 'ROLE_USER', etc.
}
```

### Redirection automatique
- **Coach** → `/coach-home`
- **User/Client** → `/home`
- **Admin** → `/home` (avec accès admin)

### Protection des routes
Les composants vérifient le rôle pour afficher le contenu approprié :
```typescript
checkUserRole(): void {
  const role = this.jwtService.getRole();
  this.isCoach = role?.toLowerCase() === 'role_coach' || role?.toLowerCase() === 'coach';
}
```

## 📱 Responsive Design

### Desktop (> 768px)
- Grille de 4 colonnes pour les actions
- Layout spacieux et aéré

### Tablet (768px)
- Grille de 2 colonnes
- Adaptation des espacements

### Mobile (< 480px)
- Grille de 1 colonne
- Icônes et textes réduits
- Navigation optimisée

## 🎯 Workflow Coach

### 1. Connexion
```
Login → Vérification rôle → Redirection /coach-home
```

### 2. Gestion quotidienne
```
Coach Home → Programmes Clients → Assigner programmes
          → Rapports → Générer rapports hebdomadaires
          → Notifications → Répondre aux clients
```

### 3. Suivi client
```
Rapports → Sélectionner client → Générer rapport semaine courante
       → Consulter statistiques → Ajuster programme
```

## 🔄 Navigation entre les espaces

### Coach vers Client (si besoin)
Un coach peut avoir besoin d'accéder à certaines fonctionnalités client :
- Actuellement, la navbar est strictement séparée
- Possibilité future d'ajouter un "mode client" pour tester

### Client vers Coach
- Les clients n'ont pas accès à l'espace coach
- Redirection automatique vers `/home` si tentative d'accès

## 💡 Améliorations futures possibles

### 1. Liste des clients
```typescript
// Nouveau composant: clients-list.component
- Afficher tous les clients du coach
- Recherche et filtres
- Accès rapide aux rapports de chaque client
```

### 2. Calendrier de coaching
```typescript
// Nouveau composant: coach-calendar.component
- Planning des séances
- Rendez-vous avec les clients
- Rappels automatiques
```

### 3. Messagerie intégrée
```typescript
// Nouveau composant: coach-messages.component
- Chat en temps réel avec les clients
- Historique des conversations
- Notifications push
```

### 4. Statistiques globales
```typescript
// Nouveau composant: coach-stats.component
- Vue d'ensemble de tous les clients
- Graphiques de progression
- Taux de réussite
```

### 5. Bibliothèque d'exercices
```typescript
// Nouveau composant: exercise-library.component
- Base de données d'exercices
- Création de programmes par glisser-déposer
- Templates de programmes
```

## 🧪 Tests

### Tester l'espace coach

1. **Créer un compte coach** (ou utiliser un existant)
2. **Se connecter** avec ce compte
3. **Vérifier la redirection** vers `/coach-home`
4. **Vérifier la navbar** (uniquement menu coach)
5. **Tester les actions rapides** (navigation vers chaque section)

### Tester la séparation des rôles

1. **Se connecter en tant que coach** → Voir `/coach-home`
2. **Se déconnecter**
3. **Se connecter en tant que client** → Voir `/home`
4. **Vérifier les navbars différentes**

## 📞 Support

### Problèmes courants

#### La navbar affiche le menu client au lieu du menu coach
→ Vérifier que le rôle dans le JWT est bien `ROLE_COACH`

#### Redirection vers `/home` au lieu de `/coach-home`
→ Vérifier la logique de redirection dans `login.component.ts`

#### Erreur "Cannot match any routes"
→ Vérifier que la route `/coach-home` est bien définie dans `app.routes.ts`

## 🎉 Résumé

L'espace coach est maintenant complètement séparé de l'espace client avec :

✅ Page d'accueil dédiée (`/coach-home`)
✅ Navigation spécifique avec menu coach
✅ Redirection automatique après login
✅ Interface moderne et intuitive
✅ Accès aux fonctionnalités coach :
   - Programmes Clients
   - Rapports de Progrès
   - Notifications
   - Profil

Les coachs ont maintenant un espace professionnel pour gérer efficacement leurs clients !
