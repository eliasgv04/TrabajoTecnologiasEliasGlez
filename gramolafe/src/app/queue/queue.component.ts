import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MusicService, TrackDTO, QueueItem } from '../music.service';
import { ToastService } from '../toast.service';
import { PaymentsComponent } from '../payments/payments.component';
import { BillingService } from '../billing.service';

@Component({
  selector: 'app-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, PaymentsComponent],
  templateUrl: './queue.component.html',
  styleUrls: ['./queue.component.css']
})
export class QueueComponent {
  q = '';
  loading = false;
  results: TrackDTO[] = [];
  queue: QueueItem[] = [];
  error = '';

  pricePerSong = 1;
  coins = 0;

  // Simulated player state
  current: QueueItem | null = null;
  totalMs = 0;
  remainingMs = 0;
  isPaused = false;
  private tickHandle: any = null;
  private dragging = false;
  private dragRect: DOMRect | null = null;

  // Helpers for counters/ETA
  get currentIndex(): number {
    if (!this.current) return -1;
    return this.queue.findIndex(q => q.id === this.current!.id);
  }
  get remainingSongs(): number {
    return Math.max(0, this.queue.length - (this.current ? 1 : 0));
  }
  get remainingQueueMs(): number {
    let rest = this.current ? this.remainingMs : 0;
    const startIdx = this.currentIndex >= 0 ? this.currentIndex + 1 : 0;
    for (let i = startIdx; i < this.queue.length; i++) rest += this.itemDurationMs(this.queue[i]);
    return rest;
  }

  constructor(private music: MusicService, private billing: BillingService, public toast: ToastService) {}

  ngOnInit() {
    this.loadQueue();
    this.loadBilling();
  }

  loadBilling() {
    this.billing.getPrice().subscribe({ next: r => (this.pricePerSong = r.pricePerSong) });
    this.billing.getBalance().subscribe({ next: r => (this.coins = r.coins) });
  }

  loadQueue() {
    this.music.getQueue().subscribe({
      next: (items) => {
        this.queue = items;
        // Try to restore player state from localStorage; if not possible, start next
        if (!this.tryRestoreState() && !this.current && this.queue.length) this.startNext();
      },
      error: (e) => (this.error = this.pickMsg(e))
    });
  }

  search() {
    if (!this.q.trim()) return;
    this.loading = true;
    this.results = [];
    this.music.search(this.q).subscribe({
      next: (tracks) => {
        this.results = tracks;
        this.loading = false;
      },
      error: (e) => {
        this.error = this.pickMsg(e);
        this.loading = false;
      }
    });
  }

  add(track: TrackDTO) {
    this.music.addToQueue(track).subscribe({
      next: () => { this.loadQueue(); this.loadBilling(); this.toast.show('Añadido a la cola'); },
      error: (e: any) => {
        if (e?.status === 402) {
          this.toast.show('Saldo insuficiente. Recarga para añadir.');
          this.showPayments = true;
        }
        this.error = this.pickMsg(e);
      }
    });
  }

  clear() {
    this.music.clearQueue().subscribe({
      next: () => { this.queue = []; this.toast.show('Cola vaciada'); },
      error: (e: any) => (this.error = this.pickMsg(e))
    });
  }

  remove(item: QueueItem) {
    this.music.deleteFromQueue(item.id).subscribe({
      next: () => {
        if (this.current && this.current.id === item.id) {
          this.stopTick();
          this.current = null; this.totalMs = 0; this.remainingMs = 0; this.isPaused = false;
        }
        this.queue = this.queue.filter(q => q.id !== item.id);
        this.toast.show('Eliminado de la cola');
        if (!this.current) this.startNext();
      },
      error: (e: any) => (this.error = this.pickMsg(e))
    });
  }

  // Simulated playback engine
  private startNext() {
    if (this.current || !this.queue.length) return;
    const next = this.queue[0];
    this.current = next;
    this.totalMs = Math.max(10_000, (next.durationMs || 180_000));
    this.remainingMs = this.totalMs;
    this.isPaused = false;
    this.toast.show(`Reproduciendo: ${next.title}`);
    this.startTick();
    this.saveState();
  }

  togglePause() {
    if (!this.current) return;
    this.isPaused = !this.isPaused;
    if (this.isPaused) this.stopTick(); else this.startTick();
    this.saveState();
  }

  private startTick() {
    this.stopTick();
    this.tickHandle = setInterval(() => {
      if (this.isPaused) return;
      this.remainingMs -= 1000;
      if (this.remainingMs <= 0) this.onTrackEnd();
      this.saveState();
    }, 1000);
  }

  private stopTick() { if (this.tickHandle) { clearInterval(this.tickHandle); this.tickHandle = null; } }

  private onTrackEnd() {
    const finished = this.current;
    this.stopTick();
    this.current = null; this.totalMs = 0; this.remainingMs = 0; this.isPaused = false;
    this.saveState();
    if (!finished) return;
    this.music.deleteFromQueue(finished.id).subscribe({
      next: () => {
        this.queue = this.queue.filter(q => q.id !== finished.id);
        this.toast.show(`Terminó: ${finished.title}`);
        this.startNext();
      },
      error: () => this.loadQueue()
    });
  }

  get progressPercent(): number {
    if (!this.current || this.totalMs <= 0) return 0;
    return Math.max(0, Math.min(100, ((this.totalMs - this.remainingMs) / this.totalMs) * 100));
  }

  formatTime(ms: number): string {
    const s = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2,'0')}`;
  }

  // Controls
  restart() {
    if (!this.current) return;
    this.remainingMs = this.totalMs;
    if (!this.isPaused) this.startTick();
    this.saveState();
  }
  previous() { this.restart(); }
  next() { this.onTrackEnd(); }
  stop() {
    if (!this.current) return;
    this.stopTick();
    this.isPaused = true;
    this.remainingMs = this.totalMs;
    this.saveState();
  }
  removeCurrent() {
    if (!this.current) return;
    this.remove(this.current);
  }
  seek(evt: MouseEvent) {
    if (!this.current || this.totalMs <= 0) return;
    const el = evt.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, evt.clientX - rect.left));
    const ratio = x / rect.width;
    const elapsed = Math.floor(this.totalMs * ratio);
    this.remainingMs = this.totalMs - elapsed;
    this.saveState();
  }

  // Drag-to-seek
  onProgressDown(evt: MouseEvent) {
    if (!this.current || this.totalMs <= 0) return;
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
  }
  private updateSeekFromClientX(clientX: number) {
    if (!this.dragRect || !this.current || this.totalMs <= 0) return;
    const x = Math.max(0, Math.min(this.dragRect.width, clientX - this.dragRect.left));
    const ratio = x / this.dragRect.width;
    const elapsed = Math.floor(this.totalMs * ratio);
    this.remainingMs = this.totalMs - elapsed;
    this.saveState();
  }

  // Keyboard shortcuts
  @HostListener('window:keydown', ['$event']) handleKey(e: KeyboardEvent) {
    if (!this.current) return;
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
    if (!this.current || this.totalMs <= 0) return;
    const elapsed = this.totalMs - this.remainingMs;
    const newElapsed = Math.max(0, Math.min(this.totalMs, elapsed + deltaSec * 1000));
    this.remainingMs = this.totalMs - newElapsed;
    this.saveState();
  }

  // Duplicate detection helpers for results list
  isInQueue(trackId: string): boolean { return this.queue.some(q => q.trackId === trackId); }
  inQueuePosition(trackId: string): number { return this.queue.findIndex(q => q.trackId === trackId); }

  // Persistence
  private saveState() {
    if (!this.current) { localStorage.removeItem('gramolaPlayer'); return; }
    const state = {
      id: this.current.id,
      trackId: this.current.trackId,
      remainingMs: this.remainingMs,
      totalMs: this.totalMs,
      isPaused: this.isPaused
    };
    try { localStorage.setItem('gramolaPlayer', JSON.stringify(state)); } catch {}
  }
  private tryRestoreState(): boolean {
    if (this.current) return true;
    const raw = localStorage.getItem('gramolaPlayer');
    if (!raw) return false;
    try {
      const s = JSON.parse(raw);
      const item = this.queue.find(q => q.id === s.id || q.trackId === s.trackId);
      if (!item) return false;
      this.current = item;
      this.totalMs = s.totalMs && s.totalMs > 0 ? s.totalMs : this.itemDurationMs(item);
      this.remainingMs = Math.min(this.totalMs, Math.max(0, s.remainingMs ?? this.totalMs));
      this.isPaused = !!s.isPaused;
      if (!this.isPaused) this.startTick();
      return true;
    } catch {
      return false;
    }
  }

  private itemDurationMs(item: QueueItem): number {
    return (item.durationMs && item.durationMs > 0) ? item.durationMs : 180_000;
  }

  demoRecharge() { this.showPayments = true; }

  showPayments = false;
  onPaid() { this.showPayments = false; this.loadBilling(); }

  private pickMsg(e: any): string {
    const msg = e?.error ?? e?.message ?? 'Error';
    return typeof msg === 'string' ? msg : (msg?.message || 'Error');
  }

  // No Spotify integration (simulated playback only)
}
