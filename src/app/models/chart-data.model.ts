export interface ChartDataDTO {
  labels: string[];
  datasets: ChartDatasetDTO[];
}

export interface ChartDatasetDTO {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface WeeklyProgressDTO {
  weekStart: string;
  weekEnd: string;
  totalCaloriesConsumed: number;
  totalCaloriesBurned: number;
  totalActivityMinutes: number;
  averageWeight?: number;
  averageBMI?: number;
}

export interface MonthlyTrendsDTO {
  month: string;
  averageCaloriesConsumed: number;
  averageCaloriesBurned: number;
  averageActivityMinutes: number;
  weightChange: number;
  bmiChange: number;
}

export enum ChartType {
  WEIGHT_EVOLUTION = 'weight-evolution',
  BMI_EVOLUTION = 'bmi-evolution',
  CALORIES_COMPARISON = 'calories-comparison',
  ACTIVITY_DISTRIBUTION = 'activity-distribution',
  WEEKLY_PROGRESS = 'weekly-progress',
  MONTHLY_TRENDS = 'monthly-trends'
}

export interface ChartConfig {
  type: ChartType;
  title: string;
  chartJsType: 'line' | 'bar' | 'pie' | 'doughnut';
  options?: any;
}

export interface ChartFilters {
  days?: number;
  startDate?: string;
  endDate?: string;
  userId?: number;
}