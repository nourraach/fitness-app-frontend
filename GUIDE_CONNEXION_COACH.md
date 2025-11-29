# Guide de Connexion - Espace Coach

## 🚀 Démarrage de l'Application

### Étape 1 : Démarrer le Backend
```bash
cd c:\Users\nourr\Documents\workspace-spring-tools-for-eclipse-4.31.0.RELEASE\projetFitnessBackend-main
.\run.cmd
# ou
java -jar target/votre-app.jar
```

**Vérifier que le backend est démarré :**
- URL : `http://localhost:8095`
- Vous devriez voir un message ou une page de confirmation

---

### Étape 2 : Démarrer le Frontend
```bash
cd c:\Angular19\projetFitnessFrontend-main
ng serve
```

**Attendre le message :**
```
✔ Browser application bundle generation complete.
✔ Compiled successfully.
** Angular Live Development Server is listening on localhost:4200 **
```

---

### Étape 3 : Ouvrir l'Application
Ouvrez votre navigateur et allez sur :
```
http://localhost:4200
```

Vous serez automatiquement redirigé vers la page de login.

---

## 👤 Connexion en tant que Coach

### Option 1 : Créer un Compte Coach

1. **Sur la page de login**, cliquez sur "S'inscrire" ou "Register"
2. **Remplissez le formulaire** :
   - Nom : `Coach Test`
   - Email : `coach@test.com`
   - Mot de passe : `Coach123!`
   - **Rôle : COACH** (important !)

3. **Validez le compte** (si nécessaire)
4. **Connectez-vous** avec ces identifiants

---

### Option 2 : Utiliser un Compte Coach Existant

Si vous avez déjà un compte coach dans la base de données :

1. **Allez sur** `http://localhost:4200/login`
2. **Entrez vos identifiants** :
   - Email : `votre-email-coach@example.com`
   - Mot de passe : `votre-mot-de-passe`
3. **Cliquez sur "Se connecter"**

---

### Option 3 : Créer un Coach via la Base de Données

Si vous avez accès à la base de données PostgreSQL :

```sql
-- Insérer un utilisateur coach
INSERT INTO dbuser (name, email, password, role) 
VALUES ('Coach Test', 'coach@test.com', '$2a$10$...', 'ROLE_COACH');

-- Ou mettre à jour un utilisateur existant
UPDATE dbuser 
SET role = 'ROLE_COACH' 
WHERE email = 'votre-email@example.com';
```

**Note :** Le mot de passe doit être hashé avec BCrypt.

---

## ✅ Vérification de la Connexion

### Après connexion réussie, vous devriez :

1. **Être redirigé vers** `/coach-home`
2. **Voir la page d'accueil coach** avec :
   - Message "Bienvenue, Coach 👋"
   - Date du jour
   - 4 cartes de statistiques
   - Activités récentes
   - Actions rapides

3. **Voir la navbar simplifiée** avec seulement :
   - 🏠 Accueil
   - 📅 Programmes
   - 👤 Profil (menu déroulant)

---

## 🔍 Dépannage

### Problème : Redirigé vers `/home` au lieu de `/coach-home`

**Cause :** Le rôle n'est pas correctement défini comme "COACH"

**Solution :**
1. Vérifiez le rôle dans la base de données :
```sql
SELECT id, name, email, role FROM dbuser WHERE email = 'votre-email@example.com';
```

2. Le rôle doit être exactement : `ROLE_COACH` ou `coach`

3. Si ce n'est pas le cas, mettez à jour :
```sql
UPDATE dbuser SET role = 'ROLE_COACH' WHERE email = 'votre-email@example.com';
```

---

### Problème : Erreur "Cannot match any routes"

**Cause :** La route `/coach-home` n'est pas reconnue

**Solution :**
1. Vérifiez que le fichier `app.routes.ts` contient :
```typescript
{ path: 'coach-home', component: CoachHomeComponent }
```

2. Redémarrez le serveur Angular :
```bash
Ctrl + C
ng serve
```

---

### Problème : La navbar affiche tous les menus

**Cause :** La détection du rôle ne fonctionne pas

**Solution :**
1. Ouvrez la console du navigateur (F12)
2. Tapez :
```javascript
localStorage.getItem('jwt')
```

3. Vérifiez que le token JWT contient le rôle COACH

4. Si le token est absent ou invalide, reconnectez-vous

---

### Problème : Erreur 401 ou 403

**Cause :** Token JWT expiré ou invalide

**Solution :**
1. Déconnectez-vous
2. Reconnectez-vous
3. Le nouveau token sera généré

---

## 🧪 Test Complet

### Checklist de Test

1. **Connexion**
   - [ ] Je peux me connecter avec un compte coach
   - [ ] Je suis redirigé vers `/coach-home`
   - [ ] La page d'accueil coach s'affiche

2. **Navbar**
   - [ ] Je vois uniquement : Accueil, Programmes, Profil
   - [ ] Je ne vois PAS : Nutrition, Évolution, Suivi, etc.
   - [ ] Le menu profil fonctionne

3. **Page d'Accueil**
   - [ ] Les statistiques s'affichent (4 cartes)
   - [ ] Les activités récentes s'affichent (5 items)
   - [ ] Les boutons d'actions rapides fonctionnent
   - [ ] Les barres de progression s'affichent

4. **Navigation**
   - [ ] Cliquer sur "Programmes" → `/gestion-programmes`
   - [ ] Cliquer sur "Accueil" → `/coach-home`
   - [ ] Cliquer sur "Profil" → Menu déroulant
   - [ ] Cliquer sur "Mon Profil" → `/profile`
   - [ ] Cliquer sur "Déconnexion" → `/login`

---

## 📝 Identifiants de Test Suggérés

### Compte Coach
```
Email: coach@fitness.com
Mot de passe: Coach123!
Rôle: ROLE_COACH
```

### Compte User (pour comparaison)
```
Email: user@fitness.com
Mot de passe: User123!
Rôle: ROLE_USER
```

---

## 🎯 Workflow de Test Complet

### 1. Test Coach
```
1. Se connecter avec compte coach
2. Vérifier redirection vers /coach-home
3. Vérifier navbar (3 éléments)
4. Vérifier statistiques aléatoires
5. Cliquer sur "Programmes"
6. Revenir à l'accueil
7. Se déconnecter
```

### 2. Test User (Comparaison)
```
1. Se connecter avec compte user
2. Vérifier redirection vers /home
3. Vérifier navbar complète (8+ éléments)
4. Vérifier que l'interface est différente
5. Se déconnecter
```

### 3. Test Alternance
```
1. Se connecter en tant que coach
2. Vérifier l'interface coach
3. Se déconnecter
4. Se connecter en tant que user
5. Vérifier l'interface user
6. Confirmer que les interfaces sont bien séparées
```

---

## 🔐 Sécurité

### Token JWT
Le token JWT contient :
- `sub` : Email de l'utilisateur
- `role` : Rôle (ROLE_COACH, ROLE_USER, ROLE_ADMIN)
- `exp` : Date d'expiration

### Vérification du Token
Pour voir le contenu du token :
1. Allez sur https://jwt.io
2. Collez votre token (depuis localStorage)
3. Vérifiez que le rôle est bien "ROLE_COACH"

---

## 📞 Support

### En cas de problème persistant

1. **Vérifier les logs backend** :
   - Console où le backend tourne
   - Chercher les erreurs d'authentification

2. **Vérifier les logs frontend** :
   - Console du navigateur (F12)
   - Onglet "Console"
   - Chercher les erreurs JavaScript

3. **Vérifier la base de données** :
```sql
-- Voir tous les utilisateurs et leurs rôles
SELECT id, name, email, role FROM dbuser;

-- Voir les profils
SELECT u.name, u.email, u.role, p.role as profile_role 
FROM dbuser u 
LEFT JOIN profile p ON u.id = p.user_id;
```

4. **Nettoyer le cache** :
   - Vider le localStorage : `localStorage.clear()`
   - Vider le cache du navigateur
   - Redémarrer le navigateur

---

## 🎉 Succès !

Si tout fonctionne, vous devriez voir :

```
╔════════════════════════════════════════════════════╗
║  Bienvenue, Coach 👋                               ║
║  lundi 24 novembre 2025                            ║
╚════════════════════════════════════════════════════╝

[Statistiques avec données aléatoires]
[Activités récentes]
[Actions rapides]
[Vue d'ensemble]
```

**Félicitations ! L'espace coach fonctionne ! 🚀**
