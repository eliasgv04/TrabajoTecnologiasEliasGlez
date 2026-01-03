# No funcionales y KPIs

## No funcionales

- Disponibilidad (entorno local): orientativa.
- Latencia de búsqueda: depende de Spotify; el backend actúa como proxy.
- Seguridad:
	- secretos y refresh tokens sólo en backend (persistidos en MySQL)
	- HTTPS habilitado en local (requisito práctico para OAuth)
- Observabilidad: logs del backend a nivel INFO/WARN.

## KPIs

- Canciones encoladas por sesión (manual, evidencias en plan de pruebas).
- % de búsquedas que acaban en encolado.

## Criterios de éxito MVP
- Cliente puede encolar y su canción suena en orden correcto.
- El bar puede moderar sin errores y la playlist base continúa cuando cola está vacía.
- Manejo correcto de desconexiones/tokens y límites de API.