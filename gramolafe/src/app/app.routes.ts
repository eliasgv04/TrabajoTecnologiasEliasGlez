import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { ResetComponent } from './reset/reset.component';
import { ForgotComponent } from './forgot/forgot.component';
import { QueueComponent } from './queue/queue.component';
import { HomeComponent } from './home/home.component';
import { authGuard } from './auth.guard';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { AccountComponent } from './account/account.component';

export const routes: Routes = [
	{ path: '', redirectTo: 'home', pathMatch: 'full' },
	{ path: 'home', component: HomeComponent },
	{ path: 'login', component: LoginComponent },
	{ path: 'register', component: RegisterComponent },
	{ path: 'forgot', component: ForgotComponent },
	{ path: 'reset', component: ResetComponent },
	{ path: 'plans', component: SubscriptionsComponent },
	{ path: 'account', component: AccountComponent, canActivate: [authGuard] },
	{ path: 'queue', component: QueueComponent, canActivate: [authGuard] },
	{ path: '**', redirectTo: 'home' }
];
