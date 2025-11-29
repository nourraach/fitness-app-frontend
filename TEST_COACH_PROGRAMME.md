# Guide de Test - Fonctionnalité Coach

## Prérequis

### Base de données
Assurez-vous d'avoir un utilisateur avec le rôle "coach" dans votre base de données :

```sql
-- Vérifier les utilisateurs et leurs rôles
SELECT u.id, u.name, u.email, p.role 
FROM dbuser u 
JOIN profile p ON u.profile_id = p.id;

-- Si nécessaire, créer un coach
INSERT INTO profile (role) VALUES ('coach');
INSERT INTO dbuser (name, email, password, profile_id) 
VALUES ('Coach Test', 'coach@test.com', '$2a$10$...', LAST_INSERT_ID());

-- Ou mettre à jour un utilisateur existant
UPDATE profile SET role = 'coach' WHERE id = (SELECT profile_id FROM dbuser WHERE email = 'votre@email.com');
```

### Backend
Le backend doit être démarré sur `http://localhost:8080` (ou 8095 selon votre configuration)

**Note:** Le backend nécessite Java 17. Si vous avez une erreur "invalid target release: 17", installez Java 17.

### Frontend
Le frontend doit être démarré sur `http://localhost:4200`

## Test de la fonctionnalité

### 1. Connexion en tant que Coach

1. Ouvrir `http://localhost:4200`
2. Se connecter avec les identifiants du coach
3. Après connexion, vous devriez voir dans la navbar un lien "Mes Programmes"

### 2. Vérifier le rôle dans le JWT

Ouvrir la console du navigateur (F12) et taper :

```javascript
// Récupérer le token
const token = localStorage.getItem('jwt');
console.log('Token:', token);

// Décoder le token (partie payload)
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Payload décodé:', payload);
console.log('Rôle:', payload.role);
```

Le rôle devrait être `ROLE_COACH` ou `coach` selon la configuration.

### 3. Accéder à la page de gestion des programmes

1. Cliquer sur "Mes Programmes" dans la navbar
2. Ou naviguer vers `http://localhost:4200/gestion-programmes`

### 4. Interface Coach

Vous devriez voir :
- Un bouton "Créer un Programme" en haut à droite
- La liste de vos programmes (vide au début)

### 5. Créer un programme

1. Cliquer sur "Créer un Programme"
2. Un formulaire modal s'ouvre
3. Remplir :
   - **Client** : Sélectionner un client dans la liste
   - **Nom** : Ex: "Programme Prise de Masse"
   - **Description** : Ex: "Programme intensif de 8 semaines"
   - **Date de début** : Ex: 2025-11-25
   - **Date de fin** : Ex: 2026-01-20

4. Ajouter des exercices :
   - **Nom** : Ex: "Développé couché"
   - **Description** : Ex: "Exercice pour les pectoraux"
   - **Séries** : Ex: 4
   - **Répétitions** : Ex: 10
   - **Durée** : Ex: 0 (ou laisser vide)
   - **Intensité** : Sélectionner "Élevée"
   - **Notes** : Ex: "Augmenter progressivement la charge"
   - Cliquer sur "Ajouter l'Exercice"

5. Répéter pour ajouter d'autres exercices

6. Cliquer sur "Créer"

### 6. Gérer les programmes

Pour chaque programme, vous pouvez :
- ✏️ **Modifier** : Cliquer sur l'icône crayon
- ✅ **Terminer** : Cliquer sur l'icône check (si ACTIF)
- ⏸️ **Suspendre** : Cliquer sur l'icône pause (si ACTIF)
- ▶️ **Réactiver** : Cliquer sur l'icône play (si SUSPENDU)
- 🗑️ **Supprimer** : Cliquer sur l'icône poubelle

## Test en tant que Client

### 1. Connexion en tant que Client

1. Se déconnecter du compte coach
2. Se connecter avec un compte client
3. Naviguer vers "Mes Programmes"

### 2. Interface Client

Vous devriez voir :
- **Pas de bouton** "Créer un Programme"
- La liste des programmes qui vous sont assignés
- Les détails des exercices
- **Pas de boutons** de modification/suppression

## Dépannage

### Le rôle n'est pas détecté

Vérifier dans la console :
```javascript
const token = localStorage.getItem('jwt');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Rôle dans le token:', payload.role);
```

Si le rôle est `undefined`, vérifier :
1. Que le backend génère bien le JWT avec le rôle
2. Que le rôle est bien dans la table `profile`

### Erreur "Seuls les coachs peuvent créer des programmes"

Cela signifie que le backend ne reconnaît pas l'utilisateur comme coach. Vérifier :
1. Le token JWT est valide
2. Le rôle dans la base de données est bien "coach" (minuscules)
3. Le backend vérifie correctement le rôle

### Liste des clients vide

Si la liste déroulante des clients est vide :
1. Vérifier qu'il y a des utilisateurs avec le rôle "client" dans la base
2. Vérifier l'endpoint `/api/users` ou créer un endpoint spécifique pour les clients

### Backend ne démarre pas

Si erreur "invalid target release: 17" :
```bash
# Vérifier la version de Java
java -version

# Installer Java 17 si nécessaire
# Windows: Télécharger depuis https://adoptium.net/
# Linux: sudo apt install openjdk-17-jdk
```

## Endpoints API utilisés

- `POST /api/programmes` - Créer un programme
- `GET /api/programmes/coach` - Liste des programmes du coach
- `GET /api/programmes/client` - Liste des programmes du client
- `GET /api/programmes/{id}` - Détails d'un programme
- `PUT /api/programmes/{id}` - Modifier un programme
- `PATCH /api/programmes/{id}/statut` - Changer le statut
- `DELETE /api/programmes/{id}` - Supprimer un programme

## Structure du JWT

Le token JWT devrait contenir :
```json
{
  "role": "ROLE_COACH",
  "email": "coach@test.com",
  "phoneNumber": "0612345678",
  "sub": "coach@test.com",
  "iat": 1732464000,
  "exp": 1732471200
}
```

## Notes importantes

1. **Rôle dans la base** : Doit être en minuscules ("coach", "client", "admin")
2. **Rôle dans le JWT** : Sera préfixé avec "ROLE_" ("ROLE_COACH", "ROLE_CLIENT", "ROLE_ADMIN")
3. **Détection frontend** : Le code retire automatiquement le préfixe "ROLE_" et normalise en minuscules
4. **Sécurité** : Toutes les vérifications sont faites côté backend, le frontend ne fait que l'affichage

## Améliorations possibles

Si la liste des clients ne fonctionne pas, vous pouvez :
1. Créer un endpoint backend spécifique : `GET /api/users/clients`
2. Ou utiliser des données de test temporaires dans le composant
