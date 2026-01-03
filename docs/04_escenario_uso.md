# Escenario de Uso (estado actual)

1) Preparación

- El bar abre la aplicación web y hace login.
- En Ajustes (`/settings`) configura:
  - `spotifyPlaylistUri` (playlist base para cuando no hay cola)
  - opcionalmente `barName`

2) Conexión con Spotify

- Se inicia OAuth (`GET /spotify/login`) y Spotify redirige al callback.
- El backend guarda tokens en la tabla `spotify_tokens`.

3) Reproducción real

- El frontend levanta el Spotify Web Playback SDK y crea el dispositivo “Gramola Player”.
- Se transfiere la reproducción a ese dispositivo (`PUT /spotify/transfer`).

4) Búsqueda y encolado

- Buscar una canción (`GET /music/search?q=...`).
- Encolarla (`POST /queue`).
  - Se descuenta un coste en monedas (1–3 según popularidad).
  - Si no hay saldo, el backend devuelve 402 “Saldo insuficiente”.

5) Continuidad

- Si la cola se queda vacía:
  - La app mantiene la música base o reproduce la playlist base configurada.

## Consideraciones técnicas

- HTTPS local es necesario para OAuth y para evitar mixed-content.
- La cola y el estado de reproducción se gestionan desde el frontend, con control por endpoints del backend hacia Spotify.