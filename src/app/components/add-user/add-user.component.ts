import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { JwtService } from './../../service/jwt.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { StorageService } from '../../service/storage-service.service';

@Component({
    selector: 'app-add-user',
    templateUrl: './add-user.component.html',
    styleUrls: ['./add-user.component.css'],
    imports: [ReactiveFormsModule, CommonModule, TranslateModule]
})
export class AddUserComponent implements OnInit {
  structures: any[] = [];
  registerForm!: FormGroup;

  constructor(
    private service: JwtService,
    private fb: FormBuilder,
    private router: Router,
    private storageService: StorageService
  ) { }

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern('^[A-Za-zÀ-ÖØ-öø-ÿ ]+$')]],
      email: ['', [Validators.required, Validators.email, this.emailValidator]], 
      phoneNumber: ['', [Validators.required, Validators.pattern('^[0-9]+$'), Validators.maxLength(8)]], 
      password: ['', [Validators.required, Validators.minLength(8), this.passwordComplexity]], 
      confirmPassword: ['', [Validators.required]], 
      role: ['', Validators.required], // Ajout du champ rôle,
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

 
  // Soumettre le formulaire d'enregistrement
  submitForm(): void {
    const formData = {
      ...this.registerForm.value
    };

    console.log(formData);
     this.service.register(formData).subscribe(
      (response) => {
        if (response.id != null) {
          alert("Ajout réussite!!");
          this.router.navigate([`/gestUsers`]);
        }
      },
      (error) => {
        alert("Erreur lors de l\'Ajout. Essayez à nouveau. Peut étre Cet email est déjà enregistré.");
      }
    );
  }
}