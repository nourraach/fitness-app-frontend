import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { JwtService } from '../service/jwt.service';
import { StorageService } from '../service/storage-service.service';
import { NotificationBadgeComponent } from '../components/notifications/notification-badge/notification-badge.component';
import { NotificationCenterComponent } from '../components/notifications/notification-center/notification-center.component';
import { NotificationStateService } from '../services/notification-state.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-coach-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBadgeComponent, NotificationCenterComponent],
  templateUrl: './coach-navbar.component.html',
  styleUrls: ['./coach-navbar.component.css']
})
export class CoachNavbarComponent implements OnInit, OnDestroy {
  coachName: string = 'Coach';
  showUserMenu: boolean = false;
  showNotificationCenter: boolean = false;
  notificationsCount: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private jwtService: JwtService,
    private storageService: StorageService,
    private notificationStateService: NotificationStateService
  ) {}

  ngOnInit(): void {
    this.getCoachName();
    this.initializeNotifications();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeNotifications(): void {
    // Charger les notifications de motivation locales
    this.loadMotivationNotifications();
    
    // S'abonner aux changements du compteur
    this.notificationStateService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.notificationsCount = count;
    });
  }

  private loadMotivationNotifications(): void {
    // Messages de motivation pour sport et santé
    const motivationMessages = [
      { id: 1, title: '💪 Motivation Sport', message: 'Chaque entraînement vous rapproche de vos objectifs!', type: 'MOTIVATION', read: false },
      { id: 2, title: '🥗 Conseil Nutrition', message: 'Une alimentation équilibrée est la clé du succès!', type: 'HEALTH', read: false },
      { id: 3, title: '🏃 Activité du jour', message: 'N\'oubliez pas de bouger au moins 30 minutes aujourd\'hui!', type: 'MOTIVATION', read: false },
      { id: 4, title: '💧 Hydratation', message: 'Pensez à boire au moins 2L d\'eau par jour!', type: 'HEALTH', read: false },
      { id: 5, title: '🎯 Objectif', message: 'Vos clients comptent sur vous, continuez votre excellent travail!', type: 'MOTIVATION', read: false }
    ];

    // Convertir en format notification et ajouter au state
    const notifications = motivationMessages.map(msg => ({
      id: msg.id,
      userId: this.jwtService.getUserId() || 0,
      title: msg.title,
      message: msg.message,
      type: msg.type as any,
      read: msg.read,
      createdAt: new Date().toISOString(),
      actionUrl: null,
      metadata: null
    }));

    this.notificationStateService.setNotifications(notifications as any);
    this.notificationStateService.setUnreadCount(notifications.filter(n => !n.read).length);
  }

  getCoachName(): void {
    const role = this.jwtService.getRole();
    if (role) {
      this.coachName = role.replace('ROLE_', '');
    }
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
  }

  toggleNotificationCenter(): void {
    this.showNotificationCenter = !this.showNotificationCenter;
  }

  logout(): void {
    this.showUserMenu = false;
    
    // Utiliser la méthode logout du JwtService pour un nettoyage complet
    this.jwtService.logout();
    
    console.log('🔓 Coach Navbar - Déconnexion complète');
    this.router.navigate(['/login']);
  }
}
