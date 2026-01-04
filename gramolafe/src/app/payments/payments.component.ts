import { Component, EventEmitter, Output, OnInit } from '@angular/core';
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
 * Componente de pago para recargar monedas (Stripe).
 *
 * Flujo:
 * - `prepay`: el backend crea el PaymentIntent y devuelve el `clientSecret`.
 * - `confirm`: Stripe confirma el pago y el backend acredita las monedas.
 */
export class PaymentsComponent implements OnInit {
  @Output() closed = new EventEmitter<void>();
  @Output() paid = new EventEmitter<void>();

  amount = 10; // 10 o 20
  clientSecret = '';
  loading = false;
  publishableKey = '';
  stripe: any;
  elements: any;
  card: any;

  constructor(private payments: PaymentsService, private toast: ToastService, private router: Router) {}

  ngOnInit(): void {
    // Arrancar preautorización al abrir el modal
    this.requestPrepayment();
  }

  requestPrepayment() {
    this.loading = true;
    this.payments.prepay(this.amount).subscribe({
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
      this.toast.show('Selecciona un importe para generar el pago');
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
          this.card = this.elements.create('card');
          const mount = document.getElementById('card-element');
          if (mount) this.card.mount('#card-element');
        }
      }
    });
  }

  onAmountChange(val: number) {
    if (this.amount === val) return;
    this.amount = val;
    // Recalcular intent con nuevo importe
    this.requestPrepayment();
  }

  close() { this.closed.emit(); }
}
