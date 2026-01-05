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
  // Données additionnelles pour l'interface
  isInactive?: boolean;         // Calculé côté frontend
  progressClass?: string;       // CSS class basée sur progressRate
  lastActivityDate?: Date;      // Parsed date pour tri
}

// Alias for backward compatibility
export interface EnhancedClient extends EnhancedClientDTO {}

export interface CoachStatsDTO {
  totalClients: number;
  activeClients: number;
  totalPrograms: number;
  averageProgress: number;
  inactiveClients: number;
}