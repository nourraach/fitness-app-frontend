import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { JwtService } from '../service/jwt.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(private jwtService: JwtService, private router: Router) {}

  canActivate(): boolean {
    const isAdmin = this.jwtService.isAdmin();
    console.log('Tentative d’accès à une route protégée (admin) :', isAdmin);
    if (isAdmin) {
      return true;
    }
    // Rediriger vers /home si non admin
    this.router.navigate(['/home']);
    return false;
  }
  
}
