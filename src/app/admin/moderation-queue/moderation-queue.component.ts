import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { ModerationItemDTO } from '../../models/admin.model';

@Component({
  selector: 'app-moderation-queue',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './moderation-queue.component.html',
  styleUrls: ['./moderation-queue.component.css']
})
export class ModerationQueueComponent implements OnInit, OnDestroy {
  moderationItems: ModerationItemDTO[] = [];
  selectedItem: ModerationItemDTO | null = null;
  isLoading = true;
  
  // Filters
  statusFilter: 'all' | 'PENDING' | 'APPROVED' | 'REJECTED' = 'PENDING';
  typeFilter = '';
  
  private subscriptions: Subscription[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadModerationQueue();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadModerationQueue(): void {
    this.isLoading = true;
    
    const queueSub = this.adminService.getModerationQueue().subscribe({
      next: (items) => {
        this.moderationItems = items;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading moderation queue:', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.push(queueSub);
  }

  private applyFilters(): void {
    let filtered = this.moderationItems;
    
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === this.statusFilter);
    }
    
    if (this.typeFilter) {
      filtered = filtered.filter(item => item.itemType === this.typeFilter);
    }
    
    this.moderationItems = filtered;
  }

  onFilterChange(): void {
    this.loadModerationQueue();
  }

  selectItem(item: ModerationItemDTO): void {
    this.selectedItem = item;
  }

  moderateItem(item: ModerationItemDTO, action: 'APPROVED' | 'REJECTED', notes?: string): void {
    const moderateSub = this.adminService.moderateItem(item.id, action, notes).subscribe({
      next: () => {
        // Update item status
        const index = this.moderationItems.findIndex(i => i.id === item.id);
        if (index !== -1) {
          this.moderationItems[index].status = action;
          this.moderationItems[index].moderatedAt = new Date().toISOString();
          this.moderationItems[index].moderationNotes = notes;
        }
        
        if (this.selectedItem?.id === item.id) {
          this.selectedItem = null;
        }
        
        this.applyFilters();
      },
      error: (error: any) => {
        console.error('Error moderating item:', error);
      }
    });
    this.subscriptions.push(moderateSub);
  }

  approveItem(item: ModerationItemDTO): void {
    this.moderateItem(item, 'APPROVED');
  }

  rejectItem(item: ModerationItemDTO, notes?: string): void {
    const reason = notes || prompt('Raison du rejet (optionnel):');
    this.moderateItem(item, 'REJECTED', reason || undefined);
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'status-pending';
      case 'APPROVED':
        return 'status-approved';
      case 'REJECTED':
        return 'status-rejected';
      default:
        return 'status-default';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'APPROVED':
        return 'Approuvé';
      case 'REJECTED':
        return 'Rejeté';
      default:
        return status;
    }
  }

  getItemTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'MESSAGE': 'fas fa-comment',
      'POST': 'fas fa-file-alt',
      'PROGRAM': 'fas fa-dumbbell',
      'USER': 'fas fa-user',
      'IMAGE': 'fas fa-image'
    };
    return icons[type] || 'fas fa-flag';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString('fr-FR');
  }

  closeItemDetails(): void {
    this.selectedItem = null;
  }
}