# Actores, Casos de Uso y Flujos (estado actual)

## Actores

- Bar/Administrador (usuario de la app): busca, encola y controla reproducción.
- Spotify (Accounts + Web API + Web Playback SDK): autenticación OAuth, catálogo y control del reproductor.
- Infra de apoyo: MySQL (persistencia), Mailtrap (verificación/reset), Stripe test (pagos de packs/suscripciones).

## Casos de uso principales

1) Registro y verificación
   - Bar se registra (`POST /users/register`) y recibe email con enlace de verificación (`GET /users/verify?token=...`).

2) Login
   - Bar inicia sesión (`PUT /users/login`) usando “correo o nombre del bar”.

3) Conectar Spotify
   - Bar lanza OAuth desde backend (`GET /spotify/login`).
   - Spotify redirige a `GET /spotify/callback`.
   - Los tokens se guardan en BD (tabla `spotify_tokens`).

4) Buscar y encolar
   - Buscar: `GET /music/search?q=...`
   - Encolar: `POST /queue` (descuenta monedas). Si no hay saldo, devuelve 402.

5) Controlar reproducción
   - El frontend crea un dispositivo con Web Playback SDK.
   - Se transfiere reproducción al device (`PUT /spotify/transfer`).
   - Se controla play/pausa/seek (`/spotify/play`, `/spotify/pause`, `/spotify/seek`).

6) Ajustes
   - Configurar playlist base y nombre del bar: `GET/PUT /settings`.

## Errores y edge cases (manejados)

- Backend devuelve errores homogéneos en JSON (`status/error/path`) para evitar “raw JSON” en UI.
- Tokens Spotify expiran: el backend refresca usando refresh_token persistido.
- Sin saldo: `POST /queue` responde 402 “Saldo insuficiente”.