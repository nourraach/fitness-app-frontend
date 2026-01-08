import { Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './home/home.component';
import { GestUsersComponent } from './components/gest-users/gest-users.component';
import { AddUserComponent } from './components/add-user/add-user.component';
import { AdminGuard } from './guards/admin.guard';
import { AuthGuard } from './guards/auth.guard';
import { EditUserComponent } from './components/edit-user/edit-user.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ProfileComponent } from './profile/profile.component';
import { ProgrammesComponent } from './programmes/programmes.component';
import { GestionProgrammesComponent } from './gestion-programmes/gestion-programmes.component';
import { NutritionComponent } from './nutrition/nutrition.component';
import { SuiviComponent } from './suivi/suivi.component';
import { EvolutionPoidsComponent } from './evolution-poids/evolution-poids.component';
import { PlanNutritionnelComponent } from './plan-nutritionnel/plan-nutritionnel.component';
import { RapportsProgresComponent } from './rapports-progres/rapports-progres.component';
import { CoachHomeComponent } from './coach-home/coach-home.component';
import { CoachProfileComponent } from './coach-profile/coach-profile.component';
import { CoachClientsComponent } from './coach-clients/coach-clients.component';
import { SocialComponent } from './social/social.component';
import { CoachDashboardComponent } from './components/coach/coach-dashboard/coach-dashboard.component';
import { NutritionPlanComponent } from './components/coach/nutrition-plan/nutrition-plan.component';
import { MessagingContainerComponent } from './components/messaging/messaging-container/messaging-container.component';

export const routes: Routes = [
{ path: 'register', component: RegisterComponent },     
{ path : 'home', component: HomeComponent},
{ path : 'coach-home', component: CoachHomeComponent},
{ path: '', redirectTo: 'login', pathMatch: 'full' },
{ path: 'login', component: LoginComponent },
{ path: 'profile', component: ProfileComponent },
{ path: 'coach-profile', component: CoachProfileComponent },
{ path: 'coach-clients', component: CoachClientsComponent },
{ path: 'coach-dashboard', component: CoachDashboardComponent },
{ path: 'nutrition-plans', component: NutritionPlanComponent },
{ path: 'enhanced-messaging', component: MessagingContainerComponent },
{ path: 'programmes', component: ProgrammesComponent },
{ path: 'gestion-programmes', component: GestionProgrammesComponent },
{ path: 'nutrition', component: NutritionComponent },
{ path: 'suivi', component: SuiviComponent },
{ path: 'evolution-poids', component: EvolutionPoidsComponent },
{ path: 'plan-nutritionnel', component: PlanNutritionnelComponent },
{ path: 'rapports-progres', component: RapportsProgresComponent },
{ path: 'messaging', component: MessagingContainerComponent },
{ path: 'social', component: SocialComponent, canActivate: [AuthGuard] },
{ path: 'friend-challenges', 
  loadComponent: () => import('./components/social/friend-challenges/friend-challenges.component').then(m => m.FriendChallengesComponent),
  canActivate: [AuthGuard]
},

// Admin routes avec lazy loading - Dashboard et Gestion Utilisateurs uniquement
{
  path: 'admin',
  canActivate: [AdminGuard],
  children: [
    {
      path: 'dashboard',
      loadComponent: () => import('./admin/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
    },
    {
      path: 'users',
      loadComponent: () => import('./admin/user-management/user-management.component').then(m => m.UserManagementComponent)
    },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
  ]
},

// Progress Reports routes
{
  path: 'reports',
  canActivate: [AuthGuard],
  loadComponent: () => import('./components/progress-reports/reports-management/reports-management.component').then(m => m.ReportsManagementComponent)
},

// Charts routes
{
  path: 'charts',
  canActivate: [AuthGuard],
  children: [
    {
      path: 'overview',
      loadComponent: () => import('./components/charts/charts-container/charts-container.component').then(m => m.ChartsContainerComponent)
    },
    { path: '', redirectTo: 'overview', pathMatch: 'full' }
  ]
},



// Nutrition Plans routes (US10)
{
  path: 'nutrition-plans',
  canActivate: [AuthGuard],
  loadComponent: () => import('./components/nutrition/nutrition-plan-generator/nutrition-plan-generator.component').then(m => m.NutritionPlanGeneratorComponent)
},

// Enhanced Friend Challenges routes (US12)
{
  path: 'enhanced-challenges',
  canActivate: [AuthGuard],
  loadComponent: () => import('./components/social/enhanced-friend-challenges/enhanced-friend-challenges.component').then(m => m.EnhancedFriendChallengesComponent)
},

// Notification Preferences routes
{
  path: 'notification-preferences',
  canActivate: [AuthGuard],
  loadComponent: () => import('./components/notification-preferences/notification-preferences.component').then(m => m.NotificationPreferencesComponent)
},

// Food Recognition routes (US09)
{
  path: 'food-scanner',
  canActivate: [AuthGuard],
  loadComponent: () => import('./components/food-scanner/food-scanner.component').then(m => m.FoodScannerComponent)
},

// Routes existantes
{ path: 'gestUsers', component: GestUsersComponent , canActivate: [AdminGuard]},     
{ path: 'adduser', component: AddUserComponent , canActivate: [AdminGuard]}, 
{ path: 'edituser/:id', component: EditUserComponent, canActivate: [AdminGuard] },
{ path: 'forgot-password', component: ForgotPasswordComponent },
{ path: 'reset-password', component: ResetPasswordComponent },
{ path: '**', component: LoginComponent }
];


