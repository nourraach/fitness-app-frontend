import { Component, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ContactDTO } from '../../../models/contact.model';
import { FriendService } from '../../../services/friend.service';

@Component({
  selector: 'app-contact-selection-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isVisible" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Nouvelle conversation</h3>
          <button class="close-btn" (click)="closeModal()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="search-section">
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            (input)="onSearchInput()"
            placeholder="Rechercher un ami..."
            class="search-input">
        </div>
        
        <div class="contacts-list" *ngIf="!isLoading">
          <div 
            *ngFor="let contact of filteredContacts"
            class="contact-item"
            (click)="selectContact(contact)">
            <div class="contact-avatar">
              <div class="avatar-circle" [style.background]="'#43e97b'">
                {{ contact.name.charAt(0).toUpperCase() }}
              </div>
              <div class="online-indicator" *ngIf="contact.isOnline"></div>
            </div>
            <div class="contact-info">
              <div class="contact-name">{{ contact.name }}</div>
              <div class="contact-email">{{ contact.email }}</div>
            </div>
            <div class="contact-badges">
              <span class="badge friend">Ami</span>
            </div>
          </div>
          
          <div *ngIf="filteredContacts.length === 0 && !searchQuery" class="no-contacts">
            <i class="fas fa-user-friends fa-2x"></i>
            <p>Aucun ami trouvé</p>
            <small>Ajoutez des amis dans l'espace social pour leur envoyer des messages</small>
          </div>
          
          <div *ngIf="filteredContacts.length === 0 && searchQuery" class="no-contacts">
            <i class="fas fa-search fa-2x"></i>
            <p>Aucun ami correspondant</p>
            <small>Essayez un autre terme de recherche</small>
          </div>
        </div>
        
        <div class="loading" *ngIf="isLoading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Chargement de vos amis...</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h3 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #666;
      padding: 5px;
    }

    .search-section {
      padding: 15px 20px;
      border-bottom: 1px solid #eee;
    }

    .search-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
    }

    .contacts-list {
      flex: 1;
      overflow-y: auto;
      max-height: 400px;
    }

    .contact-item {
      display: flex;
      align-items: center;
      padding: 15px 20px;
      cursor: pointer;
      transition: background 0.2s;
      border-bottom: 1px solid #f5f5f5;
    }

    .contact-item:hover {
      background: #f8f9fa;
    }

    .contact-avatar {
      position: relative;
      margin-right: 12px;
    }

    .avatar-circle {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
    }

    .online-indicator {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 12px;
      height: 12px;
      background: #28a745;
      border: 2px solid white;
      border-radius: 50%;
    }

    .contact-info {
      flex: 1;
    }

    .contact-name {
      font-weight: 600;
      color: #333;
      margin-bottom: 2px;
    }

    .contact-email {
      font-size: 12px;
      color: #666;
    }

    .contact-badges {
      display: flex;
      gap: 5px;
    }

    .badge {
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 500;
    }

    .badge.friend {
      background: #e3f2fd;
      color: #1976d2;
    }

    .no-contacts {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .no-contacts i {
      color: #ddd;
      margin-bottom: 10px;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: #666;
      gap: 10px;
    }
  `]
})
export class ContactSelectionModalComponent implements OnInit, OnDestroy {
  @Input() isVisible = false;
  @Output() contactSelected = new EventEmitter<ContactDTO>();
  @Output() modalClosed = new EventEmitter<void>();

  searchQuery = '';
  contacts: ContactDTO[] = [];
  filteredContacts: ContactDTO[] = [];
  isLoading = false;

  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  constructor(private friendService: FriendService) {}

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.loadFriends();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchDebounce(): void {
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.filterContacts(query);
    });
  }

  private loadFriends(): void {
    this.isLoading = true;
    
    // S'abonner à la liste des amis du FriendService
    this.friendService.friends$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(friends => {
      console.log('📱 Amis chargés pour messagerie:', friends);
      
      // Convertir les amis en ContactDTO
      this.contacts = friends.map(friend => ({
        id: friend.id,
        name: friend.nom || friend.email?.split('@')[0] || 'Utilisateur',
        email: friend.email || '',
        role: 'Client' as const,
        isOnline: friend.isOnline || false,
        lastSeen: friend.lastSeen,
        isFriend: true,
        isCoach: false
      }));
      
      this.filteredContacts = [...this.contacts];
      this.isLoading = false;
    });
    
    // Rafraîchir les données
    this.friendService.refreshAllData();
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  private filterContacts(query: string): void {
    if (!query.trim()) {
      this.filteredContacts = this.contacts;
      return;
    }

    const searchTerm = query.toLowerCase();
    this.filteredContacts = this.contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm))
    );
  }

  selectContact(contact: ContactDTO): void {
    this.contactSelected.emit(contact);
    this.closeModal();
  }

  closeModal(): void {
    this.searchQuery = '';
    this.filteredContacts = [...this.contacts];
    this.modalClosed.emit();
  }

  formatLastSeen(date: Date): string {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'à l\'instant';
    } else if (diffInHours < 24) {
      return `il y a ${Math.floor(diffInHours)}h`;
    } else {
      return `il y a ${Math.floor(diffInHours / 24)}j`;
    }
  }
}