# Requirements Document

## Introduction

Cette spécification définit l'intégration frontend Angular pour la fonctionnalité "Défis entre Amis" dont le backend Spring Boot est déjà implémenté. Le système permet aux utilisateurs de créer des défis fitness avec des objectifs communs (pas, calories, distance, entraînements, durée), d'inviter leurs amis, de suivre leur progression et de comparer leurs performances via un classement dynamique.

Le backend expose une API REST complète sur `/api/friend-challenges/*` avec les entités `FriendChallenge` et `ChallengeParticipant`, ainsi que des services pour la gestion du cycle de vie, la progression et le classement.

## Glossary

- **FriendChallenge**: Entité représentant un défi créé par un utilisateur avec un objectif, une période et des participants
- **ChallengeParticipant**: Entité représentant la participation d'un utilisateur à un défi avec sa progression
- **ChallengeObjectiveType**: Type d'objectif du défi (STEPS, CALORIES, DISTANCE, WORKOUTS, DURATION)
- **ChallengeStatus**: Statut du défi (ACTIVE, COMPLETED, CANCELLED)
- **Leaderboard**: Classement des participants d'un défi trié par progression
- **FriendChallengeService**: Service Angular gérant les appels API et l'état des défis
- **API_Backend**: API REST Spring Boot sur `http://localhost:8095/api/friend-challenges`
- **SocialActivity**: Entité représentant une activité sociale visible dans le fil d'actualités des amis
- **SocialActivityType**: Type d'activité sociale (CHALLENGE_JOINED, CHALLENGE_COMPLETED, WORKOUT_COMPLETED, GOAL_ACHIEVED, etc.)
- **SocialFeed**: Fil d'actualités affichant les activités sociales de l'utilisateur et de ses amis
- **FriendService**: Service Angular gérant les amis et le fil social via `/api/social/feed`

## Requirements

### Requirement 1: Création de Défis

**User Story:** En tant qu'utilisateur, je veux créer un défi fitness avec mes amis, afin de nous motiver mutuellement à atteindre des objectifs communs.

#### Acceptance Criteria

1. WHEN un utilisateur accède au formulaire de création THEN le Système_Frontend SHALL afficher un formulaire avec les champs nom, description, type d'objectif, valeur cible, dates et sélection d'amis
2. WHEN un utilisateur sélectionne un type d'objectif THEN le Système_Frontend SHALL afficher l'unité correspondante (pas, cal, km, séances, min)
3. WHEN un utilisateur soumet un défi valide THEN le Système_Frontend SHALL envoyer une requête POST à `/api/friend-challenges/create?userId={id}` avec le payload CreateFriendChallengeRequest
4. WHEN le backend confirme la création THEN le Système_Frontend SHALL afficher un message de succès et ajouter le défi aux listes locales
5. IF la date de fin est antérieure à la date de début THEN le Système_Frontend SHALL afficher une erreur de validation
6. IF les champs obligatoires sont vides THEN le Système_Frontend SHALL désactiver le bouton de soumission et afficher les erreurs

### Requirement 2: Consultation des Défis

**User Story:** En tant qu'utilisateur, je veux voir mes défis en cours, les défis disponibles et ceux que j'ai créés, afin de suivre mon engagement fitness social.

#### Acceptance Criteria

1. WHEN un utilisateur accède à la page des défis THEN le Système_Frontend SHALL charger et afficher trois onglets: "Mes Défis", "Disponibles", "Mes Créations"
2. WHEN l'onglet "Mes Défis" est actif THEN le Système_Frontend SHALL appeler GET `/api/friend-challenges/user/{userId}` et afficher les défis auxquels l'utilisateur participe
3. WHEN l'onglet "Disponibles" est actif THEN le Système_Frontend SHALL appeler GET `/api/friend-challenges/active` et afficher les défis actifs rejoignables
4. WHEN l'onglet "Mes Créations" est actif THEN le Système_Frontend SHALL appeler GET `/api/friend-challenges/created/{userId}` et afficher les défis créés par l'utilisateur
5. WHEN les données sont en cours de chargement THEN le Système_Frontend SHALL afficher un indicateur de chargement
6. IF aucun défi n'est trouvé THEN le Système_Frontend SHALL afficher un état vide avec suggestion d'action

### Requirement 3: Rejoindre un Défi

**User Story:** En tant qu'utilisateur, je veux rejoindre un défi existant, afin de participer à des compétitions fitness avec mes amis.

#### Acceptance Criteria

1. WHEN un utilisateur clique sur "Rejoindre" un défi THEN le Système_Frontend SHALL envoyer une requête POST à `/api/friend-challenges/{challengeId}/join?userId={id}`
2. WHEN le backend confirme l'inscription THEN le Système_Frontend SHALL afficher un message de succès et déplacer le défi vers "Mes Défis"
3. WHEN un utilisateur est déjà participant THEN le Système_Frontend SHALL masquer le bouton "Rejoindre" et afficher "Participant"
4. IF l'inscription échoue THEN le Système_Frontend SHALL afficher un message d'erreur explicite
5. WHEN un défi est rejoint THEN le Système_Frontend SHALL rafraîchir automatiquement les listes de défis

### Requirement 4: Suivi de Progression

**User Story:** En tant qu'utilisateur, je veux mettre à jour ma progression dans un défi, afin que mes performances soient comptabilisées dans le classement.

#### Acceptance Criteria

1. WHEN un utilisateur clique sur "Mettre à jour" sa progression THEN le Système_Frontend SHALL afficher un formulaire de saisie de la nouvelle valeur
2. WHEN un utilisateur soumet une progression THEN le Système_Frontend SHALL envoyer une requête POST à `/api/friend-challenges/{challengeId}/progress?userId={id}&progress={val}`
3. WHEN la progression est mise à jour THEN le Système_Frontend SHALL rafraîchir le classement et afficher la nouvelle position
4. WHEN la progression atteint 100% THEN le Système_Frontend SHALL afficher une animation de célébration
5. IF la mise à jour échoue THEN le Système_Frontend SHALL afficher un message d'erreur et conserver la valeur précédente

### Requirement 5: Classement (Leaderboard)

**User Story:** En tant qu'utilisateur, je veux voir le classement d'un défi, afin de comparer ma progression avec celle des autres participants.

#### Acceptance Criteria

1. WHEN un utilisateur clique sur "Classement" d'un défi THEN le Système_Frontend SHALL appeler GET `/api/friend-challenges/{challengeId}/leaderboard` et afficher une modal
2. WHEN le classement est affiché THEN le Système_Frontend SHALL montrer pour chaque participant: position, nom, progression, pourcentage de complétion
3. WHEN l'utilisateur courant est dans le classement THEN le Système_Frontend SHALL mettre en évidence sa ligne avec un style distinct
4. WHEN un participant est en première position THEN le Système_Frontend SHALL afficher une icône de couronne
5. WHEN le classement est vide THEN le Système_Frontend SHALL afficher un message indiquant qu'aucun participant n'a encore de progression

### Requirement 6: Annulation de Défi

**User Story:** En tant que créateur d'un défi, je veux pouvoir annuler mon défi, afin de gérer les situations imprévues.

#### Acceptance Criteria

1. WHEN le créateur d'un défi clique sur "Annuler" THEN le Système_Frontend SHALL demander confirmation avant d'envoyer la requête
2. WHEN la confirmation est donnée THEN le Système_Frontend SHALL envoyer une requête DELETE à `/api/friend-challenges/{challengeId}?userId={id}`
3. WHEN l'annulation est confirmée THEN le Système_Frontend SHALL retirer le défi de toutes les listes et afficher un message de succès
4. IF l'utilisateur n'est pas le créateur THEN le Système_Frontend SHALL masquer le bouton "Annuler"
5. IF l'annulation échoue THEN le Système_Frontend SHALL afficher un message d'erreur explicite

### Requirement 7: Affichage des Informations de Défi

**User Story:** En tant qu'utilisateur, je veux voir les détails complets d'un défi, afin de comprendre les objectifs et le contexte.

#### Acceptance Criteria

1. WHEN un défi est affiché THEN le Système_Frontend SHALL montrer: nom, description, type d'objectif avec icône, valeur cible avec unité, dates, nombre de participants, jours restants
2. WHEN un défi est actif THEN le Système_Frontend SHALL afficher un badge "Actif" en vert
3. WHEN un défi est terminé THEN le Système_Frontend SHALL afficher un badge "Terminé" en bleu
4. WHEN un défi est annulé THEN le Système_Frontend SHALL afficher un badge "Annulé" en rouge
5. WHEN les jours restants sont inférieurs ou égaux à 2 THEN le Système_Frontend SHALL afficher les jours restants en rouge avec style urgent

### Requirement 8: Gestion des Erreurs et Mode Hors-ligne

**User Story:** En tant qu'utilisateur, je veux que l'application gère gracieusement les erreurs réseau, afin de continuer à utiliser l'application même en cas de problème de connexion.

#### Acceptance Criteria

1. IF une requête API échoue THEN le Système_Frontend SHALL afficher un message d'erreur convivial sans crash
2. IF le backend est indisponible THEN le Système_Frontend SHALL utiliser des données mock pour démonstration
3. WHEN une erreur se produit THEN le Système_Frontend SHALL logger l'erreur via ErrorHandlerService
4. WHEN une action réussit THEN le Système_Frontend SHALL afficher un toast de confirmation
5. WHEN une action échoue THEN le Système_Frontend SHALL afficher un toast d'erreur avec possibilité de réessayer

### Requirement 9: Intégration avec le Système d'Authentification

**User Story:** En tant qu'utilisateur authentifié, je veux que mes défis soient liés à mon compte, afin que mes données soient sécurisées et persistantes.

#### Acceptance Criteria

1. WHEN un utilisateur accède aux défis THEN le Système_Frontend SHALL vérifier la validité du token JWT via JwtService
2. WHEN une requête API est envoyée THEN le Système_Frontend SHALL inclure le header Authorization avec le token Bearer
3. IF le token est invalide ou expiré THEN le Système_Frontend SHALL rediriger vers la page de connexion
4. WHEN l'utilisateur se déconnecte THEN le Système_Frontend SHALL vider les données de défis en cache
5. WHEN l'utilisateur se connecte THEN le Système_Frontend SHALL charger automatiquement ses défis

### Requirement 10: Interface Utilisateur Responsive

**User Story:** En tant qu'utilisateur, je veux accéder aux défis depuis n'importe quel appareil, afin d'utiliser l'application sur mobile ou desktop.

#### Acceptance Criteria

1. WHEN l'écran est large (desktop) THEN le Système_Frontend SHALL afficher les défis en grille de plusieurs colonnes
2. WHEN l'écran est étroit (mobile) THEN le Système_Frontend SHALL afficher les défis en colonne unique
3. WHEN les onglets sont affichés sur mobile THEN le Système_Frontend SHALL permettre le défilement horizontal si nécessaire
4. WHEN une modal est ouverte sur mobile THEN le Système_Frontend SHALL adapter sa taille à l'écran
5. WHEN les boutons d'action sont affichés THEN le Système_Frontend SHALL maintenir une taille tactile minimale de 44px

### Requirement 11: Intégration avec le Fil Social (Social Activities)

**User Story:** En tant qu'utilisateur, je veux que mes actions sur les défis apparaissent dans le fil social, afin que mes amis puissent voir mes accomplissements et me motiver.

#### Acceptance Criteria

1. WHEN un utilisateur crée un défi THEN le Système_Frontend SHALL rafraîchir le fil social pour afficher l'activité CHALLENGE_JOINED créée par le backend
2. WHEN un utilisateur rejoint un défi THEN le Système_Frontend SHALL rafraîchir le fil social pour afficher l'activité CHALLENGE_JOINED
3. WHEN un utilisateur atteint 100% de progression THEN le Système_Frontend SHALL rafraîchir le fil social pour afficher l'activité CHALLENGE_COMPLETED
4. WHEN le fil social est affiché THEN le Système_Frontend SHALL mapper correctement les types d'activités backend (CHALLENGE_JOINED, CHALLENGE_COMPLETED) vers l'affichage frontend
5. WHEN une activité de type défi est affichée THEN le Système_Frontend SHALL montrer le nom du défi, le type d'objectif et la progression si disponible
6. IF le rafraîchissement du fil social échoue THEN le Système_Frontend SHALL continuer sans bloquer l'action principale
