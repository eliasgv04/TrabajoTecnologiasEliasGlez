import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService, AccountInfo } from './account.service';
import { SettingsService, AppSettings } from '../settings/settings.service';
import { Router } from '@angular/router';
import { MusicService } from '../music.service';
import { ToastService } from '../toast.service';
import { AuthService } from '../auth.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  info: AccountInfo | null = null;
  error = '';
  settings: AppSettings | null = null;
  saving = false;

  constructor(
    private api: AccountService,
    private settingsApi: SettingsService,
    private subs: SubscriptionsService,
    private auth: AuthService,
    private router: Router
    , private music: MusicService
    , public toast: ToastService
  ) {}

  ngOnInit(): void {
    // Inicializar con lo que tengamos en localStorage (se rellena al hacer login)
    const cachedEmail = localStorage.getItem('email') || '';
    if (!this.info) this.info = { email: cachedEmail, active: false, activeUntil: null } as AccountInfo;
    this.api.me().subscribe({
      next: (i) => (this.info = i),
      error: (e) => {
        const msg = (typeof e?.error === 'string' ? e.error : e?.error?.message) || e?.message || 'Error cargando la cuenta';
        this.error = msg;
        // No redirigimos: mantenemos los datos locales si existen
      }
    });
    // Rellenar email desde Auth si aún no llegó del backend
    this.auth.emailObservable$.subscribe(email => {
      if (!email) return;
      if (!this.info) this.info = { email, active: false, activeUntil: null } as AccountInfo;
      else if (!this.info.email) this.info = { ...this.info, email } as AccountInfo;
    });
    // Rellenar estado de suscripción desde /subscriptions/status como respaldo
    this.subs.status().subscribe({
      next: s => {
        const currentEmail = this.info?.email || localStorage.getItem('email') || '';
        if (!this.info) this.info = { email: currentEmail, active: !!s.active, activeUntil: s.activeUntil || null } as AccountInfo;
        else this.info = { ...this.info, active: !!s.active, activeUntil: s.activeUntil || null } as AccountInfo;
      },
      error: () => {}
    });
    this.settingsApi.get().subscribe({
      next: (s) => (this.settings = s),
      error: () => {}
    });
  }

  saveSettings() {
    if (!this.settings) return;
       const uri = (this.settings.spotifyPlaylistUri || '').trim();
    // Validación rápida: si está vacío, guardamos como "limpiar" y listo
    if (!uri) {
      this.saving = true;
      this.settingsApi.update({ spotifyPlaylistUri: '' }).subscribe({
        next: (s) => {
          this.settings = s;
          try { localStorage.setItem('gramolaPlaylistUri', ''); } catch {}
          this.toast.show('Lista por defecto desactivada');
          this.saving = false;
        },
        error: () => { this.saving = false; }
      });
      return;
    }

    // Validar con el backend que la URI/URL devuelve pistas antes de guardar
    this.saving = true;
    this.music.getPlaylist(uri).subscribe({
      next: (tracks) => {
        const count = (tracks || []).length;
        // Guardar sólo si el backend respondió OK
        this.settingsApi.update({ spotifyPlaylistUri: uri }).subscribe({
          next: (s) => {
            this.settings = s;
            try { localStorage.setItem('gramolaPlaylistUri', s.spotifyPlaylistUri || ''); } catch {}
            this.toast.show(count > 0 ? `Playlist guardada (${count} pistas)` : 'Playlist guardada');
            this.saving = false;
          },
          error: () => { this.saving = false; }
        });
      },
      error: (e) => {
        const msg = (typeof e?.error === 'string' ? e.error : e?.error?.error) || e?.message || 'No se pudo validar la playlist';
        this.toast.show(msg);
        this.saving = false;
      }
    });
  }

}
