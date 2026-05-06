import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentsService } from './payments.service';
import { ToastService } from '../toast.service';
import { Router } from '@angular/router';
declare const Stripe: any;

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
/**
 * Componente de pago para una canción concreta (Stripe).
 *
 * Flujo:
 * - `prepay`: el backend crea el PaymentIntent y devuelve el `clientSecret`.
 * - `confirm`: Stripe confirma el pago y el backend deja la canción lista para añadirse.
 */
export class PaymentsComponent implements OnChanges {
  @Input() trackId = '';
  @Input() amount = 1;
  @Input() title = 'Pagar canción';
  @Output() closed = new EventEmitter<void>();
  @Output() paid = new EventEmitter<void>();

  clientSecret = '';
  loading = false;
  publishableKey = '';
  stripe: any;
  elements: any;
  card: any;

  constructor(private payments: PaymentsService, private toast: ToastService, private router: Router) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trackId'] || changes['amount']) {
      this.requestPrepayment();
    }
  }

  requestPrepayment() {
    if (!this.trackId || !this.amount) return;
    this.loading = true;
    this.payments.prepay(this.trackId, this.amount).subscribe({
      next: (token) => { this.clientSecret = token; this.loading = false; this.setupStripeIfPossible(); },
      error: (e) => {
        this.loading = false;
        const msg = (typeof e?.error === 'string' ? e.error : (e?.error?.error || e?.error?.message)) || 'Error en preautorización';
        this.toast.show(msg);
        if (e?.status === 401 || e?.status === 403) {
          this.closed.emit();
          this.router.navigateByUrl('/login');
        }
      }
    });
  }

  confirmPayment() {
    if (!this.clientSecret) {
      this.toast.show('Genera primero el pago');
      return;
    }
    if (this.stripe && this.card) {
      this.loading = true;
      this.stripe.confirmCardPayment(this.clientSecret, { payment_method: { card: this.card } })
        .then((res: any) => {
          if (res.error) {
            this.loading = false;
            this.toast.show(res.error.message || 'Error de pago');
          } else if (res.paymentIntent && res.paymentIntent.status === 'succeeded') {
            this.payments.confirm().subscribe({
              next: () => { this.loading = false; this.toast.show('Pago confirmado'); this.paid.emit(); this.closed.emit(); },
              error: (e) => {
                this.loading = false;
                const msg = (typeof e?.error === 'string' ? e.error : (e?.error?.error || e?.error?.message)) || 'Error confirmando pago';
                this.toast.show(msg);
                if (e?.status === 401 || e?.status === 403) {
                  this.closed.emit();
                  this.router.navigateByUrl('/login');
                }
              }
            });
          }
        });
      return;
    }
    this.toast.show('No se ha podido cargar el formulario de tarjeta. Reinténtalo.');
  }

  setupStripeIfPossible() {
    this.payments.getPublicKey().subscribe({
      next: ({ publishableKey }) => {
        this.publishableKey = publishableKey || '';
        if (this.publishableKey && (window as any).Stripe) {
          this.stripe = Stripe(this.publishableKey);
          this.elements = this.stripe.elements();
          if (this.card) { try { this.card.unmount(); } catch { /* ignore */ } }
          this.card = this.elements.create('card', {
            style: {
              base: {
                color: '#ffffff',
                '::placeholder': { color: 'rgba(255, 255, 255, 0.6)' }
              }
            }
          });
          const mount = document.getElementById('card-element');
          if (mount) this.card.mount('#card-element');
        }
      }
    });
  }

  close() { this.closed.emit(); }
}
