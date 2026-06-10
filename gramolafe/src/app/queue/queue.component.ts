import { Component, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MusicService, TrackDTO, QueueItem } from '../music.service';
import { ToastService } from '../toast.service';
import { BillingService } from '../billing.service';
import { SettingsService } from '../settings/settings.service';
import { SpotifyService } from '../spotify.service';
import { PaymentsComponent } from '../payments/payments.component';

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, PaymentsComponent],
  templateUrl: './queue.component.html',
  styleUrls: ['./queue.component.css']
})
/**
 * Componente principal de la gramola: pantalla de búsqueda, pago y reproducción.
 *
 * Responsabilidades:
 * - Buscar canciones en Spotify a través del backend.
 * - Gestionar el flujo de pago con Stripe antes de encolar una canción.
 * - Mantener y mostrar la cola de reproducción (obtenida del backend).
 * - Controlar la reproducción en Spotify (play, pause, seek, siguiente).
 * - Reproducir una playlist de fallback cuando la cola está vacía.
 */
export class QueueComponent implements OnDestroy {
  // Nombre del bar (se muestra en la cabecera, se carga desde settings del backend)
  barName = '';
  // Texto del buscador
  q = '';
  loading = false;
  // Resultados de la última búsqueda
  results: TrackDTO[] = [];
  // Copia local de la cola cargada desde el backend (fuente de verdad: BD del servidor)
  queue: QueueItem[] = [];
  error = '';

  // Precio base por canción (cargado desde /billing/price)
  pricePerSong = 1;
  // Estimaciones de precio por trackId (cargadas desde /billing/estimate para cada resultado)
  estimated: Record<string, { price: number; popularity: number }> = {};
  // trackId cuyo botón “Añadir” está esperando confirmación de pago (muestra el diálogo Pagar/Cancelar)
  pendingAddId: string | null = null;
  // Track y precio del pago en curso (renderiza el PaymentsComponent con Stripe)
  pendingPaymentTrack: TrackDTO | null = null;
  pendingPaymentPrice = 0;

  // Canción de la cola que está sonando en este momento
  current: QueueItem | null = null;
  // Duración total y tiempo restante en ms (base del temporizador de cuenta atrás)
  totalMs = 0;
  remainingMs = 0;
  isPaused = false;
  // Referencia al setInterval del temporizador para poder detenerlo
  private tickHandle: any = null;
  // Control del arrastre de la barra de progreso con el ratón
  private dragging = false;
  private dragRect: DOMRect | null = null;
  private pendingSeekElapsedMs: number | null = null;

  // ID del dispositivo Spotify (Web Player en el navegador) donde se reproduce
  private spotifyDeviceId: string | null = null;
  private noFallbackMsgShown = false;

  // Posición de la canción actual dentro del array queue (-1 si no hay ninguna)
  get currentIndex(): number {
    if (!this.current) return -1;
    return this.queue.findIndex(q => q.id === this.current!.id);
  }
  // Número de canciones pendientes en la cola (sin contar la que está sonando)
  get remainingSongs(): number {
    return Math.max(0, this.queue.length - (this.current ? 1 : 0));
  }
  // Tiempo total restante en ms sumando la canción actual y todas las pendientes
  get remainingQueueMs(): number {
    let rest = this.current ? this.remainingMs : 0;
    const startIdx = this.currentIndex >= 0 ? this.currentIndex + 1 : 0;
    for (let i = startIdx; i < this.queue.length; i++) rest += this.itemDurationMs(this.queue[i]);
    return rest;
  }

  constructor(
    private music: MusicService,
    private billing: BillingService,
    private settings: SettingsService,
    private spotify: SpotifyService,
    public toast: ToastService
  ) {}

  ngOnInit() {
    // Carga el nombre del bar desde localStorage para mostrarlo rápido sin esperar al backend
    try { this.barName = (localStorage.getItem(this.lsKey('barName')) || '').trim(); } catch {}

    // Conecta con Spotify (o redirige al OAuth si no hay token guardado).
    // En tests E2E con Selenium se desactiva para evitar redirecciones externas.
    const e2eDisableSpotify = (() => {
      try { return localStorage.getItem('e2e:disableSpotify') === '1'; } catch { return false; }
    })();
    if (!e2eDisableSpotify) {
      this.spotify.connectOrLogin().then(id => { if (id) this.spotifyDeviceId = id; }).catch(() => {});
    }
    this.loadQueue();
    this.loadBilling();
    this.loadFallbackPlaylist();
  }

  ngOnDestroy(): void {
    // Al salir de la pantalla se para el temporizador para que no siga corriendo en segundo plano
    this.stopTick();
    this.saveState();
  }

  // Pide al backend el precio base por canción (GET /billing/price)
  loadBilling() {
    this.billing.getPrice().subscribe({ next: r => (this.pricePerSong = r.pricePerSong) });
  }

  // Carga la cola desde el backend (GET /queue).
  // Cuando llega, intenta restaurar el estado del reproductor desde localStorage
  // (para que al navegar y volver no se reinicie la canción). Si no hay estado guardado
  // y hay canciones, arranca la primera. Si la cola está vacía, arranca la playlist de fallback.
  loadQueue() {
    this.music.getQueue().subscribe({
      next: (items) => {
        this.queue = items;
        if (!this.tryRestoreState() && !this.current && this.queue.length) this.startNext();
        if (!this.current && !this.currentFallback && !this.queue.length) this.startNextFallback();
      },
      error: (e) => (this.error = this.pickMsg(e))
    });
  }

  // Busca canciones en Spotify a través del backend (GET /music/search?q=).
  // Después de recibir los resultados, pide la estimación de precio de cada canción
  // a GET /billing/estimate para mostrarla junto a cada resultado.
  search() {
    if (!this.q.trim()) return;
    this.loading = true;
    this.results = [];
    this.music.search(this.q).subscribe({
      next: (tracks) => {
        this.results = tracks;
        this.estimated = {};
        for (const t of tracks) {
          this.billing.estimate(t.id).subscribe({
            next: (e) => (this.estimated[t.id] = { price: e.price, popularity: e.popularity }),
            error: () => {}
          });
        }
        this.loading = false;
      },
      error: (e) => {
        this.error = this.pickMsg(e);
        this.loading = false;
      }
    });
  }

  // Punto de entrada cuando el usuario pulsa "Añadir a cola".
  // Si ya hay un precio estimado: intenta añadir directamente al backend (POST /queue).
  //   - Si el backend acepta (ya existe pago confirmado): refresca la cola.
  //   - Si el backend devuelve 402: muestra el diálogo "Pagar / Cancelar" poniendo pendingAddId.
  // Si no hay precio estimado aún: abre directamente el formulario de pago.
  add(track: TrackDTO) {
    const p = this.priceFor(track.id);
    if (p != null) {
      this.music.addToQueue(track).subscribe({
        next: (item) => {
          this.loadQueue(); this.loadBilling();
          const charged = (item as any)?.chargedPrice ?? p ?? this.pricePerSong;
          this.toast.show(`Añadido a la cola (${charged}€)`);
        },
        error: (e: any) => {
          if (e?.status === 402) {
            // El backend no tiene pago confirmado: muestra el diálogo de confirmación de precio
            this.pendingAddId = track.id;
            return;
          }
          const msg = this.pickMsg(e);
          this.toast.show(msg);
          this.error = msg;
        }
      });
      return;
    }
    this.openPayment(track, this.pricePerSong);
  }

  // Abre el formulario de pago de Stripe para una canción concreta.
  // Poner valores en pendingPaymentTrack y pendingPaymentPrice hace que Angular
  // renderice el PaymentsComponent via *ngIf en la plantilla.
  openPayment(track: TrackDTO, amount: number) {
    this.pendingAddId = null;
    this.pendingPaymentTrack = track;
    this.pendingPaymentPrice = amount;
  }

  // Callback que llama PaymentsComponent cuando el pago de Stripe se completó.
  // En este punto el SongPayment ya está en estado CONFIRMED en BD,
  // así que llama a performAdd para hacer el segundo POST /queue que sí será aceptado.
  onSongPaid() {
    if (!this.pendingPaymentTrack) return;
    const track = this.pendingPaymentTrack;
    const amount = this.pendingPaymentPrice;
    this.pendingPaymentTrack = null;
    this.pendingPaymentPrice = 0;
    this.performAdd(track, amount);
  }

  // El usuario pulsó "Cancelar" en el formulario de pago: limpia el estado.
  cancelPayment() {
    this.pendingPaymentTrack = null;
    this.pendingPaymentPrice = 0;
  }

  // Hace el POST /queue definitivo sabiendo que el pago ya está confirmado en BD.
  // Si el backend devuelve 402 aquí sería un error inesperado (pago no encontrado o suscripción caducada).
  // Si devuelve 401 la sesión ha caducado y hay que volver a hacer login.
  performAdd(track: TrackDTO, priceHint: number | null) {
    this.pendingAddId = null;
    this.music.addToQueue(track).subscribe({
      next: (item) => {
        this.loadQueue(); this.loadBilling();
        // Muestra el precio real que cobró el backend (chargedPrice), no el estimado
        const charged = (item as any)?.chargedPrice ?? priceHint ?? this.pricePerSong;
        this.toast.show(`Añadido a la cola (${charged}€)`);
      },
      error: (e: any) => {
        if (e?.status === 402) {
          const msg402 = this.pickMsg(e);
          const finalMsg = (typeof msg402 === 'string' && msg402.toLowerCase().includes('suscrip'))
            ? msg402
            : 'Debes pagar esta canción antes de añadirla.';
          this.toast.show(finalMsg);
          this.error = finalMsg;
          return;
        }
        if (e?.status === 401) {
          this.toast.show('Sesión caducada. Vuelve a iniciar sesión.');
          this.error = '';
          return;
        }
        const msg = this.pickMsg(e);
        this.toast.show(msg);
        this.error = msg;
      }
    });
  }

  // El usuario pulsó "Cancelar" en el diálogo de confirmación de precio
  cancelAdd() { this.pendingAddId = null; }

  // Vacía toda la cola del usuario (DELETE /queue/clear) y para la reproducción actual
  clear() {
    this.music.clearQueue().subscribe({
      next: () => { this.queue = []; this.toast.show('Cola vaciada'); if (!this.current && !this.currentFallback) this.startNextFallback(); },
      error: (e: any) => (this.error = this.pickMsg(e))
    });
  }

  // Elimina una canción concreta de la cola (DELETE /queue/{id}).
  // Si es la que está sonando, para el temporizador y pausa Spotify antes de borrarla.
  remove(item: QueueItem) {
    this.music.deleteFromQueue(item.id).subscribe({
      next: () => {
        if (this.current && this.current.id === item.id) {
          this.stopTick();
          this.pauseSpotify();
          this.current = null; this.totalMs = 0; this.remainingMs = 0; this.isPaused = false;
        }
        this.queue = this.queue.filter(q => q.id !== item.id);
        this.toast.show('Eliminado de la cola');
        if (!this.current) this.startNext();
      },
      error: (e: any) => (this.error = this.pickMsg(e))
    });
  }

  // Arranca la reproducción de la primera canción de la cola.
  // Le ordena a Spotify que reproduzca la URI y arranca el temporizador de cuenta atrás.
  private startNext() {
    if (this.current || !this.queue.length) return;
    const next = this.queue[0];
    this.current = next;
    this.totalMs = Math.max(10_000, (next.durationMs || 180_000));
    this.remainingMs = this.totalMs;
    this.isPaused = false;
    this.toast.show(`Reproduciendo: ${next.title}`);
    this.startSpotifyPlaybackQueueItem(next);
    this.startTick();
    this.saveState();
  }

  // ==== Playlist de fallback (se reproduce cuando la cola de canciones pagadas está vacía) ====
  fallbackTracks: TrackDTO[] = [];
  private fallbackIndex = 0;
  // Canción de la playlist de fallback que está sonando (null si está sonando una canción de la cola)
  currentFallback: TrackDTO | null = null;

  // Carga la playlist de fallback configurada por el bar.
  // Intenta primero desde localStorage (respuesta rápida) y luego desde el backend
  // (GET /settings → spotifyPlaylistUri → GET /music/playlist) para estar siempre actualizado.
  private loadFallbackPlaylist() {
    const uriLS = ((): string | null => { try { return localStorage.getItem(this.lsKey('playlistUri')); } catch { return null; } })();
    if (uriLS && uriLS.trim()) {
      this.music.getPlaylist(uriLS).subscribe({
        next: (tracks) => { this.fallbackTracks = tracks || []; this.fallbackIndex = 0; if (!this.current && !this.currentFallback && !this.queue.length) this.startNextFallback(); },
        error: (e) => { this.toast.show(this.pickMsg(e)); }
      });
    }
    this.settings.get().subscribe({
      next: (s) => {
        const bn = (s as any)?.barName;
        if (typeof bn === 'string') {
          this.barName = bn.trim();
          try { localStorage.setItem(this.lsKey('barName'), this.barName); } catch {}
        }
        const uri = s.spotifyPlaylistUri || '';
        if (!uri) return;
        this.music.getPlaylist(uri).subscribe({
          next: (tracks) => { this.fallbackTracks = tracks || []; this.fallbackIndex = 0; if (!this.current && !this.currentFallback && !this.queue.length) this.startNextFallback(); },
          error: (e) => { this.toast.show(this.pickMsg(e)); }
        });
      },
      error: (e) => { /* sin toast: puede que no haya sesión activa todavía */ }
    });
  }

  // Arranca la siguiente canción de la playlist de fallback en orden secuencial.
  // Solo actúa si no hay ninguna canción de la cola ni de fallback sonando.
  private startNextFallback() {
    if (this.current || this.currentFallback || this.queue.length || !this.fallbackTracks.length) return;
    if (this.fallbackIndex >= this.fallbackTracks.length) this.fallbackIndex = 0;
    const t = this.fallbackTracks[this.fallbackIndex++];
    this.currentFallback = t;
    this.totalMs = Math.max(10_000, (t.durationMs || 180_000));
    this.remainingMs = this.totalMs;
    this.isPaused = false;
    this.toast.show(`Reproduciendo (lista): ${t.title}`);
    this.startSpotifyPlaybackTrack(t);
    this.startTick();
  }

  togglePause() {
    if (!this.current && !this.currentFallback) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.stopTick();
      this.pauseSpotify();
    } else {
      this.startTick();
      this.resumeSpotify();
    }
    this.saveState();
  }

  // Arranca el temporizador de cuenta atrás. Cada segundo descuenta 1000ms de remainingMs.
  // Cuando llega a 0 llama a onTrackEnd() para pasar a la siguiente canción.
  private startTick() {
    this.stopTick();
    this.tickHandle = setInterval(() => {
      if (this.isPaused) return;
      this.remainingMs -= 1000;
      if (this.remainingMs <= 0) this.onTrackEnd();
      this.saveState();
    }, 1000);
  }

  // Para el temporizador y libera la referencia al intervalo.
  private stopTick() { if (this.tickHandle) { clearInterval(this.tickHandle); this.tickHandle = null; } }

  // Se ejecuta cuando una canción termina (temporizador a 0) o cuando el usuario pulsa "Siguiente".
  // Si era una canción de la cola: llama a DELETE /queue/{id} para borrarla del backend
  // y luego arranca la siguiente. Si era de la playlist de fallback: la descarta y arranca la siguiente.
  private onTrackEnd() {
    const finished = this.current;
    this.stopTick();
    this.current = null; this.totalMs = 0; this.remainingMs = 0; this.isPaused = false;
    this.saveState();
    if (!finished) {
      // Era una pista de la playlist de fallback (current era null, currentFallback tenía valor)
      if (this.currentFallback) {
        const just = this.currentFallback;
        this.currentFallback = null;
        this.toast.show(`Terminó: ${just.title}`);
        if (this.queue.length) this.startNext(); else this.startNextFallback();
      }
      return;
    }
    // Era una canción de la cola: la borra del backend y arranca la siguiente
    this.music.deleteFromQueue(finished.id).subscribe({
      next: () => {
        this.queue = this.queue.filter(q => q.id !== finished.id);
        this.toast.show(`Terminó: ${finished.title}`);
        if (this.queue.length) {
          this.startNext();
        } else {
          if (!this.fallbackTracks.length) this.pauseSpotify();
          this.startNextFallback();
        }
      },
      error: () => this.loadQueue()
    });
  }

  private async ensureSpotifyDevice(): Promise<string | null> {
    if (this.spotifyDeviceId) return this.spotifyDeviceId;
    try {
      const id = await this.spotify.connectOrLogin();
      if (id) this.spotifyDeviceId = id;
      return this.spotifyDeviceId;
    } catch {
      return null;
    }
  }

  private buildSpotifyUriFromQueueItem(item: QueueItem): string {
    return (item.uri && item.uri.trim()) ? item.uri.trim() : (item.trackId ? `spotify:track:${item.trackId}` : '');
  }

  private buildSpotifyUriFromTrack(t: TrackDTO): string {
    return (t.uri && t.uri.trim()) ? t.uri.trim() : (t.id ? `spotify:track:${t.id}` : '');
  }

  // Ordena a Spotify que reproduzca una URI concreta en el dispositivo del navegador.
  // Primero transfiere la reproducción al dispositivo con play=false (para evitar doble play),
  // y luego lanza la reproducción de la URI.
  private async startSpotifyPlaybackUri(uri: string) {
    if (!uri) return;
    const deviceId = await this.ensureSpotifyDevice();
    if (!deviceId) {
      this.toast.show('Spotify: no se detecta el dispositivo. Espera 1–2s y reintenta.');
      return;
    }
    this.spotify.transfer(deviceId, false).subscribe({
      next: () => {
        this.spotify.playUris([uri], deviceId).subscribe({
          next: () => {},
          error: (e) => {
            this.toast.show(`Spotify: no se pudo reproducir. ${this.pickMsg(e)}`);
          }
        });
      },
      error: (e) => {
        this.toast.show(`Spotify: no se pudo transferir el dispositivo. ${this.pickMsg(e)}`);
      }
    });
  }

  private startSpotifyPlaybackQueueItem(item: QueueItem) {
    this.startSpotifyPlaybackUri(this.buildSpotifyUriFromQueueItem(item));
  }

  private startSpotifyPlaybackTrack(t: TrackDTO) {
    this.startSpotifyPlaybackUri(this.buildSpotifyUriFromTrack(t));
  }

  private pauseSpotify() {
    const deviceId = this.spotifyDeviceId || undefined;
    this.spotify.pause(deviceId).subscribe({ next: () => {}, error: () => {} });
  }

  private resumeSpotify() {
    const deviceId = this.spotifyDeviceId || undefined;
    this.spotify.resume(deviceId).subscribe({ next: () => {}, error: () => {} });
  }

  get progressPercent(): number {
    if ((!this.current && !this.currentFallback) || this.totalMs <= 0) return 0;
    return Math.max(0, Math.min(100, ((this.totalMs - this.remainingMs) / this.totalMs) * 100));
  }

  formatTime(ms: number): string {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2,'0')}`;
  }

  // ===== Controles del reproductor =====

  // Vuelve al inicio de la canción actual (reinicia el temporizador y hace seek en Spotify)
  restart() {
    if (!this.current && !this.currentFallback) return;
    this.remainingMs = this.totalMs;
    if (!this.isPaused) {
      this.startTick();
      if (this.current) this.startSpotifyPlaybackQueueItem(this.current);
      else if (this.currentFallback) this.startSpotifyPlaybackTrack(this.currentFallback);
    }
    this.saveState();
  }
  // Si hay canción de la cola: vuelve al inicio (en la cola no se puede retroceder a la anterior).
  // Si hay canción de fallback: retrocede una posición en la playlist.
  previous() {
    if (this.current) {
      this.restart();
      return;
    }
    if (this.currentFallback && this.fallbackTracks.length) {
      this.stopTick();
      this.isPaused = false;
      this.fallbackIndex = Math.max(0, this.fallbackIndex - 2);
      this.currentFallback = null;
      this.startNextFallback();
    }
  }
  // Salta a la siguiente canción llamando directamente a onTrackEnd()
  next() { this.onTrackEnd(); }
  // Para la reproducción y vuelve al inicio de la canción (pero no la elimina de la cola)
  stop() {
    if (!this.current && !this.currentFallback) return;
    this.stopTick();
    this.isPaused = true;
    this.remainingMs = this.totalMs;
    this.pauseSpotify();
    this.saveState();
  }
  // Elimina de la cola la canción que está sonando actualmente
  removeCurrent() {
    if (!this.current) return;
    this.remove(this.current);
  }
  seek(evt: MouseEvent) {
    if ((!this.current && !this.currentFallback) || this.totalMs <= 0) return;
    const el = evt.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, evt.clientX - rect.left));
    const ratio = x / rect.width;
    const elapsed = Math.floor(this.totalMs * ratio);
    this.applySeekElapsedMs(elapsed, true);
  }

  // Inicia el arrastre de la barra de progreso con el ratón
  onProgressDown(evt: MouseEvent) {
    if ((!this.current && !this.currentFallback) || this.totalMs <= 0) return;
    this.dragRect = (evt.currentTarget as HTMLElement).getBoundingClientRect();
    this.dragging = true;
    this.updateSeekFromClientX(evt.clientX);
    evt.preventDefault();
  }
  @HostListener('document:mousemove', ['$event']) onDocMove(evt: MouseEvent) {
    if (!this.dragging) return;
    this.updateSeekFromClientX(evt.clientX);
  }
  @HostListener('document:mouseup') onDocUp() {
    this.dragging = false;
    this.dragRect = null;
    if (this.pendingSeekElapsedMs != null) {
      const ms = this.pendingSeekElapsedMs;
      this.pendingSeekElapsedMs = null;
      this.applySeekElapsedMs(ms, true);
    }
    }
  private updateSeekFromClientX(clientX: number) {
    if (!this.dragRect || (!this.current && !this.currentFallback) || this.totalMs <= 0) return;
    const x = Math.max(0, Math.min(this.dragRect.width, clientX - this.dragRect.left));
    const ratio = x / this.dragRect.width;
    const elapsed = Math.floor(this.totalMs * ratio);
    // Durante el arrastre solo actualiza la UI; el seek real a Spotify se lanza al soltar el ratón
    this.pendingSeekElapsedMs = elapsed;
    this.applySeekElapsedMs(elapsed, false);
  }

  // Atajos de teclado: espacio=pausa, flechas=±5s, n=siguiente, p=anterior, s=stop
  @HostListener('window:keydown', ['$event']) handleKey(e: KeyboardEvent) {
    if (!this.current && !this.currentFallback) return;
    switch (e.key) {
      case ' ': e.preventDefault(); this.togglePause(); break;
      case 'ArrowLeft': e.preventDefault(); this.seekBySeconds(-5); break;
      case 'ArrowRight': e.preventDefault(); this.seekBySeconds(5); break;
      case 'n': case 'N': this.next(); break;
      case 'p': case 'P': this.previous(); break;
      case 's': case 'S': this.stop(); break;
    }
  }
  private seekBySeconds(deltaSec: number) {
    if ((!this.current && !this.currentFallback) || this.totalMs <= 0) return;
    const elapsed = this.totalMs - this.remainingMs;
    const newElapsed = Math.max(0, Math.min(this.totalMs, elapsed + deltaSec * 1000));
    this.applySeekElapsedMs(newElapsed, true);
  }

  private applySeekElapsedMs(elapsedMs: number, seekSpotify: boolean) {
    const clamped = Math.max(0, Math.min(this.totalMs, Math.floor(elapsedMs)));
    this.remainingMs = this.totalMs - clamped;
    this.saveState();
    if (seekSpotify) void this.seekSpotifyTo(clamped);
  }

  private async seekSpotifyTo(positionMs: number) {
    const deviceId = await this.ensureSpotifyDevice();
    if (!deviceId) return;
    this.spotify.seek(positionMs, deviceId).subscribe({ next: () => {}, error: () => {} });
  }


  // ===== Helpers para la plantilla =====

  // Indica si una canción ya está en la cola (para deshabilitar el botón "Añadir")
  isInQueue(trackId: string): boolean { return this.queue.some(q => q.trackId === trackId); }
  inQueuePosition(trackId: string): number { return this.queue.findIndex(q => q.trackId === trackId); }
  // Devuelve el precio estimado de una canción (null si aún no se ha cargado)
  priceFor(trackId: string): number | null { const e = this.estimated[trackId]; return e ? e.price : null; }
  popularityFor(trackId: string): number | null { const e = this.estimated[trackId]; return e ? e.popularity : null; }

  // ===== Persistencia del estado del reproductor en localStorage =====
  // Guarda el estado actual (canción, tiempo restante, pausa) para que al navegar
  // a otra ruta y volver la reproducción continúe donde estaba.
  private saveState() {
    if (!this.current && !this.currentFallback) {
      localStorage.removeItem(this.lsKey('player'));
      return;
    }

    if (this.current) {
      const state = {
        mode: 'queue',
        id: this.current.id,
        trackId: this.current.trackId,
        remainingMs: this.remainingMs,
        totalMs: this.totalMs,
        isPaused: this.isPaused
      };
      try { localStorage.setItem(this.lsKey('player'), JSON.stringify(state)); } catch {}
      return;
    }

    // Pista de lista por defecto
    const fb = this.currentFallback;
    const state = {
      mode: 'fallback',
      trackId: fb?.id || null,
      uri: (fb as any)?.uri || null,
      title: fb?.title || '',
      artists: fb?.artists || [],
      album: fb?.album || '',
      imageUrl: fb?.imageUrl || '',
      durationMs: fb?.durationMs || null,
      remainingMs: this.remainingMs,
      totalMs: this.totalMs,
      isPaused: this.isPaused
    };
    try { localStorage.setItem(this.lsKey('player'), JSON.stringify(state)); } catch {}
  }
  private tryRestoreState(): boolean {
    if (this.current || this.currentFallback) return true;
    const raw = localStorage.getItem(this.lsKey('player'));
    if (!raw) return false;
    try {
      const s = JSON.parse(raw);

      // Pista de cola
      if ((s?.mode === 'queue' || (!s?.mode && (s?.id != null || s?.trackId))) && this.queue.length) {
        const item = this.queue.find(q => q.id === s.id || q.trackId === s.trackId);
        if (!item) return false;
        this.current = item;
        this.totalMs = s.totalMs && s.totalMs > 0 ? s.totalMs : this.itemDurationMs(item);
        this.remainingMs = Math.min(this.totalMs, Math.max(0, s.remainingMs ?? this.totalMs));
        this.isPaused = !!s.isPaused;
        if (!this.isPaused) this.startTick();
        return true;
      }

      // Pista de lista por defecto
      if (s?.mode === 'fallback') {
        const restored = {
          id: s.trackId || '',
          title: s.title || '',
          artists: Array.isArray(s.artists) ? s.artists : [],
          album: s.album || '',
          imageUrl: s.imageUrl || '',
          durationMs: typeof s.durationMs === 'number' ? s.durationMs : null,
          uri: s.uri || undefined
        } as any;
        this.currentFallback = restored;
        this.totalMs = s.totalMs && s.totalMs > 0 ? s.totalMs : Math.max(10_000, ((restored.durationMs as number | null) || 180_000));
        this.remainingMs = Math.min(this.totalMs, Math.max(0, s.remainingMs ?? this.totalMs));
        this.isPaused = !!s.isPaused;
        if (!this.isPaused) this.startTick();
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  // Genera la clave de localStorage con namespace por usuario para que dos usuarios
  // en el mismo navegador no se pisen el estado del reproductor.
  private lsKey(suffix: 'barName' | 'playlistUri' | 'player'): string {
    const email = (() => {
      try { return (localStorage.getItem('email') || '').trim().toLowerCase(); } catch { return ''; }
    })();
    const ns = email ? `gramola:${email}` : 'gramola:anon';
    return `${ns}:${suffix}`;
  }

  // Devuelve la duración de un item en ms; si no tiene duración usa 3 minutos como valor por defecto
  private itemDurationMs(item: QueueItem): number {
    return (item.durationMs && item.durationMs > 0) ? item.durationMs : 180_000;
  }

  // Extrae el mensaje de error legible de cualquier tipo de respuesta de error HTTP o excepción
  private pickMsg(e: any): string {
    if (!e) return 'Error';
    const raw = e?.error ?? e?.message ?? e;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        const m = parsed?.message || parsed?.error || parsed?.reason;
        return (m && typeof m === 'string') ? m : raw;
      } catch {
        return raw;
      }
    }
    if (typeof raw === 'object') {
      const m = (raw as any)?.message || (raw as any)?.error || (raw as any)?.reason;
      if (typeof m === 'string' && m.trim()) return m;
    }
    return 'Error';
  }

  // Sin integración Spotify (solo reproducción “simulada”)
}
