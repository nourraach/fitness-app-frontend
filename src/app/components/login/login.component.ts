import { NgxCaptchaModule } from 'ngx-captcha';
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { JwtService } from './../../service/jwt.service';
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
      captchaToken: ['', Validators.required]
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
    if (this.loginForm.valid) {
      this.isSubmitting = true;
      console.log(this.loginForm.value);
      this.service.login(this.loginForm.value).subscribe(
        (response) => {
          this.isSubmitting = false;
          if (response.jwt) {
            const jwtToken = response.jwt;
            console.log(jwtToken);
            if (typeof localStorage !== 'undefined') {
              localStorage.setItem('jwt', jwtToken);
              this.service.updateAdminStatus();
            }
            
            // Redirection selon le rôle
            const role = this.service.getRole();
            console.log('🔍 Rôle détecté:', role);
            console.log('🔍 Type du rôle:', typeof role);
            console.log('🔍 Comparaison ROLE_COACH:', role === 'ROLE_COACH');
            console.log('🔍 Comparaison coach (lowercase):', role?.toLowerCase() === 'coach');
            
            if (role === 'ROLE_COACH' || role?.toLowerCase() === 'coach') {
              console.log('✅ Redirection vers /coach-home');
              this.router.navigateByUrl('/coach-home');
            } else {
              console.log('✅ Redirection vers /home');
              this.router.navigateByUrl('/home');
            }
          }
        },
        (error) => {
          this.isSubmitting = false;
          console.error('Erreur lors de la connexion : ', error);
          alert('Une erreur est survenue lors de la connexion.');
        }
      );
    }
  }
}
