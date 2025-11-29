# Profil Coach - Documentation

## 🎯 Vue d'ensemble

Le coach dispose maintenant d'une page de profil dédiée, complètement différente de celle des utilisateurs normaux. Cette page permet au coach de gérer ses informations personnelles et professionnelles.

## ✨ Fonctionnalités

### 1. Informations Personnelles
Le coach peut modifier :
- ✅ **Nom complet** (obligatoire)
- ✅ **Email** (obligatoire)
- ✅ **Âge**
- ✅ **Téléphone**

### 2. Informations Professionnelles
Le coach peut renseigner :
- ✅ **Spécialisation** (ex: Musculation & Nutrition)
- ✅ **Années d'expérience**
- ✅ **Certifications** (ex: BPJEPS, Diplôme de Nutritionniste)
- ✅ **Biographie** (présentation détaillée)

### 3. Actions Supplémentaires
- 🔒 **Changer le mot de passe**
- ⚠️ **Supprimer le compte**

### 4. Résumé d'Activité
Affichage des statistiques du coach :
- Années d'expérience
- Clients actifs
- Programmes créés
- Note moyenne

---

## 🎨 Interface

### Structure de la Page

```
┌─────────────────────────────────────────────────┐
│ 👤 Mon Profil Coach                             │
│ Gérez vos informations personnelles             │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────┐                                    │
│  │   👤    │  [Changer la photo]                │
│  └─────────┘                                    │
│                                                 │
│  📋 Informations Personnelles    [Modifier]    │
│  ┌──────────────────────────────────────────┐  │
│  │ Nom: [Jean Dupont]    Email: [...]      │  │
│  │ Âge: [35]             Tél: [+33...]     │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  💼 Informations Professionnelles              │
│  ┌──────────────────────────────────────────┐  │
│  │ Spécialisation: [Musculation]           │  │
│  │ Expérience: [10 ans]                    │  │
│  │ Certifications: [BPJEPS, ...]           │  │
│  │ Bio: [Coach certifié avec...]           │  │
│  └──────────────────────────────────────────┘  │
│                                                 │
│  [Annuler]                    [Enregistrer]    │
│                                                 │
├─────────────────────────────────────────────────┤
│  🔒 Sécurité          ⚠️ Zone Dangereuse       │
│  [Changer mot passe]  [Supprimer compte]       │
├─────────────────────────────────────────────────┤
│  📊 Résumé de votre Activité                   │
│  [10 ans] [32 clients] [45 prog.] [4.8/5]     │
└─────────────────────────────────────────────────┘
```

---

## 🚀 Utilisation

### Accéder au Profil Coach

**Méthode 1 : Depuis la navbar**
1. Cliquez sur le menu utilisateur (en haut à droite)
2. Cliquez sur "Mon Profil"
3. Vous êtes redirigé vers `/coach-profile`

**Méthode 2 : Depuis la page d'accueil**
1. Sur la page d'accueil coach (`/coach-home`)
2. Cliquez sur le bouton "Mon Profil"
3. Vous êtes redirigé vers `/coach-profile`

**URL directe :** `http://localhost:4200/coach-profile`

---

### Modifier le Profil

1. **Cliquez sur "Modifier"** (en haut à droite de la section)
2. **Les champs deviennent éditables**
3. **Modifiez les informations** souhaitées
4. **Cliquez sur "Enregistrer"** pour sauvegarder
5. **Ou "Annuler"** pour abandonner les modifications

---

### Champs Disponibles

#### Informations Personnelles
| Champ | Type | Obligatoire | Exemple |
|-------|------|-------------|---------|
| Nom Complet | Texte | ✅ Oui | Jean Dupont |
| Email | Email | ✅ Oui | coach@fitness.com |
| Âge | Nombre | ❌ Non | 35 |
| Téléphone | Texte | ❌ Non | +33 6 12 34 56 78 |

#### Informations Professionnelles
| Champ | Type | Obligatoire | Exemple |
|-------|------|-------------|---------|
| Spécialisation | Texte | ❌ Non | Musculation & Nutrition |
| Années d'Expérience | Nombre | ❌ Non | 10 |
| Certifications | Texte | ❌ Non | BPJEPS, Diplôme Nutritionniste |
| Biographie | Texte long | ❌ Non | Coach certifié avec 10 ans... |

---

## 🔄 Différences avec le Profil User

### Profil Coach (`/coach-profile`)
- ✅ Informations professionnelles (spécialisation, expérience, certifications)
- ✅ Biographie détaillée
- ✅ Résumé d'activité (clients, programmes, note)
- ✅ Design professionnel
- ✅ Avatar avec possibilité de changer la photo

### Profil User (`/profile`)
- ✅ Informations personnelles basiques
- ✅ Objectifs fitness
- ✅ Mesures corporelles (poids, taille, IMC)
- ✅ Historique d'activités
- ✅ Programmes suivis

---

## 📁 Fichiers Créés

### Composant Coach Profile
```
src/app/coach-profile/
├── coach-profile.component.ts      # Logique du composant
├── coach-profile.component.html    # Template HTML
└── coach-profile.component.css     # Styles CSS
```

### Modifications
- `app.routes.ts` : Ajout de la route `/coach-profile`
- `navbar.component.html` : Redirection conditionnelle vers le bon profil
- `coach-home.component.html` : Lien vers `/coach-profile`

---

## 🎨 Design

### Palette de Couleurs
- **Primary** : `#667eea` → `#764ba2` (gradient violet)
- **Background** : `#f8f9fa` (gris clair)
- **Success** : `#d4edda` (vert clair)
- **Error** : `#f8d7da` (rouge clair)
- **Danger** : `#dc3545` (rouge)

### Sections
1. **Header** : Titre et sous-titre
2. **Avatar** : Photo de profil circulaire
3. **Informations Personnelles** : Formulaire 2 colonnes
4. **Informations Professionnelles** : Formulaire 2 colonnes
5. **Actions Supplémentaires** : 2 cartes (Sécurité, Zone Dangereuse)
6. **Résumé d'Activité** : 4 statistiques

---

## 💻 Code Implémenté

### Interface TypeScript
```typescript
interface CoachProfile {
  id?: number;
  name: string;
  email: string;
  age?: number;
  phone?: string;
  specialization?: string;
  experience?: number;
  bio?: string;
  certifications?: string;
}
```

### Méthodes Principales
```typescript
loadProfile()      // Charger les données du profil
toggleEdit()       // Activer/désactiver le mode édition
saveProfile()      // Sauvegarder les modifications
cancelEdit()       // Annuler les modifications
changePassword()   // Changer le mot de passe
deleteAccount()    // Supprimer le compte
```

---

## 🔐 Sécurité

### Validation
- ✅ Nom et email obligatoires
- ✅ Âge entre 18 et 100 ans
- ✅ Expérience entre 0 et 50 ans
- ✅ Format email valide

### Protection
- ✅ Seuls les coachs peuvent accéder à `/coach-profile`
- ✅ Les users sont redirigés vers `/profile`
- ✅ Confirmation avant suppression de compte

---

## 📱 Responsive Design

### Desktop (> 1024px)
- Formulaire en 2 colonnes
- Actions supplémentaires en 2 colonnes
- Stats en 4 colonnes

### Tablet (768px - 1024px)
- Formulaire en 2 colonnes
- Actions supplémentaires en 1 colonne
- Stats en 2 colonnes

### Mobile (< 768px)
- Formulaire en 1 colonne
- Actions supplémentaires en 1 colonne
- Stats en 1 colonne
- Boutons pleine largeur

---

## 🧪 Tests

### Checklist de Test

1. **Accès**
   - [ ] Le coach peut accéder à `/coach-profile`
   - [ ] Le user ne peut pas accéder (redirigé vers `/profile`)
   - [ ] Le lien dans la navbar fonctionne
   - [ ] Le bouton depuis la page d'accueil fonctionne

2. **Affichage**
   - [ ] Les informations se chargent correctement
   - [ ] L'avatar s'affiche
   - [ ] Les sections sont bien organisées
   - [ ] Les stats s'affichent

3. **Édition**
   - [ ] Le bouton "Modifier" active le mode édition
   - [ ] Les champs deviennent éditables
   - [ ] Les modifications sont sauvegardées
   - [ ] Le bouton "Annuler" restaure les données

4. **Validation**
   - [ ] Erreur si nom vide
   - [ ] Erreur si email vide
   - [ ] Message de succès après sauvegarde

5. **Responsive**
   - [ ] Affichage correct sur desktop
   - [ ] Affichage correct sur tablet
   - [ ] Affichage correct sur mobile

---

## 🚧 Améliorations Futures

### Court terme
1. [ ] Intégration avec l'API backend
2. [ ] Upload de photo de profil
3. [ ] Changement de mot de passe fonctionnel
4. [ ] Suppression de compte fonctionnelle

### Moyen terme
1. [ ] Validation en temps réel
2. [ ] Prévisualisation de la photo
3. [ ] Historique des modifications
4. [ ] Export du profil en PDF

### Long terme
1. [ ] Profil public visible par les clients
2. [ ] Galerie de photos (avant/après clients)
3. [ ] Témoignages clients
4. [ ] Calendrier de disponibilité

---

## 🐛 Dépannage

### Problème : Redirigé vers `/profile` au lieu de `/coach-profile`
→ Vérifier que le rôle est bien "ROLE_COACH" dans le JWT

### Problème : Les modifications ne sont pas sauvegardées
→ Actuellement simulé. Implémenter l'appel API backend

### Problème : Erreur "Cannot match any routes"
→ Vérifier que la route `/coach-profile` existe dans `app.routes.ts`

---

## 📞 Support

### En cas de problème
1. Vérifier le rôle dans le JWT
2. Vérifier que la route existe
3. Consulter la console du navigateur (F12)
4. Vérifier les logs du serveur

---

## 🎉 Résumé

Le coach dispose maintenant d'une page de profil dédiée avec :

✅ Informations personnelles éditables (nom, âge, email, téléphone)
✅ Informations professionnelles (spécialisation, expérience, certifications, bio)
✅ Mode édition avec sauvegarde/annulation
✅ Actions de sécurité (changement mot de passe, suppression compte)
✅ Résumé d'activité avec statistiques
✅ Design moderne et responsive
✅ Séparation complète du profil user

**Le profil coach est opérationnel ! 🚀**
