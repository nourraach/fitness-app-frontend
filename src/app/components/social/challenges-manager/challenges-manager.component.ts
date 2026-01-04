import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ChallengeService } from '../../../services/challenge.service';
import { FriendService } from '../../../services/friend.service';
import { 
  Challenge, 
  ChallengeInvitation, 
  ChallengeLeaderboard, 
  CreateChallengeRequest,
  ChallengeType 
} from '../../../models/challenge.model';
import { User } from '../../../models/friend.model';

@Component({
  selector: 'app-challenges-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="challenges-manager-container">
      <!-- Tab Navigation -->
      <div class="tab-navigation">
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'my-challenges'"
          (click)="setActiveTab('my-challenges')">
          <i class="fas fa-trophy"></i>
          Mes Défis
          <span class="count-badge" *ngIf="myChallenges.length > 0">{{ myChallenges.length }}</span>
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'available'"
          (click)="setActiveTab('available')">
          <i class="fas fa-globe"></i>
          Disponibles
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'invitations'"
          (click)="setActiveTab('invitations')">
          <i class="fas fa-envelope"></i>
          Invitations
          <span class="count-badge notification" *ngIf="invitations.length > 0">{{ invitations.length }}</span>
        </button>
        <button 
          class="tab-btn"
          [class.active]="activeTab === 'create'"
          (click)="setActiveTab('create')">
          <i class="fas fa-plus"></i>
          Créer
        </button>
      </div>

      <!-- Content will be added in next part -->
    </div>
  `,
  styles: [`
    /* Styles will be added in next part */
  `]
})
export class ChallengesManagerComponent implements OnInit, OnDestroy {
  activeTab: string = 'my-challenges';
  myChallenges: Challenge[] = [];
  availableChallenges: Challenge[] = [];
  invitations: ChallengeInvitation[] = [];
  friends: User[] = [];
  
  createChallengeForm!: FormGroup;
  challengeTypes: any[] = [];
  selectedFriends: number[] = [];
  
  isLoading: boolean = false;
  isProcessing: boolean = false;
  isCreating: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private challengeService: ChallengeService,
    private friendService: FriendService,
    private fb: FormBuilder
  ) {
    this.initializeForm();
    this.loadChallengeTypes();
  }

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.createChallengeForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      type: ['', Validators.required],
      targetValue: ['', [Validators.required, Validators.min(1)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      isPublic: [false],
      maxParticipants: ['']
    });

    const today = new Date().toISOString().split('T')[0];
    this.createChallengeForm.patchValue({ startDate: today });
  }

  private loadChallengeTypes(): void {
    this.challengeTypes = this.challengeService.getChallengeTypes();
  }

  private loadData(): void {
    this.isLoading = true;

    this.challengeService.myChallenges$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(challenges => {
      this.myChallenges = challenges;
      this.isLoading = false;
    });

    this.challengeService.challenges$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(challenges => {
      this.availableChallenges = challenges;
    });

    this.challengeService.invitations$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(invitations => {
      this.invitations = invitations;
    });

    this.friendService.friends$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(friends => {
      this.friends = friends;
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  refreshChallenges(): void {
    this.loadData();
  }
}