# Requisitos y Alcance del MVP

## Visión
Gramola virtual para locales: los clientes encolan canciones de Spotify mediante pago (simulado) para que suenen en el dispositivo del bar.

## Alcance del MVP
- Sesión de bar ("sala") con código QR/código corto para que clientes se unan.
- Búsqueda de canciones/álbumes/listas vía API de Spotify.
- Encolado de canciones con pago simulado (monedas virtuales), precio configurable.
- Cola con orden básico FIFO y reglas de moderación del bar.
- Reproducción en el dispositivo del bar vía Spotify Connect; fallback a preview de 30s cuando aplique.
- Límites por usuario: máx. X canciones pendientes, cooldown Y minutos entre aportes, bloqueo por abuso.
- Panel del bar: pausar/continuar, saltar, reordenar, expulsar canciones.
- Historial de reproducción.

## Supuestos y restricciones
- El bar dispone de cuenta Spotify Premium y un dispositivo activo para reproducir (oficial, conforme a Términos de Spotify).
- No se almacena ni distribuye audio; sólo se controla reproducción o se usan previews.
- API rate limits de Spotify aplican; cachearemos resultados de búsqueda.
- Pagos reales fuera de alcance en MVP: simularemos con saldo virtual/monedas.

## Requisitos funcionales (resumen)
1. Crear/gestionar sala del bar (login del bar, configuración, precio por canción).
2. Unirse a sala (cliente) y autenticación ligera (alias o OAuth opcional).
3. Buscar y visualizar resultados (título, artista, duración, portada).
4. Añadir a la cola tras confirmar "pago" simulado.
5. Gestionar cola (reordenar, eliminar, limitar por usuario, anti-spam).
6. Control de reproducción en dispositivo del bar (play/pause/next, volumen opcional).
7. Historial y métricas básicas (nº canciones, ingresos simulados, top artistas).

## Requisitos no funcionales
- Disponibilidad del servicio >= 99% (MVP orientativo).
- Latencia de búsqueda < 1.5s p95 (con cache).
- Seguridad: no exponer tokens del bar a clientes; usar backend como proxy.
- Privacidad: mínimos datos personales; logs con seudonimización.

## Criterios de aceptación (MVP)
- Un cliente une sala, busca, paga simulado y ve su canción sonar en el bar.
- El bar puede pausar/saltar y moderar la cola sin errores visibles.
- Si no hay dispositivo controlable, el sistema ofrece preview de 30s (modo demo).

## KPIs
- Canciones encoladas/día por sala.
- Tasa de abandono de búsqueda.
- Tiempo medio en cola hasta reproducción.
- Ingresos simulados/día.