# Gestion des Programmes d'Entraînement Coach-Client

## Vue d'ensemble

Cette fonctionnalité permet aux coachs de créer, gérer et assigner des programmes d'entraînement personnalisés à leurs clients.

## Fichiers créés

### Backend (déjà existant)
- `ProgrammeEntrainement.java` - Entité JPA
- `ProgrammeEntrainementDTO.java` - DTO pour les transferts
- `ExerciceDTO.java` - DTO pour les exercices
- `CreerProgrammeRequest.java` - DTO pour les requêtes de création
- `ProgrammeEntrainementRepository.java` - Repository JPA
- `ProgrammeEntrainementService.java` - Logique métier
- `ProgrammeEntrainementController.java` - API REST

### Frontend (nouveau)

#### Services
- `src/app/services/programme.service.ts` - Service pour communiquer avec l'API des programmes
- `src/app/services/client.service.ts` - Service pour récupérer la liste des clients

#### Modèles
- `src/app/models/programme.model.ts` - Interfaces TypeScript pour les programmes et exercices

#### Composants
- `src/app/gestion-programmes/` - Composant principal pour la gestion des programmes
  - `gestion-programmes.component.ts` - Logique du composant
  - `gestion-programmes.component.html` - Template HTML
  - `gestion-programmes.component.css` - Styles CSS

#### Routes
- Route ajoutée: `/gestion-programmes` dans `app.routes.ts`
- Lien ajouté dans la navbar

## Fonctionnalités

### Pour les Coachs

1. **Créer un programme**
   - Sélectionner un client
   - Définir le nom et la description
   - Définir les dates de début et fin
   - Ajouter des exercices avec:
     - Nom et description
     - Séries et répétitions
     - Durée en minutes
     - Intensité (Faible, Moyenne, Élevée, Maximale)
     - Notes supplémentaires

2. **Voir tous les programmes créés**
   - Liste en grille avec cartes
   - Affichage des informations clés
   - Statut du programme (ACTIF, TERMINE, SUSPENDU, ANNULE)

3. **Modifier un programme**
   - Éditer toutes les informations
   - Ajouter/retirer des exercices

4. **Changer le statut**
   - Terminer un programme actif
   - Suspendre un programme actif
   - Réactiver un programme suspendu

5. **Supprimer un programme**
   - Avec confirmation

### Pour les Clients

1. **Voir les programmes assignés**
   - Liste des programmes créés par leur coach
   - Détails des exercices
   - Dates et statut

## API Endpoints

### POST `/api/programmes`
Créer un nouveau programme (coach uniquement)

**Request:**
```json
{
  "clientId": 2,
  "nom": "Programme Prise de Masse",
  "description": "Programme intensif de 8 semaines",
  "dateDebut": "2025-11-25",
  "dateFin": "2026-01-20",
  "exercices": [
    {
      "nom": "Développé couché",
      "description": "Exercice pour les pectoraux",
      "series": 4,
      "repetitions": 10,
      "intensite": "ELEVEE",
      "notes": "Augmenter progressivement la charge"
    }
  ]
}
```

### GET `/api/programmes/coach`
Récupérer tous les programmes créés par le coach connecté

### GET `/api/programmes/client`
Récupérer tous les programmes assignés au client connecté

### GET `/api/programmes/{id}`
Récupérer un programme spécifique

### PUT `/api/programmes/{id}`
Modifier un programme (coach uniquement)

### PATCH `/api/programmes/{id}/statut`
Changer le statut d'un programme (coach uniquement)

**Request:**
```json
{
  "statut": "TERMINE"
}
```

### DELETE `/api/programmes/{id}`
Supprimer un programme (coach uniquement)

## Utilisation

### Accès
1. Se connecter en tant que coach
2. Cliquer sur "Mes Programmes" dans la navbar
3. Ou naviguer vers `/gestion-programmes`

### Créer un programme
1. Cliquer sur "Créer un Programme"
2. Remplir le formulaire:
   - Sélectionner un client
   - Entrer le nom et la description
   - Définir les dates
3. Ajouter des exercices:
   - Remplir les champs de l'exercice
   - Cliquer sur "Ajouter l'Exercice"
   - Répéter pour chaque exercice
4. Cliquer sur "Créer"

### Gérer un programme
- **Modifier**: Cliquer sur l'icône crayon
- **Changer le statut**: Utiliser les icônes check/pause/play
- **Supprimer**: Cliquer sur l'icône poubelle

## Statuts des programmes

- **ACTIF**: Programme en cours d'exécution
- **TERMINE**: Programme terminé avec succès
- **SUSPENDU**: Programme temporairement suspendu
- **ANNULE**: Programme annulé

## Intensités des exercices

- **FAIBLE**: Intensité légère
- **MOYENNE**: Intensité modérée
- **ELEVEE**: Intensité élevée
- **MAXIMALE**: Intensité maximale

## Notes techniques

### Authentification
- Utilise le token JWT stocké dans localStorage
- Les endpoints vérifient le rôle de l'utilisateur (coach/client)

### Sécurité
- Seuls les coachs peuvent créer/modifier/supprimer des programmes
- Les clients ne peuvent que consulter leurs programmes
- Vérification de propriété côté backend

### Stockage des exercices
- Les exercices sont stockés en JSON dans la base de données
- Conversion automatique entre JSON et objets Java/TypeScript

## Améliorations futures possibles

1. **Suivi de progression**
   - Permettre aux clients de marquer les exercices comme complétés
   - Historique des séances

2. **Notifications**
   - Notifier le client quand un nouveau programme est assigné
   - Rappels pour les séances

3. **Templates de programmes**
   - Sauvegarder des programmes comme templates
   - Dupliquer des programmes existants

4. **Statistiques**
   - Nombre de programmes actifs/terminés
   - Taux de complétion

5. **Commentaires**
   - Permettre aux clients de commenter les exercices
   - Feedback au coach

## Dépendances

### Frontend
- Angular 19
- FormsModule pour les formulaires
- CommonModule pour les directives
- HttpClient pour les appels API

### Backend
- Spring Boot 3.2.2
- Spring Data JPA
- Spring Security
- Jackson pour JSON
- PostgreSQL/MySQL

## Configuration requise

### Backend
- Java 17+
- Base de données avec table `programmes_entrainement`
- Token JWT configuré

### Frontend
- Node.js 18+
- Angular CLI 19+
- Serveur backend démarré sur `http://localhost:8080`

## Démarrage

### Backend
```bash
cd projetFitnessBackend-main
./mvnw spring-boot:run
```

### Frontend
```bash
cd projetFitnessFrontend-main
npm start
```

L'application sera accessible sur `http://localhost:4200`
