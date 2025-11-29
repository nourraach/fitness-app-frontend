# 🚀 Instructions Rapides - Site Santé et Fitness

## ✅ Ce qui a été fait

### 1. Page d'accueil complète (home.component)
- ✅ Section Hero avec titre en russe et image circulaire
- ✅ Section "Pourquoi" avec 5 cartes d'avantages
- ✅ Section "Choisir un régime" avec filtres et catalogue de repas
- ✅ Calculateur de calories intégré
- ✅ Section "Comment ça marche" avec 4 étapes
- ✅ Section FAQ avec accordéon interactif
- ✅ Design responsive (mobile, tablette, desktop)

### 2. Navbar modernisée
- ✅ Logo avec icône
- ✅ Navigation avec ancres
- ✅ Panier d'achat
- ✅ Bouton de déconnexion

### 3. Styles et design
- ✅ Palette de couleurs verte (#4CAF50)
- ✅ Animations et transitions
- ✅ Design moderne et épuré

## 📋 Prochaines étapes

### 1. Remplacer les images (IMPORTANT)
```powershell
# Option 1 : Télécharger des images placeholder
.\download-placeholder-images.ps1

# Option 2 : Ajouter vos propres images dans src/assets/images/
# Consultez src/assets/images/README.md pour la liste
```

**Images nécessaires :**
- hero-bowl.jpg (500x500px)
- clock.jpg, avocado.jpg, dumbbells.jpg, measuring-tape.jpg, ball.jpg (120x120px)
- meal1.jpg à meal4.jpg (300x200px)
- vegetables.jpg (600x400px)
- contact.jpg (400x250px)

### 2. Tester l'application
```bash
npm install
npm start
```
Ouvrez http://localhost:4200

### 3. Personnaliser les textes
Éditez `src/app/home/home.component.ts` :
- Modifier les repas (tableau `meals`)
- Modifier les FAQ (tableau `faqs`)

### 4. Connecter au backend Spring Boot
Consultez `INTEGRATION-BACKEND.md` pour :
- Créer les services Angular
- Configurer les appels API
- Mettre en place CORS
- Créer les contrôleurs Spring Boot

## 📁 Fichiers créés/modifiés

```
✅ src/app/home/home.component.html    (Page d'accueil complète)
✅ src/app/home/home.component.css     (Styles de la page)
✅ src/app/home/home.component.ts      (Logique TypeScript)
✅ src/app/navbar/navbar.component.html (Navbar modernisée)
✅ src/app/navbar/navbar.component.css  (Styles navbar)
✅ src/styles.css                       (Styles globaux)
✅ src/assets/images/README.md          (Guide des images)
✅ download-placeholder-images.ps1      (Script téléchargement)
✅ GUIDE-FRONTEND.md                    (Documentation complète)
✅ INTEGRATION-BACKEND.md               (Guide backend)
✅ README.md                            (Readme mis à jour)
```

## 🎨 Personnalisation rapide

### Changer les couleurs
Dans `src/app/home/home.component.css` :
```css
:root {
  --primary-green: #4CAF50;    /* Votre couleur principale */
  --light-green: #81C784;      /* Couleur claire */
  --dark-green: #388E3C;       /* Couleur foncée */
}
```

### Ajouter un repas
Dans `src/app/home/home.component.ts` :
```typescript
meals: Meal[] = [
  {
    name: 'Nouveau repas',
    description: 'Description du repas',
    price: 500,
    image: 'assets/images/nouveau-repas.jpg'
  }
]
```

### Ajouter une FAQ
Dans `src/app/home/home.component.ts` :
```typescript
faqs: FAQ[] = [
  {
    question: 'Votre question ?',
    answer: 'Votre réponse',
    open: false
  }
]
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
ng generate component nom-composant

# Générer un service
ng generate service services/nom-service
```

## 📚 Documentation

- **GUIDE-FRONTEND.md** - Guide complet du frontend
- **INTEGRATION-BACKEND.md** - Intégration avec Spring Boot
- **src/assets/images/README.md** - Liste des images nécessaires

## 🆘 Problèmes courants

### Les images ne s'affichent pas
- Vérifiez que les images sont dans `src/assets/images/`
- Vérifiez les noms de fichiers (sensible à la casse)
- Exécutez `download-placeholder-images.ps1` pour des images temporaires

### Erreur CORS avec le backend
- Ajoutez la configuration CORS dans Spring Boot (voir INTEGRATION-BACKEND.md)
- Vérifiez que le backend tourne sur http://localhost:8080

### Le style ne s'applique pas
- Vérifiez que Bootstrap est importé dans `src/styles.css`
- Vérifiez que PrimeIcons est importé
- Redémarrez le serveur de développement

## 🎯 Fonctionnalités à implémenter (optionnel)

- [ ] Connexion au backend Spring Boot
- [ ] Système de panier d'achat
- [ ] Paiement en ligne
- [ ] Gestion des commandes
- [ ] Profil utilisateur
- [ ] Historique des commandes
- [ ] Système de notation des repas
- [ ] Filtres avancés (allergènes, préférences)

## 📞 Support

Pour toute question :
1. Consultez la documentation Angular : https://angular.dev/
2. Consultez la documentation Bootstrap : https://getbootstrap.com/
3. Consultez la documentation PrimeNG : https://primeng.org/

---

**Bon développement ! 🚀**
