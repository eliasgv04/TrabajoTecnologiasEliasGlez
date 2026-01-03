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
  settings: AppSettings = { pricePerSong: 1, spotifyPlaylistUri: '', barName: '' };
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
        const msg = (typeof e?.error === 'string'
          ? e.error
          : (e?.error?.error || e?.error?.message)) || e?.message || 'Error cargando la cuenta';
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
      next: (s) => {
        this.settings = s;
        const bn = (s as any)?.barName;
        if (typeof bn === 'string') {
          try { localStorage.setItem('gramolaBarName', bn.trim()); } catch {}
        }
      },
      error: () => {}
    });
  }

  saveBarName() {
    const bn = (this.settings as any)?.barName;
    const trimmed = (typeof bn === 'string') ? bn.trim() : '';
    this.saving = true;
    this.settingsApi.update({ barName: trimmed }).subscribe({
      next: (s) => {
        this.settings = s;
        try { localStorage.setItem('gramolaBarName', (s as any)?.barName ? String((s as any).barName).trim() : ''); } catch {}
        this.toast.show('Nombre del bar guardado');
        this.saving = false;
      },
      error: (e) => {
        this.toast.show(this.pickMsg(e));
        this.saving = false;
      }
    });
  }

  saveSettings() {
    const uri = this.normalizePlaylistInput(this.settings.spotifyPlaylistUri || '');
    this.settings.spotifyPlaylistUri = uri;
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
        error: (e) => {
          this.toast.show(this.pickMsg(e));
          this.saving = false;
        }
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
          error: (e) => {
            this.toast.show(this.pickMsg(e));
            this.saving = false;
          }
        });
      },
      error: (e) => {
        // If Spotify is temporarily unreachable, allow saving anyway.
        const status = e?.status;
        const msg = (typeof e?.error === 'string' ? e.error : e?.error?.error) || e?.message || 'No se pudo validar la playlist';
        // Allow saving when Spotify validation fails (5xx) or when backend reports playlist not found/access issues (often due to token limitations).
        const allowSaveAnyway = (status && status >= 500)
          || (status === 400 && typeof msg === 'string' && (msg.includes('Playlist no encontrada') || msg.includes('No se pudo acceder')));

        if (allowSaveAnyway) {
          this.settingsApi.update({ spotifyPlaylistUri: uri }).subscribe({
            next: (s) => {
              this.settings = s;
              try { localStorage.setItem('gramolaPlaylistUri', s.spotifyPlaylistUri || ''); } catch {}
              this.toast.show('Playlist guardada (no se pudo validar ahora)');
              this.saving = false;
            },
            error: (e2) => {
              this.toast.show(this.pickMsg(e2));
              this.saving = false;
            }
          });
          return;
        }

        this.toast.show(msg);
        this.saving = false;
      }
    });
  }

  private normalizePlaylistInput(input: string): string {
    const s = (input || '').trim();
    if (!s) return '';
    if (s.startsWith('spotify:playlist:')) return s;

    const urlMatch = s.match(/open\.spotify\.com\/playlist\/([A-Za-z0-9]+)(?:\/)?(?:\?.*)?$/);
    if (urlMatch?.[1]) {
      const id = urlMatch[1].replace(/[^A-Za-z0-9]/g, '');
      return `spotify:playlist:${id}`;
    }

    // allow raw id
    if (/^[A-Za-z0-9]{10,}$/.test(s)) return `spotify:playlist:${s}`;

    // fallback: keep as-is (backend can still handle some URL formats)
    return s;
  }

  private pickMsg(e: any): string {
    if (!e) return 'Error guardando la playlist';
    const raw = e?.error ?? e?.message ?? e;
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object') {
      const m = (raw as any)?.message || (raw as any)?.error || (raw as any)?.reason;
      if (typeof m === 'string' && m.trim()) return m;
    }
    return 'Error guardando la playlist';
  }

}
