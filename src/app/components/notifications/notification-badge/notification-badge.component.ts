import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationStateService } from '../../../services/notification-state.service';

@Component({
  selector: 'app-notification-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button class="notification-badge-btn" (click)="onBadgeClick()" [class.has-notifications]="count > 0">
      <i class="fas fa-bell"></i>
      <span class="badge" *ngIf="count > 0" [class.pulse]="isNew">
        {{ count > 99 ? '99+' : count }}
      </span>
    </button>
  `,
  styles: [`
    .notification-badge-btn {
      position: relative;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 8px;
      color: #666;
      font-size: 18px;
      transition: all 0.2s ease;
    }
    .notification-badge-btn:hover {
      color: #007bff;
    }
    .notification-badge-btn.has-notifications {
      color: #333;
    }
    .badge {
      position: absolute;
      top: 0;
      right: 0;
      background: #dc3545;
      color: white;
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 600;
      min-width: 16px;
      text-align: center;
      line-height: 1.2;
    }
    .badge.pulse {
      animation: pulse 1s ease-in-out 3;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.2); }
    }
  `]
})
export class NotificationBadgeComponent implements OnInit, OnDestroy {
  @Input() count: number = 0;
  @Output() badgeClick = new EventEmitter<void>();
  
  isNew: boolean = false;
  private destroy$ = new Subject<void>();
  private previousCount: number = 0;

  constructor(private stateService: NotificationStateService) {}

  ngOnInit(): void {
    this.stateService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      if (count > this.previousCount) {
        this.isNew = true;
        setTimeout(() => this.isNew = false, 3000);
      }
      this.count = count;
      this.previousCount = count;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onBadgeClick(): void {
    this.badgeClick.emit();
  }
}
