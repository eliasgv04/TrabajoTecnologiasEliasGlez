import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionsService, SubscriptionPlan } from './subscriptions.service';

declare const Stripe: any;

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.css']
})
/**
 * Pantalla de contratación del servicio y pago de canciones.
 *
 * Permite:
 * - Contratar la suscripción del bar (prepay/confirm con Stripe y activación en backend).
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

  constructor(private api: SubscriptionsService) {}

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

  async pay() {
    if (this.stripe && this.card && this.clientSecret) {
      this.loading = true;
      const res = await this.stripe.confirmCardPayment(this.clientSecret, { payment_method: { card: this.card } });
      if (res.error) {
        this.error = res.error.message || 'Error de pago';
        this.loading = false;
        return;
      }
      this.api.confirm().subscribe({
        next: r => {
          const onlyDate = (r.activeUntil || '').toString().split('T')[0];
          this.message = `${r.message}${onlyDate ? ` (activa hasta ${onlyDate}).` : '.'}`;
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

  isSelectedPlan(p: SubscriptionPlan): boolean {
    return !!this.selectedPlan && this.selectedPlan.id === p.id;
  }
}
