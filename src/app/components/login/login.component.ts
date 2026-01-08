import { NgxCaptchaModule } from 'ngx-captcha';
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { JwtService } from './../../service/jwt.service';
import { StorageService } from './../../service/storage-service.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Inject, PLATFORM_ID } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { FloatLabel } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    imports: [ReactiveFormsModule, NgxCaptchaModule, CommonModule, TranslateModule, ButtonModule, FloatLabel, InputTextModule, Toast, RouterModule],
    providers: [MessageService]
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  isSubmitting: boolean = false;
  loginForm!: FormGroup;
  siteKey: string = '6LfeP74qAAAAABpsd9_lTeV_xmy9GtNoWPbLovYZ';
  

  constructor(
    private service: JwtService,
    private fb: FormBuilder,
    private router: Router,
    private storageService: StorageService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  showReCaptcha: boolean = false;
  showPassword = false; 

ngOnInit(): void {
  if (this.isBrowser()) {
    this.showReCaptcha = true; // ReCaptcha activé uniquement côté client
  }
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      captchaToken: [''] // Make captcha optional for debugging
    });
  }

  ngAfterViewInit(): void {
    // Protection pour exécuter du code lié au navigateur uniquement
    if (this.isBrowser()) {
      console.log('ReCaptcha initialisé uniquement côté client.');
    }
  }

  ngOnDestroy(): void {
    // Ajout d'une protection pour éviter d'exécuter du code côté serveur
    if (this.isBrowser()) {
      console.log('Nettoyage de ReCaptcha si nécessaire.');
    }
  }

  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.loginForm.get(controlName);
    if (control?.hasError('required')) {
      return `${controlName} est requis.`;
    }
    if (controlName === 'email' && control?.hasError('email')) {
      return `Adresse email invalide.`;
    }
    return null;
  }
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  submitForm() {
    // For debugging, allow submission even if captcha is missing
    const isFormValidForSubmission = this.loginForm.get('email')?.valid && 
                                   this.loginForm.get('password')?.valid;
    
    if (isFormValidForSubmission) {
      this.isSubmitting = true;
      
      // Prepare login data
      const loginData = {
        email: this.loginForm.get('email')?.value,
        password: this.loginForm.get('password')?.value,
        captchaToken: this.loginForm.get('captchaToken')?.value || 'debug-token'
      };
      
      console.log('Données de connexion:', loginData);
      
      this.service.login(loginData).subscribe(
        (response) => {
          this.isSubmitting = false;
          console.log('Réponse de connexion:', response);
          
          // Check for both jwt and token properties
          const token = response.jwt || response.token;
          if (token) {
            console.log('Token reçu:', token.substring(0, 50) + '...');
            
            this.storageService.setItem('jwt', token);
            this.service.updateAdminStatus();
            
            // NOUVEAU: Forcer un délai pour s'assurer que le token est bien stocké
            setTimeout(() => {
              // Redirection selon le rôle
              const role = this.service.getRole();
              console.log('🔍 Rôle détecté après délai:', role);
              
              if (role === 'ROLE_ADMIN' || role?.toLowerCase() === 'admin') {
                console.log('✅ Redirection vers /admin/dashboard');
                this.router.navigateByUrl('/admin/dashboard');
              } else if (role === 'ROLE_COACH' || role?.toLowerCase() === 'coach') {
                console.log('✅ Redirection vers /coach-home');
                this.router.navigateByUrl('/coach-home');
              } else {
                console.log('✅ Redirection vers /home');
                this.router.navigateByUrl('/home');
              }
            }, 100); // Petit délai pour s'assurer que le localStorage est mis à jour
          } else {
            console.error('Aucun token trouvé dans la réponse');
            alert('Erreur: Aucun token d\'authentification reçu.');
          }
        },
        (error) => {
          this.isSubmitting = false;
          console.error('Erreur lors de la connexion:', error);
          console.error('Status:', error.status);
          console.error('Error body:', error.error);
          
          if (error.status === 403) {
            alert('Accès refusé. Vérifiez vos identifiants ou le captcha.');
          } else if (error.status === 401) {
            alert('Identifiants incorrects.');
          } else if (error.status === 0) {
            alert('Impossible de contacter le serveur. Vérifiez que le backend est démarré.');
          } else {
            alert(`Erreur ${error.status}: ${error.message || 'Une erreur est survenue lors de la connexion.'}`);
          }
        }
      );
    } else {
      console.log('Formulaire invalide');
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        if (control && control.invalid) {
          console.log(`${key} est invalide:`, control.errors);
        }
      });
      alert('Veuillez remplir tous les champs requis.');
    }
  }
}
