import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProfileService } from '../service/profile.service';
import { UserProfile, ImcResult, BesoinsCaloriquesResult } from '../models/user-profile.model';
import { CoachNavbarComponent } from '../coach-navbar/coach-navbar.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { JwtService } from '../service/jwt.service';
import { StorageService } from '../service/storage-service.service';

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
  isLoading = false;
  isEditing = false;
  hasProfile = false;
  successMessage = '';
  errorMessage = '';
  userName = 'Utilisateur';
  isCoach = false;

  constructor(
    private profileService: ProfileService,
    private jwtService: JwtService,
    private storageService: StorageService
  ) {}

  ngOnInit(): void {
    this.checkRole();
    this.getUserName();
    this.loadProfile();
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
        this.profile = data;
        this.hasProfile = true;
        this.isEditing = false;
        
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
        
        this.isLoading = false;
      },
      error: (error) => {
        console.log('Aucun profil trouvé, création d\'un nouveau profil');
        this.hasProfile = false;
        this.isEditing = true;
        this.isLoading = false;
      }
    });
  }

  saveProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const operation = this.hasProfile 
      ? this.profileService.updateProfile(this.profile)
      : this.profileService.createProfile(this.profile);

    operation.subscribe({
      next: (data) => {
        this.profile = data;
        this.hasProfile = true;
        this.isEditing = false;
        this.successMessage = 'Profil enregistré avec succès !';
        this.calculateAll();
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Erreur complète:', error);
        console.error('Status:', error.status);
        console.error('Message:', error.error);
        
        let messageErreur = 'Erreur lors de l\'enregistrement du profil';
        if (error.error?.message) {
          messageErreur = error.error.message;
        } else if (error.status === 0) {
          messageErreur = 'Impossible de contacter le serveur';
        } else if (error.status === 401) {
          messageErreur = 'Non autorisé - Veuillez vous reconnecter';
        } else if (error.status === 400) {
          messageErreur = 'Données invalides';
        }
        
        this.errorMessage = messageErreur;
        this.isLoading = false;
      }
    });
  }

  calculateAll(): void {
    if (this.profile.taille > 0 && this.profile.poids > 0) {
      this.calculateImc();
      this.calculateBesoinsCaloriques();
    }
  }

  calculateImc(): void {
    this.profileService.calculateImc(this.profile.taille, this.profile.poids).subscribe({
      next: (result) => {
        this.imcResult = result;
      },
      error: (error) => {
        console.error('Erreur calcul IMC', error);
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

  // Méthodes pour les interactions du formulaire
  onAgeChange(): void {
    // Peut être utilisé pour des validations en temps réel
  }

  selectGender(gender: 'HOMME' | 'FEMME' | 'AUTRE'): void {
    this.profile.sexe = gender;
  }

  selectObjective(objective: 'PERTE_POIDS' | 'PRISE_MASSE' | 'MAINTIEN' | 'REMISE_EN_FORME'): void {
    this.profile.objectif = objective;
  }

  selectActivity(activity: 'SEDENTAIRE' | 'LEGER' | 'MODERE' | 'INTENSE' | 'TRES_INTENSE'): void {
    this.profile.niveauActivite = activity;
  }

  saveAndCalculate(): void {
    this.isEditing = true;
    setTimeout(() => {
      this.saveProfile();
    }, 0);
  }
}
