import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JwtService } from '../service/jwt.service';

interface CoachProfile {
  id?: number;
  name: string;
  email: string;
  age?: number;
  phone?: string;
  specialization?: string;
  experience?: number;
  bio?: string;
  certifications?: string;
}

@Component({
  selector: 'app-coach-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './coach-profile.component.html',
  styleUrls: ['./coach-profile.component.css']
})
export class CoachProfileComponent implements OnInit {
  profile: CoachProfile = {
    name: '',
    email: '',
    age: undefined,
    phone: '',
    specialization: '',
    experience: undefined,
    bio: '',
    certifications: ''
  };

  isEditing = false;
  successMessage = '';
  errorMessage = '';
  loading = false;

  constructor(
    private router: Router,
    private jwtService: JwtService
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    // Simuler le chargement du profil
    // Dans une vraie application, vous feriez un appel API ici
    this.profile = {
      name: 'Coach Jean Dupont',
      email: 'coach@fitness.com',
      age: 35,
      phone: '+33 6 12 34 56 78',
      specialization: 'Musculation & Nutrition',
      experience: 10,
      bio: 'Coach sportif certifié avec 10 ans d\'expérience. Spécialisé en musculation, perte de poids et nutrition sportive.',
      certifications: 'BPJEPS, Diplôme de Nutritionniste Sportif'
    };
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    this.successMessage = '';
    this.errorMessage = '';
  }

  saveProfile(): void {
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    // Validation
    if (!this.profile.name || !this.profile.email) {
      this.errorMessage = 'Le nom et l\'email sont obligatoires';
      this.loading = false;
      return;
    }

    // Simuler la sauvegarde
    // Dans une vraie application, vous feriez un appel API ici
    setTimeout(() => {
      this.successMessage = 'Profil mis à jour avec succès !';
      this.isEditing = false;
      this.loading = false;
    }, 1000);
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.loadProfile(); // Recharger les données originales
    this.successMessage = '';
    this.errorMessage = '';
  }

  changePassword(): void {
    // Rediriger vers une page de changement de mot de passe
    // ou ouvrir un modal
    alert('Fonctionnalité de changement de mot de passe à implémenter');
  }

  deleteAccount(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.')) {
      // Implémenter la suppression du compte
      alert('Fonctionnalité de suppression de compte à implémenter');
    }
  }
}
