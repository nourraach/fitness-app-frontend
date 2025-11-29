# Guide de Débogage - Erreur d'enregistrement dans Suivi

## Modifications apportées

J'ai amélioré la gestion des erreurs dans le composant Suivi pour afficher des messages plus détaillés.

### 1. Logs détaillés ajoutés

Les fonctions `enregistrerRepas()` et `enregistrerActivite()` affichent maintenant :
- La requête envoyée au backend
- Le statut HTTP de l'erreur
- Le message d'erreur complet

### 2. Headers HTTP corrigés

Ajout du header `Content-Type: application/json` dans les services pour s'assurer que le backend reçoit les données au bon format.

## Comment déboguer

### Étape 1 : Ouvrir la console du navigateur
1. Appuyez sur F12 dans votre navigateur
2. Allez dans l'onglet "Console"

### Étape 2 : Tester l'enregistrement
1. Essayez d'enregistrer un repas ou une activité
2. Regardez les messages dans la console

### Étape 3 : Identifier le problème

#### Si vous voyez "Status: 0"
- Le backend n'est pas démarré ou n'est pas accessible
- Vérifiez que votre serveur backend tourne sur http://localhost:8095

#### Si vous voyez "Status: 401"
- Problème d'authentification
- Votre token JWT est expiré ou invalide
- Solution : Déconnectez-vous et reconnectez-vous

#### Si vous voyez "Status: 400"
- Les données envoyées sont invalides
- Vérifiez dans la console la requête envoyée
- Comparez avec ce que le backend attend

#### Si vous voyez "Status: 500"
- Erreur côté serveur backend
- Vérifiez les logs du backend Java

## Vérifications à faire

### 1. Backend démarré ?
```bash
# Vérifiez que le backend tourne
curl http://localhost:8095/api/repas/aliments
```

### 2. Token JWT valide ?
Ouvrez la console et tapez :
```javascript
localStorage.getItem('jwt')
```
Si c'est null, reconnectez-vous.

### 3. Format de date correct ?
La date doit être au format : `YYYY-MM-DD` (ex: 2025-11-18)

## Problèmes courants

### Problème 1 : CORS
Si vous voyez une erreur CORS, le backend doit autoriser les requêtes depuis http://localhost:4200

### Problème 2 : Endpoints incorrects
Vérifiez que le backend expose bien ces endpoints :
- POST `/api/repas/creer`
- POST `/api/activites/creer`

### Problème 3 : Structure de données
Le backend attend :

**Pour un repas :**
```json
{
  "nom": "Petit-déjeuner",
  "date": "2025-11-18",
  "typeRepas": "PETIT_DEJEUNER",
  "aliments": [
    {
      "alimentId": 1,
      "quantite": 1,
      "portion": 100
    }
  ]
}
```

**Pour une activité :**
```json
{
  "typeActivite": "Course à pied",
  "dureeMinutes": 30,
  "intensite": "MODEREE",
  "date": "2025-11-18"
}
```

## Prochaines étapes

1. Testez l'enregistrement avec la console ouverte
2. Notez le message d'erreur exact
3. Vérifiez les logs du backend
4. Si le problème persiste, partagez les logs de la console
