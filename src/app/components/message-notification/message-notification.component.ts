import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../services/message.service';
import { MessageDTO } from '../../models/message.model';
import { JwtService } from '../../service/jwt.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-message-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="message-notifications">
      <div 
        *ngFor="let notification of notifications" 
        class="notification-item"
        [class.fade-out]="notification.fadeOut"
        (click)="openMessage(notification.message)">
        
        <div class="notification-content">
          <div class="notification-header">
            <i class="pi pi-comments"></i>
            <span class="sender-name">{{ notification.message.expediteurNom }}</span>
            <button class="close-btn" (click)="dismissNotification(notification, $event)">
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="notification-message">
            {{ notification.message.contenu }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .message-notifications {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      max-width: 300px;
    }

    .notification-item {
      background: white;
      border: 1px solid #ddd;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      cursor: pointer;
      transition: all 0.3s ease;
      animation: slideIn 0.3s ease-out;
    }

    .notification-item:hover {
      transform: translateX(-5px);
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
    }

    .notification-item.fade-out {
      animation: slideOut 0.3s ease-in forwards;
    }

    .notification-content {
      padding: 12px;
    }

    .notification-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .notification-header i.pi-comments {
      color: #007bff;
      margin-right: 8px;
    }

    .sender-name {
      font-weight: 600;
      color: #333;
      flex: 1;
    }

    .close-btn {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
    }

    .close-btn:hover {
      background: #f0f0f0;
    }

    .notification-message {
      color: #666;
      font-size: 14px;
      line-height: 1.4;
      max-height: 60px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `]
})
export class MessageNotificationComponent implements OnInit, OnDestroy {
  notifications: { message: MessageDTO, fadeOut: boolean }[] = [];
  private currentUserId: number | null = null;
  private subscription: Subscription | null = null;

  constructor(
    private messageService: MessageService,
    private jwtService: JwtService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.jwtService.getUserId();
    
    if (this.currentUserId) {
      this.subscription = this.messageService.messages$.subscribe({
        next: (message) => {
          // Afficher seulement les messages reçus (pas les nôtres)
          if (message.expediteurId !== this.currentUserId) {
            this.showNotification(message);
          }
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private showNotification(message: MessageDTO): void {
    const notification = { message, fadeOut: false };
    this.notifications.push(notification);

    // Auto-dismiss après 5 secondes
    setTimeout(() => {
      this.dismissNotification(notification);
    }, 5000);
  }

  dismissNotification(notification: { message: MessageDTO, fadeOut: boolean }, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    notification.fadeOut = true;
    
    setTimeout(() => {
      const index = this.notifications.indexOf(notification);
      if (index > -1) {
        this.notifications.splice(index, 1);
      }
    }, 300);
  }

  openMessage(message: MessageDTO): void {
    // Naviguer vers la messagerie et sélectionner la conversation
    this.router.navigate(['/messaging'], { 
      queryParams: { conversationId: message.conversationId } 
    });
    
    // Fermer la notification
    const notification = this.notifications.find(n => n.message.id === message.id);
    if (notification) {
      this.dismissNotification(notification);
    }
  }
}