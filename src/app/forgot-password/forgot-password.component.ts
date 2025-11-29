import { Component } from '@angular/core';
import { PasswordService } from '../service/password-reset.service';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, TranslateModule, RouterModule], 
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  email = '';
  message = '';
  error = '';

  constructor(private passwordService: PasswordService) {}

  onSubmit() {
    this.passwordService.forgotPassword(this.email).subscribe({
      next: () => {
        this.message = "Un email de réinitialisation a été envoyé.";
        this.error = "";
      },
      error: () => {
        this.error = "Erreur : vérifiez l'email.";
      }
    });
  }
}