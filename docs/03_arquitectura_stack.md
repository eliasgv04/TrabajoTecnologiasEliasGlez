# Arquitectura y Stack (MVP actualizado)

## Objetivo
Equilibrar simplicidad para el MVP con una base que permita crecer. Centrado en control de Spotify Connect y experiencia web sencilla.

## Stack requerido (alineado con enunciado)
- Frontend: Angular (v19, standalone). Vistas, modelos y servicios. Módulos efectivos: Auth (registro/login/reset), Gramola (cola; búsqueda próximamente).
- Backend: Java con Spring Boot. Capas: controladores, servicios, repositorios (Spring Data JPA) y entidades/dto.
- Base de datos: MySQL. Tablas actuales: users (auth simple con timestamps). Más adelante: queue_items, payments, etc.
- Cache/cola: opcional Redis para eventos de cola y rate limit (no obligatorio en MVP local).
- Integración Spotify: fase 1 con Client Credentials (búsqueda y metadatos). Fase 2 con OAuth para Premium playback (Web Playback SDK o Connect).
- Emails: descartado por ahora (sin verificación; reset por email directo sin token en MVP).
- Deploy: Docker Compose (MySQL + backend + frontend) para desarrollo.

## Arquitectura (alto nivel)
- Cliente (web Angular):
  - Auth: registro (auto-login), login/logout, restablecer contraseña.
  - Gramola: vista de Cola (búsqueda y añadir próximamente en MVP Spotify).
- Backend (Spring):
  - Autenticación y cuentas: registro/login/logout/reset (sin verificación ni tokens); sesiones HttpSession.
  - Gramola: endpoints /sessions, /join, /search, /queue, /playback (play/pause/next), /payments; integración pagos y Spotify.
  - Reproducción: servicio que sincroniza cola con Spotify (Add to Queue) y polling del estado para avanzar.
  - Políticas: límites por usuario, cooldown, tamaño máximo cola.
- DB MySQL: persistencia de cuentas, tokens, suscripciones, colas e historial.

## Modelo de datos (MVP actual y extensión futura)
- bar_account(id, bar_name, email, password_hash, status[unverified|active|suspended], created_at)
- (Eliminadas en MVP) tablas de tokens de verificación y recuperación.
- plan(id, name[mensual|anual], price_cents)
- subscription(id, bar_account_id, plan_id, start_at, end_at, status[active|canceled])
- session(id, bar_account_id, name, price_per_song_cents, status, created_at)
- user(id, session_id, alias, role[client], created_at)
- queue_item(id, session_id, user_id, track_uri, title, artist, duration_ms, status[pending|playing|played|rejected], position, created_at, played_at)
- rule(session_id, max_pending_per_user, cooldown_secs, max_queue_len)
- payment(id, session_id, user_id, amount_cents, provider[stripe|sim], provider_ref, created_at)
- playback_state(session_id, device_id, is_playing, progress_ms, updated_at)

## Seguridad
- Tokens de Spotify del bar sólo en backend (refresh + access).
- Backend como proxy para proteger secretos.
- Rate limiting por IP/sesión.

## Decisiones por validar
- SSE vs WebSocket para actualizaciones de cola (propuesta: SSE en MVP, WS si añadimos chat/votos).
- Proveedor de correo (Mailtrap en dev, SMTP del centro si disponible).
- Pasarela de pago (simulada vs Stripe) en función del alcance práctico.

## Roadmap técnico corto
1) Implementar backend mínimo con endpoints de sala/cola y mock de reproducción.
2) Frontend simple para unirse, buscar (mock al principio) y encolar.
3) Integrar Spotify OAuth (bar) y búsqueda real.
4) Activar control de reproducción sobre dispositivo del bar.
5) Añadir límites/reglas y métricas básicas.