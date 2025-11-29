import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { JwtService } from '../service/jwt.service';
import { CoachNavbarComponent } from '../coach-navbar/coach-navbar.component';

interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
  trend: string;
  trendUp: boolean;
}

interface RecentActivity {
  client: string;
  action: string;
  time: string;
  icon: string;
}

@Component({
  selector: 'app-coach-home',
  standalone: true,
  imports: [CommonModule, RouterModule, CoachNavbarComponent],
  templateUrl: './coach-home.component.html',
  styleUrls: ['./coach-home.component.css']
})
export class CoachHomeComponent implements OnInit {
  coachName: string = 'Coach';
  currentDate: string = '';
  stats: StatCard[] = [];
  recentActivities: RecentActivity[] = [];

  constructor(
    private router: Router,
    private jwtService: JwtService
  ) {}

  ngOnInit(): void {
    this.getCoachName();
    this.setCurrentDate();
    this.generateRandomStats();
    this.generateRecentActivities();
  }

  getCoachName(): void {
    const role = this.jwtService.getRole();
    if (role) {
      this.coachName = role.replace('ROLE_', '');
    }
  }

  setCurrentDate(): void {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    this.currentDate = new Date().toLocaleDateString('fr-FR', options);
  }

  generateRandomStats(): void {
    const totalClients = Math.floor(Math.random() * 30) + 15; // 15-45
    const activeToday = Math.floor(Math.random() * totalClients * 0.6) + 5; // 5-60% des clients
    const programsCreated = Math.floor(Math.random() * 50) + 20; // 20-70
    const avgProgress = (Math.random() * 30 + 70).toFixed(1); // 70-100%

    this.stats = [
      {
        title: 'Clients Actifs',
        value: totalClients.toString(),
        icon: 'pi-users',
        color: '#667eea',
        trend: '+' + Math.floor(Math.random() * 5 + 1) + ' ce mois',
        trendUp: true
      },
      {
        title: 'Actifs Aujourd\'hui',
        value: activeToday.toString(),
        icon: 'pi-chart-line',
        color: '#28a745',
        trend: Math.floor((activeToday / totalClients) * 100) + '% du total',
        trendUp: true
      },
      {
        title: 'Programmes Créés',
        value: programsCreated.toString(),
        icon: 'pi-calendar',
        color: '#ffc107',
        trend: '+' + Math.floor(Math.random() * 3 + 1) + ' cette semaine',
        trendUp: true
      },
      {
        title: 'Progrès Moyen',
        value: avgProgress + '%',
        icon: 'pi-chart-bar',
        color: '#17a2b8',
        trend: '+' + (Math.random() * 5 + 1).toFixed(1) + '% vs mois dernier',
        trendUp: true
      }
    ];
  }

  generateRecentActivities(): void {
    const clients = ['Marie Dubois', 'Jean Martin', 'Sophie Laurent', 'Pierre Durand', 'Emma Bernard'];
    const actions = [
      { text: 'a complété une séance', icon: 'pi-check-circle' },
      { text: 'a ajouté un repas', icon: 'pi-apple' },
      { text: 'a mis à jour son poids', icon: 'pi-chart-line' },
      { text: 'a envoyé un message', icon: 'pi-comment' },
      { text: 'a commencé un programme', icon: 'pi-play' }
    ];

    this.recentActivities = [];
    for (let i = 0; i < 5; i++) {
      const client = clients[Math.floor(Math.random() * clients.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const minutes = Math.floor(Math.random() * 120) + 1;
      
      let timeText = '';
      if (minutes < 60) {
        timeText = `Il y a ${minutes} min`;
      } else {
        const hours = Math.floor(minutes / 60);
        timeText = `Il y a ${hours}h`;
      }

      this.recentActivities.push({
        client: client,
        action: action.text,
        time: timeText,
        icon: action.icon
      });
    }
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
