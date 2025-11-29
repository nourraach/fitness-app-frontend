# Guide Rapide - Rapports de Progrès

## 🚀 Démarrage rapide

### 1. Accéder à la fonctionnalité
- Connectez-vous à l'application
- Cliquez sur **"Rapports"** dans la barre de navigation
- URL directe : `http://localhost:4200/rapports-progres`

### 2. Pour les Coachs

#### Générer un rapport pour la semaine courante (le plus simple)
1. Cliquez sur **"+ Générer un rapport"**
2. Saisissez l'ID du client (ex: `2`)
3. Cliquez sur **"Semaine courante"**
4. ✅ Le rapport est généré automatiquement !

#### Générer un rapport pour une période spécifique
1. Cliquez sur **"+ Générer un rapport"**
2. Saisissez l'ID du client (ex: `2`)
3. Choisissez la date de début (ex: `2025-11-18`)
4. Choisissez la date de fin (ex: `2025-11-24`)
5. Cliquez sur **"Générer le rapport"**
6. ✅ Le rapport est créé avec toutes les statistiques !

#### Consulter les rapports
- Tous vos rapports s'affichent automatiquement en cartes
- Cliquez sur une carte pour voir les détails complets
- Les statistiques principales sont visibles directement sur la carte

### 3. Pour les Clients

#### Consulter vos rapports
- Vos rapports s'affichent automatiquement
- Cliquez sur un rapport pour voir tous les détails
- Vous pouvez voir :
  - Votre évolution de poids
  - Vos statistiques nutritionnelles
  - Votre activité physique
  - L'analyse de votre coach

## 📊 Comprendre les statistiques

### Carte de rapport (aperçu)
```
┌──────────────────────┐
│ Marie Martin         │
│ 24/11/2025          │
│                      │
│ Poids: -0.7 kg 🟢   │  ← Vert = perte de poids
│ Actif: 5/7 🟢       │  ← Vert = excellente assiduité
│ Repas: 21           │
│                      │
│ Excellente assiduité │
│ sportive...          │
└──────────────────────┘
```

### Codes couleur

#### Variation de poids
- 🟢 **Vert** : Perte de poids (ex: -0.7 kg)
- 🔴 **Rouge** : Gain de poids (ex: +0.5 kg)
- ⚪ **Gris** : Poids stable (0 kg)

#### Jours actifs
- 🟢 **Vert** : 5-7 jours → Excellente assiduité
- 🟡 **Jaune** : 3-4 jours → Bonne régularité
- 🔴 **Rouge** : 0-2 jours → À améliorer

## 📱 Détails du rapport

Cliquez sur un rapport pour voir :

### ⚖️ Poids et IMC
- Poids au début de la semaine
- Poids à la fin de la semaine
- Variation (gain ou perte)
- IMC actuel

### 🍽️ Nutrition
- Nombre de repas enregistrés
- Calories moyennes par jour
- Protéines, lipides, glucides moyens
- Taux de respect des objectifs caloriques

### 💪 Activité Physique
- Nombre d'activités réalisées
- Nombre de jours actifs sur 7
- Durée totale d'activité (minutes)
- Calories brûlées

### 📈 Analyse
Résumé automatique de la tendance générale :
- Évolution du poids
- Assiduité sportive
- Respect des objectifs

## 🎯 Exemples d'utilisation

### Exemple 1 : Suivi hebdomadaire régulier
**Objectif** : Suivre un client chaque semaine

1. Tous les lundis, générez le rapport de la semaine précédente
2. Utilisez "Semaine courante" pour aller plus vite
3. Consultez les statistiques pour préparer votre séance de coaching

### Exemple 2 : Bilan mensuel
**Objectif** : Faire un bilan sur 4 semaines

1. Générez 4 rapports (une semaine à la fois)
2. Comparez les variations de poids
3. Identifiez les tendances sur le mois

### Exemple 3 : Rapport personnalisé
**Objectif** : Analyser une période spécifique

1. Choisissez les dates exactes (ex: après les vacances)
2. Générez le rapport pour cette période
3. Adaptez le programme en fonction des résultats

## ⚠️ Messages et erreurs

### Messages de succès
- ✅ "Rapport généré avec succès"
- ✅ "Rapport de la semaine courante généré avec succès"

### Messages d'erreur courants
- ❌ "Veuillez remplir tous les champs" → Vérifiez que tous les champs sont remplis
- ❌ "Veuillez saisir l'ID du client" → L'ID du client est obligatoire
- ❌ "Client non trouvé" → Vérifiez l'ID du client
- ❌ "Seuls les coachs peuvent générer des rapports" → Vous devez être connecté en tant que coach

## 💡 Astuces

### Pour les coachs
1. **Générez les rapports régulièrement** pour suivre l'évolution
2. **Utilisez "Semaine courante"** pour gagner du temps
3. **Consultez les rapports avant les séances** pour personnaliser le coaching
4. **Regardez la tendance générale** pour des conseils rapides

### Pour les clients
1. **Consultez vos rapports régulièrement** pour rester motivé
2. **Comparez vos statistiques** d'une semaine à l'autre
3. **Utilisez l'analyse** pour comprendre vos progrès
4. **Partagez vos questions** avec votre coach lors des séances

## 🔧 Dépannage

### Le bouton "Générer un rapport" n'apparaît pas
→ Vous devez être connecté en tant que **coach**

### Aucun rapport ne s'affiche
→ Aucun rapport n'a encore été généré. Créez-en un !

### Les statistiques sont vides
→ Le client n'a pas encore enregistré de données (repas, activités, poids)

### Erreur lors de la génération
→ Vérifiez que :
- Le backend est démarré (port 8095)
- L'ID du client existe
- Les dates sont valides
- Vous êtes bien authentifié

## 📞 Besoin d'aide ?

1. Vérifiez que le backend est démarré : `http://localhost:8095`
2. Consultez la console du navigateur (F12) pour les erreurs
3. Vérifiez votre connexion et votre rôle (coach/client)
4. Consultez la documentation complète : `RAPPORTS_PROGRES_FRONTEND.md`

## 🎉 C'est tout !

Vous êtes maintenant prêt à utiliser les rapports de progrès pour suivre efficacement vos clients ou consulter vos propres progrès !
