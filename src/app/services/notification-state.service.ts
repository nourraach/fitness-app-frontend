import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { InAppNotification } from '../models/in-app-notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationStateService {
  private notificationsSubject = new BehaviorSubject<InAppNotification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  notifications$ = this.notificationsSubject.asObservable();
  unreadCount$ = this.unreadCountSubject.asObservable();
  loading$ = this.loadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  get currentNotifications(): InAppNotification[] {
    return this.notificationsSubject.value;
  }

  get currentUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  setNotifications(notifications: InAppNotification[]): void {
    this.notificationsSubject.next(notifications);
    this.updateUnreadCount();
  }

  addNotification(notification: InAppNotification): void {
    const current = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...current]);
    this.updateUnreadCount();
  }

  updateNotification(updated: InAppNotification): void {
    const current = this.notificationsSubject.value;
    const index = current.findIndex(n => n.id === updated.id);
    if (index !== -1) {
      current[index] = updated;
      this.notificationsSubject.next([...current]);
      this.updateUnreadCount();
    }
  }

  markAsRead(id: number): void {
    const current = this.notificationsSubject.value;
    const notification = current.find(n => n.id === id);
    if (notification && !notification.read) {
      notification.read = true;
      this.notificationsSubject.next([...current]);
      this.unreadCountSubject.next(Math.max(0, this.unreadCountSubject.value - 1));
    }
  }

  markAsUnread(id: number): void {
    const current = this.notificationsSubject.value;
    const notification = current.find(n => n.id === id);
    if (notification && notification.read) {
      notification.read = false;
      this.notificationsSubject.next([...current]);
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
    }
  }

  markAllAsRead(): void {
    const current = this.notificationsSubject.value;
    current.forEach(n => n.read = true);
    this.notificationsSubject.next([...current]);
    this.unreadCountSubject.next(0);
  }

  setUnreadCount(count: number): void {
    this.unreadCountSubject.next(count);
  }

  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  clearError(): void {
    this.errorSubject.next(null);
  }

  private updateUnreadCount(): void {
    const count = this.notificationsSubject.value.filter(n => !n.read).length;
    this.unreadCountSubject.next(count);
  }
}
