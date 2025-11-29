# Interface Frontend - Rapports de Progrès Hebdomadaires

## Vue d'ensemble

Interface Angular permettant aux coachs de générer et consulter des rapports hebdomadaires détaillés sur les progrès de leurs clients, et aux clients de consulter leurs propres rapports.

## Fichiers créés

### Models
- `src/app/models/rapport-progres.model.ts` - Interfaces TypeScript pour les rapports et statistiques

### Services
- `src/app/services/rapport-progres.service.ts` - Service pour communiquer avec l'API backend

### Composants
- `src/app/rapports-progres/rapports-progres.component.ts` - Logique du composant
- `src/app/rapports-progres/rapports-progres.component.html` - Template HTML
- `src/app/rapports-progres/rapports-progres.component.css` - Styles CSS

### Configuration
- Route ajoutée dans `app.routes.ts` : `/rapports-progres`
- Lien ajouté dans la navbar

## Fonctionnalités

### Pour les Coachs

#### 1. Générer un rapport personnalisé
- Saisir l'ID du client
- Choisir une période (date début - date fin)
- Générer le rapport avec toutes les statistiques

#### 2. Générer un rapport pour la semaine courante
- Saisir l'ID du client
- Clic sur "Semaine courante" pour générer automatiquement le rapport du lundi au dimanche

#### 3. Consulter tous les rapports générés
- Liste de tous les rapports créés par le coach
- Affichage en cartes avec aperçu des statistiques principales
- Clic sur une carte pour voir les détails complets

### Pour les Clients

#### 1. Consulter leurs rapports
- Liste de tous les rapports les concernant
- Affichage des statistiques détaillées
- Visualisation de l'analyse du coach

## Interface utilisateur

### Page principale

```
┌─────────────────────────────────────────────────────┐
│  📊 Rapports de Progrès    [+ Générer un rapport]  │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐│
│  │ Marie Martin │  │ Paul Durand  │  │ Sophie L.  ││
│  │ 24/11/2025   │  │ 23/11/2025   │  │ 22/11/2025 ││
│  │              │  │              │  │            ││
│  │ Poids: -0.7kg│  │ Poids: +0.3kg│  │ Poids: -1kg││
│  │ Actif: 5/7   │  │ Actif: 3/7   │  │ Actif: 6/7 ││
│  │ Repas: 21    │  │ Repas: 18    │  │ Repas: 20  ││
│  └──────────────┘  └──────────────┘  └────────────┘│
└─────────────────────────────────────────────────────┘
```

### Formulaire de génération (Coach)

```
┌─────────────────────────────────────────┐
│ Générer un nouveau rapport              │
├─────────────────────────────────────────┤
│ ID du client *                          │
│ [_____2_____]                           │
│                                         │
│ Date de début *    Date de fin *        │
│ [2025-11-18]      [2025-11-24]         │
│                                         │
│ [Semaine courante] [Générer le rapport]│
└─────────────────────────────────────────┘
```

### Modal de détails

```
┌──────────────────────────────────────────────────┐
│ Rapport détaillé                            [✕] │
├──────────────────────────────────────────────────┤
│ Marie Martin                                     │
│ Période: 18/11/2025 - 24/11/2025                │
│ Coach: Jean Dupont                               │
│                                                  │
│ ⚖️ Poids et IMC                                  │
│ ┌────────────────────────────────────────────┐  │
│ │ Poids début: 68.50 kg  Poids fin: 67.80 kg│  │
│ │ Variation: -0.70 kg    IMC actuel: 23.45  │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ 🍽️ Nutrition                                     │
│ ┌────────────────────────────────────────────┐  │
│ │ Repas: 21              Calories: 1850 kcal│  │
│ │ Protéines: 95.5 g      Lipides: 62.3 g   │  │
│ │ Glucides: 210.4 g      Respect: 95.5%    │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ 💪 Activité Physique                             │
│ ┌────────────────────────────────────────────┐  │
│ │ Activités: 5           Jours actifs: 5/7  │  │
│ │ Durée: 240 min         Calories: 1250 kcal│  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ 📈 Analyse                                       │
│ Perte de poids de 0.70 kg. Excellente          │
│ assiduité sportive. Objectifs caloriques       │
│ bien respectés.                                 │
└──────────────────────────────────────────────────┘
```

## Codes couleur

### Variation de poids
- 🟢 Vert : Perte de poids (négatif)
- 🔴 Rouge : Gain de poids (positif)
- ⚪ Gris : Poids stable (0)

### Jours actifs
- 🟢 Vert : 5-7 jours (excellente assiduité)
- 🟡 Jaune : 3-4 jours (bonne régularité)
- 🔴 Rouge : 0-2 jours (à améliorer)

## Utilisation

### Accès à la page
1. Se connecter en tant que coach ou client
2. Cliquer sur "Rapports" dans la navbar
3. La page affiche automatiquement les rapports pertinents

### Générer un rapport (Coach uniquement)

#### Méthode 1 : Période personnalisée
1. Cliquer sur "+ Générer un rapport"
2. Saisir l'ID du client (ex: 2)
3. Choisir la date de début (ex: 2025-11-18)
4. Choisir la date de fin (ex: 2025-11-24)
5. Cliquer sur "Générer le rapport"

#### Méthode 2 : Semaine courante
1. Cliquer sur "+ Générer un rapport"
2. Saisir l'ID du client (ex: 2)
3. Cliquer sur "Semaine courante"
4. Le rapport est généré automatiquement pour la semaine en cours (lundi-dimanche)

### Consulter un rapport
1. Cliquer sur une carte de rapport dans la liste
2. Le modal s'ouvre avec tous les détails
3. Cliquer sur [✕] ou en dehors du modal pour fermer

## API utilisée

Le service communique avec les endpoints suivants :

```typescript
POST   /api/rapports/generer              // Générer un rapport personnalisé
GET    /api/rapports/semaine-courante     // Générer pour la semaine courante
GET    /api/rapports/coach                // Liste des rapports du coach
GET    /api/rapports/client               // Liste des rapports du client
GET    /api/rapports/{id}                 // Détails d'un rapport
```

## Gestion des erreurs

### Messages d'erreur affichés
- "Veuillez remplir tous les champs" - Champs manquants
- "Veuillez saisir l'ID du client" - ID client manquant
- "Erreur lors de la génération du rapport" - Erreur API
- "Erreur lors du chargement des rapports" - Erreur de chargement

### Messages de succès
- "Rapport généré avec succès"
- "Rapport de la semaine courante généré avec succès"

## Responsive Design

L'interface s'adapte automatiquement aux différentes tailles d'écran :

- **Desktop** : Grille de 3 colonnes pour les cartes
- **Tablet** : Grille de 2 colonnes
- **Mobile** : Grille de 1 colonne, formulaire en pleine largeur

## Sécurité

- Authentification JWT requise
- Vérification du rôle (coach/client)
- Les coachs ne peuvent voir que leurs rapports
- Les clients ne peuvent voir que leurs propres rapports
- Token automatiquement ajouté aux requêtes HTTP

## Prochaines améliorations possibles

1. **Filtres et recherche**
   - Filtrer par client
   - Filtrer par période
   - Recherche par nom

2. **Export**
   - Télécharger en PDF
   - Exporter en Excel
   - Envoyer par email

3. **Graphiques**
   - Courbes d'évolution du poids
   - Graphiques de nutrition
   - Diagrammes d'activité

4. **Comparaison**
   - Comparer plusieurs périodes
   - Comparer plusieurs clients
   - Tendances sur plusieurs semaines

5. **Notifications**
   - Alerter le client quand un rapport est généré
   - Rappels hebdomadaires au coach

## Notes techniques

- Composant standalone Angular
- Utilise CommonModule et FormsModule
- Gestion d'état locale (pas de NgRx)
- Appels HTTP via HttpClient
- Formatage des dates avec DatePipe
- Formatage des nombres avec DecimalPipe

## Dépendances

```json
{
  "@angular/common": "^19.x",
  "@angular/core": "^19.x",
  "@angular/forms": "^19.x",
  "@angular/router": "^19.x"
}
```

## Commandes utiles

```bash
# Lancer le serveur de développement
ng serve

# Compiler le projet
ng build

# Accéder à l'application
http://localhost:4200/rapports-progres
```

## Support

Pour toute question ou problème :
1. Vérifier que le backend est démarré (port 8095)
2. Vérifier l'authentification JWT
3. Consulter la console du navigateur pour les erreurs
4. Vérifier les logs du serveur backend
