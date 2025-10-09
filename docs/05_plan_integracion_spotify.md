# Plan de Integración con Spotify (actualizado)

## Fases de autenticación

- Fase 1 (MVP búsqueda): Client Credentials Flow (sin usuario)
	- Permite `/v1/search` y obtener metadatos de tracks/albums/artists.
	- No permite control de reproducción ni acceso a biblioteca del usuario.
- Fase 2 (Playback Premium): Authorization Code Flow
	- Scopes mínimos: user-read-playback-state, user-modify-playback-state; opcional: streaming.
	- Guardar refresh token del bar en backend; renovar access tokens automáticamente.

## Búsqueda y metadatos (MVP)
- Endpoint backend `GET /music/search?q=...` → proxy a `/v1/search` (type=track).
- Normalizar respuesta a TrackDTO: { id, title, artists[], album, imageUrl, durationMs, previewUrl, uri }.
- Cache corta (30–60s) y manejo de 429 con backoff exponencial simple.

## Control de reproducción (Fase 2)
- Dispositivo del bar: Spotify Connect activo en cuenta Premium.
- Estrategia A (preferida): usar `Add to Queue` (`POST /v1/me/player/queue?uri=...`) para inyectar canciones en la cola del dispositivo.
- Estrategia B (fallback): mantener cola propia y, al terminar pista o al pulsar next, emitir `Start/Next` (`PUT /v1/me/player/play`) con `uris` puntual para forzar reproducción; requiere sincronización fina.
- Lectura de estado: `GET /v1/me/player` para saber pista actual, progreso y dispositivo.
- Manejo de fin de pista: webhook propio con polling periódico (p. ej., cada 3-5s) para detectar cambio de pista y encolar la siguiente si es necesario.

## Continuidad con playlist base
- Si la cola de gramola está vacía, no se interviene y la playlist base continúa.
- Si entra una canción de gramola, se encola con `Add to Queue`; Spotify reproducirá en orden de llegada.

## Limitaciones y consideraciones
- Requiere cuenta Premium activa del bar y un dispositivo disponible.
- Algunas pistas pueden no estar disponibles por región/dispositivo.
- Rate limits: aplicar cache y backoff; agrupar operaciones.
- Privacidad: los tokens del bar nunca se exponen al cliente.

## Pruebas
- Modo demo con previews de 30s cuando no haya dispositivo activo.
- Testear: encolar múltiples canciones desde clientes y validar orden; desconexiones de dispositivo; expiración de token.

## Roadmap de integración
1) (Hecho planificación) Elegir Spotify y flujos por fases.
2) Implementar búsqueda proxy en backend (Client Credentials).
3) Implementar cola: API add/list (y remove en sprint 2).
4) Preparar OAuth para Playback Premium y control del dispositivo (Fase 2).
5) UI para cola/estado en tiempo real (SSE) más adelante.