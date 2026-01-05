export interface EnhancedClientDTO {
  id: number;
  name: string;
  email: string;
  age?: number;
  phone?: string;
  assignedDate?: string;
  status: string;
  
  // Nouvelles données calculées automatiquement par le backend
  programsCount: number;        // Nombre réel de programmes
  progressRate: number;         // Taux de progression (0-100%)
  lastActivity: string;         // Dernière activité ou "Aucune activité"
  
  // Données additionnelles pour l'interface (calculées côté frontend)
  isInactive?: boolean;         // Calculé côté frontend (lastActivity > 7 jours)
  progressClass?: string;       // CSS class basée sur progressRate
  lastActivityDate?: Date | null;   // Parsed date pour tri
}

export interface ClientStatistics {
  totalClients: number;
  activeClients: number;
  inactiveClients: number;
  averageProgressRate: number;
  clientsWithPrograms: number;
  clientsWithoutPrograms: number;
}

export interface ClientProgressSummary {
  clientId: number;
  clientName: string;
  totalPrograms: number;
  completedPrograms: number;
  inProgressPrograms: number;
  overallProgressRate: number;
  lastActivityDate?: Date;
  weeklyGoalAchievement: number;
  monthlyGoalAchievement: number;
}

export interface ClientActivitySummary {
  clientId: number;
  clientName: string;
  lastLoginDate?: Date;
  lastWorkoutDate?: Date;
  lastNutritionLogDate?: Date;
  totalWorkouts: number;
  totalNutritionLogs: number;
  averageWorkoutsPerWeek: number;
  streakDays: number;
  isActive: boolean;
}

// Utilitaires pour les clients améliorés
export class EnhancedClientUtils {
  
  /**
   * Calculer si un client est inactif (plus de 7 jours sans activité)
   */
  static isClientInactive(client: EnhancedClientDTO): boolean {
    if (client.lastActivity === "Aucune activité") return true;
    
    try {
      const lastActivityDate = new Date(client.lastActivity);
      const daysDiff = Math.floor((Date.now() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 7;
    } catch (error) {
      return true;
    }
  }

  /**
   * Obtenir la classe CSS basée sur le taux de progression
   */
  static getProgressClass(progressRate: number): string {
    if (progressRate >= 80) return 'progress-excellent';
    if (progressRate >= 60) return 'progress-good';
    if (progressRate >= 40) return 'progress-average';
    if (progressRate >= 20) return 'progress-poor';
    return 'progress-none';
  }

  /**
   * Parser la date de dernière activité
   */
  static parseLastActivityDate(lastActivity: string): Date | null {
    if (lastActivity === "Aucune activité") return null;
    
    try {
      return new Date(lastActivity);
    } catch (error) {
      return null;
    }
  }

  /**
   * Enrichir un client avec les données calculées côté frontend
   */
  static enrichClient(client: EnhancedClientDTO): EnhancedClientDTO {
    return {
      ...client,
      isInactive: this.isClientInactive(client),
      progressClass: this.getProgressClass(client.progressRate),
      lastActivityDate: this.parseLastActivityDate(client.lastActivity)
    };
  }

  /**
   * Trier les clients par différents critères
   */
  static sortClients(clients: EnhancedClientDTO[], sortBy: 'name' | 'progressRate' | 'programsCount' | 'lastActivity'): EnhancedClientDTO[] {
    return [...clients].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'progressRate':
          return b.progressRate - a.progressRate;
        case 'programsCount':
          return b.programsCount - a.programsCount;
        case 'lastActivity':
          const dateA = this.parseLastActivityDate(a.lastActivity);
          const dateB = this.parseLastActivityDate(b.lastActivity);
          if (!dateA && !dateB) return 0;
          if (!dateA) return 1;
          if (!dateB) return -1;
          return dateB.getTime() - dateA.getTime();
        default:
          return 0;
      }
    });
  }

  /**
   * Filtrer les clients inactifs
   */
  static getInactiveClients(clients: EnhancedClientDTO[]): EnhancedClientDTO[] {
    return clients.filter(client => this.isClientInactive(client));
  }

  /**
   * Obtenir les statistiques des clients
   */
  static getClientStatistics(clients: EnhancedClientDTO[]): ClientStatistics {
    const totalClients = clients.length;
    const activeClients = clients.filter(c => !this.isClientInactive(c)).length;
    const inactiveClients = totalClients - activeClients;
    const averageProgressRate = totalClients > 0 
      ? clients.reduce((sum, c) => sum + c.progressRate, 0) / totalClients 
      : 0;
    const clientsWithPrograms = clients.filter(c => c.programsCount > 0).length;
    const clientsWithoutPrograms = totalClients - clientsWithPrograms;

    return {
      totalClients,
      activeClients,
      inactiveClients,
      averageProgressRate: Math.round(averageProgressRate),
      clientsWithPrograms,
      clientsWithoutPrograms
    };
  }
}