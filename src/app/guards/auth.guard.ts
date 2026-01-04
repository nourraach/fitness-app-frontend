import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { JwtService } from '../service/jwt.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private jwtService: JwtService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const token = this.jwtService.getToken();
    console.log('AuthGuard - Token:', token ? 'Présent' : 'Absent');
    
    if (token && this.jwtService.isTokenValid()) {
      console.log('AuthGuard - Accès autorisé');
      return true;
    }
    
    console.warn('AuthGuard - Accès refusé - Token manquant ou invalide');
    this.router.navigate(['/login']);
    return false;
  }
}