# Arquitectura y Stack (estado actual)

## Objetivo
Mantener una arquitectura sencilla pero realista para la práctica: autenticación, pagos/suscripción, integración Spotify y reproducción real con Web Playback SDK.

## Stack

- Frontend: Angular 19 (standalone + router)
- Backend: Java 17 + Spring Boot (REST/MVC) + Spring Data JPA
- Base de datos: MySQL
- Integraciones:
  - Spotify OAuth + Web API + Web Playback SDK
  - Mailtrap SMTP (verificación y reset)
  - Stripe (test) para generar PaymentIntents y simular confirmación

## Arquitectura (alto nivel)

Frontend (Angular)

- Rutas: `home`, `login`, `register`, `reset`, `queue`, `account`, `plans`
- Llama al backend vía proxy `/api` (ver `gramolafe/proxy.conf.json`).
- El reproductor usa Spotify Web Playback SDK para crear un dispositivo y reproducir en él.

Backend (Spring Boot)

- Controladores REST (paquete `edu.uclm.esi.gramola.http`):
  - `/users`: registro/login/logout/verificación/reset
  - `/spotify`: OAuth + control (transfer/play/pause/seek)
  - `/music`: búsqueda y lectura de playlist/track
  - `/queue`: CRUD de cola (cobro por monedas)
  - `/settings`: ajustes del bar (precio, playlist base, nombre)
  - `/payments`: packs de monedas
  - `/subscriptions`: planes + estado + alta (con Stripe test)

Persistencia (MySQL)

- `users`: cuenta del bar y saldo de monedas
- `spotify_tokens`: access/refresh token + expiración, por usuario
- `queue_items`: elementos de cola
- `bar_settings`: precio por canción, playlist base, nombre del bar
- `subscription_plans` y `user_subscriptions`: suscripciones

## HTTPS y proxy

- Backend en HTTPS (`server.ssl.*` en `application.properties`).
- Front en HTTPS (script `npm run start:https`) para evitar mixed-content y permitir OAuth con Spotify.

## Errores

- Los errores del backend se devuelven como JSON homogéneo:
  - `{ "status": number, "error": string, "path": string }`