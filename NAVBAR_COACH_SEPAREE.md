# Navbar Coach Séparée - Documentation

## 🎯 Vue d'ensemble

Le coach a maintenant sa propre navbar complètement séparée de celle des utilisateurs normaux.

## ✨ Navbar Coach

### Composant créé
- `src/app/coach-navbar/coach-navbar.component.ts`
- `src/app/coach-navbar/coach-navbar.component.html`
- `src/app/coach-navbar/coach-navbar.component.css`

### Structure de la Navbar Coach

```
┌──────────────────────────────────────────────────────┐
│ ❤️ HEALTHFIT [COACH]  [Accueil] [Programmes] [👤 ▼] │
└──────────────────────────────────────────────────────┘
```

### Éléments de la Navbar

1. **Logo** : HEALTHFIT avec badge "COACH"
2. **Accueil** : Lien vers `/coach-home`
3. **Programmes** : Lien vers `/gestion-programmes`
4. **Profil** : Menu déroulant avec :
   - Mon Profil → `/profile`
   - Déconnexion → `/login`

### Design

- **Couleur** : Gradient violet (#667eea → #764ba2)
- **Badge COACH** : Fond semi-transparent blanc
- **Boutons** : Fond semi-transparent avec hover effects
- **Responsive** : Adapté mobile/tablet/desktop

---

## 📄 Pages utilisant la Navbar Coach

### 1. Coach Home (`/coach-home`)
```html
<app-coach-navbar></app-coach-navbar>
<div class="coach-home-container">
  <!-- Contenu -->
</div>
```

### 2. Gestion Programmes (`/gestion-programmes`)
```html
<!-- Navbar conditionnelle -->
<app-coach-navbar *ngIf="userRole === 'coach'"></app-coach-navbar>
<app-navbar *ngIf="userRole !== 'coach'"></app-navbar>
```

### 3. Profile (`/profile`)
```html
<!-- Navbar conditionnelle -->
<app-coach-navbar *ngIf="isCoach"></app-coach-navbar>
<app-navbar *ngIf="!isCoach"></app-navbar>
```

---

## 🔄 Comparaison Navbar Coach vs User

### Navbar Coach (3 éléments)
```
Logo [COACH] | Accueil | Programmes | Profil ▼
```

### Navbar User (8+ éléments)
```
Logo | Accueil | Programmes | Mes Programmes | Nutrition | 
Évolution | Suivi | Notifications | Profil ▼
```

---

## 🎨 Caractéristiques Visuelles

### Logo
- Icône cœur animée (pulse)
- Texte "HEALTHFIT" avec accent doré sur "FIT"
- Badge "COACH" avec fond semi-transparent

### Liens de Navigation
- Fond semi-transparent blanc (10%)
- Hover : Fond plus opaque (25%) + translation vers le haut
- Active : Fond encore plus opaque (30%) + ombre

### Menu Profil
- Bouton arrondi avec bordure
- Dropdown blanc avec ombre
- Animation slide-down
- Icônes colorées (violet pour profil, rouge pour déconnexion)

---

## 💻 Code Implémenté

### coach-navbar.component.ts
```typescript
export class CoachNavbarComponent implements OnInit {
  coachName: string = 'Coach';
  showUserMenu: boolean = false;

  constructor(
    private router: Router,
    private jwtService: JwtService
  ) {}

  ngOnInit(): void {
    this.getCoachName();
  }

  getCoachName(): void {
    const role = this.jwtService.getRole();
    if (role) {
      this.coachName = role.replace('ROLE_', '');
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.showUserMenu = false;
    localStorage.clear();
    this.router.navigate(['/login']);
  }
}
```

### Utilisation dans les composants
```typescript
// Dans coach-home.component.ts
imports: [CommonModule, RouterModule, CoachNavbarComponent]

// Dans gestion-programmes.component.ts
imports: [CommonModule, FormsModule, CoachNavbarComponent, NavbarComponent]

// Dans profile.component.ts
imports: [CommonModule, FormsModule, CoachNavbarComponent, NavbarComponent]
```

---

## 📱 Responsive Design

### Desktop (> 768px)
- Tous les éléments visibles
- Texte complet
- Badge "COACH" visible

### Tablet/Mobile (< 768px)
- Badge "COACH" masqué
- Texte des liens masqué (icônes uniquement)
- Username masqué dans le bouton profil
- Espacement réduit

### Mobile (< 480px)
- "FIT" masqué dans le logo (seulement "HEALTH")
- Padding réduit
- Icônes plus grandes

---

## 🔐 Sécurité

### Détection du Rôle
```typescript
checkRole(): void {
  const role = this.jwtService.getRole();
  this.isCoach = role === 'ROLE_COACH' || role?.toLowerCase() === 'coach';
}
```

### Affichage Conditionnel
```html
<app-coach-navbar *ngIf="isCoach"></app-coach-navbar>
<app-navbar *ngIf="!isCoach"></app-navbar>
```

---

## ✅ Avantages

### Pour le Coach
✅ Interface épurée et professionnelle
✅ Navigation simplifiée (3 éléments)
✅ Badge distinctif "COACH"
✅ Design cohérent avec gradient violet
✅ Accès rapide aux fonctionnalités essentielles

### Pour le User
✅ Navbar complète inchangée
✅ Toutes les fonctionnalités accessibles
✅ Pas de confusion avec l'interface coach

---

## 🎯 Navigation Coach

### Depuis n'importe quelle page
```
Accueil → /coach-home (tableau de bord)
Programmes → /gestion-programmes (assigner programmes)
Profil → Menu déroulant
  ├─ Mon Profil → /profile
  └─ Déconnexion → /login
```

---

## 🧪 Tests

### Checklist de Vérification

**Navbar Coach :**
- [ ] Logo avec badge "COACH" visible
- [ ] 3 liens : Accueil, Programmes, Profil
- [ ] Gradient violet
- [ ] Menu profil fonctionne
- [ ] Déconnexion fonctionne
- [ ] Responsive sur mobile

**Pages avec Navbar Coach :**
- [ ] `/coach-home` affiche navbar coach
- [ ] `/gestion-programmes` affiche navbar coach (si coach)
- [ ] `/profile` affiche navbar coach (si coach)

**Pages avec Navbar User :**
- [ ] `/home` affiche navbar user
- [ ] `/nutrition` affiche navbar user
- [ ] `/gestion-programmes` affiche navbar user (si user)
- [ ] `/profile` affiche navbar user (si user)

---

## 🔄 Workflow

### Connexion Coach
```
1. Login avec compte coach
2. Redirection → /coach-home
3. Navbar coach s'affiche
4. Navigation disponible : Accueil, Programmes, Profil
```

### Navigation Coach
```
Coach Home → Clic "Programmes" → Gestion Programmes (navbar coach)
          → Clic "Profil" → Menu déroulant
          → Clic "Mon Profil" → Page Profile (navbar coach)
          → Clic "Déconnexion" → Login
```

### Connexion User
```
1. Login avec compte user
2. Redirection → /home
3. Navbar user s'affiche
4. Navigation complète disponible
```

---

## 📞 Support

### Problèmes Courants

**Q: La navbar coach ne s'affiche pas**
→ Vérifier que le rôle est bien "ROLE_COACH" dans le JWT

**Q: La navbar user s'affiche pour un coach**
→ Vérifier la condition `*ngIf="isCoach"` dans le template

**Q: Le menu profil ne s'ouvre pas**
→ Vérifier que `toggleUserMenu()` est bien appelé

**Q: Erreur de compilation**
→ Vérifier que `CoachNavbarComponent` est bien importé

---

## 🎉 Résumé

Le coach a maintenant :
✅ Sa propre navbar séparée
✅ Design professionnel avec badge "COACH"
✅ Navigation simplifiée (3 éléments)
✅ Cohérence visuelle sur toutes les pages
✅ Responsive design

**L'interface coach est maintenant complètement distincte ! 🚀**
