# No funcionales y KPIs

## No funcionales
- Disponibilidad objetivo (MVP local): 99%.
- Latencia p95 búsqueda: <1.5s con cache.
- Consistencia de la cola: eventual, con reconciliación al detectar cambio de pista.
- Seguridad: secretos en backend; HTTPS en despliegues.
- Observabilidad: logs estructurados y métricas básicas.

## KPIs
- Canciones encoladas/día por sala.
- Tasa de conversión búsqueda->encolado.
- Tiempo medio de espera hasta reproducción.
- Ingresos simulados/día.

## Criterios de éxito MVP
- Cliente puede encolar y su canción suena en orden correcto.
- El bar puede moderar sin errores y la playlist base continúa cuando cola está vacía.
- Manejo correcto de desconexiones/tokens y límites de API.