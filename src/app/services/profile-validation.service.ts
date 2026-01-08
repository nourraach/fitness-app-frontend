import { Injectable } from '@angular/core';
import { UserProfile } from '../models/user-profile.model';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationErrors;
}

export interface FieldValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface ValidationErrors {
  age?: string;
  taille?: string;
  poids?: string;
  sexe?: string;
  objectif?: string;
  niveauActivite?: string;
  general?: string;
  [key: string]: string | undefined;
}

export interface ValidationConfig {
  numericFields: {
    age: { min: number; max: number };
    taille: { min: number; max: number };
    poids: { min: number; max: number };
  };
  enumFields: {
    sexe: string[];
    objectif: string[];
    niveauActivite: string[];
  };
  requiredFields: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ProfileValidationService {
  private validationConfig: ValidationConfig = {
    numericFields: {
      age: { min: 1, max: 120 },
      taille: { min: 50, max: 250 }, // cm
      poids: { min: 20, max: 300 }   // kg
    },
    enumFields: {
      sexe: ['HOMME', 'FEMME', 'AUTRE'],
      objectif: ['PERTE_POIDS', 'PRISE_MASSE', 'MAINTIEN', 'REMISE_EN_FORME'],
      niveauActivite: ['SEDENTAIRE', 'LEGER', 'MODERE', 'INTENSE', 'TRES_INTENSE']
    },
    requiredFields: ['age', 'sexe', 'taille', 'poids', 'objectif', 'niveauActivite']
  };

  private errorMessages = {
    age: {
      required: 'L\'âge est requis',
      min: 'L\'âge doit être supérieur à 0',
      max: 'L\'âge doit être inférieur à 120'
    },
    taille: {
      required: 'La taille est requise',
      min: 'La taille doit être supérieure à 50 cm',
      max: 'La taille doit être inférieure à 250 cm'
    },
    poids: {
      required: 'Le poids est requis',
      min: 'Le poids doit être supérieur à 20 kg',
      max: 'Le poids doit être inférieur à 300 kg'
    },
    sexe: {
      required: 'Le sexe est requis',
      invalid: 'Veuillez sélectionner: Homme, Femme ou Autre'
    },
    objectif: {
      required: 'L\'objectif est requis',
      invalid: 'Veuillez sélectionner un objectif valide'
    },
    niveauActivite: {
      required: 'Le niveau d\'activité est requis',
      invalid: 'Veuillez sélectionner un niveau d\'activité valide'
    }
  };

  constructor() {}

  /**
   * Valide un profil utilisateur complet
   */
  validateProfile(profile: UserProfile): ValidationResult {
    const errors: ValidationErrors = {};
    let isValid = true;

    console.log('🔍 Validation du profil:', JSON.stringify(profile, null, 2));

    // Validation des champs numériques
    const ageValidation = this.validateNumericField(profile.age, 'age');
    if (!ageValidation.isValid) {
      errors.age = ageValidation.errorMessage;
      isValid = false;
    }

    const tailleValidation = this.validateNumericField(profile.taille, 'taille');
    if (!tailleValidation.isValid) {
      errors.taille = tailleValidation.errorMessage;
      isValid = false;
    }

    const poidsValidation = this.validateNumericField(profile.poids, 'poids');
    if (!poidsValidation.isValid) {
      errors.poids = poidsValidation.errorMessage;
      isValid = false;
    }

    // Validation des champs énumérés - avec gestion explicite des valeurs undefined
    const sexeValidation = this.validateEnumField(profile.sexe, 'sexe');
    if (!sexeValidation.isValid) {
      errors.sexe = sexeValidation.errorMessage;
      isValid = false;
    }

    // Validation objectif - log détaillé pour debug
    console.log(`🔍 Validation objectif - valeur reçue: "${profile.objectif}" (type: ${typeof profile.objectif})`);
    const objectifValidation = this.validateEnumField(profile.objectif, 'objectif');
    if (!objectifValidation.isValid) {
      errors.objectif = objectifValidation.errorMessage;
      isValid = false;
    }

    const niveauActiviteValidation = this.validateEnumField(profile.niveauActivite, 'niveauActivite');
    if (!niveauActiviteValidation.isValid) {
      errors.niveauActivite = niveauActiviteValidation.errorMessage;
      isValid = false;
    }

    const result = { isValid, errors };
    
    if (!isValid) {
      console.log('❌ Erreurs de validation:', errors);
    } else {
      console.log('✅ Profil valide');
    }

    return result;
  }

  /**
   * Valide un champ spécifique
   */
  validateField(fieldName: string, value: any): FieldValidationResult {
    switch (fieldName) {
      case 'age':
      case 'taille':
      case 'poids':
        return this.validateNumericField(value, fieldName);
      case 'sexe':
      case 'objectif':
      case 'niveauActivite':
        return this.validateEnumField(value, fieldName);
      default:
        return { isValid: true };
    }
  }

  /**
   * Valide un champ numérique
   */
  validateNumericField(value: number, fieldName: 'age' | 'taille' | 'poids'): FieldValidationResult {
    const config = this.validationConfig.numericFields[fieldName];
    const messages = this.errorMessages[fieldName];

    // Vérifier si la valeur existe
    if (value === null || value === undefined || value === 0) {
      return {
        isValid: false,
        errorMessage: messages.required
      };
    }

    // Vérifier si c'est un nombre valide
    if (typeof value !== 'number' || isNaN(value)) {
      return {
        isValid: false,
        errorMessage: messages.required
      };
    }

    // Vérifier les limites
    if (value < config.min) {
      return {
        isValid: false,
        errorMessage: messages.min
      };
    }

    if (value > config.max) {
      return {
        isValid: false,
        errorMessage: messages.max
      };
    }

    return { isValid: true };
  }

  /**
   * Valide un champ énuméré
   */
  validateEnumField(value: string | undefined | null, fieldName: 'sexe' | 'objectif' | 'niveauActivite'): FieldValidationResult {
    const allowedValues = this.validationConfig.enumFields[fieldName];
    const messages = this.errorMessages[fieldName];

    // Vérifier si la valeur existe (gestion de undefined/null)
    if (value === undefined || value === null || value === '') {
      console.log(`⚠️ Validation ${fieldName}: valeur manquante (${value})`);
      return {
        isValid: false,
        errorMessage: messages.required
      };
    }

    // Convertir en string et nettoyer
    const cleanValue = String(value).trim();
    
    if (cleanValue === '') {
      console.log(`⚠️ Validation ${fieldName}: valeur vide après trim`);
      return {
        isValid: false,
        errorMessage: messages.required
      };
    }

    // Vérifier si la valeur est dans la liste autorisée
    if (!allowedValues.includes(cleanValue)) {
      console.log(`⚠️ Validation ${fieldName}: valeur "${cleanValue}" non autorisée. Valeurs acceptées: ${allowedValues.join(', ')}`);
      return {
        isValid: false,
        errorMessage: messages.invalid
      };
    }

    console.log(`✅ Validation ${fieldName}: "${cleanValue}" est valide`);
    return { isValid: true };
  }

  /**
   * Vérifie si un profil est valide
   */
  isProfileValid(profile: UserProfile): boolean {
    return this.validateProfile(profile).isValid;
  }

  /**
   * Récupère les erreurs de validation d'un profil
   */
  getValidationErrors(profile: UserProfile): ValidationErrors {
    return this.validateProfile(profile).errors;
  }

  /**
   * Récupère la configuration de validation
   */
  getValidationConfig(): ValidationConfig {
    return { ...this.validationConfig };
  }

  /**
   * Valide la structure du payload avant envoi à l'API
   */
  validatePayloadStructure(profile: UserProfile): FieldValidationResult {
    const requiredFields = this.validationConfig.requiredFields;
    
    for (const field of requiredFields) {
      if (!(field in profile)) {
        return {
          isValid: false,
          errorMessage: `Le champ ${field} est manquant dans le payload`
        };
      }
    }

    // Vérifier les types de données
    if (typeof profile.age !== 'number') {
      return {
        isValid: false,
        errorMessage: 'L\'âge doit être un nombre'
      };
    }

    if (typeof profile.taille !== 'number') {
      return {
        isValid: false,
        errorMessage: 'La taille doit être un nombre'
      };
    }

    if (typeof profile.poids !== 'number') {
      return {
        isValid: false,
        errorMessage: 'Le poids doit être un nombre'
      };
    }

    return { isValid: true };
  }

  /**
   * Log les erreurs de validation avec détails
   */
  logValidationErrors(profile: UserProfile, errors: ValidationErrors): void {
    console.group('🚨 Erreurs de validation détaillées');
    console.log('Profil testé:', profile);
    console.log('Erreurs trouvées:', errors);
    
    Object.entries(errors).forEach(([field, message]) => {
      if (message) {
        console.log(`❌ ${field}: ${message}`);
      }
    });
    
    console.groupEnd();
  }
}