import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { SystemStatsDTO } from '../../models/admin.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  systemStats: SystemStatsDTO | null = null;
  isLoading = true;
  lastUpdated: Date = new Date();
  
  // Real-time data
  realtimeMetrics = {
    activeUsers: 0,
    currentSessions: 0,
    serverLoad: 0,
    memoryUsage: 0,
    diskUsage: 0
  };

  // Alerts
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: Date;
  }> = [];

  private subscriptions: Subscription[] = [];
  private refreshInterval = 30000; // 30 seconds

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupRealTimeUpdates();
    this.loadRecentAlerts();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    
    const statsSub = this.adminService.getSystemStats().subscribe({
      next: (stats) => {
        this.systemStats = stats;
        this.isLoading = false;
        this.lastUpdated = new Date();
      },
      error: (error: any) => {
        console.error('Error loading system stats:', error);
        this.isLoading = false;
        this.addAlert('error', 'Erreur de chargement', 'Impossible de charger les statistiques système');
      }
    });
    this.subscriptions.push(statsSub);
  }

  private setupRealTimeUpdates(): void {
    // Update dashboard data every 30 seconds
    const intervalSub = interval(this.refreshInterval).subscribe(() => {
      this.loadDashboardData();
      this.updateRealtimeMetrics();
    });
    this.subscriptions.push(intervalSub);

    // Simulate real-time metrics updates every 5 seconds
    const realtimeSub = interval(5000).subscribe(() => {
      this.updateRealtimeMetrics();
    });
    this.subscriptions.push(realtimeSub);
  }

  private updateRealtimeMetrics(): void {
    // Simulate real-time data updates
    this.realtimeMetrics = {
      activeUsers: Math.floor(Math.random() * 50) + 20,
      currentSessions: Math.floor(Math.random() * 100) + 50,
      serverLoad: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100
    };

    // Check for alerts based on metrics
    this.checkMetricAlerts();
  }

  private checkMetricAlerts(): void {
    if (this.realtimeMetrics.serverLoad > 80) {
      this.addAlert('warning', 'Charge serveur élevée', `Charge CPU: ${this.realtimeMetrics.serverLoad.toFixed(1)}%`);
    }
    
    if (this.realtimeMetrics.memoryUsage > 85) {
      this.addAlert('error', 'Mémoire critique', `Utilisation mémoire: ${this.realtimeMetrics.memoryUsage.toFixed(1)}%`);
    }
    
    if (this.realtimeMetrics.diskUsage > 90) {
      this.addAlert('error', 'Espace disque critique', `Utilisation disque: ${this.realtimeMetrics.diskUsage.toFixed(1)}%`);
    }
  }

  private loadRecentAlerts(): void {
    // Load recent system alerts
    const alertsSub = this.adminService.getRecentAlerts().subscribe({
      next: (alerts: any[]) => {
        this.alerts = alerts.map((alert: any) => ({
          ...alert,
          timestamp: new Date(alert.timestamp)
        }));
      },
      error: (error: any) => {
        console.error('Error loading alerts:', error);
      }
    });
    this.subscriptions.push(alertsSub);
  }

  private addAlert(type: 'info' | 'warning' | 'error' | 'success', title: string, message: string): void {
    const alert = {
      id: Date.now().toString(),
      type,
      title,
      message,
      timestamp: new Date()
    };
    
    this.alerts.unshift(alert);
    
    // Keep only last 10 alerts
    if (this.alerts.length > 10) {
      this.alerts = this.alerts.slice(0, 10);
    }
  }

  dismissAlert(alertId: string): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
  }

  refreshDashboard(): void {
    this.loadDashboardData();
  }

  getMetricColor(value: number, thresholds: { warning: number; critical: number }): string {
    if (value >= thresholds.critical) return '#dc3545';
    if (value >= thresholds.warning) return '#ffc107';
    return '#28a745';
  }

  getMetricIcon(metricType: string): string {
    const icons = {
      users: 'fas fa-users',
      sessions: 'fas fa-desktop',
      cpu: 'fas fa-microchip',
      memory: 'fas fa-memory',
      disk: 'fas fa-hdd',
      network: 'fas fa-network-wired'
    };
    return icons[metricType as keyof typeof icons] || 'fas fa-chart-bar';
  }

  getAlertIcon(type: string): string {
    const icons = {
      info: 'fas fa-info-circle',
      warning: 'fas fa-exclamation-triangle',
      error: 'fas fa-times-circle',
      success: 'fas fa-check-circle'
    };
    return icons[type as keyof typeof icons] || 'fas fa-bell';
  }

  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }

  formatPercentage(value: number): string {
    return value.toFixed(1) + '%';
  }

  formatTime(date: Date): string {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getUptimeText(uptimeSeconds: number): string {
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}j ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
}