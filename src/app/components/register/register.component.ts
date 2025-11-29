import { StorageService } from './../../service/storage-service.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JwtService } from '../../service/jwt.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
@Component({
    selector: 'app-register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css'],
    imports: [ReactiveFormsModule, RouterModule, CommonModule, TranslateModule, ButtonModule, FloatLabel, InputTextModule, RouterModule],
    providers: [MessageService]
})
export class RegisterComponent implements OnInit {

  registerForm!: FormGroup;

  constructor(
    private service: JwtService,
    private fb: FormBuilder,
    private router: Router,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.logoutUser();
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern('^[A-Za-z]+$')]], // Validation uniquement lettres
      email: ['', [Validators.required, Validators.email, this.emailValidator]], // Validation de l'email
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$'), Validators.maxLength(8)]], // Numéro de téléphone (8 chiffres)
      password: ['', [Validators.required, Validators.minLength(8), this.passwordComplexity]], // Mot de passe fort
      confirmPassword: ['', [Validators.required]], // Confirmation du mot de passe
    }, { validator: this.passwordMatchValidator });
  }

  // Validateur pour vérifier que les mots de passe correspondent
  passwordMatchValidator(formGroup: FormGroup): void {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;
    if (password !== confirmPassword) {
      formGroup.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    } else {
      formGroup.get('confirmPassword')?.setErrors(null);
    }
  }

  // Validateur personnalisé pour vérifier la complexité du mot de passe
  passwordComplexity(control: any): { [key: string]: boolean } | null {
    const value = control.value;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+={}\[\]:;"'<>,.?/-]).{8,}$/;
    if (value && !passwordRegex.test(value)) {
      return { passwordComplexity: true };
    }
    return null;
  }

  // Validateur pour l'email (ajout de sécurité pour éviter des emails faibles)
  emailValidator(control: any): { [key: string]: boolean } | null {
    const value = control.value;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (value && !emailRegex.test(value)) {
      return { emailInvalid: true };
    }
    return null;
  }

  // Déconnexion de l'utilisateur (si connecté)
  logoutUser(): void {
    this.storageService.removeItem('jwt');
    console.log('Utilisateur déconnecté automatiquement.');
  }

  // Soumettre le formulaire d'enregistrement
  submitForm(): void {
    const formData = {
      ...this.registerForm.value,
      role: 'user',
    };

    console.log(formData);
    this.service.register(formData).subscribe(
      (response) => {
        if (response.id != null) {
          alert("Inscription réussite!!");
          this.router.navigate([`/login`]);
        }
      },
      (error) => {
        alert("Erreur lors de l\'inscription. Essayez à nouveau. Peut étre Cet email est déjà enregistré.");
      }
    );
  }
}