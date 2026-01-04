import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionsService, SubscriptionPlan } from './subscriptions.service';
import { SettingsService } from '../settings/settings.service';
import { PaymentsService } from '../payments/payments.service';

declare const Stripe: any;

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.css']
})
/**
 * Pantalla de suscripciones y recargas.
 *
 * Permite:
 * - Comprar una suscripción (prepay/confirm con Stripe y activación en backend).
 * - Comprar un pack de monedas (mismo flujo de Stripe usando `PaymentsService`).
 */
export class SubscriptionsComponent implements OnInit {
  plans: SubscriptionPlan[] = [];
  error = '';
  message = '';
  loading = false;
  selectedPlan: SubscriptionPlan | null = null;
  hasActiveSub = false;
  activeUntil: string | null = null;

  // Stripe (pago con tarjeta)
  publishableKey = '';
  stripe: any;
  elements: any;
  card: any;
  clientSecret = '';
  private cardMounted = false;

  // Recarga de monedas
  rechargePacks = [5, 10, 20, 25];
  mode: 'sub' | 'coins' = 'sub';
  selectedPack = 0;

  constructor(private api: SubscriptionsService, private payments: PaymentsService, private settings: SettingsService) {}

  ngOnInit() {
    this.api.plans().subscribe({ next: p => (this.plans = p), error: e => (this.error = this.pickMsg(e)) });
    this.api.status().subscribe({
      next: s => {
        this.hasActiveSub = !!s.active;
        this.activeUntil = s.activeUntil || null;
      },
      error: () => {}
    });
    this.setupStripe();
    this.settings.get().subscribe({
      next: s => {
        // Usar el precio para textos UI si hiciera falta
        this.dynamicPricePerSong = Math.max(1, s.pricePerSong || 1);
      },
      error: () => {}
    });
  }

  pick(plan: SubscriptionPlan) {
    this.error = '';
    this.message = '';
    if (this.hasActiveSub) {
      const until = (this.activeUntil || '').toString().split('T')[0];
      this.error = `Ya tienes una suscripción activa${until ? ' hasta ' + until : ''}`;
      return;
    }
    this.loading = true;
    this.selectedPlan = plan;
    this.mode = 'sub';
    this.unmountCard();
    this.clientSecret = '';
    this.api.prepay(plan.id).subscribe({
      next: cs => {
        this.clientSecret = cs;
        this.loading = false;
        this.mountCard();
      },
      error: e => {
        this.error = this.pickMsg(e);
        this.loading = false;
      }
    });
  }

  startRecharge(pack: number) {
    this.error = '';
    this.message = '';
    this.loading = true;
    this.mode = 'coins';
    this.selectedPack = pack;
    this.unmountCard();
    this.clientSecret = '';
    this.payments.prepay(pack).subscribe({
      next: cs => {
        this.clientSecret = cs;
        this.loading = false;
        this.mountCard();
      },
      error: e => {
        this.error = this.pickMsg(e);
        this.loading = false;
      }
    });
  }

  async pay() {
    if (this.stripe && this.card && this.clientSecret) {
      this.loading = true;
      const res = await this.stripe.confirmCardPayment(this.clientSecret, { payment_method: { card: this.card } });
      if (res.error) {
        this.error = res.error.message || 'Error de pago';
        this.loading = false;
        return;
      }
      if (this.mode === 'sub') {
        this.api.confirm().subscribe({
          next: r => {
            const onlyDate = (r.activeUntil || '').toString().split('T')[0];
            const credited = (r as any).creditedCoins as number | undefined;
            const creditedText =
              typeof credited === 'number'
                ? ` Se han abonado ${credited} moneda(s).`
                : this.selectedPlan
                ? ` Se han abonado ${this.coinsPerMonth(this.selectedPlan) * (this.selectedPlan.durationMonths || 1)} moneda(s).`
                : '';
            this.message = `${r.message} (activa hasta ${onlyDate}).${creditedText}`;
            this.loading = false;
            this.clientSecret = '';
          },
          error: e => {
            this.error = this.pickMsg(e);
            this.loading = false;
          }
        });
      } else {
        this.payments.confirm().subscribe({
          next: r => {
            const purchased = this.selectedPack;
            this.message = `Recarga completada. +${purchased} moneda(s).`;
            this.loading = false;
            this.clientSecret = '';
          },
          error: e => {
            this.error = this.pickMsg(e);
            this.loading = false;
          }
        });
      }
    }
  }

  private setupStripe() {
    this.api.publicKey().subscribe({
      next: ({ publishableKey }) => {
        this.publishableKey = publishableKey || '';
        if (this.publishableKey && (window as any).Stripe && !this.stripe) {
          this.stripe = Stripe(this.publishableKey);
          this.elements = this.stripe.elements();
        }
      },
      error: () => {}
    });
  }

  private mountCard() {
    if (!this.elements) return;
    if (!this.card) {
      this.card = this.elements.create('card', {
        hidePostalCode: true,
        style: {
          base: {
            color: '#ffffff',
            '::placeholder': { color: 'rgba(255, 255, 255, 0.6)' }
          }
        }
      });
    }
    // Si estaba montada pero el contenedor se recreó por *ngIf, permitimos volver a montar
    if (this.cardMounted) {
      const container = document.getElementById('card-element');
      if (!container || container.childElementCount === 0) {
        this.cardMounted = false;
      } else {
        return;
      }
    }
    setTimeout(() => {
      try {
        const el = document.getElementById('card-element');
        if (el) {
          this.card.mount('#card-element');
          this.cardMounted = true;
        }
      } catch {}
    }, 0);
  }

  private unmountCard() {
    try {
      if (this.card && this.cardMounted) {
        this.card.unmount();
      }
    } catch {}
    this.cardMounted = false;
  }

  private pickMsg(e: any): string {
    const raw = e?.error ?? e?.message ?? 'Error';
    if (typeof raw === 'string') return raw;
    if (typeof raw === 'object' && raw) {
      const m = (raw as any)?.error || (raw as any)?.message || (raw as any)?.reason;
      if (typeof m === 'string' && m.trim()) return m;
    }
    return 'Error';
  }

  coinsPerMonth(p: SubscriptionPlan): number {
    const code = (p.code || '').toUpperCase();
    if (code === 'ANNUAL') return 30; // 30/mes -> 360 al año
    return 30; // MONTHLY u otros por defecto
  }

  // Precio dinámico para reflejar ajustes del servidor en mensajes
  dynamicPricePerSong = 1;

  isSelectedPlan(p: SubscriptionPlan): boolean {
    return !!this.selectedPlan && this.selectedPlan.id === p.id && this.mode === 'sub';
  }
  isSelectedPack(c: number): boolean {
    return this.mode === 'coins' && this.selectedPack === c;
  }

  packPriceEuros(c: number): number {
    // Igual que en backend: <20 ⇒ 1€/moneda; >=20 ⇒ 0,75€/moneda
    const per = c >= 20 ? 0.75 : 1.0;
    return Math.round(c * per * 100) / 100; // redondeo a céntimos
  }

  packEuroPerCoin(c: number): number {
    return c >= 20 ? 0.75 : 1.0;
  }
}
