import { Routes } from '@angular/router';
import { RegisterComponent } from './components/register/register.component';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { HomeComponent } from './home/home.component';
import { GestUsersComponent } from './components/gest-users/gest-users.component';
import { AddUserComponent } from './components/add-user/add-user.component';
import { AdminGuard } from './guards/admin.guard';
import { EditUserComponent } from './components/edit-user/edit-user.component';
import { VerificationComponent } from './components/verifivation/verifivation.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ProfileComponent } from './profile/profile.component';
import { ProgrammesComponent } from './programmes/programmes.component';
import { GestionProgrammesComponent } from './gestion-programmes/gestion-programmes.component';
import { NutritionComponent } from './nutrition/nutrition.component';
import { SuiviComponent } from './suivi/suivi.component';
import { EvolutionPoidsComponent } from './evolution-poids/evolution-poids.component';
import { NotificationsComponent } from './notifications/notifications.component';
import { RapportsProgresComponent } from './rapports-progres/rapports-progres.component';
import { CoachHomeComponent } from './coach-home/coach-home.component';
import { CoachProfileComponent } from './coach-profile/coach-profile.component';
import { CoachClientsComponent } from './coach-clients/coach-clients.component';




export const routes: Routes = [
{ path: 'register', component: RegisterComponent },     
{ path : 'home', component: HomeComponent},
{ path : 'coach-home', component: CoachHomeComponent},
{ path: '', redirectTo: 'login', pathMatch: 'full' },
{ path: 'login', component: LoginComponent },
{ path: 'profile', component: ProfileComponent },
{ path: 'coach-profile', component: CoachProfileComponent },
{ path: 'coach-clients', component: CoachClientsComponent },
{ path: 'programmes', component: ProgrammesComponent },
{ path: 'gestion-programmes', component: GestionProgrammesComponent },
{ path: 'nutrition', component: NutritionComponent },
{ path: 'suivi', component: SuiviComponent },
{ path: 'evolution-poids', component: EvolutionPoidsComponent },
{ path: 'notifications', component: NotificationsComponent },
{ path: 'rapports-progres', component: RapportsProgresComponent },
{ path: 'gestUsers', component: GestUsersComponent , canActivate: [AdminGuard]},     
{ path: 'adduser', component: AddUserComponent , canActivate: [AdminGuard]}, 
{ path: 'edituser/:id', component: EditUserComponent, canActivate: [AdminGuard] },
{ path: 'forgot-password', component: ForgotPasswordComponent },
{ path: 'reset-password', component: ResetPasswordComponent },
{ path: '**', component: LoginComponent }



];


