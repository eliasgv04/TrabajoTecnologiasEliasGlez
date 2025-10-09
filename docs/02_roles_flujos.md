# Actores, Casos de Uso y Flujos

## Actores
- Bar/Administrador: crea sala, configura precio/reglas, controla reproducción y modera cola.
- Cliente: se une a sala, busca canciones y encola pagando (simulado).
- Spotify API/Connect: catálogo, control de reproducción en dispositivo del bar.

## Casos de uso
1. Crear sala del bar
   - Bar inicia sesión y crea una sala con nombre, precio por canción y reglas (límites y cooldown).
   - Se genera código QR/código alfanumérico para clientes.
2. Unirse a la sala (cliente)
   - Cliente escanea QR o introduce código; elige alias.
3. Buscar canciones
   - Cliente busca por tema/artista/álbum; se muestran resultados con portada/duración.
4. Pagar y encolar
   - Cliente confirma costo (monedas virtuales) y añade canción a la cola (estado: pendiente).
5. Moderar/gestionar cola (bar)
   - Ver cola, reordenar, eliminar, bloquear usuario si rompe reglas.
6. Reproducción
   - Backend controla el dispositivo del bar vía Spotify Connect (play/pause/next); si no hay dispositivo, se ofrece preview de 30s como demo.
7. Cierre de sala
   - Bar cierra sala; la cola se archiva y se conserva historial.

## Flujo principal (resumen secuencial)
1) Bar crea sala y autentica con Spotify (OAuth, scopes: user-modify-playback-state, user-read-playback-state, streaming opcional).
2) Clientes se unen a la sala.
3) Cliente busca y selecciona canción.
4) Sistema verifica reglas (límite por usuario, cooldown, cola llena) y confirma pago simulado.
5) Canción entra a la cola. Si no hay nada reproduciendo, inicia reproducción inmediata en el dispositivo del bar; si no, queda en espera.
6) Al finalizar o al pulsar "siguiente", pasa la siguiente de la cola; se registra en historial.

## Estados de una entrada de cola
- pending -> playing -> played
- rejected (por moderación o fallo)

## Reglas de negocio (propuestas)
- Precio por canción configurable (p.ej., 1 moneda).
- Cooldown por usuario (p.ej., 3 min) y máximo 2 canciones pendientes por usuario.
- Longitud máxima de cola (p.ej., 50).
- Opción de "propina" para subir posición limitada (no MVP si complica).

## Errores y edge cases
- Sin dispositivo activo: ofrecer modo preview/diferir hasta que haya dispositivo.
- Token Spotify expirado: refrescar automáticamente, nunca exponer al cliente.
- Rate limit Spotify: backoff y cache resultados.
- Canción no disponible en región/dispositivo: notificar y permitir reemplazo.