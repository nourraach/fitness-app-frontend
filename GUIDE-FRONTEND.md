# Guide Frontend - Site Santé et Fitness

## 📁 Structure du projet

```
src/
├── app/
│   ├── home/                    # Page d'accueil principale
│   │   ├── home.component.html  # Template HTML
│   │   ├── home.component.css   # Styles
│   │   └── home.component.ts    # Logique TypeScript
│   ├── navbar/                  # Barre de navigation
│   └── ...
├── assets/
│   └── images/                  # Dossier des images
└── styles.css                   # Styles globaux
```

## 🎨 Sections de la page d'accueil

### 1. Section Hero
- Titre principal avec texte en russe
- Bouton d'appel à l'action
- 3 caractéristiques (Écologique, Sain, Délicieux)
- Image circulaire du bol de nourriture

### 2. Section "Pourquoi" (Зачем это нужно?)
- 5 cartes avec icônes :
  - Économie de temps
  - Sans graisses nocives
  - Programmes fitness
  - Contrôle des calories
  - Mode de vie actif

### 3. Section "Choisir un régime" (Выберите рацион)
- Filtres par type de régime
- Sélection de calories
- Grille de repas avec images
- Calculateur de calories (formulaire)

### 4. Section "Comment ça marche" (Как это работает)
- 4 étapes du processus
- Image de légumes frais

### 5. Section FAQ (Вопрос — ответ)
- Questions/réponses accordéon
- Carte de contact

## 🖼️ Images à remplacer

Consultez le fichier `src/assets/images/README.md` pour la liste complète des images nécessaires.

### Images principales :
1. **hero-bowl.jpg** - Bol de nourriture saine (500x500px)
2. **clock.jpg, avocado.jpg, dumbbells.jpg, measuring-tape.jpg, ball.jpg** - Icônes (120x120px)
3. **meal1.jpg à meal4.jpg** - Photos de repas (300x200px)
4. **vegetables.jpg** - Légumes frais (600x400px)
5. **contact.jpg** - Image de contact (400x250px)

## 🎨 Palette de couleurs

```css
--primary-green: #4CAF50    /* Vert principal */
--light-green: #81C784      /* Vert clair */
--dark-green: #388E3C       /* Vert foncé */
--text-dark: #2C3E50        /* Texte foncé */
--text-light: #7F8C8D       /* Texte clair */
--bg-light: #F8F9FA         /* Fond clair */
```

## 🚀 Lancer le projet

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm start

# Ouvrir dans le navigateur
http://localhost:4200
```

## 📝 Personnalisation

### Modifier les textes
Éditez `src/app/home/home.component.ts` pour changer :
- Les repas (tableau `meals`)
- Les questions FAQ (tableau `faqs`)

### Modifier les styles
Éditez `src/app/home/home.component.css` pour personnaliser :
- Les couleurs
- Les espacements
- Les animations
- Le responsive

### Ajouter des fonctionnalités
Le composant utilise Angular 19 avec :
- CommonModule pour les directives (*ngFor, *ngIf)
- Bootstrap 5 pour la grille responsive
- PrimeIcons pour les icônes

## 🔗 Navigation

La navbar contient des liens d'ancrage :
- #why → Section "Pourquoi"
- #ration → Section "Régimes"
- #how → Section "Comment ça marche"
- #faq → Section FAQ

## 📱 Responsive

Le design est entièrement responsive avec des breakpoints :
- Desktop : > 992px
- Tablette : 768px - 992px
- Mobile : < 768px

## 🛠️ Technologies utilisées

- **Angular 19** - Framework frontend
- **Bootstrap 5** - Grille et composants
- **PrimeNG** - Bibliothèque de composants UI
- **PrimeIcons** - Icônes
- **TypeScript** - Langage de programmation

## 📞 Support

Pour toute question, consultez la documentation Angular :
https://angular.dev/
