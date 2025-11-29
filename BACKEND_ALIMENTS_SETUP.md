# Configuration des Aliments dans le Backend

## Problème
La recherche d'aliments ne retourne aucun résultat car la base de données backend est vide.

## Solution Temporaire (Frontend)
Le frontend utilise maintenant des aliments de démonstration si le backend ne retourne rien.

## Solution Permanente (Backend)
Vous devez ajouter des aliments dans votre base de données backend.

### Option 1: Script SQL d'insertion
Créez un fichier SQL pour insérer des aliments de base :

```sql
INSERT INTO aliment (nom, calories, proteines, lipides, glucides, portion_standard, unite) VALUES
('Poulet grillé', 165, 31, 3.6, 0, 100, 'g'),
('Riz blanc cuit', 130, 2.7, 0.3, 28, 100, 'g'),
('Brocoli cuit', 35, 2.4, 0.4, 7, 100, 'g'),
('Banane', 89, 1.1, 0.3, 23, 100, 'g'),
('Œuf entier', 155, 13, 11, 1.1, 50, 'g'),
('Saumon', 208, 20, 13, 0, 100, 'g'),
('Avocat', 160, 2, 15, 9, 100, 'g'),
('Pain complet', 247, 13, 3.4, 41, 100, 'g'),
('Yaourt nature', 59, 10, 0.4, 3.6, 100, 'g'),
('Pomme', 52, 0.3, 0.2, 14, 100, 'g'),
('Pâtes cuites', 131, 5, 1.1, 25, 100, 'g'),
('Thon en conserve', 116, 26, 0.8, 0, 100, 'g'),
('Tomate', 18, 0.9, 0.2, 3.9, 100, 'g'),
('Amandes', 579, 21, 50, 22, 30, 'g'),
('Lait demi-écrémé', 46, 3.4, 1.5, 4.8, 100, 'ml'),
('Fromage blanc 0%', 44, 7.5, 0.2, 4, 100, 'g'),
('Patate douce', 86, 1.6, 0.1, 20, 100, 'g'),
('Quinoa cuit', 120, 4.4, 1.9, 21, 100, 'g'),
('Épinards', 23, 2.9, 0.4, 3.6, 100, 'g'),
('Beurre de cacahuète', 588, 25, 50, 20, 30, 'g');
```

### Option 2: Endpoint d'initialisation
Créez un endpoint dans votre backend pour initialiser les aliments :

```java
@PostMapping("/api/admin/init-aliments")
public ResponseEntity<String> initAliments() {
    // Vérifier si des aliments existent déjà
    if (alimentRepository.count() > 0) {
        return ResponseEntity.ok("Aliments déjà initialisés");
    }
    
    // Créer et sauvegarder les aliments de base
    List<Aliment> aliments = Arrays.asList(
        new Aliment("Poulet grillé", 165, 31, 3.6, 0, 100, "g"),
        new Aliment("Riz blanc cuit", 130, 2.7, 0.3, 28, 100, "g"),
        // ... autres aliments
    );
    
    alimentRepository.saveAll(aliments);
    return ResponseEntity.ok("Aliments initialisés avec succès");
}
```

### Option 3: Utiliser une API externe
Intégrez une API nutritionnelle comme:
- OpenFoodFacts API (gratuite)
- USDA FoodData Central API
- Nutritionix API

### Vérification
Pour vérifier que les aliments sont bien dans la base de données:

1. Testez l'endpoint: `GET http://localhost:8095/api/repas/aliments`
2. Vérifiez la console du navigateur pour voir les logs
3. Utilisez un outil comme Postman pour tester directement l'API

### Logs à surveiller
Dans la console du navigateur, vous devriez voir:
- "Aliments chargés depuis le backend: X" si le backend fonctionne
- "Aliments de démonstration chargés: 20" si on utilise les données locales
