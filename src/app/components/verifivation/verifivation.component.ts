import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';
import { JwtService } from '../../service/jwt.service';

@Component({
    selector: 'app-verification',
    templateUrl: './verifivation.component.html',
    styleUrls: ['./verifivation.component.css'],
    imports: [TranslateModule, ReactiveFormsModule, CommonModule]
})
export class VerificationComponent {
  verificationForm: FormGroup;
  message: string = '';
  isError: boolean = false;

  constructor(private fb: FormBuilder, private jwtService: JwtService) {
    this.verificationForm = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(4), Validators.maxLength(6)]]
    });
  }

  verifyCode() {
    if (this.verificationForm.invalid) {
      return;
    }

    const code = this.verificationForm.value.code;

    this.jwtService.verifyCode(code).subscribe({
      next: (response) => {
        this.message = 'Code de vérification valide !';
        this.isError = false;
      },
      error: (err) => {
        this.message = 'Code de vérification invalide.';
        this.isError = true;
      }
    });
  }
}