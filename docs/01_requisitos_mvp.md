# Requisitos y Alcance (estado actual)

## Visión
Gramola virtual para locales: el bar busca canciones en Spotify, las encola y controla la reproducción en su dispositivo mediante Spotify Connect.

## Alcance implementado

- Cuenta de bar (usuario) con:
	- Registro + verificación por email
	- Login (acepta “correo o nombre del bar”)
	- Recuperación de contraseña (por token)
- Búsqueda de canciones en Spotify: `GET /music/search?q=...`
- Encolado de canciones:
	- `POST /queue` crea un `QueueItem`
	- Se descuenta “monedas” del usuario
	- Precio dinámico por popularidad (1–3 monedas)
- Reproducción real con Spotify:
	- Spotify OAuth (Authorization Code) desde backend
	- Spotify Web Playback SDK en el frontend (dispositivo “Gramola Player”)
	- Control por endpoints backend (`/spotify/transfer`, `/spotify/play`, `/spotify/pause`, `/spotify/seek`)
- Continuidad:
	- Si la cola queda vacía, suena una playlist base configurada en ajustes (`spotifyPlaylistUri`) o se mantiene el audio base.



## Supuestos y restricciones

- Para control de reproducción real, la cuenta del bar debe ser Spotify Premium y tener un dispositivo disponible.
- No se almacena ni distribuye audio: sólo control de reproducción y metadatos.
- En desarrollo se trabaja sobre HTTPS local para compatibilidad con OAuth.

## Criterios de aceptación (práctica)

- El bar puede: registrarse/verificar cuenta, iniciar sesión, conectar Spotify y reproducir canciones reales desde la cola.
- El bar puede: buscar una canción, encolarla (descontando monedas) y controlar play/pausa/seek.