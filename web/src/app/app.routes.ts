import { Routes } from '@angular/router';
import { ServiceListComponent } from './components/service-list/service-list.component';
import { BookingComponent } from './components/booking/booking.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { ProfileEditComponent } from './components/profile-edit/profile-edit.component';
import { BarberScheduleComponent } from './components/barber-schedule/barber-schedule.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: ServiceListComponent },
  { path: 'agendar/:serviceId', component: BookingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'cadastro', component: RegisterComponent },
  
  // Rotas Protegidas
  { path: 'admin', component: AdminDashboardComponent, canActivate: [authGuard] },
  // Quick register mobile route removed — we only keep the Admin quick modal
  { path: 'perfil/:id', component: ProfileEditComponent, canActivate: [authGuard] },
  { path: 'barber', component: BarberScheduleComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: '' }
];