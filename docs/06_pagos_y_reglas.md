# Pagos y Reglas de Negocio

## Pagos

- La app usa “monedas” (saldo en el usuario) para comprar canciones en la cola.
- El cobro por canción es dinámico según popularidad Spotify (tier 1–3 monedas).
- Se puede recargar saldo comprando packs (Stripe test):
	- `GET /payments/prepay?matches=5|10|20|25` -> devuelve `client_secret` (texto)
	- `GET /payments/confirm` -> simula confirmación y suma monedas al usuario

Suscripción (Stripe test):

- `GET /subscriptions/plans` lista planes
- `GET /subscriptions/prepay?planId=...` genera `client_secret`
- `GET /subscriptions/confirm` activa suscripción y acredita monedas

## Reglas anti-spam

- Este repo no implementa reglas por usuario (cooldown/límites/roles). La cola es global para el usuario logueado.

## Estados y errores

- Encolado:
	- Si no hay saldo: 402 “Saldo insuficiente”.
- Errores de backend en general: JSON homogéneo `{status,error,path}`.
- Spotify:
	- Token expirado: refresh automático en backend.
	- Sin dispositivo o sin Premium: Spotify puede devolver errores al transferir o reproducir.

## Métricas

- Saldo en monedas del usuario.
- Nº de canciones en cola.

## Consideraciones legales
- No distribuir audio ni grabar streams; sólo controlar reproducción y usar previews en demo.