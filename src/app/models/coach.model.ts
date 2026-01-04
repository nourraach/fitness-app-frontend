// Modèles pour l'espace Coach/Nutritionniste

export enum ProfessionalType {
  COACH_SPORTIF = 'COACH_SPORTIF',
  NUTRITIONNISTE = 'NUTRITIONNISTE',
  BOTH = 'BOTH'
}

export enum RelationType {
  COACH_SPORTIF = 'COACH_SPORTIF',
  NUTRITIONNISTE = 'NUTRITIONNISTE'
}

export enum RelationStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PlanStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum DietaryRestriction {
  VEGETARIAN = 'VEGETARIAN',
  VEGAN = 'VEGAN',
  GLUTEN_FREE = 'GLUTEN_FREE',
  DAIRY_FREE = 'DAIRY_FREE',
  NUT_FREE = 'NUT_FREE',
  LOW_SODIUM = 'LOW_SODIUM',
  KETO = 'KETO',
  PALEO = 'PALEO'
}

export enum AlertLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum RecommendationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export enum MetricType {
  WEIGHT = 'WEIGHT',
  ACTIVITY_FREQUENCY = 'ACTIVITY_FREQUENCY',
  CALORIES_BURNED = 'CALORIES_BURNED'
}

export interface CoachProfile {
  id: number;
  userId: number;
  type: ProfessionalType;
  certification?: string;
  specialization?: string;
  experienceYears?: number;
  businessName?: string;
  hourlyRate?: number;
  isActive: boolean;
  createdAt: Date;
}

export interface DashboardOverview {
  totalClients: number;
  activePrograms: number;
  completionRate: number;
  recentClients: ClientSummary[];
  urgentAlerts: Alert[];
  businessMetrics: BusinessMetrics;
}

export interface ClientSummary {
  clientId: number;
  nom: string;
  prenom: string;
  email: string;
  relationType: RelationType;
  status: RelationStatus;
  startDate: Date;
  activeProgramsCount: number;
  lastActivity?: Date;
  progressPercentage: number;
  adherenceRate: number;
  alertLevel: AlertLevel;
  alertMessage?: string;
}

export interface Alert {
  id: number;
  clientId: number;
  clientName: string;
  severity: AlertLevel;
  type: string;
  message: string;
  createdAt: Date;
}

export interface BusinessMetrics {
  monthlyRevenue: number;
  retentionRate: number;
  successRate: number;
  averageSessionsPerClient: number;
  clientGrowthRate: number;
}

export interface ClientFilters {
  search?: string;
  status?: RelationStatus;
  relationType?: RelationType;
  alertLevel?: AlertLevel;
}

export interface FoodItem {
  id: number;
  name: string;
  brand?: string;
  category: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g?: number;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isDairyFree: boolean;
}

export interface NutritionPlan {
  id: number;
  clientId: number;
  clientName: string;
  nutritionistId: number;
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  dailyCalories: number;
  dailyProtein: number;
  dailyCarbs: number;
  dailyFat: number;
  restrictions: DietaryRestriction[];
  status: PlanStatus;
  dailyPlans?: DailyMealPlan[];
}

export interface DailyMealPlan {
  id: number;
  date: Date;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface Meal {
  id: number;
  type: MealType;
  name: string;
  foods: FoodPortion[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface FoodPortion {
  foodItem: FoodItem;
  quantity: number; // en grammes
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  SNACK = 'SNACK'
}

export interface CreateNutritionPlanRequest {
  clientId: number;
  name: string;
  description?: string;
  startDate: string; // ISO date
  endDate?: string;
  dailyCalories?: number;
  restrictions?: DietaryRestriction[];
  autoGenerateMeals?: boolean;
}

export interface ShoppingList {
  id: number;
  planId: number;
  startDate: Date;
  endDate: Date;
  items: ShoppingItem[];
  totalEstimatedCost?: number;
}

export interface ShoppingItem {
  foodItem: FoodItem;
  totalQuantity: number;
  unit: string;
  estimatedCost?: number;
  category: string;
}

export interface ProgressChart {
  metricType: MetricType;
  dataPoints: DataPoint[];
  trend: 'INCREASING' | 'DECREASING' | 'STABLE';
  averageValue: number;
}

export interface DataPoint {
  date: Date;
  value: number;
  label?: string;
}

export interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  priority: RecommendationPriority;
  actionRequired: boolean;
  createdAt: Date;
}

export interface DietaryFilter {
  restrictions?: DietaryRestriction[];
  category?: string;
  maxCalories?: number;
  minProtein?: number;
}