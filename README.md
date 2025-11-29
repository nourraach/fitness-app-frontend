# Site Web Santé et Fitness 🥗💪

Application Angular pour un site de santé et fitness avec gestion de régimes alimentaires et programmes d'entraînement.

## 🎨 Aperçu

Page d'accueil moderne avec :
- Section hero avec image circulaire
- Présentation des avantages (économie de temps, santé, fitness)
- Catalogue de repas avec filtres
- Calculateur de calories
- Section "Comment ça marche"
- FAQ interactive

## 🚀 Démarrage rapide

### 1. Installer les dépendances
```bash
npm install
```

### 2. Télécharger les images placeholder (optionnel)
```powershell
.\download-placeholder-images.ps1
```

### 3. Lancer le serveur de développement
```bash
npm start
# ou
ng serve
```

Ouvrez votre navigateur sur `http://localhost:4200/`

## 📁 Structure du projet

```
src/
├── app/
│   ├── home/              # Page d'accueil principale
│   ├── navbar/            # Barre de navigation
│   ├── components/        # Autres composants
│   └── service/           # Services Angular
├── assets/
│   └── images/            # Images du site
└── styles.css             # Styles globaux
```

## 🖼️ Images à remplacer

Consultez `src/assets/images/README.md` pour la liste complète des images nécessaires.

**Images principales :**
- hero-bowl.jpg (500x500px)
- clock.jpg, avocado.jpg, dumbbells.jpg, measuring-tape.jpg, ball.jpg (120x120px)
- meal1.jpg à meal4.jpg (300x200px)
- vegetables.jpg (600x400px)
- contact.jpg (400x250px)

## 🎨 Personnalisation

### Modifier les repas
Éditez `src/app/home/home.component.ts` :
```typescript
meals: Meal[] = [
  {
    name: 'Nom du repas',
    description: 'Description',
    price: 450,
    image: 'assets/images/meal1.jpg'
  }
]
```

### Modifier les couleurs
Éditez `src/app/home/home.component.css` :
```css
:root {
  --primary-green: #4CAF50;
  --light-green: #81C784;
  --dark-green: #388E3C;
}
```

## 📱 Responsive

Le design est entièrement responsive :
- Desktop : > 992px
- Tablette : 768px - 992px
- Mobile : < 768px

## 🛠️ Technologies

- **Angular 19** - Framework frontend
- **Bootstrap 5** - Grille responsive
- **PrimeNG** - Composants UI
- **TypeScript** - Langage de programmation

## 📚 Documentation

Consultez `GUIDE-FRONTEND.md` pour plus de détails sur la structure et la personnalisation.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
