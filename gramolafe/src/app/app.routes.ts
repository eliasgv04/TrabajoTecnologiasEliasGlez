import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ResetComponent } from './reset/reset.component';
import { QueueComponent } from './queue/queue.component';
import { HomeComponent } from './home/home.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
	{ path: '', redirectTo: 'home', pathMatch: 'full' },
	{ path: 'home', component: HomeComponent },
	{ path: 'login', component: LoginComponent },
	{ path: 'register', component: RegisterComponent },
	{ path: 'forgot', redirectTo: 'reset', pathMatch: 'full' },
	{ path: 'reset', component: ResetComponent },
	{ path: 'queue', component: QueueComponent, canActivate: [authGuard] },
	{ path: '**', redirectTo: 'home' }
];
