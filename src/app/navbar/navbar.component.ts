import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { JwtService } from '../service/jwt.service';
import { NotificationService } from '../service/notification.service';
import { StorageService } from '../service/storage-service.service';
import { WebsocketService } from '../services/websocket.service';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule]
})
export class NavbarComponent implements OnInit, OnDestroy {
  isAdmin: boolean = false;
  isCoach: boolean = false;
  showNavbar: boolean = true;
  userName: string = 'Admin';
  showUserMenu: boolean = false;
  showSuiviMenu: boolean = false;
  showAdminMenu: boolean = false;  // NOUVEAU pour le menu admin
  isScrolled: boolean = false;
  private lastScrollTop: number = 0;
  notificationsCount: number = 0;
  messageNotificationsCount: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router, 
    private jwtService: JwtService,
    private notificationService: NotificationService,
    private storageService: StorageService,
    private websocketService: WebsocketService
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown')) {
      this.showUserMenu = false;
    }
    if (!target.closest('.nav-dropdown')) {
      this.showSuiviMenu = false;
      this.showAdminMenu = false;  // NOUVEAU
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
  const token = this.storageService.getItem('jwt');
  if (token && this.showNavbar) {
    this.chargerNotificationsCount();
    this.initializeMessageNotifications();
  }

  this.router.events.pipe(takeUntil(this.destroy$)).subscribe(() => {
    this.updateNavbarVisibility();
    
    // NOUVEAU: Vérifier et mettre à jour les rôles à chaque changement de route
    this.checkRole();
    this.getUserName();
    
    // Recharger le compteur lors du changement de route si connecté
    const currentToken = this.storageService.getItem('jwt');
    if (currentToken && this.showNavbar) {
      this.chargerNotificationsCount();
    }
  });

  // Rafraîchir le compteur toutes les 30 secondes si connecté
  interval(30000).pipe(takeUntil(this.destroy$)).subscribe(() => {
    const currentToken = this.storageService.getItem('jwt');
    if (currentToken && this.showNavbar) {
      this.chargerNotificationsCount();
    }
  });
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}

private initializeMessageNotifications(): void {
  // S'abonner aux nouveaux messages pour les notifications
  this.websocketService.messages$.pipe(takeUntil(this.destroy$)).subscribe(message => {
    // Incrémenter le compteur si ce n'est pas notre message et qu'on n'est pas sur la page messaging
    if (message.expediteurId !== this.jwtService.getUserId() && 
        !this.router.url.includes('/messaging')) {
      this.messageNotificationsCount++;
      this.notificationsCount = Math.max(this.notificationsCount, this.messageNotificationsCount);
    }
  });

  // Réinitialiser le compteur quand on visite la page messaging
  this.router.events.pipe(takeUntil(this.destroy$)).subscribe(() => {
    if (this.router.url.includes('/messaging')) {
      this.messageNotificationsCount = 0;
    }
  });
}

chargerNotificationsCount(): void {
  // Vérifier si l'utilisateur est connecté
  const token = this.storageService.getItem('jwt');
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
      
      // Si erreur 403, le token est probablement invalide
      if (err.status === 403) {
        console.warn('Token invalide ou expiré, redirection vers login');
        this.logout();
      }
    }
  });
}


  checkRole(): void {
    const role = this.jwtService.getRole();
    const wasAdmin = this.isAdmin;
    const wasCoach = this.isCoach;
    
    this.isAdmin = role === 'ROLE_ADMIN';
    this.isCoach = role === 'ROLE_COACH' || role?.toLowerCase() === 'coach';
    
    // Log des changements de rôle pour debug
    if (wasAdmin !== this.isAdmin || wasCoach !== this.isCoach) {
      console.log('🔄 Navbar - Changement de rôle détecté:', {
        ancien: { admin: wasAdmin, coach: wasCoach },
        nouveau: { admin: this.isAdmin, coach: this.isCoach },
        role: role
      });
    }
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

  toggleSuiviMenu(): void {
    this.showSuiviMenu = !this.showSuiviMenu;
  }

  closeSuiviMenu(): void {
    this.showSuiviMenu = false;
  }

  // NOUVELLES MÉTHODES pour le menu admin
  toggleAdminMenu(): void {
    this.showAdminMenu = !this.showAdminMenu;
  }

  closeAdminMenu(): void {
    this.showAdminMenu = false;
  }

  isRouteActive(route: string): boolean {
    return this.router.url === route;
  }

  logout(): void {
    this.showUserMenu = false;
    
    // Utiliser la méthode logout du JwtService pour un nettoyage complet
    this.jwtService.logout();
    
    // Forcer la mise à jour des états locaux
    this.isAdmin = false;
    this.isCoach = false;
    this.userName = '';
    this.notificationsCount = 0;
    
    console.log('🔓 Navbar - Déconnexion et nettoyage des états');
    this.router.navigate(['/login']);
  }

updateNavbarVisibility(): void {
  const hiddenRoutes = ['/login', '/register'];

  // afficher navbar sur toutes les pages sauf login/register
  this.showNavbar = !hiddenRoutes.includes(this.router.url);
}

}