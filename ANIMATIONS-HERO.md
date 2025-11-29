# 🎬 Animations Hero - Documentation

## ✨ Animations implémentées

### 1. Image principale (Hero Bowl)

#### Animation de flottement (Floating)
- **Durée** : 6 secondes
- **Type** : Boucle infinie
- **Effet** : L'image monte et descend doucement avec une légère rotation
- **Mouvement** : 
  - 0% → 25% : Monte de 20px et tourne de 2°
  - 25% → 50% : Revient à la position initiale
  - 50% → 75% : Monte de 10px et tourne de -2°
  - 75% → 100% : Revient à la position initiale

#### Animation d'apparition (Fade In Scale)
- **Durée** : 1 seconde
- **Type** : Une seule fois au chargement
- **Effet** : L'image apparaît en grossissant depuis 80% à 100%
- **Opacité** : De 0 à 1

#### Effet hover
- **Scale** : Grossit de 5% (1.05)
- **Translation** : Monte de 10px
- **Ombre** : Devient verte et plus prononcée
- **Transition** : 0.3 secondes

### 2. Cercle vert (Background Circle)

#### Animation de rotation
- **Durée** : 20 secondes
- **Type** : Rotation complète (360°) en boucle
- **Effet** : Rotation lente et continue

#### Animation de pulsation
- **Durée** : 4 secondes
- **Type** : Boucle infinie
- **Effet** : Le cercle grossit et rétrécit légèrement
- **Scale** : De 1 à 1.1
- **Opacité** : De 0.8 à 0.6

#### Gradient
- Dégradé du vert clair au vert principal
- Opacité de base : 0.8

### 3. Effet de lueur (Glow Effect)

#### Animation de pulsation
- **Durée** : 3 secondes
- **Type** : Boucle infinie
- **Effet** : Lueur qui pulse derrière l'image
- **Scale** : De 1 à 1.2
- **Opacité** : De 0.5 à 0.8
- **Blur** : 30px pour un effet doux

### 4. Icônes flottantes (4 icônes)

#### Icônes présentes
1. **Cœur** (❤️) - Santé
2. **Éclair** (⚡) - Énergie
3. **Étoile** (⭐) - Excellence
4. **Pomme** (🍎) - Nutrition

#### Animation
- **Durée** : 8 secondes
- **Type** : Boucle infinie
- **Délai** : Chaque icône a un délai différent (0s, 2s, 4s, 6s)
- **Mouvement** : 
  - Translation verticale et horizontale
  - Légère rotation (-5° à 5°)
  - Mouvement asynchrone pour un effet naturel

#### Style
- **Taille** : 60px × 60px
- **Fond** : Blanc
- **Ombre** : Ombre portée douce
- **Icône** : Vert principal, taille 1.8rem

### 5. Arrière-plan animé (Background)

#### Effet de particules
- **Type** : Dégradés radiaux multiples
- **Animation** : Mouvement lent (20 secondes)
- **Effet** : Les particules se déplacent et changent de taille
- **Opacité** : Très légère (0.05 à 0.1)

### 6. Effet Parallaxe (au scroll)

#### Image principale
- **Vitesse** : 0.3x la vitesse du scroll
- **Direction** : Vers le bas
- **Limite** : Jusqu'à 800px de scroll

#### Cercle vert
- **Vitesse** : 0.2x la vitesse du scroll
- **Direction** : Vers la droite
- **Limite** : Jusqu'à 800px de scroll

#### Icônes flottantes
- **Vitesse** : Variable (0.1x à 0.25x)
- **Direction** : Vers le bas
- **Effet** : Chaque icône a une vitesse différente

### 7. Animations d'entrée (au chargement)

#### Titre Hero
- **Animation** : Slide In Left
- **Durée** : 1 seconde
- **Effet** : Arrive depuis la gauche

#### Features
- **Animation** : Fade In Up
- **Durée** : 1 seconde
- **Délai** : 0.3 secondes
- **Effet** : Apparaît en montant

## 🎨 Personnalisation

### Modifier la vitesse des animations

```css
/* Dans home.component.css */

/* Animation de flottement - plus rapide */
.hero-image img {
  animation: floatingImage 4s ease-in-out infinite; /* au lieu de 6s */
}

/* Rotation du cercle - plus lente */
.green-circle {
  animation: rotateCircle 30s linear infinite; /* au lieu de 20s */
}
```

### Désactiver certaines animations

```css
/* Désactiver le flottement */
.hero-image img {
  animation: fadeInScale 1s ease-out; /* Garde seulement l'apparition */
}

/* Désactiver la rotation du cercle */
.green-circle {
  animation: pulseCircle 4s ease-in-out infinite; /* Garde seulement la pulsation */
}
```

### Changer les couleurs de la lueur

```css
.glow-effect {
  background: radial-gradient(circle, rgba(255, 0, 0, 0.4) 0%, transparent 70%);
  /* Remplacez (76, 175, 80) par votre couleur RGB */
}
```

### Modifier la taille des icônes flottantes

```css
.floating-icon {
  width: 80px;  /* au lieu de 60px */
  height: 80px;
}

.floating-icon i {
  font-size: 2.2rem; /* au lieu de 1.8rem */
}
```

## 📱 Responsive

### Desktop (> 992px)
- Toutes les animations actives
- Image : 500px × 500px
- Icônes : 60px × 60px

### Tablette (768px - 992px)
- Toutes les animations actives
- Image : 350px × 350px
- Cercle : 300px × 300px

### Mobile (< 768px)
- Animations simplifiées
- Image : 280px × 280px
- Icônes : 40px × 40px
- Cercle vert : Masqué
- Effet de lueur : Réduit à 300px

## ⚡ Performance

### Optimisations appliquées
- Utilisation de `transform` et `opacity` (GPU accelerated)
- Animations CSS natives (pas de JavaScript pour les animations de base)
- Parallaxe limité à 800px de scroll
- `will-change` implicite via `transform`

### Conseils de performance
1. Les animations s'arrêtent automatiquement hors de la vue
2. Le parallaxe ne s'applique que dans les 800 premiers pixels
3. Utilisez des images optimisées (WebP recommandé)
4. Taille d'image recommandée : 500×500px, < 200KB

## 🎯 Effets visuels

### Hiérarchie des couches (z-index)
1. **z-index: 0** - Arrière-plan animé
2. **z-index: 1** - Cercle vert
3. **z-index: 2** - Image principale
4. **z-index: 3** - Icônes flottantes

### Timing des animations
- **Rapide** (< 2s) : Apparitions, hover
- **Moyen** (3-6s) : Flottement, pulsation
- **Lent** (> 10s) : Rotation, arrière-plan

## 🔧 Dépannage

### Les animations ne fonctionnent pas
1. Vérifiez que le CSS est bien chargé
2. Ouvrez la console pour voir les erreurs
3. Vérifiez que les classes CSS sont appliquées

### Les animations sont saccadées
1. Réduisez le nombre d'éléments animés
2. Utilisez `will-change: transform` sur les éléments
3. Vérifiez les performances du navigateur

### Le parallaxe ne fonctionne pas
1. Vérifiez que le TypeScript est compilé sans erreur
2. Ouvrez la console et vérifiez les erreurs JavaScript
3. Testez en scrollant lentement

## 📚 Ressources

- [CSS Animations MDN](https://developer.mozilla.org/fr/docs/Web/CSS/CSS_Animations)
- [Transform MDN](https://developer.mozilla.org/fr/docs/Web/CSS/transform)
- [Performance des animations](https://web.dev/animations-guide/)

---

**Profitez de votre hero section ultra-dynamique ! 🚀✨**
