# Implementation Plan: User Management API Adaptation

## Overview

Adaptation rapide du frontend pour correspondre au format de l'API backend.

## Tasks

- [ ] 1. Mettre à jour le mapping des utilisateurs dans UserManagementComponent
  - Ajouter interface BackendUser
  - Implémenter la fonction de mapping
  - _Requirements: 1.1-1.9, 4.1-4.6_

- [ ] 2. Corriger la suppression d'utilisateur
  - Gérer la réponse 204 No Content
  - _Requirements: 2.1-2.4_

- [ ] 3. Ajouter la méthode toggleUserStatus dans JwtService
  - Appeler PUT /api/admin/users/{id}/status
  - Envoyer { "enabled": boolean }
  - _Requirements: 3.1-3.5_

- [ ] 4. Mettre à jour le composant pour utiliser la nouvelle API de statut
  - Appeler le service pour toggle status
  - Gérer les erreurs
  - _Requirements: 3.3-3.4, 5.1-5.4_
