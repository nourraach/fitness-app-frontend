# 📊 Fonctionnalité Évolution du Poids

## Description
Cette fonctionnalité permet aux utilisateurs de visualiser l'évolution de leur poids, de leur IMC et de leurs progrès via des graphiques dynamiques.

## Fonctionnalités Implémentées

### 1. Ajout de Mesures de Poids
- ✅ Formulaire pour ajouter une nouvelle mesure de poids
- ✅ Saisie de la date de la mesure
- ✅ Ajout de notes optionnelles
- ✅ Calcul automatique de l'IMC (si la taille est renseignée dans le profil)

### 2. Visualisation Graphique
- ✅ **Graphique d'évolution du poids** : Courbe dynamique avec Chart.js
- ✅ **Graphique d'évolution de l'IMC** : Courbe avec catégories IMC dans les tooltips
- ✅ Ligne d'objectif de poids (si défini dans le profil)
- ✅ Graphiques interactifs avec zoom et tooltips

### 3. Filtres de Période
- ✅ 7 derniers jours
- ✅ 30 derniers jours
- ✅ 3 derniers mois
- ✅ 1 an
- ✅ Toutes les données

### 4. Cartes de Résumé
- ✅ Poids actuel
- ✅ Poids objectif
- ✅ Variation de poids (avec indicateur de tendance)
- ✅ IMC actuel

### 5. Statistiques Détaillées
- ✅ Poids min/max/moyen sur la période
- ✅ Variation totale
- ✅ IMC moyen
- ✅ Nombre d'activités physiques
- ✅ Statistiques de calories (moyennes consommées/brûlées)

### 6. Historique des Mesures
- ✅ Liste chronologique de toutes les mesures
- ✅ Affichage de la date, poids, IMC et notes
- ✅ Suppression de mesures

## Architecture Technique

### Backend (Spring Boot)
```
- Entity: SuiviPoids
- DTOs: SuiviPoidsDTO, AjouterPoidsRequest, EvolutionPoidsDTO, StatistiquesProgressionDTO
- Repository: SuiviPoidsRepository (avec requêtes personnalisées)
- Service: SuiviPoidsService (logique métier + calcul IMC)
- Controller: SuiviPoidsController (endpoints REST)
```

### Frontend (Angular 19)
```
- Component: EvolutionPoidsComponent
- Service: SuiviPoidsService
- Models: suivi-poids.model.ts
- Library: Chart.js pour les graphiques
```

## Endpoints API

### POST `/api/suivi-poids/ajouter`
Ajouter une nouvelle mesure de poids
```json
{
  "poids": 70.5,
  "date": "2024-01-15",
  "notes": "Après les fêtes"
}
```

### GET `/api/suivi-poids/evolution`
Récupérer l'évolution du poids avec statistiques
- Paramètres optionnels: `dateDebut`, `dateFin`

### GET `/api/suivi-poids/statistiques`
Récupérer les statistiques de progression
- Paramètres requis: `dateDebut`, `dateFin`

### GET `/api/suivi-poids/historique`
Récupérer l'historique complet

### DELETE `/api/suivi-poids/{poidsId}`
Supprimer une mesure

## Installation

### 1. Installer Chart.js
```bash
npm install chart.js --legacy-peer-deps
```

### 2. Fichiers créés
- `src/app/models/suivi-poids.model.ts`
- `src/app/service/suivi-poids.service.ts`
- `src/app/evolution-poids/evolution-poids.component.ts`
- `src/app/evolution-poids/evolution-poids.component.html`
- `src/app/evolution-poids/evolution-poids.component.css`

### 3. Route ajoutée
```typescript
{ path: 'evolution-poids', component: EvolutionPoidsComponent }
```

### 4. Navigation
Le lien "Blog" dans la navbar a été remplacé par "Évolution" qui pointe vers `/evolution-poids`

## Utilisation

1. **Accéder à la page** : Cliquer sur "Évolution" dans la navbar
2. **Ajouter une mesure** : Cliquer sur "+ Ajouter une mesure"
3. **Filtrer les données** : Utiliser les boutons de période (7j, 30j, 3m, 1an, Tout)
4. **Consulter les graphiques** : Visualiser l'évolution du poids et de l'IMC
5. **Voir les statistiques** : Consulter les stats détaillées de la période
6. **Gérer l'historique** : Supprimer des mesures si nécessaire

## Calcul de l'IMC
L'IMC est calculé automatiquement selon la formule :
```
IMC = poids (kg) / (taille (m))²
```

### Catégories IMC
- < 18.5 : Insuffisance pondérale
- 18.5 - 24.9 : Poids normal
- 25 - 29.9 : Surpoids
- ≥ 30 : Obésité

## Design
- Interface moderne et responsive
- Graphiques interactifs avec Chart.js
- Cartes de résumé avec icônes
- Indicateurs de tendance (📈 hausse, 📉 baisse, ➡️ stable)
- Couleurs cohérentes avec le thème de l'application

## Points Importants
- La taille doit être renseignée dans le profil pour calculer l'IMC
- Le poids objectif doit être défini dans le profil pour afficher la ligne d'objectif
- Les graphiques s'adaptent automatiquement aux données disponibles
- Les statistiques sont calculées sur la période sélectionnée

## Améliorations Futures Possibles
- Export des données en PDF/Excel
- Comparaison avec d'autres utilisateurs (anonymisé)
- Prédictions basées sur les tendances
- Notifications de rappel pour les pesées
- Intégration avec des balances connectées
