# Escenario de Uso Detallado

1. Apertura del bar y reproducción base
   - El personal del bar abre el local y pone una playlist de fondo en su cuenta de Spotify (p. ej., la de la Figura 2).
   - Esa playlist suena en el dispositivo del bar (Spotify Premium) como música ambiente.

2. Acceso a la gramola
   - En otro dispositivo (tablet/PC para clientes), el personal inicia sesión en la aplicación gramola (usuario/contraseña del bar ya registrado en el backend).
   - La interfaz muestra la sala activa, el estado actual de reproducción y la cola de la gramola.

3. Interacción de los clientes
   - Un cliente busca una canción con la API de Spotify desde la gramola.
   - El cliente paga un importe (simulado o con pasarela) y la canción entra en la cola prioritaria de la gramola.
   - Las canciones de la gramola se intercalan "por delante" de la playlist base: al acabar la canción actual, se reproduce la primera de la cola de gramola; cuando la cola quede vacía, continúa la playlist base.

4. Ejemplo secuencial
   - Está sonando "Una noche sin ti" (playlist base).
   - Cliente A encola "Whole Lotta Love" (Led Zeppelin).
   - Cliente B encola "Creep" (Radiohead) mientras sigue sonando "Una noche sin ti".
   - Orden resultante: termina "Una noche sin ti" -> suena "Whole Lotta Love" -> luego "Creep" -> después vuelve a la playlist base ("Mucho mejor").

5. Requisitos para el bar
   - El bar debe estar registrado en el backend para acceder a la gramola.
   - El bar autoriza a la gramola a controlar su dispositivo vía OAuth de Spotify (scopes: user-modify-playback-state, user-read-playback-state).

## Consideraciones técnicas
- Estrategia de cola: se usa "Add to Queue" de Spotify para insertar las canciones en la cola del dispositivo; si Spotify no garantiza orden o hay latencias, el backend puede forzar siguiente pista con "Next" y gestionar la cola propia.
- Continuidad con playlist base: cuando la cola de gramola está vacía, se permite que la playlist siga sonando normalmente.
- Resiliencia: si el dispositivo cambia o se pausa, el backend detecta el estado y reintenta según políticas.