import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { JwtService } from '../service/jwt.service';
import { StorageService } from '../service/storage-service.service';
import { WebsocketService } from '../services/websocket.service';
import { NotificationBadgeComponent } from '../components/notifications/notification-badge/notification-badge.component';
import { NotificationCenterComponent } from '../components/notifications/notification-center/notification-center.component';
import { NotificationStateService } from '../services/notification-state.service';
import { InAppNotificationService } from '../services/in-app-notification.service';
import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, NotificationBadgeComponent, NotificationCenterComponent]
})
export class NavbarComponent implements OnInit, OnDestroy {
  isAdmin: boolean = false;
  isCoach: boolean = false;
  showNavbar: boolean = true;
  userName: string = 'Admin';
  showUserMenu: boolean = false;
  showSuiviMenu: boolean = false;
  showAdminMenu: boolean = false;
  showNutritionMenu: boolean = false;
  showAnalyticsMenu: boolean = false;
  showSocialMenu: boolean = false;
  showNotificationCenter: boolean = false;
  isScrolled: boolean = false;
  private lastScrollTop: number = 0;
  notificationsCount: number = 0;
  messageNotificationsCount: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router, 
    private jwtService: JwtService,
    private storageService: StorageService,
    private websocketService: WebsocketService,
    private notificationStateService: NotificationStateService,
    private inAppNotificationService: InAppNotificationService
  ) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.user-dropdown')) {
      this.showUserMenu = false;
    }
    if (!target.closest('.nav-dropdown')) {
      this.showSuiviMenu = false;
      this.showAdminMenu = false;
      this.showNutritionMenu = false;
      this.showAnalyticsMenu = false;
      this.showSocialMenu = false;
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
  
  const token = this.storageService.getItem('jwt');
  if (token && this.showNavbar) {
    this.initializeMessageNotifications();
    this.initializeInAppNotifications();
  }

  this.router.events.pipe(takeUntil(this.destroy$)).subscribe(() => {
    this.updateNavbarVisibility();
    this.checkRole();
    this.getUserName();
  });
}

private initializeInAppNotifications(): void {
  // Connecter le WebSocket pour recevoir les notifications en temps réel
  this.websocketService.connect();
  console.log('🔔 WebSocket connexion initiée pour les notifications');

  // Charger le compteur initial
  this.loadNotificationCount();

  // S'abonner aux changements du compteur
  this.notificationStateService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
    this.notificationsCount = count;
  });

  // S'abonner aux nouvelles notifications WebSocket
  this.websocketService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(notification => {
    console.log('🔔 Nouvelle notification reçue via WebSocket:', notification);
    this.notificationStateService.addNotification(notification);
  });

  // Polling pour rafraîchir les notifications toutes les 30 secondes
  interval(30000).pipe(takeUntil(this.destroy$)).subscribe(() => {
    this.loadNotificationCount();
  });
}

private loadNotificationCount(): void {
  this.inAppNotificationService.getUnreadCount().subscribe({
    next: (count) => {
      console.log('🔔 Notifications non lues:', count);
      this.notificationStateService.setUnreadCount(count);
    },
    error: (err) => {
      console.log('Erreur chargement notifications:', err);
    }
  });
}

toggleNotificationCenter(): void {
  this.showNotificationCenter = !this.showNotificationCenter;
}

ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}

private initializeMessageNotifications(): void {
  // S'abonner aux nouveaux messages pour les notifications
  this.websocketService.messages$.pipe(takeUntil(this.destroy$)).subscribe(message => {
    // Incrémenter le compteur si ce n'est pas notre message et qu'on n'est pas sur la page messaging
    if (message.senderId !== this.jwtService.getUserId() && 
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

  // NOUVELLES MÉTHODES pour les menus groupés USER
  toggleNutritionMenu(): void {
    this.showNutritionMenu = !this.showNutritionMenu;
  }

  closeNutritionMenu(): void {
    this.showNutritionMenu = false;
  }

  toggleAnalyticsMenu(): void {
    this.showAnalyticsMenu = !this.showAnalyticsMenu;
  }

  closeAnalyticsMenu(): void {
    this.showAnalyticsMenu = false;
  }

  toggleSocialMenu(): void {
    this.showSocialMenu = !this.showSocialMenu;
  }

  closeSocialMenu(): void {
    this.showSocialMenu = false;
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