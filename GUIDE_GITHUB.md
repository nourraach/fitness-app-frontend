# Guide - Pousser le Projet sur GitHub

## 📋 Prérequis

1. **Compte GitHub** : Créez un compte sur https://github.com si vous n'en avez pas
2. **Git installé** : Vérifiez avec `git --version`

---

## 🚀 Étapes pour Pousser le Frontend

### 1. Créer un Repository sur GitHub

1. Allez sur https://github.com
2. Cliquez sur le bouton **"New"** ou **"+"** → **"New repository"**
3. Remplissez :
   - **Repository name** : `fitness-app-frontend` (ou le nom de votre choix)
   - **Description** : "Application de fitness - Frontend Angular"
   - **Public** ou **Private** : Choisissez selon vos préférences
   - **NE PAS** cocher "Initialize with README" (vous en avez déjà un)
4. Cliquez sur **"Create repository"**

### 2. Initialiser Git (si pas déjà fait)

Ouvrez un terminal dans le dossier frontend :

```bash
cd c:\Angular19\projetFitnessFrontend-main
```

Vérifiez si Git est déjà initialisé :
```bash
git status
```

Si ce n'est pas un repository Git, initialisez-le :
```bash
git init
```

### 3. Configurer Git (première fois seulement)

```bash
git config --global user.name "Votre Nom"
git config --global user.email "votre-email@example.com"
```

### 4. Ajouter tous les fichiers

```bash
git add .
```

### 5. Créer le premier commit

```bash
git commit -m "Initial commit - Fitness App Frontend avec espace coach"
```

### 6. Lier au Repository GitHub

Remplacez `VOTRE-USERNAME` et `VOTRE-REPO` par vos informations :

```bash
git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
```

Exemple :
```bash
git remote add origin https://github.com/johndoe/fitness-app-frontend.git
```

### 7. Pousser le code

```bash
git branch -M main
git push -u origin main
```

**Note :** GitHub vous demandera de vous authentifier. Utilisez un **Personal Access Token** au lieu du mot de passe.

---

## 🔐 Créer un Personal Access Token (PAT)

GitHub n'accepte plus les mots de passe pour l'authentification. Vous devez créer un token :

1. Allez sur GitHub → **Settings** (votre profil)
2. **Developer settings** (en bas à gauche)
3. **Personal access tokens** → **Tokens (classic)**
4. **Generate new token** → **Generate new token (classic)**
5. Donnez un nom : "Fitness App"
6. Cochez les permissions :
   - ✅ **repo** (tous les sous-éléments)
7. Cliquez sur **Generate token**
8. **COPIEZ LE TOKEN** (vous ne pourrez plus le voir après)

Lors du push, utilisez :
- **Username** : Votre nom d'utilisateur GitHub
- **Password** : Le token que vous venez de copier

---

## 🔄 Pousser le Backend

Répétez les mêmes étapes pour le backend :

### 1. Créer un nouveau repository sur GitHub
- Nom : `fitness-app-backend`
- Description : "Application de fitness - Backend Spring Boot"

### 2. Dans le terminal

```bash
cd c:\Users\nourr\Documents\workspace-spring-tools-for-eclipse-4.31.0.RELEASE\projetFitnessBackend-main

git init
git add .
git commit -m "Initial commit - Fitness App Backend avec API coach"
git remote add origin https://github.com/VOTRE-USERNAME/fitness-app-backend.git
git branch -M main
git push -u origin main
```

---

## 📝 Fichiers à Ignorer

### Frontend - Vérifier `.gitignore`

Assurez-vous que votre `.gitignore` contient :

```
# Dependencies
/node_modules

# Build
/dist
/.angular

# IDE
.vscode
.idea
*.swp
*.swo

# Environment
.env
.env.local

# OS
.DS_Store
Thumbs.db
```

### Backend - Vérifier `.gitignore`

Assurez-vous que votre `.gitignore` contient :

```
# Compiled
/target
*.class

# IDE
.idea
.vscode
*.iml
.settings
.classpath
.project

# Environment
.env
application-local.properties

# OS
.DS_Store
Thumbs.db
```

---

## 🔄 Commandes Git Utiles

### Après avoir fait des modifications

```bash
# Voir les fichiers modifiés
git status

# Ajouter tous les fichiers modifiés
git add .

# Créer un commit
git commit -m "Description des modifications"

# Pousser vers GitHub
git push
```

### Créer une nouvelle branche

```bash
# Créer et basculer sur une nouvelle branche
git checkout -b feature/nouvelle-fonctionnalite

# Pousser la branche
git push -u origin feature/nouvelle-fonctionnalite
```

### Mettre à jour depuis GitHub

```bash
# Récupérer les dernières modifications
git pull
```

---

## 📦 Structure Recommandée sur GitHub

### Option 1 : Deux Repositories Séparés
```
github.com/VOTRE-USERNAME/fitness-app-frontend
github.com/VOTRE-USERNAME/fitness-app-backend
```

**Avantages :**
- Séparation claire frontend/backend
- Gestion des permissions indépendante
- Déploiement séparé

### Option 2 : Un Repository Monorepo
```
github.com/VOTRE-USERNAME/fitness-app
  ├── frontend/
  └── backend/
```

**Avantages :**
- Tout au même endroit
- Un seul clone
- Historique unifié

---

## 📄 Créer un README Principal

Créez un fichier `README.md` à la racine :

```markdown
# 🏋️ Fitness App - Application de Gestion de Fitness

Application complète de gestion de fitness avec espace coach et client.

## 🚀 Technologies

### Frontend
- Angular 19
- TypeScript
- PrimeNG
- RxJS

### Backend
- Spring Boot 3
- Java 17
- PostgreSQL
- JWT Authentication

## ✨ Fonctionnalités

### Espace Client
- Gestion des programmes d'entraînement
- Suivi nutritionnel
- Évolution du poids
- Suivi des activités physiques
- Notifications

### Espace Coach
- Tableau de bord avec statistiques
- Gestion des programmes clients
- Rapports de progrès hebdomadaires
- Interface dédiée et simplifiée

## 🛠️ Installation

### Frontend
\`\`\`bash
cd frontend
npm install
ng serve
\`\`\`

### Backend
\`\`\`bash
cd backend
./mvnw spring-boot:run
\`\`\`

## 📝 Configuration

### Base de données
- PostgreSQL 14+
- Créer une base de données `fitness_db`
- Configurer dans `application.properties`

### Variables d'environnement
- JWT_SECRET
- DB_URL
- DB_USERNAME
- DB_PASSWORD

## 🎯 Accès

- Frontend : http://localhost:4200
- Backend : http://localhost:8095

## 👥 Rôles

- **ROLE_USER** : Client standard
- **ROLE_COACH** : Coach avec interface dédiée
- **ROLE_ADMIN** : Administrateur

## 📸 Screenshots

[Ajoutez des captures d'écran ici]

## 📄 License

MIT License

## 👨‍💻 Auteur

Votre Nom
\`\`\`

---

## 🎯 Commandes Rapides

### Premier Push (Frontend)
```bash
cd c:\Angular19\projetFitnessFrontend-main
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/VOTRE-USERNAME/fitness-app-frontend.git
git branch -M main
git push -u origin main
```

### Premier Push (Backend)
```bash
cd c:\Users\nourr\Documents\workspace-spring-tools-for-eclipse-4.31.0.RELEASE\projetFitnessBackend-main
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/VOTRE-USERNAME/fitness-app-backend.git
git branch -M main
git push -u origin main
```

---

## ⚠️ Attention

### Ne PAS pousser sur GitHub :
- ❌ `node_modules/` (frontend)
- ❌ `target/` (backend)
- ❌ Fichiers de configuration avec mots de passe
- ❌ Clés API ou secrets
- ❌ Fichiers `.env`

### Vérifier avant de pousser :
```bash
git status
```

---

## 🆘 Problèmes Courants

### "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/VOTRE-USERNAME/VOTRE-REPO.git
```

### "Authentication failed"
- Utilisez un Personal Access Token au lieu du mot de passe
- Vérifiez que le token a les bonnes permissions

### "Permission denied"
- Vérifiez que vous êtes le propriétaire du repository
- Vérifiez vos permissions sur GitHub

---

## 🎉 C'est Fait !

Votre projet est maintenant sur GitHub ! 🚀

Vous pouvez le partager avec :
```
https://github.com/VOTRE-USERNAME/fitness-app-frontend
https://github.com/VOTRE-USERNAME/fitness-app-backend
```
