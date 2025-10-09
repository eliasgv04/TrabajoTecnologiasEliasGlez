# Pagos y Reglas de Negocio

## Pagos
- MVP: pago simulado con "monedas" virtuales asociadas a la sesión/sala.
- Opcional: integrar Stripe Checkout/Payment Links para un flujo real (fuera de alcance inicial de práctica si complica).
- Precio por canción configurable por el bar; posible "propina" para subir en cola (no MVP si complica).

## Reglas anti-spam
- Máximo de canciones pendientes por usuario (p. ej., 2).
- Cooldown entre encolados (p. ej., 3 minutos).
- Longitud máxima de cola (p. ej., 50).
- Moderación del bar: eliminar/reordenar; bloquear usuario.

## Estados y errores
- Estados: pending, playing, played, rejected.
- Errores típicos: sin dispositivo, token expirado, tema no disponible, rate limit; ofrecer mensajes claros y reintentos.

## Métricas
- Ingresos simulados por sesión.
- Nº de canciones encoladas por usuario.
- Tiempo medio en cola hasta reproducción.

## Consideraciones legales
- No distribuir audio ni grabar streams; sólo controlar reproducción y usar previews en demo.