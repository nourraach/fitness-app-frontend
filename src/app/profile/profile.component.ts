import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../service/profile.service';
import { UserProfile, ImcResult, BesoinsCaloriquesResult } from '../models/user-profile.model';
import { CoachNavbarComponent } from '../coach-navbar/coach-navbar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { JwtService } from '../service/jwt.service';
import { StorageService } from '../service/storage-service.service';
import { ProfileValidationService, ValidationErrors, ValidationResult } from '../services/profile-validation.service';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, FormsModule, CoachNavbarComponent, NavbarComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  profile: UserProfile = {
    age: 0,
    sexe: 'HOMME',
    taille: 0,
    poids: 0,
    objectif: 'MAINTIEN',
    niveauActivite: 'MODERE'
  };

  imcResult?: ImcResult;
  besoinsCaloriquesResult?: BesoinsCaloriquesResult;
  
  // Résultats du calculateur de calories (formule Harris-Benedict)
  resultatCalories: {
    bmr: number;
    tdee: number;
    pertePoids: number;
    priseMasse: number;
  } | null = null;
  isLoading = false;
  isEditing = false;
  hasProfile = false;
  successMessage = '';
  errorMessage = '';
  userName = 'Utilisateur';
  isCoach = false;

  // Nouvelles propriétés pour la validation
  validationErrors: ValidationErrors = {};
  isFormValid = false;
  fieldErrors: ValidationErrors = {};

  constructor(
    private profileService: ProfileService,
    private jwtService: JwtService,
    private storageService: StorageService,
    private validationService: ProfileValidationService
  ) {}

  ngOnInit(): void {
    this.checkRole();
    this.getUserName();
    this.loadProfile();
    
    // Forcer le mode édition si c'est un nouveau profil
    setTimeout(() => {
      if (!this.hasProfile) {
        this.isEditing = true;
        console.log('Mode édition activé pour nouveau profil');
      }
      // Valider le profil initial
      this.validateForm();
    }, 100);
  }

  checkRole(): void {
    const role = this.jwtService.getRole();
    this.isCoach = role === 'ROLE_COACH' || role?.toLowerCase() === 'coach';
  }

  getUserName(): void {
    // Récupérer le nom depuis le localStorage ou JWT
    const storedName = this.storageService.getItem('userName');
    if (storedName) {
      this.userName = storedName;
    }
  }

  loadProfile(): void {
    this.isLoading = true;
    this.profileService.getProfile().subscribe({
      next: (data) => {
        console.log('📥 Données reçues du backend:', JSON.stringify(data, null, 2));
        
        // Fusionner avec les valeurs par défaut pour éviter les undefined
        this.profile = {
          ...this.profile, // Valeurs par défaut
          ...data,         // Données du backend (écrasent les défauts)
          // S'assurer que les champs critiques ont des valeurs
          objectif: data.objectif || this.profile.objectif || 'MAINTIEN',
          niveauActivite: data.niveauActivite || this.profile.niveauActivite || 'MODERE',
          sexe: data.sexe || this.profile.sexe || 'HOMME'
        };
        
        console.log('📋 Profil après fusion:', JSON.stringify(this.profile, null, 2));
        
        this.hasProfile = true;
        this.isEditing = false; // Commencer en mode lecture
        
        // Calculer l'IMC si les données existent
        if (data.taille && data.poids) {
          this.imcResult = data.imc ? { 
            imc: data.imc, 
            categorie: this.getImcCategorie(data.imc),
            interpretation: this.getImcInterpretation(data.imc)
          } : undefined;
          
          // Recalculer automatiquement
          this.calculateAll();
        }
        
        // Valider le profil chargé
        this.validateForm();
        this.isLoading = false;
      },
      error: () => {
        console.log('Aucun profil trouvé, création d\'un nouveau profil');
        this.hasProfile = false;
        this.isEditing = true; // Nouveau profil = mode édition
        this.validateForm(); // Valider le profil vide
        this.isLoading = false;
      }
    });
  }

  saveProfile(): void {
    // Validation avant sauvegarde
    const validationResult = this.validationService.validateProfile(this.profile);
    
    if (!validationResult.isValid) {
      this.validationErrors = validationResult.errors;
      this.fieldErrors = validationResult.errors;
      this.isFormValid = false;
      this.errorMessage = 'Veuillez corriger les erreurs avant de sauvegarder';
      
      // Log des erreurs de validation
      this.validationService.logValidationErrors(this.profile, validationResult.errors);
      return;
    }

    // Validation de la structure du payload
    const payloadValidation = this.validationService.validatePayloadStructure(this.profile);
    if (!payloadValidation.isValid) {
      this.errorMessage = payloadValidation.errorMessage || 'Structure du profil invalide';
      console.error('❌ Erreur de structure du payload:', payloadValidation.errorMessage);
      return;
    }

    // Log du payload avant envoi
    console.log('📤 Payload envoyé à l\'API:', JSON.stringify(this.profile, null, 2));

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.clearFieldErrors();

    this.profileService.saveProfile(this.profile).subscribe({
      next: (data) => {
        console.log('✅ Profil sauvegardé avec succès:', data);
        this.profile = data;
        this.hasProfile = true;
        this.isEditing = false;
        this.successMessage = 'Profil enregistré avec succès !';
        this.calculateAll();
        this.validateForm();
        this.isLoading = false;

        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('❌ Erreur complète lors de la sauvegarde:', error);
        console.log('📤 Payload qui a causé l\'erreur:', JSON.stringify(this.profile, null, 2));

        this.handleApiError(error);
        this.isLoading = false;
      }
    });
  }


  calculateAll(): void {
    if (this.profile.taille > 0 && this.profile.poids > 0) {
      this.calculateImc();
      this.calculateBesoinsCaloriques();
      this.calculerCaloriesLocalement();
    }
  }

  calculateImc(): void {
    this.profileService.calculateImc(this.profile.taille, this.profile.poids).subscribe({
      next: (result) => {
        this.imcResult = result;
      },
      error: (error) => {
        console.error('Erreur calcul IMC', error);
        // Calcul local en cas d'erreur
        if (this.profile.taille > 0 && this.profile.poids > 0) {
          const tailleM = this.profile.taille / 100;
          const imc = this.profile.poids / (tailleM * tailleM);
          this.imcResult = {
            imc: imc,
            categorie: this.getImcCategorie(imc),
            interpretation: this.getImcInterpretation(imc)
          };
        }
      }
    });
  }

  calculateBesoinsCaloriques(): void {
    this.profileService.calculateBesoinsCaloriques(this.profile).subscribe({
      next: (result) => {
        this.besoinsCaloriquesResult = result;
      },
      error: (error) => {
        console.error('Erreur calcul besoins caloriques', error);
      }
    });
  }

  /**
   * Calcul local des besoins caloriques avec la formule Harris-Benedict
   */
  calculerCaloriesLocalement(): void {
    if (!this.profile.age || !this.profile.taille || !this.profile.poids) {
      return;
    }

    let bmr: number;
    
    // Formule Harris-Benedict
    if (this.profile.sexe === 'HOMME') {
      bmr = 88.362 + (13.397 * this.profile.poids) + (4.799 * this.profile.taille) - (5.677 * this.profile.age);
    } else {
      bmr = 447.593 + (9.247 * this.profile.poids) + (3.098 * this.profile.taille) - (4.330 * this.profile.age);
    }
    
    // Multiplicateur selon le niveau d'activité
    const multiplicateurs: { [key: string]: number } = {
      'SEDENTAIRE': 1.2,
      'LEGER': 1.375,
      'MODERE': 1.55,
      'INTENSE': 1.725,
      'TRES_INTENSE': 1.9
    };
    
    const multiplicateur = multiplicateurs[this.profile.niveauActivite || 'MODERE'] || 1.55;
    const tdee = bmr * multiplicateur;
    
    this.resultatCalories = {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      pertePoids: Math.round(tdee - 500),
      priseMasse: Math.round(tdee + 300)
    };
    
    console.log('📊 Calcul calories:', this.resultatCalories);
  }

  enableEdit(): void {
    this.isEditing = true;
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.loadProfile();
  }

  getImcCategorie(imc: number): string {
    if (imc < 18.5) return 'Insuffisance pondérale';
    if (imc < 25) return 'Poids normal';
    if (imc < 30) return 'Surpoids';
    return 'Obésité';
  }

  getImcInterpretation(imc: number): string {
    if (imc < 18.5) return 'Vous êtes en sous-poids';
    if (imc < 25) return 'Votre poids est idéal';
    if (imc < 30) return 'Vous êtes en surpoids';
    return 'Vous êtes en situation d\'obésité';
  }

  getImcColor(imc: number): string {
    if (imc < 18.5) return '#e5c3c9'; // Rose pâle pour sous-poids
    if (imc < 25) return '#84cabe'; // Turquoise pour poids normal
    if (imc < 30) return '#e5c3c9'; // Rose pâle pour surpoids
    return '#113F67'; // Bleu foncé pour obésité
  }

  // Méthodes pour les interactions du formulaire avec validation
  onAgeChange(): void {
    this.validateField('age');
  }

  onTailleChange(): void {
    this.validateField('taille');
  }

  onPoidsChange(): void {
    this.validateField('poids');
  }

  selectGender(gender: 'HOMME' | 'FEMME' | 'AUTRE'): void {
    this.profile.sexe = gender;
    this.validateField('sexe');
  }

  selectObjective(objective: 'PERTE_POIDS' | 'PRISE_MASSE' | 'MAINTIEN' | 'REMISE_EN_FORME'): void {
    console.log(`🎯 Sélection objectif: "${objective}"`);
    this.profile.objectif = objective;
    console.log(`🎯 Profil après sélection: objectif = "${this.profile.objectif}"`);
    this.validateField('objectif');
  }

  selectActivity(activity: 'SEDENTAIRE' | 'LEGER' | 'MODERE' | 'INTENSE' | 'TRES_INTENSE'): void {
    this.profile.niveauActivite = activity;
    this.validateField('niveauActivite');
  }

  saveAndCalculate(): void {
    this.isEditing = true;
    setTimeout(() => {
      this.saveProfile();
    }, 0);
  }

  // ===== NOUVELLES MÉTHODES DE VALIDATION =====

  /**
   * Valide le formulaire complet
   */
  validateForm(): void {
    const validationResult = this.validationService.validateProfile(this.profile);
    this.isFormValid = validationResult.isValid;
    this.validationErrors = validationResult.errors;
    this.fieldErrors = validationResult.errors;
  }

  /**
   * Valide un champ spécifique en temps réel
   */
  validateField(fieldName: string): void {
    const fieldValue = (this.profile as any)[fieldName];
    const validationResult = this.validationService.validateField(fieldName, fieldValue);
    
    if (validationResult.isValid) {
      // Supprimer l'erreur pour ce champ
      delete this.fieldErrors[fieldName];
      delete this.validationErrors[fieldName];
    } else {
      // Ajouter l'erreur pour ce champ
      this.fieldErrors[fieldName] = validationResult.errorMessage || '';
      this.validationErrors[fieldName] = validationResult.errorMessage || '';
    }

    // Revalider le formulaire complet pour mettre à jour l'état du bouton
    this.validateForm();
  }

  /**
   * Vérifie si un champ spécifique a une erreur
   */
  hasFieldError(fieldName: string): boolean {
    return !!this.fieldErrors[fieldName];
  }

  /**
   * Récupère le message d'erreur pour un champ
   */
  getFieldError(fieldName: string): string {
    return this.fieldErrors[fieldName] || '';
  }

  /**
   * Efface toutes les erreurs de champs
   */
  clearFieldErrors(): void {
    this.fieldErrors = {};
    this.validationErrors = {};
  }

  /**
   * Vérifie si le bouton de sauvegarde doit être activé
   */
  isSaveButtonEnabled(): boolean {
    return this.isFormValid && !this.isLoading;
  }

  /**
   * Gère les erreurs de l'API avec mapping intelligent
   */
  private handleApiError(error: any): void {
    let messageErreur = 'Erreur lors de l\'enregistrement du profil';

    // Log complet de l'erreur pour debug
    console.group('🔍 Analyse détaillée de l\'erreur API');
    console.log('Status:', error.status);
    console.log('StatusText:', error.statusText);
    console.log('Error object:', error.error);
    console.log('Error type:', typeof error.error);
    console.log('Error stringified:', JSON.stringify(error.error, null, 2));
    console.groupEnd();

    if (error.status === 0) {
      messageErreur = 'Impossible de contacter le serveur. Vérifiez votre connexion internet.';
    } else if (error.status === 401) {
      messageErreur = 'Session expirée. Veuillez vous reconnecter.';
    } else if (error.status === 400) {
      // Erreur de validation côté serveur
      messageErreur = 'Données invalides selon le serveur.';
      
      // Essayer différents formats de réponse d'erreur du backend
      const errorBody = error.error;
      
      if (errorBody) {
        // Format 1: { message: "..." }
        if (errorBody.message) {
          messageErreur = errorBody.message;
          this.mapBackendErrorToFields(errorBody.message);
        }
        // Format 2: { error: "..." }
        else if (errorBody.error) {
          messageErreur = errorBody.error;
          this.mapBackendErrorToFields(errorBody.error);
        }
        // Format 3: { errors: { field: "message" } }
        else if (errorBody.errors && typeof errorBody.errors === 'object') {
          Object.entries(errorBody.errors).forEach(([field, msg]) => {
            this.fieldErrors[field] = msg as string;
          });
          messageErreur = 'Veuillez corriger les erreurs indiquées.';
        }
        // Format 4: String directe
        else if (typeof errorBody === 'string') {
          messageErreur = errorBody;
          this.mapBackendErrorToFields(errorBody);
        }
        // Format 5: Array d'erreurs
        else if (Array.isArray(errorBody)) {
          messageErreur = errorBody.join(', ');
        }
      }
    } else if (error.status === 500) {
      messageErreur = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
    } else if (error.error?.message) {
      messageErreur = error.error.message;
    }

    this.errorMessage = messageErreur;
    console.error('🚨 Erreur API mappée:', messageErreur);
  }

  /**
   * Mappe les messages d'erreur du backend aux champs du formulaire
   */
  private mapBackendErrorToFields(backendMessage: string): void {
    const message = backendMessage.toLowerCase();
    
    if (message.includes('age') || message.includes('âge')) {
      this.fieldErrors['age'] = 'Âge invalide selon le serveur';
    }
    if (message.includes('taille') || message.includes('height')) {
      this.fieldErrors['taille'] = 'Taille invalide selon le serveur';
    }
    if (message.includes('poids') || message.includes('weight')) {
      this.fieldErrors['poids'] = 'Poids invalide selon le serveur';
    }
    if (message.includes('sexe') || message.includes('gender')) {
      this.fieldErrors['sexe'] = 'Sexe invalide selon le serveur';
    }
    if (message.includes('objectif') || message.includes('objective') || message.includes('goal')) {
      this.fieldErrors['objectif'] = 'Objectif invalide selon le serveur';
    }
    if (message.includes('niveau') || message.includes('activity') || message.includes('activite')) {
      this.fieldErrors['niveauActivite'] = 'Niveau d\'activité invalide selon le serveur';
    }
  }

  /**
   * Méthode pour déboguer l'état de validation
   */
  debugValidationState(): void {
    console.group('🔍 État de validation du formulaire');
    console.log('Profil actuel:', this.profile);
    console.log('Formulaire valide:', this.isFormValid);
    console.log('Erreurs de validation:', this.validationErrors);
    console.log('Erreurs de champs:', this.fieldErrors);
    console.log('Bouton sauvegarde activé:', this.isSaveButtonEnabled());
    console.groupEnd();
  }
}
