# 🏋️ Health & Fitness - Site Web

Application Angular complète pour un site de santé et fitness avec programmes d'entraînement, plans nutritionnels et suivi de progression.

## 🎯 Fonctionnalités

### ✅ Implémenté
- ✅ Page d'accueil moderne et responsive
- ✅ Navbar avec menu complet (7 sections)
- ✅ Section Hero avec appel à l'action
- ✅ Présentation des avantages
- ✅ Catalogue de repas santé
- ✅ Calculateur de calories
- ✅ Section "Comment ça marche"
- ✅ FAQ interactive
- ✅ Menu utilisateur avec dropdown
- ✅ Design responsive (mobile, tablette, desktop)
- ✅ Animations et transitions fluides
- ✅ Tout le contenu en français

### 🔜 À implémenter
- ⏳ Page Programmes (workouts)
- ⏳ Page Nutrition (recettes, meal plans)
- ⏳ Page Blog (articles)
- ⏳ Dashboard (suivi progression)
- ⏳ Page Contact
- ⏳ Page Profil utilisateur
- ⏳ Menu mobile (burger menu)
- ⏳ Connexion backend Spring Boot

## 🚀 Démarrage rapide

### 1. Installation
```bash
npm install
```

### 2. Lancer l'application
```bash
npm start
```
Ouvrez http://localhost:4200

### 3. Générer les pages manquantes (optionnel)
```powershell
.\generate-pages.ps1
```

## 📋 Menu de navigation

### Menu principal
1. **Accueil** - Page d'accueil avec présentation
2. **Programmes** - Programmes d'entraînement et workouts
3. **Nutrition** - Recettes, calories et meal plans
4. **Blog** - Articles santé et fitness
5. **Suivi** - Dashboard de progression
6. **Contact** - Formulaire de contact
7. **Utilisateurs** - Gestion (admin uniquement)

### Menu utilisateur (dropdown)
- Mon Profil
- Déconnexion

## 🎨 Design

### Palette de couleurs
- **Vert principal** : #4CAF50
- **Vert clair** : #81C784
- **Vert foncé** : #388E3C
- **Texte foncé** : #2C3E50
- **Texte clair** : #7F8C8D
- **Fond clair** : #F8F9FA

### Typographie
- Police principale : Segoe UI, Tahoma, Geneva, Verdana, sans-serif
- Titres : 800 (extra-bold)
- Texte normal : 500 (medium)

### Responsive
- **Desktop** (> 1200px) : Menu complet avec texte
- **Tablette** (768px - 1200px) : Icônes uniquement
- **Mobile** (< 768px) : Menu burger (à implémenter)

## 📁 Structure du projet

```
src/
├── app/
│   ├── home/                    # Page d'accueil ✅
│   ├── navbar/                  # Barre de navigation ✅
│   ├── pages/                   # Pages à créer ⏳
│   │   ├── programmes/
│   │   ├── nutrition/
│   │   ├── blog/
│   │   ├── dashboard/
│   │   ├── contact/
│   │   └── profile/
│   ├── components/              # Composants existants
│   │   ├── login/
│   │   ├── register/
│   │   └── gest-users/
│   ├── service/                 # Services
│   └── guards/                  # Guards de route
├── assets/
│   └── images/                  # Images du site
└── styles.css                   # Styles globaux
```

## 🖼️ Images nécessaires

Placez vos images dans `src/assets/images/` :

### Images principales
- **hero-bowl.jpg** (500x500px) - Image hero principale
- **clock.jpg** (120x120px) - Icône gain de temps
- **avocado.jpg** (120x120px) - Icône nutrition
- **dumbbells.jpg** (120x120px) - Icône entraînement
- **measuring-tape.jpg** (120x120px) - Icône suivi
- **ball.jpg** (120x120px) - Icône communauté
- **meal1.jpg à meal4.jpg** (300x200px) - Photos de repas
- **vegetables.jpg** (600x400px) - Image section "Comment ça marche"
- **contact.jpg** (400x250px) - Image contact

### Télécharger des images placeholder
```powershell
.\download-placeholder-images.ps1
```

## 🔧 Commandes utiles

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm start

# Compiler pour la production
npm run build

# Générer un nouveau composant
ng generate component pages/nom-page

# Générer un service
ng generate service services/nom-service

# Générer un guard
ng generate guard guards/nom-guard
```

## 📝 Personnalisation

### Modifier les repas
Éditez `src/app/home/home.component.ts` :
```typescript
meals: Meal[] = [
  {
    name: 'Nom du repas',
    description: 'Description',
    price: 12.90,
    image: 'assets/images/meal.jpg'
  }
]
```

### Modifier les FAQ
Éditez `src/app/home/home.component.ts` :
```typescript
faqs: FAQ[] = [
  {
    question: 'Votre question ?',
    answer: 'Votre réponse',
    open: false
  }
]
```

### Changer les couleurs
Éditez `src/app/home/home.component.css` :
```css
:root {
  --primary-green: #4CAF50;    /* Votre couleur */
  --light-green: #81C784;
  --dark-green: #388E3C;
}
```

## 🔗 Intégration Backend

### Créer les services API
```bash
ng generate service services/workout
ng generate service services/nutrition
ng generate service services/user
```

### Configuration CORS (Spring Boot)
```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:4200")
                        .allowedMethods("GET", "POST", "PUT", "DELETE")
                        .allowedHeaders("*");
            }
        };
    }
}
```

Consultez `INTEGRATION-BACKEND.md` pour plus de détails.

## 🛠️ Technologies utilisées

- **Angular 19** - Framework frontend
- **TypeScript** - Langage de programmation
- **Bootstrap 5** - Framework CSS
- **PrimeNG** - Bibliothèque de composants UI
- **PrimeIcons** - Icônes
- **RxJS** - Programmation réactive

## 📚 Documentation

- **MISE-A-JOUR.md** - Détails des modifications
- **GUIDE-FRONTEND.md** - Guide complet du frontend
- **INTEGRATION-BACKEND.md** - Intégration Spring Boot
- **INSTRUCTIONS-RAPIDES.md** - Guide de démarrage

## 🐛 Problèmes courants

### Les images ne s'affichent pas
- Vérifiez que les images sont dans `src/assets/images/`
- Exécutez `.\download-placeholder-images.ps1`

### Erreur de navigation
- Vérifiez que les routes sont configurées dans `app.routes.ts`
- Vérifiez que les composants sont importés

### Le style ne s'applique pas
- Redémarrez le serveur de développement
- Vérifiez que Bootstrap et PrimeIcons sont importés dans `styles.css`

## 📞 Support

Pour toute question :
- Documentation Angular : https://angular.dev/
- Documentation Bootstrap : https://getbootstrap.com/
- Documentation PrimeNG : https://primeng.org/

## 📄 Licence

Ce projet est sous licence MIT.

---

**Développé avec ❤️ pour votre transformation fitness ! 💪**
