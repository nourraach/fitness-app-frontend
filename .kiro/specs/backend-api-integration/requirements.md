# Requirements Document - Backend API Integration

## Introduction

Le backend a été complètement implémenté avec 14 user stories et 120+ endpoints API. Le frontend Angular doit maintenant intégrer les nouvelles APIs critiques qui sont manquantes, notamment l'audit logging admin, les statistiques coach améliorées, la reconnaissance d'aliments (US09), les graphiques d'évolution (US06), et l'administration complète.

## Glossary

- **System**: L'interface frontend Angular de l'application fitness
- **Admin**: Un utilisateur avec des privilèges d'administration
- **Coach**: Un entraîneur gérant des clients
- **Client**: Un utilisateur utilisant les services fitness
- **API**: Les endpoints REST du backend Spring Boot
- **Audit_Log**: Enregistrement des actions administratives
- **Food_Recognition**: Service de reconnaissance d'aliments par IA
- **Chart_Data**: Données pour les graphiques d'évolution

## Requirements

### Requirement 1: Audit Logging Administration

**User Story:** En tant qu'administrateur, je veux consulter les logs d'audit complets, afin de tracer toutes les actions sensibles du système.

#### Acceptance Criteria

1. WHEN un admin accède à la page audit logs, THE System SHALL afficher la liste paginée des logs via GET /api/admin/audit-logs
2. THE System SHALL permettre de filtrer par date (startDate, endDate), admin, et type d'action
3. WHEN un admin recherche dans les logs, THE System SHALL utiliser GET /api/admin/audit-logs/search?query=
4. THE System SHALL afficher les colonnes : Date, Admin, Action, Entité, Détails, IP Address, User Agent
5. WHEN les statistiques sont demandées, THE System SHALL appeler GET /api/admin/audit-logs/stats
6. THE System SHALL afficher un dashboard avec graphiques des actions par type et période
7. WHEN un admin clique sur une entité, THE System SHALL afficher GET /api/admin/audit-logs/entity/{type}/{id}

### Requirement 2: Statistiques Coach Améliorées

**User Story:** En tant que coach, je veux voir les vraies statistiques de mes clients, afin de suivre leur progression réelle.

#### Acceptance Criteria

1. WHEN un coach consulte ses clients, THE System SHALL afficher programsCount, progressRate, lastActivity calculés automatiquement
2. THE System SHALL montrer le nombre réel de programmes par client (pas 0 par défaut)
3. WHEN le taux de progression est affiché, THE System SHALL utiliser la valeur calculée basée sur les 30 derniers jours
4. THE System SHALL afficher la dernière activité physique enregistrée ou "Aucune activité"
5. WHEN les statistiques sont nulles, THE System SHALL afficher des indicateurs visuels appropriés
6. THE System SHALL permettre de trier les clients par progression, nombre de programmes, ou dernière activité
7. THE System SHALL créer des alertes visuelles pour les clients inactifs (lastActivity > 7 jours)

### Requirement 3: Gestion Complète des Programmes

**User Story:** En tant que coach, je veux modifier et supprimer mes programmes, afin de gérer complètement mes plans d'entraînement.

#### Acceptance Criteria

1. WHEN un coach clique sur "Modifier" un programme, THE System SHALL appeler PUT /api/coach/programmes/{id}
2. THE System SHALL pré-remplir le formulaire avec les données existantes du programme
3. WHEN un coach clique sur "Supprimer", THE System SHALL demander confirmation puis appeler DELETE /api/coach/programmes/{id}
4. THE System SHALL valider que le coach est propriétaire du programme avant modification/suppression
5. WHEN une modification réussit, THE System SHALL rafraîchir la liste des programmes
6. THE System SHALL afficher des messages de succès/erreur appropriés pour chaque opération
7. WHEN un programme est supprimé, THE System SHALL le retirer de l'affichage immédiatement

### Requirement 4: Reconnaissance d'Aliments (US09)

**User Story:** En tant qu'utilisateur, je veux reconnaître des aliments par photo, afin d'ajouter facilement des aliments à mes repas.

#### Acceptance Criteria

1. WHEN un utilisateur upload une image, THE System SHALL appeler POST /api/food-recognition/recognize
2. THE System SHALL supporter les formats JPG, PNG, GIF avec validation côté client
3. WHEN la reconnaissance réussit, THE System SHALL afficher le nom, catégorie, et score de confiance
4. THE System SHALL permettre la recherche de suggestions via GET /api/food-recognition/suggestions?query=
5. WHEN la reconnaissance échoue, THE System SHALL proposer la saisie manuelle via POST /api/food-recognition/manual
6. THE System SHALL afficher les informations nutritionnelles via GET /api/food-recognition/nutrition/{id}?quantity=
7. WHEN un aliment est reconnu, THE System SHALL permettre de l'ajouter directement au repas courant

### Requirement 5: Graphiques d'Évolution (US06)

**User Story:** En tant qu'utilisateur, je veux visualiser mon évolution, afin de suivre mes progrès avec des graphiques détaillés.

#### Acceptance Criteria

1. WHEN un utilisateur accède aux graphiques, THE System SHALL afficher 6 types de graphiques disponibles
2. THE System SHALL implémenter l'évolution du poids via GET /api/charts/weight-evolution/{userId}?days=30
3. THE System SHALL afficher l'évolution IMC via GET /api/charts/bmi-evolution/{userId}?days=30
4. WHEN les comparaisons calories sont demandées, THE System SHALL utiliser GET /api/charts/calories-comparison/{userId}?days=7
5. THE System SHALL montrer la distribution des activités via GET /api/charts/activity-distribution/{userId}?days=30
6. THE System SHALL afficher les progrès hebdomadaires via GET /api/charts/weekly-progress/{userId}
7. THE System SHALL permettre de filtrer par période (7j, 30j, 3 mois, 1 an) et exporter en PDF

### Requirement 6: Administration Étendue

**User Story:** En tant qu'administrateur, je veux gérer complètement le système, afin d'avoir un contrôle total sur l'application.

#### Acceptance Criteria

1. WHEN un admin accède au dashboard, THE System SHALL appeler GET /api/admin/dashboard
2. THE System SHALL afficher la gestion utilisateurs avec pagination via GET /api/admin/users?page=0&size=10
3. WHEN un admin recherche des utilisateurs, THE System SHALL filtrer par search, role, et status
4. THE System SHALL permettre d'activer/désactiver des utilisateurs avec audit automatique
5. WHEN les statistiques système sont demandées, THE System SHALL utiliser GET /api/admin/statistics
6. THE System SHALL afficher les rapports d'activité via GET /api/admin/reports/activity?days=30
7. THE System SHALL implémenter la queue de modération via GET /api/admin/moderation

### Requirement 7: Interface Mobile et Responsive

**User Story:** En tant qu'utilisateur mobile, je veux utiliser toutes les nouvelles fonctionnalités sur mon téléphone, afin d'avoir une expérience complète.

#### Acceptance Criteria

1. THE System SHALL adapter tous les nouveaux composants aux écrans mobiles (responsive design)
2. WHEN sur mobile, THE System SHALL optimiser l'upload d'images pour la reconnaissance d'aliments
3. THE System SHALL utiliser des modals plein écran pour les graphiques sur mobile
4. WHEN sur tablette, THE System SHALL adapter la mise en page des tableaux d'audit logs
5. THE System SHALL supporter les gestes tactiles pour naviguer dans les graphiques
6. THE System SHALL optimiser les performances sur les appareils moins puissants
7. WHEN la connexion est lente, THE System SHALL afficher des indicateurs de chargement appropriés

### Requirement 8: Gestion des Erreurs et États

**User Story:** En tant qu'utilisateur, je veux être informé clairement des états de l'application, afin de comprendre ce qui se passe lors des opérations.

#### Acceptance Criteria

1. WHEN une requête API est en cours, THE System SHALL afficher des indicateurs de chargement spécifiques
2. WHEN une erreur API survient, THE System SHALL afficher des messages d'erreur en français compréhensibles
3. THE System SHALL permettre de réessayer les opérations échouées (retry logic)
4. WHEN la connexion réseau est perdue, THE System SHALL passer en mode hors ligne gracieusement
5. THE System SHALL valider les données côté client avant envoi aux nouvelles APIs
6. WHEN les données sont invalides, THE System SHALL afficher des messages d'erreur spécifiques par champ
7. THE System SHALL implémenter un cache intelligent pour améliorer les performances

### Requirement 9: Intégration avec l'Existant

**User Story:** En tant qu'utilisateur, je veux que les nouvelles fonctionnalités s'intègrent naturellement, afin d'avoir une expérience cohérente.

#### Acceptance Criteria

1. THE System SHALL ajouter les nouvelles routes dans app.routes.ts avec lazy loading
2. THE System SHALL mettre à jour la navigation pour inclure les nouvelles fonctionnalités
3. WHEN un utilisateur navigue, THE System SHALL maintenir la cohérence visuelle avec l'existant
4. THE System SHALL utiliser les mêmes guards d'authentification pour les nouvelles pages
5. WHEN les rôles sont vérifiés, THE System SHALL appliquer les mêmes règles d'autorisation
6. THE System SHALL réutiliser les services existants (JWT, Storage, Error Handling)
7. THE System SHALL maintenir la compatibilité avec les composants existants

### Requirement 10: Performance et Optimisation

**User Story:** En tant qu'utilisateur, je veux que l'application reste rapide, afin d'avoir une expérience fluide malgré les nouvelles fonctionnalités.

#### Acceptance Criteria

1. THE System SHALL implémenter le lazy loading pour tous les nouveaux modules
2. WHEN des images sont uploadées, THE System SHALL les compresser avant envoi
3. THE System SHALL utiliser la pagination pour les listes longues (audit logs, utilisateurs admin)
4. WHEN des graphiques sont affichés, THE System SHALL optimiser le rendu avec Chart.js
5. THE System SHALL implémenter un cache intelligent pour les données fréquemment consultées
6. THE System SHALL utiliser le virtual scrolling pour les longues listes
7. WHEN possible, THE System SHALL précharger les données critiques en arrière-plan