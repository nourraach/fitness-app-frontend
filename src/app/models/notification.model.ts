export enum TypeNotification {
  RAPPEL_REPAS = 'RAPPEL_REPAS',
  MOTIVATION = 'MOTIVATION',
  OBJECTIF_ATTEINT = 'OBJECTIF_ATTEINT',
  RAPPEL_ACTIVITE = 'RAPPEL_ACTIVITE',
  CONSEIL_NUTRITION = 'CONSEIL_NUTRITION'
}

export interface NotificationDTO {
  id?: number;
  type: TypeNotification;
  titre: string;
  message: string;
  dateProgrammee?: string;
  dateEnvoi?: string;
  estLue: boolean;
  estEnvoyee: boolean;
}

export interface PreferenceNotificationDTO {
  id?: number;
  // Rappels de repas
  rappelPetitDejeuner?: boolean;
  heurePetitDejeuner?: string;
  rappelDejeuner?: boolean;
  heureDejeuner?: string;
  rappelDiner?: boolean;
  heureDiner?: string;
  rappelCollation?: boolean;
  heureCollation?: string;
  // Messages de motivation
  motivationQuotidienne?: boolean;
  heureMotivation?: string;
  // Rappels d'activité
  rappelActivite?: boolean;
  heureActivite?: string;
  // Notifications générales
  notificationsActives?: boolean;
}
