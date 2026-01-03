# Integración con Spotify (implementada)

Este documento describe cómo está integrada Spotify en el proyecto a día de hoy.

## Autenticación

Se usa Authorization Code Flow.

- Inicio OAuth: `GET /spotify/login`
- Callback: `GET /spotify/callback`

Decisiones clave:

- El parámetro `state` es stateless y va firmado (HMAC) con `spotify.stateSecret`.
- Los tokens del usuario se persisten en MySQL (tabla `spotify_tokens`).
- El backend refresca automáticamente el access token usando refresh token.

Redirect URI (dev):

- `https://127.0.0.1:8000/spotify/callback`

## Scopes

- `user-read-playback-state`
- `user-modify-playback-state`
- `streaming`

## Búsqueda y lectura de contenido

- Buscar tracks: `GET /music/search?q=...`
- Obtener un track: `GET /music/tracks/{id}`
- Obtener tracks de una playlist: `GET /music/playlist?uri=...`
  - Si el usuario tiene OAuth activo, se usa su token (más robusto para algunas playlists).

## Reproducción real (Spotify Web Playback SDK)

La reproducción se hace con el Web Playback SDK en el frontend, que crea un dispositivo Spotify (device_id). El backend controla Spotify Web API para transferir y manejar play/pausa/seek.

Endpoints de control:

- `GET /spotify/token` (devuelve `accessToken` para inicializar el SDK)
- `PUT /spotify/transfer` body: `{ deviceId: string, play: boolean }`
- `POST /spotify/play` body: `{ deviceId?: string, uris?: string[], position_ms?: number, context_uri?: string, offset?: ... }`
- `PUT /spotify/pause` body opcional: `{ deviceId?: string }`
- `PUT /spotify/seek` body: `{ positionMs: number, deviceId?: string }`

## Playlist base (fallback)

- El usuario puede configurar una playlist base en `GET/PUT /settings` (`spotifyPlaylistUri`).
- Cuando la cola está vacía, la app reproduce (o continúa) esa playlist base.

## Limitaciones

- Requiere Spotify Premium y un dispositivo disponible.
- En desarrollo, los certificados HTTPS son de tipo “dev” y puede ser necesario aceptarlos en el navegador.