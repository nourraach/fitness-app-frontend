export interface Client {
  id: number;
  name: string;
  email: string;
  age?: number;
  phone?: string;
  assignedDate?: string;
  lastActivity?: string;
  programsCount?: number;
  progressRate?: number;
  status?: 'active' | 'inactive' | 'pending';
  avatar?: string;
}

export interface ClientAssignment {
  clientId: number;
  coachId: number;
  assignedDate: string;
  status: string;
}
