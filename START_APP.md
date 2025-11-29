# 🚀 Démarrage Rapide de l'Application

## Commandes Rapides

### 1. Démarrer le Backend (Terminal 1)
```bash
cd c:\Users\nourr\Documents\workspace-spring-tools-for-eclipse-4.31.0.RELEASE\projetFitnessBackend-main
.\run.cmd
```

### 2. Démarrer le Frontend (Terminal 2)
```bash
cd c:\Angular19\projetFitnessFrontend-main
ng serve
```

### 3. Ouvrir l'Application
```
http://localhost:4200
```

---

## 🔑 Identifiants de Test

### Se connecter en tant que Coach

**Option A : Créer un nouveau compte**
1. Cliquez sur "S'inscrire"
2. Remplissez :
   - Nom : `Coach Test`
   - Email : `coach@test.com`
   - Mot de passe : `Coach123!`
   - **Rôle : COACH**
3. Connectez-vous

**Option B : Utiliser un compte existant**
- Email : `[votre-email-coach]`
- Mot de passe : `[votre-mot-de-passe]`

---

## ✅ Ce que vous devriez voir

### Après connexion en tant que Coach :

1. **URL** : `http://localhost:4200/coach-home`

2. **Navbar** (en haut) :
   ```
   [Accueil] [Programmes] [Profil ▼]
   ```

3. **Page d'accueil** :
   - Message de bienvenue
   - 4 cartes de statistiques
   - Activités récentes
   - Actions rapides
   - Vue d'ensemble

---

## 🎯 Navigation Coach

### Depuis la navbar :
- **Accueil** → Retour au tableau de bord
- **Programmes** → Gérer les programmes des clients
- **Profil** → Menu déroulant
  - Mon Profil
  - Déconnexion

### Depuis la page d'accueil :
- **Bouton "Gérer les Programmes"** → `/gestion-programmes`
- **Bouton "Mon Profil"** → `/profile`

---

## 🔄 Comparer avec un User Normal

### Se connecter en tant que User :
1. Déconnectez-vous du compte coach
2. Connectez-vous avec un compte user
3. Vous verrez :
   - URL : `http://localhost:4200/home`
   - Navbar complète avec tous les menus
   - Interface différente

---

## 🐛 Problèmes Courants

### "Cannot GET /coach-home"
→ Le frontend n'est pas démarré. Lancez `ng serve`

### "Connection refused" ou erreur 500
→ Le backend n'est pas démarré. Lancez `.\run.cmd`

### Redirigé vers `/home` au lieu de `/coach-home`
→ Le compte n'a pas le rôle COACH. Vérifiez dans la base de données.

### La navbar affiche tous les menus
→ Le rôle n'est pas détecté. Reconnectez-vous.

---

## 📊 Vérification Rapide

### Dans la console du navigateur (F12) :
```javascript
// Vérifier le token
localStorage.getItem('jwt')

// Vérifier l'URL actuelle
window.location.href

// Nettoyer et recommencer
localStorage.clear()
location.reload()
```

---

## 🎉 Tout Fonctionne !

Si vous voyez la page d'accueil coach avec les statistiques, félicitations ! 🎊

L'espace coach est opérationnel et prêt à être utilisé.

---

## 📞 Besoin d'Aide ?

Consultez le guide complet : `GUIDE_CONNEXION_COACH.md`
