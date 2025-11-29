import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { JwtService } from '../service/jwt.service';
import { NotificationService } from '../service/notification.service';
import { interval } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule]
})
export class NavbarComponent implements OnInit {
  isAdmin: boolean = false;
  isCoach: boolean = false;
  showNavbar: boolean = true;
  userName: string = 'Admin';
  showUserMenu: boolean = false;
  isScrolled: boolean = false;
  private lastScrollTop: number = 0;
  notificationsCount: number = 0;

  constructor(
    private router: Router, 
    private jwtService: JwtService,
    private notificationService: NotificationService
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown')) {
      this.showUserMenu = false;
    }
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Hide navbar when scrolling down (after 50px)
    if (scrollTop > 50) {
      this.isScrolled = true;
    } else {
      this.isScrolled = false;
    }
    
    this.lastScrollTop = scrollTop;
  }

ngOnInit(): void {
  this.checkRole();
  this.getUserName();
  this.updateNavbarVisibility();
  
  // Charger les notifications seulement si connecté
  const token = localStorage.getItem('jwt');
  if (token && this.showNavbar) {
    this.chargerNotificationsCount();
  }

  this.router.events.subscribe(() => {
    this.updateNavbarVisibility();
    // Recharger le compteur lors du changement de route si connecté
    const currentToken = localStorage.getItem('jwt');
    if (currentToken && this.showNavbar) {
      this.chargerNotificationsCount();
    }
  });

  // Rafraîchir le compteur toutes les 30 secondes si connecté
  interval(30000).subscribe(() => {
    const currentToken = localStorage.getItem('jwt');
    if (currentToken && this.showNavbar) {
      this.chargerNotificationsCount();
    }
  });
}

chargerNotificationsCount(): void {
  // Vérifier si l'utilisateur est connecté
  const token = localStorage.getItem('jwt');
  if (!token) {
    this.notificationsCount = 0;
    return;
  }

  this.notificationService.countNotificationsNonLues().subscribe({
    next: (count) => {
      this.notificationsCount = count || 0;
    },
    error: (err) => {
      console.error('Erreur chargement compteur notifications:', err);
      this.notificationsCount = 0;
    }
  });
}


  checkRole(): void {
    const role = this.jwtService.getRole();
    this.isAdmin = role === 'ROLE_ADMIN';
    this.isCoach = role === 'ROLE_COACH' || role?.toLowerCase() === 'coach';
  }

  getUserName(): void {
    const role = this.jwtService.getRole();
    if(role) {
      this.userName = role.replace('ROLE_', '');
    }
  }

  getUserInitials(): string {
    return this.userName ? this.userName.charAt(0).toUpperCase() : 'U';
  }

  getRoleDisplay(): string {
    return this.isAdmin ? 'Administrator' : 'User';
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  logout(): void {
    this.showUserMenu = false;
    localStorage.clear(); 
    this.router.navigate(['/login']);
  }

updateNavbarVisibility(): void {
  const hiddenRoutes = ['/login', '/register'];

  // afficher navbar sur toutes les pages sauf login/register
  this.showNavbar = !hiddenRoutes.includes(this.router.url);
}

}