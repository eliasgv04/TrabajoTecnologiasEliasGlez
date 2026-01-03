# Gramola Virtual (Jukebox) con Spotify

Aplicación web (Angular + Spring Boot + MySQL) para que un bar gestione una “cola” de canciones de Spotify y las reproduzca en su dispositivo mediante Spotify Connect.

## Estado actual

- HTTPS end-to-end (backend y front en local)
- OAuth Spotify (Authorization Code) estable con `state` firmado y tokens persistidos en MySQL (`spotify_tokens`)
- Reproducción real con Spotify Web Playback SDK (dispositivo “Gramola Player”) + endpoints backend de control
- Búsqueda de canciones y encolado con cobro por “monedas” (packs con Stripe test)
- Registro con verificación por email (Mailtrap en dev) y reset de contraseña por token
- Login aceptando “correo o nombre del bar”

Documentación detallada en `docs/`.

## Tecnologías

- Frontend: Angular 19 (standalone, routing)
- Backend: Java 17 + Spring Boot (MVC + JPA)
- DB: MySQL
- Integraciones: Spotify (OAuth + Web API + Web Playback SDK), Mailtrap (SMTP), Stripe (test)

## Arranque rápido (desarrollo)

### 1) Requisitos

- Java 17, Maven
- Node.js + npm
- MySQL en `localhost:3306` con una BD `gramola`

### 2) Backend

Desde `backend/`:

- `mvn spring-boot:run`

El backend levanta en `https://localhost:8000` (SSL habilitado). En el primer acceso el navegador puede pedir aceptar el certificado de desarrollo.

Config principal: `backend/src/main/resources/application.properties`.

### 3) Frontend

Desde `gramolafe/`:

- `npm install`
- `npm run start:https`

El front usa proxy en `gramolafe/proxy.conf.json` (`/api` -> `https://localhost:8000`).

Nota: el script `start:https` requiere certificados `localhost.pem` y `localhost-key.pem` en `gramolafe/`. Puedes generarlos con una herramienta tipo `mkcert` o con OpenSSL (si lo tienes instalado).

## Configuración Spotify (dev)

- En Spotify Developer Dashboard, añade como Redirect URI:
  - `https://127.0.0.1:8000/spotify/callback`
- Asegúrate de tener en `application.properties`:
  - `spring.security.oauth2.client.registration.spotify.client-id`
  - `spring.security.oauth2.client.registration.spotify.client-secret`
  - `spotify.redirectUri=https://127.0.0.1:8000/spotify/callback`
  - `spotify.stateSecret=...` (obligatorio, firma el parámetro `state`)

## Endpoints principales (backend)

- Auth: `POST /users/register`, `PUT /users/login`, `GET /users/verify?token=...`, `POST /users/reset/request`, `POST /users/reset/confirm`
- Spotify OAuth/control: `GET /spotify/login`, `GET /spotify/callback`, `GET /spotify/token`, `PUT /spotify/transfer`, `POST /spotify/play`, `PUT /spotify/pause`, `PUT /spotify/seek`
- Música: `GET /music/search?q=...`, `GET /music/tracks/{id}`, `GET /music/playlist?uri=...`
- Cola: `GET /queue`, `POST /queue`, `DELETE /queue/clear`, `DELETE /queue/{id}`
- Ajustes: `GET /settings`, `PUT /settings` (precio, playlist, nombre del bar)
- Suscripciones: `GET /subscriptions/plans`, `GET /subscriptions/status`, `GET /subscriptions/prepay`, `GET /subscriptions/confirm`
- Pagos/monedas: `GET /payments/prepay`, `GET /payments/confirm`

## Notas

- Los errores de backend se devuelven en JSON homogéneo: `{ "status": number, "error": string, "path": string }`.
- Controlar reproducción en Spotify requiere cuenta Premium y un dispositivo disponible.

Ver también: `docs/03_arquitectura_stack.md`, `docs/05_plan_integracion_spotify.md`, `docs/09_plan_pruebas_funcionales.md`.