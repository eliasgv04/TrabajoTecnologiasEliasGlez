import { Injectable } from '@angular/core';

/**
 * Servicio simple de notificaciones (toasts) para mensajes cortos en pantalla.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  message = '';
  visible = false;
  timeoutId: any;

  show(msg: string, ms = 2000) {
    this.message = msg;
    this.visible = true;
    clearTimeout(this.timeoutId);
    this.timeoutId = setTimeout(() => (this.visible = false), ms);
  }
}
