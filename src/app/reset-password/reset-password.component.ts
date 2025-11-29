import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PasswordService } from '../service/password-reset.service';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule, TranslateModule, RouterModule],  
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnInit {

  token!: string;
  newPassword = '';
  message = '';
  error = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private passwordService: PasswordService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token')!;
  }

  // Méthodes pour valider les exigences du mot de passe
  hasMinLength(): boolean {
    return this.newPassword.length >= 8;
  }

  hasLowercase(): boolean {
    return /(?=.*[a-z])/.test(this.newPassword);
  }

  hasUppercase(): boolean {
    return /(?=.*[A-Z])/.test(this.newPassword);
  }

  hasNumber(): boolean {
    return /(?=.*\d)/.test(this.newPassword);
  }

  hasSpecialChar(): boolean {
    return /(?=.*[@$!%*?&])/.test(this.newPassword);
  }

  isPasswordValid(): boolean {
    return this.hasMinLength() && 
           this.hasLowercase() && 
           this.hasUppercase() && 
           this.hasNumber() && 
           this.hasSpecialChar();
  }

  onSubmit() {
    this.loading = true;
    this.message = '';
    this.error = '';

    this.passwordService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.message = "Mot de passe réinitialisé avec succès.";
        this.error = "";
        this.loading = false;
      },
      error: () => {
        this.error = "Lien expiré ou token invalide.";
        this.message = "";
        this.loading = false;
      }
    });
  }
}