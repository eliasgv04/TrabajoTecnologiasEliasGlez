# Changelog

## 2026-01-03

Backend

- Migración a HTTPS local (`server.ssl.*`) y configuración de redirect seguro para Spotify.
- Spotify OAuth estable:
	- `state` firmado (stateless) con `spotify.stateSecret`
	- tokens persistidos en MySQL (`spotify_tokens`) y refresh automático
- Endpoints de control de reproducción para Web Playback SDK:
	- `/spotify/transfer`, `/spotify/play`, `/spotify/pause`, `/spotify/seek`
- Cola y música:
	- búsqueda `GET /music/search`
	- playlist `GET /music/playlist`
	- cola `GET/POST/DELETE /queue`
	- cobro por monedas y 402 “Saldo insuficiente”
- Formato de errores homogéneo en JSON (`status/error/path`).
- Login soporta “correo o nombre del bar”.

Frontend (Angular)

- Web Playback SDK (“Gramola Player”) integrado.
- Persistencia/restore de estado de reproducción al navegar entre rutas.
- Mensajes de error amigables a partir del `error` del backend.

Documentación

- Actualización completa de README y `docs/` para reflejar el estado real del repositorio.

## 2025-10-09

Nota: esta entrada refleja una fase anterior del proyecto y no describe el estado actual.

Backend
- Simplificada autenticación: sin verificación por email ni tokens; reset por email directo.
- Endpoints devuelven `{ "message": "..." }` para respuestas consistentes (Postman/Frontend).
- Logs INFO breves para acciones (Registro/Login/Logout/Reset); SQL de Hibernate silenciado.
- Eliminadas entidades/repositorios de Tokens (VerificationToken, PasswordResetToken).

Frontend (Angular)
- Navbar: oculta “Inicio” en la cola para usuarios logueados; botón “Entrar” retirado; “Salir” activo.
- Botones de navegación auditados y corregidos (Registro/Login/Reset). Enlace de login va a `/reset`.
- Página de Reset: UI/UX mejorados, estados de carga y mensajes.
- Eliminado componente `Forgot` y redirección `/forgot` → `/reset`.

Documentación
- README y arquitectura actualizados para reflejar la simplificación de auth y plan Spotify por fases.
- Plan de integración con Spotify detallado (Fase 1 Client Credentials, Fase 2 OAuth Premium).

Próximos pasos
- Definir DTO de Track y contratos `/music/search` y `/queue` (Sprint 1).
- Implementar búsqueda y cola (add/list); Sprint 2: remove + pulidos.